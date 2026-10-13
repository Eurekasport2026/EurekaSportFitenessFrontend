import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getCourseDetail } from "@/lib/api/courses";
import { getCourseCurriculum } from "@/lib/api/lessons";
import { getExamByCourse } from "@/lib/api/exams";
import { HomeHeader } from "@/components/layout/HomeHeader";
import { CourseHome } from "@/components/features/courses/CourseHome";
import { CoursePageState } from "@/components/features/courses/CoursePageState";
import { cn } from "@/lib/utils";
import homeStyles from "@/components/features/home/home.module.css";
import styles from "@/components/features/courses/course-home.module.css";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ tab?: string; completed?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const result = await getCourseDetail(slug, locale);

  if (result.status !== "ready") {
    return {
      title: locale === "en" ? "Course | Eureka! Academy" : "Corso | Eureka! Academy",
      robots: { index: false, follow: false },
    };
  }
  const { course } = result;

  return {
    title: `${course.title} – ${locale === "en" ? "Study & Modules" : "Studio & Moduli"} | Eureka! Academy`,
    description: locale === "en"
      ? `Access the learning path for ${course.title}. Video lessons, PDF study guides, practical resources, and final exam.`
      : `Accedi al percorso didattico di ${course.title}. Video lezioni, dispense PDF, risorse pratiche ed esame finale.`,
  };
}

export default async function CourseLearnPage({ params, searchParams }: PageProps) {
  const { locale, slug } = await params;
  const { tab } = await searchParams;
  setRequestLocale(locale);

  const [courseResult, curriculumResult] = await Promise.all([
    getCourseDetail(slug, locale),
    getCourseCurriculum(slug, locale),
  ]);

  if (courseResult.status === "not_found") notFound();
  if (courseResult.status === "error") return <CoursePageState mode="error" />;
  const { course } = courseResult;

  if (curriculumResult.status !== "ready") {
    return <CoursePageState mode="error" resource="curriculum" />;
  }
  const { modules, lessons } = curriculumResult.data;
  const exam = getExamByCourse(slug, locale);

  return (
    <div className={cn(homeStyles.page, styles.page)}>
      <HomeHeader activePage="academy" />
      <main id="main">
        <CourseHome
          course={course}
          modules={modules}
          lessons={lessons}
          exam={exam}
          initialTab={tab}
        />
      </main>
    </div>
  );
}
