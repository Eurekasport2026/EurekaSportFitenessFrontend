"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { T, useLanguage } from "@/components/layout/LanguageProvider";
import type { Course, CourseModule } from "@/lib/api/types";
import styles from "./course-detail.module.css";

const tabs = ["Descrizione", "Programma", "Docenti", "FAQ"] as const;
type CourseTab = typeof tabs[number];

interface CourseTabsProps {
  course: Course;
  modules?: CourseModule[] | null;
  modulesError?: boolean;
}

export function CourseTabs({ course, modules, modulesError }: CourseTabsProps) {
  const [active, setActive] = useState<CourseTab>("Descrizione");
  const { language } = useLanguage();
  const isEn = language === "en";

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
              {course.longDescription}
            </p>
            <ul className={styles.topicGrid}>
              {course.topics.map((topic, i) => (
                <li key={i}>
                  {topic}
                </li>
              ))}
            </ul>
          </>
        )}
        {active === "Programma" && (
          <>
            <p>
              {isEn
                ? `The curriculum features ${course.modulesCount} structured modules with video lessons, downloadable study guides, and practical exercises.`
                : `Il percorso si articola in ${course.modulesCount} moduli didattici progressivi con video lezioni, dispense scaricabili ed esercitazioni pratiche.`}
            </p>
            {modulesError ? (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "0.55em",
                  padding: "1.25em",
                  marginTop: "1em",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1em",
                }}
                role="alert"
              >
                <div>
                  <h4 style={{ margin: "0 0 0.25em", color: "#991b1b", fontWeight: 700, fontSize: "0.92rem" }}>
                    {isEn ? "Unable to load curriculum modules" : "Impossibile caricare i moduli del programma"}
                  </h4>
                  <p style={{ margin: 0, color: "#7f1d1d", fontSize: "0.8rem" }}>
                    {isEn
                      ? "A temporary network issue occurred. Please retry to view the syllabus."
                      : "Si è verificato un errore di rete temporaneo. Riprova per consultare il programma completo."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  style={{
                    padding: "0.5em 1.1em",
                    borderRadius: "0.45em",
                    background: "#b91c1c",
                    color: "#ffffff",
                    border: "none",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {isEn ? "Retry" : "Riprova"}
                </button>
              </div>
            ) : modules && modules.length > 0 ? (
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
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "0.55em",
                  padding: "1.5em",
                  marginTop: "1em",
                  textAlign: "center",
                }}
              >
                <p style={{ color: "#64748b", margin: 0, fontSize: "0.85rem" }}>
                  {isEn ? "No curriculum modules available for this course yet." : "Nessun modulo didattico disponibile per questo corso al momento."}
                </p>
              </div>
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
            <dd>{course.duration}</dd>
            <dt><T>Come si svolge?</T></dt>
            <dd>{course.mode}</dd>
            <dt><T>Quale titolo viene rilasciato?</T></dt>
            <dd>{course.certification}</dd>
            <dt><T>Quando aprono le iscrizioni?</T></dt>
            <dd><T>Le iscrizioni sono aperte tutto l'anno con accesso immediato alle video lezioni.</T></dd>
          </dl>
        )}
      </div>
    </section>
  );
}
