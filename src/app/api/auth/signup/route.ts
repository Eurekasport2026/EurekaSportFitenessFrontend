import { validateSignup, type SignupErrorCode, type SignupField, type SignupRequest } from "@/lib/api/auth";
import { authApiBase, createAuthSession, isSameOrigin } from "@/lib/api/auth-server";

function failure(status: number, code: SignupErrorCode, fields: SignupField[] = []) {
  return Response.json({ error: { code, fields } }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return failure(403, "unexpected");
  let body: unknown;
  try { body = await request.json(); } catch { return failure(400, "validation"); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return failure(422, "validation");

  const values = body as Record<string, unknown>;
  const fields: SignupField[] = ["name", "email", "password"];
  const missing = fields.filter(field => typeof values[field] !== "string");
  if (missing.length) return failure(422, "validation", missing);
  if ((values.locale !== undefined && values.locale !== "it" && values.locale !== "en") ||
      Object.keys(values).some(key => !["name", "email", "password", "locale"].includes(key))) {
    return failure(422, "validation");
  }
  const input: SignupRequest = {
    name: (values.name as string).trim(), email: (values.email as string).trim(),
    password: values.password as string, locale: values.locale === "en" ? "en" : "it",
  };
  const invalid = validateSignup(input);
  if (invalid.length) return failure(422, "validation", invalid);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    // Separate from Academy's mock switch: signup always requires a real backend response.
    const response = await fetch(`${authApiBase}/auth/signup`, {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(input), cache: "no-store", signal: controller.signal, redirect: "error",
    });
    if (response.status === 201) {
      const session = await createAuthSession(await response.json().catch(() => null), response);
      if (!session) return failure(502, "unexpected");
      return Response.json({ created: true, session }, { status: 201, headers: { "Cache-Control": "no-store" } });
    }
    if (response.status === 422) {
      const payload: unknown = await response.json().catch(() => null);
      const detail = payload && typeof payload === "object" && "detail" in payload ? payload.detail : null;
      const invalidFields: SignupField[] = [];
      if (Array.isArray(detail)) {
        for (const issue of detail) {
          if (!issue || typeof issue !== "object" || !Array.isArray(issue.loc)) continue;
          const field = fields.find(candidate => issue.loc.includes(candidate));
          if (field && !invalidFields.includes(field)) invalidFields.push(field);
        }
      }
      // Never relay FastAPI input/ctx values, which may contain credentials.
      return failure(422, "validation", invalidFields);
    }
    if (response.status === 409) return failure(409, "exists", ["email"]);
    if (response.status === 429) return failure(429, "rateLimit");
    return failure(response.status >= 500 ? 502 : 400, response.status >= 500 ? "unavailable" : "unexpected");
  } catch {
    return failure(controller.signal.aborted ? 504 : 502, "unavailable");
  } finally { clearTimeout(timeout); }
}
