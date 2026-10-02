import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { courses, getCourseBySlug } from "@/lib/api/courses";
import { getModulesByCourse } from "@/lib/api/modules";
import { CourseDetailDynamic } from "@/components/features/courses/CourseDetailDynamic";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export function generateStaticParams() {
  return courses.map((course) => ({
    slug: course.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const course = getCourseBySlug(slug, locale);

  if (!course) {
    return {
      title: locale === "en" ? "Course Not Found | Eureka! Academy" : "Corso non trovato | Eureka! Academy",
    };
  }

  return {
    title: `${course.title} | Eureka! Academy`,
    description: course.description,
  };
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const course = getCourseBySlug(slug, locale);
  if (!course) {
    notFound();
  }

  const modules = getModulesByCourse(slug, locale);

  return <CourseDetailDynamic course={course} modules={modules} />;
}
