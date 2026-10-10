"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/routing";
import { trainingCalendar } from "@/lib/training/calendar";
import { isTrainingTimeValid } from "@/lib/training/state";
import { useTraining } from "./TrainingProvider";
import { useAuth } from "./AuthProvider";
import { TrainingHeader, TrainingNav } from "./TrainingShell";
import { TrainingIcon, type TrainingIconProps } from "./TrainingIcon";
import { TrainingInfoButton } from "./TrainingInfoButton";
import styles from "./training-app.module.css";

const scheduleToastId = "fit-settings-schedule-validation";
const settingsToastId = "fit-settings-update";

interface SettingsSectionProps { icon: TrainingIconProps["name"]; label: string; value?: string; children: ReactNode }
function SettingsSection({ icon, label, value, children }: SettingsSectionProps) {
  return <details className={styles.settingsSection}><summary><TrainingIcon name={icon} /><span className={styles.settingsRowCopy}><span>{label}</span>{value && <small>{value}</small>}</span><TrainingIcon name="chevron" /></summary><div className={styles.settingsContent}>{children}</div></details>;
}

function ScheduleSettings() {
  const t = useTranslations("TrainingApp");
  const { state, dispatch } = useTraining();
  const [weekdays, setWeekdays] = useState(state.profile.weekdays);
  const [time, setTime] = useState(state.profile.time);
  const [reminders, setReminders] = useState(state.reminders);
  const valid = weekdays.length === state.profile.frequency && isTrainingTimeValid(time);
  useEffect(() => () => { toast.dismiss(scheduleToastId); }, []);
  function showError(message = t(weekdays.length !== state.profile.frequency ? "onboarding.scheduleError" : "onboarding.timeError", { count: state.profile.frequency })) {
    toast.dismiss(settingsToastId);
    toast.error(message, { id: scheduleToastId });
  }
  function toggleDay(day: number) {
    const selected = weekdays.includes(day);
    if (!selected && weekdays.length >= state.profile.frequency) {
      showError(t("onboarding.scheduleLimitError", { count: state.profile.frequency }));
      return;
    }
    toast.dismiss(scheduleToastId);
    setWeekdays(selected ? weekdays.filter(d => d !== day) : [...weekdays, day].sort());
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid) { showError(); return; }
    toast.dismiss(scheduleToastId);
    dispatch({ type: "profile", patch: { weekdays, time } });
    dispatch({ type: "preferences", patch: { reminders } });
    toast.success(t("notifications.scheduleUpdated"), { id: scheduleToastId });
  }
  function exportCalendar() {
    if (!valid) { showError(); return; }
    toast.dismiss(scheduleToastId);
    const text = trainingCalendar({ ...state.profile, weekdays, time }, t("calendar.title"), t("calendar.description"));
    const url = URL.createObjectURL(new Blob([text], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = "eureka-workouts.ics";
    document.body.appendChild(link); link.click(); link.remove();
    toast.success(t("notifications.calendarDownload"), { id: scheduleToastId });
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <form onSubmit={save} className={styles.settingsSchedule}>
    <div className={styles.weekdayGrid} role="group" aria-label={t("onboarding.schedule.days")}>{[1, 2, 3, 4, 5, 6, 0].map(day => <button type="button" key={day} aria-pressed={weekdays.includes(day)} aria-label={t(`weekdays.full${day}`)} onClick={() => toggleDay(day)}>{t(`weekdays.short${day}`)}</button>)}</div>
    <p className={styles.scheduleCount}>{t("onboarding.selectedDays", { selected: weekdays.length, count: state.profile.frequency })}</p>
    <label className={styles.timeField}><span>{t("onboarding.schedule.time")}</span><input type="time" required value={time} onInvalid={event => { event.preventDefault(); event.currentTarget.focus(); showError(t("onboarding.timeError")); }} onChange={event => { toast.dismiss(scheduleToastId); setTime(event.target.value); }} /></label>
    <label className={styles.toggleRow}><span>{t("onboarding.schedule.reminders")}</span><input type="checkbox" checked={reminders} onChange={event => setReminders(event.target.checked)} /><span className={styles.toggle} aria-hidden="true" /></label>
    <p className={styles.supportingText}>{t("onboarding.schedule.notice")}</p>
    <button type="submit" className={styles.secondaryButton}>{t("save")}</button>
    <button type="button" className={styles.textButton} onClick={exportCalendar}><TrainingIcon name="calendar" />{t("settings.exportCalendar")}</button>
  </form>;
}

export function Settings() {
  const t = useTranslations("TrainingApp");
  const { state, dispatch } = useTraining();
  const router = useRouter();
  const { logout } = useAuth();
  const [reset, setReset] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try { await logout(); router.replace("/training/app/login"); }
    catch { /* AuthProvider displays the shared logout failure toast. */ }
    finally { setSigningOut(false); }
  }
  return <div className={styles.dashboard}>
    <TrainingNav active="settings" />
    <TrainingHeader title={t("nav.settings")} back="/training/app/workout" />
    <main id="training-main" className={styles.settingsMain}>
      <div className={styles.settingsIntro}><span className={styles.eyebrow}>EUREKA! FIT</span><h1>{t("settings.title")}</h1><p>{t("settings.description")}</p></div>
      <div className={styles.settingsGrid}>
      <div className={styles.settingsGroup}>
        <h2 className={styles.settingsGroupTitle}>{t("desktop.preferences")}</h2>
        <Link href="/training/app/profile" className={styles.settingsLink}><TrainingIcon name="user" /><span>{t("settings.profile")}</span><TrainingIcon name="chevron" /></Link>
        <SettingsSection icon="dumbbell" label={t("settings.experience")} value={t(`experience.${state.profile.experience || "new"}`)}><label htmlFor="experience-setting" className={styles.supportingText}>{t("settings.experienceDescription")}</label><select id="experience-setting" value={state.profile.experience || "new"} onChange={event => { dispatch({ type: "profile", patch: { experience: event.target.value as typeof state.profile.experience } }); toast.success(t("notifications.preferencesUpdated"), { id: settingsToastId }); }}>{["new", "months", "year", "years", "advanced"].map(value => <option key={value} value={value}>{t(`experience.${value}`)}</option>)}</select></SettingsSection>
        <SettingsSection icon="ruler" label={t("settings.units")} value={t(`units.${state.units}`)}><div className={styles.unitSwitch} role="group" aria-label={t("settings.units")}>{(["metric", "imperial"] as const).map(units => <button key={units} type="button" aria-pressed={state.units === units} onClick={() => { if (units === state.units) return; dispatch({ type: "preferences", patch: { units } }); toast.success(t("notifications.preferencesUpdated"), { id: settingsToastId }); }}>{t(`units.${units}`)}</button>)}</div></SettingsSection>
        <SettingsSection icon="bell" label={t("settings.reminders")} value={state.profile.time}><ScheduleSettings /></SettingsSection>
        <Link href="/training/app/membership" className={styles.settingsLink}><TrainingIcon name="crown" /><span className={styles.settingsRowCopy}><span>{t("settings.membership")}</span><span className={styles.previewBadge}>{t("workout.preview")}</span></span><TrainingIcon name="chevron" /></Link>
      </div>
      <div className={styles.settingsSidebar}>
      <div className={styles.settingsGroup}>
        <h2 className={styles.settingsGroupTitle}>{t("desktop.support")}</h2>
        <TrainingInfoButton kind="help" className={styles.settingsLink}><TrainingIcon name="help" /><span>{t("settings.help")}</span><TrainingIcon name="chevron" /></TrainingInfoButton>
        <TrainingInfoButton kind="privacy" className={styles.settingsLink}><TrainingIcon name="book" /><span>{t("privacy")}</span><TrainingIcon name="chevron" /></TrainingInfoButton>
        <TrainingInfoButton kind="terms" className={styles.settingsLink}><TrainingIcon name="book" /><span>{t("terms")}</span><TrainingIcon name="chevron" /></TrainingInfoButton>
        <TrainingInfoButton kind="cookies" className={styles.settingsLink}><TrainingIcon name="book" /><span>{t("product.cookies")}</span><TrainingIcon name="chevron" /></TrainingInfoButton>
      </div>
      <button type="button" className={styles.secondaryButton} onClick={() => { dispatch({ type: "restart" }); router.push("/training/app/onboarding"); }}>{t("settings.editProfile")}</button>
      <Link href="/" className={`${styles.textLink} ${styles.mobileParentLink}`}>{t("backToSite")}</Link>
      <p className={styles.deviceNote}>{t("settings.deviceNote")}</p>
      <button type="button" className={styles.dangerButton} disabled={signingOut} onClick={() => void signOut()}>{t(signingOut ? "session.signingOut" : "session.signOut")}</button>
      <button type="button" className={styles.textButton} onClick={() => setReset(true)}>{t("settings.reset")}</button>
      {reset && <div role="alert" className={styles.feedback}><strong>{t("settings.resetConfirm")}</strong><div className={styles.buttonRow}><button type="button" className={styles.secondaryButton} onClick={() => setReset(false)}>{t("cancel")}</button><button type="button" className={styles.dangerButton} onClick={() => { dispatch({ type: "reset" }); toast.success(t("notifications.preferencesReset"), { id: settingsToastId }); router.replace("/training/app"); }}>{t("settings.reset")}</button></div></div>}
      </div>
      </div>
    </main>
  </div>;
}
