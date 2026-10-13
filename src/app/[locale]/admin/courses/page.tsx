import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { HomeHeader } from "@/components/layout/HomeHeader";
import { AdminCoursesManager } from "@/components/features/admin/AdminCoursesManager";
import { cn } from "@/lib/utils";
import homeStyles from "@/components/features/home/home.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: isEn
      ? "Course Studio (Admin) | Eureka! Academy"
      : "Gestione Corsi (Admin) | Eureka! Academy",
    description: isEn
      ? "Eureka! Academy administrative console for course catalog and curriculum tree management."
      : "Console amministrativa Eureka! Academy per la gestione del catalogo corsi e della struttura curricolare.",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function AdminCoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className={cn(homeStyles.page, "bg-[#0b0f17] min-h-screen text-slate-100 flex flex-col")}>
      <HomeHeader activePage="academy" />
      <main id="main" className="flex-1">
        <AdminCoursesManager locale={locale} />
      </main>
    </div>
  );
}
