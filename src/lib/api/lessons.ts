import "server-only";

import { cache } from "react";
import { courseRecord } from "./course-api-server";
import { curriculumId, getCurriculumData, parseCurriculumList, parseLesson } from "./curriculum-api-server";
import { getModulesByCourse } from "./modules";
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

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const currentIndex = index++;
      results[currentIndex] = await fn(items[currentIndex]);
    }
  });
  await Promise.all(workers);
  return results;
}

export const getCourseCurriculum = cache(async (
  courseSlug: string,
  locale: string = "it",
): Promise<AcademyDataState<CourseCurriculum>> => {
  if (!/^[a-z0-9-]+$/.test(courseSlug)) return { status: "not_found" };

  const modulesResult = await getModulesByCourse(courseSlug, locale);
  if (modulesResult.status !== "ready") return modulesResult;
  const modules = modulesResult.data;

  if (modules.length === 0) {
    return { status: "ready", data: { modules: [], lessons: [] } };
  }

  const moduleLessonResults = await mapWithConcurrency(
    modules,
    3,
    (m) => getLessonsByModule(m.id, locale),
  );

  const allLessonRefs: LessonReference[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < modules.length; i++) {
    const mod = modules[i];
    const modLessonsRes = moduleLessonResults[i];
    if (modLessonsRes.status !== "ready") {
      return { status: "error" };
    }

    const modLessons = modLessonsRes.data;
    if (
      modLessons.length !== mod.lessonsCount ||
      modLessons.some((l) => l.moduleId !== mod.id || l.courseSlug !== courseSlug)
    ) {
      return { status: "error" };
    }

    for (const l of modLessons) {
      if (seenIds.has(l.id)) return { status: "error" };
      seenIds.add(l.id);
      allLessonRefs.push({ id: l.id, moduleId: l.moduleId, courseSlug: l.courseSlug });
    }
  }

  return {
    status: "ready",
    data: {
      modules,
      lessons: allLessonRefs,
    },
  };
});
