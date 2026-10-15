import "server-only";

import { BackendTimeout, backendJson } from "./backend-timing";

import { authenticatedFetch, SessionUnauthorized } from "./auth-server";
import { parseAcademyVideo } from "./curriculum-api-server";
import type { AcademyDataState, AdminVideo, AdminVideoQuery, VideoCreateInput, VideoUpdateInput } from "./types";

export function validateAdminVideoId(videoId: unknown): videoId is string {
  return typeof videoId === "string" && /^[A-Z0-9][A-Z0-9-]{2,31}$/.test(videoId);
}

export function parseAdminVideo(value: unknown): AdminVideo | null {
  const base = parseAcademyVideo(value);
  if (!base) return null;

  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const notes = typeof raw.notes === "string" ? raw.notes : null;
  const aliases = Array.isArray(raw.aliases) && raw.aliases.every((item) => typeof item === "string")
    ? raw.aliases as string[]
    : undefined;
  const createdAt = typeof raw.created_at === "string" ? raw.created_at : undefined;
  const updatedAt = typeof raw.updated_at === "string" ? raw.updated_at : undefined;

  return {
    ...base,
    notes,
    aliases,
    createdAt,
    updatedAt,
  };
}

export function parseAdminVideoList(value: unknown): AdminVideo[] | null {
  if (!Array.isArray(value)) return null;
  const items: AdminVideo[] = [];
  const ids = new Set<string>();
  for (const raw of value) {
    const item = parseAdminVideo(raw);
    if (!item || ids.has(item.videoId)) return null;
    ids.add(item.videoId);
    items.push(item);
  }
  return items;
}

export type AdminVideosResult =
  | { status: "ready"; data: AdminVideo[] }
  | { status: "unauthenticated" }
  | { status: "forbidden"; message?: string }
  | { status: "error"; message?: string; timeout?: boolean };

export async function fetchAdminVideos(
  query: AdminVideoQuery = {},
  signal?: AbortSignal,
): Promise<AdminVideosResult> {
  const searchParams = new URLSearchParams();
  if (query.locale) searchParams.set("locale", query.locale);
  if (query.status) searchParams.set("status", query.status);
  if (query.q && query.q.trim()) searchParams.set("q", query.q.trim());

  const queryString = searchParams.toString();
  const endpoint = queryString ? `admin/videos?${queryString}` : "admin/videos";

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
    if (!payload || typeof payload !== "object" || payload.success !== true) return { status: "error" };

    const videos = parseAdminVideoList(payload.data);
    return videos ? { status: "ready", data: videos } : { status: "error" };
  } catch (err) {
    if (err instanceof SessionUnauthorized) return { status: "unauthenticated" };
    return { status: "error", timeout: err instanceof BackendTimeout };
  }
}

export async function createAdminVideo(
  data: VideoCreateInput,
): Promise<{ success: true; data: AdminVideo } | { success: false; status: number; error: unknown }> {
  try {
    const response = await authenticatedFetch("admin/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const body = await backendJson(response);

    if (response.status === 201 && body && typeof body === "object" && body.success === true) {
      const video = parseAdminVideo(body.data);
      if (video) return { success: true, data: video };
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
      error: body?.detail || body?.error || "Failed to create video",
    };
  } catch (err) {
    if (err instanceof SessionUnauthorized) {
      return { success: false, status: 401, error: "Authentication required" };
    }
    return { success: false, status: err instanceof BackendTimeout ? 504 : 502, error: err instanceof BackendTimeout ? "Backend request timed out" : "Service unavailable" };
  }
}

export async function updateAdminVideo(
  videoId: string,
  data: VideoUpdateInput,
): Promise<{ success: true; data: AdminVideo } | { success: false; status: number; error: unknown }> {
  if (!validateAdminVideoId(videoId)) {
    return { success: false, status: 422, error: "Invalid video_id format" };
  }

  try {
    const response = await authenticatedFetch(`admin/videos/${videoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const body = await backendJson(response);

    if (response.status === 200 && body && typeof body === "object" && body.success === true) {
      const video = parseAdminVideo(body.data);
      if (video) return { success: true, data: video };
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
      error: body?.detail || body?.error || "Failed to update video",
    };
  } catch (err) {
    if (err instanceof SessionUnauthorized) {
      return { success: false, status: 401, error: "Authentication required" };
    }
    return { success: false, status: err instanceof BackendTimeout ? 504 : 502, error: err instanceof BackendTimeout ? "Backend request timed out" : "Service unavailable" };
  }
}
