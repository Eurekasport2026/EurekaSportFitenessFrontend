"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import {
  getAssignmentBrief,
  loadAssignmentSubmission,
  saveAssignmentSubmission,
} from "@/lib/api/assignments";
import type { AssignmentSubmission } from "@/lib/api/types";
import { recordAssignmentStatus } from "@/lib/api/progress";
import styles from "./lesson-view.module.css";

interface AssignmentViewProps {
  courseSlug: string;
  onSubmissionUpdated?: (submission: AssignmentSubmission) => void;
}

export function AssignmentView({ courseSlug, onSubmissionUpdated }: AssignmentViewProps) {
  const locale = useLocale() || "it";
  const isEn = locale === "en";

  const brief = getAssignmentBrief(courseSlug, locale);
  const [submission, setSubmission] = useState<AssignmentSubmission>(() => loadAssignmentSubmission(courseSlug));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectTitle, setProjectTitle] = useState(submission.title || "");
  const [projectNotes, setProjectNotes] = useState(submission.notes || "");
  const [selectedFile, setSelectedFile] = useState<string>(submission.fileName || "");
  const [notification, setNotification] = useState<string | null>(null);

  if (!brief) {
    return (
      <div className={styles.contentSection} style={{ textAlign: "center", padding: "2em" }}>
        <p style={{ color: "#64748b" }}>
          {isEn ? "No assignment specifications for this course." : "Nessuna specifica di elaborato per questo corso."}
        </p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitle.trim()) {
      setNotification(isEn ? "Please enter a project title." : "Inserisci un titolo per il tuo elaborato.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const updated = saveAssignmentSubmission(courseSlug, {
        title: projectTitle,
        notes: projectNotes,
        fileName: selectedFile || (courseSlug === "calisthenics-2" ? "skill_demonstration_video.mp4" : "project_work_final.pdf"),
        status: "under_review",
        submittedAt: new Date().toISOString(),
        reviewerFeedback: isEn
          ? "Submission received. Faculty committee review typically takes 5 business days."
          : "Elaborato ricevuto correttamente. La commissione esaminatrice valuterà l'elaborato entro 5 giorni lavorativi.",
      });

      recordAssignmentStatus(courseSlug, "submitted");
      setSubmission(updated);
      setIsSubmitting(false);
      setNotification(isEn ? "Project work submitted successfully for evaluation." : "Elaborato inviato con successo per la valutazione.");
      if (onSubmissionUpdated) onSubmissionUpdated(updated);
    }, 600);
  };

  const handleSimulateApprove = () => {
    const approved = saveAssignmentSubmission(courseSlug, {
      status: "approved",
      reviewerFeedback: isEn
        ? "Exemplary submission. Meets all national technical standards (Score: Approved with Honors)."
        : "Elaborato eccellente. Conforme a tutti gli standard tecnici nazionali Libertas/CONI (Esito: Approvato a pieni voti).",
    });
    recordAssignmentStatus(courseSlug, "approved");
    setSubmission(approved);
    if (onSubmissionUpdated) onSubmissionUpdated(approved);
  };

  const handleReset = () => {
    const reset = saveAssignmentSubmission(courseSlug, {
      status: "not_submitted",
      title: "",
      notes: "",
      fileName: "",
      reviewerFeedback: undefined,
    });
    recordAssignmentStatus(courseSlug, "not_submitted");
    setSubmission(reset);
    setProjectTitle("");
    setProjectNotes("");
    setSelectedFile("");
    setNotification(null);
    if (onSubmissionUpdated) onSubmissionUpdated(reset);
  };

  return (
    <div style={{ marginTop: "1.5em" }}>
      {/* Header card */}
      <div className={styles.contentSection} style={{ borderLeft: "4px solid #0066ff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5em" }}>
          <div>
            <span className={styles.pillBadge} style={{ background: "#e0f2fe", color: "#0369a1", marginBottom: "0.5em" }}>
              {courseSlug === "calisthenics-2" ? (isEn ? "Practical Video Verification" : "Verifica Video Pratica") : (isEn ? "Capstone Project Work" : "Project Work Finale")}
            </span>
            <h2 style={{ margin: "0.2em 0 0.35em", fontSize: "1.35rem", color: "#0d2345", fontWeight: 800 }}>
              {brief.title}
            </h2>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "#64748b" }}>{brief.subtitle}</p>
          </div>
          <span
            className={styles.pillBadge}
            style={
              submission.status === "approved"
                ? { background: "#dcfce7", color: "#15803d", fontWeight: 700 }
                : submission.status === "under_review" || submission.status === "submitted"
                ? { background: "#fef3c7", color: "#b45309", fontWeight: 700 }
                : { background: "#f1f5f9", color: "#475569" }
            }
          >
            {submission.status === "approved"
              ? (isEn ? "✓ Approved" : "✓ Approvato")
              : submission.status === "under_review" || submission.status === "submitted"
              ? (isEn ? "⏳ Under Review" : "⏳ In Revisione")
              : (isEn ? "○ To Submit" : "○ Da Inviare")}
          </span>
        </div>

        <p style={{ fontSize: "0.88rem", color: "#334960", lineHeight: 1.6, marginTop: "1em", marginBottom: "1.5em" }}>
          {brief.description}
        </p>

        {/* Rubric requirements */}
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "0.5em", padding: "1.25em", marginBottom: "1.5em" }}>
          <h4 style={{ margin: "0 0 0.75em", fontSize: "0.95rem", color: "#0d2345", fontWeight: 700 }}>
            📋 {isEn ? "Evaluation Criteria & Rubric:" : "Criteri di Valutazione della Commissione:"}
          </h4>
          <ul style={{ margin: 0, paddingLeft: "1.25em", display: "grid", gap: "0.4em" }}>
            {brief.rubric.map((item, idx) => (
              <li key={idx} style={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.5 }}>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Guidelines */}
        <div style={{ marginBottom: "1.5em" }}>
          <h4 style={{ margin: "0 0 0.5em", fontSize: "0.85rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {isEn ? "Submission Guidelines" : "Linee Guida di Consegna"}
          </h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75em" }}>
            {brief.submissionGuidelines.map((guide, idx) => (
              <span key={idx} style={{ fontSize: "0.78rem", background: "#f1f5f9", padding: "0.35em 0.75em", borderRadius: "0.35em", color: "#334960" }}>
                ℹ️ {guide}
              </span>
            ))}
          </div>
        </div>
      </div>

      {notification && (
        <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "0.85em 1.25em", borderRadius: "0.5em", marginBottom: "1.5em", fontSize: "0.85rem" }}>
          {notification}
        </div>
      )}

      {/* Submission status and interaction card */}
      <div className={styles.contentSection}>
        <h3 style={{ margin: "0 0 1em", fontSize: "1.1rem", color: "#0d2345", fontWeight: 700 }}>
          {submission.status === "approved"
            ? (isEn ? "Evaluation Outcome: Approved" : "Esito Valutazione: Approvato")
            : submission.status === "under_review" || submission.status === "submitted"
            ? (isEn ? "Submission Status: Under Faculty Review" : "Stato Elaborato: In Revisione")
            : (isEn ? "Submit Your Work" : "Invia il Tuo Elaborato")}
        </h3>

        {submission.status === "not_submitted" ? (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.25em" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334960", marginBottom: "0.4em" }}>
                {isEn ? "Project Title / Topic *" : "Titolo dell'Elaborato / Argomento *"}
              </label>
              <input
                type="text"
                required
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder={isEn ? "e.g. Annual Periodization for Elite Athlete" : "es. Pianificazione Annuale Atleta di Potenza"}
                style={{ width: "100%", padding: "0.65em", borderRadius: "0.4em", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334960", marginBottom: "0.4em" }}>
                {isEn ? "Summary Notes & Candidate Observations" : "Note di Sintesi e Osservazioni del Candidato"}
              </label>
              <textarea
                rows={4}
                value={projectNotes}
                onChange={(e) => setProjectNotes(e.target.value)}
                placeholder={isEn ? "Describe your methodology and key considerations..." : "Descrivi la metodologia adottata e i punti salienti del progetto..."}
                style={{ width: "100%", padding: "0.65em", borderRadius: "0.4em", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334960", marginBottom: "0.4em" }}>
                {courseSlug === "calisthenics-2" ? (isEn ? "Video File or Video URL *" : "File Video o Link Video *") : (isEn ? "Project Dossier File (PDF) *" : "File Dossier di Progetto (PDF) *")}
              </label>
              <div style={{ display: "flex", gap: "0.75em", alignItems: "center" }}>
                <input
                  type="text"
                  value={selectedFile}
                  onChange={(e) => setSelectedFile(e.target.value)}
                  placeholder={courseSlug === "calisthenics-2" ? "https://youtube.com/watch?v=... o file video" : "progetto_finale_eureka.pdf"}
                  style={{ flex: 1, padding: "0.65em", borderRadius: "0.4em", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                />
                <button
                  type="button"
                  onClick={() => setSelectedFile(courseSlug === "calisthenics-2" ? "dimostrazione_skill_calisthenics.mp4" : "progetto_finale_master_coach.pdf")}
                  className={styles.btnSecondary}
                  style={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}
                >
                  📎 {isEn ? "Simulate File Selection" : "Seleziona File"}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1em", marginTop: "0.5em" }}>
              <button
                type="submit"
                disabled={isSubmitting}
                className={styles.btnPrimary}
                style={{ minWidth: "12em" }}
              >
                {isSubmitting ? (isEn ? "Submitting..." : "Invio in corso...") : (isEn ? "Submit for Evaluation" : "Invia per Valutazione")}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: "grid", gap: "1em" }}>
            <div style={{ background: "#f8fafc", padding: "1em", borderRadius: "0.5em" }}>
              <p style={{ margin: "0 0 0.4em", fontSize: "0.85rem", color: "#64748b" }}>
                {isEn ? "Submitted Project Title:" : "Titolo Elaborato Inviato:"}
              </p>
              <h4 style={{ margin: 0, fontSize: "1rem", color: "#0d2345", fontWeight: 700 }}>{submission.title}</h4>
              <p style={{ margin: "0.5em 0 0", fontSize: "0.78rem", color: "#64748b" }}>
                📁 {submission.fileName} • {isEn ? "Submitted on" : "Inviato il"} {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : ""}
              </p>
            </div>

            {submission.reviewerFeedback && (
              <div
                style={{
                  background: submission.status === "approved" ? "#ecfdf5" : "#fffbeb",
                  border: `1px solid ${submission.status === "approved" ? "#a7f3d0" : "#fde68a"}`,
                  padding: "1.25em",
                  borderRadius: "0.5em",
                }}
              >
                <h4 style={{ margin: "0 0 0.35em", fontSize: "0.88rem", fontWeight: 700, color: submission.status === "approved" ? "#065f46" : "#92400e" }}>
                  {submission.status === "approved" ? (isEn ? "Official Faculty Feedback:" : "Verbale di Valutazione Commissione Docenti:") : (isEn ? "Review Status:" : "Stato della Valutazione:")}
                </h4>
                <p style={{ margin: 0, fontSize: "0.85rem", color: submission.status === "approved" ? "#047857" : "#78350f", lineHeight: 1.5 }}>
                  {submission.reviewerFeedback}
                </p>
              </div>
            )}

            {/* Simulation controls for demo testing */}
            <div style={{ display: "flex", gap: "0.75em", flexWrap: "wrap", borderTop: "1px solid #f1f5f9", paddingTop: "1em", marginTop: "0.5em" }}>
              {submission.status !== "approved" && (
                <button
                  type="button"
                  onClick={handleSimulateApprove}
                  className={styles.btnSecondary}
                  style={{ background: "#10b981", color: "#ffffff", borderColor: "#10b981", fontSize: "0.78rem" }}
                >
                  ✓ {isEn ? "Simulate Faculty Approval" : "Simula Approvazione Commissione"}
                </button>
              )}
              <button
                type="button"
                onClick={handleReset}
                className={styles.btnSecondary}
                style={{ fontSize: "0.78rem", color: "#64748b" }}
              >
                ↺ {isEn ? "Reset Submission" : "Reimposta Elaborato"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
