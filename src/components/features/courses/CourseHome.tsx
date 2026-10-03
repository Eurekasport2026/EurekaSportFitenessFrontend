"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import type { Course, CourseModule, CourseExam, UserCourseProgress } from "@/lib/api/types";
import { loadUserProgress, calculateCourseProgress } from "@/lib/api/progress";
import { ProgressBar } from "./ProgressBar";
import { ModuleCard } from "./ModuleCard";
import { PracticalResources } from "./PracticalResources";
import { PT3ResourcesView } from "./PT3ResourcesView";
import { AssignmentView } from "./AssignmentView";
import { ExamPlaceholder } from "./ExamPlaceholder";
import { CourseCompletion } from "./CourseCompletion";
import type { ModuleStatus } from "./StatusBadge";
import styles from "./course-home.module.css";

interface CourseHomeProps {
  course: Course;
  modules: CourseModule[];
  exam?: CourseExam;
  initialTab?: string;
  isCompletedQuery?: boolean;
}

type TabType = "modules" | "practical" | "assignment" | "exam";

export function CourseHome({
  course,
  modules,
  exam,
  initialTab,
}: CourseHomeProps) {
  const locale = useLocale() || "it";
  const isEn = locale === "en";

  const [progress, setProgress] = useState<UserCourseProgress>(() => loadUserProgress(course.slug));
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (initialTab === "exam") return "exam";
    if (initialTab === "practical") return "practical";
    if (initialTab === "assignment" || initialTab === "project-work" || initialTab === "verifica-pratica") {
      return "assignment";
    }
    return "modules";
  });
  const [showCertificateView, setShowCertificateView] = useState(false);

  useEffect(() => {
    setProgress(loadUserProgress(course.slug));
  }, [course.slug]);

  const {
    percent,
    completedLessonsCount,
    totalLessonsCount,
    isExamUnlocked,
    isCompleted,
  } = calculateCourseProgress(course.slug, progress);

  // Determine current active module to continue
  const firstUnfinishedModule =
    modules.find((m) => !progress.completedModuleIds.includes(m.id)) || modules[0];

  const getModuleStatus = (module: CourseModule): ModuleStatus => {
    if (progress.completedModuleIds.includes(module.id)) {
      return "completed";
    }
    // Check if any lesson belonging specifically to this module was completed
    const hasStarted = progress.completedLessonIds.some((id) => id.startsWith(`${module.id}-`));
    if (hasStarted || progress.lastAccessedModuleId === module.id) {
      return "in_progress";
    }
    return "not_started";
  };

  const getCompletedLessonsForModule = (moduleId: string): number => {
    return progress.completedLessonIds.filter((id) => id.startsWith(`${moduleId}-`)).length;
  };

  if (showCertificateView) {
    return (
      <div className={styles.main}>
        <nav className={styles.breadcrumb} aria-label={isEn ? "Breadcrumb navigation" : "Percorso di navigazione"}>
          <Link href="/academy">{isEn ? "Academy" : "Accademia"}</Link>
          <span aria-hidden="true">›</span>
          <Link href="/academy/corsi">{isEn ? "Courses" : "Corsi"}</Link>
          <span aria-hidden="true">›</span>
          <Link href={`/academy/corsi/${course.slug}` as any}>{course.title}</Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page">{isEn ? "Certification" : "Diploma e Certificazione"}</span>
        </nav>
        <CourseCompletion course={course} onBackToCourse={() => setShowCertificateView(false)} />
      </div>
    );
  }

  return (
    <div className={styles.main}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label={isEn ? "Breadcrumb navigation" : "Percorso di navigazione"}>
        <Link href="/academy">{isEn ? "Academy" : "Accademia"}</Link>
        <span aria-hidden="true">›</span>
        <Link href="/academy/corsi">{isEn ? "Courses" : "Corsi"}</Link>
        <span aria-hidden="true">›</span>
        <Link href={`/academy/corsi/${course.slug}` as any}>{course.title}</Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">{isEn ? "Learning Path" : "Percorso Didattico"}</span>
      </nav>

      {/* Course Header */}
      <div className={styles.courseHeader}>
        <span className={styles.courseBadge}>{course.badgeText}</span>
        <h1 className={styles.courseTitle}>{course.title}</h1>
        <p className={styles.courseSubtitle}>{course.subtitle}</p>
      </div>

      {/* LMS Navigation Bar / Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.75em",
          marginBottom: "1.75em",
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "0.5em",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("modules")}
          className={styles.overviewAction}
          style={
            activeTab === "modules"
              ? { background: "#0066ff" }
              : { background: "#ffffff", color: "#475569", border: "1px solid #cbd5e1", boxShadow: "none" }
          }
        >
          📚 {isEn ? `Course Modules (${modules.length})` : `Moduli del Corso (${modules.length})`}
        </button>

        {course.hasPractical && (
          <button
            type="button"
            onClick={() => setActiveTab("practical")}
            className={styles.overviewAction}
            style={
              activeTab === "practical"
                ? { background: "#0066ff" }
                : { background: "#ffffff", color: "#475569", border: "1px solid #cbd5e1", boxShadow: "none" }
            }
          >
            {course.slug === "personal-trainer-3"
              ? isEn
                ? "📁 Advanced Resources & Case Studies"
                : "📁 Risorse Avanzate & Casi Studio"
              : isEn
              ? "🏋️ Practical Resources"
              : "🏋️ Modulo Pratico & Risorse"}
          </button>
        )}

        {(course.hasProjectWork || course.hasPracticalSubmission) && (
          <button
            type="button"
            onClick={() => setActiveTab("assignment")}
            className={styles.overviewAction}
            style={
              activeTab === "assignment"
                ? { background: "#0066ff" }
                : { background: "#ffffff", color: "#475569", border: "1px solid #cbd5e1", boxShadow: "none" }
            }
          >
            {course.hasProjectWork
              ? isEn
                ? "📊 Final Project Work"
                : "📊 Project Work Finale"
              : isEn
              ? "📹 Practical Video Verification"
              : "📹 Verifica Pratica Video"}
            {progress.assignmentStatus === "approved" && " ✓"}
          </button>
        )}

        {course.hasExam && (
          <button
            type="button"
            onClick={() => setActiveTab("exam")}
            className={styles.overviewAction}
            style={
              activeTab === "exam"
                ? { background: "#0066ff" }
                : { background: "#ffffff", color: "#475569", border: "1px solid #cbd5e1", boxShadow: "none" }
            }
          >
            📝 {isEn ? "Final Exam (30 Questions)" : "Esame Finale (30 Domande)"}
            {!isExamUnlocked && " 🔒"}
            {progress.examPassed && " ✓"}
          </button>
        )}
      </div>

      {/* Main Tab: Modules View */}
      {activeTab === "modules" && (
        <>
          {/* Achievement Banner if 100% finished */}
          {isCompleted && (
            <div
              style={{
                background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
                border: "1px solid #6ee7b7",
                borderRadius: "0.85em",
                padding: "1.25em 1.5em",
                marginBottom: "1.5em",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1em",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75em" }}>
                <span style={{ fontSize: "2rem" }}>🏆</span>
                <div>
                  <h3 style={{ margin: "0 0 0.15em", color: "#065f46", fontSize: "1.1rem", fontWeight: 800 }}>
                    {isEn ? "Course Fully Completed!" : "Corso Completato con Successo!"}
                  </h3>
                  <p style={{ margin: 0, color: "#047857", fontSize: "0.85rem" }}>
                    {isEn
                      ? "You have satisfied all modules and exam requirements. Your official diploma is ready."
                      : "Hai completato con successo tutti i moduli e l'esame abilitante. Il tuo diploma tecnico è pronto."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCertificateView(true)}
                className={styles.overviewAction}
                style={{ background: "#059669", boxShadow: "0 3px 10px rgba(5, 150, 105, 0.25)" }}
              >
                <span>{isEn ? "View Certificate & Diploma" : "Visualizza Diploma & Certificato"}</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          )}

          {/* Progress Overview Card */}
          <div className={styles.overviewCard}>
            <div className={styles.overviewTop}>
              <div className={styles.progressStats}>
                <span className={styles.progressLabel}>{isEn ? "Your Progress" : "Il Tuo Progresso"}</span>
                <span className={styles.progressValue}>
                  {percent}% {isEn ? "Completed" : "Completato"}
                </span>
              </div>
              <Link
                href={`/academy/corsi/${course.slug}/learn/${firstUnfinishedModule.id}` as any}
                className={styles.overviewAction}
              >
                <span>{isEn ? (percent > 0 ? "Continue Course" : "Start Course") : (percent > 0 ? "Continua Corso" : "Inizia Corso")}</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
            <ProgressBar
              percent={percent}
              completedLessons={completedLessonsCount}
              totalLessons={totalLessonsCount}
            />
          </div>

          {/* Module Cards Grid */}
          <h2 className={styles.sectionTitle}>
            <span>{isEn ? "Structured Learning Path" : "Percorso Didattico Strutturato"}</span>
          </h2>
          <div className={styles.modulesGrid}>
            {modules.map((m) => (
              <ModuleCard
                key={m.id}
                module={m}
                status={getModuleStatus(m)}
                completedLessonsCount={getCompletedLessonsForModule(m.id)}
                courseSlug={course.slug}
              />
            ))}
          </div>

          {/* Capstone / Practical Submission Teaser Card */}
          {(course.hasProjectWork || course.hasPracticalSubmission) && (
            <div className={styles.specialCard} style={{ borderColor: "#cbd5e1", background: "#f8fafc" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5em" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#0284c7", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {course.hasProjectWork
                      ? isEn
                        ? "CAPSTONE PROJECT WORK"
                        : "PROJECT WORK DI FINE CORSO"
                      : isEn
                      ? "PRACTICAL VIDEO VERIFICATION"
                      : "VERIFICA PRATICA SKILL"}
                  </span>
                  <h3 className={styles.specialCardTitle}>
                    {course.hasProjectWork
                      ? isEn
                        ? "Project Work: Annual Programming Thesis"
                        : "Project Work: Elaborato Tecnico Annuale"
                      : isEn
                      ? "Video Assessment: Muscle-Up & Calisthenics Skills"
                      : "Valutazione Video: Muscle-Up e Skill Calisthenics"}
                  </h3>
                </div>
                <span
                  style={{
                    background:
                      progress.assignmentStatus === "approved"
                        ? "#ecfdf5"
                        : progress.assignmentStatus === "submitted"
                        ? "#eff6ff"
                        : "#f1f5f9",
                    color:
                      progress.assignmentStatus === "approved"
                        ? "#065f46"
                        : progress.assignmentStatus === "submitted"
                        ? "#1e40af"
                        : "#475569",
                    padding: "0.3em 0.8em",
                    borderRadius: "9999px",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                  }}
                >
                  {progress.assignmentStatus === "approved"
                    ? isEn
                      ? "✓ APPROVED"
                      : "✓ APPROVATO"
                    : progress.assignmentStatus === "submitted"
                    ? isEn
                      ? "⏳ UNDER REVIEW"
                      : "⏳ IN REVISIONE"
                    : isEn
                    ? "PENDING SUBMISSION"
                    : "DA PRESENTARE"}
                </span>
              </div>
              <p className={styles.specialCardDesc}>
                {course.hasProjectWork
                  ? isEn
                    ? "Submit your comprehensive periodization proposal for commission evaluation as mandated by the Senior Trainer curriculum."
                    : "Presenta l'elaborato di pianificazione annuale per la valutazione della commissione tecnica."
                  : isEn
                  ? "Upload an unedited video demonstrating strict form in Muscle-Up and foundational calisthenics progressions."
                    : "Carica il video dimostrativo senza tagli per la verifica tecnica delle progressioni e del Muscle-Up."}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("assignment")}
                className={styles.specialCardAction}
                style={{ background: "#0284c7" }}
              >
                <span>{isEn ? "Go to Submission Portal" : "Accedi all'Area Consegna"}</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          )}

          {/* Final Exam Card at end of module list */}
          {exam && (
            <div className={styles.specialCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5em" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {isEn ? "FINAL QUALIFICATION EXAM" : "PROVA FINALE ABILITANTE"}
                  </span>
                  <h3 className={styles.specialCardTitle}>{exam.title}</h3>
                </div>
                {progress.examPassed ? (
                  <span style={{ background: "#ecfdf5", color: "#065f46", padding: "0.3em 0.8em", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 800 }}>
                    {isEn ? `✓ PASSED (${progress.examScore}%)` : `✓ SUPERATO (${progress.examScore}%)`}
                  </span>
                ) : !isExamUnlocked ? (
                  <span style={{ background: "#fef3c7", color: "#92400e", padding: "0.3em 0.8em", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 800 }}>
                    🔒 {isEn ? "LOCKED (Complete All Modules)" : "BLOCCATO (Completa Tutti i Moduli)"}
                  </span>
                ) : null}
              </div>
              <p className={styles.specialCardDesc}>{exam.description}</p>
              <button
                type="button"
                onClick={() => setActiveTab("exam")}
                className={styles.specialCardAction}
              >
                <span>
                  {progress.examPassed
                    ? isEn
                      ? "Review Exam"
                      : "Rivedi Esame"
                    : !isExamUnlocked
                    ? isEn
                      ? "Exam Locked (View Details)"
                      : "Esame Bloccato (Vedi Dettagli)"
                    : isEn
                      ? "Start Final Exam"
                      : "Accedi all'Esame Finale"}
                </span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* Tab: Practical Resources */}
      {activeTab === "practical" && (
        <div>
          <div style={{ marginBottom: "1.5em", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setActiveTab("modules")}
              className={styles.overviewAction}
              style={{ background: "#ffffff", color: "#475569", border: "1px solid #cbd5e1" }}
            >
              ← {isEn ? "Back to Modules" : "Torna ai Moduli"}
            </button>
          </div>
          {course.slug === "personal-trainer-3" ? (
            <PT3ResourcesView />
          ) : (
            <PracticalResources courseSlug={course.slug} />
          )}
        </div>
      )}

      {/* Tab: Capstone / Assignment */}
      {activeTab === "assignment" && (
        <div>
          <div style={{ marginBottom: "1.5em", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setActiveTab("modules")}
              className={styles.overviewAction}
              style={{ background: "#ffffff", color: "#475569", border: "1px solid #cbd5e1" }}
            >
              ← {isEn ? "Back to Modules" : "Torna ai Moduli"}
            </button>
          </div>
          <AssignmentView
            courseSlug={course.slug}
            onSubmissionUpdated={() => setProgress(loadUserProgress(course.slug))}
          />
        </div>
      )}

      {/* Tab: Final Exam */}
      {activeTab === "exam" && (
        <div>
          <div style={{ marginBottom: "1.5em", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setActiveTab("modules")}
              className={styles.overviewAction}
              style={{ background: "#ffffff", color: "#475569", border: "1px solid #cbd5e1" }}
            >
              ← {isEn ? "Back to Modules" : "Torna ai Moduli"}
            </button>
          </div>
          {exam ? (
            <ExamPlaceholder
              exam={exam}
              courseSlug={course.slug}
              isLocked={!isExamUnlocked}
              onExamPassed={() => setProgress(loadUserProgress(course.slug))}
            />
          ) : (
            <div className={styles.overviewCard} style={{ textAlign: "center", padding: "3em" }}>
              <p style={{ color: "#64748b", margin: 0 }}>
                {isEn ? "No final exam available for this course." : "Nessun esame finale disponibile per questo corso."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
