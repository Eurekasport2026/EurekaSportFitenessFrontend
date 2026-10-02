"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import type { Course, CourseModule, CourseExam, UserCourseProgress } from "@/lib/api/types";
import { loadUserProgress, calculateCourseProgress } from "@/lib/api/progress";
import { ProgressBar } from "./ProgressBar";
import { ModuleCard } from "./ModuleCard";
import { PracticalResources } from "./PracticalResources";
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

export function CourseHome({
  course,
  modules,
  exam,
  initialTab,
  isCompletedQuery = false,
}: CourseHomeProps) {
  const locale = useLocale() || "it";
  const isEn = locale === "en";

  const [progress, setProgress] = useState<UserCourseProgress>(() => loadUserProgress(course.slug));
  const [activeTab, setActiveTab] = useState<"modules" | "practical" | "exam">(
    initialTab === "exam" ? "exam" : initialTab === "practical" ? "practical" : "modules"
  );

  useEffect(() => {
    setProgress(loadUserProgress(course.slug));
  }, [course.slug]);

  const { percent, completedLessonsCount, totalLessonsCount, isCompleted } = calculateCourseProgress(
    course.slug,
    progress
  );

  // Determine current active module to continue
  const firstUnfinishedModule =
    modules.find((m) => !progress.completedModuleIds.includes(m.id)) || modules[0];

  const getModuleStatus = (module: CourseModule): ModuleStatus => {
    if (progress.completedModuleIds.includes(module.id)) {
      return "completed";
    }
    // Check if any lesson in module was completed
    const hasStarted = progress.completedLessonIds.some((id) => id.startsWith(module.id));
    if (hasStarted || progress.lastAccessedModuleId === module.id) {
      return "in_progress";
    }
    return "not_started";
  };

  const getCompletedLessonsForModule = (moduleId: string): number => {
    return progress.completedLessonIds.filter((id) => id.startsWith(moduleId)).length;
  };

  if (isCompletedQuery || isCompleted) {
    return (
      <div className={styles.main}>
        <nav className={styles.breadcrumb} aria-label={isEn ? "Breadcrumb navigation" : "Percorso di navigazione"}>
          <Link href="/academy">{isEn ? "Academy" : "Accademia"}</Link>
          <span aria-hidden="true">›</span>
          <Link href="/academy/corsi">{isEn ? "Courses" : "Corsi"}</Link>
          <span aria-hidden="true">›</span>
          <Link href={`/academy/corsi/${course.slug}` as any}>{course.title}</Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page">{isEn ? "Completion" : "Completamento"}</span>
        </nav>
        <CourseCompletion course={course} />
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
      <div style={{ display: "flex", gap: "0.75em", marginBottom: "1.75em", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.5em" }}>
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
            🏋️ {isEn ? "Practical Resources" : "Modulo Pratico & Risorse"}
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
          </button>
        )}
      </div>

      {/* Main Tab: Modules View */}
      {activeTab === "modules" && (
        <>
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

          {/* Special Final Exam Card at end of module list */}
          {exam && (
            <div className={styles.specialCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5em" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {isEn ? "FINAL QUALIFICATION EXAM" : "PROVA FINALE ABILITANTE"}
                  </span>
                  <h3 className={styles.specialCardTitle}>{exam.title}</h3>
                </div>
                {progress.examPassed && (
                  <span style={{ background: "#ecfdf5", color: "#065f46", padding: "0.3em 0.8em", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 800 }}>
                    {isEn ? `✓ PASSED (${progress.examScore}%)` : `✓ SUPERATO (${progress.examScore}%)`}
                  </span>
                )}
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
      {activeTab === "practical" && <PracticalResources courseSlug={course.slug} />}

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
            <ExamPlaceholder exam={exam} courseSlug={course.slug} />
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
