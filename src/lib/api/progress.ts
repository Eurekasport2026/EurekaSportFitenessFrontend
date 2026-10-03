import type { UserCourseProgress, AssignmentStatus } from "./types";
import { getModulesByCourse } from "./modules";
import { getLessonsByModule } from "./lessons";
import { getCourseBySlug } from "./courses";

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
  lessonId: string
): UserCourseProgress {
  const progress = loadUserProgress(courseSlug);
  const exists = progress.completedLessonIds.includes(lessonId);

  if (exists) {
    progress.completedLessonIds = progress.completedLessonIds.filter((id) => id !== lessonId);
  } else {
    progress.completedLessonIds.push(lessonId);
  }

  // Exact module completion validation
  const moduleLessons = getLessonsByModule(moduleId);
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

export function isExamUnlocked(courseSlug: string, progress: UserCourseProgress): boolean {
  const modules = getModulesByCourse(courseSlug);
  if (modules.length === 0) return true;
  return modules.every((m) => progress.completedModuleIds.includes(m.id));
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
  isExamUnlocked: boolean;
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
  const examUnlocked = totalModulesCount > 0 && completedModulesCount === totalModulesCount;

  const course = getCourseBySlug(courseSlug);
  const requiresExam = course ? course.hasExam : true;
  const requiresAssignment = course ? (course.hasProjectWork || course.hasPracticalSubmission) : false;

  const examSatisfied = !requiresExam || progress.examPassed;
  const assignmentSatisfied = !requiresAssignment || (progress.assignmentStatus === "submitted" || progress.assignmentStatus === "approved");

  const isCompleted = percent === 100 && examSatisfied && assignmentSatisfied;

  return {
    percent,
    completedLessonsCount,
    totalLessonsCount,
    completedModulesCount,
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

  toggleLesson: async (courseSlug: string, moduleId: string, lessonId: string): Promise<UserCourseProgress> => {
    if (apiConfig.useMockData) {
      return toggleLessonCompletion(courseSlug, moduleId, lessonId);
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
        return toggleLessonCompletion(courseSlug, moduleId, lessonId);
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

  calculate: async (courseSlug: string, progress: UserCourseProgress) => calculateCourseProgress(courseSlug, progress),
  isExamUnlocked: async (courseSlug: string, progress: UserCourseProgress): Promise<boolean> => isExamUnlocked(courseSlug, progress),
};
