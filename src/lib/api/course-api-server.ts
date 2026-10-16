import "server-only";

import { connection } from "next/server";
import type { CatalogCourse } from "./types";
import { backendApiBase } from "./backend-config";

const apiBase = backendApiBase;

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

function coursePathLabel(path: string) {
  return `/${path}`.replace(/\/(courses|modules|lessons|videos)\/[^/]+/g, "/$1/:id");
}

export async function requestCourseApi(
  path: string,
  locale: "it" | "en",
  extraParams?: Record<string, string | undefined>,
): Promise<CourseApiResponse> {
  // Keep Next.js request-time control flow outside application error handling.
  await connection();
  const started = performance.now();
  let headersMs = 0;
  let jsonMs = 0;
  let status = 0;
  let failure: "timeout" | "network" | undefined;
  const signal = AbortSignal.timeout(8000);
  try {
    if (!/^(?:courses(?:\/[a-z0-9-]+(?:\/(?:curriculum|modules|videos|exam))?)?|modules(?:\/[A-Za-z0-9_-]+(?:\/(?:lessons|videos))?)?|lessons(?:\/[A-Za-z0-9_-]+(?:\/adjacent)?)?|videos(?:\/[A-Za-z0-9_-]+)?)$/.test(path)) return { status: "error" };
    const url = new URL(`${apiBase}/${path}`);
    url.searchParams.set("locale", locale);
    if (extraParams) {
      for (const [key, val] of Object.entries(extraParams)) {
        if (typeof val === "string" && val.trim()) {
          url.searchParams.set(key, val.trim());
        }
      }
    }
    const headers: Record<string, string> = { Accept: "application/json", "Accept-Language": locale };
    const response = await fetch(url, {
      headers,
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
      signal,
    });
    headersMs = performance.now() - started;
    status = response.status;
    if (response.status !== 200 && response.status !== 404) return { status: "error" };
    const jsonStarted = performance.now();
    const payload: unknown = await response.json();
    jsonMs = performance.now() - jsonStarted;
    if (response.status === 404) {
      const error = courseRecord(payload);
      return error?.success === false && error.code === "NOT_FOUND"
        ? { status: "not_found" }
        : { status: "error" };
    }
    return { status: "ready", payload };
  } catch {
    failure = signal.reason?.name === "TimeoutError" ? "timeout" : "network";
    return { status: "error" };
  } finally {
    const totalMs = performance.now() - started;
    if (process.env.NODE_ENV !== "production" || process.env.EUREKA_API_TIMING === "1" || totalMs >= 1000 || status >= 500) {
      console.info("[academy-timing]", JSON.stringify({
        method: "GET", path: coursePathLabel(path), status: status || undefined,
        totalMs: Math.round(totalMs), headersMs: Math.round(headersMs), jsonMs: Math.round(jsonMs), failure,
      }));
    }
  }
}
