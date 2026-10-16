import "server-only";

import { cache } from "react";
import { courseRecord } from "./course-api-server";
import { curriculumId, getCurriculumData, parseCurriculumList, parseLesson } from "./curriculum-api-server";
import { parseCourseModule } from "./curriculum-api-server";
import type { AcademyDataState, CourseModule, Lesson, LessonReference } from "./types";

export interface CourseCurriculum {
  modules: CourseModule[];
  lessons: LessonReference[];
}

export const getAllLessons = cache(async (
  locale: string = "it",
): Promise<AcademyDataState<Lesson[]>> => {
  return getCurriculumData("lessons", locale, (value) => parseCurriculumList(value, parseLesson));
});

export const getLessonsByModule = cache(async (
  moduleId: string,
  locale: string = "it",
): Promise<AcademyDataState<Lesson[]>> => {
  if (!curriculumId(moduleId)) return { status: "not_found" };
  return getCurriculumData(`modules/${moduleId}/lessons`, locale, (value) => {
    const lessons = parseCurriculumList(value, parseLesson);
    if (!lessons || lessons.some((lesson) => lesson.moduleId !== moduleId)) return null;
    return lessons.sort((a, b) => a.order - b.order);
  });
});

export const getLessonById = cache(async (
  lessonId: string,
  locale: string = "it",
): Promise<AcademyDataState<Lesson>> => {
  if (!curriculumId(lessonId)) return { status: "not_found" };
  return getCurriculumData(`lessons/${lessonId}`, locale, (value) => {
    const lesson = parseLesson(value);
    return lesson?.id === lessonId ? lesson : null;
  });
});

export const getAdjacentLessons = cache(async (
  lessonId: string,
  courseSlug: string,
  locale: string = "it",
): Promise<AcademyDataState<{ prevLesson?: Lesson; nextLesson?: Lesson }>> => {
  if (!curriculumId(lessonId)) return { status: "not_found" };
  return getCurriculumData(`lessons/${lessonId}/adjacent`, locale, (value) => {
    const data = courseRecord(value);
    if (!data) return null;
    const prevLesson = data.prevLesson == null ? undefined : parseLesson(data.prevLesson);
    const nextLesson = data.nextLesson == null ? undefined : parseLesson(data.nextLesson);
    if (prevLesson === null || nextLesson === null ||
        (prevLesson && (prevLesson.courseSlug !== courseSlug || prevLesson.id === lessonId)) ||
        (nextLesson && (nextLesson.courseSlug !== courseSlug || nextLesson.id === lessonId))) return null;
    return { prevLesson, nextLesson };
  });
});

function parseLessonReference(value: unknown): LessonReference | null {
  const lesson = courseRecord(value);
  if (!lesson || !curriculumId(lesson.id) || !curriculumId(lesson.moduleId) || !curriculumId(lesson.courseSlug)) return null;
  return { id: lesson.id, moduleId: lesson.moduleId, courseSlug: lesson.courseSlug };
}

export const getCourseCurriculum = cache(async (
  courseSlug: string,
  locale: string = "it",
): Promise<AcademyDataState<CourseCurriculum>> => {
  if (!/^[a-z0-9-]+$/.test(courseSlug)) return { status: "not_found" };
  const response = await getCurriculumData(`courses/${courseSlug}/curriculum`, locale, value => {
    const data = courseRecord(value);
    if (!data) return null;
    const modules = parseCurriculumList(data.modules, parseCourseModule);
    const lessons = parseCurriculumList(data.lessons, parseLessonReference);
    if (!modules || !lessons || modules.some(module => module.courseSlug !== courseSlug)) return null;
    const moduleIds = new Set(modules.map(module => module.id));
    if (lessons.some(lesson => lesson.courseSlug !== courseSlug || !moduleIds.has(lesson.moduleId))) return null;
    const lessonCounts = new Map<string, number>();
    for (const lesson of lessons) lessonCounts.set(lesson.moduleId, (lessonCounts.get(lesson.moduleId) ?? 0) + 1);
    if (modules.some(module => (lessonCounts.get(module.id) ?? 0) !== module.lessonsCount)) return null;
    return { modules: modules.sort((a, b) => a.number - b.number), lessons };
  });
  return response;
});
