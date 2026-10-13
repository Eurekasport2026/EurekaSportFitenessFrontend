import type { Course, CourseModule, LessonReference, UserCourseProgress, AssignmentStatus } from "./types";

const STORAGE_PREFIX = "eureka_course_progress_v2_";
const CURRENT_VERSION = 2;

function getInitialProgress(courseSlug: string): UserCourseProgress {
  return {
    version: CURRENT_VERSION,
    courseSlug,
    completedLessonIds: [],
    completedModuleIds: [],
    examPassed: false,
    assignmentStatus: "not_submitted",
    updatedAt: new Date().toISOString(),
  };
}

export function loadUserProgress(courseSlug: string): UserCourseProgress {
  if (typeof window === "undefined") {
    return getInitialProgress(courseSlug);
  }

  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${courseSlug}`);
    if (raw) {
      const parsed = JSON.parse(raw) as UserCourseProgress;
      if (parsed && Array.isArray(parsed.completedLessonIds) && Array.isArray(parsed.completedModuleIds)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Failed to load course progress", err);
  }

  return getInitialProgress(courseSlug);
}

export function saveUserProgress(progress: UserCourseProgress): void {
  if (typeof window === "undefined") return;

  try {
    progress.version = CURRENT_VERSION;
    progress.updatedAt = new Date().toISOString();
    localStorage.setItem(`${STORAGE_PREFIX}${progress.courseSlug}`, JSON.stringify(progress));
  } catch (err) {
    console.error("Failed to save course progress", err);
  }
}

export function toggleLessonCompletion(
  courseSlug: string,
  moduleId: string,
  lessonId: string,
  lessons: LessonReference[],
): UserCourseProgress {
  const progress = loadUserProgress(courseSlug);
  const moduleLessons = lessons.filter((lesson) => lesson.moduleId === moduleId && lesson.courseSlug === courseSlug);
  if (!moduleLessons.some((lesson) => lesson.id === lessonId)) return progress;
  const exists = progress.completedLessonIds.includes(lessonId);

  if (exists) {
    progress.completedLessonIds = progress.completedLessonIds.filter((id) => id !== lessonId);
  } else {
    progress.completedLessonIds.push(lessonId);
  }

  // Exact module completion validation
  const allModuleLessonsDone =
    moduleLessons.length > 0 &&
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

export function recordAssignmentStatus(
  courseSlug: string,
  status: AssignmentStatus
): UserCourseProgress {
  const progress = loadUserProgress(courseSlug);
  progress.assignmentStatus = status;
  saveUserProgress(progress);
  return progress;
}

export function getCompletedModuleIds(
  modules: CourseModule[],
  lessons: LessonReference[],
  progress: UserCourseProgress,
): string[] {
  const completed = new Set(progress.completedLessonIds);
  return modules.filter((module) => {
    const moduleLessons = lessons.filter((lesson) =>
      lesson.moduleId === module.id && lesson.courseSlug === module.courseSlug);
    return moduleLessons.length > 0 && moduleLessons.length === module.lessonsCount &&
      moduleLessons.every((lesson) => completed.has(lesson.id));
  }).map((module) => module.id);
}

export function isExamUnlocked(
  modules: CourseModule[],
  lessons: LessonReference[],
  progress: UserCourseProgress,
): boolean {
  return modules.length > 0 && getCompletedModuleIds(modules, lessons, progress).length === modules.length;
}

export function calculateCourseProgress(
  course: Pick<Course, "slug" | "hasExam" | "hasProjectWork" | "hasPracticalSubmission">,
  progress: UserCourseProgress,
  modules: CourseModule[],
  lessons: LessonReference[],
): {
  percent: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
  completedModulesCount: number;
  completedModuleIds: string[];
  totalModulesCount: number;
  isExamUnlocked: boolean;
  isCompleted: boolean;
} {
  const courseModules = modules.filter((module) => module.courseSlug === course.slug);
  const allCourseLessons = lessons.filter((lesson) => lesson.courseSlug === course.slug &&
    courseModules.some((module) => module.id === lesson.moduleId));

  const totalLessonsCount = allCourseLessons.length;
  const completedLessonsCount = allCourseLessons.filter((l) =>
    progress.completedLessonIds.includes(l.id)
  ).length;

  const totalModulesCount = courseModules.length;
  const completedModuleIds = getCompletedModuleIds(courseModules, allCourseLessons, progress);
  const completedModulesCount = completedModuleIds.length;

  const percent = totalLessonsCount > 0 ? Math.round((completedLessonsCount / totalLessonsCount) * 100) : 0;
  const examUnlocked = totalModulesCount > 0 && completedModulesCount === totalModulesCount;

  const requiresExam = course.hasExam;
  const requiresAssignment = course.hasProjectWork || course.hasPracticalSubmission;

  const examSatisfied = !requiresExam || progress.examPassed;
  const assignmentSatisfied = !requiresAssignment || (progress.assignmentStatus === "submitted" || progress.assignmentStatus === "approved");

  const isCompleted = percent === 100 && examUnlocked && examSatisfied && assignmentSatisfied;

  return {
    percent,
    completedLessonsCount,
    totalLessonsCount,
    completedModulesCount,
    completedModuleIds,
    totalModulesCount,
    isExamUnlocked: examUnlocked,
    isCompleted,
  };
}

import { apiConfig } from "./config";
import { apiClient } from "./client";

export const progressService = {
  load: async (courseSlug: string): Promise<UserCourseProgress> => {
    if (apiConfig.useMockData) {
      return loadUserProgress(courseSlug);
    }
    try {
      return await apiClient.get<UserCourseProgress>(`/me/courses/${courseSlug}/progress`);
    } catch (err) {
      if (apiConfig.mockFallback) {
        return loadUserProgress(courseSlug);
      }
      throw err;
    }
  },

  save: async (progress: UserCourseProgress): Promise<void> => {
    saveUserProgress(progress);
    if (!apiConfig.useMockData) {
      try {
        await apiClient.put(`/me/courses/${progress.courseSlug}/progress`, progress);
      } catch (err) {
        console.warn("[progressService.save] Failed to sync progress to live backend", err);
      }
    }
  },

  toggleLesson: async (courseSlug: string, moduleId: string, lessonId: string, lessons: LessonReference[]): Promise<UserCourseProgress> => {
    if (apiConfig.useMockData) {
      return toggleLessonCompletion(courseSlug, moduleId, lessonId, lessons);
    }
    try {
      const result = await apiClient.post<UserCourseProgress>(`/me/courses/${courseSlug}/lessons/${lessonId}/toggle`, {
        moduleId,
      });
      // Synchronize with local storage as secondary cache
      saveUserProgress(result);
      return result;
    } catch (err) {
      if (apiConfig.mockFallback) {
        console.warn(`[progressService.toggleLesson] Live API unavailable, toggling locally`, err);
        return toggleLessonCompletion(courseSlug, moduleId, lessonId, lessons);
      }
      throw err;
    }
  },

  recordExam: async (courseSlug: string, scorePercent: number, passed: boolean): Promise<UserCourseProgress> => {
    if (apiConfig.useMockData) {
      return recordExamCompletion(courseSlug, scorePercent, passed);
    }
    try {
      const result = await apiClient.post<UserCourseProgress>(`/me/courses/${courseSlug}/exam/record`, {
        scorePercent,
        passed,
      });
      saveUserProgress(result);
      return result;
    } catch (err) {
      if (apiConfig.mockFallback) {
        return recordExamCompletion(courseSlug, scorePercent, passed);
      }
      throw err;
    }
  },

  recordAssignment: async (courseSlug: string, status: AssignmentStatus): Promise<UserCourseProgress> => {
    if (apiConfig.useMockData) {
      return recordAssignmentStatus(courseSlug, status);
    }
    try {
      const result = await apiClient.post<UserCourseProgress>(`/me/courses/${courseSlug}/assignment/status`, {
        status,
      });
      saveUserProgress(result);
      return result;
    } catch (err) {
      if (apiConfig.mockFallback) {
        return recordAssignmentStatus(courseSlug, status);
      }
      throw err;
    }
  },

  calculate: async (course: Course, progress: UserCourseProgress, modules: CourseModule[], lessons: LessonReference[]) =>
    calculateCourseProgress(course, progress, modules, lessons),
  isExamUnlocked: async (modules: CourseModule[], lessons: LessonReference[], progress: UserCourseProgress): Promise<boolean> =>
    isExamUnlocked(modules, lessons, progress),
};
