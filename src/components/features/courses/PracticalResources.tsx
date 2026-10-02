"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { getWorkoutPlans, getMuscleGroups, getGymExercises, type GymExercise } from "@/lib/api/practical";
import styles from "./lesson-view.module.css";

interface PracticalResourcesProps {
  courseSlug: string;
}

export function PracticalResources({ courseSlug }: PracticalResourcesProps) {
  const locale = useLocale() || "it";
  const isEn = locale === "en";

  const workoutPlans = getWorkoutPlans(locale);
  const muscleGroups = getMuscleGroups(locale);
  const sampleGymExercises = getGymExercises(locale);

  const [activeTab, setActiveTab] = useState<"plans" | "library">("plans");
  const [selectedMuscle, setSelectedMuscle] = useState<string>("chest");
  const [equipmentFilter, setEquipmentFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

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
    const matchesMuscle = ex.muscleGroupId === selectedMuscle;
    const matchesEquipment =
      equipmentFilter === "all" ||
      (equipmentEquivalents[equipmentFilter]?.includes(ex.equipment) ?? ex.equipment === equipmentFilter);
    const matchesSearch =
      searchQuery.trim() === "" ||
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.primaryMuscles.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesMuscle && matchesEquipment && matchesSearch;
  });

  return (
    <div style={{ marginTop: "1.5em" }}>
      {/* Sub-tabs: Workout Plans vs Equipment Library */}
      <div style={{ display: "flex", gap: "0.75em", marginBottom: "1.5em", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.5em" }}>
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25em" }}>
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
                  <a
                    href={plan.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.btnSecondary}
                    style={{ fontSize: "0.75rem" }}
                  >
                    👁 {isEn ? "View Online" : "Visualizza Online"}
                  </a>
                  <a
                    href={plan.pdfUrl}
                    download
                    className={styles.btnPrimary}
                    style={{ fontSize: "0.75rem" }}
                  >
                    ⇩ {isEn ? `Download PDF (${plan.pdfSize})` : `Scarica PDF (${plan.pdfSize})`}
                  </a>
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

          {/* Muscle Group Explorer Grid - 1:1 square cards */}
          <div className={styles.muscleGroupGrid}>
            {muscleGroups.map((mg) => (
              <button
                key={mg.id}
                type="button"
                className={`${styles.muscleCard} ${selectedMuscle === mg.id ? styles.muscleCardActive : ""}`}
                onClick={() => setSelectedMuscle(mg.id)}
              >
                <div>
                  <h4 className={styles.muscleCardName}>{mg.name}</h4>
                  <p className={styles.muscleCardSub}>{mg.subtitle}</p>
                </div>
                <div className={styles.muscleCardAction}>
                  <span>{isEn ? "VIEW EXERCISES" : "VEDI ESERCIZI"}</span>
                  <span aria-hidden="true">→</span>
                </div>
              </button>
            ))}
          </div>

          {/* Selected Muscle Group Header & Filters */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "0.65em", padding: "1.25em", marginTop: "2em", marginBottom: "1.5em" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1em", marginBottom: "1em" }}>
              <div>
                <h3 style={{ margin: "0 0 0.2em", fontSize: "1.25rem", color: "#0d2345", fontWeight: 800 }}>
                  {activeMuscleObj.name} — {isEn ? "Exercises for" : "Esercizi per"} {activeMuscleObj.subtitle}
                </h3>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>{activeMuscleObj.description}</p>
              </div>
              <input
                type="search"
                placeholder={isEn ? "Search exercise..." : "Cerca esercizio..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: "0.5em 0.85em", borderRadius: "0.45em", border: "1px solid #cbd5e1", fontSize: "0.8rem", minWidth: "14em" }}
              />
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
                    <div className={styles.exerciseBadges}>
                      <span className={styles.pillBadge} style={{ background: "#e0f2fe", color: "#0369a1" }}>{ex.equipment}</span>
                      <span className={styles.pillBadge} style={{ background: "#fef3c7", color: "#92400e" }}>{ex.difficulty}</span>
                      <span className={styles.pillBadge} style={{ background: "#ecfdf5", color: "#065f46" }}>{ex.movementType}</span>
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
        </div>
      )}
    </div>
  );
}
