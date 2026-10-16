import { requestCourseApi } from "@/lib/api/course-api-server";
import { withApiTiming } from "@/lib/api/backend-timing";

/** Read-only public catalog proxy. requestCourseApi owns the closed path allowlist. */
async function handleGET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const headers = { "Cache-Control": "no-store" };
  const source = new URL(request.url);
  const locale = source.searchParams.get("locale") ?? "it";
  if (locale !== "it" && locale !== "en") return Response.json({ success: false }, { status: 400, headers });
  const q = source.searchParams.get("q");
  if (q !== null && q.length > 160) return Response.json({ success: false }, { status: 400, headers });
  const result = await requestCourseApi((await context.params).path.join("/"), locale, { q: q ?? undefined });
  if (result.status !== "ready") return Response.json({ success: false }, { status: result.status === "not_found" ? 404 : 502, headers });
  const payload = result.payload;
  if (!payload || typeof payload !== "object" || !("success" in payload) || payload.success !== true || !("data" in payload)) {
    return Response.json({ success: false }, { status: 502, headers });
  }
  return Response.json({ success: true, data: payload.data }, { headers });
}

export const GET = withApiTiming(handleGET);
