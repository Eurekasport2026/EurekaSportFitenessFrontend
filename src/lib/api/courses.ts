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
