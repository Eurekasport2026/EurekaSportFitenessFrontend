"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/routing";
import { useAuth } from "@/components/features/training-app/AuthProvider";
import { useTraining } from "@/components/features/training-app/TrainingProvider";
import { TrainingInfoButton } from "@/components/features/training-app/TrainingInfoButton";
import { TrainingIcon } from "@/components/features/training-app/TrainingIcon";
import { TrainingLoader } from "@/components/features/training-app/TrainingLoader";
import { MeasurementInput } from "@/components/features/training-app/MeasurementInput";
import { goals, type Equipment, type Experience, type TrainingGoal, type TrainingProfile, type Units } from "@/lib/training/types";
import { isTrainingTimeValid } from "@/lib/training/state";
import { trainingCalendar } from "@/lib/training/calendar";
import styles from "./athlete-settings.module.css";

function invalidForm(event: FormEvent<HTMLFormElement>, message: string, id: string) {
  event.preventDefault();
  const first = event.currentTarget.querySelector<HTMLElement>(":invalid");
  if (first === event.target) { first.focus(); toast.error(message, { id }); }
}

function PreferencesForm() {
  const t = useTranslations("TrainingApp");
  const en = useLocale() === "en";
  const { state, dispatch } = useTraining();
  const [experience, setExperience] = useState(state.profile.experience);
  const [goal, setGoal] = useState(state.profile.goal);
  const [equipment, setEquipment] = useState(state.profile.equipment);
  const [units, setUnits] = useState(state.units);
  return <form className={styles.card} onSubmit={event => {
    event.preventDefault();
    dispatch({ type: "profile", patch: { experience, goal, equipment } });
    dispatch({ type: "preferences", patch: { units } });
    toast.success(t("notifications.preferencesUpdated"), { id: "athlete-preferences" });
  }}>
    <div className={styles.cardHeading}><TrainingIcon name="settings" /><div><span className={styles.eyebrow}>MADE FOR YOU</span><h2>{en ? "Training preferences" : "Preferenze di allenamento"}</h2></div></div>
    <div className={styles.fields}>
      <label>{t("settings.experience")}<select value={experience ?? ""} onChange={event => setExperience(event.target.value as Experience)}><option value="" disabled>{en ? "Choose your experience" : "Scegli la tua esperienza"}</option>{(["new", "months", "year", "years", "advanced"] as const).map(value => <option key={value} value={value}>{t(`experience.${value}`)}</option>)}</select></label>
      <label>{t("profile.goal")}<select value={goal ?? ""} onChange={event => setGoal(event.target.value as TrainingGoal)}><option value="" disabled>{en ? "Choose your goal" : "Scegli il tuo obiettivo"}</option>{goals.map(value => <option key={value} value={value}>{t(`goals.${value}`)}</option>)}</select></label>
      <label>{t("profile.equipment")}<select value={equipment ?? ""} onChange={event => setEquipment(event.target.value as Equipment)}><option value="" disabled>{en ? "Choose your equipment" : "Scegli l’attrezzatura"}</option>{(["commercial", "small", "home", "bodyweight"] as const).map(value => <option key={value} value={value}>{t(`equipment.${value}`)}</option>)}</select></label>
    </div>
    <fieldset className={styles.unitField}><legend>{t("settings.units")}</legend><div className={styles.unitSwitch}>{(["metric", "imperial"] as Units[]).map(value => <button key={value} type="button" aria-pressed={units === value} onClick={() => setUnits(value)}>{t(`units.${value}`)}</button>)}</div></fieldset>
    <div className={styles.formActions}><button type="submit" className={styles.primary}>{t("save")}<TrainingIcon name="check" /></button></div>
  </form>;
}

