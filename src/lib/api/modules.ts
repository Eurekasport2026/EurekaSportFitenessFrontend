import type { CourseModule } from "./types";
import itModules from "./data/it/modules.json";
import enModules from "./data/en/modules.json";

const modulesData: Record<string, CourseModule[]> = {
  it: itModules as unknown as CourseModule[],
  en: enModules as unknown as CourseModule[],
};

export const courseModules: CourseModule[] = modulesData.it;

export function getAllModules(locale: string = "it"): CourseModule[] {
  return modulesData[locale] || modulesData.it;
}

export function getModulesByCourse(courseSlug: string, locale: string = "it"): CourseModule[] {
  return getAllModules(locale).filter((m) => m.courseSlug === courseSlug);
}

export function getModuleById(moduleId: string, locale: string = "it"): CourseModule | undefined {
  return getAllModules(locale).find((m) => m.id === moduleId);
}
