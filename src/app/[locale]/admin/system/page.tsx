import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { HomeHeader } from "@/components/layout/HomeHeader";
import { AdminSystemHealth } from "@/components/features/admin/AdminSystemHealth";
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
      ? "System Health (Admin) | Eureka! Academy"
      : "Stato Sistema (Admin) | Eureka! Academy",
    description: isEn
      ? "Eureka! Academy administrative console for infrastructure health probes and API telemetry."
      : "Console amministrativa Eureka! Academy per le sonde di stato dell'infrastruttura e la telemetria API.",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function AdminSystemPage({
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
        <AdminSystemHealth locale={locale} />
      </main>
    </div>
  );
}
