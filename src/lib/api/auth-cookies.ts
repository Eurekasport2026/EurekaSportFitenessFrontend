import "server-only";

import { cookies } from "next/headers";

const cookieName = "eureka_backend_auth";
const options = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/api/auth" };
interface BackendCookie { name: string; value: string; path: string; expiresAt: number | null }

function validCookie(cookie: BackendCookie): boolean {
  return /^[A-Za-z0-9_.-]{1,120}$/.test(cookie.name) &&
    /^[\x21\x23-\x2B\x2D-\x3A\x3C-\x5B\x5D-\x7E]+$/.test(cookie.value) &&
    typeof cookie.path === "string" && cookie.path.startsWith("/") &&
    (cookie.expiresAt === null || (Number.isFinite(cookie.expiresAt) && cookie.expiresAt > Date.now() && cookie.expiresAt <= 8640000000000000));
}

async function readCookies(origin: string): Promise<BackendCookie[]> {
  const stored = (await cookies()).get(cookieName)?.value;
  if (!stored || stored.length > 3500) return [];
  try {
    const jar = JSON.parse(Buffer.from(stored, "base64url").toString("utf8"));
    if (!jar || jar.origin !== origin || !Array.isArray(jar.cookies) || jar.cookies.length > 16) return [];
    return jar.cookies.filter((cookie: BackendCookie) => cookie && typeof cookie.name === "string" && typeof cookie.value === "string" && validCookie(cookie));
  } catch { return []; }
}

/** Return only cookies scoped to the fixed backend URL, never frontend cookies. */
export async function backendCookieHeader(backendUrl: string): Promise<string> {
  const url = new URL(backendUrl);
  const jar = await readCookies(url.origin);
  return jar.filter(cookie => url.pathname === cookie.path ||
    (url.pathname.startsWith(cookie.path) && (cookie.path.endsWith("/") || url.pathname[cookie.path.length] === "/")))
    .sort((a, b) => b.path.length - a.path.length)
    .map(cookie => `${cookie.name}=${cookie.value}`).join("; ");
}

/** Preserve backend-issued HttpOnly credentials; names/lifetimes come from Set-Cookie. */
export async function preserveBackendCookies(response: Response, backendUrl: string): Promise<void> {
  const headers = response.headers.getSetCookie();
  if (!headers.length) return;
  const url = new URL(backendUrl);
  let jar = await readCookies(url.origin);
  for (const header of headers) {
    const [pair, ...attributes] = header.split(";");
    const separator = pair.indexOf("=");
    if (separator < 1) continue;
    const name = pair.slice(0, separator).trim();
    let value = pair.slice(separator + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    const attrs = new Map(attributes.map((attribute): [string, string] => {
      const split = attribute.indexOf("=");
      return split < 0 ? [attribute.trim().toLowerCase(), ""] : [attribute.slice(0, split).trim().toLowerCase(), attribute.slice(split + 1).trim()];
    }));
    if (!attrs.has("httponly")) continue;
    const domain = attrs.get("domain")?.replace(/^\./, "").toLowerCase();
    if (domain && url.hostname !== domain && !url.hostname.endsWith(`.${domain}`)) continue;
    const path = attrs.get("path")?.startsWith("/") ? attrs.get("path")! : url.pathname.slice(0, url.pathname.lastIndexOf("/")) || "/";
    let expiresAt: number | null = null;
    const maxAge = attrs.get("max-age");
    if (maxAge !== undefined && /^-?\d+$/.test(maxAge)) {
      const seconds = Number(maxAge);
      if (!Number.isSafeInteger(seconds)) continue;
      expiresAt = Date.now() + seconds * 1000;
    } else if (attrs.has("expires")) {
      expiresAt = Date.parse(attrs.get("expires")!);
      if (!Number.isFinite(expiresAt)) continue;
    }
    const cookie = { name, value, path, expiresAt };
    if (!/^[A-Za-z0-9_.-]{1,120}$/.test(name)) continue;
    // Respect expiry/deletion, including refresh-cookie rotation.
    if (!value || (expiresAt !== null && expiresAt <= Date.now())) {
      jar = jar.filter(existing => existing.name !== name || existing.path !== path);
    } else if (validCookie(cookie)) {
      jar = jar.filter(existing => existing.name !== name || existing.path !== path);
      jar.push(cookie);
    }
  }
  if (!jar.length) { await clearBackendCookies(); return; }
  const encoded = Buffer.from(JSON.stringify({ origin: url.origin, cookies: jar })).toString("base64url");
  if (jar.length > 16 || encoded.length > 3500) throw new Error("Backend cookie storage exceeds limits");
  const persistent = jar.every(cookie => cookie.expiresAt !== null);
  const expiresAt = persistent ? Math.max(...jar.map(cookie => cookie.expiresAt!)) : null;
  (await cookies()).set(cookieName, encoded, {
    ...options,
    ...(expiresAt ? { expires: new Date(expiresAt), maxAge: Math.max(1, Math.floor((expiresAt - Date.now()) / 1000)) } : {}),
  });
}

export async function clearBackendCookies(): Promise<void> {
  (await cookies()).set(cookieName, "", { ...options, maxAge: 0, expires: new Date(0) });
}
