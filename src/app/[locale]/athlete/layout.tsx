import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AthleteWorkspace } from "@/components/features/portals/AthleteWorkspace";
import { TrainingProvider } from "@/components/features/training-app/TrainingProvider";
import { TrainingShell } from "@/components/features/training-app/TrainingShell";

export const metadata: Metadata = { title: "Athlete | Eureka! Fit", robots: { index: false, follow: false } };

export default function AthleteLayout({ children }: { children: ReactNode }) {
  return <TrainingProvider><TrainingShell><AthleteWorkspace />{children}</TrainingShell></TrainingProvider>;
}
