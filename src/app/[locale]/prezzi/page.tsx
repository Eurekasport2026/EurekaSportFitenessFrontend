import type { Metadata } from "next";
import { HomeHeader } from "@/components/layout/HomeHeader";
import { PricingTable } from "@/components/features/pricing/PricingTable";
import { T } from "@/components/layout/LanguageProvider";
import { cn } from "@/lib/utils";
import homeStyles from "@/components/features/home/home.module.css";
import styles from "@/components/features/pricing/pricing.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: isEn ? "App Pricing | Eureka! Fit" : "Prezzi app | Eureka! Fit",
    description: isEn
      ? "Explore Base, Pro, and Elite plans for Eureka! Fit with monthly or annual billing options."
      : "Scopri i piani Base, Pro ed Elite di Eureka! Fit e scegli la formula mensile o annuale.",
  };
}

export default function PricingPage() {
  return (
    <div className={cn(homeStyles.page, styles.page)}>
      <a className={homeStyles.skipLink} href="#main"><T>Vai al contenuto</T></a>
      <HomeHeader activePage="pricing" />
      <main className={styles.main} id="main">
        <div className={styles.intro}><h1><T>Scegli il tuo piano</T></h1><p><T>Allenati senza limiti. Disdici quando vuoi.</T></p></div>
        <PricingTable />
      </main>
    </div>
  );
}
