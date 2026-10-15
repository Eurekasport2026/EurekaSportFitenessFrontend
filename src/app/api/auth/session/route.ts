import { BackendTimeout, withApiTiming } from "@/lib/api/backend-timing";
import { readAuthSession, SessionUnauthorized } from "@/lib/api/auth-server";

async function handleGET(request: Request) {
  try {
    const session = await readAuthSession(request.signal);
    if (!session) {
      // Keep GET read-only: an older verification response must not erase a newer sign-in cookie.
      return Response.json({ session: null }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    return Response.json({ session }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof SessionUnauthorized) {
      return Response.json({ session: null }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    // Preserve the cookie on transient backend failures, but do not grant access.
    return Response.json({ error: { code: "unavailable" } }, { status: error instanceof BackendTimeout ? 504 : 503, headers: { "Cache-Control": "no-store" } });
  }
}

export const GET = withApiTiming(handleGET);
