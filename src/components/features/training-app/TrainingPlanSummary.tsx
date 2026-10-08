"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useTraining } from "./TrainingProvider";
import { TrainingIcon } from "./TrainingIcon";
import { trainingPlanPhoto } from "./trainingVisuals";
import styles from "./training-app.module.css";

export function TrainingPlanSummary({ onEdit }: { onEdit: () => void }) {
  const t = useTranslations("TrainingApp");
  const { state } = useTraining();
  const { profile } = state;
  const details = [
    ["goal", t(`goals.${profile.goal || "fitness"}`)],
    ["equipment", t(`equipment.${profile.equipment || "bodyweight"}`)],
    ["experience", t(`experience.${profile.experience || "new"}`)],
  ] as const;
  return <aside className={styles.planSummary} aria-labelledby="training-plan-summary">
    <div className={styles.summaryPhoto}><Image src={trainingPlanPhoto(profile)} alt="" fill sizes="320px" unoptimized /></div>
    <span className={styles.eyebrow}>{t("workout.myPlan")}</span>
    <h2 id="training-plan-summary">{t("desktop.yourPlan")}</h2>
    <dl className={styles.planDetails}>{details.map(([key, value]) => <div key={key}><dt>{t(`desktop.${key}`)}</dt><dd>{value}</dd></div>)}</dl>
    <div className={styles.summarySchedule}>
      <h3><TrainingIcon name="calendar" />{t("desktop.schedule")}</h3>
      <p>{t("onboarding.frequencyValue", { count: profile.frequency })}</p>
      <ul>{profile.weekdays.map((day, index) => <li key={day} className={index === state.selectedDay ? styles.summarySelectedDay : undefined}><span>{t(`weekdays.full${day}`)}</span><time>{profile.time}</time></li>)}</ul>
    </div>
    <button type="button" className={styles.secondaryButton} onClick={onEdit}><TrainingIcon name="edit" />{t("workout.editPlan")}</button>
  </aside>;
}
