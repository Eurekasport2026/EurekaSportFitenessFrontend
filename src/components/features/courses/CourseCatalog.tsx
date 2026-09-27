"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { HomeAction } from "@/components/features/home/HomeAction";
import { HomeIcon } from "@/components/features/home/HomeIcon";
import { academyCourses } from "@/components/features/marketing/content";
import { T, useLanguage } from "@/components/layout/LanguageProvider";
import { cn } from "@/lib/utils";
import styles from "./courses.module.css";

const filters = ["Tutti", "Fitness", "Acquatici", "Ginnastica", "Specializzati"] as const;
type CourseFilter = typeof filters[number];

const courses = [
  ...academyCourses.map((course) => ({
    ...course,
    categories: course.tile === 2 || course.tile === 3 ? ["Acquatici"] : course.tile === 4 ? ["Ginnastica"] : course.tile === 1 ? ["Fitness", "Specializzati"] : ["Fitness"],
  })),
  { title: "Functional Training", description: "Allenamento funzionale per forza e movimento", imageAlt: "Atleta durante un allenamento funzionale in palestra", tile: 11, categories: ["Fitness", "Specializzati"] },
];

export function CourseCatalog() {
  const [active, setActive] = useState<CourseFilter>("Tutti");
  const { language } = useLanguage();
  const filtered = courses.filter((course) => active === "Tutti" || course.categories.includes(active));

  return (
    <>
      <div className={styles.filters} role="group" aria-label={language === "en" ? "Filter courses" : "Filtra i corsi"}>
        {filters.map((filter) => <button key={filter} type="button" className={cn(styles.filter, active === filter && styles.filterActive)} aria-pressed={active === filter} onClick={() => setActive(filter)}><T>{filter}</T></button>)}
      </div>
      <p className={styles.visuallyHidden} role="status">{language === "en" ? `${filtered.length} courses in the ${active} category` : `${filtered.length} corsi disponibili nella categoria ${active}`}</p>
      <div className={styles.grid}>
        {filtered.map((course) => <article className={styles.card} key={course.title}>
          <div
            className={styles.photo}
            role="img"
            aria-label={course.imageAlt}
            style={course.tile === 11 ? { backgroundImage: "url('/images/eureka-functional-training.webp')", backgroundSize: "cover", backgroundPosition: "center" } : { backgroundPosition: `${course.tile % 4 * 100 / 3}% ${7.54 + Math.floor(course.tile / 4) * 42.46}%` }}
          />
          <div className={styles.cardBody}>
            <h2><T>{course.title}</T></h2>
            {course.title === "Personal Trainer" ?
              <Link href="/academy/corsi/personal-trainer" className={styles.cardLink}><T>Scopri</T> <HomeIcon name="arrow" /></Link> :
              <HomeAction kind="academy" title={course.title} className={styles.cardLink} label={`Scopri il corso ${course.title}`}><T>Scopri</T> <HomeIcon name="arrow" /></HomeAction>}
          </div>
        </article>)}
      </div>
    </>
  );
}
