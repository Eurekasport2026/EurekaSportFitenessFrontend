import { isSameOrigin, refreshAuthSession, RefreshFailure, SessionUnauthorized } from "@/lib/api/auth-server";

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  if (!isSameOrigin(request)) return Response.json({ error: { code: "unexpected" } }, { status: 403, headers });
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(15000)]);
  try {
    const session = await refreshAuthSession(signal);
    return Response.json({ session }, { headers });
  } catch (error) {
    if (error instanceof SessionUnauthorized) return Response.json({ session: null }, { status: 401, headers });
    if (error instanceof RefreshFailure) return Response.json({ error: { code: error.code } }, { status: error.status, headers });
    // Failed refresh never overwrites or deletes a newer sign-in's cookies.
    return Response.json({ error: { code: "unavailable" } }, { status: signal.aborted ? 504 : 503, headers });
  }
}
