import "server-only";

import { BackendTimeout, backendJson } from "./backend-timing";

import { authenticatedFetch, SessionUnauthorized } from "./auth-server";
import type {
  CourseModule,
  Lesson,
  LessonCreateInput,
  LessonUpdateInput,
  ModuleUpdateInput,
} from "./types";

export function validateEntityId(id: unknown): id is string {
  return typeof id === "string" && id.trim().length > 0 && id.length <= 120;
}

export function validateVideoId(videoId: unknown): videoId is string {
  return typeof videoId === "string" && videoId.trim().length >= 3 && videoId.length <= 32;
}

export type AdminMutationResult<T> =
  | { success: true; data: T }
  | { success: false; status: number; error: unknown };

/**
 * Server-only adapter to update a module's details.
 * Calls PATCH /api/v1/admin/modules/{module_id}
 */
export async function updateAdminModule(
  moduleId: string,
  data: ModuleUpdateInput,
): Promise<AdminMutationResult<CourseModule>> {
  if (!validateEntityId(moduleId)) {
    return { success: false, status: 422, error: "Invalid module ID format" };
  }

  try {
    const response = await authenticatedFetch(`admin/modules/${encodeURIComponent(moduleId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const body = await backendJson(response);

    if (response.ok && body && typeof body === "object") {
      const moduleData = body.data || body;
      return { success: true, data: moduleData as CourseModule };
    }

    if (response.status === 401) {
      return { success: false, status: 401, error: "Authentication required" };
    }

    if (response.status === 403) {
      return { success: false, status: 403, error: body?.message || "Admin access required" };
    }

    if (response.status === 404) {
      return { success: false, status: 404, error: "Module not found" };
    }

    return {
      success: false,
      status: response.status,
      error: body?.detail || body?.error || "Failed to update module",
    };
  } catch (err) {
    if (err instanceof SessionUnauthorized) {
      return { success: false, status: 401, error: "Authentication required" };
    }
    return { success: false, status: err instanceof BackendTimeout ? 504 : 502, error: err instanceof BackendTimeout ? "Backend request timed out" : "Service unavailable" };
  }
}

/**
 * Server-only adapter to create a lesson inside a module.
 * Calls POST /api/v1/admin/modules/{module_id}/lessons
 */
export async function createAdminLesson(
  moduleId: string,
  data: LessonCreateInput,
): Promise<AdminMutationResult<Lesson>> {
  if (!validateEntityId(moduleId)) {
    return { success: false, status: 422, error: "Invalid module ID format" };
  }

  try {
    const response = await authenticatedFetch(
      `admin/modules/${encodeURIComponent(moduleId)}/lessons`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );

    const body = await backendJson(response);

    if (response.status === 201 && body && typeof body === "object") {
      const lessonData = body.data || body;
      return { success: true, data: lessonData as Lesson };
    }

    if (response.status === 401) {
      return { success: false, status: 401, error: "Authentication required" };
    }

    if (response.status === 403) {
      return { success: false, status: 403, error: body?.message || "Admin access required" };
    }

    if (response.status === 404) {
      return { success: false, status: 404, error: "Module not found" };
    }

    return {
      success: false,
      status: response.status,
      error: body?.detail || body?.error || "Failed to create lesson",
    };
  } catch (err) {
    if (err instanceof SessionUnauthorized) {
      return { success: false, status: 401, error: "Authentication required" };
    }
    return { success: false, status: err instanceof BackendTimeout ? 504 : 502, error: err instanceof BackendTimeout ? "Backend request timed out" : "Service unavailable" };
  }
}

/**
 * Server-only adapter to update a lesson.
 * Calls PATCH /api/v1/admin/lessons/{lesson_id}
 */
export async function updateAdminLesson(
  lessonId: string,
  data: LessonUpdateInput,
): Promise<AdminMutationResult<Lesson>> {
  if (!validateEntityId(lessonId)) {
    return { success: false, status: 422, error: "Invalid lesson ID format" };
  }

  try {
    const response = await authenticatedFetch(`admin/lessons/${encodeURIComponent(lessonId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const body = await backendJson(response);

    if (response.ok && body && typeof body === "object") {
      const lessonData = body.data || body;
      return { success: true, data: lessonData as Lesson };
    }

    if (response.status === 401) {
      return { success: false, status: 401, error: "Authentication required" };
    }

    if (response.status === 403) {
      return { success: false, status: 403, error: body?.message || "Admin access required" };
    }

    if (response.status === 404) {
      return { success: false, status: 404, error: "Lesson not found" };
    }

    return {
      success: false,
      status: response.status,
      error: body?.detail || body?.error || "Failed to update lesson",
    };
  } catch (err) {
    if (err instanceof SessionUnauthorized) {
      return { success: false, status: 401, error: "Authentication required" };
    }
    return { success: false, status: err instanceof BackendTimeout ? 504 : 502, error: err instanceof BackendTimeout ? "Backend request timed out" : "Service unavailable" };
  }
}

/**
 * Server-only adapter to assign a video asset to a lesson.
 * Calls PUT /api/v1/admin/lessons/{lesson_id}/video
 */
export async function assignAdminLessonVideo(
  lessonId: string,
  videoId: string,
): Promise<AdminMutationResult<{ success: boolean; lessonId: string; videoId: string }>> {
  if (!validateEntityId(lessonId)) {
    return { success: false, status: 422, error: "Invalid lesson ID format" };
  }

  if (!validateVideoId(videoId)) {
    return { success: false, status: 422, error: "Invalid video ID format (must be 3-32 characters)" };
  }

  try {
    const response = await authenticatedFetch(
      `admin/lessons/${encodeURIComponent(lessonId)}/video`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_id: videoId }),
      },
    );

    const body = await backendJson(response);

    if (response.ok) {
      return {
        success: true,
        data: { success: true, lessonId, videoId },
      };
    }

    if (response.status === 401) {
      return { success: false, status: 401, error: "Authentication required" };
    }

    if (response.status === 403) {
      return { success: false, status: 403, error: body?.message || "Admin access required" };
    }

    if (response.status === 404) {
      return { success: false, status: 404, error: "Lesson or video not found" };
    }

    return {
      success: false,
      status: response.status,
      error: body?.detail || body?.error || "Failed to assign video",
    };
  } catch (err) {
    if (err instanceof SessionUnauthorized) {
      return { success: false, status: 401, error: "Authentication required" };
    }
    return { success: false, status: err instanceof BackendTimeout ? 504 : 502, error: err instanceof BackendTimeout ? "Backend request timed out" : "Service unavailable" };
  }
}

