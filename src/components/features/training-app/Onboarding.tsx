"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { steps, type TrainingProfile, type OnboardingStep } from "@/lib/training/types";
import { isProfileComplete, isTrainingTimeValid } from "@/lib/training/state";
import { useTraining } from "./TrainingProvider";
import { TrainingIcon } from "./TrainingIcon";
import { MeasurementInput } from "./MeasurementInput";
import { TrainingLanguage, TrainingLoading } from "./TrainingShell";
import { cn } from "@/lib/utils";
import styles from "./training-app.module.css";

const validationToastId = "fit-onboarding-validation";

const choices: Partial<Record<OnboardingStep, readonly string[]>> = {
  experience: ["new", "months", "year", "years", "advanced"],
  goal: ["shape", "fitness", "lean", "muscle", "weight", "strength"],
  lifestyle: ["sedentary", "active", "standing"],
  equipment: ["commercial", "small", "home", "bodyweight"],
};

function AthleteFigure({ female }: { female: boolean }) {
  return <svg viewBox="0 0 110 180" fill="none" aria-hidden="true" className={styles.athleteFigure}>
    <circle cx="55" cy="25" r="13" fill="#b3c3cc" />
    <path d={female ? "M39 43Q55 36 71 43L67 70 73 94H37l6-24z" : "M31 44Q55 33 79 44L69 89H41z"} fill="#748d9e" />
    <path d="M37 90h36l-5 37-5 39H51l-1-56-5 56H33l6-42z" fill="#253d50" />
    <path d={female ? "M38 46 29 75 23 97M72 46l9 29 6 22" : "M32 47 22 74 18 99M78 47l10 27 4 25"} stroke="#b3c3cc" strokeWidth="10" strokeLinecap="round" />
    <path d="M44 68h22M47 77h16" stroke="#00c48c" strokeWidth="2" />
    <path d="M33 169h13m7 0h13" stroke="#b3c3cc" strokeWidth="6" strokeLinecap="round" />
    {female && <path d="M42 19Q55 1 68 19l3 24-10-6V17H49v20l-10 6z" fill="#253d50" />}
  </svg>;
}

