"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import type { Lesson } from "@/lib/api/types";
import styles from "./lesson-view.module.css";

interface LessonNavProps {
  prevLesson?: Lesson;
  nextLesson?: Lesson;
  courseSlug: string;
  moduleId: string;
}

export function LessonNav({ prevLesson, nextLesson, courseSlug, moduleId }: LessonNavProps) {
  const locale = useLocale() || "it";
  const isEn = locale === "en";

  return (
    <nav className={styles.lessonNav} aria-label={isEn ? "Lesson navigation" : "Navigazione tra lezioni"}>
      {prevLesson ? (
        <Link
          href={{ pathname: "/academy/corsi/[slug]/learn/[moduleId]", params: { slug: courseSlug, moduleId: prevLesson.moduleId }, query: { lesson: prevLesson.id } }}
          className={styles.navLink}
        >
          <span aria-hidden="true">←</span> {isEn ? "Previous Lesson" : "Lezione Precedente"}
        </Link>
      ) : (
        <Link href={{ pathname: "/academy/corsi/[slug]/learn", params: { slug: courseSlug } }} className={styles.navLink}>
          <span aria-hidden="true">←</span> {isEn ? "Back to Course" : "Torna al Corso"}
        </Link>
      )}

      {nextLesson ? (
        <Link
          href={{ pathname: "/academy/corsi/[slug]/learn/[moduleId]", params: { slug: courseSlug, moduleId: nextLesson.moduleId }, query: { lesson: nextLesson.id } }}
          className={`${styles.navLink} ${styles.navLinkPrimary}`}
        >
          {isEn ? "Next Lesson" : "Lezione Successiva"} <span aria-hidden="true">→</span>
        </Link>
      ) : (
        <Link
          href={{ pathname: "/academy/corsi/[slug]/learn", params: { slug: courseSlug }, query: { tab: "exam" } }}
          className={`${styles.navLink} ${styles.navLinkPrimary}`}
        >
          {isEn ? "Final Exam" : "Esame Finale"} <span aria-hidden="true">→</span>
        </Link>
      )}
    </nav>
  );
}
