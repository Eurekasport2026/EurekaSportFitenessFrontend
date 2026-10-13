import { redirect } from "@/i18n/routing";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function PersonalTrainerRedirectPage({ params }: PageProps) {
  const { locale } = await params;
  // Redirect legacy /personal-trainer URL to the modular /personal-trainer-1 dynamic route
  redirect({ href: { pathname: "/academy/corsi/[slug]", params: { slug: "personal-trainer-1" } }, locale });
}