function ScheduleForm() {
  const t = useTranslations("TrainingApp");
  const en = useLocale() === "en";
  const { state, dispatch } = useTraining();
  const [frequency, setFrequency] = useState(state.profile.frequency);
  const [weekdays, setWeekdays] = useState(state.profile.weekdays);
  const [time, setTime] = useState(state.profile.time);
  const [reminders, setReminders] = useState(state.reminders);
  const dayGroup = useRef<HTMLFieldSetElement>(null);
  const timeInput = useRef<HTMLInputElement>(null);
  const id = "athlete-schedule";
  function valid() {
    if (weekdays.length !== frequency) { toast.error(t("onboarding.scheduleError", { count: frequency }), { id }); dayGroup.current?.querySelector("button")?.focus(); return false; }
    if (!isTrainingTimeValid(time)) { toast.error(t("onboarding.timeError"), { id }); timeInput.current?.focus(); return false; }
    return true;
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid()) return;
    dispatch({ type: "profile", patch: { frequency, weekdays, time } });
    dispatch({ type: "preferences", patch: { reminders } });
    toast.success(t("notifications.scheduleUpdated"), { id });
  }
  function exportCalendar() {
    if (!valid()) return;
    try {
      const calendar = trainingCalendar({ ...state.profile, frequency, weekdays, time }, t("calendar.title"), t("calendar.description"));
      const url = URL.createObjectURL(new Blob([calendar], { type: "text/calendar;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url; link.download = "eureka-workouts.ics";
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(t("notifications.calendarDownload"), { id });
    } catch { toast.error(en ? "Unable to export the calendar. Please try again." : "Impossibile esportare il calendario. Riprova.", { id }); }
  }
  return <form className={styles.card} onSubmit={save} onInvalidCapture={event => invalidForm(event, t("onboarding.timeError"), id)}>
    <div className={styles.cardHeading}><TrainingIcon name="calendar" /><div><span className={styles.eyebrow}>FIND YOUR RHYTHM</span><h2>{t("settings.reminders")}</h2></div></div>
    <label className={styles.field}>{en ? "Sessions per week" : "Sessioni a settimana"}<select value={frequency} onChange={event => { toast.dismiss(id); setFrequency(Number(event.target.value)); }}>{[1, 2, 3, 4, 5, 6, 7].map(value => <option key={value} value={value}>{value}</option>)}</select></label>
    <fieldset ref={dayGroup} className={styles.daysField} aria-invalid={weekdays.length !== frequency} aria-describedby="athlete-selected-days"><legend>{t("onboarding.schedule.days")}</legend><div className={styles.weekdays}>{[1, 2, 3, 4, 5, 6, 0].map(day => <button type="button" key={day} aria-label={t(`weekdays.full${day}`)} aria-pressed={weekdays.includes(day)} onClick={() => {
      if (!weekdays.includes(day) && weekdays.length >= frequency) { toast.error(t("onboarding.scheduleLimitError", { count: frequency }), { id }); return; }
      toast.dismiss(id); setWeekdays(current => current.includes(day) ? current.filter(value => value !== day) : [...current, day].sort());
    }}>{t(`weekdays.short${day}`)}</button>)}</div></fieldset>
    <p id="athlete-selected-days" className={styles.help}>{t("onboarding.selectedDays", { selected: weekdays.length, count: frequency })}</p>
    <label className={styles.field}>{t("onboarding.schedule.time")}<input ref={timeInput} type="time" required value={time} onChange={event => { toast.dismiss(id); setTime(event.target.value); }} /></label>
    <label className={styles.checkbox}><input type="checkbox" checked={reminders} onChange={event => setReminders(event.target.checked)} /><span>{t("onboarding.schedule.reminders")}</span></label>
    <p className={styles.help}>{t("onboarding.schedule.notice")}</p>
    <div className={styles.formActions}><button type="submit" className={styles.primary}>{t("save")}<TrainingIcon name="check" /></button><button type="button" className={styles.secondary} onClick={exportCalendar}><TrainingIcon name="calendar" />{t("settings.exportCalendar")}</button></div>
  </form>;
}

export function AthleteSettings() {
  const t = useTranslations("TrainingApp");
  const en = useLocale() === "en";
  const { session, logout } = useAuth();
  const { hydrated, dispatch } = useTraining();
  const router = useRouter();
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEpoch, setResetEpoch] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (resetOpen && !dialog.current?.open) dialog.current?.showModal();
    if (!resetOpen && dialog.current?.open) dialog.current.close();
  }, [resetOpen]);
  if (!hydrated) return <TrainingLoader compact />;
  return <div className={styles.settings}>
    <div className={styles.intro}><span className={styles.eyebrow}>YOUR SPACE. YOUR ROUTINE.</span><h2>{t("settings.title")}</h2><p>{t("settings.description")}</p></div>
    <div className={styles.settingsGrid}>
      <div className={styles.forms}><section className={styles.accountCard}><span className={styles.avatarInitials}>{(session?.user.name.trim() || "EF").split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase()}</span><div><span className={styles.eyebrow}>{en ? "YOUR ACCOUNT" : "IL TUO ACCOUNT"}</span><h3>{session?.user.name}</h3><p>{session?.user.email}</p></div><Link href="/athlete/profile" className={styles.secondary}>{t("settings.profile")}<TrainingIcon name="arrow" /></Link></section>
        <PreferencesForm key={`preferences-${resetEpoch}`} /><ScheduleForm key={`schedule-${resetEpoch}`} />
      </div>
      <aside className={styles.sideColumn}><section className={styles.card}><div className={styles.cardHeading}><TrainingIcon name="help" /><h2>{en ? "Support & privacy" : "Supporto e privacy"}</h2></div><div className={styles.supportLinks}>{(["help", "privacy", "terms", "cookies"] as const).map(kind => <TrainingInfoButton key={kind} kind={kind} className={styles.supportLink}><span>{t(kind === "help" ? "settings.help" : kind === "cookies" ? "product.cookies" : kind)}</span><TrainingIcon name="chevron" /></TrainingInfoButton>)}</div><Link href="/" className={styles.returnLink}>{t("backToSite")}<TrainingIcon name="arrow" /></Link></section>
        <section className={styles.card}><span className={styles.eyebrow}>ACCOUNT CONTROLS</span><h2>{en ? "Your account, in your hands." : "Il tuo account, nelle tue mani."}</h2><p className={styles.help}>{en ? "Reset your training preferences when you want a fresh start. Your recorded workouts and coach feedback stay in your history." : "Ripristina le preferenze quando vuoi ricominciare. Gli allenamenti registrati e i feedback del coach restano nello storico."}</p><button className={styles.secondary} type="button" onClick={() => setResetOpen(true)}>{en ? "Reset training preferences" : "Ripristina preferenze"}</button><button className={styles.danger} type="button" disabled={signingOut} onClick={async () => {
          if (signingOut) return;
          setSigningOut(true);
          try { await logout(); router.replace("/training/app/login"); } catch { /* AuthProvider owns logout feedback. */ } finally { setSigningOut(false); }
        }}>{t(signingOut ? "session.signingOut" : "session.signOut")}<TrainingIcon name="logout" /></button></section>
      </aside>
    </div>
    <dialog ref={dialog} className={styles.confirmDialog} aria-labelledby="athlete-reset-title" onCancel={() => setResetOpen(false)} onClose={() => setResetOpen(false)}><span className={styles.eyebrow}>EUREKA! FIT</span><h2 id="athlete-reset-title">{en ? "Reset training preferences?" : "Ripristinare le preferenze?"}</h2><p>{en ? "This resets your training details, photo and schedule. Your account, programs, recorded workouts and coach feedback are preserved." : "Questa azione ripristina dati di allenamento, foto e calendario. Account, programmi, allenamenti registrati e feedback del coach restano disponibili."}</p><div className={styles.formActions}><button type="button" className={styles.secondary} autoFocus onClick={() => setResetOpen(false)}>{t("cancel")}</button><button type="button" className={styles.danger} onClick={() => { dispatch({ type: "reset" }); setResetEpoch(value => value + 1); setResetOpen(false); toast.success(t("notifications.preferencesReset"), { id: "athlete-settings-reset" }); }}>{en ? "Reset preferences" : "Ripristina preferenze"}</button></div></dialog>
  </div>;
}

