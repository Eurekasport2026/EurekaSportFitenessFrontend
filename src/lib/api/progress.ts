import type { UserCourseProgress } from "./types";
import { getModulesByCourse } from "./modules";
import { getLessonsByModule } from "./lessons";

const STORAGE_PREFIX = "eureka_course_progress_";

function getInitialProgress(courseSlug: string): UserCourseProgress {
  return {
    courseSlug,
    completedLessonIds: [],
    completedModuleIds: [],
    examPassed: false,
    updatedAt: new Date().toISOString(),
  };
}

export function loadUserProgress(courseSlug: string): UserCourseProgress {
  if (typeof window === "undefined") {
    return getInitialProgress(courseSlug);
  }

  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${courseSlug}`);
    if (!raw) return getInitialProgress(courseSlug);
    return JSON.parse(raw) as UserCourseProgress;
  } catch {
    return getInitialProgress(courseSlug);
  }
}

export function saveUserProgress(progress: UserCourseProgress): void {
  if (typeof window === "undefined") return;

  try {
    progress.updatedAt = new Date().toISOString();
    localStorage.setItem(`${STORAGE_PREFIX}${progress.courseSlug}`, JSON.stringify(progress));
  } catch (err) {
    console.error("Failed to save course progress", err);
  }
}

export function toggleLessonCompletion(
  courseSlug: string,
  moduleId: string,
  lessonId: string
): UserCourseProgress {
  const progress = loadUserProgress(courseSlug);
  const exists = progress.completedLessonIds.includes(lessonId);

  if (exists) {
    progress.completedLessonIds = progress.completedLessonIds.filter((id) => id !== lessonId);
  } else {
    progress.completedLessonIds.push(lessonId);
  }

  // Check if all lessons of this module are now completed
  const moduleLessons = getLessonsByModule(moduleId);
  const allModuleLessonsDone = moduleLessons.length > 0 &&
    moduleLessons.every((l) => progress.completedLessonIds.includes(l.id));

  if (allModuleLessonsDone && !progress.completedModuleIds.includes(moduleId)) {
    progress.completedModuleIds.push(moduleId);
  } else if (!allModuleLessonsDone && progress.completedModuleIds.includes(moduleId)) {
    progress.completedModuleIds = progress.completedModuleIds.filter((id) => id !== moduleId);
  }

  progress.lastAccessedModuleId = moduleId;
  progress.lastAccessedLessonId = lessonId;

  saveUserProgress(progress);
  return progress;
}

export function recordExamCompletion(
  courseSlug: string,
  scorePercent: number,
  passed: boolean
): UserCourseProgress {
  const progress = loadUserProgress(courseSlug);
  progress.examScore = scorePercent;
  progress.examPassed = passed;
  saveUserProgress(progress);
  return progress;
}

export function calculateCourseProgress(
  courseSlug: string,
  progress: UserCourseProgress
): {
  percent: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
  completedModulesCount: number;
  totalModulesCount: number;
  isCompleted: boolean;
} {
  const modules = getModulesByCourse(courseSlug);
  const allCourseLessons = modules.flatMap((m) => getLessonsByModule(m.id));

  const totalLessonsCount = allCourseLessons.length;
  const completedLessonsCount = allCourseLessons.filter((l) =>
    progress.completedLessonIds.includes(l.id)
  ).length;

  const totalModulesCount = modules.length;
  const completedModulesCount = modules.filter((m) =>
    progress.completedModuleIds.includes(m.id)
  ).length;

  const percent = totalLessonsCount > 0 ? Math.round((completedLessonsCount / totalLessonsCount) * 100) : 0;
  const isCompleted = percent === 100 && (progress.examPassed || false);

  return {
    percent,
    completedLessonsCount,
    totalLessonsCount,
    completedModulesCount,
    totalModulesCount,
    isCompleted,
  };
}
