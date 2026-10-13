"use client";

import { useTransition } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { HomeHeader } from "@/components/layout/HomeHeader";
import { T, useLanguage } from "@/components/layout/LanguageProvider";
import { cn } from "@/lib/utils";
import homeStyles from "@/components/features/home/home.module.css";
import styles from "./course-detail.module.css";

export function CoursePageState({ mode, resource = "course" }: {
  mode: "loading" | "error" | "not_found";
  resource?: "course" | "curriculum";
}) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const title = resource === "curriculum"
    ? mode === "not_found"
      ? isEn ? "Learning content not found" : "Contenuti didattici non trovati"
      : mode === "loading"
        ? isEn ? "Loading learning content…" : "Caricamento dei contenuti didattici…"
        : isEn ? "Learning content temporarily unavailable" : "Contenuti didattici momentaneamente non disponibili"
    : mode === "loading"
    ? isEn ? "Loading course…" : "Caricamento del corso…"
    : mode === "not_found"
      ? isEn ? "Course not found" : "Corso non trovato"
      : isEn ? "Course temporarily unavailable" : "Corso momentaneamente non disponibile";
  const message = resource === "curriculum"
    ? mode === "error"
      ? isEn ? "Please try again to load modules and lessons." : "Riprova a caricare i moduli e le lezioni."
      : mode === "loading"
        ? isEn ? "Retrieving modules and lessons." : "Recupero dei moduli e delle lezioni."
        : isEn ? "Return to the catalog to choose a course." : "Torna al catalogo per scegliere un corso."
    : mode === "loading"
    ? isEn ? "Retrieving course details." : "Recupero dei dettagli del corso."
    : mode === "not_found"
      ? isEn ? "Choose an available course from the catalog." : "Scegli un corso disponibile dal catalogo."
      : isEn ? "Please try again to load the course." : "Riprova a caricare il corso.";

  return (
    <div className={cn(homeStyles.page, styles.page)}>
      <a className={homeStyles.skipLink} href="#main"><T>Vai al contenuto</T></a>
      <HomeHeader activePage="academy" />
      <main className={styles.main} id="main">
        <section className={styles.intro} aria-busy={mode === "loading" || isPending}>
          <h1>{title}</h1>
          <p className={styles.lead} role="status">{message}</p>
          <div className={styles.purchase}>
            <Link href="/academy/corsi" className={styles.enroll}>
              {isEn ? "Back to courses" : "Torna ai corsi"}
            </Link>
            {mode === "error" && (
              <button
                type="button"
                className={styles.enroll}
                disabled={isPending}
                onClick={() => startTransition(() => router.refresh())}
              >
                {isPending
                  ? isEn ? "Loading…" : "Caricamento…"
                  : isEn ? "Try again" : "Riprova"}
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
