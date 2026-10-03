import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getCourseBySlug } from "@/lib/api/courses";
import { getModuleById, courseModules } from "@/lib/api/modules";
import { getLessonsByModule, getAdjacentLessons } from "@/lib/api/lessons";
import { HomeHeader } from "@/components/layout/HomeHeader";
import { LessonView } from "@/components/features/courses/LessonView";
import { cn } from "@/lib/utils";
import homeStyles from "@/components/features/home/home.module.css";
import styles from "@/components/features/courses/lesson-view.module.css";

interface PageProps {
  params: Promise<{ locale: string; slug: string; moduleId: string }>;
  searchParams: Promise<{ lesson?: string }>;
}

export function generateStaticParams() {
  return courseModules.map((m) => ({
    slug: m.courseSlug,
    moduleId: m.id,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug, moduleId } = await params;
  const course = getCourseBySlug(slug, locale);
  const moduleItem = getModuleById(moduleId, locale);

  if (!course || !moduleItem) {
    return {
      title: locale === "en" ? "Module Not Found | Eureka! Academy" : "Modulo non trovato | Eureka! Academy",
    };
  }

  return {
    title: `${locale === "en" ? "Module" : "Modulo"} ${moduleItem.number}: ${moduleItem.title} – ${course.title} | Eureka! Academy`,
    description: moduleItem.description,
  };
}

export default async function ModuleDetailPage({ params, searchParams }: PageProps) {
  const { locale, slug, moduleId } = await params;
  const { lesson: lessonId } = await searchParams;
  setRequestLocale(locale);

  const course = getCourseBySlug(slug, locale);
  const moduleItem = getModuleById(moduleId, locale);

  if (!course || !moduleItem) {
    notFound();
  }

  const lessons = getLessonsByModule(moduleId, locale);
  const activeLessonId = lessonId || (lessons[0]?.id ?? undefined);
  const { prevLesson, nextLesson } = activeLessonId
    ? getAdjacentLessons(activeLessonId, locale)
    : {};

  return (
    <div className={cn(homeStyles.page, styles.page)}>
      <HomeHeader activePage="academy" />
      <main id="main">
        <LessonView
          course={course}
          module={moduleItem}
          lessons={lessons}
          initialLessonId={activeLessonId}
          prevLesson={prevLesson}
          nextLesson={nextLesson}
        />
      </main>
    </div>
  );
}
