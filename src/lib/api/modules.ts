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

import { apiConfig } from "./config";
import { apiClient } from "./client";

export const modulesService = {
  getAll: async (locale: string = "it"): Promise<CourseModule[]> => {
    if (apiConfig.useMockData) {
      return getAllModules(locale);
    }
    try {
      return await apiClient.get<CourseModule[]>("/modules", { locale });
    } catch (err) {
      if (apiConfig.mockFallback) {
        console.warn("[modulesService.getAll] Live API unavailable, falling back to mock dataset", err);
        return getAllModules(locale);
      }
      throw err;
    }
  },

  getByCourse: async (courseSlug: string, locale: string = "it"): Promise<CourseModule[]> => {
    if (apiConfig.useMockData) {
      return getModulesByCourse(courseSlug, locale);
    }
    try {
      return await apiClient.get<CourseModule[]>(`/courses/${courseSlug}/modules`, { locale });
    } catch (err) {
      if (apiConfig.mockFallback) {
        console.warn(`[modulesService.getByCourse] Live API unavailable for ${courseSlug}, falling back to mock dataset`, err);
        return getModulesByCourse(courseSlug, locale);
      }
      throw err;
    }
  },

  getById: async (moduleId: string, locale: string = "it"): Promise<CourseModule | undefined> => {
    if (apiConfig.useMockData) {
      return getModuleById(moduleId, locale);
    }
    try {
      return await apiClient.get<CourseModule>(`/modules/${moduleId}`, { locale });
    } catch (err) {
      if (apiConfig.mockFallback) {
        console.warn(`[modulesService.getById] Live API unavailable for ${moduleId}, falling back to mock dataset`, err);
        return getModuleById(moduleId, locale);
      }
      throw err;
    }
  },
};
