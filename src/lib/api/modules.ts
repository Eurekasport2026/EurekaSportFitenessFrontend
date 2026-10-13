import "server-only";

import { cache } from "react";
import { curriculumId, getCurriculumData, parseCourseModule, parseCurriculumList } from "./curriculum-api-server";
import type { AcademyDataState, CourseModule } from "./types";

export const getModulesByCourse = cache(async (
  courseSlug: string,
  locale: string = "it",
): Promise<AcademyDataState<CourseModule[]>> => {
  if (!/^[a-z0-9-]+$/.test(courseSlug)) return { status: "not_found" };
  return getCurriculumData(`courses/${courseSlug}/modules`, locale, (value) => {
    const modules = parseCurriculumList(value, parseCourseModule);
    if (!modules || modules.some((module) => module.courseSlug !== courseSlug)) return null;
    return modules.sort((a, b) => a.number - b.number);
  });
});

export const getModuleById = cache(async (
  moduleId: string,
  locale: string = "it",
): Promise<AcademyDataState<CourseModule>> => {
  if (!curriculumId(moduleId)) return { status: "not_found" };
  return getCurriculumData(`modules/${moduleId}`, locale, (value) => {
    const module = parseCourseModule(value);
    return module?.id === moduleId ? module : null;
  });
});

export const getAllModules = cache(async (
  locale: string = "it",
): Promise<AcademyDataState<CourseModule[]>> => {
  return getCurriculumData("modules", locale, (value) =>
    parseCurriculumList(value, parseCourseModule),
  );
});

