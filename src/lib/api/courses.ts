import "server-only";

import { cache } from "react";
import type { Course, CourseFact } from "./types";
import { courseRecord, parseCatalogCourse, requestCourseApi } from "./course-api-server";

type CourseDetailState =
  | { status: "ready"; course: Course }
  | { status: "not_found" }
  | { status: "error" };

function nonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function nonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function parseCourse(payload: unknown, slug: string): Course | null {
  const envelope = courseRecord(payload);
  const course = courseRecord(envelope?.data);
  const catalog = parseCatalogCourse(course);
  if (envelope?.success !== true || !course || !catalog || catalog.slug !== slug ||
      (course.level !== 1 && course.level !== 2 && course.level !== 3) ||
      typeof course.subtitle !== "string" || typeof course.description !== "string" ||
      typeof course.longDescription !== "string" || typeof course.duration !== "string" ||
      typeof course.mode !== "string" || typeof course.certification !== "string" ||
      typeof course.access !== "string" || typeof course.badgeText !== "string" ||
      !nonNegativeNumber(course.price) || !nonNegativeNumber(course.originalPrice) ||
      !nonNegativeInteger(course.modulesCount) || !nonNegativeInteger(course.totalLessonsCount) ||
      typeof course.hasPractical !== "boolean" || typeof course.hasExam !== "boolean" ||
      typeof course.hasProjectWork !== "boolean" || typeof course.hasPracticalSubmission !== "boolean" ||
      !Array.isArray(course.facts) || !Array.isArray(course.topics) ||
      !course.topics.every((topic: unknown) => typeof topic === "string") ||
      (course.practicalType !== null && course.practicalType !== undefined &&
       typeof course.practicalType !== "string")) return null;

  const facts: CourseFact[] = [];
  for (const value of course.facts) {
    const fact = courseRecord(value);
    if (!fact || typeof fact.label !== "string" || typeof fact.value !== "string" ||
        typeof fact.icon !== "string") return null;
    facts.push({ icon: fact.icon, label: fact.label, value: fact.value });
  }

  return {
    ...catalog,
    level: course.level,
    subtitle: course.subtitle,
    description: course.description,
    longDescription: course.longDescription,
    duration: course.duration,
    mode: course.mode,
    certification: course.certification,
    access: course.access,
    price: course.price,
    originalPrice: course.originalPrice,
    badgeText: course.badgeText,
    facts,
    topics: course.topics as string[],
    modulesCount: course.modulesCount,
    totalLessonsCount: course.totalLessonsCount,
    hasPractical: course.hasPractical,
    hasExam: course.hasExam,
    hasProjectWork: course.hasProjectWork,
    hasPracticalSubmission: course.hasPracticalSubmission,
    practicalType: typeof course.practicalType === "string" ? course.practicalType : null,
  };
}

// Request-scoped memoization shares the verified response between metadata and page.
export const getCourseDetail = cache(async (slug: string, locale: string): Promise<CourseDetailState> => {
  if (!/^[a-z0-9-]+$/.test(slug)) return { status: "not_found" };
  const response = await requestCourseApi(`courses/${slug}`, locale === "en" ? "en" : "it");
  if (response.status !== "ready") return response;
  const course = parseCourse(response.payload, slug);
  return course ? { status: "ready", course } : { status: "error" };
});
