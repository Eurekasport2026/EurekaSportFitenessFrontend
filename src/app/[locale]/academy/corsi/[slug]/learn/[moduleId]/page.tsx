import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getCourseDetail } from "@/lib/api/courses";
import { getModuleById } from "@/lib/api/modules";
import { getLessonsByModule, getAdjacentLessons } from "@/lib/api/lessons";
import { HomeHeader } from "@/components/layout/HomeHeader";
import { LessonView } from "@/components/features/courses/LessonView";
import { CoursePageState } from "@/components/features/courses/CoursePageState";
import { cn } from "@/lib/utils";
import homeStyles from "@/components/features/home/home.module.css";
import styles from "@/components/features/courses/lesson-view.module.css";

interface PageProps {
  params: Promise<{ locale: string; slug: string; moduleId: string }>;
  searchParams: Promise<{ lesson?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug, moduleId } = await params;
  const moduleResult = await getModuleById(moduleId, locale);

  if (moduleResult.status !== "ready" || moduleResult.data.courseSlug !== slug) {
    return {
      title: moduleResult.status === "error"
        ? locale === "en" ? "Module Unavailable | Eureka! Academy" : "Modulo non disponibile | Eureka! Academy"
        : locale === "en" ? "Module Not Found | Eureka! Academy" : "Modulo non trovato | Eureka! Academy",
      robots: { index: false, follow: false },
    };
  }
  const moduleItem = moduleResult.data;
  const result = await getCourseDetail(slug, locale);
  if (result.status !== "ready") {
    return {
      title: result.status === "error"
        ? locale === "en" ? "Course Unavailable | Eureka! Academy" : "Corso non disponibile | Eureka! Academy"
        : locale === "en" ? "Course Not Found | Eureka! Academy" : "Corso non trovato | Eureka! Academy",
      robots: { index: false, follow: false },
    };
  }
  const { course } = result;

  return {
    title: `${locale === "en" ? "Module" : "Modulo"} ${moduleItem.number}: ${moduleItem.title} – ${course.title} | Eureka! Academy`,
    description: moduleItem.description,
  };
}

export default async function ModuleDetailPage({ params, searchParams }: PageProps) {
  const { locale, slug, moduleId } = await params;
  const { lesson: lessonId } = await searchParams;
  setRequestLocale(locale);

  const [moduleResult, result] = await Promise.all([
    getModuleById(moduleId, locale),
    getCourseDetail(slug, locale),
  ]);
  if (result.status === "not_found") notFound();
  if (result.status === "error") return <CoursePageState mode="error" />;
  if (moduleResult.status === "error") return <CoursePageState mode="error" resource="curriculum" />;
  if (moduleResult.status === "not_found" || moduleResult.data.courseSlug !== slug) notFound();
  const moduleItem = moduleResult.data;
  const { course } = result;

  const lessonsResult = await getLessonsByModule(moduleId, locale);
  if (lessonsResult.status !== "ready") return <CoursePageState mode="error" resource="curriculum" />;
  const lessons = lessonsResult.data;
  if (lessons.some((lesson) => lesson.courseSlug !== slug) || lessons.length !== moduleItem.lessonsCount) {
    return <CoursePageState mode="error" resource="curriculum" />;
  }
  if (lessonId && !lessons.some((lesson) => lesson.id === lessonId)) notFound();
  const activeLessonId = lessonId || lessons[0]?.id;
  const adjacentResult = activeLessonId ? await getAdjacentLessons(activeLessonId, slug, locale) : undefined;
  if (adjacentResult && adjacentResult.status !== "ready") return <CoursePageState mode="error" resource="curriculum" />;
  const { prevLesson, nextLesson } = adjacentResult?.status === "ready" ? adjacentResult.data : {};

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
