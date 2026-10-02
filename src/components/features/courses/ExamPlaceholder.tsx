"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import type { CourseExam } from "@/lib/api/types";
import { recordExamCompletion } from "@/lib/api/progress";
import { Link } from "@/i18n/routing";
import styles from "./lesson-view.module.css";

interface ExamPlaceholderProps {
  exam: CourseExam;
  courseSlug: string;
  onExamPassed?: () => void;
}

export function ExamPlaceholder({ exam, courseSlug, onExamPassed }: ExamPlaceholderProps) {
  const locale = useLocale() || "it";
  const isEn = locale === "en";

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const currentQuestion = exam.questions[currentIdx];
  const totalQuestions = exam.questions.length;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round(((currentIdx + 1) / totalQuestions) * 100);

  const handleAnswer = (val: boolean) => {
    setAnswers((prev) => ({ ...prev, [currentIdx]: val }));
    setShowExplanation(true);
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

  const handleSubmit = () => {
    const score = calculateScore();
    const passed = score >= exam.passingScorePercent;
    setIsSubmitted(true);
    recordExamCompletion(courseSlug, score, passed);
    if (passed && onExamPassed) {
      onExamPassed();
    }
  };

  if (isSubmitted) {
    const score = calculateScore();
    const passed = score >= exam.passingScorePercent;

    return (
      <div className={styles.contentSection} style={{ textAlign: "center", padding: "3em 1.5em" }}>
        <div style={{ fontSize: "3.5rem", marginBottom: "0.2em" }}>{passed ? "🎓" : "📚"}</div>
        <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0d2345", margin: "0 0 0.5em" }}>
          {passed
            ? isEn
              ? "Congratulations! Exam Passed!"
              : "Congratulazioni! Esame Superato!"
            : isEn
              ? "Exam Not Passed"
              : "Esame non superato"}
        </h2>
        <p style={{ fontSize: "1.1rem", color: "#334960", marginBottom: "1.5em" }}>
          {isEn
            ? `You scored ${score}% (minimum required score: ${exam.passingScorePercent}%).`
            : `Hai ottenuto un punteggio di ${score}% (punteggio minimo richiesto: ${exam.passingScorePercent}%).`}
        </p>

        {passed ? (
          <div style={{ maxWidth: "38em", margin: "0 auto 2em", padding: "1.5em", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "0.65em", textAlign: "left" }}>
            <h4 style={{ margin: "0 0 0.5em", color: "#065f46", fontSize: "0.95rem", fontWeight: 800 }}>
              {isEn ? "Next Steps for National Technical Certification" : "Prossimi Passi per il Diploma Nazionale Tecnico"}
            </h4>
            <p style={{ margin: "0 0 0.75em", fontSize: "0.85rem", color: "#065f46", lineHeight: 1.5 }}>
              {isEn
                ? "You have successfully completed the full training program and passed the final exam. Your details have been submitted for the issuance of the National Technical Diploma issued by Libertas (CONI-recognized Sports Promotion Body)."
                : "Hai completato con successo l'intero percorso formativo e superato la prova finale. I tuoi dati sono stati registrati per l'emissione del Diploma Nazionale Tecnico rilasciato da Libertas (Ente di Promozione Sportiva riconosciuto dal CONI)."}
            </p>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#047857" }}>
              {isEn
                ? "You will receive formal instructions for national registry entry via email."
                : "Riceverai la convocazione per la registrazione all'albo tecnico nazionale via email."}
            </p>
          </div>
        ) : (
          <p style={{ color: "#64748b", maxWidth: "34em", margin: "0 auto 1.5em", fontSize: "0.9rem" }}>
            {isEn
              ? "You can review course modules and retake the exam when you feel prepared."
              : "Puoi rivedere i moduli teorici e ripetere il test quando ti senti pronto."}
          </p>
        )}

        <div style={{ display: "flex", gap: "1em", justifyContent: "center", flexWrap: "wrap" }}>
          {passed ? (
            <Link href={`/academy/corsi/${courseSlug}/learn?completed=true` as any} className={styles.btnPrimary} style={{ padding: "0.8em 1.6em" }}>
              {isEn ? "View Completion Screen →" : "Visualizza Schermata di Completamento →"}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsSubmitted(false);
                setCurrentIdx(0);
                setAnswers({});
                setShowExplanation(false);
              }}
              className={styles.btnSecondary}
              style={{ padding: "0.8em 1.6em" }}
            >
              {isEn ? "Retake Exam" : "Ripeti l'Esame"}
            </button>
          )}
          <Link href={`/academy/corsi/${courseSlug}/learn` as any} className={styles.btnSecondary} style={{ padding: "0.8em 1.6em" }}>
            {isEn ? "Back to Learning Path" : "Torna al Percorso"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.contentSection} style={{ maxWidth: "800px", margin: "0 auto" }}>
      {/* Exam Header */}
      <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "1.25em", marginBottom: "1.5em" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5em" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#0066ff", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {isEn ? `FINAL EXAM • ${exam.questionsCount} QUESTIONS` : `ESAME FINALE • ${exam.questionsCount} DOMANDE`}
          </span>
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b" }}>
            {isEn ? `Question ${currentIdx + 1} of ${totalQuestions}` : `Domanda ${currentIdx + 1} di ${totalQuestions}`}
          </span>
        </div>

        {/* Progress bar across the top */}
        <div style={{ width: "100%", height: "6px", background: "#e2e8f0", borderRadius: "9999px", overflow: "hidden" }}>
          <div style={{ width: `${progressPercent}%`, height: "100%", background: "#0066ff", transition: "width 250ms ease" }} />
        </div>
      </div>

      {/* Question Box */}
      <div style={{ minHeight: "180px", marginBottom: "1.5em" }}>
        <p style={{ fontSize: "0.78rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700, margin: "0 0 0.5em" }}>
          {isEn ? "Statement:" : "Affermazione:"}
        </p>
        <h3 style={{ fontSize: "1.25rem", color: "#0d2345", fontWeight: 700, lineHeight: 1.45, margin: "0 0 1.25em" }}>
          {currentQuestion.number}. {currentQuestion.question}
        </h3>

        {/* True / False Buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1em", marginBottom: "1.5em" }}>
          <button
            type="button"
            onClick={() => handleAnswer(true)}
            style={{
              padding: "1.2em",
              fontSize: "1.1rem",
              fontWeight: 800,
              borderRadius: "0.5em",
              border: answers[currentIdx] === true ? "2px solid #0066ff" : "1px solid #cbd5e1",
              background: answers[currentIdx] === true ? "#ebf3ff" : "#ffffff",
              color: answers[currentIdx] === true ? "#0066ff" : "#1e293b",
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
          >
            {isEn ? "TRUE" : "VERO"}
          </button>
          <button
            type="button"
            onClick={() => handleAnswer(false)}
            style={{
              padding: "1.2em",
              fontSize: "1.1rem",
              fontWeight: 800,
              borderRadius: "0.5em",
              border: answers[currentIdx] === false ? "2px solid #ef4444" : "1px solid #cbd5e1",
              background: answers[currentIdx] === false ? "#fee2e2" : "#ffffff",
              color: answers[currentIdx] === false ? "#dc2626" : "#1e293b",
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
          >
            {isEn ? "FALSE" : "FALSO"}
          </button>
        </div>

        {/* Feedback explanation (if answered) */}
        {showExplanation && answers[currentIdx] !== undefined && (
          <div
            style={{
              padding: "1em",
              borderRadius: "0.5em",
              background: answers[currentIdx] === currentQuestion.correctAnswer ? "#ecfdf5" : "#fef2f2",
              border: `1px solid ${answers[currentIdx] === currentQuestion.correctAnswer ? "#a7f3d0" : "#fecaca"}`,
              marginBottom: "1em",
            }}
          >
            <p style={{ margin: "0 0 0.35em", fontSize: "0.85rem", fontWeight: 700, color: answers[currentIdx] === currentQuestion.correctAnswer ? "#065f46" : "#991b1b" }}>
              {answers[currentIdx] === currentQuestion.correctAnswer
                ? isEn
                  ? "✓ Correct Answer"
                  : "✓ Risposta Corretta"
                : isEn
                  ? "✗ Incorrect Answer"
                  : "✗ Risposta Errata"}
            </p>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#334155" }}>{currentQuestion.explanation}</p>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e2e8f0", paddingTop: "1.25em" }}>
        <button
          type="button"
          disabled={currentIdx === 0}
          onClick={() => {
            setCurrentIdx((p) => Math.max(0, p - 1));
            setShowExplanation(false);
          }}
          className={styles.btnSecondary}
          style={{ opacity: currentIdx === 0 ? 0.4 : 1 }}
        >
          {isEn ? "← Previous" : "← Precedente"}
        </button>

        {currentIdx < totalQuestions - 1 ? (
          <button
            type="button"
            onClick={() => {
              setCurrentIdx((p) => Math.min(totalQuestions - 1, p + 1));
              setShowExplanation(false);
            }}
            className={styles.btnPrimary}
          >
            {isEn ? "Next →" : "Successiva →"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            className={styles.btnPrimary}
            style={{ background: "#10b981", borderColor: "#10b981" }}
          >
            {isEn
              ? `Submit Final Exam (${answeredCount}/${totalQuestions})`
              : `Conferma e Concludi Esame (${answeredCount}/${totalQuestions})`}
          </button>
        )}
      </div>
    </div>
  );
}
