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
      ? "Eureka! Training | Train Wherever You Want"
      : "Eureka! Training | Allenati dove vuoi",
    description: isEn
      ? "Reach your fitness goals with Eureka! Training. Explore weight loss, muscle gain, strength, mobility, calisthenics, and well-being."
      : "Raggiungi i tuoi obiettivi con Eureka! Training. Esplora dimagrimento, massa muscolare, forza, mobilità, calisthenics e benessere.",
  };
}

export default function TrainingPage() {
  return <MarketingPage variant="training" />;
}
