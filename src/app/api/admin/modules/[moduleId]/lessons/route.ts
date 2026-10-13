import { isSameOrigin } from "@/lib/api/auth-server";
import { createAdminLesson, validateEntityId } from "@/lib/api/admin-curriculum-server";
import type { LessonCreateInput } from "@/lib/api/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ moduleId: string }> },
) {
  if (!isSameOrigin(request)) {
    return Response.json(
      { success: false, error: "Invalid origin" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { moduleId } = await params;
  if (!validateEntityId(moduleId)) {
    return Response.json(
      { success: false, error: "Validation error: invalid module ID format" },
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

  const payload = body as Partial<LessonCreateInput>;
  if (typeof payload.order !== "number" || payload.order < 1) {
    return Response.json(
      { success: false, error: "Validation error: lesson order must be a positive integer" },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!payload.title || typeof payload.title !== "object" || !payload.title.it) {
    return Response.json(
      { success: false, error: "Validation error: lesson title with Italian text is required" },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  const result = await createAdminLesson(moduleId, payload as LessonCreateInput);
  if (result.success) {
    return Response.json(
      { success: true, data: result.data },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(
    { success: false, error: result.error },
    { status: result.status, headers: { "Cache-Control": "no-store" } },
  );
}
