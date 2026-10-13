"use client";

import { useState, useTransition } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { HomeIcon } from "@/components/features/home/HomeIcon";
import { T, useLanguage } from "@/components/layout/LanguageProvider";
import type { CatalogCourse, CourseCatalogState } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import styles from "./courses.module.css";

const filters = ["Tutti", "Fitness", "Acquatici", "Ginnastica", "Specializzati"] as const;
type CourseFilter = typeof filters[number];

function matchesFilter(course: CatalogCourse, filter: CourseFilter): boolean {
  if (filter === "Tutti") return true;
  if (course.category === "Personal Trainer" || course.category === "Calisthenics") {
    return filter === "Fitness" || filter === "Specializzati";
  }
  return course.category === filter;
}

export function CourseCatalog({ state }: { state: CourseCatalogState }) {
  const [active, setActive] = useState<CourseFilter>("Tutti");
  const [isPending, startTransition] = useTransition();
  const { language, t } = useLanguage();
  const router = useRouter();

  if (state.status === "error") {
    return (
      <div className={styles.catalogState} aria-busy={isPending}>
        <p role="status">
          {language === "en"
            ? "Courses are temporarily unavailable. Please try again."
            : "I corsi sono momentaneamente non disponibili. Riprova."}
        </p>
        <button
          type="button"
          className={cn(styles.filter, styles.filterActive)}
          disabled={isPending}
          onClick={() => startTransition(() => router.refresh())}
        >
          {isPending
            ? language === "en" ? "Loading…" : "Caricamento…"
            : language === "en" ? "Try again" : "Riprova"}
        </button>
      </div>
    );
  }

  const filtered = state.courses.filter((course) => matchesFilter(course, active));

  return (
    <>
      <div className={styles.filters} role="group" aria-label={language === "en" ? "Filter courses" : "Filtra i corsi"}>
        {filters.map((filter) => <button key={filter} type="button" className={cn(styles.filter, active === filter && styles.filterActive)} aria-pressed={active === filter} onClick={() => setActive(filter)}><T>{filter}</T></button>)}
      </div>
      <p className={styles.visuallyHidden} role="status">{language === "en" ? `${filtered.length} courses in the ${t(active)} category` : `${filtered.length} corsi disponibili nella categoria ${active}`}</p>
      {filtered.length === 0 ? (
        <div className={styles.catalogState}>
          <p>
            {state.courses.length === 0
              ? language === "en" ? "No courses are available at the moment." : "Al momento non ci sono corsi disponibili."
              : language === "en" ? "No courses are available in this category." : "Non ci sono corsi disponibili in questa categoria."}
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((course) => (
            <Link
              key={course.id}
              href={{ pathname: "/academy/corsi/[slug]", params: { slug: course.slug } }}
              className={styles.card}
              aria-label={language === "en" ? `Explore the ${course.title} course` : `Scopri il corso ${course.title}`}
            >
              <div
                className={styles.photo}
                role="img"
                aria-label={course.title}
                style={{
                  backgroundImage: course.heroImage ? `url(${JSON.stringify(course.heroImage)})` : "none",
                  backgroundColor: "#d6e1e9",
                  backgroundSize: "cover",
                  backgroundPosition: "center top",
                }}
              />
              <div className={styles.cardBody}>
                <h2>{course.title}</h2>
                <span className={styles.cardLink}>
                  <T>Scopri</T> <HomeIcon name="arrow" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
