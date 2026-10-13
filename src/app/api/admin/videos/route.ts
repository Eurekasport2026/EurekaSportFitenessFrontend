import { isSameOrigin } from "@/lib/api/auth-server";
import { createAdminVideo, fetchAdminVideos, validateAdminVideoId } from "@/lib/api/admin-videos-server";
import type { VideoCreateInput, VideoStatus } from "@/lib/api/types";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") || "it";
  const status = url.searchParams.get("status") as VideoStatus | null;
  const q = url.searchParams.get("q");

  const result = await fetchAdminVideos({ locale, status, q });
  if (result.status === "ready") {
    return Response.json({ success: true, data: result.data }, { headers: { "Cache-Control": "no-store" } });
  }

  if (result.status === "unauthenticated") {
    return Response.json(
      { success: false, code: "UNAUTHENTICATED", error: "Authentication required" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (result.status === "forbidden") {
    return Response.json(
      { success: false, code: "FORBIDDEN", error: result.message || "Admin access required" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json({ success: false, error: "Failed to fetch videos" }, { status: 502, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ success: false, error: "Invalid origin" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid JSON body" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ success: false, error: "Payload must be an object" }, { status: 422, headers: { "Cache-Control": "no-store" } });
  }

  const payload = body as Partial<VideoCreateInput>;
  if (!payload.video_id || !validateAdminVideoId(payload.video_id)) {
    return Response.json(
      { success: false, error: "Validation error: video_id must match ^[A-Z0-9][A-Z0-9-]{2,31}$" },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!payload.title_it || typeof payload.title_it !== "string" || !payload.title_it.trim()) {
    return Response.json(
      { success: false, error: "Validation error: title_it is required" },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  const result = await createAdminVideo(payload as VideoCreateInput);
  if (result.success) {
    return Response.json({ success: true, data: result.data }, { status: 201, headers: { "Cache-Control": "no-store" } });
  }

  return Response.json(
    { success: false, error: result.error },
    { status: result.status, headers: { "Cache-Control": "no-store" } },
  );
}
