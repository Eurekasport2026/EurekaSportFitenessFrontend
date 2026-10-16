"use client";

import { useTranslations } from "next-intl";
import styles from "./training-loader.module.css";

interface TrainingLoaderProps {
  label?: string;
  compact?: boolean;
}

export function TrainingLoader({ label, compact = false }: TrainingLoaderProps) {
  const t = useTranslations("TrainingApp");
  return <div className={`${styles.loader}${compact ? ` ${styles.compact}` : ""}`} role="status" aria-live="polite" aria-atomic="true">
    <div className={styles.visual} aria-hidden="true">
      <svg className={styles.athlete} viewBox="0 0 320 180" fill="none" focusable="false">
        <ellipse className={styles.shadow} cx="158" cy="150" rx="105" ry="7" />
        <path className={styles.ground} d="M28 146H282" />
        <path className={styles.farArm} d="M198 83L200 113L233 143" />
        <g className={styles.body}>
          <path className={styles.legs} d="M52 135L128 104L150 96" />
          <path className={styles.shirt} d="M132 102L201 77L210 80" />
          <path className={styles.neck} d="M211 77L224 68" />
          <circle className={styles.head} cx="235" cy="60" r="12" />
          <path className={styles.hair} d="M224 58A11 11 0 0 1 244 54" />
        </g>
        <path className={styles.nearArm} d="M207 82L211 113L244 143" />
        <path className={styles.shoes} d="M43 143L52 135L63 138M236 143H252M226 143H238" />
      </svg>
      <span className={styles.brand}>EUREKA! <strong>FIT</strong></span>
    </div>
    <p className={styles.message}>{label ?? t("loading")}</p>
    <span className={styles.dots} aria-hidden="true"><i /><i /><i /></span>
  </div>;
}
