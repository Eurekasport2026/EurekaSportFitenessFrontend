import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getCourseDetail } from "@/lib/api/courses";
import { getModulesByCourse } from "@/lib/api/modules";
import { CourseDetailDynamic } from "@/components/features/courses/CourseDetailDynamic";
import { CoursePageState } from "@/components/features/courses/CoursePageState";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const result = await getCourseDetail(slug, locale);

  if (result.status !== "ready") {
    return {
      title: result.status === "not_found"
        ? locale === "en" ? "Course Not Found | Eureka! Academy" : "Corso non trovato | Eureka! Academy"
        : locale === "en" ? "Course Unavailable | Eureka! Academy" : "Corso non disponibile | Eureka! Academy",
      robots: { index: false, follow: false },
    };
  }
  const { course } = result;

  return {
    title: `${course.title} | Eureka! Academy`,
    description: course.description,
  };
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [result, modulesResult] = await Promise.all([
    getCourseDetail(slug, locale),
    getModulesByCourse(slug, locale),
  ]);

  if (result.status === "not_found") notFound();
  if (result.status === "error") return <CoursePageState mode="error" />;
  const { course } = result;

  return (
    <CourseDetailDynamic
      course={course}
      modules={modulesResult.status === "ready" ? modulesResult.data : null}
      modulesError={modulesResult.status !== "ready"}
    />
  );
}
