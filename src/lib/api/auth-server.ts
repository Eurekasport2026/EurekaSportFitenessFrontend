import "server-only";

import { cookies } from "next/headers";
import type { AuthSession, AuthUser } from "./auth";
import { backendCookieHeader, clearBackendCookies, preserveBackendCookies } from "./auth-cookies";

const sessionCookie = "eureka_access_token";
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
export const authApiBase = (process.env.EUREKA_AUTH_API_URL || "https://api-production-c166.up.railway.app/api/v1").replace(/\/+$/, "");

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return request.headers.get("sec-fetch-site") !== "cross-site" && (!origin || origin === new URL(request.url).origin);
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function parseUser(value: unknown): AuthUser | null {
  const user = record(value);
  if (!user || typeof user.id !== "string" || !user.id || typeof user.name !== "string" ||
      typeof user.email !== "string" || (user.locale !== "it" && user.locale !== "en") ||
      user.status !== "active" || typeof user.role !== "string") return null;
  // Allowlist fields; never expose the token or unrecognized backend properties.
  return { id: user.id, name: user.name, email: user.email, locale: user.locale, status: user.status, role: user.role };
}

function tokenClaims(token: unknown): { subject: string; expiresAt: number } | null {
  if (typeof token !== "string" || token.length > 3500 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return null;
  try {
    const claims = record(JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")));
    if (!claims || typeof claims.sub !== "string" || !claims.sub || typeof claims.exp !== "number" ||
        !Number.isSafeInteger(claims.exp) || !Number.isSafeInteger(claims.exp * 1000) ||
        claims.exp * 1000 > 8640000000000000 || claims.exp * 1000 <= Date.now() ||
        (claims.typ !== undefined && claims.typ !== "access")) return null;
    // Decoding only bounds expiry. Backend /auth/me and protected endpoints verify the signature.
    return { subject: claims.sub, expiresAt: claims.exp * 1000 };
  } catch { return null; }
}

function parseAccessToken(payload: unknown, expectedSubject?: string): { token: string; subject: string; expiresAt: number } | null {
  const envelope = record(payload);
  const data = record(envelope?.data);
  const claims = tokenClaims(data?.access_token);
  if (envelope?.success !== true || !data || !claims || (expectedSubject && claims.subject !== expectedSubject) ||
      data.token_type !== "bearer" || typeof data.expires_in !== "number" ||
      !Number.isSafeInteger(data.expires_in) || data.expires_in <= 0) return null;
  const expiresAt = Math.min(claims.expiresAt, Date.now() + data.expires_in * 1000);
  return { token: data.access_token as string, subject: claims.subject, expiresAt };
}

async function saveAccessToken(token: string, expiresAt: number): Promise<void> {
  const maxAge = Math.floor((expiresAt - Date.now()) / 1000);
  if (maxAge <= 0) throw new SessionUnauthorized();
  (await cookies()).set(sessionCookie, token, { ...cookieOptions, expires: new Date(expiresAt), maxAge });
}

async function sessionMetadata(user: AuthUser, expiresAt: number): Promise<AuthSession> {
  return { user, expiresAt, canRefresh: Boolean(await backendCookieHeader(`${authApiBase}/auth/refresh`)) };
}

export async function createAuthSession(payload: unknown, response: Response): Promise<AuthSession | null> {
  const user = parseUser(record(record(payload)?.data)?.user);
  const access = parseAccessToken(payload, user?.id);
  if (!user || !access) return null;
  // A new sign-in must not inherit another account's refresh credentials.
  await clearBackendCookies();
  await preserveBackendCookies(response, response.url || `${authApiBase}/auth/login`);
  await saveAccessToken(access.token, access.expiresAt);
  return sessionMetadata(user, access.expiresAt);
}

export async function clearAuthSession(): Promise<void> {
  (await cookies()).set(sessionCookie, "", { ...cookieOptions, maxAge: 0, expires: new Date(0) });
  await clearBackendCookies();
}

export class SessionUnauthorized extends Error {
  constructor() { super("Session expired or unavailable"); }
}

/** Server-only helper for authenticated requests to the configured Eureka auth backend. */
export async function authenticatedFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const path = endpoint.replace(/^\/+/, "");
  if (!/^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(path)) throw new Error("Invalid backend path");
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token || !tokenClaims(token)) throw new SessionUnauthorized();
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${token}`);
  const backendCookies = await backendCookieHeader(`${authApiBase}/${path}`);
  if (backendCookies) headers.set("Cookie", backendCookies);
  else headers.delete("Cookie");
  return fetch(`${authApiBase}/${path}`, {
    ...options, headers, cache: "no-store", redirect: "error",
    signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
  });
}

export async function readAuthSession(): Promise<AuthSession | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const claims = tokenClaims(token);
  if (!claims) return null;
  const response = await authenticatedFetch("/auth/me");
  const user = await verifiedUser(response, claims.subject);
  if (!user || claims.expiresAt <= Date.now()) return null;
  return sessionMetadata(user, claims.expiresAt);
}

async function verifiedUser(response: Response, subject: string): Promise<AuthUser | null> {
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error("Session verification unavailable");
  const envelope = record(await response.json());
  const data = record(envelope?.data);
  // /auth/me's schema is generic. Support a wrapped user or a direct user in data.
  const user = parseUser(data?.user ?? data);
  if (envelope?.success !== true || !user || user.id !== subject) throw new Error("Unexpected session response");
  return user;
}

export class RefreshFailure extends Error {
  constructor(public code: "rateLimit" | "unavailable" | "unexpected", public status: number) { super(code); }
}

export async function refreshAuthSession(signal: AbortSignal): Promise<AuthSession> {
  const url = `${authApiBase}/auth/refresh`;
  const credential = await backendCookieHeader(url);
  // No speculative Bearer/body authentication or unauthenticated upstream refresh calls.
  if (!credential) throw new SessionUnauthorized();
  const previous = tokenClaims((await cookies()).get(sessionCookie)?.value);
  const response = await fetch(url, {
    method: "POST", headers: { Accept: "*/*", Cookie: credential }, body: "",
    cache: "no-store", redirect: "error", signal,
  });
  if (response.status === 401 || response.status === 403) throw new SessionUnauthorized();
  if (response.status === 429) throw new RefreshFailure("rateLimit", 429);
  if (response.status !== 200) throw new RefreshFailure(response.status >= 500 ? "unavailable" : "unexpected", 502);
  // Refresh omits user data. Validate the token-only envelope, then verify identity with the backend.
  const access = parseAccessToken(await response.json().catch(() => null), previous?.subject);
  if (!access) throw new RefreshFailure("unexpected", 502);
  const me = await fetch(`${authApiBase}/auth/me`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${access.token}` },
    cache: "no-store", redirect: "error", signal,
  });
  const user = await verifiedUser(me, access.subject);
  if (!user) throw new SessionUnauthorized();
  if (access.expiresAt <= Date.now()) throw new SessionUnauthorized();
  signal.throwIfAborted();
  await preserveBackendCookies(response, url);
  await saveAccessToken(access.token, access.expiresAt);
  return sessionMetadata(user, access.expiresAt);
}
