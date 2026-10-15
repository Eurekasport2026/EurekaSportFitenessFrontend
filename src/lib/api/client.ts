/**
 * Type-Safe HTTP Client for Eureka Sport & Fitness
 * 
 * Unwraps standardized backend response envelopes ({ success: true, data: T })
 * and automatically injects authentication headers and locale parameters.
 */

import { apiConfig, getAuthToken } from "./config";
import { invalidateClientReads, readClientResource } from "./client-reads";
import type {
  AcademyVideo,
  AdminCourse,
  AdminCourseDesign,
  AdminVideo,
  AdminVideoQuery,
  CourseCreateInput,
  CourseModule,
  CourseUpdateInput,
  Lesson,
  LessonCreateInput,
  LessonUpdateInput,
  ModuleCreateInput,
  ModuleUpdateInput,
  VideoCreateInput,
  VideoUpdateInput,
} from "./types";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface RequestOptions extends RequestInit {
  locale?: string;
  token?: string;
}

export class ApiClientError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.data = data;
  }
}

function buildUrl(endpoint: string, locale?: string): string {
  const base = apiConfig.apiUrl.replace(/\/+$/, "");
  const path = endpoint.replace(/^\/+/, "");
  const url = new URL(`${base}/${path}`);

  if (locale) {
    url.searchParams.set("locale", locale);
  }

  return url.toString();
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { locale, token, headers, ...rest } = options;
  const url = buildUrl(endpoint, locale);

  const bearerToken = token || getAuthToken();

  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Accept-Language": locale || "it",
    ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
    ...(headers as Record<string, string> | undefined),
  };

  // Controller for request timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), apiConfig.timeoutMs);

  try {
    const res = await fetch(url, {
      ...rest,
      headers: finalHeaders,
      signal: options.signal || controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorBody: unknown;
      try {
        errorBody = await res.json();
      } catch {
        errorBody = await res.text();
      }

      const msg =
        typeof errorBody === "object" && errorBody !== null && "message" in errorBody
          ? String((errorBody as { message: unknown }).message)
          : `HTTP ${res.status}: ${res.statusText}`;

      throw new ApiClientError(msg, res.status, errorBody);
    }

    // Handle 204 No Content
    if (res.status === 204) {
      return {} as T;
    }

    const json = await res.json();

    // Unwrap { success: true, data: T } envelope if present
    if (typeof json === "object" && json !== null && "data" in json && "success" in json) {
      return json.data as T;
    }

    return json as T;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof ApiClientError) {
      throw err;
    }

    const message = err instanceof Error ? err.message : "Network error";
    throw new ApiClientError(message, 0, err);
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};

export const videosService = {
  list: (options?: { q?: string; locale?: string }): Promise<AcademyVideo[]> => {
    const endpoint = options?.q?.trim()
      ? `videos?q=${encodeURIComponent(options.q.trim())}`
      : "videos";
    return apiClient.get<AcademyVideo[]>(endpoint, { locale: options?.locale });
  },
  getById: (videoId: string, locale?: string): Promise<AcademyVideo> =>
    apiClient.get<AcademyVideo>(`videos/${videoId}`, { locale }),
  getByCourse: (courseSlug: string, locale?: string): Promise<AcademyVideo[]> =>
    apiClient.get<AcademyVideo[]>(`courses/${courseSlug}/videos`, { locale }),
  getByModule: (moduleId: string, locale?: string): Promise<AcademyVideo[]> =>
    apiClient.get<AcademyVideo[]>(`modules/${moduleId}/videos`, { locale }),
};

export const modulesService = {
  list: (locale?: string): Promise<CourseModule[]> =>
    apiClient.get<CourseModule[]>("modules", { locale }),
  getById: (moduleId: string, locale?: string): Promise<CourseModule> =>
    apiClient.get<CourseModule>(`modules/${moduleId}`, { locale }),
  getByCourse: (courseSlug: string, locale?: string): Promise<CourseModule[]> =>
    apiClient.get<CourseModule[]>(`courses/${courseSlug}/modules`, { locale }),
};

