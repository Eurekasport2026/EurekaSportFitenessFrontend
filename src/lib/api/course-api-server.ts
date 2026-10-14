import "server-only";

import { cookies } from "next/headers";

import { connection } from "next/server";
import type { CatalogCourse } from "./types";

const apiBase = (
  process.env.EUREKA_COURSES_API_URL ||
  process.env.EUREKA_AUTH_API_URL ||
  "https://api-production-c166.up.railway.app/api/v1"
).replace(/\/+$/, "");

export function courseRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function imageSource(value: string): boolean {
  if (/[\u0000-\u001f\u007f\\]/.test(value)) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function parseCatalogCourse(value: unknown): CatalogCourse | null {
  const course = courseRecord(value);
  if (!course || typeof course.id !== "string" || !course.id.trim() ||
      typeof course.slug !== "string" || !/^[a-z0-9-]+$/.test(course.slug) ||
      typeof course.title !== "string" || !course.title.trim() ||
      typeof course.category !== "string" || !course.category.trim()) return null;

  const heroImage = typeof course.heroImage === "string" && imageSource(course.heroImage)
    ? course.heroImage
    : "";

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    category: course.category,
    heroImage,
    description: typeof course.description === "string" ? course.description : undefined,
  };
}

type CourseApiResponse =
  | { status: "ready"; payload: unknown }
  | { status: "not_found" }
  | { status: "error" };

export async function requestCourseApi(
  path: string,
  locale: "it" | "en",
  extraParams?: Record<string, string | undefined>,
): Promise<CourseApiResponse> {
  // Keep Next.js request-time control flow outside application error handling.
  await connection();
  try {
    if (!/^(?:courses(?:\/[a-z0-9-]+(?:\/(?:modules|videos))?)?|modules(?:\/[A-Za-z0-9_-]+(?:\/(?:lessons|videos))?)?|lessons(?:\/[A-Za-z0-9_-]+(?:\/adjacent)?)?|videos(?:\/[A-Za-z0-9_-]+)?)$/.test(path)) return { status: "error" };
    const url = new URL(`${apiBase}/${path}`);
    url.searchParams.set("locale", locale);
    if (extraParams) {
      for (const [key, val] of Object.entries(extraParams)) {
        if (typeof val === "string" && val.trim()) {
          url.searchParams.set(key, val.trim());
        }
      }
    }
    const token = (await cookies()).get("eureka_access_token")?.value;
    const headers: Record<string, string> = { Accept: "application/json", "Accept-Language": locale };
    if (token && token.length <= 3500 && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(url, {
      headers,
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });
    if (response.status !== 200 && response.status !== 404) return { status: "error" };
    const payload: unknown = await response.json();
    if (response.status === 404) {
      const error = courseRecord(payload);
      return error?.success === false && error.code === "NOT_FOUND"
        ? { status: "not_found" }
        : { status: "error" };
    }
    return { status: "ready", payload };
  } catch {
    return { status: "error" };
  }
}
