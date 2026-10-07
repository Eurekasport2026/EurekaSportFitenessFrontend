import { Suspense } from "react";
import { Workout } from "@/components/features/training-app/Workout";
import { RequireTraining, TrainingLoading } from "@/components/features/training-app/TrainingShell";

export default function WorkoutPage() {
  return <RequireTraining><Suspense fallback={<TrainingLoading />}><Workout /></Suspense></RequireTraining>;
}
