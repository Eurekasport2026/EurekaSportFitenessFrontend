import { TrainingLogin } from "@/components/features/training-app/TrainingLogin";

export default async function TrainingLoginPage({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
  const { invite } = await searchParams;
  return <TrainingLogin inviteToken={typeof invite === "string" && /^[A-Za-z0-9_-]{40,100}$/.test(invite) ? invite : undefined} />;
}
