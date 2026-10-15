import { withApiTiming } from "@/lib/api/backend-timing";
import { isSameOrigin } from "@/lib/api/auth-server";
import { createAdminCourse, fetchAdminCourses, validateCourseSlug } from "@/lib/api/admin-courses-server";
import type { CourseCreateInput } from "@/lib/api/types";

async function handleGET(request: Request) {
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") || undefined;

  const result = await fetchAdminCourses({ locale }, request.signal);
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

  return Response.json(
    { success: false, error: result.timeout ? "Backend request timed out" : result.message || "Failed to fetch admin courses" },
    { status: result.timeout ? 504 : 502, headers: { "Cache-Control": "no-store" } },
  );
}

async function handlePOST(request: Request) {
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

  const payload = body as Partial<CourseCreateInput>;
  if (!payload.id || typeof payload.id !== "string" || !payload.id.trim()) {
    return Response.json(
      { success: false, error: "Validation error: id is required" },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!payload.slug || !validateCourseSlug(payload.slug)) {
    return Response.json(
      { success: false, error: "Validation error: slug must match ^[a-z0-9-]+$" },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!payload.title || typeof payload.title !== "object" || !payload.title.it) {
    return Response.json(
      { success: false, error: "Validation error: title with Italian text is required" },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  const result = await createAdminCourse(payload as CourseCreateInput);
  if (result.success) {
    return Response.json({ success: true, data: result.data }, { status: 201, headers: { "Cache-Control": "no-store" } });
  }

  return Response.json(
    { success: false, error: result.error },
    { status: result.status, headers: { "Cache-Control": "no-store" } },
  );
}

export const GET = withApiTiming(handleGET);
export const POST = withApiTiming(handlePOST);
