import type { Metadata } from "next";
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
      ? "Become a sports and fitness professional. Explore Eureka! Academy courses: Personal Trainer, Calisthenics Coach, Swimming, Aquagym and Gymnastics."
      : "Diventa un professionista dello sport e del fitness. Scopri i corsi Eureka! Academy: Personal Trainer, Calisthenics Coach, Nuoto, Aquagym e Ginnastica.",
  };
}

export default function AcademyPage() {
  return <MarketingPage variant="academy" />;
}
