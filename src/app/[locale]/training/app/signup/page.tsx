import { TrainingLogin } from "@/components/features/training-app/TrainingLogin";

export default async function TrainingSignupPage({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
  const { invite } = await searchParams;
  return <TrainingLogin mode="signup" inviteToken={typeof invite === "string" && /^[A-Za-z0-9_-]{40,100}$/.test(invite) ? invite : undefined} />;
}
