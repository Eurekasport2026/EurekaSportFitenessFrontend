"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { getAssignmentBrief } from "@/lib/api/assignments";
import type { AssignmentSubmission } from "@/lib/api/types";
import { useLearningService } from "@/hooks/use-portal-request";
import { portalMessage } from "@/lib/api/portal";
import { useAuth } from "@/components/features/training-app/AuthProvider";
import { Link } from "@/i18n/routing";
import { toast } from "sonner";
import styles from "./lesson-view.module.css";

interface AssignmentViewProps {
  courseSlug: string;
  onSubmissionUpdated?: (submission: AssignmentSubmission) => void;
}

export function AssignmentView(props: AssignmentViewProps) {
  const { session, status } = useAuth();
  return <Assignment key={String(session?.user.id) + props.courseSlug + status} {...props} />;
}

function Assignment({ courseSlug, onSubmissionUpdated }: AssignmentViewProps) {
  const learningService = useLearningService();
  const locale = useLocale() || "it";
  const isEn = locale === "en";

  const brief = getAssignmentBrief(courseSlug, locale);
  const { status } = useAuth();
  const [submission, setSubmission] = useState<AssignmentSubmission>({ id: "", courseSlug, title: "", type: courseSlug === "calisthenics-2" ? "practical_video" : "project_work", status: "not_submitted", updatedAt: "" });
  const [error, setError] = useState<unknown>(null);
  const [loaded, setLoaded] = useState(false);
  const [retry, setRetry] = useState(0);
  const [legacyDraft, setLegacyDraft] = useState<{ title: string; notes: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectTitle, setProjectTitle] = useState(submission.title || "");
  const [projectNotes, setProjectNotes] = useState(submission.notes || "");
  const [selectedFile, setSelectedFile] = useState<string>(submission.fileName || "");
  useEffect(() => {
    const controller = new AbortController();
    if (status !== "authenticated") return () => controller.abort();
    setError(null); setLoaded(false);
    learningService.submission(courseSlug, controller.signal).then(next => {
      if (controller.signal.aborted) return;
      setSubmission(next); setProjectTitle(next.title); setProjectNotes(next.notes || ""); setSelectedFile(next.resourceUrl || ""); setLoaded(true);
    }).catch(failure => { if (!controller.signal.aborted) setError(failure); });
    try {
      const raw = localStorage.getItem("eureka_assignment_v2_" + courseSlug);
      const draft = raw ? JSON.parse(raw) : null;
      if (draft && typeof draft.title === "string") setLegacyDraft({ title: draft.title.slice(0, 200), notes: typeof draft.notes === "string" ? draft.notes.slice(0, 4000) : "" });
    } catch { /* Unidentified legacy records stay untouched. */ }
    return () => controller.abort();
  }, [courseSlug, status, retry]);

  if (status !== "authenticated") return <Link href="/training/app/login">{isEn ? "Sign in to submit your work" : "Accedi per inviare il tuo elaborato"}</Link>;
  if (error) return <div className={styles.contentSection}><p>{portalMessage(error, isEn)}</p><button type="button" className={styles.btnSecondary} onClick={() => setRetry(v => v + 1)}>{isEn ? "Retry" : "Riprova"}</button></div>;
  if (!loaded) return <p role="status">{isEn ? "Loading…" : "Caricamento…"}</p>;

  if (!brief) {
    return (
      <div className={styles.contentSection} style={{ textAlign: "center", padding: "2em" }}>
        <p style={{ color: "#64748b" }}>
          {isEn ? "No assignment specifications for this course." : "Nessuna specifica di elaborato per questo corso."}
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!projectTitle.trim()) { toast.error(isEn ? "Enter a project title." : "Inserisci un titolo.", { id: "academy-submission" }); return; }
    setIsSubmitting(true);
    try {
      await learningService.enroll(courseSlug);
      const updated = await learningService.submit(courseSlug, projectTitle, projectNotes, selectedFile);
      setSubmission(updated); onSubmissionUpdated?.(updated);
      toast.success(isEn ? "Submitted for review." : "Inviato per revisione.", { id: "academy-submission" });
    } catch (failure) { toast.error(portalMessage(failure, isEn), { id: "academy-submission" }); }
    finally { setIsSubmitting(false); }
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


      {legacyDraft && (submission.status === "not_submitted" || submission.status === "changes_requested") && <div className={styles.contentSection}><p>{isEn ? "A saved draft on this device has no account owner. Import it only if it is yours." : "La bozza su questo dispositivo non è associata a un account. Importala solo se è tua."}</p><button type="button" className={styles.btnSecondary} onClick={() => { setProjectTitle(legacyDraft.title); setProjectNotes(legacyDraft.notes); setLegacyDraft(null); }}>{isEn ? "Import my draft" : "Importa la mia bozza"}</button></div>}
      {/* Submission status and interaction card */}
      <div className={styles.contentSection}>
        <h3 style={{ margin: "0 0 1em", fontSize: "1.1rem", color: "#0d2345", fontWeight: 700 }}>
          {submission.status === "approved"
            ? (isEn ? "Evaluation Outcome: Approved" : "Esito Valutazione: Approvato")
            : submission.status === "under_review" || submission.status === "submitted"
            ? (isEn ? "Submission Status: Under Faculty Review" : "Stato Elaborato: In Revisione")
            : (isEn ? "Submit Your Work" : "Invia il Tuo Elaborato")}
        </h3>

        {(submission.status === "not_submitted" || submission.status === "changes_requested") ? (
          <form onSubmit={handleSubmit} onInvalidCapture={event => { event.preventDefault(); event.currentTarget.querySelector<HTMLElement>(":invalid")?.focus(); toast.error(isEn ? "Check the required fields and resource link." : "Controlla i campi obbligatori e il collegamento.", { id: "academy-submission" }); }} style={{ display: "grid", gap: "1.25em" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334960", marginBottom: "0.4em" }}>
                {isEn ? "Project Title / Topic *" : "Titolo dell'Elaborato / Argomento *"}
              </label>
              <input
                type="text"
                required
                maxLength={200}
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
                maxLength={4000}
                value={projectNotes}
                onChange={(e) => setProjectNotes(e.target.value)}
                placeholder={isEn ? "Describe your methodology and key considerations..." : "Descrivi la metodologia adottata e i punti salienti del progetto..."}
                style={{ width: "100%", padding: "0.65em", borderRadius: "0.4em", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334960", marginBottom: "0.4em" }}>
                {courseSlug === "calisthenics-2" ? (isEn ? "Video resource link (HTTPS) *" : "Collegamento video (HTTPS) *") : (isEn ? "Project resource link (HTTPS)" : "Collegamento elaborato (HTTPS)")}
              </label>
              <div style={{ display: "flex", gap: "0.75em", alignItems: "center" }}>
                <input
                  type="url"
                  required={courseSlug === "calisthenics-2"}
                  pattern="https://.*"
                  maxLength={2000}
                  value={selectedFile}
                  onChange={(e) => setSelectedFile(e.target.value)}
                  placeholder="https://..."
                  style={{ flex: 1, padding: "0.65em", borderRadius: "0.4em", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                />
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
                {submission.resourceUrl} • {isEn ? "Submitted on" : "Inviato il"} {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : ""}
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

          </div>
        )}
      </div>
    </div>
  );
}
