"use client";

import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import styles from "./course-home.module.css";

interface ProgressBarProps {
  percent: number;
  completedLessons?: number;
  totalLessons?: number;
  className?: string;
  showMeta?: boolean;
}

export function ProgressBar({
  percent,
  completedLessons,
  totalLessons,
  className,
  showMeta = true,
}: ProgressBarProps) {
  const locale = useLocale() || "it";
  const isEn = locale === "en";

  const safePercent = Math.min(100, Math.max(0, percent));
  const isCompleted = safePercent === 100;

  return (
    <div className={cn("w-full", className)}>
      <div
        className={styles.progressBarTrack}
        role="progressbar"
        aria-valuenow={safePercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(styles.progressBarFill, isCompleted && styles.progressBarCompleted)}
          style={{ width: `${safePercent}%` }}
        />
      </div>
      {showMeta && (
        <div className={styles.progressMeta}>
          <span>
            {safePercent}% {isEn ? "completed" : "completato"}
          </span>
          {typeof completedLessons === "number" && typeof totalLessons === "number" && (
            <span>
              {isEn
                ? `${completedLessons} of ${totalLessons} lessons`
                : `${completedLessons} di ${totalLessons} lezioni`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
