import { validateLogin, type LoginErrorCode, type LoginField, type LoginRequest } from "@/lib/api/auth";
import { authApiBase, createAuthSession, isSameOrigin } from "@/lib/api/auth-server";

function failure(status: number, code: LoginErrorCode, fields: LoginField[] = []) {
  return Response.json({ error: { code, fields } }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return failure(403, "unexpected");
  let body: unknown;
  try { body = await request.json(); } catch { return failure(400, "validation"); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return failure(422, "validation");
  const values = body as Record<string, unknown>;
  const fields: LoginField[] = ["email", "password"];
  const missing = fields.filter(field => typeof values[field] !== "string");
  if (missing.length) return failure(422, "validation", missing);
  if (Object.keys(values).some(key => !fields.includes(key as LoginField))) return failure(422, "validation");
  const input: LoginRequest = { email: (values.email as string).trim(), password: values.password as string };
  const invalid = validateLogin(input);
  if (invalid.length) return failure(422, "validation", invalid);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${authApiBase}/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(input), cache: "no-store", signal: controller.signal, redirect: "error",
    });
    if (response.status === 200) {
      const session = await createAuthSession(await response.json().catch(() => null), response);
      if (!session) return failure(502, "unexpected");
      return Response.json({ accepted: true, session }, { status: 200, headers: { "Cache-Control": "no-store" } });
    }
    if (response.status === 401 || response.status === 403) return failure(response.status, "credentials");
    if (response.status === 429) return failure(429, "rateLimit");
    if (response.status === 422) {
      const payload: unknown = await response.json().catch(() => null);
      const detail = payload && typeof payload === "object" && "detail" in payload ? payload.detail : null;
      const invalidFields: LoginField[] = [];
      if (Array.isArray(detail)) {
        for (const issue of detail) {
          if (!issue || typeof issue !== "object" || !Array.isArray(issue.loc)) continue;
          const field = fields.find(candidate => issue.loc.includes(candidate));
          if (field && !invalidFields.includes(field)) invalidFields.push(field);
        }
      }
      return failure(422, "validation", invalidFields);
    }
    return failure(response.status >= 500 ? 502 : 400, response.status >= 500 ? "unavailable" : "unexpected");
  } catch {
    return failure(controller.signal.aborted ? 504 : 502, "unavailable");
  } finally { clearTimeout(timeout); }
}
