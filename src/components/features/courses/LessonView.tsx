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
              <div style={{ display: "flex", gap: "0.5em", alignItems: "center", flexWrap: "wrap", marginBottom: "0.45em" }}>
                {activeLesson.rapidCode && (
                  <span
                    style={{
                      background: "#0066ff",
                      color: "#ffffff",
                      padding: "0.25em 0.65em",
                      borderRadius: "0.35em",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      letterSpacing: "0.05em",
                    }}
                  >
                    {activeLesson.rapidCode}
                  </span>
                )}
                {activeLesson.progressionStep && (
                  <span
                    style={{
                      background: "#ecfdf5",
                      color: "#065f46",
                      border: "1px solid #a7f3d0",
                      padding: "0.2em 0.6em",
                      borderRadius: "0.35em",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                    }}
                  >
                    {isEn ? `Step ${activeLesson.progressionStep}` : `Passo ${activeLesson.progressionStep}`}
                  </span>
                )}
                {activeLesson.programCode && (
                  <span
                    style={{
                      background: "#f1f5f9",
                      color: "#475569",
                      padding: "0.2em 0.55em",
                      borderRadius: "0.35em",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                    }}
                  >
                    {activeLesson.programCode}
                  </span>
                )}
                {activeLesson.phase && (
                  <span
                    style={{
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      padding: "0.2em 0.55em",
                      borderRadius: "0.35em",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                    }}
                  >
                    {activeLesson.phase}
                  </span>
                )}
              </div>
              <h2 className={styles.lessonTitle}>{activeLesson.title}</h2>
              <p className={styles.lessonSubtitle}>{activeLesson.description}</p>
            </div>
          </div>

          {/* Video Player or In-Production Notice */}
          <div className={styles.videoContainer}>
            {isPlayingVideo && activeLesson.videoUrl && activeLesson.mediaStatus !== "in_production" ? (
              <iframe
                src={`${activeLesson.videoUrl}?autoplay=1`}
                title={activeLesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className={styles.videoIframe}
              />
            ) : activeLesson.videoUrl && activeLesson.mediaStatus !== "in_production" ? (
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
            ) : (
              <div
                style={{
                  padding: "2.5em 1.5em",
                  textAlign: "center",
                  color: "#ffffff",
                  maxWidth: "38em",
                  margin: "0 auto",
                }}
              >
                <div style={{ fontSize: "2.8rem", marginBottom: "0.3em" }}>🎬</div>
                <span
                  style={{
                    display: "inline-block",
                    padding: "0.25em 0.85em",
                    borderRadius: "9999px",
                    background: "rgba(255, 255, 255, 0.12)",
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                    color: "#f8fafc",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginBottom: "0.75em",
                  }}
                >
                  {isEn ? "Studio Video in Production" : "Video Lezione in Produzione"}
                </span>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 0.5em", color: "#ffffff" }}>
                  {isEn ? "Master Video Lesson in Technical Post-Production" : "Masterclass in Post-Produzione Tecnica"}
                </h3>
                <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.55, margin: "0 0 1.25em" }}>
                  {isEn
                    ? "The multi-camera studio demonstration is currently undergoing technical post-production according to CONI/EPS standards. Study the full syllabus, technical execution points, and key takeaways below."
                    : "La registrazione multicamera in studio è attualmente in fase di rifinitura tecnica secondo i criteri CONI/EPS. Consulta di seguito la scheda tecnica dettagliata, la sintesi e i punti chiave."}
                </p>
                <div style={{ display: "inline-flex", gap: "1em", alignItems: "center", fontSize: "0.78rem", color: "#cbd5e1" }}>
                  <span>⏱ {isEn ? "Standard Duration:" : "Durata standard:"} <strong>{activeLesson.videoDuration || `${activeLesson.durationMinutes}:00`}</strong></span>
                  <span>•</span>
                  <span>📋 {isEn ? "Syllabus Active" : "Programma Attivo"}</span>
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
                {activeLesson.pdfUrl ? (
                  <>
                    <a
                      href={activeLesson.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.btnSecondary}
                    >
                      👁 {isEn ? "Open PDF Online" : "Apri PDF Online"}
                    </a>
                    {activeLesson.allowsDownload && (
                      <a
                        href={activeLesson.pdfUrl}
                        download
                        className={styles.btnPrimary}
                      >
                        ⇩ {isEn ? "Download PDF" : "Scarica PDF"}
                      </a>
                    )}
                  </>
                ) : (
                  <span
                    style={{
                      padding: "0.5em 0.85em",
                      borderRadius: "0.45em",
                      background: "#f1f5f9",
                      color: "#64748b",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                    }}
                  >
                    📄 {isEn ? "Study Syllabus Integrated Below" : "Programma Didattico Integrato Sotto"}
                  </span>
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

          {/* Case Study Details Card (if available for this lesson) */}
          {activeLesson.caseStudyDetail && (
            <article className={styles.exerciseCard} style={{ borderLeft: "4px solid #0066ff" }}>
              <div style={{ marginBottom: "1em" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#0066ff", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {isEn ? "PRACTICAL CASE STUDY BREAKDOWN" : "ANALISI DEL CASO STUDIO APPLICATIVO"}
                </span>
                <h3 style={{ margin: "0.2em 0 0", fontSize: "1.3rem", fontWeight: 800, color: "#0d2345" }}>
                  {isEn ? "Subject Profile:" : "Profilo Soggetto:"} {activeLesson.caseStudyDetail.clientProfile}
                </h3>
              </div>

              <div className={styles.exerciseGrid}>
                <div className={styles.exerciseCol}>
                  <h4>{isEn ? "Functional & Athletic Challenge" : "Valutazione Funzionale & Sfida"}</h4>
                  <p>{activeLesson.caseStudyDetail.challenge}</p>
                </div>
                <div className={styles.exerciseCol}>
                  <h4>{isEn ? "Prescribed Strategy & Solution Rationale" : "Strategia Prescrittiva & Razionale"}</h4>
                  <p>{activeLesson.caseStudyDetail.solutionRationale}</p>
                </div>
                <div className={styles.exerciseCol} style={{ gridColumn: "1 / -1" }}>
                  <h4>{isEn ? "Documented Outcome Metrics & Adaptations" : "Risultati Documentati & Metriche"}</h4>
                  <p>{activeLesson.caseStudyDetail.outcomeMetrics}</p>
                </div>
              </div>
            </article>
          )}

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

              {/* Primary & Secondary Muscles */}
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

              {/* Progression / Regression Links if provided */}
              {(activeLesson.regressionCode || activeLesson.progressionCode) && (
                <div
                  style={{
                    display: "flex",
                    gap: "1.5em",
                    flexWrap: "wrap",
                    fontSize: "0.82rem",
                    background: "#f8fafc",
                    padding: "0.75em 1em",
                    borderRadius: "0.5em",
                    marginBottom: "1.25em",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  {activeLesson.regressionCode && (
                    <div>
                      <strong style={{ color: "#b91c1c" }}>{isEn ? "Recommended Regression:" : "Regressione Consigliata:"}</strong>{" "}
                      <span style={{ fontWeight: 800, color: "#0d2345" }}>{activeLesson.regressionCode}</span>
                    </div>
                  )}
                  {activeLesson.progressionCode && (
                    <div>
                      <strong style={{ color: "#047857" }}>{isEn ? "Next Progression:" : "Progressione Successiva:"}</strong>{" "}
                      <span style={{ fontWeight: 800, color: "#0d2345" }}>{activeLesson.progressionCode}</span>
                    </div>
                  )}
                </div>
              )}

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
