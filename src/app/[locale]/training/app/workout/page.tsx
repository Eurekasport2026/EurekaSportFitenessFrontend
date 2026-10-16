import { redirect } from "@/i18n/routing";

export default async function WorkoutPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ view?: string | string[] }> }) {
  const { locale } = await params;
  const { view } = await searchParams;
  const href = view === "progress" ? "/athlete/progress" : view === "library" || view === "exercises" ? "/athlete/exercises" : "/athlete/workout";
  redirect({ href, locale });
}
