import "server-only";

import { BackendTimeout, backendJson } from "./backend-timing";

import { authenticatedFetch, SessionUnauthorized } from "./auth-server";
import type {
  AdminCourse,
  AdminCourseDesign,
  CourseCreateInput,
  CourseModule,
  CourseUpdateInput,
  ModuleCreateInput,
} from "./types";

export function validateCourseSlug(slug: unknown): slug is string {
  return typeof slug === "string" && /^[a-z0-9-]+$/.test(slug);
}

export type AdminCoursesResult =
  | { status: "ready"; data: AdminCourse[] }
  | { status: "unauthenticated" }
  | { status: "forbidden"; message?: string }
  | { status: "error"; message?: string; timeout?: boolean };

export type AdminCourseDesignResult =
  | { status: "ready"; data: AdminCourseDesign }
  | { status: "unauthenticated" }
  | { status: "forbidden"; message?: string }
  | { status: "not_found" }
  | { status: "error"; message?: string; timeout?: boolean };

/**
 * Server-only adapter to fetch all courses for administrators.
 * Calls GET /api/v1/admin/courses
 */
export async function fetchAdminCourses(
  options: { locale?: string } = {},
  signal?: AbortSignal,
): Promise<AdminCoursesResult> {
  const endpoint = options.locale ? `admin/courses?locale=${encodeURIComponent(options.locale)}` : "admin/courses";

  try {
    const response = await authenticatedFetch(endpoint, { signal });
    if (response.status === 401) return { status: "unauthenticated" };
    if (response.status === 403) {
      const payload = await backendJson(response);
      const msg = payload && typeof payload === "object" && typeof payload.message === "string"
        ? payload.message
        : "Admin access required";
      return { status: "forbidden", message: msg };
    }
    if (!response.ok) return { status: "error", timeout: response.status === 504 };

    const payload = await backendJson(response);
    if (!payload || typeof payload !== "object" || payload.success !== true || !Array.isArray(payload.data)) {
      return { status: "error" };
    }

    return { status: "ready", data: payload.data as AdminCourse[] };
  } catch (err) {
    if (err instanceof SessionUnauthorized) return { status: "unauthenticated" };
    return { status: "error", timeout: err instanceof BackendTimeout };
  }
}

/**
 * Server-only adapter to create a new course.
 * Calls POST /api/v1/admin/courses
 */
