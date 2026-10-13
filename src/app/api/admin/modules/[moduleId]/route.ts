import { isSameOrigin } from "@/lib/api/auth-server";
import { updateAdminModule, validateEntityId } from "@/lib/api/admin-curriculum-server";
import type { ModuleUpdateInput } from "@/lib/api/types";

export async function PATCH(
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

  const result = await updateAdminModule(moduleId, body as ModuleUpdateInput);
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
