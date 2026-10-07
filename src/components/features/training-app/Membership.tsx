"use client";

import Image from "next/image";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { monthlyPrice, pricingPlans } from "@/lib/pricing/plans";
import { useTraining } from "./TrainingProvider";
import { TrainingLoading, TrainingLanguage } from "./TrainingShell";
import { TrainingBrand } from "./TrainingChrome";
import { TrainingIcon } from "./TrainingIcon";
import { TrainingInfoButton } from "./TrainingInfoButton";
import { cn } from "@/lib/utils";
import styles from "./training-app.module.css";

export function Membership() {
  const t = useTranslations("TrainingApp");
  const locale = useLocale();
  const { t: translatePublic } = useLanguage();
  const { hydrated, state } = useTraining();
  const [annual, setAnnual] = useState(false);
  const [selected, setSelected] = useState("Pro");
  const [notice, setNotice] = useState(false);
  const euros = (value: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(value);
  if (!hydrated) return <TrainingLoading />;
  const destination = state.complete ? "/training/app/workout" : "/training/app";
  return <div className={styles.membership}>
    <header className={cn(styles.appHeader, styles.membershipHeader)}><TrainingBrand className={styles.miniBrand} /><div className={styles.headerActions}><TrainingLanguage /><Link href={destination} className={styles.iconButton} aria-label={t("membership.close")}><TrainingIcon name="close" /></Link></div></header>
    <main id="training-main" className={styles.membershipMain}>
      <div className={styles.membershipIntro}>
      <div className={styles.memberArt}><div className={styles.memberCard}><Image src="/eureka-symbol.svg" alt="" width={50} height={54} /><span>EUREKA! <strong>FIT</strong></span><small>{t("membership.memberCard")}</small><TrainingIcon name="crown" /></div></div>
      <h1 className={styles.memberTitle}>{t("membership.title")}</h1><p className={styles.supportingText}>{t("membership.description")}</p>
      </div>
      <div className={styles.membershipOffers}>
      <div className={styles.billingSwitch} role="group" aria-label={t("membership.billing")}>
        <button type="button" aria-pressed={!annual} onClick={() => { setAnnual(false); setNotice(false); }}>{t("membership.monthly")}</button>
        <button type="button" aria-pressed={annual} onClick={() => { setAnnual(true); setNotice(false); }}>{t("membership.yearly")} <small>−20%</small></button>
      </div>
      <fieldset className={styles.planOptions}><legend className={styles.srOnly}>{t("membership.choosePlan")}</legend>
        {pricingPlans.map(plan => <label key={plan.name} className={cn(styles.planOption, selected === plan.name && styles.planSelected)}>
          <input type="radio" name="membership" value={plan.name} checked={selected === plan.name} onChange={() => { setSelected(plan.name); setNotice(false); }} />
          <span><strong>{plan.name}{plan.name === "Pro" && <small className={styles.popular}>{translatePublic("Il più scelto")}</small>}</strong><small>{translatePublic(plan.subtitle)}</small></span>
          <span className={styles.planAmount}><strong>{euros(monthlyPrice(plan, annual))}</strong><small>{t("membership.perMonth")}</small>{annual && <small>{t("membership.annualTotal", { amount: euros(monthlyPrice(plan, true) * 12) })}</small>}</span>
          <span className={styles.planCardFeatures} role="list">{plan.features.map(feature => <span role="listitem" key={feature}><TrainingIcon name="check" />{translatePublic(feature)}</span>)}</span>
        </label>)}
      </fieldset>
      <ul className={styles.planFeatures}>{pricingPlans.find(p => p.name === selected)!.features.slice(0, 3).map(feature => <li key={feature}><TrainingIcon name="check" />{translatePublic(feature)}</li>)}</ul>
      <p className={styles.membershipNotice}>{t("membership.previewNotice")}</p>
      <button type="button" className={styles.primaryButton} onClick={() => setNotice(true)}>{t("membership.select", { plan: selected })}<TrainingIcon name="arrow" /></button>
      {notice && <div role="status" className={styles.feedback}><strong>{t("membership.unavailableTitle")}</strong><p>{t("membership.unavailable")}</p><TrainingInfoButton kind="help" className={styles.textButton}>{t("membership.contact")}</TrainingInfoButton></div>}
      <Link href={destination} className={styles.textLink}>{t("membership.continuePreview")}</Link>
      <div className={styles.legal}><TrainingInfoButton kind="terms">{t("terms")}</TrainingInfoButton><span aria-hidden="true">·</span><TrainingInfoButton kind="privacy">{t("privacy")}</TrainingInfoButton><span aria-hidden="true">·</span><TrainingInfoButton kind="cookies">{t("product.cookies")}</TrainingInfoButton></div>
      </div>
    </main>
  </div>;
}
