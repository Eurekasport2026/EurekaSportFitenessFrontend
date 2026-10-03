"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { getPT3Resources } from "@/lib/api/practical";
import styles from "./lesson-view.module.css";

export function PT3ResourcesView() {
  const locale = useLocale() || "it";
  const isEn = locale === "en";
  const pt3Data = getPT3Resources(locale);

  const [activeSubTab, setActiveSubTab] = useState<"templates" | "cases" | "docs">("templates");
  const [selectedCaseId, setSelectedCaseId] = useState<string>("pt3-cs-1");

  if (!pt3Data) {
    return (
      <div className={styles.contentSection} style={{ textAlign: "center", padding: "2em" }}>
        <p style={{ color: "#64748b" }}>
          {isEn ? "No advanced resources available." : "Nessuna risorsa avanzata disponibile."}
        </p>
      </div>
    );
  }

  const selectedCase = pt3Data.caseStudies.find((c) => c.id === selectedCaseId) || pt3Data.caseStudies[0];

  return (
    <div style={{ marginTop: "1.5em" }}>
      {/* Sub-navigation tabs */}
      <div style={{ display: "flex", gap: "0.75em", flexWrap: "wrap", marginBottom: "1.5em", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.5em" }}>
        <button
          type="button"
          onClick={() => setActiveSubTab("templates")}
          className={styles.btnSecondary}
          style={activeSubTab === "templates" ? { background: "#0066ff", color: "#fff", borderColor: "#0066ff" } : {}}
        >
          📊 {isEn ? `Planning Templates (${pt3Data.templates.length})` : `Modelli di Programmazione (${pt3Data.templates.length})`}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("cases")}
          className={styles.btnSecondary}
          style={activeSubTab === "cases" ? { background: "#0066ff", color: "#fff", borderColor: "#0066ff" } : {}}
        >
          🔎 {isEn ? `Applied Case Studies (${pt3Data.caseStudies.length})` : `Casi Studio Applicati (${pt3Data.caseStudies.length})`}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("docs")}
          className={styles.btnSecondary}
          style={activeSubTab === "docs" ? { background: "#0066ff", color: "#fff", borderColor: "#0066ff" } : {}}
        >
          📋 {isEn ? `Professional Documentation (${pt3Data.professionalDocs.length})` : `Documentazione Professionale (${pt3Data.professionalDocs.length})`}
        </button>
      </div>

      {/* Tab 1: Planning Templates */}
      {activeSubTab === "templates" && (
        <div>
          <p style={{ color: "#52667b", fontSize: "0.9rem", marginBottom: "1.25em" }}>
            {isEn
              ? "High-level programming templates, monitoring spreadsheets, and quality-control SOPs designed for master coaches."
              : "Strumenti operativi per la pianificazione a lungo termine, monitoraggio della fatica (HRV/RPE) e procedure standard (SOP)."}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))", gap: "1.25em" }}>
            {pt3Data.templates.map((tpl) => (
              <div key={tpl.id} className={styles.contentSection} style={{ marginBottom: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5em" }}>
                  <span className={styles.pillBadge} style={{ background: "#e0f2fe", color: "#0369a1" }}>
                    {tpl.format}
                  </span>
                </div>
                <h3 style={{ margin: "0 0 0.35em", fontSize: "1.05rem", fontWeight: 700, color: "#0d2345" }}>
                  {tpl.title}
                </h3>
                <p style={{ margin: "0 0 1em", fontSize: "0.82rem", color: "#52667b", lineHeight: 1.5 }}>
                  {tpl.description}
                </p>
                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "0.75em" }}>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", display: "inline-block", background: "#f8fafc", padding: "0.3em 0.6em", borderRadius: "4px" }}>
                    ℹ️ {isEn ? "Available in course kit" : "Incluso nel materiale didattico"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Case Studies */}
      {activeSubTab === "cases" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))", gap: "0.85em", marginBottom: "1.5em" }}>
            {pt3Data.caseStudies.map((cs) => (
              <button
                key={cs.id}
                type="button"
                onClick={() => setSelectedCaseId(cs.id)}
                className={styles.muscleCard}
                style={selectedCaseId === cs.id ? { borderColor: "#0066ff", background: "#f0f7ff" } : {}}
              >
                <div>
                  <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#0066ff", textTransform: "uppercase" }}>
                    {cs.category}
                  </span>
                  <h4 style={{ margin: "0.25em 0", fontSize: "0.95rem", fontWeight: 700, color: "#0d2345" }}>
                    {cs.title}
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b" }}>{cs.subtitle}</p>
                </div>
              </button>
            ))}
          </div>

          {selectedCase && (
            <div className={styles.contentSection} style={{ background: "#ffffff", border: "1px solid #0066ff33", borderRadius: "0.75em", padding: "1.5em" }}>
              <span className={styles.pillBadge} style={{ background: "#eff6ff", color: "#1d4ed8", marginBottom: "0.75em" }}>
                {selectedCase.category}
              </span>
              <h3 style={{ margin: "0 0 0.5em", fontSize: "1.3rem", fontWeight: 800, color: "#0d2345" }}>
                {selectedCase.title}
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "1.25em" }}>{selectedCase.subtitle}</p>

              <div style={{ display: "grid", gap: "1em" }}>
                <div style={{ background: "#f8fafc", padding: "1em", borderRadius: "0.5em" }}>
                  <h4 style={{ margin: "0 0 0.3em", fontSize: "0.88rem", color: "#0d2345", fontWeight: 700 }}>
                    {isEn ? "Case Overview & Client Profile:" : "Quadro Clinico e Profilo Cliente:"}
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#334960", lineHeight: 1.5 }}>{selectedCase.overview}</p>
                </div>

                <div style={{ background: "#f8fafc", padding: "1em", borderRadius: "0.5em" }}>
                  <h4 style={{ margin: "0 0 0.3em", fontSize: "0.88rem", color: "#0d2345", fontWeight: 700 }}>
                    {isEn ? "Programming Rationale & Methodology:" : "Rationale e Soluzione Metodologica:"}
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#334960", lineHeight: 1.5 }}>{selectedCase.rationale}</p>
                </div>

                <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "1em", borderRadius: "0.5em" }}>
                  <h4 style={{ margin: "0 0 0.3em", fontSize: "0.88rem", color: "#065f46", fontWeight: 700 }}>
                    {isEn ? "Quantifiable Key Outcomes:" : "Risultati e Metriche Ottenute:"}
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#047857", fontWeight: 600 }}>{selectedCase.keyOutcomes}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Professional Documentation */}
      {activeSubTab === "docs" && (
        <div>
          <p style={{ color: "#52667b", fontSize: "0.9rem", marginBottom: "1.25em" }}>
            {isEn
              ? "Official dossier templates, liability waivers, progress review summaries and inspection checklists."
              : "Modelli ufficiali per dossier atleti, liberatorie legali, sintesi periodiche e verbali di supervisione."}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))", gap: "1.25em" }}>
            {pt3Data.professionalDocs.map((doc) => (
              <div key={doc.id} className={styles.contentSection} style={{ marginBottom: 0 }}>
                <span className={styles.pillBadge} style={{ background: "#f1f5f9", color: "#334960", marginBottom: "0.5em" }}>
                  {doc.category} • {doc.format}
                </span>
                <h3 style={{ margin: "0.2em 0 0.4em", fontSize: "1.05rem", fontWeight: 700, color: "#0d2345" }}>
                  {doc.title}
                </h3>
                <p style={{ margin: "0 0 1em", fontSize: "0.82rem", color: "#52667b", lineHeight: 1.5 }}>
                  {doc.description}
                </p>
                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "0.75em" }}>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                    ✓ {isEn ? "Standard Operating Procedure (SOP)" : "Standard Operativo Conforme CONI"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
