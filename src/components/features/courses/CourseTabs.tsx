"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { T } from "@/components/layout/LanguageProvider";
import styles from "./course-detail.module.css";

const tabs = ["Descrizione", "Programma", "Docenti", "FAQ"] as const;
type CourseTab = typeof tabs[number];

export function CourseTabs() {
  const [active, setActive] = useState<CourseTab>("Descrizione");
  return (
    <section className={styles.tabsSection} aria-label="Informazioni sul corso">
      <div className={styles.tabs} role="group" aria-label="Sezioni del corso">
        {tabs.map((tab) => <button key={tab} type="button" className={cn(styles.tab, active === tab && styles.tabActive)} aria-pressed={active === tab} onClick={() => setActive(tab)}><T>{tab}</T></button>)}
      </div>
      <div className={styles.tabContent} aria-live="polite">
        {active === "Descrizione" && <>
          <p><T>Il corso di Personal Trainer di Eureka! Academy ti fornisce una formazione completa, pratica e aggiornata, con il supporto di professionisti del settore.</T></p>
          <ul className={styles.topicGrid}>
            <li><T>Anatomia e fisiologia</T></li>
            <li><T>Valutazione funzionale</T></li>
            <li><T>Programmazione dell'allenamento</T></li>
            <li><T>Tecnica pratica</T></li>
            <li><T>Alimentazione sportiva</T></li>
            <li><T>Rilascio diploma</T></li>
          </ul>
        </>}
        {active === "Programma" && <>
          <p><T>Il percorso approfondisce i fondamenti del movimento e la progettazione di allenamenti personalizzati.</T></p>
          <ul className={styles.topicGrid}>
            <li><T>Anatomia e fisiologia</T></li><li><T>Valutazione funzionale</T></li><li><T>Tecnica degli esercizi</T></li><li><T>Programmazione dell'allenamento</T></li>
          </ul>
        </>}
        {active === "Docenti" && <p><T>Le lezioni teoriche e pratiche sono guidate da professionisti del settore. I profili dei docenti saranno pubblicati con il programma completo.</T></p>}
        {active === "FAQ" && <dl className={styles.faq}>
          <dt><T>Quanto dura il corso?</T></dt><dd><T>6 mesi.</T></dd>
          <dt><T>Come si svolge?</T></dt><dd><T>Online e con attività pratiche.</T></dd>
          <dt><T>Quando aprono le iscrizioni?</T></dt><dd><T>La data sarà comunicata su questa pagina.</T></dd>
        </dl>}
      </div>
    </section>
  );
}
