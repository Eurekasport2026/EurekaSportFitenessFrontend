"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { useTraining } from "./TrainingProvider";
import { TrainingHeader } from "./TrainingShell";
import { TrainingIcon } from "./TrainingIcon";
import { TrainingInfoButton } from "./TrainingInfoButton";
import { trainingPlanPhoto } from "./trainingVisuals";
import styles from "./training-app.module.css";

export function TrainingLogin() {
  const t = useTranslations("TrainingApp");
  const { state } = useTraining();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const profile = state.profile;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Demo continuation only: do not persist credentials or create an auth session.
    event.currentTarget.reset();
    setShowPassword(false);
    router.replace("/training/app/workout");
  }

  return <div className={styles.loginPage}>
    <TrainingHeader />
    <main id="training-main" className={styles.loginMain}>
      <div className={styles.loginToolbar}>
        <Link href={{ pathname: "/training/app/onboarding", query: { step: "ready" } }} className={styles.loginBack}><TrainingIcon name="back" />{t("login.backToReview")}</Link>
        <ol className={styles.loginJourney} aria-label={t("login.journeyLabel")}>
          <li><span><TrainingIcon name="check" /></span>{t("login.journeyProfile")}</li>
          <li><span><TrainingIcon name="check" /></span>{t("login.journeyReview")}</li>
          <li aria-current="step"><span>3</span>{t("login.journeyLogin")}</li>
        </ol>
      </div>
      <div className={styles.loginWorkspace}>
        <section className={styles.loginIntro} aria-labelledby="fit-login-title">
          <div className={styles.loginPlanHeading}>
            <span className={styles.loginStatus}><TrainingIcon name="check" />{t("login.eyebrow")}</span>
            <h1 id="fit-login-title" className={styles.loginPlanTitle}>{t("login.title")}</h1>
            <p className={styles.loginPlanDescription}>{t("login.description")}</p>
          </div>
          <div className={styles.loginPlanPhoto}><Image src={trainingPlanPhoto(profile)} alt="" fill sizes="(min-width: 900px) 500px, 90vw" unoptimized /></div>
          <dl className={styles.loginPlanDetails}>
            <div><dt><TrainingIcon name="chart" />{t("onboarding.review.goal")}</dt><dd>{t(`goals.${profile.goal || "fitness"}`)}</dd></div>
            <div><dt><TrainingIcon name="dumbbell" />{t("onboarding.review.equipment")}</dt><dd>{t(`equipment.${profile.equipment || "bodyweight"}`)}</dd></div>
            <div><dt><TrainingIcon name="calendar" />{t("onboarding.review.frequency")}</dt><dd>{t("onboarding.frequencyValue", { count: profile.frequency })}</dd></div>
          </dl>
        </section>
        <section className={styles.loginCard} aria-labelledby="fit-login-form-title">
          <div className={styles.loginFormIntro}>
            <span className={styles.loginAccessIcon}><TrainingIcon name="user" /></span>
            <div>
              <span className={styles.loginFormEyebrow}>{t("login.accessLabel")}</span>
              <h2 id="fit-login-form-title">{t("login.formTitle")}</h2>
            </div>
          </div>
          <p id="fit-login-notice" className={styles.loginNotice}>{t("login.notice")}</p>
          <form method="post" className={styles.loginForm} onSubmit={submit} aria-labelledby="fit-login-form-title" aria-describedby="fit-login-notice">
            <label className={styles.loginField} htmlFor="fit-login-email">
              <span>{t("login.email")}</span>
              <input id="fit-login-email" name="email" type="email" autoComplete="username" placeholder={t("login.emailPlaceholder")} required />
            </label>
            <div className={styles.loginField}>
              <label htmlFor="fit-login-password">{t("login.password")}</label>
              <div className={styles.loginPassword}>
                <input id="fit-login-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder={t("login.passwordPlaceholder")} required />
                <button type="button" aria-controls="fit-login-password" aria-label={t(showPassword ? "login.hidePassword" : "login.showPassword")} onClick={() => setShowPassword(current => !current)}>{t(showPassword ? "login.hide" : "login.show")}</button>
              </div>
            </div>
            <button type="submit" className={styles.primaryButton}>{t("login.submit")}<TrainingIcon name="arrow" /></button>
          </form>
          <div className={styles.loginLegal}>
            <TrainingInfoButton kind="privacy" className={styles.productFooterControl}>{t("privacy")}</TrainingInfoButton>
            <TrainingInfoButton kind="terms" className={styles.productFooterControl}>{t("terms")}</TrainingInfoButton>
          </div>
        </section>
      </div>
    </main>
  </div>;
}
