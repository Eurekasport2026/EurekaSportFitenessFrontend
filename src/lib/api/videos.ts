import "server-only";

import { cache } from "react";
import { curriculumId, getCurriculumData, parseAcademyVideo, parseAcademyVideoList } from "./curriculum-api-server";
import type { AcademyDataState, AcademyVideo } from "./types";

export interface VideoQueryOptions {
  q?: string;
  locale?: string;
}

/**
 * List / search videos across the Academy.
 * GET /api/v1/videos?locale=it&q=...
 */
export const getVideos = cache(async (
  options: VideoQueryOptions = {},
): Promise<AcademyDataState<AcademyVideo[]>> => {
  const locale = options.locale === "en" ? "en" : "it";
  const extraParams = options.q?.trim() ? { q: options.q.trim() } : undefined;
  return getCurriculumData(
    "videos",
    locale,
    parseAcademyVideoList,
    extraParams,
  );
});

/**
 * Get video details by video ID.
 * GET /api/v1/videos/{video_id}?locale=it
 */
export const getVideoById = cache(async (
  videoId: string,
  locale: string = "it",
): Promise<AcademyDataState<AcademyVideo>> => {
  if (!curriculumId(videoId)) return { status: "not_found" };
  return getCurriculumData(
    `videos/${videoId}`,
    locale,
    (value) => {
      const video = parseAcademyVideo(value);
      return video?.videoId === videoId ? video : null;
    },
  );
});

/**
 * Get all videos assigned to a course.
 * GET /api/v1/courses/{slug}/videos?locale=it
 */
export const getVideosByCourse = cache(async (
  courseSlug: string,
  locale: string = "it",
): Promise<AcademyDataState<AcademyVideo[]>> => {
  if (!/^[a-z0-9-]+$/.test(courseSlug)) return { status: "not_found" };
  return getCurriculumData(
    `courses/${courseSlug}/videos`,
    locale,
    parseAcademyVideoList,
  );
});

/**
 * Get all videos assigned to a specific module.
 * GET /api/v1/modules/{module_id}/videos?locale=it
 */
export const getVideosByModule = cache(async (
  moduleId: string,
  locale: string = "it",
): Promise<AcademyDataState<AcademyVideo[]>> => {
  if (!curriculumId(moduleId)) return { status: "not_found" };
  return getCurriculumData(
    `modules/${moduleId}/videos`,
    locale,
    parseAcademyVideoList,
  );
});
