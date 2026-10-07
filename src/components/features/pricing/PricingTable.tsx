"use client";

import { useState } from "react";
import { HomeAction } from "@/components/features/home/HomeAction";
import { cn } from "@/lib/utils";
import { T, useLanguage } from "@/components/layout/LanguageProvider";
import styles from "./pricing.module.css";
import { pricingPlans as plans } from "@/lib/pricing/plans";

const euros = (value: number) => new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

export function PricingTable() {
  const [annual, setAnnual] = useState(false);
  const { language, t } = useLanguage();
  return (
    <>
      <div className={styles.billing} role="group" aria-label={language === "en" ? "Billing period" : "Fatturazione"}>
        <button type="button" className={cn(styles.billingOption, !annual && styles.billingSelected)} aria-pressed={!annual} onClick={() => setAnnual(false)}><T>Mensile</T></button>
        <button type="button" className={cn(styles.billingOption, annual && styles.billingSelected)} aria-pressed={annual} onClick={() => setAnnual(true)}><span className={styles.billingDot} aria-hidden="true" /><T>Annuale</T> <span className={styles.savings}><T>Risparmia il 20%</T></span></button>
      </div>
      <div className={styles.grid}>
        {plans.map((plan) => {
          const price = annual ? Math.round(plan.monthly * 80) / 100 : plan.monthly;
          return <article className={cn(styles.card, plan.name === "Pro" && styles.pro)} key={plan.name}>
            <header className={styles.cardHeader}><h2>{plan.name}</h2><p><T>{plan.subtitle}</T></p></header>
            <div className={styles.cardBody}>
              <p className={styles.price}><strong>€ {euros(price)}</strong><span><T>al mese</T></span>{annual && <small>€ {euros(price * 12)} {t("fatturati annualmente")}</small>}</p>
              <ul>{plan.features.map((feature) => <li key={feature}><T>{feature}</T></li>)}</ul>
              <HomeAction kind="launch" title={`${language === "en" ? "Plan" : "Piano"} ${plan.name}`} className={styles.planButton}><T>Inizia ora</T></HomeAction>
            </div>
          </article>;
        })}
      </div>
    </>
  );
}
