"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/routing";
import { HomeIcon } from "./HomeIcon";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { apiClient } from "@/lib/api/client";
import { clearSession, persistSession, readSessionUser, type SessionUser } from "@/lib/auth/session";
import styles from "./home.module.css";

const content = {
  academy: { title: "Eureka! Accademia", text: "Il programma completo, il calendario e le iscrizioni a questo corso non sono ancora disponibili." },
  goal: { title: "Il tuo obiettivo", text: "I programmi di allenamento per questo obiettivo non sono ancora disponibili nell'app." },
  training: { title: "Eureka! Allenamento", text: "L'app Eureka! Allenamento sarà disponibile a breve. Torna a trovarci per scoprire i programmi di allenamento." },
  login: { title: "Accedi a Eureka!", text: "L'area riservata sarà disponibile a breve." },
  contact: { title: "Contatti", text: "I nostri recapiti saranno disponibili a breve. Torna a trovarci per metterti in contatto con il team Eureka!" },
  launch: { title: "Speciale lancio", text: "La prova gratuita e i piani dell'app saranno disponibili quando verrà attivato il servizio." },
  legal: { title: "Informazioni", text: "Queste informazioni saranno disponibili prima dell'apertura del servizio." },
  social: { title: "Seguici", text: "I collegamenti ai canali social saranno disponibili a breve." },
  search: { title: "Cerca in Eureka!", text: "Esplora i percorsi e scopri il mondo Eureka!" },
};

const destinations = [
  { title: "Eureka! Accademia", description: "Corsi e formazione professionale", href: "/academy" },
  { title: "Eureka! Allenamento", description: "App e allenamento", href: "/training" },
  { title: "Eureka! Fit", description: "App di allenamento e progressi", href: "/app" },
  { title: "Tutti i corsi", description: "Catalogo Eureka! Accademia", href: "/academy/corsi" },
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState<SessionUser | null>(null);
  const router = useRouter();
  const { language, t } = useLanguage();
  const results = destinations.filter((item) => `${item.title} ${item.description} ${t(item.title)} ${t(item.description)}`.toLocaleLowerCase(language).includes(query.trim().toLocaleLowerCase(language)));

  useEffect(() => {
    setSession(readSessionUser());
  }, []);

  async function onLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    setSubmitting(true);
    try {
      const data = await apiClient.post<{
        access_token: string;
        expires_in: number;
        user: SessionUser;
      }>("/auth/login", { email, password });
      persistSession(data.access_token, data.expires_in, {
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      });
      setSession({ name: data.user.name, email: data.user.email, role: data.user.role });
      setPassword("");
      dialog.current?.close();
      router.refresh();
    } catch {
      setLoginError(language === "en" ? "Email or password is not valid." : "Email o password non validi.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onLogout() {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // The local session is cleared either way.
    }
    clearSession();
    setSession(null);
    dialog.current?.close();
    router.refresh();
  }

  const buttonLabel = kind === "login" && session ? session.name : children;

  return (
    <>
      <button className={className} aria-label={label ?? (kind === "login" && session ? session.name : undefined)} type="button" aria-haspopup="dialog" onClick={() => { setQuery(""); setLoginError(""); dialog.current?.showModal(); }}>{buttonLabel}</button>
      <dialog ref={dialog} className={styles.dialog} aria-labelledby={titleId} aria-describedby={descriptionId} onClick={(event) => {
        if (event.target === event.currentTarget) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.current?.close();
        }
      }}>
        <button className={styles.closeButton} type="button" aria-label={language === "en" ? "Close" : "Chiudi"} onClick={() => dialog.current?.close()}><HomeIcon name="close" /></button>
        <h2 id={titleId}>{t(title ?? content[kind].title)}</h2>
        <p id={descriptionId}>
          {kind === "login"
            ? (language === "en" ? "Sign in to open your course videos." : "Accedi per aprire i video del corso.")
            : description
              ? `${t(description)} ${t(content[kind].text)}`
              : t(content[kind].text)}
        </p>
        {kind === "login" && (
          session ? (
            <div className={styles.loginForm}>
              <p>{session.email}</p>
              <p>
                {session.role === "coach"
                  ? (language === "en" ? "Coach account: only coach videos are shown." : "Account coach: vengono mostrati solo i video coach.")
                  : session.role === "admin"
                    ? (language === "en" ? "Admin account: the full video library is shown." : "Account admin: viene mostrata l'intera libreria video.")
                    : (language === "en" ? "Athlete account: the full video library is shown." : "Account atleta: viene mostrata l'intera libreria video.")}
              </p>
              <button type="button" onClick={onLogout}>{language === "en" ? "Log out" : "Esci"}</button>
            </div>
          ) : (
            <form className={styles.loginForm} onSubmit={onLogin}>
              <label htmlFor={`${titleId}-email`}>{language === "en" ? "Email" : "Email"}</label>
              <input id={`${titleId}-email`} type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
              <label htmlFor={`${titleId}-password`}>{language === "en" ? "Password" : "Password"}</label>
              <input id={`${titleId}-password`} type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
              {loginError && <p role="alert">{loginError}</p>}
              <button type="submit" disabled={submitting}>{submitting ? (language === "en" ? "Signing in…" : "Accesso…") : (language === "en" ? "Log in" : "Accedi")}</button>
            </form>
          )
        )}
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
