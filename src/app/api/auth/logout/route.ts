import { authenticatedFetch, clearAuthSession, isSameOrigin } from "@/lib/api/auth-server";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: { code: "unexpected" } }, { status: 403, headers: { "Cache-Control": "no-store" } });
  try {
    await authenticatedFetch("/auth/logout", { method: "POST" });
  } catch {
    // Local sign-out must still work when the backend or session is unavailable.
  } finally { await clearAuthSession(); }
  return Response.json({ signedOut: true }, { headers: { "Cache-Control": "no-store" } });
}
