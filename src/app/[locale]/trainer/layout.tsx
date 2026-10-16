import type { Metadata } from "next";
import type { ReactNode } from "react";
import { TrainerShell } from "@/components/features/portals/TrainerShell";

export const metadata: Metadata = { title: "Trainer | Eureka!", robots: { index: false, follow: false } };

export default function TrainerLayout({ children }: { children: ReactNode }) {
  return <TrainerShell>{children}</TrainerShell>;
}
