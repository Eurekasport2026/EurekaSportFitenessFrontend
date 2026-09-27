import type { Metadata } from "next";
import { MarketingPage } from "@/components/features/marketing/MarketingPage";

export const metadata: Metadata = {
  title: "Eureka! Training | Allenati dove vuoi",
  description: "Raggiungi i tuoi obiettivi con Eureka! Training. Esplora dimagrimento, massa muscolare, forza, mobilità, calisthenics e benessere.",
};

export default function TrainingPage() {
  return <MarketingPage variant="training" />;
}
