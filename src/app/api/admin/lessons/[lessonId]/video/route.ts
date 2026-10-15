import { withApiTiming } from "@/lib/api/backend-timing";
import { isSameOrigin } from "@/lib/api/auth-server";
import {
  assignAdminLessonVideo,
  removeAdminLessonVideo,
  validateEntityId,
  validateVideoId,
} from "@/lib/api/admin-curriculum-server";

async function handlePUT(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  if (!isSameOrigin(request)) {
    return Response.json(
      { success: false, error: "Invalid origin" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { lessonId } = await params;
  if (!validateEntityId(lessonId)) {
    return Response.json(
      { success: false, error: "Validation error: invalid lesson ID format" },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json(
      { success: false, error: "Payload must be an object" },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  const payload = body as { video_id?: unknown };
  if (!validateVideoId(payload.video_id)) {
    return Response.json(
      { success: false, error: "Validation error: video_id must be between 3 and 32 characters" },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  const result = await assignAdminLessonVideo(lessonId, payload.video_id);
  if (result.success) {
    return Response.json(
      { success: true, data: result.data },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(
    { success: false, error: result.error },
    { status: result.status, headers: { "Cache-Control": "no-store" } },
  );
}

async function handleDELETE(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  if (!isSameOrigin(request)) {
    return Response.json(
      { success: false, error: "Invalid origin" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { lessonId } = await params;
  if (!validateEntityId(lessonId)) {
    return Response.json(
      { success: false, error: "Validation error: invalid lesson ID format" },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  const result = await removeAdminLessonVideo(lessonId);
  if (result.success) {
    return Response.json(
      { success: true, data: result.data },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(
    { success: false, error: result.error },
    { status: result.status, headers: { "Cache-Control": "no-store" } },
  );
}

export const PUT = withApiTiming(handlePUT);
export const DELETE = withApiTiming(handleDELETE);
