"use client";

import type { ReactNode } from "react";
import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { HomeHeader } from "@/components/layout/HomeHeader";
import { PortalAccess, PortalSwitcher } from "@/components/layout/PortalAccess";
import { useAuth } from "@/components/features/training-app/AuthProvider";
import { TrainingIcon } from "@/components/features/training-app/TrainingIcon";
import styles from "./trainer-courses.module.css";

export function TrainerShell({ children }: { children: ReactNode }) {
  const en = useLocale() === "en";
  const pathname = usePathname();
  const { session } = useAuth();
  return <div className={styles.shell}>
    <HomeHeader />
    <a href="#trainer-main" className={styles.skipLink}>{en ? "Skip to training courses" : "Vai ai corsi di formazione"}</a>
    <div className={styles.portalBar}><div><span className={styles.eyebrow}>{en ? "TRAINER WORKSPACE" : "AREA TRAINER"}</span>{session && <strong>{session.user.name}</strong>}</div><PortalSwitcher /></div>
    <nav className={styles.navigation} aria-label={en ? "Trainer navigation" : "Navigazione Trainer"}>
      <Link href="/trainer/courses" aria-current={pathname.startsWith("/trainer/courses") ? "page" : undefined}><TrainingIcon name="book" />{en ? "Training courses" : "Corsi di formazione"}</Link>
      <Link href="/trainer/coaching" aria-current={pathname === "/trainer/coaching" ? "page" : undefined}><TrainingIcon name="dumbbell" />{en ? "Athletes & coaching" : "Atleti e coaching"}</Link>
    </nav>
    <main id="trainer-main" className={styles.main}><PortalAccess role="coach">{children}</PortalAccess></main>
  </div>;
}
