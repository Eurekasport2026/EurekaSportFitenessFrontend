import type { Metadata } from "next";
import { MarketingPage } from "@/components/features/marketing/MarketingPage";

export const metadata: Metadata = {
  title: "Eureka! Academy | Formazione sport e fitness",
  description: "Diventa un professionista dello sport e del fitness. Scopri i corsi Eureka! Academy: Personal Trainer, Calisthenics Coach, Nuoto, Aquagym e Ginnastica.",
};

export default function AcademyPage() {
  return <MarketingPage variant="academy" />;
}
