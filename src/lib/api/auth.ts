export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  locale: "it" | "en";
}

export type SignupField = "name" | "email" | "password";
export type SignupErrorCode = "validation" | "exists" | "rateLimit" | "unavailable" | "unexpected";
export interface LoginRequest { email: string; password: string }
export type LoginField = "email" | "password";
export type LoginErrorCode = "validation" | "credentials" | "rateLimit" | "unavailable" | "unexpected";
export type AuthErrorCode = SignupErrorCode | LoginErrorCode;
export interface AuthUser { id: string; name: string; email: string; locale: "it" | "en"; status: "active"; role: string }
export interface AuthSession { user: AuthUser; expiresAt: number; canRefresh: boolean }

async function withAuthLock<T>(work: () => Promise<T>, signal: AbortSignal): Promise<T> {
  // Serialize cookie mutations across tabs where Web Locks is available.
  if (typeof navigator !== "undefined" && navigator.locks) {
    return navigator.locks.request("eureka-auth-session", { signal }, work);
  }
  signal.throwIfAborted();
  return work();
}

function parseSession(body: unknown): AuthSession | null {
  if (!body || typeof body !== "object" || !("session" in body)) return null;
  const session = body.session;
  if (!session || typeof session !== "object" || !("user" in session) || !("expiresAt" in session) ||
      typeof session.expiresAt !== "number" || !Number.isFinite(session.expiresAt) || session.expiresAt <= Date.now()) return null;
  const user = session.user;
  if (!user || typeof user !== "object" || !("id" in user) || typeof user.id !== "string" ||
      !("name" in user) || typeof user.name !== "string" || !("email" in user) || typeof user.email !== "string" ||
      !("locale" in user) || (user.locale !== "en" && user.locale !== "it") ||
      !("status" in user) || user.status !== "active" || !("role" in user) || typeof user.role !== "string") return null;
  return { user: { id: user.id, name: user.name, email: user.email, locale: user.locale, status: user.status, role: user.role }, expiresAt: session.expiresAt, canRefresh: "canRefresh" in session && session.canRefresh === true };
}

export class AuthError extends Error {
  constructor(public code: AuthErrorCode, public fields: SignupField[] = []) {
    super(code);
    this.name = "AuthError";
  }
}

export function validateLogin(input: LoginRequest): LoginField[] {
  const fields: LoginField[] = [];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) fields.push("email");
  if (input.password.length < 1 || input.password.length > 72) fields.push("password");
  return fields;
}

export function validateSignup(input: SignupRequest): SignupField[] {
  const fields: SignupField[] = [];
  if (!input.name.trim() || input.name.trim().length > 120) fields.push("name");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) fields.push("email");
  if (input.password.length < 8 || input.password.length > 72) fields.push("password");
  return fields;
}

async function submitAuthRequest(mode: "signup" | "login", input: SignupRequest | LoginRequest, signal: AbortSignal): Promise<AuthSession> {
  let response: Response;
  try {
    response = await fetch(`/api/auth/${mode}`, {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "same-origin", cache: "no-store", body: JSON.stringify(input), signal,
    });
  } catch { throw new AuthError("unavailable"); }
  const body: unknown = await response.json().catch(() => null);
  if (response.status === (mode === "signup" ? 201 : 200)) {
    const session = parseSession(body);
    if (!session) throw new AuthError("unexpected");
    return session;
  }
  const error = body && typeof body === "object" && "error" in body ? body.error : null;
  const code = error && typeof error === "object" && "code" in error ? error.code : null;
  const codes: AuthErrorCode[] = ["validation", "rateLimit", "unavailable", "unexpected", mode === "signup" ? "exists" : "credentials"];
  const fields = error && typeof error === "object" && "fields" in error && Array.isArray(error.fields)
    ? error.fields.filter((field): field is SignupField => field === "email" || field === "password" || (mode === "signup" && field === "name")) : [];
  throw new AuthError(codes.includes(code as AuthErrorCode) ? code as AuthErrorCode : "unexpected", fields);
}

function submitAuth(mode: "signup" | "login", input: SignupRequest | LoginRequest, signal: AbortSignal): Promise<AuthSession> {
  return withAuthLock(() => submitAuthRequest(mode, input, signal), signal);
}

export const authService = {
  async signup(input: SignupRequest, signal: AbortSignal): Promise<AuthSession> {
    const fields = validateSignup(input);
    if (fields.length) throw new AuthError("validation", fields);
    return submitAuth("signup", { name: input.name.trim(), email: input.email.trim(), password: input.password, locale: input.locale }, signal);
  },
  async login(input: LoginRequest, signal: AbortSignal): Promise<AuthSession> {
    const fields = validateLogin(input);
    if (fields.length) throw new AuthError("validation", fields);
    return submitAuth("login", { email: input.email.trim(), password: input.password }, signal);
  },
  async session(signal: AbortSignal): Promise<AuthSession | null> {
    let response: Response;
    try { response = await fetch("/api/auth/session", { credentials: "same-origin", cache: "no-store", signal }); }
    catch { throw new AuthError("unavailable"); }
    if (response.status === 401) return null;
    if (!response.ok) throw new AuthError("unavailable");
    const session = parseSession(await response.json().catch(() => null));
    if (!session) throw new AuthError("unexpected");
    return session;
  },
  async logout(signal: AbortSignal): Promise<void> {
    return withAuthLock(async () => {
      let response: Response;
      try { response = await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin", cache: "no-store", signal }); }
      catch { throw new AuthError("unavailable"); }
      if (!response.ok) throw new AuthError("unexpected");
    }, signal);
  },
  async refresh(signal: AbortSignal): Promise<AuthSession | null> {
    return withAuthLock(async () => {
      // A different tab may have already renewed the shared cookies while this request waited.
      const current = await authService.session(signal);
      if (current && current.expiresAt - Date.now() > 90000) return current;
      let response: Response;
      try { response = await fetch("/api/auth/refresh", { method: "POST", credentials: "same-origin", cache: "no-store", signal }); }
      catch { throw new AuthError("unavailable"); }
      if (response.status === 401 || response.status === 403) return null;
      if (!response.ok) throw new AuthError(response.status === 429 ? "rateLimit" : "unavailable");
      const session = parseSession(await response.json().catch(() => null));
      if (!session) throw new AuthError("unexpected");
      return session;
    }, signal);
  },
};