export async function createAdminCourse(
  data: CourseCreateInput,
): Promise<{ success: true; data: AdminCourse } | { success: false; status: number; error: unknown }> {
  if (!data.slug || !validateCourseSlug(data.slug)) {
    return { success: false, status: 422, error: "Invalid course slug format" };
  }

  try {
    const response = await authenticatedFetch("admin/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const body = await backendJson(response);

    if (response.status === 201 && body && typeof body === "object" && body.success === true) {
      return { success: true, data: body.data as AdminCourse };
    }

    if (response.status === 401) {
      return { success: false, status: 401, error: "Authentication required" };
    }

    if (response.status === 403) {
      return { success: false, status: 403, error: body?.message || "Admin access required" };
    }

    return {
      success: false,
      status: response.status,
      error: body?.detail || body?.error || "Failed to create course",
    };
  } catch (err) {
    if (err instanceof SessionUnauthorized) {
      return { success: false, status: 401, error: "Authentication required" };
    }
    return { success: false, status: err instanceof BackendTimeout ? 504 : 502, error: err instanceof BackendTimeout ? "Backend request timed out" : "Service unavailable" };
  }
}

/**
 * Server-only adapter to fetch the editable curriculum design tree for a course.
 * Calls GET /api/v1/admin/courses/{slug}/design
 */
export async function fetchAdminCourseDesign(
  slug: string,
  locale?: string,
  signal?: AbortSignal,
): Promise<AdminCourseDesignResult> {
  if (!validateCourseSlug(slug)) {
    return { status: "error", message: "Invalid course slug format" };
  }

  const endpoint = locale
    ? `admin/courses/${slug}/design?locale=${encodeURIComponent(locale)}`
    : `admin/courses/${slug}/design`;

  try {
    const response = await authenticatedFetch(endpoint, { signal });
    if (response.status === 401) return { status: "unauthenticated" };
    if (response.status === 403) {
      const payload = await backendJson(response);
      const msg = payload && typeof payload === "object" && typeof payload.message === "string"
        ? payload.message
        : "Admin access required";
      return { status: "forbidden", message: msg };
    }
    if (response.status === 404) return { status: "not_found" };
    if (!response.ok) return { status: "error", timeout: response.status === 504 };

    const payload = await backendJson(response);
    if (!payload || typeof payload !== "object" || payload.success !== true || !payload.data) {
      return { status: "error" };
    }

    return { status: "ready", data: payload.data as AdminCourseDesign };
  } catch (err) {
    if (err instanceof SessionUnauthorized) return { status: "unauthenticated" };
    return { status: "error", timeout: err instanceof BackendTimeout };
  }
}

/**
 * Server-only adapter to update an existing course.
 * Calls PATCH /api/v1/admin/courses/{slug}
 */
export async function updateAdminCourse(
  slug: string,
  data: CourseUpdateInput,
): Promise<{ success: true; data: AdminCourse } | { success: false; status: number; error: unknown }> {
  if (!validateCourseSlug(slug)) {
    return { success: false, status: 422, error: "Invalid course slug format" };
  }

  try {
    const response = await authenticatedFetch(`admin/courses/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const body = await backendJson(response);

    if (response.status === 200 && body && typeof body === "object" && body.success === true) {
      return { success: true, data: body.data as AdminCourse };
    }

    if (response.status === 401) {
      return { success: false, status: 401, error: "Authentication required" };
    }

    if (response.status === 403) {
      return { success: false, status: 403, error: body?.message || "Admin access required" };
    }

    if (response.status === 404) {
      return { success: false, status: 404, error: "Course not found" };
    }

    return {
      success: false,
      status: response.status,
      error: body?.detail || body?.error || "Failed to update course",
    };
  } catch (err) {
    if (err instanceof SessionUnauthorized) {
      return { success: false, status: 401, error: "Authentication required" };
    }
    return { success: false, status: err instanceof BackendTimeout ? 504 : 502, error: err instanceof BackendTimeout ? "Backend request timed out" : "Service unavailable" };
  }
}

/**
 * Server-only adapter to create a module within an existing course.
 * Calls POST /api/v1/admin/courses/{slug}/modules
 */
export async function createAdminModule(
  slug: string,
  data: ModuleCreateInput,
): Promise<{ success: true; data: CourseModule } | { success: false; status: number; error: unknown }> {
  if (!validateCourseSlug(slug)) {
    return { success: false, status: 422, error: "Invalid course slug format" };
  }

  try {
    const response = await authenticatedFetch(`admin/courses/${slug}/modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const body = await backendJson(response);

    if (response.status === 201 && body && typeof body === "object" && body.success === true) {
      return { success: true, data: body.data as CourseModule };
    }

    if (response.status === 401) {
      return { success: false, status: 401, error: "Authentication required" };
    }

    if (response.status === 403) {
      return { success: false, status: 403, error: body?.message || "Admin access required" };
    }

    if (response.status === 404) {
      return { success: false, status: 404, error: "Course not found" };
    }

    return {
      success: false,
      status: response.status,
      error: body?.detail || body?.error || "Failed to create module",
    };
  } catch (err) {
    if (err instanceof SessionUnauthorized) {
      return { success: false, status: 401, error: "Authentication required" };
    }
    return { success: false, status: err instanceof BackendTimeout ? 504 : 502, error: err instanceof BackendTimeout ? "Backend request timed out" : "Service unavailable" };
  }
}
