import { redirect } from "@/i18n/routing";

export default async function TrainerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: "/trainer/courses", locale });
}