type ProfileDraft = Pick<TrainingProfile, "gender" | "age" | "heightCm" | "weightKg" | "avatar">;

export function AthleteProfile() {
  const { hydrated } = useTraining();
  return hydrated ? <ProfileForm /> : <TrainingLoader compact />;
}

function ProfileForm() {
  const t = useTranslations("TrainingApp");
  const en = useLocale() === "en";
  const { state, dispatch } = useTraining();
  const { session } = useAuth();
  const router = useRouter();
  const [draft, setDraft] = useState<ProfileDraft>(() => ({ gender: state.profile.gender ?? "other", age: state.profile.age, heightCm: state.profile.heightCm, weightKg: state.profile.weightKg, avatar: state.profile.avatar }));
  const [reading, setReading] = useState(false);
  const readerRef = useRef<FileReader | null>(null);
  const id = "athlete-profile";
  useEffect(() => () => { readerRef.current?.abort(); readerRef.current = null; }, []);
  function avatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2000000) { toast.error(t("profile.imageError"), { id }); event.target.value = ""; return; }
    readerRef.current?.abort();
    const reader = new FileReader(); readerRef.current = reader; setReading(true);
    reader.onload = () => { if (readerRef.current !== reader) return; setDraft(value => ({ ...value, avatar: String(reader.result) })); setReading(false); };
    reader.onerror = () => { if (readerRef.current !== reader) return; toast.error(t("profile.imageError"), { id }); setReading(false); };
    reader.readAsDataURL(file);
  }
  return <form className={styles.profile} onInvalidCapture={event => invalidForm(event, t("notifications.profileInvalid"), id)} onSubmit={event => {
    event.preventDefault(); if (reading) return;
    const { gender, age, heightCm, weightKg, avatar } = draft;
    dispatch({ type: "profile", patch: { gender, age, heightCm, weightKg, avatar } });
    toast.success(t("notifications.profileUpdated"), { id });
    router.push("/athlete/settings");
  }}>
    <div className={styles.profileGrid}><section className={styles.photoCard}><label htmlFor="athlete-avatar" className={styles.photoPreview}>
      {/* The account-owned photo is never sent to public image optimization. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {draft.avatar ? <img src={draft.avatar} alt={t("profile.avatar")} /> : <TrainingIcon name="camera" />}
      <span className={styles.photoCaption}><TrainingIcon name="edit" />{t("profile.changeAvatar")}</span></label><input id="athlete-avatar" className={styles.fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={avatar} aria-label={t("profile.changeAvatar")} /><p className={styles.help}>{en ? "JPG, PNG or WebP · up to 2 MB" : "JPG, PNG o WebP · fino a 2 MB"}</p>{draft.avatar && <button type="button" className={styles.secondary} disabled={reading} onClick={() => setDraft(value => ({ ...value, avatar: "" }))}>{t("profile.removeAvatar")}</button>}</section>
      <section className={styles.card}><div className={styles.cardHeading}><TrainingIcon name="user" /><div><span className={styles.eyebrow}>YOUR ATHLETE PROFILE</span><h2>{en ? "Your details" : "I tuoi dati"}</h2></div></div><div className={styles.fields}><label>{t("profile.name")}<input value={session?.user.name ?? ""} readOnly autoComplete="name" /></label><label>Email<input type="email" value={session?.user.email ?? ""} readOnly autoComplete="email" /></label><label>{t("profile.gender")}<select value={draft.gender ?? "other"} onChange={event => setDraft(value => ({ ...value, gender: event.target.value as ProfileDraft["gender"] }))}>{["male", "female", "other"].map(value => <option key={value} value={value}>{t(`gender.${value}`)}</option>)}</select></label></div><p className={styles.help}>{en ? "Your account name and email come from your verified account." : "Nome ed email provengono dal tuo account verificato."}</p></section>
    </div>
    <section className={styles.card}><div className={styles.cardHeading}><TrainingIcon name="ruler" /><h2>{en ? "Training measurements" : "Misure per l’allenamento"}</h2></div><div className={styles.profileMetrics}>{(["age", "weightKg", "heightCm"] as const).map(field => <MeasurementInput key={field} field={field} value={draft[field]} imperial={state.units === "imperial"} label={t(`profile.${field === "weightKg" ? "weight" : field === "heightCm" ? "height" : "age"}`)} onChange={value => setDraft(current => ({ ...current, [field]: value }))} />)}</div><p className={styles.help}>{t("profile.localNotice")}</p><div className={styles.formActions}><Link href="/athlete/settings" className={styles.secondary}>{t("cancel")}</Link><button type="submit" className={styles.primary} disabled={reading}>{reading ? en ? "Reading photo…" : "Lettura foto…" : t("save")}<TrainingIcon name="check" /></button></div></section>
  </form>;
}
