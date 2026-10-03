import type { Course } from "./types";
import itCourses from "./data/it/courses.json";
import enCourses from "./data/en/courses.json";

const coursesData: Record<string, Course[]> = {
  it: itCourses as unknown as Course[],
  en: enCourses as unknown as Course[],
};

export const courses: Course[] = coursesData.it;

export function getAllCourses(locale: string = "it"): Course[] {
  return coursesData[locale] || coursesData.it;
}

export function getCourseBySlug(slug: string, locale: string = "it"): Course | undefined {
  const list = getAllCourses(locale);
  return list.find((c) => c.slug === slug);
}

import { apiConfig } from "./config";
import { apiClient } from "./client";

export const coursesService = {
  getAll: async (locale: string = "it"): Promise<Course[]> => {
    if (apiConfig.useMockData) {
      return getAllCourses(locale);
    }
    try {
      return await apiClient.get<Course[]>("/courses", { locale });
    } catch (err) {
      if (apiConfig.mockFallback) {
        console.warn("[coursesService.getAll] Live API unavailable, falling back to mock dataset", err);
        return getAllCourses(locale);
      }
      throw err;
    }
  },

  getBySlug: async (slug: string, locale: string = "it"): Promise<Course | undefined> => {
    if (apiConfig.useMockData) {
      return getCourseBySlug(slug, locale);
    }
    try {
      return await apiClient.get<Course>(`/courses/${slug}`, { locale });
    } catch (err) {
      if (apiConfig.mockFallback) {
        console.warn(`[coursesService.getBySlug] Live API unavailable for ${slug}, falling back to mock dataset`, err);
        return getCourseBySlug(slug, locale);
      }
      throw err;
    }
  },
};
