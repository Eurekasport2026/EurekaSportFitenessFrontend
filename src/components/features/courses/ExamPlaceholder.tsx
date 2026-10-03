"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import type { CourseExam } from "@/lib/api/types";
import { recordExamCompletion } from "@/lib/api/progress";
import styles from "./lesson-view.module.css";

interface ExamPlaceholderProps {
  exam: CourseExam;
  courseSlug: string;
  isLocked?: boolean;
  onExamPassed?: () => void;
}

export function ExamPlaceholder({ exam, courseSlug, isLocked = false, onExamPassed }: ExamPlaceholderProps) {
  const locale = useLocale() || "it";
  const isEn = locale === "en";

  const [mode, setMode] = useState<"exam" | "practice">("exam");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [practiceExplanationVisible, setPracticeExplanationVisible] = useState(false);

  const totalQuestions = exam.questions.length;
  const currentQuestion = exam.questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = totalQuestions - answeredCount;
  const progressPercent = Math.round(((currentIdx + 1) / totalQuestions) * 100);

  if (isLocked) {
    return (
      <div className={styles.contentSection} style={{ textAlign: "center", padding: "3em 1.5em", border: "1px dashed #cbd5e1" }}>
        <div style={{ fontSize: "3rem", marginBottom: "0.5em" }}>🔒</div>
        <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0d2345", margin: "0 0 0.5em" }}>
          {isEn ? "Final Exam Locked" : "Esame Finale Bloccato"}
        </h3>
        <p style={{ color: "#64748b", maxWidth: "32em", margin: "0 auto 1.5em", fontSize: "0.9rem", lineHeight: 1.5 }}>
          {isEn
            ? "To ensure authentic certification standards, you must complete all course learning modules before unlocking the final exam."
            : "Per garantire gli standard di abilitazione tecnica, è necessario completare tutti i moduli didattici prima di accedere all'esame finale."}
        </p>
        <span className={styles.pillBadge} style={{ background: "#fef3c7", color: "#92400e" }}>
          ⚠️ {isEn ? "Prerequisite: 100% Course Modules Completed" : "Prerequisito: 100% Moduli del Corso Completati"}
        </span>
      </div>
    );
  }

  const handleAnswer = (val: boolean) => {
    setAnswers((prev) => ({ ...prev, [currentIdx]: val }));
    if (mode === "practice") {
      setPracticeExplanationVisible(true);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    exam.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / totalQuestions) * 100);
  };

  const executeSubmission = () => {
    const score = calculateScore();
    const passed = score >= exam.passingScorePercent;
    setIsSubmitted(true);
    setShowConfirmModal(false);
    recordExamCompletion(courseSlug, score, passed);
    if (passed && onExamPassed) {
      onExamPassed();
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setCurrentIdx(0);
    setIsSubmitted(false);
    setPracticeExplanationVisible(false);
  };

  if (isSubmitted) {
    const score = calculateScore();
    const passed = score >= exam.passingScorePercent;
    const correctCount = exam.questions.filter((q, idx) => answers[idx] === q.correctAnswer).length;

    return (
      <div className={styles.contentSection} style={{ padding: "2.5em 1.5em" }}>
        <div style={{ textAlign: "center", marginBottom: "2em" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "0.2em" }}>{passed ? "🎓" : "📚"}</div>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0d2345", margin: "0 0 0.4em" }}>
            {passed
              ? (isEn ? "Exam Simulation Passed!" : "Simulazione d'Esame Superata!")
              : (isEn ? "Exam Not Passed" : "Esame non superato")}
          </h2>
          <p style={{ fontSize: "1.1rem", color: "#334960", margin: "0 0 0.5em" }}>
            {isEn
              ? `Your Score: ${score}% (${correctCount} of ${totalQuestions} correct)`
              : `Punteggio ottenuto: ${score}% (${correctCount} su ${totalQuestions} esatte)`}
          </p>
          <span className={styles.pillBadge} style={{ background: passed ? "#dcfce7" : "#fee2e2", color: passed ? "#15803d" : "#b91c1c", fontWeight: 700 }}>
            {isEn ? `Passing Threshold: ${exam.passingScorePercent}%` : `Soglia Minima di Idoneità: ${exam.passingScorePercent}%`}
          </span>
        </div>

        {/* Honest simulation notice */}
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "0.5em", padding: "1.25em", marginBottom: "2em" }}>
          <h4 style={{ margin: "0 0 0.4em", fontSize: "0.88rem", color: "#0d2345", fontWeight: 700 }}>
            ℹ️ {isEn ? "Certification Simulation Notice:" : "Nota di Convalida Simulazione:"}
          </h4>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#52667b", lineHeight: 1.5 }}>
            {isEn
              ? `This exam simulator tests knowledge across all course modules according to ${exam.certificateBody} standards. In live production with backend services, official scores are transmitted to the technical commission for accreditation.`
              : `Questo simulatore verifica le competenze didattiche secondo i criteri di ${exam.certificateBody}. Nella piattaforma di produzione con backend abilitato, l'esito viene registrato ai fini dell'emissione del diploma ufficiale.`}
          </p>
        </div>

        {/* Detailed question-by-question review */}
        <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0d2345", margin: "0 0 1em" }}>
          {isEn ? "Question Review & Solutions:" : "Revisione Dettagliata delle Domande:"}
        </h3>
        <div style={{ display: "grid", gap: "1em", marginBottom: "2em" }}>
          {exam.questions.map((q, idx) => {
            const userAnswer = answers[idx];
            const isCorrect = userAnswer === q.correctAnswer;
            return (
              <div
                key={q.id}
                style={{
                  background: isCorrect ? "#f0fdf4" : "#fef2f2",
                  border: `1px solid ${isCorrect ? "#bbf7d0" : "#fecaca"}`,
                  borderRadius: "0.5em",
                  padding: "1em",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.4em" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>
                    {isEn ? `Question ${idx + 1}` : `Domanda ${idx + 1}`}
                  </span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 800, color: isCorrect ? "#15803d" : "#b91c1c" }}>
                    {isCorrect ? (isEn ? "✓ Correct" : "✓ Esatta") : (isEn ? "✕ Incorrect" : "✕ Errata")}
                  </span>
                </div>
                <p style={{ margin: "0 0 0.5em", fontSize: "0.9rem", fontWeight: 600, color: "#0d2345" }}>{q.question}</p>
                <p style={{ margin: "0 0 0.4em", fontSize: "0.8rem", color: "#475569" }}>
                  {isEn ? "Your Answer: " : "La tua risposta: "}
                  <strong>{userAnswer === undefined ? (isEn ? "Unanswered" : "Non risposta") : userAnswer ? (isEn ? "TRUE" : "VERO") : (isEn ? "FALSE" : "FALSO")}</strong>
                  {" • "}
                  {isEn ? "Correct Solution: " : "Soluzione corretta: "}
                  <strong>{q.correctAnswer ? (isEn ? "TRUE" : "VERO") : (isEn ? "FALSE" : "FALSO")}</strong>
                </p>
                {q.explanation && (
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b", fontStyle: "italic", background: "#ffffff", padding: "0.4em 0.6em", borderRadius: "0.3em" }}>
                    💡 {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: "center" }}>
          <button
            type="button"
            onClick={handleRetake}
            className={styles.btnSecondary}
            style={{ minWidth: "12em" }}
          >
            ↺ {isEn ? "Retake Exam Simulation" : "Ripeti la Simulazione"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "1.5em" }}>
      {/* Mode selection header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1em", marginBottom: "1.25em" }}>
        <div>
          <h2 style={{ margin: "0 0 0.2em", fontSize: "1.3rem", fontWeight: 800, color: "#0d2345" }}>
            {exam.title}
          </h2>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
            {exam.description}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5em" }}>
          <button
            type="button"
            onClick={() => { setMode("exam"); setPracticeExplanationVisible(false); }}
            className={styles.btnSecondary}
            style={mode === "exam" ? { background: "#0066ff", color: "#fff", borderColor: "#0066ff", fontSize: "0.75rem" } : { fontSize: "0.75rem" }}
          >
            ⏱ {isEn ? "Official Exam Mode" : "Modalità Esame Ufficiale"}
          </button>
          <button
            type="button"
            onClick={() => { setMode("practice"); }}
            className={styles.btnSecondary}
            style={mode === "practice" ? { background: "#0066ff", color: "#fff", borderColor: "#0066ff", fontSize: "0.75rem" } : { fontSize: "0.75rem" }}
          >
            💡 {isEn ? "Practice Quiz Mode" : "Modalità Esercitazione"}
          </button>
        </div>
      </div>

      {/* Progress tracking bar */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0.65em", padding: "1.25em", marginBottom: "1.5em" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "#64748b", marginBottom: "0.5em" }}>
          <span>{isEn ? `Question ${currentIdx + 1} of ${totalQuestions}` : `Domanda ${currentIdx + 1} di ${totalQuestions}`}</span>
          <span>{isEn ? `Answered: ${answeredCount}/${totalQuestions}` : `Risposte: ${answeredCount}/${totalQuestions}`}</span>
        </div>
        <div style={{ width: "100%", height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
          <div style={{ width: `${progressPercent}%`, height: "100%", background: "#0066ff", transition: "width 0.2s ease" }} />
        </div>
      </div>

      {/* Active question card */}
      <div className={styles.contentSection} style={{ padding: "2em 1.5em" }}>
        <span className={styles.pillBadge} style={{ background: "#f1f5f9", color: "#475569", marginBottom: "1em" }}>
          {isEn ? `Question ${currentIdx + 1}` : `Domanda ${currentIdx + 1}`}
        </span>

        <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0d2345", lineHeight: 1.5, marginBottom: "1.5em" }}>
          {currentQuestion.question}
        </h3>

        {/* Big TRUE / FALSE buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1em", maxWidth: "26em", marginBottom: "1.5em" }}>
          <button
            type="button"
            onClick={() => handleAnswer(true)}
            className={styles.btnSecondary}
            style={{
              padding: "1.1em",
              fontSize: "1.05rem",
              fontWeight: 800,
              background: answers[currentIdx] === true ? "#10b981" : "#ffffff",
              color: answers[currentIdx] === true ? "#ffffff" : "#0d2345",
              borderColor: answers[currentIdx] === true ? "#10b981" : "#cbd5e1",
            }}
          >
            ✓ {isEn ? "TRUE" : "VERO"}
          </button>
          <button
            type="button"
            onClick={() => handleAnswer(false)}
            className={styles.btnSecondary}
            style={{
              padding: "1.1em",
              fontSize: "1.05rem",
              fontWeight: 800,
              background: answers[currentIdx] === false ? "#ef4444" : "#ffffff",
              color: answers[currentIdx] === false ? "#ffffff" : "#0d2345",
              borderColor: answers[currentIdx] === false ? "#ef4444" : "#cbd5e1",
            }}
          >
            ✕ {isEn ? "FALSE" : "FALSO"}
          </button>
        </div>

        {/* Practice mode instant explanation */}
        {mode === "practice" && practiceExplanationVisible && answers[currentIdx] !== undefined && (
          <div
            style={{
              background: answers[currentIdx] === currentQuestion.correctAnswer ? "#ecfdf5" : "#fff1f2",
              border: `1px solid ${answers[currentIdx] === currentQuestion.correctAnswer ? "#a7f3d0" : "#fecdd3"}`,
              padding: "1em",
              borderRadius: "0.5em",
              marginBottom: "1.5em",
            }}
          >
            <p style={{ margin: "0 0 0.3em", fontSize: "0.85rem", fontWeight: 700, color: answers[currentIdx] === currentQuestion.correctAnswer ? "#065f46" : "#9f1239" }}>
              {answers[currentIdx] === currentQuestion.correctAnswer ? (isEn ? "✓ Correct!" : "✓ Risposta Esatta!") : (isEn ? "✕ Incorrect" : "✕ Risposta Errata")}
            </p>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "#334960" }}>
              {currentQuestion.explanation}
            </p>
          </div>
        )}

        {/* Navigation buttons: Prev, Next, Submit */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75em", borderTop: "1px solid #f1f5f9", paddingTop: "1.25em" }}>
          <button
            type="button"
            disabled={currentIdx === 0}
            onClick={() => { setCurrentIdx((prev) => prev - 1); setPracticeExplanationVisible(false); }}
            className={styles.btnSecondary}
          >
            ← {isEn ? "Previous Question" : "Domanda Precedente"}
          </button>

          {currentIdx < totalQuestions - 1 ? (
            <button
              type="button"
              onClick={() => { setCurrentIdx((prev) => prev + 1); setPracticeExplanationVisible(false); }}
              className={styles.btnPrimary}
            >
              {isEn ? "Next Question" : "Domanda Successiva"} →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className={styles.btnPrimary}
              style={{ background: "#10b981", borderColor: "#10b981" }}
            >
              🏁 {isEn ? "Submit Exam" : "Conferma e Consegna"}
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal before submission */}
      {showConfirmModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(13, 35, 69, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1.5em",
          }}
        >
          <div style={{ background: "#ffffff", borderRadius: "0.75em", padding: "2em", maxWidth: "28em", width: "100%", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 0.5em", fontSize: "1.25rem", color: "#0d2345", fontWeight: 800 }}>
              {isEn ? "Submit Final Exam?" : "Confermi la Consegna dell'Esame?"}
            </h3>
            <p style={{ fontSize: "0.88rem", color: "#52667b", lineHeight: 1.5, marginBottom: "1.25em" }}>
              {unansweredCount > 0
                ? isEn
                  ? `Warning: You have ${unansweredCount} unanswered questions out of ${totalQuestions}. Unanswered questions will count as incorrect.`
                  : `Attenzione: ci sono ancora ${unansweredCount} domande senza risposta su ${totalQuestions}. Le domande omesse verranno conteggiate come errate.`
                : isEn
                  ? `You have answered all ${totalQuestions} questions. Are you ready to submit your attempt?`
                  : `Hai risposto a tutte le ${totalQuestions} domande. Vuoi procedere con la valutazione finale?`}
            </p>

            <div style={{ display: "flex", gap: "0.75em", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className={styles.btnSecondary}
              >
                {isEn ? "Return to Questions" : "Torna alle Domande"}
              </button>
              <button
                type="button"
                onClick={executeSubmission}
                className={styles.btnPrimary}
                style={{ background: "#10b981", borderColor: "#10b981" }}
              >
                {isEn ? "Yes, Finalize Submission" : "Sì, Consegna Esame"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
