"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { steps, type TrainingProfile, type OnboardingStep, type TrainingGoal, type Equipment } from "@/lib/training/types";
import { displayMeasurement, isProfileComplete, isTrainingTimeValid } from "@/lib/training/state";
import { useTraining } from "./TrainingProvider";
import { TrainingIcon } from "./TrainingIcon";
import { MeasurementInput } from "./MeasurementInput";
import { TrainingLanguage, TrainingLoading } from "./TrainingShell";
import { equipmentPhotos, goalPhotos, profilePhotos, trainingPlanPhoto } from "./trainingVisuals";
import { cn } from "@/lib/utils";
import styles from "./training-app.module.css";

const validationToastId = "fit-onboarding-validation";
const phases = [
  { key: "startingPoint", start: 0 },
  { key: "routine", start: 3 },
  { key: "measurements", start: 7 },
  { key: "plan", start: 10 },
] as const;

const choices: Partial<Record<OnboardingStep, readonly string[]>> = {
  experience: ["new", "months", "year", "years", "advanced"],
  goal: ["shape", "fitness", "lean", "muscle", "weight", "strength"],
  lifestyle: ["sedentary", "active", "standing"],
  equipment: ["commercial", "small", "home", "bodyweight"],
};

export function Onboarding() {
  const t = useTranslations("TrainingApp");
  const { state, dispatch, hydrated } = useTraining();
  const router = useRouter();
  const search = useSearchParams();
  const heading = useRef<HTMLHeadingElement>(null);
  const content = useRef<HTMLElement>(null);
  const [building, setBuilding] = useState(false);
  const submitting = useRef(false);
  const reviewing = search.get("review") === "1";
  const requestedStep = steps.indexOf(search.get("step") as OnboardingStep);
  const index = requestedStep >= 0 ? requestedStep : state.step;
  const step = steps[index];
  const profile = state.profile;
  const imperial = state.units === "imperial";

  useEffect(() => {
    if (!hydrated) return;
    if (requestedStep < 0) router.replace({ pathname: "/training/app/onboarding", query: { step: steps[state.step] } });
    else if (requestedStep !== state.step) dispatch({ type: "step", step: requestedStep });
  }, [requestedStep, state.step, hydrated, dispatch, router]);
  useEffect(() => {
    toast.dismiss(validationToastId);
    heading.current?.focus({ preventScroll: true });
    content.current?.scrollTo({ top: 0, behavior: "instant" });
    window.scrollTo({ top: 0, behavior: "instant" });
    return () => { toast.dismiss(validationToastId); };
  }, [step, hydrated]);
  if (!hydrated) return <TrainingLoading />;

  function move(next: number, returnToReview = reviewing) {
    clearError();
    router.push({ pathname: "/training/app/onboarding", query: { step: steps[next], ...(returnToReview && steps[next] !== "ready" ? { review: "1" } : {}) } });
  }
  function choose(field: keyof TrainingProfile, value: string) {
    clearError();
    dispatch({ type: "profile", patch: { [field]: value } });
  }
  function valid() {
    if (["gender", "experience", "goal", "lifestyle", "equipment"].includes(step)) return Boolean(profile[step as keyof TrainingProfile]);
    if (step === "schedule") return profile.weekdays.length === profile.frequency && isTrainingTimeValid(profile.time);
    return true;
  }
  function validationMessage() {
    const key = step !== "schedule" ? "onboarding.chooseError" : profile.weekdays.length !== profile.frequency ? "onboarding.scheduleError" : "onboarding.timeError";
    return t(key, { count: profile.frequency });
  }
  function showError(message = validationMessage()) {
    toast.error(message, { id: validationToastId });
  }
  function clearError() {
    toast.dismiss(validationToastId);
  }
  function toggleDay(day: number) {
    const selected = profile.weekdays.includes(day);
    if (!selected && profile.weekdays.length >= profile.frequency) {
      showError(t("onboarding.scheduleLimitError", { count: profile.frequency }));
      return;
    }
    clearError();
    dispatch({ type: "profile", patch: { weekdays: selected ? profile.weekdays.filter(d => d !== day) : [...profile.weekdays, day].sort() } });
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    if (!valid()) { showError(); return; }
    if (step === "ready") {
      if (!isProfileComplete(profile)) {
        const missing = (["gender", "experience", "goal", "lifestyle", "equipment"] as const).find(field => !profile[field]);
        move(missing ? steps.indexOf(missing) : steps.indexOf("schedule"));
        return;
      }
      submitting.current = true;
      setBuilding(true);
      dispatch({ type: "complete" });
      router.push("/training/app/signup");
    } else if (reviewing) {
      move(steps.indexOf("ready"));
    } else move(index + 1);
  }
  const optionKeys = step === "goal" && profile.goal && !choices.goal!.includes(profile.goal) ? [...choices.goal!, profile.goal] : choices[step];
  const continueLabel = t(step === "ready" ? "onboarding.getStarted" : reviewing ? "onboarding.returnToReview" : step === "schedule" ? "onboarding.saveSchedule" : "next");
  const activePhase = phases.findLastIndex(phase => index >= phase.start);
  const photoChoices = step === "goal" || step === "equipment";
  const reviewItems: { key: string; value: string; step: OnboardingStep }[] = [
    { key: "goal", value: t(`goals.${profile.goal || "fitness"}`), step: "goal" },
    { key: "experience", value: t(`experience.${profile.experience || "new"}`), step: "experience" },
    { key: "gender", value: t(`gender.${profile.gender || "other"}`), step: "gender" },
    { key: "lifestyle", value: t(`lifestyle.${profile.lifestyle || "sedentary"}`), step: "lifestyle" },
    { key: "equipment", value: t(`equipment.${profile.equipment || "bodyweight"}`), step: "equipment" },
    { key: "frequency", value: t("onboarding.frequencyValue", { count: profile.frequency }), step: "frequency" },
    { key: "schedule", value: `${profile.weekdays.map(day => t(`weekdays.short${day}`)).join(" · ")} / ${profile.time}`, step: "schedule" },
    { key: "height", value: `${displayMeasurement(profile.heightCm, "heightCm", imperial)} ${imperial ? "in" : "cm"}`, step: "height" },
    { key: "weight", value: `${displayMeasurement(profile.weightKg, "weightKg", imperial)} ${imperial ? "lb" : "kg"}`, step: "weight" },
    { key: "age", value: String(profile.age), step: "age" },
  ];

  return <form className={styles.onboarding} onSubmit={submit} onInvalidCapture={event => {
    event.preventDefault();
    const input = event.target;
    if (input instanceof HTMLInputElement && input === event.currentTarget.querySelector("input:invalid")) {
      input.focus();
      showError(t(step === "schedule" ? "onboarding.timeError" : "notifications.profileInvalid"));
    }
  }}>
    <header className={styles.stepHeader}>
      <button type="button" className={styles.iconButton} disabled={building} aria-label={t(reviewing ? "onboarding.reviewBack" : "back")} onClick={() => reviewing ? move(steps.indexOf("ready")) : index === 0 ? router.push("/training/app") : move(index - 1)}><TrainingIcon name="back" /></button>
      <div className={styles.stepProgress} role="progressbar" aria-label={t("onboarding.progress")} aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={index + 1}><span style={{ width: `${(index + 1) / steps.length * 100}%` }} /></div>
      <TrainingLanguage />
      <button type="submit" className={cn(styles.iconButton, styles.stepForward)} disabled={building} aria-label={building ? t("onboarding.building") : continueLabel}><TrainingIcon name="chevron" /></button>
    </header>
    <main ref={content} id="training-main" className={cn(styles.stepMain, photoChoices && styles.photoStepMain)}>
      <div className={styles.stepIntro}>
        <ol className={styles.setupPhases} aria-label={t("onboarding.phasesLabel")}>
          {phases.map((phase, phaseIndex) => <li key={phase.key} aria-current={phaseIndex === activePhase ? "step" : undefined} data-complete={phaseIndex < activePhase || undefined}><span aria-hidden="true">{phaseIndex < activePhase ? <TrainingIcon name="check" /> : phaseIndex + 1}</span><small>{t(`onboarding.phases.${phase.key}`)}</small></li>)}
        </ol>
        <p className={styles.stepCount}>{t("onboarding.step", { current: index + 1, total: steps.length })}</p>
        <h1 ref={heading} tabIndex={-1} className={styles.stepTitle}>{t(`onboarding.${step}.title`)}</h1>
        <p className={styles.stepDescription}>{t(`onboarding.${step}.description`)}</p>
      </div>
      <div className={cn(styles.stepBody, photoChoices && styles.photoStepBody)} style={photoChoices ? { "--photo-choice-rows": Math.ceil((optionKeys?.length || 0) / 2) } as CSSProperties : undefined}>

      {step === "gender" && <div className={styles.genderSection}><div className={styles.genderGrid} role="group" aria-label={t("onboarding.gender.title")}>
        {(["male", "female"] as const).map(gender => <button type="button" key={gender} aria-pressed={profile.gender === gender} className={cn(styles.genderCard, profile.gender === gender && styles.choiceSelected)} onClick={() => choose("gender", gender)}><span className={styles.athletePortrait}><Image src={profilePhotos[gender]} alt="" fill sizes="140px" unoptimized /></span><strong>{t(`gender.${gender}`)}</strong><span className={styles.choiceCheck}><TrainingIcon name="check" /></span></button>)}
      </div><button type="button" className={styles.textButton} aria-pressed={profile.gender === "other"} onClick={() => choose("gender", "other")}>{profile.gender === "other" && <TrainingIcon name="check" />}{t("gender.other")}</button></div>}

      {optionKeys && <div className={cn(styles.choiceList, optionKeys.length > 3 && styles.choiceGrid, photoChoices && styles.photoChoiceGrid)} role="group" aria-label={t(`onboarding.${step}.title`)}>
        {optionKeys.map(value => {
          const selected = profile[step as keyof TrainingProfile] === value;
          const group = step === "goal" ? "goals" : step;
          const photo = step === "goal" ? goalPhotos[value as TrainingGoal] : step === "equipment" ? equipmentPhotos[value as Equipment] : null;
          return <button type="button" key={value} className={cn(styles.choice, photoChoices && styles.photoChoice, selected && styles.choiceSelected)} aria-pressed={selected} onClick={() => choose(step as keyof TrainingProfile, value)}>
            {photo && <span className={styles.choicePhoto}><Image src={photo} alt="" fill sizes="(min-width: 900px) 25vw, 45vw" unoptimized /></span>}
            <span className={styles.choiceCopy}><strong>{t(`${group}.${value}`)}</strong>{photoChoices && <small>{t(`${group}.${value}Description`)}</small>}</span>
            <span className={styles.choiceCheck}><TrainingIcon name="check" /></span>
          </button>;
        })}
      </div>}

      {step === "frequency" && <div className={styles.frequency}><div className={styles.counter}>
        <button type="button" className={styles.iconButton} aria-label={t("onboarding.fewerDays")} disabled={profile.frequency <= 1} onClick={() => { const frequency = profile.frequency - 1; dispatch({ type: "profile", patch: { frequency, weekdays: profile.weekdays.slice(0, frequency) } }); }}>−</button>
        <output aria-live="polite">{profile.frequency}</output>
        <button type="button" className={styles.iconButton} aria-label={t("onboarding.moreDays")} disabled={profile.frequency >= 7} onClick={() => { const frequency = profile.frequency + 1; const nextDay = [1, 3, 5, 0, 2, 4, 6].find(day => !profile.weekdays.includes(day)); dispatch({ type: "profile", patch: { frequency, weekdays: [...profile.weekdays, ...(nextDay === undefined ? [] : [nextDay])].sort() } }); }}>+</button>
      </div><span>{t("onboarding.daysPerWeek")}</span><div className={styles.frequencyDots} aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <i key={i} className={i < profile.frequency ? styles.filledDot : undefined} />)}</div></div>}

      {step === "motivation" && <div className={styles.motivation}>
        <div className={styles.routinePhoto}><Image src={trainingPlanPhoto(profile)} alt="" fill sizes="(min-width: 900px) 45vw, 90vw" unoptimized /><span><TrainingIcon name="calendar" />{t("onboarding.motivation.photoCaption")}</span></div>
        <p>{t("onboarding.motivation.caption")}</p>
        <div className={styles.miniStats}><span><strong>{profile.frequency}</strong>{t("onboarding.daysPerWeek")}</span><span><TrainingIcon name="check" />{t(`goals.${profile.goal || "fitness"}`)}</span></div>
      </div>}

      {(["height", "weight", "age"] as string[]).includes(step) && <>
        <MeasurementInput large key={step} field={step === "height" ? "heightCm" : step === "weight" ? "weightKg" : "age"} value={step === "height" ? profile.heightCm : step === "weight" ? profile.weightKg : profile.age} imperial={imperial} label={t(`profile.${step}`)} onChange={value => dispatch({ type: "profile", patch: { [step === "height" ? "heightCm" : step === "weight" ? "weightKg" : "age"]: value } })} />
        {step !== "age" && <div className={styles.unitSwitch} role="group" aria-label={t("settings.units")}>
          {(["metric", "imperial"] as const).map(units => <button type="button" key={units} aria-pressed={state.units === units} onClick={() => dispatch({ type: "preferences", patch: { units } })}>{t(`units.${units}`)}</button>)}
        </div>}
      </>}

      {step === "schedule" && <div className={styles.schedule}>
        <div className={styles.weekdayGrid} role="group" aria-label={t("onboarding.schedule.days")}>
          {[1, 2, 3, 4, 5, 6, 0].map(day => <button type="button" key={day} aria-pressed={profile.weekdays.includes(day)} aria-label={t(`weekdays.full${day}`)} onClick={() => toggleDay(day)}>{t(`weekdays.short${day}`)}</button>)}
        </div>
        <p className={cn(styles.scheduleCount, profile.weekdays.length !== profile.frequency && styles.invalid)}>{t("onboarding.selectedDays", { selected: profile.weekdays.length, count: profile.frequency })}</p>
        <label className={styles.timeField} htmlFor="training-time"><span><TrainingIcon name="clock" />{t("onboarding.schedule.time")}</span><input id="training-time" type="time" required value={profile.time} onChange={event => { clearError(); dispatch({ type: "profile", patch: { time: event.target.value } }); }} /></label>
        <label className={styles.toggleRow}><span>{t("onboarding.schedule.reminders")}</span><input type="checkbox" checked={state.reminders} onChange={event => dispatch({ type: "preferences", patch: { reminders: event.target.checked } })} /><span className={styles.toggle} aria-hidden="true" /></label>
        <p className={styles.supportingText}>{t("onboarding.schedule.notice")}</p>
      </div>}

      {step === "ready" && <div className={styles.planReview}>
        <div className={styles.reviewBanner}><Image src={trainingPlanPhoto(profile)} alt="" fill sizes="(min-width: 900px) 45vw, 90vw" unoptimized /><span><TrainingIcon name="check" />{t("onboarding.ready.badge")}</span></div>
        <dl className={styles.reviewDetails}>{reviewItems.map(item => <div key={item.key}><dt>{t(`onboarding.review.${item.key}`)}</dt><dd>{item.value}<button type="button" className={styles.reviewEdit} aria-label={t("onboarding.editAnswer", { field: t(`onboarding.review.${item.key}`) })} onClick={() => move(steps.indexOf(item.step), true)}><TrainingIcon name="edit" /></button></dd></div>)}</dl>
        <p className={styles.supportingText}>{t("onboarding.ready.previewNotice")}</p>
      </div>}
      </div>
    </main>
    <footer className={styles.stepFooter}>
      <div className={styles.stepActions}>
        <button type="submit" className={styles.primaryButton} disabled={building}>{building ? <><span className={styles.smallSpinner} />{t("onboarding.building")}</> : <>{continueLabel}<TrainingIcon name="arrow" /></>}</button>
        {step === "schedule" && <button type="button" className={cn(styles.textButton, styles.scheduleSkipButton)} onClick={() => { if (!valid()) { showError(); return; } dispatch({ type: "preferences", patch: { reminders: false } }); move(index + 1); }}>{t("onboarding.skipReminders")}</button>}
      </div>
    </footer>
  </form>;
}
