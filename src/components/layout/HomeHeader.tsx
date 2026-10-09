"use client";

import { useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { HomeAction } from "@/components/features/home/HomeAction";
import { HomeIcon } from "@/components/features/home/HomeIcon";
import { useLanguage } from "./LanguageProvider";
import styles from "@/components/features/home/home.module.css";

export interface HomeHeaderProps {
  activePage?: "home" | "academy" | "training" | "app" | "pricing" | "contact" | "about";
}

export function HomeHeader({ activePage = "home" }: HomeHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.headerBrand} aria-label={language === "en" ? "Eureka! Sport & Fitness Academy — Home" : "Eureka! Sport & Fitness Academy — Inizio"}>
        <Image
          src="/images/logo/eureka-logo-bianco.png"
          alt="Eureka! Sport & Fitness Academy"
          width={142}
          height={45}
          className={styles.headerLogoImage}
          priority
        />
      </Link>
      <nav id="home-navigation" aria-label={language === "en" ? "Main navigation" : "Navigazione principale"} className={cn(styles.navigation, menuOpen && styles.navigationOpen)} onClick={(event) => { if ((event.target as HTMLElement).closest("a")) setMenuOpen(false); }}>
        <Link href="/" className={cn(activePage === "home" && styles.activeLink)} aria-current={activePage === "home" ? "page" : undefined}>{t("Inizio")}</Link>
        <Link href="/academy" className={cn(activePage === "academy" && styles.activeLink)} aria-current={activePage === "academy" ? "page" : undefined}>{t("Accademia")}</Link>
        <Link href="/training" className={cn(activePage === "training" && styles.activeLink)} aria-current={activePage === "training" ? "page" : undefined}>{t("Allenamento")}</Link>
        <Link href="/app" className={cn(activePage === "app" && styles.activeLink)} aria-current={activePage === "app" ? "page" : undefined}>{t("App")}</Link>
        <Link href="/prezzi" className={cn(activePage === "pricing" && styles.activeLink)} aria-current={activePage === "pricing" ? "page" : undefined}>{t("Prezzi")}</Link>
        <Link href="/chi-siamo" className={cn(activePage === "about" && styles.activeLink)} aria-current={activePage === "about" ? "page" : undefined}>{t("Chi siamo")}</Link>
        <Link href="/contatti" className={cn(activePage === "contact" && styles.activeLink)} aria-current={activePage === "contact" ? "page" : undefined}>{t("Contatti")}</Link>
      </nav>
      <div className={styles.headerActions}>
        <HomeAction kind="search" className={styles.searchButton} label={t("Cerca nel sito")}><HomeIcon name="search" /></HomeAction>
        <div className={styles.languageSwitch} role="group" aria-label={language === "it" ? "Lingua" : "Language"}>
          <button type="button" lang="it" aria-label="Italiano" aria-pressed={language === "it"} className={cn(language === "it" && styles.selectedLanguage)} onClick={() => setLanguage("it")}>IT</button>
          <button type="button" lang="en" aria-label="English" aria-pressed={language === "en"} className={cn(language === "en" && styles.selectedLanguage)} onClick={() => setLanguage("en")}>EN</button>
        </div>
        <Link href="/training/app/onboarding" className={styles.loginButton}>{t("Crea programma")}</Link>
        <button className={styles.menuButton} type="button" aria-expanded={menuOpen} aria-controls="home-navigation" aria-label={t(menuOpen ? "Chiudi menu" : "Apri menu")} onClick={() => setMenuOpen(!menuOpen)} onKeyDown={(event) => { if (event.key === "Escape") setMenuOpen(false); }}><HomeIcon name={menuOpen ? "close" : "menu"} /></button>
      </div>
    </header>
  );
}
