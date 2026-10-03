"use client";

import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import styles from "./course-home.module.css";

export type ModuleStatus = "not_started" | "in_progress" | "completed";

interface StatusBadgeProps {
  status: ModuleStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const locale = useLocale() || "it";
  const isEn = locale === "en";

  if (status === "completed") {
    return (
      <span className={cn(styles.badge, styles.badgeCompleted, className)}>
        <span aria-hidden="true">✓</span> {isEn ? "COMPLETED" : "COMPLETATO"}
      </span>
    );
  }

  if (status === "in_progress") {
    return (
      <span className={cn(styles.badge, styles.badgeInProgress, className)}>
        <span aria-hidden="true">●</span> {isEn ? "IN PROGRESS" : "IN CORSO"}
      </span>
    );
  }

  return (
    <span className={cn(styles.badge, styles.badgeNotStarted, className)}>
      <span aria-hidden="true">○</span> {isEn ? "NOT STARTED" : "NON INIZIATO"}
    </span>
  );
}
