import { readAuthSession, SessionUnauthorized } from "@/lib/api/auth-server";

export async function GET() {
  try {
    const session = await readAuthSession();
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
    return Response.json({ error: { code: "unavailable" } }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
