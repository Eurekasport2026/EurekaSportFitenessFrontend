import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { courses, getCourseBySlug } from "@/lib/api/courses";
import { getModulesByCourse } from "@/lib/api/modules";
import { getExamByCourse } from "@/lib/api/exams";
import { HomeHeader } from "@/components/layout/HomeHeader";
import { CourseHome } from "@/components/features/courses/CourseHome";
import { cn } from "@/lib/utils";
import homeStyles from "@/components/features/home/home.module.css";
import styles from "@/components/features/courses/course-home.module.css";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ tab?: string; completed?: string }>;
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
      title: locale === "en" ? "Course | Eureka! Academy" : "Corso | Eureka! Academy",
    };
  }

  return {
    title: `${course.title} – ${locale === "en" ? "Study & Modules" : "Studio & Moduli"} | Eureka! Academy`,
    description: locale === "en"
      ? `Access the learning path for ${course.title}. Video lessons, PDF study guides, practical resources, and final exam.`
      : `Accedi al percorso didattico di ${course.title}. Video lezioni, dispense PDF, risorse pratiche ed esame finale.`,
  };
}

export default async function CourseLearnPage({ params, searchParams }: PageProps) {
  const { locale, slug } = await params;
  const { tab, completed } = await searchParams;
  setRequestLocale(locale);

  const course = getCourseBySlug(slug, locale);
  if (!course) {
    notFound();
  }

  const modules = getModulesByCourse(slug, locale);
  const exam = getExamByCourse(slug, locale);

  return (
    <div className={cn(homeStyles.page, styles.page)}>
      <HomeHeader activePage="academy" />
      <main id="main">
        <CourseHome
          course={course}
          modules={modules}
          exam={exam}
          initialTab={tab}
          isCompletedQuery={completed === "true"}
        />
      </main>
    </div>
  );
}
