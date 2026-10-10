"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { cn } from "@/lib/utils";
import { useTraining } from "./TrainingProvider";
import { useAuth } from "./AuthProvider";
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

function TrainingAccountMenu() {
  const t = useTranslations("TrainingApp");
  const { state } = useTraining();
  const { status, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const menuId = useId();
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const profileLink = useRef<HTMLAnchorElement>(null);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    profileLink.current?.focus();
    function dismissOutside(event: PointerEvent) {
      if (event.target instanceof Node && !container.current?.contains(event.target)) setOpen(false);
    }
    function dismissEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    }
    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("keydown", dismissEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("keydown", dismissEscape);
    };
  }, [open]);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
      setOpen(false);
      router.replace("/training/app/login");
    } catch { /* AuthProvider displays the shared logout failure toast. */ }
    finally { setSigningOut(false); }
  }

  return <div ref={container} className={styles.accountControl} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <button ref={trigger} type="button" className={styles.productProfile} aria-label={t("session.accountMenu")} aria-expanded={open} aria-controls={menuId} aria-busy={signingOut} onClick={() => setOpen(value => !value)}>
      {state.profile.avatar ? <Image src={state.profile.avatar} alt="" width={40} height={40} unoptimized /> : <TrainingIcon name="user" />}
    </button>
    {open && <nav id={menuId} className={styles.accountMenu} aria-label={t("session.accountMenu")}>
      <Link ref={profileLink} href="/training/app/profile" className={styles.accountMenuItem} onClick={() => setOpen(false)}><TrainingIcon name="user" /><span>{t("settings.profile")}</span></Link>
      {status === "authenticated" && <button type="button" className={cn(styles.accountMenuItem, styles.dangerButton)} disabled={signingOut} onClick={() => void signOut()}><TrainingIcon name="logout" /><span>{t(signingOut ? "session.signingOut" : "session.logout")}</span></button>}
    </nav>}
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
      {hasProfile && <TrainingAccountMenu />}
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
