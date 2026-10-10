"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { useTraining } from "./TrainingProvider";
import { useAuth } from "./AuthProvider";
import { MeasurementInput } from "./MeasurementInput";
import { TrainingHeader, TrainingNav } from "./TrainingShell";
import { TrainingIcon } from "./TrainingIcon";
import styles from "./training-app.module.css";

const profileToastId = "fit-profile-update";

export function Profile() {
  const t = useTranslations("TrainingApp");
  const { state, dispatch } = useTraining();
  const { session } = useAuth();
  const router = useRouter();
  const [draft, setDraft] = useState(state.profile);
  const [reading, setReading] = useState(false);
  const imperial = state.units === "imperial";
  // The current API session owns account identity; local training data cannot override it.
  const accountName = session?.user.name.trim() ?? "";
  function avatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    toast.dismiss(profileToastId);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2000000) { toast.error(t("profile.imageError"), { id: profileToastId }); event.target.value = ""; return; }
    setReading(true);
    const reader = new FileReader();
    reader.onload = () => { setDraft(value => ({ ...value, avatar: String(reader.result) })); setReading(false); };
    reader.onerror = () => { toast.error(t("profile.imageError"), { id: profileToastId }); setReading(false); };
    reader.readAsDataURL(file);
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { gender, age, weightKg, heightCm, avatar } = draft;
    dispatch({ type: "profile", patch: { gender, age, weightKg, heightCm, avatar } });
    toast.success(t("notifications.profileUpdated"), { id: profileToastId });
    router.push("/training/app/settings");
  }
  return <div className={styles.dashboard}>
    <TrainingNav active="settings" />
    <TrainingHeader title={t("settings.profile")} back="/training/app/settings" />
    <main id="training-main" className={styles.profileMain}>
      <div className={styles.profileIntro}><span className={styles.eyebrow}>EUREKA! FIT</span><h1 className={styles.profileTitle}>{t("settings.profile")}</h1><p>{t("profile.description")}</p></div>
      <form onSubmit={save} onInvalidCapture={event => {
        event.preventDefault();
        const input = event.target;
        if ((input instanceof HTMLInputElement || input instanceof HTMLSelectElement) && input === event.currentTarget.querySelector("input:invalid, select:invalid")) {
          input.focus();
          toast.error(t("notifications.profileInvalid"), { id: profileToastId });
        }
      }}>
        <div className={styles.avatarSection}><label className={styles.avatarButton} htmlFor="training-avatar">
          {/* User-selected data URLs remain local and do not use the image optimization service. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {draft.avatar ? <img src={draft.avatar} alt={t("profile.avatar")} /> : <TrainingIcon name="camera" />}
          <span className={styles.avatarEdit}><TrainingIcon name="edit" /></span><span className={styles.srOnly}>{t("profile.changeAvatar")}</span>
        </label><input id="training-avatar" type="file" accept="image/jpeg,image/png,image/webp" className={styles.fileInput} onChange={avatar} /><p>{t("profile.changeAvatar")}</p>{draft.avatar && <button type="button" className={styles.textButton} onClick={() => setDraft({ ...draft, avatar: "" })}>{t("profile.removeAvatar")}</button>}</div>
        <div className={styles.profileDetails}>
          <label className={styles.nameField} htmlFor="training-name"><span>{t("profile.name")}</span><input id="training-name" type="text" value={accountName} readOnly autoComplete="name" /></label>
          <div className={styles.profileFields}>
            <label className={styles.profileField} htmlFor="training-gender"><span>{t("profile.gender")}</span><select id="training-gender" value={draft.gender || "other"} onChange={event => setDraft({ ...draft, gender: event.target.value as typeof draft.gender })}>{["male", "female", "other"].map(gender => <option key={gender} value={gender}>{t(`gender.${gender}`)}</option>)}</select></label>
            {(["age", "weightKg", "heightCm"] as const).map(field => <MeasurementInput key={field} field={field} value={draft[field]} imperial={imperial} label={t(`profile.${field === "weightKg" ? "weight" : field === "heightCm" ? "height" : "age"}`)} onChange={value => setDraft(current => ({ ...current, [field]: value }))} />)}
          </div>
          <p className={styles.deviceNote}>{t("profile.localNotice")}</p>
          <div className={styles.buttonRow}><button type="button" className={styles.secondaryButton} onClick={() => router.push("/training/app/settings")}>{t("cancel")}</button><button type="submit" className={styles.primaryButton} disabled={reading}>{t("save")}</button></div>
        </div>
      </form>
    </main>
  </div>;
}
