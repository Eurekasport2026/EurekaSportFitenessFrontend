"use client";

import Image from "next/image";
import { useEffect, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useTraining } from "./TrainingProvider";
import { TrainingBrand, TrainingLanguage, TrainingProductHeader, TrainingProductFooter } from "./TrainingChrome";
import { TrainingIcon } from "./TrainingIcon";
import { cn } from "@/lib/utils";
import styles from "./training-app.module.css";

export { TrainingLanguage } from "./TrainingChrome";

export interface TrainingShellProps { children: ReactNode }
export function TrainingShell({ children }: TrainingShellProps) {
  const t = useTranslations("TrainingApp");
  const { persistent, hydrated } = useTraining();
  const pathname = usePathname();
  return <div className={cn(styles.backdrop, pathname === "/training/app/onboarding" && styles.onboardingViewport)}>
    <a className={styles.skipLink} href="#training-main">{t("skipContent")}</a>
    <TrainingProductHeader />
    <div className={styles.shell}>
      {hydrated && !persistent && <p role="status" className={styles.storageNotice}>{t("storageNotice")}</p>}
      {children}
    </div>
    <TrainingProductFooter />
  </div>;
}

export function TrainingLoading() {
  const t = useTranslations("TrainingApp");
  return <main id="training-main" className={styles.loading} aria-busy="true"><span className={styles.spinner} /><p role="status">{t("loading")}</p></main>;
}

export interface RequireTrainingProps { children: ReactNode }
export function RequireTraining({ children }: RequireTrainingProps) {
  const { hydrated, state } = useTraining();
  const router = useRouter();
  useEffect(() => { if (hydrated && !state.complete) router.replace("/training/app/onboarding"); }, [hydrated, state.complete, router]);
  if (!hydrated || !state.complete) return <TrainingLoading />;
  return children;
}

export interface TrainingHeaderProps { title?: string; back?: "/training/app/workout" | "/training/app/settings"; children?: ReactNode }
export function TrainingHeader({ title, back, children }: TrainingHeaderProps) {
  const t = useTranslations("TrainingApp");
  return <header className={cn(styles.appHeader, !title && !back && styles.introHeader)}>
    {back ? <Link href={back} className={styles.iconButton} aria-label={t("back")}><TrainingIcon name="back" /><span className={styles.desktopBackLabel}>{t("back")}</span></Link> : <TrainingBrand className={styles.miniBrand} />}
    {title && <span className={styles.headerTitle}>{title}</span>}
    <div className={styles.headerActions}>{children}<TrainingLanguage /></div>
  </header>;
}

export type TrainingTab = "workout" | "exercises" | "library" | "progress" | "settings";
export interface TrainingNavProps { active: TrainingTab }
export function TrainingNav({ active }: TrainingNavProps) {
  const t = useTranslations("TrainingApp");
  const { state } = useTraining();
  const items = [
    { key: "workout", icon: "dumbbell" }, { key: "exercises", icon: "user" }, { key: "library", icon: "book" }, { key: "progress", icon: "chart" }, { key: "settings", icon: "settings" },
  ] as const;
  return <aside className={styles.trainingSidebar}><div className={styles.sidebarContent}>
    <Link href="/training/app/profile" className={styles.sidebarProfile}>
      <span className={styles.sidebarAvatar}>{state.profile.avatar ? <Image src={state.profile.avatar} alt="" width={40} height={40} unoptimized /> : <TrainingIcon name="user" />}</span>
      <span><strong>{state.profile.name || t("desktop.profile")}</strong><small>{t(`goals.${state.profile.goal || "fitness"}`)}</small></span>
    </Link>
    <p className={styles.sidebarCaption}>{t("desktop.workspace")}</p>
    <nav className={styles.bottomNav} aria-label={t("navigation")}>
    {items.map(item => <Link key={item.key} href={item.key === "settings" ? "/training/app/settings" : { pathname: "/training/app/workout", query: item.key === "workout" ? {} : { view: item.key } }} className={cn(styles.navItem, active === item.key && styles.navActive)} aria-current={active === item.key ? "page" : undefined}><TrainingIcon name={item.icon} /><span>{t(`nav.${item.key}`)}</span></Link>)}
    </nav>
    <div className={styles.sidebarMembership}><TrainingIcon name="crown" /><strong>{t("settings.membership")}</strong><p>{t("desktop.membershipDescription")}</p><Link href="/training/app/membership" className={styles.secondaryButton}>{t("workout.unlock")}<TrainingIcon name="arrow" /></Link></div>
  </div></aside>;
}
