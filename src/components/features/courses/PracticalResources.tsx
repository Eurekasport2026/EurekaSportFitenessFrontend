"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { getWorkoutPlans, getMuscleGroups, getGymExercises, type GymExercise } from "@/lib/api/practical";
import styles from "./lesson-view.module.css";

interface PracticalResourcesProps {
  courseSlug: string;
}

export function PracticalResources({ courseSlug }: PracticalResourcesProps) {
  const locale = useLocale() || "it";
  const isEn = locale === "en";

  const workoutPlans = getWorkoutPlans(locale, courseSlug);
  const muscleGroups = getMuscleGroups(locale);
  const sampleGymExercises = getGymExercises(locale);

  const [activeTab, setActiveTab] = useState<"plans" | "library">("plans");
  const [selectedMuscle, setSelectedMuscle] = useState<string>("chest");
  const [equipmentFilter, setEquipmentFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [movementFilter, setMovementFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedExerciseForModal, setSelectedExerciseForModal] = useState<GymExercise | null>(null);
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<any | null>(null);

  const exercisesSectionRef = useRef<HTMLDivElement>(null);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedExerciseForModal(null);
        setSelectedPlanForModal(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const getExerciseCountForMuscle = (muscleId: string, muscleName: string) => {
    return sampleGymExercises.filter((ex) =>
      ex.muscleGroupId === muscleId ||
      ex.secondaryMuscles.some((m) => m.toLowerCase().includes(muscleName.toLowerCase()))
    ).length;
  };

  const handleSelectMuscle = (muscleId: string) => {
    setSelectedMuscle(muscleId);
    setTimeout(() => {
      if (exercisesSectionRef.current) {
        const yOffset = -90;
        const y = exercisesSectionRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }, 60);
  };

  const activeMuscleObj = muscleGroups.find((m) => m.id === selectedMuscle) || muscleGroups[0];

  const equipmentEquivalents: Record<string, string[]> = {
    all: ["all"],
    Machines: ["Machines", "Macchine"],
    Macchine: ["Machines", "Macchine"],
    "Free Weights": ["Free Weights", "Pesi Liberi"],
    "Pesi Liberi": ["Free Weights", "Pesi Liberi"],
    Cables: ["Cables", "Cavi"],
    Cavi: ["Cables", "Cavi"],
    Bodyweight: ["Bodyweight", "Corpo Libero"],
    "Corpo Libero": ["Bodyweight", "Corpo Libero"],
  };

  const filteredExercises = sampleGymExercises.filter((ex) => {
    const matchesMuscle =
      ex.muscleGroupId === selectedMuscle ||
      ex.secondaryMuscles.some((m) => m.toLowerCase().includes(activeMuscleObj.name.toLowerCase()));

    const matchesEquipment =
      equipmentFilter === "all" ||
      (equipmentEquivalents[equipmentFilter]?.includes(ex.equipment) ?? ex.equipment === equipmentFilter);

    const matchesDifficulty =
      difficultyFilter === "all" ||
      ex.difficulty.toLowerCase() === difficultyFilter.toLowerCase();

    const matchesMovement =
      movementFilter === "all" ||
      ex.movementType.toLowerCase() === movementFilter.toLowerCase();

    const matchesSearch =
      searchQuery.trim() === "" ||
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.primaryMuscles.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase())) ||
      ex.secondaryMuscles.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesMuscle && matchesEquipment && matchesDifficulty && matchesMovement && matchesSearch;
  });

  return (
    <div style={{ marginTop: "1.5em" }}>
      {/* Sub-tabs: Workout Plans vs Equipment Library */}
      <div style={{ display: "flex", gap: "0.75em", flexWrap: "wrap", marginBottom: "1.5em", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.5em" }}>
        <button
          type="button"
          onClick={() => setActiveTab("plans")}
          className={styles.btnSecondary}
          style={activeTab === "plans" ? { background: "#0066ff", color: "#fff", borderColor: "#0066ff" } : {}}
        >
          📋 {isEn ? `Workout Plans (${workoutPlans.length})` : `Schede di Allenamento (${workoutPlans.length})`}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("library")}
          className={styles.btnSecondary}
          style={activeTab === "library" ? { background: "#0066ff", color: "#fff", borderColor: "#0066ff" } : {}}
        >
          🏋️ {isEn ? "Gym Equipment & Muscle Groups" : "Videoteca Attrezzature & Gruppi Muscolari"}
        </button>
      </div>

      {/* Tab 1: Workout Plans */}
      {activeTab === "plans" && (
        <div>
          <p style={{ color: "#52667b", fontSize: "0.9rem", marginBottom: "1.25em" }}>
            {isEn
              ? "Practical workout plan templates ready for client programming, with structured progressions and exercise protocols."
              : "Esempi pratici di schede di allenamento pronte all'uso per i clienti in palestra, con progressioni e linee guida dettagliate."}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))", gap: "1.25em" }}>
            {workoutPlans.map((plan) => (
              <div key={plan.id} className={styles.contentSection} style={{ marginBottom: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5em" }}>
                  <span className={styles.pillBadge} style={{ background: "#e0f2fe", color: "#0369a1" }}>
                    {plan.level}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>⏱ {plan.durationWeeks}</span>
                </div>
                <h3 style={{ margin: "0 0 0.35em", fontSize: "1.05rem", fontWeight: 700, color: "#0d2345" }}>
                  {plan.title}
                </h3>
                <p style={{ margin: "0 0 0.75em", fontSize: "0.8rem", color: "#52667b" }}>{plan.subtitle}</p>
                <p style={{ fontSize: "0.78rem", color: "#334960", lineHeight: 1.5, marginBottom: "1.25em" }}>
                  {plan.description}
                </p>
                <div style={{ display: "flex", gap: "0.5em", flexWrap: "wrap", borderTop: "1px solid #f1f5f9", paddingTop: "0.85em" }}>
                  {plan.pdfUrl ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelectedPlanForModal(plan)}
                        className={styles.btnSecondary}
                        style={{ fontSize: "0.75rem", cursor: "pointer" }}
                      >
                        👁 {isEn ? "View Online" : "Visualizza Online"}
                      </button>
                      <a
                        href={plan.pdfUrl}
                        download
                        className={styles.btnPrimary}
                        style={{ fontSize: "0.75rem", textDecoration: "none" }}
                      >
                        ⇩ {isEn ? `Download PDF (${plan.pdfSize})` : `Scarica PDF (${plan.pdfSize})`}
                      </a>
                    </>
                  ) : (
                    <span style={{ fontSize: "0.75rem", color: "#64748b", background: "#f8fafc", padding: "0.4em 0.7em", borderRadius: "4px" }}>
                      ℹ️ {isEn ? "Protocol specifications available in student portal" : "Specifiche tecniche incluse nel dossier didattico"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Muscle Group Explorer & Gym Equipment */}
      {activeTab === "library" && (
        <div>
          <p style={{ color: "#52667b", fontSize: "0.9rem", marginBottom: "1em" }}>
            {isEn
              ? "Select a muscle group to view all associated gym exercises, proper setup, biomechanical execution, and common mistakes."
              : "Seleziona un gruppo muscolare per visualizzare tutti gli esercizi associati, il setup corretto, l'esecuzione biomeccanica e gli errori da evitare."}
          </p>

          {/* Muscle Group Explorer Grid */}
          <div className={styles.muscleGroupGrid}>
            {muscleGroups.map((mg) => {
              const count = getExerciseCountForMuscle(mg.id, mg.name);
              const isSelected = selectedMuscle === mg.id;
              return (
                <button
                  key={mg.id}
                  type="button"
                  className={`${styles.muscleCard} ${isSelected ? styles.muscleCardActive : ""}`}
                  onClick={() => handleSelectMuscle(mg.id)}
                >
                  <div className={styles.muscleCardHeader}>
                    <div>
                      <h4 className={styles.muscleCardName}>{mg.name}</h4>
                      <p className={styles.muscleCardSub}>{mg.subtitle}</p>
                    </div>
                    <span className={styles.muscleCountBadge}>
                      {count} {isEn ? "Exercises" : "Esercizi"}
                    </span>
                  </div>

                  <div className={styles.muscleCardImageWrapper}>
                    <img
                      src={`/images/muscles/${mg.id}.svg`}
                      alt={mg.name}
                      loading="lazy"
                      className={styles.muscleCardImage}
                    />
                  </div>

                  <div className={styles.muscleCardAction}>
                    <span>{isEn ? "VIEW EXERCISES" : "VEDI ESERCIZI"}</span>
                    {isSelected ? (
                      <span className={styles.muscleCardActiveBadge}>
                        {isEn ? "✓ ACTIVE" : "✓ ATTIVO"}
                      </span>
                    ) : (
                      <span aria-hidden="true">→</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Muscle Group Header & Filters */}
          <div
            ref={exercisesSectionRef}
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "0.65em",
              padding: "1.25em",
              marginTop: "1.5em",
              marginBottom: "1.5em",
              scrollMarginTop: "90px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1em", marginBottom: "1em" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6em", marginBottom: "0.2em", flexWrap: "wrap" }}>
                  <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#0d2345", fontWeight: 800 }}>
                    {activeMuscleObj.name} — {isEn ? "Exercises for" : "Esercizi per"} {activeMuscleObj.subtitle}
                  </h3>
                  <span className={styles.muscleCountBadge}>
                    {filteredExercises.length} {isEn ? "available" : "disponibili"}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>{activeMuscleObj.description}</p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75em", flexWrap: "wrap" }}>
                <input
                  type="search"
                  placeholder={isEn ? "Search exercise..." : "Cerca esercizio..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ padding: "0.5em 0.85em", borderRadius: "0.45em", border: "1px solid #cbd5e1", fontSize: "0.8rem", minWidth: "13em" }}
                />
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className={styles.btnSecondary}
                  style={{ fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.4em" }}
                  title={isEn ? "Back to muscle groups" : "Torna ai gruppi muscolari"}
                >
                  ↑ {isEn ? "Muscle Groups" : "Gruppi Muscolari"}
                </button>
              </div>
            </div>

            {/* Filter by Equipment */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5em", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>
                {isEn ? "FILTER BY EQUIPMENT:" : "FILTRA PER ATTREZZO:"}
              </span>
              {(isEn
                ? [
                    { key: "all", label: "All" },
                    { key: "Machines", label: "Machines" },
                    { key: "Free Weights", label: "Free Weights" },
                    { key: "Cables", label: "Cables" },
                    { key: "Bodyweight", label: "Bodyweight" },
                  ]
                : [
                    { key: "all", label: "Tutti" },
                    { key: "Macchine", label: "Macchine" },
                    { key: "Pesi Liberi", label: "Pesi Liberi" },
                    { key: "Cavi", label: "Cavi" },
                    { key: "Corpo Libero", label: "Corpo Libero" },
                  ]
              ).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setEquipmentFilter(key)}
                  className={styles.btnSecondary}
                  style={
                    equipmentFilter === key ||
                    (equipmentFilter !== "all" && equipmentEquivalents[equipmentFilter]?.includes(key))
                      ? { background: "#0066ff", color: "#fff", borderColor: "#0066ff", fontSize: "0.72rem" }
                      : { fontSize: "0.72rem" }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Exercises List */}
          {filteredExercises.length === 0 ? (
            <div className={styles.contentSection} style={{ textAlign: "center", padding: "2.5em" }}>
              <p style={{ color: "#64748b", margin: 0 }}>
                {isEn ? "No exercises found matching the selected filters in this category." : "Nessun esercizio trovato per i filtri selezionati in questa categoria."}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25em" }}>
              {filteredExercises.map((ex) => (
                <article key={ex.id} className={styles.exerciseCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5em", marginBottom: "0.75em" }}>
                    <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#0d2345" }}>
                      {ex.name}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6em", flexWrap: "wrap" }}>
                      <div className={styles.exerciseBadges} style={{ marginBottom: 0 }}>
                        <span className={styles.pillBadge} style={{ background: "#e0f2fe", color: "#0369a1" }}>{ex.equipment}</span>
                        <span className={styles.pillBadge} style={{ background: "#fef3c7", color: "#92400e" }}>{ex.difficulty}</span>
                        <span className={styles.pillBadge} style={{ background: "#ecfdf5", color: "#065f46" }}>{ex.movementType}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedExerciseForModal(ex)}
                        className={styles.btnSecondary}
                        style={{ fontSize: "0.75rem", padding: "0.3em 0.7em", background: "#f0f7ff", borderColor: "#bfdbfe", color: "#0066ff", fontWeight: 700 }}
                      >
                        🔍 {isEn ? "Full Biomechanics" : "Dettagli Completi"}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "1.5em", flexWrap: "wrap", fontSize: "0.8rem", color: "#52667b", marginBottom: "1em", paddingBottom: "0.75em", borderBottom: "1px solid #f1f5f9" }}>
                    <div>
                      <strong style={{ color: "#0d2345" }}>{isEn ? "Primary Muscles:" : "Muscoli Primari:"}</strong> {ex.primaryMuscles.join(", ")}
                    </div>
                    <div>
                      <strong style={{ color: "#0d2345" }}>{isEn ? "Secondary Muscles:" : "Muscoli Secondari:"}</strong> {ex.secondaryMuscles.join(", ")}
                    </div>
                  </div>

                  <div className={styles.exerciseGrid}>
                    <div className={styles.exerciseCol}>
                      <h4>{isEn ? "Initial Setup" : "Setup Iniziale"}</h4>
                      <p>{ex.setup}</p>
                    </div>
                    <div className={styles.exerciseCol}>
                      <h4>{isEn ? "Correct Execution" : "Esecuzione Corretta"}</h4>
                      <p>{ex.execution}</p>
                    </div>
                    <div className={styles.exerciseCol}>
                      <h4>{isEn ? "Safety Points" : "Punti di Sicurezza"}</h4>
                      <ul style={{ margin: "0.3em 0 0", paddingLeft: "1.2em", fontSize: "0.82rem", color: "#475569" }}>
                        {ex.safetyPoints.map((pt, i) => (
                          <li key={i}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                    <div className={styles.exerciseCol}>
                      <h4>{isEn ? "Common Mistakes" : "Errori Comuni"}</h4>
                      <ul style={{ margin: "0.3em 0 0", paddingLeft: "1.2em", fontSize: "0.82rem", color: "#b91c1c" }}>
                        {ex.commonMistakes.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Modal for Exercise Deep Dive */}
          {selectedExerciseForModal && (
            <div
              className={styles.modalBackdrop}
              onClick={() => setSelectedExerciseForModal(null)}
              role="dialog"
              aria-modal="true"
            >
              <div
                className={styles.modalBox}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.modalHeader}>
                  <div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#0066ff", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {isEn ? "EXERCISE BIOMECHANICS & SETUP GUIDE" : "SCHEDA BIOMECCANICA ED ESECUZIONE"}
                    </span>
                    <h2 style={{ margin: "0.2em 0 0.4em", fontSize: "1.4rem", fontWeight: 800, color: "#0d2345" }}>
                      {selectedExerciseForModal.name}
                    </h2>
                    <div className={styles.exerciseBadges} style={{ marginBottom: 0 }}>
                      <span className={styles.pillBadge} style={{ background: "#e0f2fe", color: "#0369a1" }}>
                        🏋️ {selectedExerciseForModal.equipment}
                      </span>
                      <span className={styles.pillBadge} style={{ background: "#fef3c7", color: "#92400e" }}>
                        ⚡ {selectedExerciseForModal.difficulty}
                      </span>
                      <span className={styles.pillBadge} style={{ background: "#ecfdf5", color: "#065f46" }}>
                        🎯 {selectedExerciseForModal.movementType}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedExerciseForModal(null)}
                    className={styles.modalCloseBtn}
                    aria-label={isEn ? "Close modal" : "Chiudi finestra"}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ display: "flex", gap: "1.5em", flexWrap: "wrap", fontSize: "0.82rem", color: "#52667b", marginBottom: "1.25em", paddingBottom: "1em", borderBottom: "1px solid #f1f5f9" }}>
                  <div>
                    <strong style={{ color: "#0d2345" }}>{isEn ? "Primary Targeted Muscles:" : "Muscoli Primari Coinvolti:"}</strong>{" "}
                    <span style={{ color: "#0066ff", fontWeight: 700 }}>{selectedExerciseForModal.primaryMuscles.join(", ")}</span>
                  </div>
                  <div>
                    <strong style={{ color: "#0d2345" }}>{isEn ? "Synergists / Stabilizers:" : "Sinergici e Stabilizzatori:"}</strong>{" "}
                    <span>{selectedExerciseForModal.secondaryMuscles.join(", ")}</span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1.25em" }}>
                  <div style={{ background: "#f8fafc", padding: "1em", borderRadius: "0.5em", border: "1px solid #edf2f7" }}>
                    <h4 style={{ margin: "0 0 0.4em", fontSize: "0.85rem", fontWeight: 800, color: "#0d2345", textTransform: "uppercase" }}>
                      ⚙️ {isEn ? "Initial Setup & Equipment Adjustment" : "Setup Iniziale e Regolazione Macchina"}
                    </h4>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#334960", lineHeight: 1.6 }}>
                      {selectedExerciseForModal.setup}
                    </p>
                  </div>

                  <div style={{ background: "#f8fafc", padding: "1em", borderRadius: "0.5em", border: "1px solid #edf2f7" }}>
                    <h4 style={{ margin: "0 0 0.4em", fontSize: "0.85rem", fontWeight: 800, color: "#0d2345", textTransform: "uppercase" }}>
                      🎯 {isEn ? "Correct Biomechanical Execution" : "Esecuzione Biomeccanica Corretta"}
                    </h4>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#334960", lineHeight: 1.6 }}>
                      {selectedExerciseForModal.execution}
                    </p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1em" }}>
                    <div style={{ background: "#f0fdf4", padding: "1em", borderRadius: "0.5em", border: "1px solid #bbf7d0" }}>
                      <h4 style={{ margin: "0 0 0.4em", fontSize: "0.85rem", fontWeight: 800, color: "#166534", textTransform: "uppercase" }}>
                        🛡️ {isEn ? "Key Safety Points" : "Punti Chiave di Sicurezza"}
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: "1.2em", fontSize: "0.82rem", color: "#14532d", lineHeight: 1.6 }}>
                        {selectedExerciseForModal.safetyPoints.map((pt, i) => (
                          <li key={i}>{pt}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ background: "#fef2f2", padding: "1em", borderRadius: "0.5em", border: "1px solid #fecaca" }}>
                      <h4 style={{ margin: "0 0 0.4em", fontSize: "0.85rem", fontWeight: 800, color: "#991b1b", textTransform: "uppercase" }}>
                        ⚠️ {isEn ? "Common Mistakes to Avoid" : "Errori Comuni da Evitare"}
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: "1.2em", fontSize: "0.82rem", color: "#7f1d1d", lineHeight: 1.6 }}>
                        {selectedExerciseForModal.commonMistakes.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "1.5em", paddingTop: "1em", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => setSelectedExerciseForModal(null)}
                    className={styles.btnPrimary}
                  >
                    {isEn ? "Close Details" : "Chiudi Scheda"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Interactive Workout Plan Sheet Modal */}
      {selectedPlanForModal && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setSelectedPlanForModal(null)}
          role="dialog"
          aria-modal="true"
          aria-label={selectedPlanForModal.title}
        >
          <div
            className={styles.modalBoxWide}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <div style={{ display: "flex", gap: "0.5em", alignItems: "center", marginBottom: "0.4em" }}>
                  <span className={styles.pillBadge} style={{ background: "#e0f2fe", color: "#0369a1" }}>
                    {selectedPlanForModal.level}
                  </span>
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>⏱ {selectedPlanForModal.durationWeeks}</span>
                </div>
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#0d2345" }}>
                  {selectedPlanForModal.title}
                </h3>
                <p style={{ margin: "0.3em 0 0", fontSize: "0.85rem", color: "#52667b" }}>
                  {selectedPlanForModal.subtitle}
                </p>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setSelectedPlanForModal(null)}
                aria-label={isEn ? "Close protocol" : "Chiudi scheda"}
              >
                ✕
              </button>
            </div>

            {/* Protocol Meta Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85em", background: "#f8fafc", padding: "1em", borderRadius: "0.65em", border: "1px solid #e2e8f0", marginBottom: "1.25em" }}>
              <div>
                <span style={{ display: "block", fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                  {isEn ? "Target Objective" : "Obiettivo Target"}
                </span>
                <strong style={{ fontSize: "0.88rem", color: "#0f172a" }}>
                  {selectedPlanForModal.id === "plan-1" ? (isEn ? "Motor Learning & Adaptation" : "Apprendimento Motorio") :
                   selectedPlanForModal.id === "plan-2" ? (isEn ? "Push/Pull Kinetic Balance" : "Equilibrio Spinta/Trazione") :
                   selectedPlanForModal.id === "plan-3" ? (isEn ? "Localized Muscle Hypertrophy" : "Ipertrofia Muscolare Localizzata") :
                   selectedPlanForModal.id === "plan-4" ? (isEn ? "Compound Strength & Mechanical Tension" : "Forza Fondamentale e Tensione") :
                   (isEn ? "Aerobic Base & Conditioning" : "Base Aerobica e Condizionamento")}
                </strong>
              </div>
              <div>
                <span style={{ display: "block", fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                  {isEn ? "Weekly Frequency" : "Frequenza Settimanale"}
                </span>
                <strong style={{ fontSize: "0.88rem", color: "#0f172a" }}>
                  {selectedPlanForModal.id === "plan-3" ? "4 Giorni / 4 Days" : "2-3 Giorni / Days"}
                </strong>
              </div>
              <div>
                <span style={{ display: "block", fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                  {isEn ? "Official Accreditation" : "Accreditamento Ufficiale"}
                </span>
                <strong style={{ fontSize: "0.88rem", color: "#0066ff" }}>
                  Libertas / CONI
                </strong>
              </div>
            </div>

            {/* Warm-up box */}
            <div style={{ background: "#f0fdf4", padding: "1em", borderRadius: "0.65em", border: "1px solid #bbf7d0", marginBottom: "1.25em" }}>
              <h4 style={{ margin: "0 0 0.35em", fontSize: "0.85rem", fontWeight: 800, color: "#166534", textTransform: "uppercase" }}>
                🔥 {isEn ? "1. Warm-Up & Joint Mobility Protocol (8-10 Min)" : "1. Riscaldamento & Mobilità Articolare (8-10 Min)"}
              </h4>
              <ul style={{ margin: 0, paddingLeft: "1.2em", fontSize: "0.82rem", color: "#14532d", lineHeight: 1.6 }}>
                <li>{isEn ? "Cardiovascular ramp-up: 5 min Treadmill or Rower at moderate RPE 4-5/10." : "Attivazione cardiovascolare: 5 min Tapis Roulant o Vogatore a intensità moderata RPE 4-5."}</li>
                <li>{isEn ? "Dynamic mobility: Cat-Cow (10 reps), World's Greatest Stretch (5/side), Glute Bridges (15 reps)." : "Mobilità dinamica: Cat-Cow (10 rip), World's Greatest Stretch (5/lato), Ponte Glutei (15 rip)."}</li>
                <li>{isEn ? "Specific neuromuscular warm-up sets with progressive load before compound exercises." : "Serie di avvicinamento e attivazione neurale a carico crescente prima degli esercizi multiarticolari."}</li>
              </ul>
            </div>

            {/* Structured Sessions */}
            <h4 style={{ margin: "0 0 0.65em", fontSize: "0.95rem", fontWeight: 800, color: "#0d2345" }}>
              📋 {isEn ? "2. Structured Exercise Routines" : "2. Sessioni di Allenamento Strutturate"}
            </h4>

            {selectedPlanForModal.id === "plan-2" ? (
              <>
                <div className={styles.planSessionCard}>
                  <div className={styles.planSessionHeader}>
                    <h5 className={styles.planSessionTitle}>
                      {isEn ? "SESSION A: PUSH & KNEE-DOMINANT" : "SESSIONE A: SPINTA & DOMINANZA GINOCCHIO"}
                    </h5>
                    <span className={styles.planSessionFocus}>
                      {isEn ? "Anterior Kinetic Chain" : "Catena Cinetica Anteriore"}
                    </span>
                  </div>
                  <div className={styles.planTableWrapper}>
                    <table className={styles.planTable}>
                      <thead>
                        <tr>
                          <th>{isEn ? "Exercise" : "Esercizio"}</th>
                          <th>{isEn ? "Target Muscle" : "Target"}</th>
                          <th>{isEn ? "Sets x Reps" : "Serie x Rip"}</th>
                          <th>{isEn ? "Rest" : "Recupero"}</th>
                          <th>{isEn ? "Intensity / RPE" : "Intensità"}</th>
                          <th>{isEn ? "Biomechanical Cue" : "Indicazione Tecnica"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td><strong>Goblet Squat (Dumbbell)</strong></td><td>Quadriceps / Glutes</td><td>4 x 10-12</td><td>90s</td><td>RIR 2 (RPE 8)</td><td>Upright torso, dumbbell glued to sternum</td></tr>
                        <tr><td><strong>Flat Dumbbell Bench Press</strong></td><td>Pectoralis Major</td><td>4 x 10-12</td><td>90s</td><td>RIR 2 (RPE 8)</td><td>45° elbow angle, full humeral stretch</td></tr>
                        <tr><td><strong>Cable Low Row (Neutral)</strong></td><td>Upper Back / Rhomboids</td><td>3 x 12</td><td>75s</td><td>RIR 2 (RPE 8)</td><td>Lead with elbows, squeeze shoulder blades</td></tr>
                        <tr><td><strong>Standing Calf Raise</strong></td><td>Gastrocnemius</td><td>3 x 15</td><td>60s</td><td>RIR 1 (RPE 9)</td><td>2s pause in deep dorsiflexion</td></tr>
                        <tr><td><strong>Forearm Plank</strong></td><td>Core Stabilization</td><td>3 x 45s</td><td>60s</td><td>Max Tension</td><td>Posterior pelvic tilt, squeeze glutes</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className={styles.planSessionCard}>
                  <div className={styles.planSessionHeader}>
                    <h5 className={styles.planSessionTitle}>
                      {isEn ? "SESSION B: PULL & HIP-DOMINANT" : "SESSIONE B: TRAZIONE & DOMINANZA ANCA"}
                    </h5>
                    <span className={styles.planSessionFocus}>
                      {isEn ? "Posterior Kinetic Chain" : "Catena Cinetica Posteriore"}
                    </span>
                  </div>
                  <div className={styles.planTableWrapper}>
                    <table className={styles.planTable}>
                      <thead>
                        <tr>
                          <th>{isEn ? "Exercise" : "Esercizio"}</th>
                          <th>{isEn ? "Target Muscle" : "Target"}</th>
                          <th>{isEn ? "Sets x Reps" : "Serie x Rip"}</th>
                          <th>{isEn ? "Rest" : "Recupero"}</th>
                          <th>{isEn ? "Intensity / RPE" : "Intensità"}</th>
                          <th>{isEn ? "Biomechanical Cue" : "Indicazione Tecnica"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td><strong>Romanian Deadlift (Dumbbell)</strong></td><td>Hamstrings / Glutes</td><td>4 x 10-12</td><td>90s</td><td>RIR 2 (RPE 8)</td><td>Hinge hips back, soft knees, flat back</td></tr>
                        <tr><td><strong>Seated Dumbbell Overhead Press</strong></td><td>Anterior/Medial Deltoid</td><td>3 x 10-12</td><td>90s</td><td>RIR 2 (RPE 8)</td><td>Press vertically along ears, core braced</td></tr>
                        <tr><td><strong>Lat Pulldown (Neutral Grip)</strong></td><td>Latissimus Dorsi</td><td>4 x 10-12</td><td>75s</td><td>RIR 2 (RPE 8)</td><td>Drive elbows down to hip pockets</td></tr>
                        <tr><td><strong>Lying Leg Curl</strong></td><td>Hamstrings</td><td>3 x 12</td><td>60s</td><td>RIR 2 (RPE 8)</td><td>Hips anchored firmly to bench</td></tr>
                        <tr><td><strong>Cable Triceps Pushdown</strong></td><td>Triceps Brachii</td><td>3 x 12-15</td><td>60s</td><td>RIR 1 (RPE 9)</td><td>Pin upper arms against ribcage</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : selectedPlanForModal.id === "plan-3" ? (
              <>
                <div className={styles.planSessionCard}>
                  <div className={styles.planSessionHeader}>
                    <h5 className={styles.planSessionTitle}>
                      {isEn ? "UPPER BODY A (HYPERTROPHY FOCUS)" : "UPPER BODY A (IPERTROFIA)"}
                    </h5>
                    <span className={styles.planSessionFocus}>
                      {isEn ? "Chest, Back, Shoulders & Arms" : "Petto, Dorso, Spalle e Braccia"}
                    </span>
                  </div>
                  <div className={styles.planTableWrapper}>
                    <table className={styles.planTable}>
                      <thead>
                        <tr>
                          <th>{isEn ? "Exercise" : "Esercizio"}</th>
                          <th>{isEn ? "Target Muscle" : "Target"}</th>
                          <th>{isEn ? "Sets x Reps" : "Serie x Rip"}</th>
                          <th>{isEn ? "Rest" : "Recupero"}</th>
                          <th>{isEn ? "Intensity / RPE" : "Intensità"}</th>
                          <th>{isEn ? "Biomechanical Cue" : "Indicazione Tecnica"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td><strong>Incline Dumbbell Press (30°)</strong></td><td>Upper Pectoralis</td><td>4 x 8-10</td><td>120s</td><td>RIR 2 (RPE 8)</td><td>Controlled 3s eccentric, full clavicular stretch</td></tr>
                        <tr><td><strong>Chest-Supported T-Bar Row</strong></td><td>Latissimus / Mid-Back</td><td>4 x 8-10</td><td>120s</td><td>RIR 2 (RPE 8)</td><td>Strict form, eliminate momentum, lat peak contraction</td></tr>
                        <tr><td><strong>Seated Dumbbell Lateral Raise</strong></td><td>Lateral Deltoid</td><td>4 x 12-15</td><td>60s</td><td>RIR 1 (RPE 9)</td><td>Scapular plane, lead with elbows</td></tr>
                        <tr><td><strong>Incline Dumbbell Biceps Curl</strong></td><td>Biceps (Long Head)</td><td>3 x 10-12</td><td>60s</td><td>RIR 1 (RPE 9)</td><td>Maximal stretch at bottom position</td></tr>
                        <tr><td><strong>Overhead Cable Triceps Ext.</strong></td><td>Triceps (Long Head)</td><td>3 x 12-15</td><td>60s</td><td>RIR 1 (RPE 9)</td><td>Full elbow flexion to target shoulder extension stretch</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className={styles.planSessionCard}>
                  <div className={styles.planSessionHeader}>
                    <h5 className={styles.planSessionTitle}>
                      {isEn ? "LOWER BODY A (STRENGTH & HYPERTROPHY)" : "LOWER BODY A (FORZA & IPERTROFIA)"}
                    </h5>
                    <span className={styles.planSessionFocus}>
                      {isEn ? "Quadriceps, Hamstrings & Glutes" : "Quadricipiti, Femorali e Glutei"}
                    </span>
                  </div>
                  <div className={styles.planTableWrapper}>
                    <table className={styles.planTable}>
                      <thead>
                        <tr>
                          <th>{isEn ? "Exercise" : "Esercizio"}</th>
                          <th>{isEn ? "Target Muscle" : "Target"}</th>
                          <th>{isEn ? "Sets x Reps" : "Serie x Rip"}</th>
                          <th>{isEn ? "Rest" : "Recupero"}</th>
                          <th>{isEn ? "Intensity / RPE" : "Intensità"}</th>
                          <th>{isEn ? "Biomechanical Cue" : "Indicazione Tecnica"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td><strong>Barbell Back Squat</strong></td><td>Quadriceps / Glutes</td><td>4 x 6-8</td><td>150s</td><td>RIR 2 (RPE 8)</td><td>Hip crease below knee, brace core with Valsalva</td></tr>
                        <tr><td><strong>Barbell Romanian Deadlift</strong></td><td>Hamstrings / Glutes</td><td>4 x 8-10</td><td>120s</td><td>RIR 2 (RPE 8)</td><td>Bar close to shins, hinge hips backward</td></tr>
                        <tr><td><strong>Bulgarian Split Squat</strong></td><td>Gluteus Maximus / Quads</td><td>3 x 10/side</td><td>90s</td><td>RIR 2 (RPE 8)</td><td>Forward torso lean for maximal glute recruit</td></tr>
                        <tr><td><strong>Standing Calf Raise</strong></td><td>Calves</td><td>4 x 12-15</td><td>60s</td><td>RIR 1</td><td>Full ankle range of motion with 2s pause</td></tr>
                        <tr><td><strong>Hanging Leg Raise</strong></td><td>Core Flexors</td><td>3 x 12-15</td><td>60s</td><td>RIR 2</td><td>Posterior pelvic roll, controlled return</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : selectedPlanForModal.id === "plan-4" ? (
              <div className={styles.planSessionCard}>
                <div className={styles.planSessionHeader}>
                  <h5 className={styles.planSessionTitle}>
                    {isEn ? "COMPOUND STRENGTH PROTOCOL" : "PROTOCOLLO FORZA FONDAMENTALE"}
                  </h5>
                  <span className={styles.planSessionFocus}>
                    {isEn ? "Linear Overload Mastery" : "Sovraccarico Progressivo Lineare"}
                  </span>
                </div>
                <div className={styles.planTableWrapper}>
                  <table className={styles.planTable}>
                    <thead>
                      <tr>
                        <th>{isEn ? "Exercise" : "Esercizio"}</th>
                        <th>{isEn ? "Target Muscle" : "Target"}</th>
                        <th>{isEn ? "Sets x Reps" : "Serie x Rip"}</th>
                        <th>{isEn ? "Rest" : "Recupero"}</th>
                        <th>{isEn ? "Intensity / RPE" : "Intensità"}</th>
                        <th>{isEn ? "Biomechanical Cue" : "Indicazione Tecnica"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td><strong>Barbell Flat Bench Press</strong></td><td>Chest / Triceps</td><td>5 x 5</td><td>180s</td><td>RIR 2 (RPE 8)</td><td>Plant feet, thoracic arch, bar to sternum</td></tr>
                      <tr><td><strong>Barbell Back Squat</strong></td><td>Quadriceps / Posterior</td><td>4 x 6</td><td>180s</td><td>RIR 2 (RPE 8)</td><td>Valsalva breath, drive floor away</td></tr>
                      <tr><td><strong>Barbell Bent-Over Row</strong></td><td>Lats / Rhomboids</td><td>4 x 8</td><td>120s</td><td>RIR 2 (RPE 8)</td><td>45° torso angle, pull to navel</td></tr>
                      <tr><td><strong>Conventional Deadlift</strong></td><td>Whole Posterior Chain</td><td>4 x 5</td><td>180s</td><td>RIR 2 (RPE 8)</td><td>Lock lats, push through heels, lockout hips</td></tr>
                      <tr><td><strong>Standing Overhead Press</strong></td><td>Deltoids / Triceps</td><td>4 x 6</td><td>150s</td><td>RIR 2 (RPE 8)</td><td>Squeeze glutes and abs, chin tuck on drive</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : selectedPlanForModal.id === "plan-5" ? (
              <div className={styles.planSessionCard}>
                <div className={styles.planSessionHeader}>
                  <h5 className={styles.planSessionTitle}>
                    {isEn ? "CONCURRENT METABOLIC & AEROBIC ROUTINE" : "CIRCUITO METABOLICO & AEROBICO CONCORRENTE"}
                  </h5>
                  <span className={styles.planSessionFocus}>
                    {isEn ? "Recomposition & Caloric Output" : "Ricomposizione e Dispendio Energetico"}
                  </span>
                </div>
                <div className={styles.planTableWrapper}>
                  <table className={styles.planTable}>
                    <thead>
                      <tr>
                        <th>{isEn ? "Exercise" : "Esercizio"}</th>
                        <th>{isEn ? "Target Muscle" : "Target"}</th>
                        <th>{isEn ? "Sets x Reps" : "Serie x Rip"}</th>
                        <th>{isEn ? "Rest" : "Recupero"}</th>
                        <th>{isEn ? "Intensity / RPE" : "Intensità"}</th>
                        <th>{isEn ? "Biomechanical Cue" : "Indicazione Tecnica"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td><strong>Dumbbell Thruster</strong></td><td>Whole Body Kinetic</td><td>3 x 12</td><td>45s</td><td>RPE 7.5</td><td>Continuous flow from deep squat to press</td></tr>
                      <tr><td><strong>Russian Kettlebell Swing</strong></td><td>Posterior Hip Hinge</td><td>4 x 15</td><td>45s</td><td>RPE 8</td><td>Explosive hip drive, arms act as cable</td></tr>
                      <tr><td><strong>Push-Up to Renegade Row</strong></td><td>Chest / Core / Back</td><td>3 x 10/side</td><td>60s</td><td>RPE 8</td><td>Wide foot base to prevent pelvic rotation</td></tr>
                      <tr><td><strong>Stationary Bike (Zone 2)</strong></td><td>Cardiovascular Aerobic</td><td>1 x 25 min</td><td>Continuous</td><td>65-75% HRmax</td><td>Steady cadence at 85-90 RPM</td></tr>
                      <tr><td><strong>Heavy Farmer Carry</strong></td><td>Grip / Trapezius / Core</td><td>3 x 40m</td><td>60s</td><td>RPE 8</td><td>Tall posture, brace core under load</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className={styles.planSessionCard}>
                <div className={styles.planSessionHeader}>
                  <h5 className={styles.planSessionTitle}>
                    {isEn ? "FOUNDATION FULL BODY CIRCUIT" : "CIRCUITO FULL BODY BASE"}
                  </h5>
                  <span className={styles.planSessionFocus}>
                    {isEn ? "Full Motor Learning Chain" : "Apprendimento Motorio Completo"}
                  </span>
                </div>
                <div className={styles.planTableWrapper}>
                  <table className={styles.planTable}>
                    <thead>
                      <tr>
                        <th>{isEn ? "Exercise" : "Esercizio"}</th>
                        <th>{isEn ? "Target Muscle" : "Target"}</th>
                        <th>{isEn ? "Sets x Reps" : "Serie x Rip"}</th>
                        <th>{isEn ? "Rest" : "Recupero"}</th>
                        <th>{isEn ? "Intensity / RPE" : "Intensità"}</th>
                        <th>{isEn ? "Biomechanical Cue" : "Indicazione Tecnica"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td><strong>Leg Press 45°</strong></td><td>Quadriceps / Glutes</td><td>3 x 12-15</td><td>90s</td><td>RIR 3 (RPE 7)</td><td>Feet shoulder-width, controlled 3s eccentric</td></tr>
                      <tr><td><strong>Chest Press Machine</strong></td><td>Pectorals / Triceps</td><td>3 x 12-15</td><td>90s</td><td>RIR 3 (RPE 7)</td><td>Scapulae retracted & depressed, neutral wrists</td></tr>
                      <tr><td><strong>Lat Pulldown (Pronated)</strong></td><td>Lats / Biceps</td><td>3 x 12-15</td><td>90s</td><td>RIR 3 (RPE 7)</td><td>Pull elbows to hip pockets, chest tall</td></tr>
                      <tr><td><strong>Seated Leg Curl</strong></td><td>Hamstrings</td><td>3 x 12-15</td><td>60s</td><td>RIR 2 (RPE 8)</td><td>Align knee joint with machine pivot axis</td></tr>
                      <tr><td><strong>Dumbbell Lateral Raise</strong></td><td>Lateral Deltoid</td><td>2 x 15</td><td>60s</td><td>RIR 2 (RPE 8)</td><td>Scapular plane 30° anterior to torso</td></tr>
                      <tr><td><strong>Crunch Machine</strong></td><td>Abdominals</td><td>3 x 15-20</td><td>60s</td><td>RIR 2 (RPE 8)</td><td>Vertebral flexion, full exhalation</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Progression & Coaching Notes */}
            <div style={{ background: "#f8fafc", padding: "1em", borderRadius: "0.65em", border: "1px solid #e2e8f0", marginBottom: "1.25em" }}>
              <h4 style={{ margin: "0 0 0.35em", fontSize: "0.85rem", fontWeight: 800, color: "#0d2345", textTransform: "uppercase" }}>
                💡 {isEn ? "3. Progression Model & Coach Guidelines" : "3. Linee Guida di Progressione e Note del Coach"}
              </h4>
              <ul style={{ margin: 0, paddingLeft: "1.2em", fontSize: "0.82rem", color: "#334155", lineHeight: 1.6 }}>
                <li><strong>{isEn ? "Double Progression Rule" : "Regola del Doppio Incremento"}:</strong> {isEn ? "Increase load by 2.5-5% only after completing the upper rep bracket on all sets with pristine technique." : "Aumenta il carico del 2.5-5% solo dopo aver completato il limite superiore di ripetizioni in tutte le serie con tecnica impeccabile."}</li>
                <li><strong>{isEn ? "Tempo Control" : "Cadenza di Movimento"}:</strong> {isEn ? "Maintain a 2-0-1-0 tempo (2s eccentric, 0s pause, 1s concentric, 0s lockout) on all compound exercises." : "Mantieni una cadenza controllata 2-0-1-0 (2s discesa eccentrica, 0s sosta, 1s risalita concentrica)."}</li>
                <li><strong>{isEn ? "Buffer & RIR Tracking" : "Gestione del Buffer (RIR)"}:</strong> {isEn ? "End every set with 2-3 repetitions in reserve during the initial 4 weeks to avoid early systemic fatigue." : "Termina ogni serie con 2-3 ripetizioni di riserva nelle prime 4 settimane per evitare affaticamento sistemico precoce."}</li>
              </ul>
            </div>

            {/* Footer Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75em", borderTop: "1px solid #e2e8f0", paddingTop: "1em" }}>
              <div style={{ display: "flex", gap: "0.65em", flexWrap: "wrap" }}>
                <a
                  href={selectedPlanForModal.pdfUrl}
                  download
                  className={styles.btnPrimary}
                  style={{ textDecoration: "none", fontSize: "0.82rem" }}
                >
                  ⇩ {isEn ? `Download Official PDF (${selectedPlanForModal.pdfSize})` : `Scarica PDF Ufficiale (${selectedPlanForModal.pdfSize})`}
                </a>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className={styles.btnSecondary}
                  style={{ fontSize: "0.82rem", cursor: "pointer" }}
                >
                  🖨 {isEn ? "Print Protocol" : "Stampa Protocollo"}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlanForModal(null)}
                className={styles.btnSecondary}
                style={{ fontSize: "0.82rem", cursor: "pointer" }}
              >
                {isEn ? "Close" : "Chiudi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
