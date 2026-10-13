"use client";

import { useTransition } from "react";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/routing";
import { HomeHeader } from "@/components/layout/HomeHeader";
import { HomeAction } from "@/components/features/home/HomeAction";
import { HomeIcon } from "@/components/features/home/HomeIcon";
import { T, useLanguage } from "@/components/layout/LanguageProvider";
import { cn } from "@/lib/utils";
import type { CourseCatalogState } from "@/lib/api/types";
import { academyBenefits, trainingBenefits, trainingGoals } from "./content";
import homeStyles from "@/components/features/home/home.module.css";
import styles from "./marketing.module.css";

export interface MarketingPageProps {
  variant: "academy" | "training";
  catalogState?: CourseCatalogState;
}

export function MarketingPage({ variant, catalogState }: MarketingPageProps) {
  const { language, t } = useLanguage();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isAcademy = variant === "academy";
  const benefits = isAcademy ? academyBenefits : trainingBenefits;
  const sectionId = isAcademy ? "corsi" : "obiettivi";

  return (
    <div className={cn(homeStyles.page, styles.page, !isAcademy && styles.training)}>
      <a className={homeStyles.skipLink} href="#main"><T>Vai al contenuto</T></a>
      <HomeHeader activePage={variant} />
      <main id="main">
        <section className={styles.hero} aria-labelledby="page-title">
          <Image
            src={`/images/eureka-${variant}-hero.webp`}
            alt={t(isAcademy ? "Personal trainer che guida un'atleta in palestra" : "Atleta che si allena con un manubrio in palestra")}
            fill
            unoptimized
            preload
            className={styles.heroImage}
          />
          <div className={styles.heroShade} aria-hidden="true" />
          <div className={styles.heroContent}>
            <h1 id="page-title">EUREKA!<span>{isAcademy ? (language === "en" ? "ACADEMY" : "ACCADEMIA") : (language === "en" ? "TRAINING" : "ALLENAMENTO")}</span></h1>
            <h2>{isAcademy ? <><T>Diventa un professionista</T><br /><T>dello sport e del fitness.</T></> : <><T>Allenati dove vuoi.</T><br /><T>Raggiungi i tuoi obiettivi.</T></>}</h2>
            {isAcademy ? (
              <Link href="/academy/corsi" className={styles.heroButton}>
                <T>Scopri tutti i corsi</T><HomeIcon name="arrow" />
              </Link>
            ) : (
              <Link href="/training/app" className={styles.heroButton}>
                <T>Inizia ora</T><HomeIcon name="arrow" />
              </Link>
            )}
            {!isAcademy && <div className={styles.stores} aria-label={t("Scarica l'app Eureka! Allenamento")}>
              <HomeAction kind="training" className={styles.storeBadge} label={t("Disponibilità su App Store")}>
                <HomeIcon name="apple" /><span><small><T>Scarica su</T></small><strong>App Store</strong></span>
              </HomeAction>
              <HomeAction kind="training" className={styles.storeBadge} label={t("Disponibilità su Google Play")}>
                <HomeIcon name="playstore" /><span><small><T>Disponibile su</T></small><strong>Google Play</strong></span>
              </HomeAction>
            </div>}
          </div>
          <p className={styles.manifesto}>
            {isAcademy ? <><T>CONOSCENZA</T><br /><T>ESPERIENZA</T><br /><T>PASSIONE</T><br /><T>RISULTATI</T></> : <><T>PIÙ FORZA</T><br /><T>PIÙ ENERGIA</T><br /><T>PIÙ BENESSERE</T><br /><T>UNA VERSIONE MIGLIORE DI TE</T></>}
          </p>
        </section>

        <section className={styles.benefits} aria-label={t(isAcademy ? "I vantaggi di Eureka! Accademia" : "I vantaggi di Eureka! Allenamento")}>
          {benefits.map((benefit) => <div className={styles.benefit} key={benefit.title}>
            <HomeIcon name={benefit.icon} />
            <h2><T>{benefit.title}</T></h2>
            <p><T>{benefit.description}</T></p>
          </div>)}
        </section>

        <section className={styles.catalog} id={sectionId} aria-labelledby="catalog-title">
          <div className={styles.sectionHeading}>
            <h2 id="catalog-title"><T>{isAcademy ? "I NOSTRI CORSI" : "SCEGLI IL TUO OBIETTIVO"}</T></h2>
            {isAcademy && <Link href="/academy/corsi"><T>Vedi tutti</T> <HomeIcon name="arrow" /></Link>}
          </div>

          {isAcademy ? (
            catalogState?.status === "error" ? (
              <div style={{ textAlign: "center", padding: "2.5em 1em", background: "#f8fafc", borderRadius: "0.55em", border: "1px solid #e2e8f0" }} aria-busy={isPending}>
                <p role="status" style={{ color: "#64748b", margin: "0 0 1em", fontSize: "0.9rem" }}>
                  {language === "en"
                    ? "Courses are temporarily unavailable. Please try again."
                    : "I corsi sono momentaneamente non disponibili. Riprova."}
                </p>
                <button
                  type="button"
                  className={styles.heroButton}
                  disabled={isPending}
                  onClick={() => startTransition(() => router.refresh())}
                  style={{ cursor: "pointer", border: "none", fontSize: "0.85em", minWidth: "8em", padding: "0.6em 1.2em" }}
                >
                  {isPending
                    ? (language === "en" ? "Loading…" : "Caricamento…")
                    : (language === "en" ? "Try again" : "Riprova")}
                </button>
              </div>
            ) : catalogState?.status === "ready" && catalogState.courses.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2.5em 1em", background: "#f8fafc", borderRadius: "0.55em", border: "1px solid #e2e8f0" }}>
                <p role="status" style={{ color: "#64748b", margin: 0, fontSize: "0.9rem" }}>
                  {language === "en"
                    ? "No courses are available at the moment."
                    : "Al momento non ci sono corsi disponibili."}
                </p>
              </div>
            ) : (
              <div className={styles.cardGrid} id="lista-corsi">
                {catalogState?.courses.map((course) => (
                  <Link
                    key={course.id}
                    href={{ pathname: "/academy/corsi/[slug]", params: { slug: course.slug } }}
                    className={styles.card}
                    aria-label={`${language === "en" ? "Explore course" : "Scopri il corso"} ${course.title}`}
                  >
                    <div
                      className={styles.cardPhoto}
                      role="img"
                      aria-label={course.title}
                      style={{
                        backgroundImage: course.heroImage ? `url(${JSON.stringify(course.heroImage)})` : "none",
                        backgroundSize: "cover",
                        backgroundPosition: "center top",
                        backgroundColor: "#d6e1e9",
                      }}
                    />
                    <div className={styles.cardBody}>
                      <h3>{course.title}</h3>
                      {course.description && <p>{course.description}</p>}
                      <span className={styles.cardAction}>
                        <T>Scopri</T><HomeIcon name="arrow" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : (
            <div className={cn(styles.cardGrid, styles.goalGrid)} id="lista-obiettivi">
              {trainingGoals.map((card) => {
                const goalMap: Record<string, string> = { Dimagrimento: "weight", "Massa muscolare": "muscle", Forza: "strength", Mobilità: "mobility", Calisthenics: "calisthenics", Benessere: "wellbeing" };
                return (
                  <Link
                    key={card.title}
                    href={{ pathname: "/training/app", query: { goal: goalMap[card.title] || "fitness" } }}
                    className={styles.card}
                    aria-label={`${language === "en" ? "Explore goal" : "Esplora l'obiettivo"} ${t(card.title)}`}
                  >
                    <div
                      className={styles.cardPhoto}
                      role="img"
                      aria-label={t(card.imageAlt)}
                      style={{ backgroundPosition: `${(card.tile % 4) * 100 / 3}% ${Math.floor(card.tile / 4) * 50}%` }}
                    />
                    <div className={styles.cardBody}>
                      <h3><T>{card.title}</T></h3>
                      {card.description && <p><T>{card.description}</T></p>}
                      <span className={styles.cardAction}>
                        <HomeIcon name="arrow" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