export function Onboarding() {
  const t = useTranslations("TrainingApp");
  const { state, dispatch, hydrated } = useTraining();
  const router = useRouter();
  const search = useSearchParams();
  const heading = useRef<HTMLHeadingElement>(null);
  const content = useRef<HTMLElement>(null);
  const [error, setError] = useState("");
  const [building, setBuilding] = useState(false);
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
    setError("");
    toast.dismiss(validationToastId);
    heading.current?.focus({ preventScroll: true });
    content.current?.scrollTo({ top: 0, behavior: "instant" });
    window.scrollTo({ top: 0, behavior: "instant" });
    return () => { toast.dismiss(validationToastId); };
  }, [step, hydrated]);
  useEffect(() => {
    if (!building) return;
    const timer = window.setTimeout(() => {
      dispatch({ type: "complete" });
      router.replace("/training/app/membership");
    }, 850);
    return () => window.clearTimeout(timer);
  }, [building, dispatch, router]);

  if (!hydrated) return <TrainingLoading />;

  function move(next: number) {
    clearError();
    router.push({ pathname: "/training/app/onboarding", query: { step: steps[next] } });
  }
  function choose(field: keyof TrainingProfile, value: string) {
    dispatch({ type: "profile", patch: { [field]: value } });
    move(index + 1);
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
    setError(message);
    toast.error(message, { id: validationToastId });
  }
  function clearError() {
    setError("");
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
    if (building) return;
    if (!valid()) { showError(); return; }
    if (step === "ready") {
      if (!isProfileComplete(profile)) {
        const missing = (["gender", "experience", "goal", "lifestyle", "equipment"] as const).find(field => !profile[field]);
        move(missing ? steps.indexOf(missing) : steps.indexOf("schedule"));
        return;
      }
      setBuilding(true);
    } else move(index + 1);
  }
  const optionKeys = step === "goal" && profile.goal && !choices.goal!.includes(profile.goal) ? [...choices.goal!, profile.goal] : choices[step];
  const continueLabel = t(step === "ready" ? "onboarding.getStarted" : step === "schedule" ? "onboarding.saveSchedule" : "next");

  return <form className={styles.onboarding} onSubmit={submit}>
    <header className={styles.stepHeader}>
      <button type="button" className={styles.iconButton} disabled={building} aria-label={t("back")} onClick={() => index === 0 ? router.push("/training/app") : move(index - 1)}><TrainingIcon name="back" /></button>
      <div className={styles.stepProgress} role="progressbar" aria-label={t("onboarding.progress")} aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={index + 1}><span style={{ width: `${(index + 1) / steps.length * 100}%` }} /></div>
      <TrainingLanguage />
      <button type="submit" className={cn(styles.iconButton, styles.stepForward)} disabled={building} aria-label={building ? t("onboarding.building") : continueLabel}><TrainingIcon name="chevron" /></button>
    </header>
    <main ref={content} id="training-main" className={styles.stepMain}>
      <div className={styles.stepIntro}>
        <p className={styles.stepCount}>{t("onboarding.step", { current: index + 1, total: steps.length })}</p>
        <h1 ref={heading} tabIndex={-1} className={styles.stepTitle}>{t(`onboarding.${step}.title`)}</h1>
        <p className={styles.stepDescription}>{t(`onboarding.${step}.description`)}</p>
      </div>
      <div className={styles.stepBody}>

      {step === "gender" && <div className={styles.genderSection}><div className={styles.genderGrid} role="group" aria-label={t("onboarding.gender.title")}>
        {(["male", "female"] as const).map(gender => <button type="button" key={gender} aria-pressed={profile.gender === gender} className={cn(styles.genderCard, profile.gender === gender && styles.choiceSelected)} onClick={() => choose("gender", gender)}><AthleteFigure female={gender === "female"} /><strong>{t(`gender.${gender}`)}</strong><span className={styles.choiceCheck}><TrainingIcon name="check" /></span></button>)}
      </div><button type="button" className={styles.textButton} onClick={() => choose("gender", "other")}>{t("gender.other")}</button></div>}

      {optionKeys && <div className={cn(styles.choiceList, optionKeys.length > 3 && styles.choiceGrid)} role="group" aria-label={t(`onboarding.${step}.title`)}>
        {optionKeys.map(value => {
          const selected = profile[step as keyof TrainingProfile] === value;
          const group = step === "goal" ? "goals" : step;
          return <button type="button" key={value} className={cn(styles.choice, selected && styles.choiceSelected)} aria-pressed={selected} onClick={() => choose(step as keyof TrainingProfile, value)}>
            {step === "equipment" && <span className={styles.choiceIcon}><TrainingIcon name={value === "bodyweight" ? "user" : value === "home" ? "dumbbell" : "book"} /></span>}
            <span><strong>{t(`${group}.${value}`)}</strong>{(step === "goal" || step === "equipment") && <small>{t(`${group}.${value}Description`)}</small>}</span>
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
        <div className={styles.motivationChart} aria-hidden="true"><div><span /><small>{t("onboarding.motivation.before")}</small></div><div><TrainingIcon name="chart" /><span /><small>EUREKA! FIT</small></div></div>
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
        <label className={styles.timeField} htmlFor="training-time"><span><TrainingIcon name="clock" />{t("onboarding.schedule.time")}</span><input id="training-time" type="time" required value={profile.time} onInvalid={() => showError(t("onboarding.timeError"))} onChange={event => { clearError(); dispatch({ type: "profile", patch: { time: event.target.value } }); }} /></label>
        <label className={styles.toggleRow}><span>{t("onboarding.schedule.reminders")}</span><input type="checkbox" checked={state.reminders} onChange={event => dispatch({ type: "preferences", patch: { reminders: event.target.checked } })} /><span className={styles.toggle} aria-hidden="true" /></label>
        <p className={styles.supportingText}>{t("onboarding.schedule.notice")}</p>
      </div>}

      {step === "ready" && <div className={styles.ready}>
        <div className={styles.readyBadge}><TrainingIcon name="dumbbell" /><span>EUREKA! FIT</span><strong>{t("onboarding.ready.badge")}</strong><span>★ ★ ★</span></div>
        <div className={styles.summary}><p><span>{t("profile.goal")}</span><strong>{t(`goals.${profile.goal || "fitness"}`)}</strong></p><p><span>{t("profile.frequency")}</span><strong>{t("onboarding.frequencyValue", { count: profile.frequency })}</strong></p><p><span>{t("profile.equipment")}</span><strong>{t(`equipment.${profile.equipment || "bodyweight"}`)}</strong></p></div>
      </div>}
      </div>
    </main>
    <footer className={styles.stepFooter}>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <button type="submit" className={styles.primaryButton} disabled={building}>{building ? <><span className={styles.smallSpinner} />{t("onboarding.building")}</> : <>{continueLabel}<TrainingIcon name="arrow" /></>}</button>
      {step === "schedule" && <button type="button" className={styles.textButton} onClick={() => { if (!valid()) { showError(); return; } dispatch({ type: "preferences", patch: { reminders: false } }); move(index + 1); }}>{t("onboarding.skipReminders")}</button>}
      <p className={styles.autoSave}>{t("onboarding.autoSave")}</p>
    </footer>
  </form>;
}
