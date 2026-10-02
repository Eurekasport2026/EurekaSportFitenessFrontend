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
  { title: "Personal Trainer Livello 1", description: "Fondamenti, anatomia, macchine ed esame", imageAlt: "Personal trainer con un manubrio in palestra", tile: 0, slug: "personal-trainer-1", categories: ["Fitness", "Specializzati"] },
  { title: "Personal Trainer Livello 2", description: "Biomeccanica, programmazione avanzata e periodizzazione", imageAlt: "Personal trainer avanzato durante un allenamento", tile: 0, slug: "personal-trainer-2", categories: ["Fitness", "Specializzati"] },
  { title: "Personal Trainer Livello 3", description: "Master coach, RFD, casi studio e project work", imageAlt: "Head coach in palestra durante una sessione", tile: 0, slug: "personal-trainer-3", categories: ["Fitness", "Specializzati"] },
  { title: "Calisthenics Livello 1", description: "178 video esercizi con progressioni didattiche", imageAlt: "Atleta durante un esercizio di calisthenics", tile: 1, slug: "calisthenics-1", categories: ["Fitness", "Specializzati"] },
  { title: "Calisthenics Livello 2", description: "20 moduli dedicati ciascuno a una specifica skill", imageAlt: "Atleta esperto in skill avanzata alla sbarra", tile: 1, slug: "calisthenics-2", categories: ["Fitness", "Specializzati"] },
  { title: "Istruttore Nuoto", description: "Formazione completa per il mondo acquatico", imageAlt: "Nuotatore con cuffia e occhialini in piscina", tile: 2, categories: ["Acquatici"] },
  { title: "Aquagym e Hydrobike", description: "Specializzati nel fitness in acqua", imageAlt: "Allenamento di aquagym in piscina", tile: 3, categories: ["Acquatici"] },
  { title: "Ginnastica", description: "Tecnica, didattica e programmazione", imageAlt: "Ginnasta impegnata nello stretching a terra", tile: 4, categories: ["Ginnastica"] },
  { title: "Allenamento Funzionale", description: "Allenamento funzionale per forza e movimento", imageAlt: "Atleta durante un allenamento funzionale in palestra", tile: 11, categories: ["Fitness", "Specializzati"] },
];

export function CourseCatalog() {
  const [active, setActive] = useState<CourseFilter>("Tutti");
  const { language, t } = useLanguage();
  const filtered = courses.filter((course) => active === "Tutti" || course.categories.includes(active));

  return (
    <>
      <div className={styles.filters} role="group" aria-label={language === "en" ? "Filter courses" : "Filtra i corsi"}>
        {filters.map((filter) => <button key={filter} type="button" className={cn(styles.filter, active === filter && styles.filterActive)} aria-pressed={active === filter} onClick={() => setActive(filter)}><T>{filter}</T></button>)}
      </div>
      <p className={styles.visuallyHidden} role="status">{language === "en" ? `${filtered.length} courses in the ${t(active)} category` : `${filtered.length} corsi disponibili nella categoria ${active}`}</p>
      <div className={styles.grid}>
        {filtered.map((course) => <article className={styles.card} key={course.title}>
          <div
            className={styles.photo}
            role="img"
            aria-label={t(course.imageAlt)}
            style={course.tile === 11 ? { backgroundImage: "url('/images/eureka-functional-training.webp')", backgroundSize: "cover", backgroundPosition: "center" } : { backgroundPosition: `${course.tile % 4 * 100 / 3}% ${7.54 + Math.floor(course.tile / 4) * 42.46}%` }}
          />
          <div className={styles.cardBody}>
            <h2><T>{course.title}</T></h2>
            {"slug" in course && course.slug ? (
              <Link href={`/academy/corsi/${course.slug}` as any} className={styles.cardLink}>
                <T>Scopri</T> <HomeIcon name="arrow" />
              </Link>
            ) : course.title === "Personal Trainer" ? (
              <Link href="/academy/corsi/personal-trainer" className={styles.cardLink}>
                <T>Scopri</T> <HomeIcon name="arrow" />
              </Link>
            ) : (
              <HomeAction kind="academy" title={course.title} className={styles.cardLink} label={language === "en" ? `Discover the ${t(course.title)} course` : `Scopri il corso ${course.title}`}>
                <T>Scopri</T> <HomeIcon name="arrow" />
              </HomeAction>
            )}
          </div>
        </article>)}
      </div>
    </>
  );
}
