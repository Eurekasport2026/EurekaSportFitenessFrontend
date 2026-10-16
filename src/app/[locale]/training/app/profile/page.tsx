import { redirect } from "@/i18n/routing";

export default async function LegacyAthletePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: "/athlete/profile", locale });
}
