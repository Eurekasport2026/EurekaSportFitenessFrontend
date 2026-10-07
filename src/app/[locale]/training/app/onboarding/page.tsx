import { Suspense } from "react";
import { Onboarding } from "@/components/features/training-app/Onboarding";
import { TrainingLoading } from "@/components/features/training-app/TrainingShell";

export default function OnboardingPage() {
  return <Suspense fallback={<TrainingLoading />}><Onboarding /></Suspense>;
}
