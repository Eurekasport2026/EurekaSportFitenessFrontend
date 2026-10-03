"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import type { Course } from "@/lib/api/types";
import styles from "./course-home.module.css";

interface CourseCompletionProps {
  course: Course;
  onBackToCourse?: () => void;
}

export function CourseCompletion({ course, onBackToCourse }: CourseCompletionProps) {
  const locale = useLocale() || "it";
  const isEn = locale === "en";

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #a7f3d0",
        borderRadius: "0.85em",
        padding: "3.5em 2em",
        textAlign: "center",
        boxShadow: "0 10px 30px rgba(16, 185, 129, 0.12)",
        maxWidth: "800px",
        margin: "0 auto 3em",
      }}
    >
      <div style={{ fontSize: "4.5rem", marginBottom: "0.2em", lineHeight: 1 }}>🏆</div>
      <span
        style={{
          display: "inline-block",
          padding: "0.3em 0.9em",
          borderRadius: "9999px",
          background: "#ecfdf5",
          color: "#059669",
          fontSize: "0.8rem",
          fontWeight: 800,
          letterSpacing: "0.06em",
          marginBottom: "0.75em",
          border: "1px solid #a7f3d0",
        }}
      >
        {isEn ? "COURSE COMPLETED" : "PERCORSO COMPLETATO"}
      </span>

      <h1 style={{ fontSize: "2.2rem", fontWeight: 800, color: "#0d2345", margin: "0 0 0.4em" }}>
        {course.title}
      </h1>
      <p style={{ fontSize: "1.05rem", color: "#475569", maxWidth: "38em", margin: "0 auto 2em", lineHeight: 1.5 }}>
        {isEn
          ? `You have successfully completed all ${course.modulesCount} learning modules, practical sessions, and the final exam.`
          : `Hai completato con successo tutti i ${course.modulesCount} moduli didattici, le sessioni pratiche e l'esame finale.`}
      </p>

      {/* Diploma Box */}
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "0.65em",
          padding: "1.75em",
          maxWidth: "36em",
          margin: "0 auto 2.5em",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6em", marginBottom: "0.5em" }}>
          <span style={{ fontSize: "1.4rem" }}>🎖️</span>
          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#0d2345" }}>
            {isEn ? "Recognized National Technical Diploma" : "Diploma Nazionale Tecnico Riconosciuto"}
          </h3>
        </div>
        <p style={{ fontSize: "0.85rem", color: "#334960", lineHeight: 1.55, margin: "0 0 0.75em" }}>
          {isEn
            ? "In accordance with the Eureka! Academy curriculum, you have satisfied all requirements for the issuance of the Technical Diploma and National Coach Card issued by Libertas, a Sports Promotion Body (EPS) recognized by CONI."
            : "In conformità con il percorso formativo Eureka! Academy, hai maturato i requisiti per il rilascio del Diploma e del Tesserino Tecnico rilasciato da Libertas, Ente di Promozione Sportiva (EPS) riconosciuto dal CONI."}
        </p>
        <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>
          {isEn
            ? "Your provisional digital certification is ready for download. Registration with the national technical coaching registry will be formalized within 15 working days."
            : "La tua certificazione digitale provvisoria è pronta per il download. L'iscrizione all'albo tecnico nazionale sarà formalizzata entro 15 giorni lavorativi."}
        </p>
      </div>

      <div style={{ display: "flex", gap: "1em", justifyContent: "center", flexWrap: "wrap" }}>
        <a
          href={`/docs/${course.slug}-attestato-completamento.pdf`}
          download
          className={styles.overviewAction}
          style={{ background: "#10b981", boxShadow: "0 3px 10px rgba(16, 185, 129, 0.3)" }}
        >
          <span>
            ⇩ {isEn ? "Download Completion Certificate (PDF)" : "Scarica Attestato di Completamento (PDF)"}
          </span>
        </a>
        <Link href="/academy/corsi" className={styles.overviewAction} style={{ background: "#0f172a" }}>
          <span>{isEn ? "Explore Other Courses" : "Esplora Altri Corsi"}</span>
        </Link>
        {onBackToCourse && (
          <button
            type="button"
            onClick={onBackToCourse}
            className={styles.overviewAction}
            style={{ background: "#ffffff", color: "#475569", border: "1px solid #cbd5e1", boxShadow: "none" }}
          >
            <span>← {isEn ? "Return to Course Content" : "Torna ai Contenuti del Corso"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
