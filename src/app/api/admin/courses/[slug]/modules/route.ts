import { withApiTiming } from "@/lib/api/backend-timing";
import { isSameOrigin } from "@/lib/api/auth-server";
import { createAdminModule, validateCourseSlug } from "@/lib/api/admin-courses-server";
import type { ModuleCreateInput } from "@/lib/api/types";

async function handlePOST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!isSameOrigin(request)) {
    return Response.json({ success: false, error: "Invalid origin" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const { slug } = await params;
  if (!validateCourseSlug(slug)) {
    return Response.json(
      { success: false, error: "Validation error: invalid course slug format" },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
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

  const payload = body as Partial<ModuleCreateInput>;
  if (typeof payload.number !== "number" || payload.number < 1) {
    return Response.json(
      { success: false, error: "Validation error: module number must be a positive integer" },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!payload.title || typeof payload.title !== "object" || !payload.title.it) {
    return Response.json(
      { success: false, error: "Validation error: module title with Italian text is required" },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  const result = await createAdminModule(slug, payload as ModuleCreateInput);
  if (result.success) {
    return Response.json({ success: true, data: result.data }, { status: 201, headers: { "Cache-Control": "no-store" } });
  }

  return Response.json(
    { success: false, error: result.error },
    { status: result.status, headers: { "Cache-Control": "no-store" } },
  );
}

export const POST = withApiTiming(handlePOST);
