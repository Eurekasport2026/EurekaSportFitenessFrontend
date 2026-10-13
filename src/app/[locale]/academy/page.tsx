import type { Metadata } from "next";
import { getCourseCatalog } from "@/lib/api/course-catalog-server";
import { MarketingPage } from "@/components/features/marketing/MarketingPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: isEn
      ? "Eureka! Academy | Sports & Fitness Education"
      : "Eureka! Academy | Formazione sport e fitness",
    description: isEn
      ? "Become a sports and fitness professional. Explore accredited Eureka! Academy certification courses in personal training, fitness, and athletic coaching."
      : "Diventa un professionista dello sport e del fitness. Scopri i corsi di certificazione accreditati Eureka! Academy per personal trainer, fitness e coaching atletico.",
  };
}

export default async function AcademyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const catalogState = await getCourseCatalog(locale === "en" ? "en" : "it");
  return <MarketingPage variant="academy" catalogState={catalogState} />;
}
