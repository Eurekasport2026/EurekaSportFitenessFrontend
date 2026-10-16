export interface CourseResource {
  id: string; lesson_id: string | null; language: "it" | "en" | null;
  kind: "video" | "pdf"; title: string; url: string; position: number;
  published: boolean; revision: number; legacy: boolean;
}
export interface ResourceWrite {
  lesson_id: string | null; language: "it" | "en"; kind: "video" | "pdf";
  title: string; url: string; position: number; published: boolean;
}
export interface TrainerCourseSummary {
  slug: string; title: string; category: string; description: string; hero_image: string;
  level: number; module_count: number; item_count: number;
}
export interface TrainerCoursePage { items: TrainerCourseSummary[]; total: number; offset: number; limit: number }
export interface TrainerModuleSummary { id: string; number: number; title: string; description: string; type: string; item_count: number }
export interface TrainerCourseDetail { course: TrainerCourseSummary; modules: TrainerModuleSummary[] }
export interface TrainerCourseItem {
  id: string; order: number; title: string; description: string; summary: string;
  item_type: string; duration_minutes: number; resources: CourseResource[];
}
export interface TrainerModuleDetail {
  course: TrainerCourseSummary; module: TrainerModuleSummary; resources: CourseResource[]; items: TrainerCourseItem[];
}

export const trainerCourseHref = (slug: string) => ({ pathname: "/trainer/courses/[slug]" as const, params: { slug } });
export const trainerModuleHref = (slug: string, moduleId: string) => ({ pathname: "/trainer/courses/[slug]/modules/[moduleId]" as const, params: { slug, moduleId } });
export const trainerExerciseHref = (slug: string, moduleId: string, exerciseId: string) => ({ pathname: "/trainer/courses/[slug]/modules/[moduleId]/exercises/[exerciseId]" as const, params: { slug, moduleId, exerciseId } });
export const trainerLessonHref = (slug: string, moduleId: string, lessonId: string) => ({ pathname: "/trainer/courses/[slug]/modules/[moduleId]/lessons/[lessonId]" as const, params: { slug, moduleId, lessonId } });
export const trainerItemHref = (slug: string, moduleId: string, item: Pick<TrainerCourseItem, "id" | "item_type">) =>
  item.item_type === "exercise_card" ? trainerExerciseHref(slug, moduleId, item.id) : trainerLessonHref(slug, moduleId, item.id);

export function safeResourceHref(value: string): string | null {
  if (!value || /[\s\u0000-\u001f\u007f\\]/.test(value)) return null;
  try {
    if (value.startsWith("/") && !value.startsWith("//")) {
      const path = value.split(/[?#]/)[0];
      return path.split("/").some(part => part === "." || part === "..") ? null : value;
    }
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function trainerVideoEmbed(value: string): string | null {
  if (!safeResourceHref(value) || value.startsWith("/")) return null;
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  if (host === "player.vimeo.com" && /^\/video\/\d+\/?$/.test(url.pathname)) {
    url.searchParams.set("autoplay", "0"); url.searchParams.set("dnt", "1"); return url.href;
  }
  if (["vimeo.com", "www.vimeo.com"].includes(host)) {
    const match = /^\/(\d+)(?:\/([a-zA-Z0-9]+))?\/?$/.exec(url.pathname);
    if (match) {
      const embed = new URL(`https://player.vimeo.com/video/${match[1]}`);
      const hash = match[2] ?? url.searchParams.get("h");
      if (hash) embed.searchParams.set("h", hash);
      embed.searchParams.set("dnt", "1"); return embed.href;
    }
  }
  const youtube = ["www.youtube.com", "youtube.com", "www.youtube-nocookie.com", "youtube-nocookie.com"].includes(host);
  const id = host === "youtu.be" ? url.pathname.slice(1) : youtube ? (url.pathname === "/watch" ? url.searchParams.get("v") : /^\/embed\/([^/]+)$/.exec(url.pathname)?.[1]) : null;
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}
