import type { Course, CourseModule, LessonReference, UserCourseProgress } from "./types";
import { learningService } from "./learning";

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
  const assignmentSatisfied = !requiresAssignment || progress.assignmentStatus === "approved";

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

export const progressService = {
  load: learningService.progress,
  enroll: learningService.enroll,
  toggleLesson: async (courseSlug: string, _moduleId: string, lessonId: string, _lessons: LessonReference[]) => {
    let current = await learningService.progress(courseSlug);
    if (!current.enrolled) current = await learningService.enroll(courseSlug);
    return learningService.lesson(courseSlug, lessonId, !current.completedLessonIds.includes(lessonId));
  },
  calculate: async (course: Course, progress: UserCourseProgress, modules: CourseModule[], lessons: LessonReference[]) =>
    calculateCourseProgress(course, progress, modules, lessons),
  isExamUnlocked: async (modules: CourseModule[], lessons: LessonReference[], progress: UserCourseProgress) =>
    isExamUnlocked(modules, lessons, progress),
};
