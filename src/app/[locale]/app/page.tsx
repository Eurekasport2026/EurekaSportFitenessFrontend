import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { HomeHeader } from "@/components/layout/HomeHeader";
import { HomeAction } from "@/components/features/home/HomeAction";
import { HomeIcon } from "@/components/features/home/HomeIcon";
import { T } from "@/components/layout/LanguageProvider";
import { cn } from "@/lib/utils";
import homeStyles from "@/components/features/home/home.module.css";
import styles from "./app.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: isEn
      ? "Eureka! Fit | Your Gym Always With You"
      : "Eureka! Fit | La tua palestra sempre con te",
    description: isEn
      ? "Discover Eureka! Fit: custom workout plans, HD video exercises, and progress tracking all in one app."
      : "Scopri Eureka! Fit: programmi personalizzati, video esercizi e monitoraggio dei progressi in un'unica app.",
  };
}

const features = [
  { icon: "clipboard", title: "Schede personalizzate" },
  { icon: "video", title: "Video in alta qualità" },
  { icon: "growth", title: "Statistiche e progressi" },
  { icon: "mobile", title: "Disponibile ovunque" },
] as const;

export default async function AppPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === "en";

  return (
    <div className={cn(homeStyles.page, styles.page)}>
      <a className={homeStyles.skipLink} href="#main"><T>Vai al contenuto</T></a>
      <HomeHeader activePage="app" />
      <main id="main">
        <section className={styles.hero} aria-labelledby="app-title">
          <Image src="/images/eureka-app-hero.webp" alt={isEn ? "Two smartphones showing Eureka! Fit workout plans and progress screens" : "Due smartphone con le schermate dei programmi e dei progressi di Eureka! Fit"} fill unoptimized preload className={styles.heroImage} />
          <div className={styles.heroShade} aria-hidden="true" />
          <div className={styles.heroContent}>
            <div className={styles.brandRow}>
              <Image src="/eureka-fit-symbol.svg" width={86} height={86} alt="" />
              <h1 id="app-title">EUREKA!<span>FIT</span></h1>
            </div>
            <h2><T>La tua palestra</T><br /><T>sempre con te.</T></h2>
            <p><T>Programmi personalizzati, video esercizi, monitoraggio dei progressi e molto altro. Disponibile su iOS, Android e via web.</T></p>
            <div className={styles.stores} aria-label={isEn ? "Eureka! Fit download availability" : "Disponibilità di Eureka! Fit"}>
              <HomeAction kind="training" className={styles.storeBadge} label="App Store"><HomeIcon name="apple" /><span><small><T>Scarica su</T></small><strong>App Store</strong></span></HomeAction>
              <HomeAction kind="training" className={styles.storeBadge} label="Google Play"><HomeIcon name="playstore" /><span><small><T>Disponibile su</T></small><strong>Google Play</strong></span></HomeAction>
            </div>
            <HomeAction kind="login" className={styles.webButton}><T>Accedi alla versione Web</T> <HomeIcon name="arrow" /></HomeAction>
          </div>
        </section>
        <section className={styles.features} aria-label={isEn ? "Eureka! Fit features" : "Funzioni di Eureka! Fit"}>
          {features.map((feature) => <div className={styles.feature} key={feature.title}>
            <HomeIcon name={feature.icon} />
            <h2><T>{feature.title}</T></h2>
          </div>)}
        </section>
        <section className={styles.launch} aria-labelledby="launch-title">
          <div>
            <h2 id="launch-title"><T>Speciale lancio</T></h2>
            <p><T>Prova 7 giorni gratis. Poi scegli il piano più adatto a te.</T></p>
          </div>
          <Link href="/prezzi" className={styles.launchButton}><T>Inizia ora</T> <HomeIcon name="arrow" /></Link>
        </section>
      </main>
    </div>
  );
}
