import { withApiTiming } from "@/lib/api/backend-timing";
import { fetchAdminCourseDesign, validateCourseSlug } from "@/lib/api/admin-courses-server";

async function handleGET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!validateCourseSlug(slug)) {
    return Response.json(
      { success: false, error: "Validation error: invalid course slug format" },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") || undefined;

  const result = await fetchAdminCourseDesign(slug, locale, request.signal);
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

  if (result.status === "not_found") {
    return Response.json(
      { success: false, error: "Course not found" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(
    { success: false, error: result.timeout ? "Backend request timed out" : result.message || "Failed to fetch course design" },
    { status: result.timeout ? 504 : 502, headers: { "Cache-Control": "no-store" } },
  );
}

export const GET = withApiTiming(handleGET);
