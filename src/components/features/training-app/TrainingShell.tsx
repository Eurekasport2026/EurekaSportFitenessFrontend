"use client";

import Image from "next/image";
import { useEffect, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useTraining } from "./TrainingProvider";
import { useAuth } from "./AuthProvider";
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
  return <div className={cn(styles.backdrop, (pathname === "/training/app/onboarding" || pathname === "/training/app/login" || pathname === "/training/app/signup") && styles.onboardingViewport)}>
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

export interface RequireTrainingProps { children: ReactNode; requireAuth?: boolean }
const guardToastId = "fit-access-required";
export function RequireTraining({ children, requireAuth = true }: RequireTrainingProps) {
  const { hydrated, state } = useTraining();
  const { status, refresh, signedOutIntentionally } = useAuth();
  const t = useTranslations("TrainingApp");
  const router = useRouter();
  const redirecting = useRef(false);
  useEffect(() => {
    if (!hydrated) return;
    if (state.complete && (!requireAuth || status === "authenticated")) { redirecting.current = false; return; }
    if (redirecting.current) return;
    const needsSetup = !state.complete;
    const needsLogin = requireAuth && status === "anonymous";
    if (!needsSetup && !needsLogin) return;
    redirecting.current = true;
    if (needsSetup) {
      toast.info(t("session.setupRequired"), { id: guardToastId });
      router.replace("/training/app/onboarding");
    } else {
      if (!signedOutIntentionally) toast.info(t("session.loginRequired"), { id: guardToastId });
      router.replace("/training/app/login");
    }
  }, [hydrated, state.complete, requireAuth, status, signedOutIntentionally, router, t]);
  if (!hydrated || !state.complete) return <TrainingLoading />;
  if (requireAuth && status === "error") return <main id="training-main" className={styles.loading}><p role="alert">{t("session.unavailable")}</p><button type="button" className={styles.secondaryButton} onClick={() => void refresh()}>{t("session.retry")}</button></main>;
  if (requireAuth && status !== "authenticated") return <TrainingLoading />;
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
  const { session } = useAuth();
  const items = [
    { key: "workout", icon: "dumbbell" }, { key: "exercises", icon: "user" }, { key: "library", icon: "book" }, { key: "progress", icon: "chart" }, { key: "settings", icon: "settings" },
  ] as const;
  return <aside className={styles.trainingSidebar}><div className={styles.sidebarContent}>
    <Link href="/training/app/profile" className={styles.sidebarProfile}>
      <span className={styles.sidebarAvatar}>{state.profile.avatar ? <Image src={state.profile.avatar} alt="" width={40} height={40} unoptimized /> : <TrainingIcon name="user" />}</span>
      <span><strong>{session?.user.name.trim() || t("desktop.profile")}</strong><small>{t(`goals.${state.profile.goal || "fitness"}`)}</small></span>
    </Link>
    <p className={styles.sidebarCaption}>{t("desktop.workspace")}</p>
    <nav className={styles.bottomNav} aria-label={t("navigation")}>
    {items.map(item => <Link key={item.key} href={item.key === "settings" ? "/training/app/settings" : { pathname: "/training/app/workout", query: item.key === "workout" ? {} : { view: item.key } }} className={cn(styles.navItem, active === item.key && styles.navActive)} aria-current={active === item.key ? "page" : undefined}><TrainingIcon name={item.icon} /><span>{t(`nav.${item.key}`)}</span></Link>)}
    </nav>
    <div className={styles.sidebarMembership}><TrainingIcon name="crown" /><strong>{t("settings.membership")}</strong><p>{t("desktop.membershipDescription")}</p><Link href="/training/app/membership" className={styles.secondaryButton}>{t("workout.unlock")}<TrainingIcon name="arrow" /></Link></div>
  </div></aside>;
}
