import type { Metadata } from "next";
import type { ReactNode } from "react";
import { TrainingProvider } from "@/components/features/training-app/TrainingProvider";
import { TrainingShell } from "@/components/features/training-app/TrainingShell";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: "Eureka! Fit", description: locale === "en" ? "Build your training profile and explore your workout plan." : "Crea il tuo profilo di allenamento ed esplora il tuo programma.", robots: { index: false, follow: false } };
}

export default function TrainingAppLayout({ children }: { children: ReactNode }) {
  return <TrainingProvider><TrainingShell>{children}</TrainingShell></TrainingProvider>;
}
