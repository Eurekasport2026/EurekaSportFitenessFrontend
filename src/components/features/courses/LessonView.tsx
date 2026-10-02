"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import type { Course, CourseModule, Lesson } from "@/lib/api/types";
import { toggleLessonCompletion, loadUserProgress } from "@/lib/api/progress";
import { ProgressBar } from "./ProgressBar";
import { LessonNav } from "./LessonNav";
import { PracticalResources } from "./PracticalResources";
import styles from "./lesson-view.module.css";

interface LessonViewProps {
  course: Course;
  module: CourseModule;
  lessons: Lesson[];
  initialLessonId?: string;
  prevLesson?: Lesson;
  nextLesson?: Lesson;
}

export function LessonView({
  course,
  module,
  lessons,
  initialLessonId,
  prevLesson,
  nextLesson,
}: LessonViewProps) {
  const locale = useLocale() || "it";
  const isEn = locale === "en";

  const activeLesson =
    lessons.find((l) => l.id === initialLessonId) || lessons[0] || null;

  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(() => {
    return loadUserProgress(course.slug).completedLessonIds;
  });

  const isCurrentLessonComplete = activeLesson
    ? completedLessonIds.includes(activeLesson.id)
    : false;

  const handleToggleComplete = () => {
    if (!activeLesson) return;
    const updated = toggleLessonCompletion(course.slug, module.id, activeLesson.id);
    setCompletedLessonIds(updated.completedLessonIds);
  };

  const completedInModule = lessons.filter((l) => completedLessonIds.includes(l.id)).length;
  const modulePercent = lessons.length > 0 ? Math.round((completedInModule / lessons.length) * 100) : 0;

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
        <Link href={`/academy/corsi/${course.slug}/learn` as any}>{isEn ? "Modules" : "Moduli"}</Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">{isEn ? `Module ${module.number}` : `Modulo ${module.number}`}</span>
      </nav>

      {/* Module Title & Progress Bar Header */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0.75em", padding: "1.25em 1.5em", marginBottom: "1.75em", boxShadow: "0 2px 6px rgba(18, 51, 74, 0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1em", marginBottom: "0.75em" }}>
          <div>
            <div className={styles.moduleBadge}>
              {module.isPractical
                ? isEn ? "PRACTICAL MODULE" : "MODULO PRATICO"
                : `${isEn ? "MODULE" : "MODULO"} ${String(module.number).padStart(2, "0")}`}
            </div>
            <h1 style={{ margin: "0 0 0.25em", fontSize: "1.45rem", fontWeight: 800, color: "#0d2345" }}>
              {module.title}
            </h1>
            {module.subtitle && <p style={{ margin: 0, fontSize: "0.85rem", color: "#52667b" }}>{module.subtitle}</p>}
          </div>

          <div style={{ minWidth: "14em" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "0.3em" }}>
              <span>{isEn ? "Module Progress" : "Progresso Modulo"}</span>
              <span>
                {isEn
                  ? `${completedInModule} of ${lessons.length} completed`
                  : `${completedInModule} di ${lessons.length} completate`}
              </span>
            </div>
            <ProgressBar percent={modulePercent} showMeta={false} />
          </div>
        </div>

        {/* Lesson Navigation Tabs inside Module */}
        {!module.isPractical && lessons.length > 1 && (
          <div style={{ display: "flex", gap: "0.5em", flexWrap: "wrap", marginTop: "1em", paddingTop: "0.75em", borderTop: "1px solid #f1f5f9" }}>
            {lessons.map((l, idx) => {
              const isDone = completedLessonIds.includes(l.id);
              const isSelected = activeLesson?.id === l.id;
              return (
                <Link
                  key={l.id}
                  href={`/academy/corsi/${course.slug}/learn/${module.id}?lesson=${l.id}` as any}
                  style={{
                    padding: "0.45em 0.85em",
                    borderRadius: "0.45em",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    textDecoration: "none",
                    border: isSelected ? "1px solid #0066ff" : "1px solid #cbd5e1",
                    background: isSelected ? "#0066ff" : isDone ? "#ecfdf5" : "#ffffff",
                    color: isSelected ? "#ffffff" : isDone ? "#065f46" : "#475569",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35em",
                  }}
                >
                  {isDone && <span aria-hidden="true">✓</span>}
                  <span>{isEn ? `Lesson ${idx + 1}` : `Lezione ${idx + 1}`}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* If this is the practical module, render the Practical Resources */}
      {module.isPractical ? (
        <PracticalResources courseSlug={course.slug} />
      ) : activeLesson ? (
        <>
          {/* Active Lesson Header */}
          <div className={styles.lessonTop}>
            <div>
              <h2 className={styles.lessonTitle}>{activeLesson.title}</h2>
              <p className={styles.lessonSubtitle}>{activeLesson.description}</p>
            </div>
          </div>

          {/* Video Player */}
          <div className={styles.videoContainer}>
            {isPlayingVideo && activeLesson.videoUrl ? (
              <iframe
                src={`${activeLesson.videoUrl}?autoplay=1`}
                title={activeLesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className={styles.videoIframe}
              />
            ) : (
              <div className={styles.videoPlaceholder}>
                <button
                  type="button"
                  onClick={() => setIsPlayingVideo(true)}
                  className={styles.playButton}
                  aria-label={isEn ? "Play video lesson" : "Riproduci video lezione"}
                >
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
                <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                  {isEn ? "Watch video lesson" : "Guarda la video lezione"}
                </div>
                <div className={styles.videoDuration}>
                  {isEn ? "Duration:" : "Durata:"} {activeLesson.videoDuration || "20:00"}
                </div>
              </div>
            )}
          </div>

          {/* Action Bar (Completion Toggle + Duration) */}
          <div className={styles.actionBar}>
            <div className={styles.lessonMeta}>
              <span>⏱ {isEn ? "Duration:" : "Durata:"} <strong>{activeLesson.durationMinutes} min</strong></span>
              <span>📚 {isEn ? `Module ${module.number} of ${course.modulesCount}` : `Modulo ${module.number} di ${course.modulesCount}`}</span>
            </div>

            <button
              type="button"
              onClick={handleToggleComplete}
              className={`${styles.completeButton} ${isCurrentLessonComplete ? styles.completeButtonActive : ""}`}
            >
              {isCurrentLessonComplete ? (
                <>
                  <span aria-hidden="true">✓</span> {isEn ? "Lesson Completed" : "Lezione Completata"}
                </>
              ) : (
                <>
                  <span aria-hidden="true">○</span> {isEn ? "Mark as Completed" : "Segna come Completata"}
                </>
              )}
            </button>
          </div>

          {/* PDF Study Material Section */}
          <div className={styles.contentSection}>
            <h3 className={styles.contentTitle}>
              <span aria-hidden="true">📖</span> {isEn ? "Study Material & PDF Handout" : "Materiale di Studio & Dispensa PDF"}
            </h3>
            <div className={styles.pdfBox}>
              <div className={styles.pdfInfo}>
                <div className={styles.pdfIcon}>PDF</div>
                <div>
                  <div className={styles.pdfTitle}>{activeLesson.pdfTitle || (isEn ? "Official Study Guide.pdf" : "Dispensa di Studio Ufficiale.pdf")}</div>
                  <div className={styles.pdfSize}>{isEn ? "Study Document" : "Documento didattico"} • {activeLesson.pdfSize || "2.5 MB"}</div>
                </div>
              </div>

              <div className={styles.pdfActions}>
                <a
                  href={activeLesson.pdfUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.btnSecondary}
                >
                  👁 {isEn ? "Open PDF Online" : "Apri PDF Online"}
                </a>
                {activeLesson.allowsDownload && (
                  <a
                    href={activeLesson.pdfUrl || "#"}
                    download
                    className={styles.btnPrimary}
                  >
                    ⇩ {isEn ? "Download PDF" : "Scarica PDF"}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Lesson Summary & Key Takeaways */}
          <div className={styles.contentSection}>
            <h3 className={styles.contentTitle}>
              <span aria-hidden="true">💡</span> {isEn ? "Summary & Key Takeaways" : "Sintesi e Punti Chiave"}
            </h3>
            <p className={styles.contentBody}>{activeLesson.summary}</p>
            <ul className={styles.takeawaysList}>
              {activeLesson.keyTakeaways.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>

          {/* Exercise Details Card (if available for this lesson) */}
          {activeLesson.exerciseDetail && (
            <article className={styles.exerciseCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5em", marginBottom: "0.75em" }}>
                <div>
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#0066ff", textTransform: "uppercase" }}>
                    {isEn ? "EXERCISE TECHNICAL SPECIFICATION" : "SCHEDA TECNICA ESERCIZIO"}
                  </span>
                  <h3 style={{ margin: "0.2em 0 0", fontSize: "1.25rem", fontWeight: 800, color: "#0d2345" }}>
                    Target: {activeLesson.exerciseDetail.targetMuscle}
                  </h3>
                </div>
                <div className={styles.exerciseBadges}>
                  <span className={styles.pillBadge} style={{ background: "#e0f2fe", color: "#0369a1" }}>
                    {activeLesson.exerciseDetail.equipment}
                  </span>
                  <span className={styles.pillBadge} style={{ background: "#fef3c7", color: "#92400e" }}>
                    {activeLesson.exerciseDetail.difficulty}
                  </span>
                  <span className={styles.pillBadge} style={{ background: "#ecfdf5", color: "#065f46" }}>
                    {activeLesson.exerciseDetail.movementType}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "1.5em", flexWrap: "wrap", fontSize: "0.82rem", color: "#52667b", marginBottom: "1.25em", paddingBottom: "0.75em", borderBottom: "1px solid #f1f5f9" }}>
                <div>
                  <strong style={{ color: "#0d2345" }}>{isEn ? "Primary Muscles:" : "Muscoli Primari:"}</strong>{" "}
                  {activeLesson.exerciseDetail.primaryMuscles.join(", ")}
                </div>
                <div>
                  <strong style={{ color: "#0d2345" }}>{isEn ? "Secondary Muscles:" : "Muscoli Secondari:"}</strong>{" "}
                  {activeLesson.exerciseDetail.secondaryMuscles.join(", ")}
                </div>
              </div>

              <div className={styles.exerciseGrid}>
                <div className={styles.exerciseCol}>
                  <h4>{isEn ? "Setup & Positioning" : "Setup & Posizionamento"}</h4>
                  <p>{activeLesson.exerciseDetail.setup}</p>
                </div>
                <div className={styles.exerciseCol}>
                  <h4>{isEn ? "Correct Execution" : "Esecuzione Corretta"}</h4>
                  <p>{activeLesson.exerciseDetail.execution}</p>
                </div>
                <div className={styles.exerciseCol}>
                  <h4>{isEn ? "Key Safety Points" : "Punti Chiave di Sicurezza"}</h4>
                  <ul style={{ margin: "0.3em 0 0", paddingLeft: "1.2em", fontSize: "0.82rem", color: "#475569" }}>
                    {activeLesson.exerciseDetail.safetyPoints.map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                </div>
                <div className={styles.exerciseCol}>
                  <h4>{isEn ? "Common Mistakes to Avoid" : "Errori Comuni da Evitare"}</h4>
                  <ul style={{ margin: "0.3em 0 0", paddingLeft: "1.2em", fontSize: "0.82rem", color: "#b91c1c" }}>
                    {activeLesson.exerciseDetail.commonMistakes.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          )}

          {/* Lesson Navigation Footer */}
          <LessonNav
            prevLesson={prevLesson}
            nextLesson={nextLesson}
            courseSlug={course.slug}
            moduleId={module.id}
          />
        </>
      ) : (
        <div className={styles.contentSection} style={{ textAlign: "center", padding: "3em" }}>
          <p>{isEn ? "No lessons available for this module." : "Nessuna lezione disponibile per questo modulo."}</p>
          <Link href={`/academy/corsi/${course.slug}/learn` as any} className={styles.btnPrimary}>
            {isEn ? "Return to Module List" : "Torna all'Elenco Moduli"}
          </Link>
        </div>
      )}
    </div>
  );
}
