import { TrainingLogin } from "@/components/features/training-app/TrainingLogin";
import { RequireTraining } from "@/components/features/training-app/TrainingShell";

export default function TrainingSignupPage() {
  return <RequireTraining requireAuth={false}><TrainingLogin mode="signup" /></RequireTraining>;
}
