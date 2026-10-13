import "server-only";

import { courseRecord, requestCourseApi } from "./course-api-server";
import type { AcademyDataState, AcademyVideo, CourseModule, ExerciseDetail, Lesson } from "./types";

export function curriculumId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(value);
}

function nonnegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function stringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item: unknown) => typeof item === "string");
}

function optionalString(value: unknown): value is string | null | undefined {
  return value == null || typeof value === "string";
}

function optionalMediaUrl(value: unknown): boolean {
  if (value == null || value === "") return true;
  if (typeof value !== "string" || /[\u0000-\u001f\u007f\\]/.test(value)) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

export async function getCurriculumData<T>(
  path: string,
  locale: string,
  parse: (value: unknown) => T | null,
  extraParams?: Record<string, string | undefined>,
): Promise<AcademyDataState<T>> {
  const response = await requestCourseApi(path, locale === "en" ? "en" : "it", extraParams);
  if (response.status !== "ready") return response;
  const envelope = courseRecord(response.payload);
  if (envelope?.success !== true) return { status: "error" };
  const data = parse(envelope.data);
  return data === null ? { status: "error" } : { status: "ready", data };
}

export function parseCurriculumList<T extends { id: string }>(
  value: unknown,
  parseItem: (value: unknown) => T | null,
): T[] | null {
  if (!Array.isArray(value)) return null;
  const items: T[] = [];
  const ids = new Set<string>();
  for (const raw of value) {
    const item = parseItem(raw);
    if (!item || ids.has(item.id)) return null;
    ids.add(item.id);
    items.push(item);
  }
  return items;
}

export function parseCourseModule(value: unknown): CourseModule | null {
  const module = courseRecord(value);
  if (!module || !curriculumId(module.id) || !curriculumId(module.courseSlug) ||
      !nonnegativeInteger(module.number) || module.number < 1 ||
      typeof module.title !== "string" || !module.title.trim() ||
      !optionalString(module.subtitle) || typeof module.description !== "string" ||
      !nonnegativeInteger(module.durationMinutes) || !nonnegativeInteger(module.lessonsCount) ||
      (module.isPractical != null && typeof module.isPractical !== "boolean") ||
      !optionalString(module.skillLevel)) return null;
  const type = module.type;
  if (type !== "theory" && type !== "skill" && type !== "practical" && type !== "case_study") return null;
  return {
    id: module.id,
    courseSlug: module.courseSlug,
    number: module.number,
    title: module.title,
    subtitle: module.subtitle ?? undefined,
    description: module.description,
    type,
    durationMinutes: module.durationMinutes,
    lessonsCount: module.lessonsCount,
    isPractical: typeof module.isPractical === "boolean" ? module.isPractical : undefined,
    skillLevel: module.skillLevel ?? undefined,
  };
}

function parseExercise(value: unknown): ExerciseDetail | null {
  const exercise = courseRecord(value);
  if (!exercise || !optionalString(exercise.code) ||
      typeof exercise.targetMuscle !== "string" || !stringArray(exercise.primaryMuscles) ||
      !stringArray(exercise.secondaryMuscles) || typeof exercise.equipment !== "string" ||
      typeof exercise.difficulty !== "string" || typeof exercise.movementType !== "string" ||
      typeof exercise.setup !== "string" || typeof exercise.execution !== "string" ||
      !stringArray(exercise.safetyPoints) || !stringArray(exercise.commonMistakes)) return null;
  return {
    code: exercise.code ?? undefined,
    targetMuscle: exercise.targetMuscle,
    primaryMuscles: exercise.primaryMuscles,
    secondaryMuscles: exercise.secondaryMuscles,
    equipment: exercise.equipment,
    difficulty: exercise.difficulty,
    movementType: exercise.movementType,
    setup: exercise.setup,
    execution: exercise.execution,
    safetyPoints: exercise.safetyPoints,
    commonMistakes: exercise.commonMistakes,
  };
}

function parseCaseStudy(value: unknown): NonNullable<Lesson["caseStudyDetail"]> | null {
  const study = courseRecord(value);
  if (!study || typeof study.clientProfile !== "string" || typeof study.challenge !== "string" ||
      typeof study.solutionRationale !== "string" || typeof study.outcomeMetrics !== "string") return null;
  return {
    clientProfile: study.clientProfile,
    challenge: study.challenge,
    solutionRationale: study.solutionRationale,
    outcomeMetrics: study.outcomeMetrics,
  };
}

export function parseLesson(value: unknown): Lesson | null {
  const lesson = courseRecord(value);
  if (!lesson || !curriculumId(lesson.id) || !curriculumId(lesson.moduleId) ||
      !curriculumId(lesson.courseSlug) || !nonnegativeInteger(lesson.order) || lesson.order < 1 ||
      typeof lesson.title !== "string" || !lesson.title.trim() ||
      typeof lesson.description !== "string" || !nonnegativeInteger(lesson.durationMinutes) ||
      typeof lesson.summary !== "string" || !stringArray(lesson.keyTakeaways) ||
      !optionalString(lesson.videoUrl) || !optionalMediaUrl(lesson.videoUrl) ||
      !optionalString(lesson.pdfUrl) || !optionalMediaUrl(lesson.pdfUrl) ||
      !optionalString(lesson.videoDuration) || !optionalString(lesson.pdfTitle) ||
      !optionalString(lesson.pdfSize) || !optionalString(lesson.rapidCode) ||
      !optionalString(lesson.programCode) || !optionalString(lesson.phase) ||
      !optionalString(lesson.regressionCode) || !optionalString(lesson.progressionCode) ||
      (lesson.allowsDownload != null && typeof lesson.allowsDownload !== "boolean") ||
      (lesson.progressionStep != null && !nonnegativeInteger(lesson.progressionStep))) return null;
  const itemType = lesson.itemType;
  if (itemType !== "video" && itemType !== "pdf" && itemType !== "case_study" &&
      itemType !== "exercise_card" && itemType !== "template" && itemType !== "assignment") return null;
  const mediaStatus = lesson.mediaStatus;
  if (mediaStatus !== "available" && mediaStatus !== "in_production" && mediaStatus !== "offline_only") return null;
  const exerciseDetail = lesson.exerciseDetail == null ? undefined : parseExercise(lesson.exerciseDetail);
  const caseStudyDetail = lesson.caseStudyDetail == null ? undefined : parseCaseStudy(lesson.caseStudyDetail);
  if (exerciseDetail === null || caseStudyDetail === null) return null;
  return {
    id: lesson.id,
    moduleId: lesson.moduleId,
    courseSlug: lesson.courseSlug,
    order: lesson.order,
    title: lesson.title,
    description: lesson.description,
    durationMinutes: lesson.durationMinutes,
    itemType,
    mediaStatus,
    videoUrl: lesson.videoUrl ?? undefined,
    videoDuration: lesson.videoDuration ?? undefined,
    summary: lesson.summary,
    keyTakeaways: lesson.keyTakeaways,
    pdfUrl: lesson.pdfUrl ?? undefined,
    pdfTitle: lesson.pdfTitle ?? undefined,
    pdfSize: lesson.pdfSize ?? undefined,
    allowsDownload: typeof lesson.allowsDownload === "boolean" ? lesson.allowsDownload : undefined,
    rapidCode: lesson.rapidCode ?? undefined,
    programCode: lesson.programCode ?? undefined,
    progressionStep: typeof lesson.progressionStep === "number" ? lesson.progressionStep : undefined,
    phase: lesson.phase ?? undefined,
    regressionCode: lesson.regressionCode ?? undefined,
    progressionCode: lesson.progressionCode ?? undefined,
    exerciseDetail,
    caseStudyDetail,
  };
}

export function parseAcademyVideo(value: unknown): AcademyVideo | null {
  const video = courseRecord(value);
  if (!video) return null;
  const rawId = video.video_id ?? video.id;
  if (typeof rawId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_-]{1,79}$/.test(rawId)) return null;
  if (typeof video.title !== "string" || !video.title.trim()) return null;
  if (!optionalString(video.title_it) || !optionalString(video.title_en) ||
      !optionalString(video.category) || !optionalString(video.equipment) ||
      !optionalString(video.provider) || !optionalString(video.version) ||
      !optionalString(video.status) || !optionalString(video.provider_video_id) ||
      !optionalString(video.embed_url) || !optionalMediaUrl(video.embed_url) ||
      !optionalString(video.thumbnail_url) || !optionalMediaUrl(video.thumbnail_url)) return null;
  if (video.duration_sec != null && !nonnegativeInteger(video.duration_sec)) return null;
  if (video._locale_fallback != null && typeof video._locale_fallback !== "boolean") return null;

  return {
    id: rawId,
    videoId: rawId,
    title: video.title,
    titleIt: typeof video.title_it === "string" ? video.title_it : video.title,
    titleEn: typeof video.title_en === "string" ? video.title_en : "",
    category: typeof video.category === "string" ? video.category : "Academy",
    equipment: typeof video.equipment === "string" ? video.equipment : null,
    provider: typeof video.provider === "string" ? video.provider : "Vimeo",
    version: typeof video.version === "string" ? video.version : "v01",
    status: typeof video.status === "string" ? video.status : "APPROVED",
    durationSec: typeof video.duration_sec === "number" ? video.duration_sec : null,
    thumbnailUrl: typeof video.thumbnail_url === "string" ? video.thumbnail_url : null,
    providerVideoId: typeof video.provider_video_id === "string" ? video.provider_video_id : null,
    embedUrl: typeof video.embed_url === "string" ? video.embed_url : null,
    localeFallback: typeof video._locale_fallback === "boolean" ? video._locale_fallback : undefined,
  };
}

export function parseAcademyVideoList(value: unknown): AcademyVideo[] | null {
  if (!Array.isArray(value)) return null;
  const items: AcademyVideo[] = [];
  const ids = new Set<string>();
  for (const raw of value) {
    const item = parseAcademyVideo(raw);
    if (!item || ids.has(item.videoId)) return null;
    ids.add(item.videoId);
    items.push(item);
  }
  return items;
}

