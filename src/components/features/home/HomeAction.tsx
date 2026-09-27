"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { Link } from "@/i18n/routing";
import { HomeIcon } from "./HomeIcon";
import { useLanguage } from "@/components/layout/LanguageProvider";
import styles from "./home.module.css";

const content = {
  academy: { title: "Eureka! Academy", text: "Il programma completo, il calendario e le iscrizioni a questo corso non sono ancora disponibili." },
  goal: { title: "Il tuo obiettivo", text: "I programmi di allenamento per questo obiettivo non sono ancora disponibili nell'app." },
  training: { title: "Eureka! Training", text: "L'app Eureka! Training sarà disponibile a breve. Torna a trovarci per scoprire i programmi di allenamento." },
  login: { title: "Accedi a Eureka!", text: "L'area riservata sarà disponibile a breve." },
  contact: { title: "Contatti", text: "I nostri recapiti saranno disponibili a breve. Torna a trovarci per metterti in contatto con il team Eureka!" },
  launch: { title: "Speciale lancio", text: "La prova gratuita e i piani dell'app saranno disponibili quando verrà attivato il servizio." },
  legal: { title: "Informazioni", text: "Queste informazioni saranno disponibili prima dell'apertura del servizio." },
  social: { title: "Seguici", text: "I collegamenti ai canali social saranno disponibili a breve." },
  search: { title: "Cerca in Eureka!", text: "Esplora i percorsi e scopri il mondo Eureka!" },
};

const destinations = [
  { title: "Eureka! Academy", description: "Corsi e formazione professionale", href: "/academy" },
  { title: "Eureka! Training", description: "App e allenamento", href: "/training" },
  { title: "Eureka! Fit", description: "App di allenamento e progressi", href: "/app" },
  { title: "Tutti i corsi", description: "Catalogo Eureka! Academy", href: "/academy/corsi" },
  { title: "Prezzi app", description: "Piani Base, Pro ed Elite", href: "/prezzi" },
  { title: "Contatti", description: "Scrivi al team Eureka!", href: "/contatti" },
  { title: "Chi siamo", description: "Formazione, allenamento e crescita", href: "/chi-siamo" },
  { title: "Perché Eureka!", description: "Formazione certificata, professionisti e risultati", href: "/#benefits" },
];

export interface HomeActionProps {
  kind: keyof typeof content;
  children: ReactNode;
  className?: string;
  label?: string;
  title?: string;
  description?: string;
}

export function HomeAction({ kind, children, className, label, title, description }: HomeActionProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const searchId = useId();
  const [query, setQuery] = useState("");
  const { language, t } = useLanguage();
  const results = destinations.filter((item) => `${item.title} ${item.description} ${t(item.title)} ${t(item.description)}`.toLocaleLowerCase(language).includes(query.trim().toLocaleLowerCase(language)));

  return (
    <>
      <button className={className} aria-label={label} type="button" aria-haspopup="dialog" onClick={() => { setQuery(""); dialog.current?.showModal(); }}>{children}</button>
      <dialog ref={dialog} className={styles.dialog} aria-labelledby={titleId} aria-describedby={descriptionId} onClick={(event) => {
        if (event.target === event.currentTarget) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.current?.close();
        }
      }}>
        <button className={styles.closeButton} type="button" aria-label={language === "en" ? "Close" : "Chiudi"} onClick={() => dialog.current?.close()}><HomeIcon name="close" /></button>
        <h2 id={titleId}>{t(title ?? content[kind].title)}</h2>
        <p id={descriptionId}>{description ? `${t(description)} ${t(content[kind].text)}` : t(content[kind].text)}</p>
        {kind === "search" && <div className={styles.searchPanel}>
          <label htmlFor={searchId}>{language === "en" ? "What are you looking for?" : "Cosa stai cercando?"}</label>
          <input id={searchId} type="search" value={query} placeholder={language === "en" ? "Courses, training…" : "Corsi, allenamento…"} onChange={(event) => setQuery(event.target.value)} />
          <ul aria-label={language === "en" ? "Search results" : "Risultati della ricerca"}>
            {results.map((result) => <li key={result.href}>
              <Link href={result.href as any} onClick={() => dialog.current?.close()}><strong>{t(result.title)}</strong><span>{t(result.description)}</span><HomeIcon name="arrow" /></Link>
            </li>)}
          </ul>
          <p role="status">{results.length === 0 ? (language === "en" ? "No results. Try courses or training." : "Nessun risultato. Prova con corsi o allenamento.") : `${results.length} ${language === "en" ? "results" : "risultati"}`}</p>
        </div>}
      </dialog>
    </>
  );
}