export const lessonsService = {
  list: (locale?: string): Promise<Lesson[]> =>
    apiClient.get<Lesson[]>("lessons", { locale }),
  getById: (lessonId: string, locale?: string): Promise<Lesson> =>
    apiClient.get<Lesson>(`lessons/${lessonId}`, { locale }),
  getByModule: (moduleId: string, locale?: string): Promise<Lesson[]> =>
    apiClient.get<Lesson[]>(`modules/${moduleId}/lessons`, { locale }),
  getAdjacent: (lessonId: string, locale?: string): Promise<{ prevLesson?: Lesson; nextLesson?: Lesson }> =>
    apiClient.get<{ prevLesson?: Lesson; nextLesson?: Lesson }>(`lessons/${lessonId}/adjacent`, { locale }),
};

export const adminVideosService = {
  list: async (query: AdminVideoQuery = {}, signal?: AbortSignal): Promise<AdminVideo[]> => {
    const params = new URLSearchParams();
    if (query.locale) params.set("locale", query.locale);
    if (query.status) params.set("status", query.status);
    if (query.q) params.set("q", query.q);
    const qs = params.toString();
    const url = qs ? `/api/admin/videos?${qs}` : "/api/admin/videos";
    return readClientResource(url, async sharedSignal => {
      const res = await fetch(url, { cache: "no-store", credentials: "same-origin", signal: sharedSignal });
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.success !== true) {
        throw new ApiClientError(json?.error || `HTTP ${res.status}: Failed to fetch admin videos`, res.status, json);
      }
      return json.data as AdminVideo[];
    }, signal, query.status === "APPROVED" && !query.q ? 30000 : 0);
  },

  create: async (data: VideoCreateInput): Promise<AdminVideo> => {
    const res = await fetch("/api/admin/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      cache: "no-store",
      credentials: "same-origin",
    });
    const json = await res.json();
    if (!res.ok || json.success !== true) {
      throw new ApiClientError(json.error || `HTTP ${res.status}: Failed to create admin video`, res.status, json);
    }
    invalidateClientReads();
    return json.data as AdminVideo;
  },

  update: async (videoId: string, data: VideoUpdateInput): Promise<AdminVideo> => {
    const res = await fetch(`/api/admin/videos/${videoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      cache: "no-store",
      credentials: "same-origin",
    });
    const json = await res.json();
    if (!res.ok || json.success !== true) {
      throw new ApiClientError(json.error || `HTTP ${res.status}: Failed to update admin video`, res.status, json);
    }
    invalidateClientReads();
    return json.data as AdminVideo;
  },
};

export const adminCoursesService = {
  list: async (options?: { locale?: string }, signal?: AbortSignal): Promise<AdminCourse[]> => {
    const url = options?.locale ? `/api/admin/courses?locale=${encodeURIComponent(options.locale)}` : "/api/admin/courses";
    return readClientResource(url, async sharedSignal => {
      const res = await fetch(url, { cache: "no-store", credentials: "same-origin", signal: sharedSignal });
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.success !== true) {
        throw new ApiClientError(json?.error || `HTTP ${res.status}: Failed to fetch admin courses`, res.status, json);
      }
      return json.data as AdminCourse[];
    }, signal);
  },

  create: async (data: CourseCreateInput): Promise<AdminCourse> => {
    const res = await fetch("/api/admin/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      cache: "no-store",
      credentials: "same-origin",
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.success !== true) {
      throw new ApiClientError(json?.error || `HTTP ${res.status}: Failed to create admin course`, res.status, json);
    }
    invalidateClientReads();
    return json.data as AdminCourse;
  },

  getDesign: async (slug: string, locale?: string, signal?: AbortSignal): Promise<AdminCourseDesign> => {
    const url = locale
      ? `/api/admin/courses/${encodeURIComponent(slug)}/design?locale=${encodeURIComponent(locale)}`
      : `/api/admin/courses/${encodeURIComponent(slug)}/design`;
    return readClientResource(url, async sharedSignal => {
      const res = await fetch(url, { cache: "no-store", credentials: "same-origin", signal: sharedSignal });
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.success !== true) {
        throw new ApiClientError(json?.error || `HTTP ${res.status}: Failed to fetch course design`, res.status, json);
      }
      return json.data as AdminCourseDesign;
    }, signal);
  },

  update: async (slug: string, data: CourseUpdateInput): Promise<AdminCourse> => {
    const res = await fetch(`/api/admin/courses/${encodeURIComponent(slug)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      cache: "no-store",
      credentials: "same-origin",
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.success !== true) {
      throw new ApiClientError(json?.error || `HTTP ${res.status}: Failed to update admin course`, res.status, json);
    }
    invalidateClientReads();
    return json.data as AdminCourse;
  },

  createModule: async (slug: string, data: ModuleCreateInput): Promise<CourseModule> => {
    const res = await fetch(`/api/admin/courses/${encodeURIComponent(slug)}/modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      cache: "no-store",
      credentials: "same-origin",
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.success !== true) {
      throw new ApiClientError(json?.error || `HTTP ${res.status}: Failed to create module`, res.status, json);
    }
    invalidateClientReads();
    return json.data as CourseModule;
  },
};

export const adminCurriculumService = {
  updateModule: async (moduleId: string, data: ModuleUpdateInput): Promise<CourseModule> => {
    const res = await fetch(`/api/admin/modules/${encodeURIComponent(moduleId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      cache: "no-store",
      credentials: "same-origin",
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.success !== true) {
      throw new ApiClientError(json?.error || `HTTP ${res.status}: Failed to update module`, res.status, json);
    }
    invalidateClientReads();
    return json.data as CourseModule;
  },

  createLesson: async (moduleId: string, data: LessonCreateInput): Promise<Lesson> => {
    const res = await fetch(`/api/admin/modules/${encodeURIComponent(moduleId)}/lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      cache: "no-store",
      credentials: "same-origin",
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.success !== true) {
      throw new ApiClientError(json?.error || `HTTP ${res.status}: Failed to create lesson`, res.status, json);
    }
    invalidateClientReads();
    return json.data as Lesson;
  },

  updateLesson: async (lessonId: string, data: LessonUpdateInput): Promise<Lesson> => {
    const res = await fetch(`/api/admin/lessons/${encodeURIComponent(lessonId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      cache: "no-store",
      credentials: "same-origin",
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.success !== true) {
      throw new ApiClientError(json?.error || `HTTP ${res.status}: Failed to update lesson`, res.status, json);
    }
    invalidateClientReads();
    return json.data as Lesson;
  },

  assignVideo: async (lessonId: string, videoId: string): Promise<{ success: boolean; lessonId: string; videoId: string }> => {
    if (videoId.trim().length < 3 || videoId.length > 32) {
      throw new ApiClientError("Video ID must contain 3 to 32 characters", 422);
    }
    const res = await fetch(`/api/admin/lessons/${encodeURIComponent(lessonId)}/video`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ video_id: videoId }),
      cache: "no-store",
      credentials: "same-origin",
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.success !== true) {
      throw new ApiClientError(json?.error || `HTTP ${res.status}: Failed to assign video`, res.status, json);
    }
    invalidateClientReads();
    return json.data;
  },

  removeVideo: async (lessonId: string): Promise<{ success: boolean; lessonId: string }> => {
    const res = await fetch(`/api/admin/lessons/${encodeURIComponent(lessonId)}/video`, {
      method: "DELETE",
      cache: "no-store",
      credentials: "same-origin",
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.success !== true) {
      throw new ApiClientError(json?.error || `HTTP ${res.status}: Failed to remove video`, res.status, json);
    }
    invalidateClientReads();
    return json.data;
  },
};

export interface HealthTelemetry {
  status: "ok" | "degraded" | "down";
  backend: string;
  backendUrl: string;
  httpStatus: number;
  latencyMs: number;
  timestamp: string;
  version: string;
  error?: string;
  coverage: {
    total: number;
    implemented: number;
    percentage: string;
  };
}

export const healthService = {
  check: async (signal?: AbortSignal): Promise<HealthTelemetry> => {
    return readClientResource("/api/health", async sharedSignal => {
      const res = await fetch("/api/health", { cache: "no-store", signal: sharedSignal });
      const json = await res.json().catch(() => null);
      if (!json || typeof json !== "object" || !json.data) {
        throw new ApiClientError("Invalid health response", res.status);
      }
      return json.data as HealthTelemetry;
    }, signal);
  },
};

