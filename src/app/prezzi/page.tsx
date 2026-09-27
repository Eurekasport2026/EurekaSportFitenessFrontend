import type { Metadata } from "next";
import { HomeHeader } from "@/components/layout/HomeHeader";
import { PricingTable } from "@/components/features/pricing/PricingTable";
import { T } from "@/components/layout/LanguageProvider";
import { cn } from "@/lib/utils";
import homeStyles from "@/components/features/home/home.module.css";
import styles from "@/components/features/pricing/pricing.module.css";

export const metadata: Metadata = {
  title: "Prezzi app | Eureka! Fit",
  description: "Scopri i piani Base, Pro ed Elite di Eureka! Fit e scegli la formula mensile o annuale.",
};

export default function PricingPage() {
  return (
    <div className={cn(homeStyles.page, styles.page)}>
      <a className={homeStyles.skipLink} href="#main">Vai al contenuto</a>
      <HomeHeader activePage="pricing" />
      <main className={styles.main} id="main">
        <div className={styles.intro}><h1><T>Scegli il tuo piano</T></h1><p><T>Allenati senza limiti. Disdici quando vuoi.</T></p></div>
        <PricingTable />
      </main>
    </div>
  );
}
