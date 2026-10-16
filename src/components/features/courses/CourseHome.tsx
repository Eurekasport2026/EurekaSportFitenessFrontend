"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import type { Course, CourseModule, PublicCourseExam, LessonReference } from "@/lib/api/types";
import { calculateCourseProgress } from "@/lib/api/progress";
import { useCourseProgress } from "@/hooks/use-course-progress";
import { useAuth } from "@/components/features/training-app/AuthProvider";
import { useLearningService } from "@/hooks/use-portal-request";
import { portalMessage } from "@/lib/api/portal";
import { toast } from "sonner";
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
  lessons: LessonReference[];
  exam?: PublicCourseExam;
  initialTab?: string;
  isCompletedQuery?: boolean;
}

type TabType = "modules" | "practical" | "assignment" | "exam";

export function CourseHome({
  course,
  modules,
  lessons,
  exam,
  initialTab,
}: CourseHomeProps) {
  const learningService = useLearningService();
  const locale = useLocale() || "it";
  const isEn = locale === "en";

  const { progress, setProgress, reload: reloadProgress, error: progressError } = useCourseProgress(course.slug);
  const { status } = useAuth();
  const [enrolling, setEnrolling] = useState(false);
  const [legacyLessons, setLegacyLessons] = useState<string[] | null>(null);
  useEffect(() => {
    setLegacyLessons(null);
    try {
      const raw = localStorage.getItem(`eureka_course_progress_v2_${course.slug}`);
      const old = raw ? JSON.parse(raw) : null;
      if (old && Array.isArray(old.completedLessonIds)) setLegacyLessons(old.completedLessonIds.filter((id: unknown): id is string => typeof id === "string"));
    } catch { /* Keep unidentified legacy records untouched. */ }
  }, [course.slug]);
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
    setShowCertificateView(false);
    if (!initialTab) {
      setActiveTab("modules");
    }
  }, [course.slug, initialTab]);

  const {
    percent,
    completedLessonsCount,
    totalLessonsCount,
    completedModuleIds,
    isExamUnlocked,
    isCompleted,
  } = calculateCourseProgress(course, progress, modules, lessons);

  // Determine current active module to continue
  const firstUnfinishedModule =
    modules.find((m) => !completedModuleIds.includes(m.id)) || modules[0];

  const getModuleStatus = (module: CourseModule): ModuleStatus => {
    if (completedModuleIds.includes(module.id)) {
      return "completed";
    }
    // Check if any lesson belonging specifically to this module was completed
    const hasStarted = lessons.some((lesson) => lesson.moduleId === module.id &&
      progress.completedLessonIds.includes(lesson.id));
    if (hasStarted || progress.lastAccessedModuleId === module.id) {
      return "in_progress";
    }
    return "not_started";
  };

  const getCompletedLessonsForModule = (moduleId: string): number => {
    return lessons.filter((lesson) => lesson.moduleId === moduleId &&
      progress.completedLessonIds.includes(lesson.id)).length;
  };

  if (showCertificateView) {
    return (
      <div className={styles.main}>
        <nav className={styles.breadcrumb} aria-label={isEn ? "Breadcrumb navigation" : "Percorso di navigazione"}>
          <Link href="/academy">{isEn ? "Academy" : "Accademia"}</Link>
          <span aria-hidden="true">›</span>
          <Link href="/academy/corsi">{isEn ? "Courses" : "Corsi"}</Link>
          <span aria-hidden="true">›</span>
          <Link href={{ pathname: "/academy/corsi/[slug]", params: { slug: course.slug } }}>{course.title}</Link>
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
        <Link href={{ pathname: "/academy/corsi/[slug]", params: { slug: course.slug } }}>{course.title}</Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">{isEn ? "Learning Path" : "Percorso Didattico"}</span>
      </nav>

      {/* Course Header */}
      {status === "authenticated" && legacyLessons && legacyLessons.length > 0 && <div className={styles.courseHeader}><p>{isEn ? "Saved lesson checkmarks on this device have no account owner. Import them only if they are yours." : "Le lezioni salvate su questo dispositivo non sono associate a un account. Importale solo se sono tue."}</p><button type="button" className={styles.overviewAction} disabled={enrolling} onClick={async () => {
        setEnrolling(true);
        try { setProgress(await learningService.importLessons(course.slug, legacyLessons)); setLegacyLessons(null); toast.success(isEn ? "Lesson checkmarks imported." : "Lezioni importate.", { id: "academy-import" }); }
        catch (error) { toast.error(portalMessage(error, isEn), { id: "academy-import" }); }
        finally { setEnrolling(false); }
      }}>{isEn ? "Import my lesson checkmarks" : "Importa le mie lezioni"}</button></div>}
      {progressError != null && <div className={styles.courseHeader}><p>{portalMessage(progressError, isEn)}</p><button type="button" className={styles.overviewAction} onClick={reloadProgress}>{isEn ? "Retry progress" : "Riprova progresso"}</button></div>}
      {status === "anonymous" && <Link href="/training/app/login">{isEn ? "Sign in to save your learning progress" : "Accedi per salvare il tuo progresso"}</Link>}
      {status === "authenticated" && !progress.enrolled && <button type="button" className={styles.overviewAction} disabled={enrolling} onClick={async () => {
        setEnrolling(true);
        try { setProgress(await learningService.enroll(course.slug)); toast.success(isEn ? "Learning progress enabled." : "Progresso didattico attivato.", { id: "academy-enroll" }); }
        catch (error) { toast.error(portalMessage(error, isEn), { id: "academy-enroll" }); }
        finally { setEnrolling(false); }
      }}>{isEn ? "Start tracking this course" : "Attiva il progresso di questo corso"}</button>}
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
            📝 {exam
              ? (isEn ? `Final Exam (${exam.questionsCount || exam.questions.length} Questions)` : `Esame Finale (${exam.questionsCount || exam.questions.length} Domande)`)
              : (isEn ? "Final Exam" : "Esame Finale")}
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
              {firstUnfinishedModule && (
                <Link
                  href={{ pathname: "/academy/corsi/[slug]/learn/[moduleId]", params: { slug: course.slug, moduleId: firstUnfinishedModule.id } }}
                  className={styles.overviewAction}
                >
                  <span>{isEn ? (percent > 0 ? "Continue Course" : "Start Course") : (percent > 0 ? "Continua Corso" : "Inizia Corso")}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              )}
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
            {modules.length === 0 && (
              <p className={styles.courseSubtitle} role="status">
                {isEn ? "No modules have been published for this course yet." : "Non sono ancora stati pubblicati moduli per questo corso."}
              </p>
            )}
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
            onSubmissionUpdated={reloadProgress}
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
              onExamPassed={reloadProgress}
            />
          ) : (
            <div className={styles.overviewCard} style={{ textAlign: "center", padding: "3em" }}>
              <p style={{ color: "#64748b", margin: 0 }}>
                {isEn
                  ? "The final exam for this course is currently in preparation."
                  : "L'esame finale per questo corso è attualmente in fase di preparazione."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
