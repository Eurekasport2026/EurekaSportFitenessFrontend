"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { HomeAction } from "@/components/features/home/HomeAction";
import { HomeIcon } from "@/components/features/home/HomeIcon";
import { getAllCourses } from "@/lib/api/courses";
import { T, useLanguage } from "@/components/layout/LanguageProvider";
import { cn } from "@/lib/utils";
import styles from "./courses.module.css";

const filters = ["Tutti", "Fitness", "Acquatici", "Ginnastica", "Specializzati"] as const;
type CourseFilter = typeof filters[number];

const extraCourses = [
  { title: "Istruttore Nuoto", description: "Formazione completa per il mondo acquatico", imageAlt: "Nuotatore con cuffia e occhialini in piscina", imageSrc: "/images/courses/swimming-instructor.webp", position: "center 25%", categories: ["Acquatici"] },
  { title: "Aquagym e Hydrobike", description: "Specializzati nel fitness in acqua", imageAlt: "Allenamento di aquagym in piscina", imageSrc: "/images/courses/aquagym.webp", position: "center top", categories: ["Acquatici"] },
  { title: "Ginnastica", description: "Tecnica, didattica e programmazione", imageAlt: "Ginnasta impegnata nello stretching a terra", imageSrc: "/images/courses/ginnastica.webp", position: "center center", categories: ["Ginnastica"] },
  { title: "Allenamento Funzionale", description: "Allenamento funzionale per forza e movimento", imageAlt: "Atleta durante un allenamento funzionale in palestra", imageSrc: "/images/courses/functional-training.webp", position: "center top", categories: ["Fitness", "Specializzati"] },
];

export function CourseCatalog() {
  const [active, setActive] = useState<CourseFilter>("Tutti");
  const { language, t } = useLanguage();

  const courses = useMemo(() => {
    const apiCourses = getAllCourses(language);
    const courseImageMap: Record<string, string> = {
      "personal-trainer-1": "/images/courses/personal-trainer-1.webp",
      "personal-trainer-2": "/images/courses/personal-trainer-2.webp",
      "personal-trainer-3": "/images/courses/personal-trainer-3.webp",
      "calisthenics-1": "/images/courses/calisthenics-1.webp",
      "calisthenics-2": "/images/courses/calisthenics-2.webp",
    };

    const coursePositionMap: Record<string, string> = {
      "personal-trainer-1": "center top",
      "personal-trainer-2": "center top",
      "personal-trainer-3": "center top",
      "calisthenics-1": "center top",
      "calisthenics-2": "center top",
    };

    const catalogItems = apiCourses.map((c) => ({
      title: c.title,
      description: c.subtitle || c.description,
      imageAlt: c.title,
      imageSrc: courseImageMap[c.slug] || "/images/courses/personal-trainer-1.webp",
      position: coursePositionMap[c.slug] || "center top",
      slug: c.slug,
      categories: ["Fitness", "Specializzati"] as string[],
    }));

    return [...catalogItems, ...extraCourses];
  }, [language]);
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
            style={{
              backgroundImage: `url('${course.imageSrc}')`,
              backgroundSize: "cover",
              backgroundPosition: "position" in course && course.position ? course.position : "center top",
            }}
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
