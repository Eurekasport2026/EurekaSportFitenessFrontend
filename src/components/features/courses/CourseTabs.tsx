"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { T, useLanguage } from "@/components/layout/LanguageProvider";
import type { Course, CourseModule } from "@/lib/api/types";
import styles from "./course-detail.module.css";

const tabs = ["Descrizione", "Programma", "Docenti", "FAQ"] as const;
type CourseTab = typeof tabs[number];

interface CourseTabsProps {
  course?: Course;
  modules?: CourseModule[];
}

export function CourseTabs({ course, modules }: CourseTabsProps) {
  const [active, setActive] = useState<CourseTab>("Descrizione");
  const { language } = useLanguage();
  const isEn = language === "en";

  const topics = course?.topics || [
    "Anatomia e fisiologia",
    "Valutazione funzionale",
    "Programmazione dell'allenamento",
    "Tecnica pratica",
    "Alimentazione sportiva",
    "Rilascio diploma",
  ];

  return (
    <section className={styles.tabsSection} aria-label={isEn ? "Course Information" : "Informazioni sul corso"}>
      <div className={styles.tabs} role="group" aria-label={isEn ? "Course sections" : "Sezioni del corso"}>
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={cn(styles.tab, active === tab && styles.tabActive)}
            aria-pressed={active === tab}
            onClick={() => setActive(tab)}
          >
            <T>{tab}</T>
          </button>
        ))}
      </div>
      <div className={styles.tabContent} aria-live="polite">
        {active === "Descrizione" && (
          <>
            <p>
              {course ? (
                course.longDescription
              ) : (
                <T>
                  Il corso di Personal Trainer di Eureka! Academy ti fornisce una formazione completa,
                  pratica e aggiornata, con il supporto di professionisti del settore.
                </T>
              )}
            </p>
            <ul className={styles.topicGrid}>
              {topics.map((topic, i) => (
                <li key={i}>
                  <T>{topic}</T>
                </li>
              ))}
            </ul>
          </>
        )}
        {active === "Programma" && (
          <>
            <p>
              {course ? (
                isEn
                  ? `The curriculum features ${course.modulesCount} structured modules with video lessons, downloadable study guides, and practical exercises.`
                  : `Il percorso si articola in ${course.modulesCount} moduli didattici progressivi con video lezioni, dispense scaricabili ed esercitazioni pratiche.`
              ) : (
                <T>
                  Il percorso approfondisce i fondamenti del movimento e la progettazione di allenamenti
                  personalizzati.
                </T>
              )}
            </p>
            {modules && modules.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.85em", marginTop: "1em" }}>
                {modules.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      padding: "0.85em",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.45em",
                      fontSize: "0.82rem",
                    }}
                  >
                    <div style={{ fontWeight: 800, color: "#0066ff", fontSize: "0.72rem", marginBottom: "0.2em" }}>
                      {isEn ? "MODULE" : "MODULO"} {String(m.number).padStart(2, "0")}
                    </div>
                    <div style={{ fontWeight: 700, color: "#0d2345", marginBottom: "0.2em" }}>{m.title}</div>
                    <div style={{ color: "#64748b", fontSize: "0.75rem" }}>{m.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <ul className={styles.topicGrid}>
                <li><T>Anatomia e fisiologia</T></li>
                <li><T>Valutazione funzionale</T></li>
                <li><T>Tecnica degli esercizi</T></li>
                <li><T>Programmazione dell'allenamento</T></li>
              </ul>
            )}
          </>
        )}
        {active === "Docenti" && (
          <p>
            <T>
              Le lezioni teoriche e pratiche sono guidate da professionisti del settore e docenti accreditati Libertas/CONI. I profili dei docenti saranno pubblicati con il programma completo.
            </T>
          </p>
        )}
        {active === "FAQ" && (
          <dl className={styles.faq}>
            <dt><T>Quanto dura il corso?</T></dt>
            <dd>{course ? course.duration : <T>6 mesi.</T>}</dd>
            <dt><T>Come si svolge?</T></dt>
            <dd>{course ? course.mode : <T>Online e con attività pratiche.</T>}</dd>
            <dt><T>Quale titolo viene rilasciato?</T></dt>
            <dd>{course ? course.certification : <T>Diploma Nazionale Tecnico EPS CONI.</T>}</dd>
            <dt><T>Quando aprono le iscrizioni?</T></dt>
            <dd><T>Le iscrizioni sono aperte tutto l'anno con accesso immediato alle video lezioni.</T></dd>
          </dl>
        )}
      </div>
    </section>
  );
}
