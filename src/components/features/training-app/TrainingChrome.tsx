"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { cn } from "@/lib/utils";
import { useTraining } from "./TrainingProvider";
import { TrainingIcon } from "./TrainingIcon";
import { TrainingInfoButton } from "./TrainingInfoButton";
import styles from "./training-app.module.css";

export function TrainingBrand({ className, href }: { className?: string; href?: "/training/app" | "/training/app/workout" }) {
  const { state, hydrated } = useTraining();
  const destination = href ?? (hydrated && state.complete ? "/training/app/workout" : "/training/app");
  return <Link href={destination} className={cn(styles.productBrand, className)} aria-label="Eureka! Fit">
    <Image src="/eureka-symbol.svg" alt="" width={32} height={36} />
    <span>EUREKA! <em>FIT</em></span>
  </Link>;
}

export function TrainingLanguage() {
  const { language, setLanguage } = useLanguage();
  const t = useTranslations("TrainingApp");
  return <div className={styles.language} role="group" aria-label={t("language")}>
    {(["it", "en"] as const).map(locale => <button type="button" key={locale} lang={locale} aria-label={locale === "it" ? "Italiano" : "English"} aria-pressed={language === locale} onClick={() => setLanguage(locale)}>{locale.toUpperCase()}</button>)}
  </div>;
}

export function TrainingProductHeader() {
  const t = useTranslations("TrainingApp");
  const { state, hydrated } = useTraining();
  const hasProfile = hydrated && state.complete;
  return <header className={styles.productHeader}>
    <div className={styles.productIdentity}>
      <TrainingBrand href={hasProfile ? "/training/app/workout" : "/training/app"} />
      <span className={styles.productParent}>{t("product.byEureka")}</span>
    </div>
    <div className={styles.productActions}>
      <TrainingInfoButton kind="help" className={styles.iconButton}><TrainingIcon name="help" /><span className={styles.srOnly}>{t("settings.help")}</span></TrainingInfoButton>
      <TrainingLanguage />
      {hasProfile && <Link href="/training/app/profile" className={styles.productProfile} aria-label={t("settings.profile")}>
        {state.profile.avatar ? <Image src={state.profile.avatar} alt="" width={40} height={40} unoptimized /> : <TrainingIcon name="user" />}
      </Link>}
    </div>
  </header>;
}

export function TrainingProductFooter() {
  const t = useTranslations("TrainingApp");
  return <footer className={styles.productFooter}>
    <div className={styles.productFooterIdentity}><TrainingBrand /><span>{t("product.byEureka")}</span></div>
    <nav className={styles.productLegal} aria-label={t("product.legal")}>
      <TrainingInfoButton kind="privacy" className={styles.productFooterControl}>{t("privacy")}</TrainingInfoButton>
      <TrainingInfoButton kind="terms" className={styles.productFooterControl}>{t("terms")}</TrainingInfoButton>
      <TrainingInfoButton kind="cookies" className={styles.productFooterControl}>{t("product.cookies")}</TrainingInfoButton>
    </nav>
    <Link href="/" className={styles.productExit}>{t("backToSite")}<TrainingIcon name="arrow" /></Link>
  </footer>;
}
