"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/routing";
import { authService, AuthError } from "@/lib/api/auth";
import { useTraining } from "./TrainingProvider";
import { useAuth } from "./AuthProvider";
import { TrainingHeader } from "./TrainingShell";
import { TrainingIcon } from "./TrainingIcon";
import { TrainingInfoButton } from "./TrainingInfoButton";
import { trainingPlanPhoto } from "./trainingVisuals";
import styles from "./training-app.module.css";

export function TrainingLogin({ mode = "login" }: { mode?: "login" | "signup" }) {
  const t = useTranslations("TrainingApp");
  const locale = useLocale();
  const { state } = useTraining();
  const { acceptSession, status } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState(false);
  const [formError, setFormError] = useState<AuthError | null>(null);
  const activeRequest = useRef<AbortController | null>(null);
  const successHeading = useRef<HTMLHeadingElement>(null);
  const signup = mode === "signup";
  const authToastId = `fit-auth-${mode}`;
  const profile = state.profile;

  useEffect(() => () => { activeRequest.current?.abort(); activeRequest.current = null; }, []);
  useEffect(() => { if (created) successHeading.current?.focus(); }, [created]);
  useEffect(() => {
    if (status === "authenticated" && !created && !pending) router.replace("/training/app/workout");
  }, [status, created, pending, router]);

  function invalid(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input !== event.currentTarget.querySelector("input:invalid")) return;
    const field = input.name;
    if (field === "email" || field === "password" || (signup && field === "name")) {
      input.focus();
      toast.error(t(`${signup ? "signup" : "login"}.validation.${field}`), { id: authToastId });
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (activeRequest.current || created) return;
    const data = new FormData(form);
    const controller = new AbortController();
    activeRequest.current = controller;
    const timeout = setTimeout(() => controller.abort(), 35000);
    setPending(true);
    setFormError(null);
    toast.dismiss(authToastId);
    try {
      const credentials = { email: String(data.get("email") || ""), password: String(data.get("password") || "") };
      const session = signup
        ? await authService.signup({ ...credentials, name: String(data.get("name") || ""), locale: locale === "en" ? "en" : "it" }, controller.signal)
        : await authService.login(credentials, controller.signal);
      if (activeRequest.current !== controller || controller.signal.aborted) return;
      form.reset();
      setShowPassword(false);
      acceptSession(session);
      toast.success(t(signup ? "signup.successTitle" : "notifications.loggedIn"), { id: authToastId });
      if (signup) setCreated(true);
      else router.replace("/training/app/workout");
    } catch (error) {
      if (activeRequest.current !== controller) return;
      const failure = error instanceof AuthError ? error : new AuthError("unexpected");
      setFormError(failure);
      toast.error(t(`${signup ? "signup" : "login"}.errors.${failure.code}`), { id: authToastId });
      const field = failure.fields.length ? form.elements.namedItem(failure.fields[0]) : null;
      if (field instanceof HTMLInputElement) field.focus();
    } finally {
      clearTimeout(timeout);
      if (activeRequest.current === controller) { activeRequest.current = null; setPending(false); }
    }
  }

  return <div className={`${styles.loginPage}${signup ? ` ${styles.signupPage}` : ""}`}>
    <TrainingHeader />
    <main id="training-main" className={styles.loginMain}>
      <div className={styles.loginToolbar}>
        <Link href={{ pathname: "/training/app/onboarding", query: { step: "ready" } }} className={styles.loginBack}><TrainingIcon name="back" />{t("login.backToReview")}</Link>
        <ol className={styles.loginJourney} aria-label={t("login.journeyLabel")}>
          <li><span><TrainingIcon name="check" /></span>{t("login.journeyProfile")}</li>
          <li><span><TrainingIcon name="check" /></span>{t("login.journeyReview")}</li>
          <li aria-current="step"><span>3</span>{t(signup ? "signup.journeySignup" : "login.journeyLogin")}</li>
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
              <h2 id="fit-login-form-title" ref={successHeading} tabIndex={created ? -1 : undefined}>{t(created ? "signup.successTitle" : signup ? "signup.formTitle" : "login.formTitle")}</h2>
            </div>
          </div>
          <p id="fit-login-notice" className={styles.loginNotice}>{t(created ? "signup.successDescription" : signup ? "signup.notice" : "login.notice")}</p>
          {created ? <Link href="/training/app/workout" className={`${styles.primaryButton} ${styles.signupContinue}`}>{t("signup.continue")}<TrainingIcon name="arrow" /></Link> : <>
          <form method="post" className={styles.loginForm} onSubmit={submit} onInvalidCapture={invalid} aria-labelledby="fit-login-form-title" aria-describedby="fit-login-notice" aria-busy={pending} onChange={() => { if (formError) setFormError(null); toast.dismiss(authToastId); }}>
            {signup && <label className={styles.loginField} htmlFor="fit-signup-name">
              <span>{t("signup.name")}</span>
              <input id="fit-signup-name" name="name" type="text" autoComplete="name" defaultValue={profile.name} placeholder={t("signup.namePlaceholder")} minLength={1} maxLength={120} required readOnly={pending} aria-invalid={formError?.fields.includes("name") || undefined} />
            </label>}
            <label className={styles.loginField} htmlFor="fit-login-email">
              <span>{t("login.email")}</span>
              <input id="fit-login-email" name="email" type="email" autoComplete={signup ? "email" : "username"} placeholder={t("login.emailPlaceholder")} required readOnly={pending} aria-invalid={formError?.fields.includes("email") || undefined} />
            </label>
            <div className={styles.loginField}>
              <label htmlFor="fit-login-password">{t("login.password")}</label>
              <div className={styles.loginPassword}>
                <input id="fit-login-password" name="password" type={showPassword ? "text" : "password"} autoComplete={signup ? "new-password" : "current-password"} placeholder={t("login.passwordPlaceholder")} minLength={signup ? 8 : 1} maxLength={72} required readOnly={pending} aria-invalid={formError?.fields.includes("password") || undefined} aria-describedby={signup ? "fit-signup-password-hint" : undefined} />
                <button type="button" aria-controls="fit-login-password" aria-label={t(showPassword ? "login.hidePassword" : "login.showPassword")} onClick={() => setShowPassword(current => !current)}>{t(showPassword ? "login.hide" : "login.show")}</button>
              </div>
              {signup && <small id="fit-signup-password-hint" className={styles.signupHint}>{t("signup.passwordHint")}</small>}
            </div>
            <button type="submit" className={styles.primaryButton} disabled={pending}>{pending ? <><span className={styles.smallSpinner} aria-hidden="true" />{t(signup ? "signup.submitting" : "login.submitting")}</> : <>{t(signup ? "signup.submit" : "login.submit")}<TrainingIcon name="arrow" /></>}</button>
            {pending && <span className={styles.signupStatus} role="status">{t(signup ? "signup.submitting" : "login.submitting")}</span>}
          </form>
          </>}
          <div className={styles.loginFooter}>
            {!created && <Link href={signup ? "/training/app/login" : "/training/app/signup"} className={styles.textLink} aria-disabled={pending} onClick={event => { if (pending) event.preventDefault(); }}>{t(signup ? "signup.loginLink" : "signup.createLink")}</Link>}
            <div className={styles.loginLegal}>
              <TrainingInfoButton kind="privacy" className={styles.productFooterControl}>{t("privacy")}</TrainingInfoButton>
              <TrainingInfoButton kind="terms" className={styles.productFooterControl}>{t("terms")}</TrainingInfoButton>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>;
}
