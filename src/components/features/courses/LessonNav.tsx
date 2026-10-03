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
          href={`/academy/corsi/${courseSlug}/learn/${prevLesson.moduleId}?lesson=${prevLesson.id}` as any}
          className={styles.navLink}
        >
          <span aria-hidden="true">←</span> {isEn ? "Previous Lesson" : "Lezione Precedente"}
        </Link>
      ) : (
        <Link href={`/academy/corsi/${courseSlug}/learn` as any} className={styles.navLink}>
          <span aria-hidden="true">←</span> {isEn ? "Back to Course" : "Torna al Corso"}
        </Link>
      )}

      {nextLesson ? (
        <Link
          href={`/academy/corsi/${courseSlug}/learn/${nextLesson.moduleId}?lesson=${nextLesson.id}` as any}
          className={`${styles.navLink} ${styles.navLinkPrimary}`}
        >
          {isEn ? "Next Lesson" : "Lezione Successiva"} <span aria-hidden="true">→</span>
        </Link>
      ) : (
        <Link
          href={`/academy/corsi/${courseSlug}/learn?tab=exam` as any}
          className={`${styles.navLink} ${styles.navLinkPrimary}`}
        >
          {isEn ? "Final Exam" : "Esame Finale"} <span aria-hidden="true">→</span>
        </Link>
      )}
    </nav>
  );
}
