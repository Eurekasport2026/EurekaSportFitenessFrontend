"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { trainingService } from "@/lib/api/training";
import type { TrainingExercise, TrainingPreview } from "@/lib/training/types";
import { useTraining } from "./TrainingProvider";
import { TrainingHeader, TrainingNav, type TrainingTab } from "./TrainingShell";
import { TrainingPlanSummary } from "./TrainingPlanSummary";
import { TrainingIcon } from "./TrainingIcon";
import { trainingPlanPhoto } from "./trainingVisuals";
import { cn } from "@/lib/utils";
import styles from "./training-app.module.css";

export function Workout() {
  const t = useTranslations("TrainingApp");
  const { state, dispatch } = useTraining();
  const router = useRouter();
  const search = useSearchParams();
  const [preview, setPreview] = useState<TrainingPreview | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [filter, setFilter] = useState("");
  const [exercise, setExercise] = useState<TrainingExercise | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const exerciseHeading = useRef<HTMLHeadingElement>(null);
  const requested = search.get("view");
  const tab: TrainingTab = requested === "exercises" || requested === "library" || requested === "progress" ? requested : "workout";
  const needsPreview = tab !== "progress";

  useEffect(() => {
    let active = true;
    setError(false);
    setPreview(null);
    trainingService.getPreview(state.profile).then(data => { if (active) setPreview(data); }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [state.profile, retry]);
  useEffect(() => {
    if (!exercise) return;
    if (!dialog.current?.open) dialog.current?.showModal();
    dialog.current?.scrollTo({ top: 0 });
    exerciseHeading.current?.focus({ preventScroll: true });
  }, [exercise]);

  function editPlan() { router.push({ pathname: "/training/app/onboarding", query: { step: "ready" } }); }
  function showExercise(item: TrainingExercise) { setExercise(item); }
  const workout = preview?.workouts[state.selectedDay] ?? preview?.workouts[0];
  const allExercises = preview ? Array.from(new Map(preview.workouts.flatMap(w => w.exercises).map(e => [e.id, e])).values()) : [];
  const filtered = allExercises.filter(e => t(`exercises.${e.name}`).toLocaleLowerCase().includes(filter.toLocaleLowerCase()));
  const exerciseSequence = tab === "workout" ? workout?.exercises || [] : filtered;
  const exerciseIndex = exerciseSequence.findIndex(item => item.id === exercise?.id);

  function prescription(item: TrainingExercise) {
    return item.reps.endsWith(" s") ? t("workout.holdPrescription", { sets: item.sets, seconds: item.reps.slice(0, -2) }) : t("workout.prescription", { sets: item.sets, reps: item.reps });
  }

  function exerciseRow(item: TrainingExercise) {
    return <button type="button" className={styles.exerciseRow} key={item.id} onClick={() => showExercise(item)}>
      <span className={styles.exerciseThumb}><Image src={`/images/muscles/${item.muscle}.svg`} alt="" width={48} height={48} unoptimized /></span>
      <span className={styles.exerciseCopy}><strong>{t(`exercises.${item.name}`)}</strong><small className={styles.mobilePrescription}>{prescription(item)}</small><small className={styles.exerciseMuscle}>{t(`muscles.${item.muscle}`)}</small></span>
      <span className={styles.exerciseDose}>{prescription(item)}</span>
      <TrainingIcon name="chevron" className={styles.exerciseArrow} />
      <span className={styles.muscleIcon}><Image src={`/images/muscles/${item.muscle}.svg`} alt={t(`muscles.${item.muscle}`)} width={27} height={34} unoptimized /></span>
    </button>;
  }
  return <div className={styles.dashboard}>
    <TrainingNav active={tab} />
    <TrainingHeader><Link href="/training/app/membership" className={styles.premiumLink}><TrainingIcon name="crown" /><span>{t("membership.upgrade")}</span></Link></TrainingHeader>
    <main id="training-main" className={styles.dashboardMain}>
      <div className={cn(styles.workoutWorkspace, (tab === "workout" || tab === "progress") && styles.withPlanSummary)}><div className={styles.workoutContent}>
      {tab === "workout" && <>
        <div className={styles.planHeading}><details className={styles.planMenu}><summary>{t("workout.myPlan")}<TrainingIcon name="chevron" /></summary><div><span>{t(`goals.${state.profile.goal || "fitness"}`)}</span><button type="button" onClick={editPlan}><TrainingIcon name="edit" />{t("workout.editPlan")}</button></div></details><span className={styles.previewBadge}>{t("workout.preview")}</span></div>
        <div className={styles.dayTabs} role="group" aria-label={t("workout.selectDay")}>
          {Array.from({ length: state.profile.frequency }, (_, day) => <button type="button" key={day} aria-pressed={state.selectedDay === day} onClick={() => dispatch({ type: "preferences", patch: { selectedDay: day } })}><strong>{t("workout.day", { day: day + 1 })}</strong><small>{t(`weekdays.short${state.profile.weekdays[day]}`)}</small></button>)}
        </div>
        <section className={styles.workoutSpotlight} aria-labelledby="training-workout-title">
          <Image src={trainingPlanPhoto(state.profile)} alt="" fill sizes="(min-width: 1200px) 55vw, (min-width: 900px) 70vw, 100vw" unoptimized />
          <div className={styles.workoutSpotlightCopy}><p className={styles.eyebrow}>{t("workout.foundation")}</p><h1 id="training-workout-title">{t("workout.today")}</h1>{workout && <p className={styles.workoutFocus}>{t(`workout.${workout.focus}`)}</p>}<p>{t("workout.intro")}</p>
            {workout && <div className={styles.spotlightMeta}><span><TrainingIcon name="dumbbell" />{t("workout.exerciseCount", { count: workout.exercises.length })}</span><span><TrainingIcon name="clock" />{t("workout.duration", { count: workout.minutes })}</span></div>}
            <button type="button" className={styles.primaryButton} disabled={!workout?.exercises.length} onClick={() => { if (workout?.exercises[0]) showExercise(workout.exercises[0]); }}>{t("workout.exploreExercises")}<TrainingIcon name="arrow" /></button>
          </div>
        </section>
        {workout && <section className={styles.workoutCard} aria-label={t("workout.exerciseList")}>
          <div className={styles.workoutMeta}><span><TrainingIcon name="dumbbell" />{t("workout.exerciseCount", { count: workout.exercises.length })}</span><span><TrainingIcon name="clock" />{t("workout.duration", { count: workout.minutes })}</span></div>
          <div className={styles.exerciseTableHead} aria-hidden="true"><span>{t("desktop.exercise")}</span><span>{t("desktop.prescription")}</span></div>
          <div className={styles.exerciseGrid}>{workout.exercises.map(exerciseRow)}</div>
        </section>}
        <p className={styles.previewNote}>{t("workout.previewNote")}</p>
        <aside className={styles.membershipPrompt}><TrainingIcon name="crown" /><div><h2>{t("workout.membershipTitle")}</h2><p>{t("workout.membershipOptional")}</p><Link href="/training/app/membership">{t("workout.unlock")}<TrainingIcon name="arrow" /></Link></div></aside>
      </>}
      {(tab === "exercises" || tab === "library") && <>
        <div className={styles.sectionTitle}><span className={styles.eyebrow}>EUREKA! FIT</span><h1>{t(`nav.${tab}`)}</h1><p>{t(tab === "library" ? "workout.libraryDescription" : "workout.exercisesDescription")}</p></div>
        <label className={styles.searchField}><TrainingIcon name="search" /><span className={styles.srOnly}>{t("workout.search")}</span><input type="search" value={filter} placeholder={t("workout.search")} onChange={event => setFilter(event.target.value)} /></label>
        {tab === "library" && <div className={styles.libraryCard}><span className={styles.libraryPhoto}><Image src={trainingPlanPhoto(state.profile)} alt="" fill sizes="80px" unoptimized /></span><div><strong>{t(`goals.${state.profile.goal || "fitness"}`)}</strong><p>{t("onboarding.frequencyValue", { count: state.profile.frequency })} · {t(`equipment.${state.profile.equipment || "bodyweight"}`)}</p></div><button type="button" className={styles.iconButton} aria-label={t("workout.editPlan")} onClick={editPlan}><TrainingIcon name="edit" /></button></div>}
        {filtered.length > 0 && <section className={cn(styles.workoutCard, styles.exerciseGrid, styles.exerciseCatalog)} aria-label={t("workout.exerciseList")}>{filtered.map(exerciseRow)}</section>}
        {!filtered.length && preview && <p className={styles.emptyText}>{t("workout.noResults")}</p>}
      </>}
      {tab === "progress" && <div className={styles.progressPanel}>
        <span className={styles.eyebrow}>EUREKA! FIT</span><h1>{t("nav.progress")}</h1>
        <div className={styles.progressEmpty}><TrainingIcon name="chart" /><h2>{t("workout.progressTitle")}</h2><p>{t("workout.progressDescription")}</p><Link href="/training/app/workout" className={styles.secondaryButton}>{t("workout.viewPlan")}</Link></div>
      </div>}
      {needsPreview && !preview && !error && <div className={styles.skeletons} role="status" aria-busy="true"><span className={styles.srOnly}>{t("loading")}</span>{Array.from({ length: 5 }, (_, i) => <div key={i} aria-hidden="true" />)}</div>}
      {needsPreview && error && <div role="alert" className={styles.feedback}><p>{t("workout.error")}</p><button type="button" className={styles.secondaryButton} onClick={() => setRetry(value => value + 1)}>{t("retry")}</button></div>}
      </div>{(tab === "workout" || tab === "progress") && <TrainingPlanSummary onEdit={editPlan} />}</div>
    </main>
    <dialog ref={dialog} className={styles.exerciseDialog} aria-labelledby="training-exercise-title" onClose={() => setExercise(null)} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.current?.close();
    }}>
      {exercise && <>
        <div className={styles.dialogTop}><span className={styles.eyebrow}>{t(`muscles.${exercise.muscle}`)}</span><button type="button" className={styles.iconButton} aria-label={t("close")} onClick={() => dialog.current?.close()}><TrainingIcon name="close" /></button></div>
        <div className={styles.exerciseDetail}>
          <Image src={`/images/muscles/${exercise.muscle}.svg`} alt={t(`muscles.${exercise.muscle}`)} width={150} height={170} className={styles.dialogMuscle} unoptimized />
          <div><h2 ref={exerciseHeading} tabIndex={-1} id="training-exercise-title">{t(`exercises.${exercise.name}`)}</h2><p className={styles.accentText}>{prescription(exercise)}</p><p>{t(`cues.${exercise.cue}`)}</p><p className={styles.supportingText}>{t("workout.exerciseNotice")}</p></div>
        </div>
        {exerciseIndex >= 0 && <div className={styles.exerciseGuidanceNav}>
          <button type="button" className={styles.iconButton} aria-label={t("workout.previousExercise")} disabled={exerciseIndex === 0} onClick={() => showExercise(exerciseSequence[exerciseIndex - 1])}><TrainingIcon name="back" /></button>
          <span>{t("workout.exercisePosition", { current: exerciseIndex + 1, total: exerciseSequence.length })}</span>
          <button type="button" className={styles.iconButton} aria-label={t("workout.nextExercise")} disabled={exerciseIndex === exerciseSequence.length - 1} onClick={() => showExercise(exerciseSequence[exerciseIndex + 1])}><TrainingIcon name="chevron" /></button>
        </div>}
        <button type="button" className={styles.secondaryButton} onClick={() => dialog.current?.close()}>{t("workout.backToExercises")}</button>
      </>}
    </dialog>
  </div>;
}