/**
 * Server-only adapter to remove / detach video from a lesson.
 * Calls DELETE /api/v1/admin/lessons/{lesson_id}/video
 */
export async function removeAdminLessonVideo(
  lessonId: string,
): Promise<AdminMutationResult<{ success: boolean; lessonId: string }>> {
  if (!validateEntityId(lessonId)) {
    return { success: false, status: 422, error: "Invalid lesson ID format" };
  }

  try {
    const response = await authenticatedFetch(
      `admin/lessons/${encodeURIComponent(lessonId)}/video`,
      {
        method: "DELETE",
      },
    );

    const body = await backendJson(response);

    if (response.ok) {
      return {
        success: true,
        data: { success: true, lessonId },
      };
    }

    if (response.status === 401) {
      return { success: false, status: 401, error: "Authentication required" };
    }

    if (response.status === 403) {
      return { success: false, status: 403, error: body?.message || "Admin access required" };
    }

    if (response.status === 404) {
      return { success: false, status: 404, error: "Lesson not found" };
    }

    return {
      success: false,
      status: response.status,
      error: body?.detail || body?.error || "Failed to remove video",
    };
  } catch (err) {
    if (err instanceof SessionUnauthorized) {
      return { success: false, status: 401, error: "Authentication required" };
    }
    return { success: false, status: err instanceof BackendTimeout ? 504 : 502, error: err instanceof BackendTimeout ? "Backend request timed out" : "Service unavailable" };
  }
}
