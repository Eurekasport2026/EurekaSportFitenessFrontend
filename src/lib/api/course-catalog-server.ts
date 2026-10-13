import "server-only";

import type { CatalogCourse, CourseCatalogState } from "./types";
import { courseRecord, parseCatalogCourse, requestCourseApi } from "./course-api-server";

function parseCatalog(payload: unknown): CatalogCourse[] | null {
  const envelope = courseRecord(payload);
  if (envelope?.success !== true || !Array.isArray(envelope.data)) return null;

  const courses: CatalogCourse[] = [];
  const ids = new Set<string>();
  const slugs = new Set<string>();

  for (const value of envelope.data) {
    const course = parseCatalogCourse(value);
    if (!course || ids.has(course.id) || slugs.has(course.slug)) return null;

    ids.add(course.id);
    slugs.add(course.slug);
    courses.push(course);
  }

  return courses;
}

export async function getCourseCatalog(locale: "it" | "en"): Promise<CourseCatalogState> {
  const response = await requestCourseApi("courses", locale);
  if (response.status !== "ready") return { status: "error" };
  const courses = parseCatalog(response.payload);
  return courses ? { status: "ready", courses } : { status: "error" };
}
