import { Welcome } from "@/components/features/training-app/Welcome";
import { goals, type TrainingGoal } from "@/lib/training/types";

export default async function TrainingAppPage({ searchParams }: { searchParams: Promise<{ goal?: string }> }) {
  const { goal } = await searchParams;
  return <Welcome initialGoal={goals.includes(goal as TrainingGoal) ? goal as TrainingGoal : undefined} />;
}
