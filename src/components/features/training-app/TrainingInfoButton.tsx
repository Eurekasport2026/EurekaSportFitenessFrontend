"use client";

import { useId, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { TrainingIcon } from "./TrainingIcon";
import styles from "./training-app.module.css";

interface TrainingInfoButtonProps {
  kind: "help" | "privacy" | "terms" | "cookies";
  children: ReactNode;
  className?: string;
}

export function TrainingInfoButton({ kind, children, className }: TrainingInfoButtonProps) {
  const t = useTranslations("TrainingApp");
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  return <>
    <button type="button" className={className} aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>{children}</button>
    <dialog ref={dialog} className={styles.infoDialog} aria-labelledby={titleId} aria-describedby={descriptionId} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.current?.close();
    }}>
      <div className={styles.dialogTop}><span className={styles.eyebrow}>EUREKA! FIT</span><button type="button" autoFocus className={styles.iconButton} aria-label={t("close")} onClick={() => dialog.current?.close()}><TrainingIcon name="close" /></button></div>
      <h2 id={titleId}>{t(`product.info.${kind}.title`)}</h2>
      <p id={descriptionId}>{t(`product.info.${kind}.description`)}</p>
      {kind === "help" && <p>{t("settings.deviceNote")}</p>}
    </dialog>
  </>;
}
