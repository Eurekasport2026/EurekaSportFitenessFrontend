"use client";

import { useLocale } from "next-intl";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { PortalAccess, PortalSwitcher } from "@/components/layout/PortalAccess";
import { useAuth } from "@/components/features/training-app/AuthProvider";
import { TrainingAccountMenu, TrainingBrand, TrainingLanguage } from "@/components/features/training-app/TrainingChrome";
import { TrainingIcon, type TrainingIconProps } from "@/components/features/training-app/TrainingIcon";
import { TrainingInfoButton } from "@/components/features/training-app/TrainingInfoButton";
import { TrainingLoader } from "@/components/features/training-app/TrainingLoader";
import { usePortalRequest } from "@/hooks/use-portal-request";
import { portalMessage, type Assignment, type AthleteDashboard, type WorkoutRecord } from "@/lib/api/portal";
import { AthleteActivity, AthleteCoaches, AthleteCourses, AthleteDashboardNotice, AthleteExerciseLibrary, AthleteHero, AthleteMetrics, AthletePathChoices } from "./AthleteHub";
import { AthleteProfile, AthleteSettings } from "./AthleteSettings";
import { athleteRoutes, athleteView, type AthleteView } from "@/lib/training/athlete-navigation";
import styles from "./athlete-workspace.module.css";

type View = AthleteView;
interface Draft { request_id: string; assignment_id: string; workout_index: number; values: Record<string, string> }
interface ListResult<T> { items: T[]; pending: boolean; error: unknown; reload: () => void }

const navigation: { id: View; icon: TrainingIconProps["name"]; en: string; it: string }[] = [
  { id: "home", icon: "home", en: "Overview", it: "Panoramica" },
  { id: "paths", icon: "ruler", en: "Paths", it: "Percorsi" },
  { id: "programs", icon: "book", en: "My programs", it: "I miei programmi" },
  { id: "library", icon: "search", en: "Exercise library", it: "Libreria esercizi" },
  { id: "workout", icon: "dumbbell", en: "Workout", it: "Allenamento" },
  { id: "progress", icon: "chart", en: "Progress", it: "Progressi" },
  { id: "coach", icon: "message", en: "My coach", it: "Il mio coach" },
  { id: "settings", icon: "settings", en: "Settings", it: "Impostazioni" },
  { id: "profile", icon: "user", en: "My profile", it: "Il mio profilo" },
];

// Keep each page scoped to the verified account and discard superseded requests.
function useAthleteResource<T>(path: string | null) {
  const request = usePortalRequest();
  const owner = useAuth().session?.user.id;
  const scope = `${owner}:${path}`;
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{ scope: string; data: T | null; pending: boolean; error: unknown }>({ scope: "", data: null, pending: true, error: null });
  const reload = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    setResult(previous => ({ scope, data: previous.scope === scope ? previous.data : null, pending: true, error: null }));
    request<T>(path, "GET", undefined, controller.signal).then(data => {
      if (!controller.signal.aborted) setResult({ scope, data, pending: false, error: null });
    }).catch(error => {
      if (!controller.signal.aborted) setResult(previous => ({ scope, data: previous.scope === scope ? previous.data : null, pending: false, error }));
    });
    return () => controller.abort();
  }, [request, path, scope, revision]);
  return { data: result.scope === scope ? result.data : null, pending: result.scope !== scope || result.pending, error: result.scope === scope ? result.error : null, reload };
}

function useAthleteList<T>(path: string): ListResult<T> {
  const result = useAthleteResource<T[]>(path);
  return { ...result, items: result.data ?? [] };
}

function ListState({ result, empty, en }: { result: ListResult<unknown>; empty: string; en: boolean }) {
  if (result.pending) return <TrainingLoader compact label={en ? "Loading your training…" : "Caricamento del tuo allenamento…"} />;
  if (result.error) return <div className={styles.empty}><TrainingIcon name="help" /><p>{portalMessage(result.error, en)}</p><button className={styles.secondary} type="button" onClick={result.reload}>{en ? "Try again" : "Riprova"}<TrainingIcon name="arrow" /></button></div>;
  if (!result.items.length) return <div className={styles.empty}><TrainingIcon name="calendar" /><p>{empty}</p></div>;
  return null;
}

function Pagination({ offset, count, pending, onChange, en }: { offset: number; count: number; pending: boolean; onChange: (offset: number) => void; en: boolean }) {
  if (!offset && count < 25) return null;
  return <nav className={styles.pagination} aria-label={en ? "Pages" : "Pagine"}>
    <button className={styles.iconButton} type="button" disabled={!offset || pending} onClick={() => onChange(Math.max(0, offset - 25))} aria-label={en ? "Previous page" : "Pagina precedente"}><TrainingIcon name="back" /></button>
    <span>{count ? `${offset + 1}–${offset + count}` : "0"}</span>
    <button className={styles.iconButton} type="button" disabled={count < 25 || pending} onClick={() => onChange(offset + 25)} aria-label={en ? "Next page" : "Pagina successiva"}><TrainingIcon name="arrow" /></button>
  </nav>;
}

function RecordCard({ record, en }: { record: WorkoutRecord; en: boolean }) {
  const workout = record.program.workouts[record.workout_index];
  const volume = record.sets.reduce((sum, set) => sum + set.reps * set.weight_kg, 0);
  return <article className={styles.record}>
    <span className={styles.recordIcon}><TrainingIcon name="check" /></span>
    <div className={styles.recordBody}><span className={styles.eyebrow}>{record.program.title}</span><h3>{workout?.title}</h3>
      <p><time dateTime={record.completed_at}>{new Date(record.completed_at).toLocaleString(en ? "en-GB" : "it-IT", { dateStyle: "medium", timeStyle: "short" })}</time><span> · {record.sets.length} {en ? "sets" : "serie"} · {volume.toLocaleString(en ? "en-GB" : "it-IT", { maximumFractionDigits: 1 })} kg</span></p>
      {record.notes && <p className={styles.sessionNote}>{record.notes}</p>}
      <details className={styles.setDetails}><summary>{en ? "View recorded sets" : "Vedi le serie registrate"}</summary><ul>{record.sets.map(set => <li key={`${set.exercise_index}:${set.set_number}`}><span>{workout?.exercises[set.exercise_index]?.name} · #{set.set_number}</span><strong>{set.reps} × {set.weight_kg} kg{set.rpe !== null ? ` · RPE ${set.rpe}` : ""}</strong></li>)}</ul></details>
      {record.feedback.map(feedback => <blockquote key={feedback.id} className={styles.coachNote}><span>{en ? "COACH FEEDBACK" : "FEEDBACK DEL COACH"}</span><p>{feedback.text}</p></blockquote>)}
    </div>
  </article>;
}

export function AthleteWorkspace() {
  const { session, status } = useAuth();
  const content = <PortalAccess role="athlete"><Athlete key={session?.user.id} /></PortalAccess>;
  if (status !== "authenticated" || !session?.user.roles.includes("athlete")) return <main id="training-main" className={styles.accessState}>{content}</main>;
  return <div data-athlete-workspace className={styles.access}>{content}</div>;
}

function Athlete() {
  const en = useLocale() === "en";
  const { session } = useAuth();
  const request = usePortalRequest();
  const pathname = usePathname();
  const router = useRouter();
  const view = athleteView(pathname);
  const setView = (next: View) => router.push(athleteRoutes[next]);
  const [offset, setOffset] = useState(0);
  const [assignmentOffset, setAssignmentOffset] = useState(0);
  const [utcOffset, setUtcOffset] = useState<number | null>(null);
  const dashboard = useAthleteResource<AthleteDashboard>(utcOffset === null ? null : `me/training/dashboard?locale=${en ? "en" : "it"}&utc_offset_minutes=${utcOffset}`);
  const assignments = useAthleteList<Assignment>(`me/training/assignments?offset=${assignmentOffset}`);
  const records = useAthleteList<WorkoutRecord>(`me/training/sessions?offset=${offset}`);
  const [active, setActive] = useState<{ assignment: Assignment; workout: number } | null>(null);
  const [pending, setPending] = useState(false);
  const [timer, setTimer] = useState(0);
  const [restUntil, setRestUntil] = useState<number | null>(null);
  const [programQuery, setProgramQuery] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const draftKey = `eureka-workout-draft-v1:${session?.user.id}`;
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousView = useRef(view);
  const name = session?.user.name.trim();
  const workout = active?.assignment.program.workouts[active.workout];
  const totalSets = workout?.exercises.reduce((sum, exercise) => sum + exercise.sets, 0) ?? 0;
  const enteredSets = workout?.exercises.reduce((sum, exercise, x) => sum + Array.from({ length: exercise.sets }, (_, s) => draft?.values[`reps-${x}-${s}`]).filter(value => value !== undefined && value !== "").length, 0) ?? 0;
  const feedbackRecords = records.items.filter(record => record.feedback.length);
  const primaryAssignment = assignments.items.find(assignment => assignment.id === draft?.assignment_id) ?? assignments.items[0];
  const primaryIndex = primaryAssignment && draft && primaryAssignment.id === draft.assignment_id && primaryAssignment.program.workouts[draft.workout_index] ? draft.workout_index : 0;
  const primaryWorkout = primaryAssignment?.program.workouts[primaryIndex];
  const primarySets = primaryWorkout?.exercises.reduce((sum, exercise) => sum + exercise.sets, 0) ?? 0;
  const currentNav = navigation.find(item => item.id === view)!;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && typeof saved.request_id === "string" && typeof saved.assignment_id === "string" && Number.isInteger(saved.workout_index) && saved.workout_index >= 0 && saved.values && !Array.isArray(saved.values) && typeof saved.values === "object" && Object.values(saved.values).every(value => typeof value === "string")) setDraft(saved);
      }
    } catch { /* Storage is optional; account-owned server records remain authoritative. */ }
    finally { setDraftLoaded(true); }
  }, [draftKey]);
  useEffect(() => {
    const update = () => { setUtcOffset(-new Date().getTimezoneOffset()); if (!document.hidden) dashboard.reload(); };
    setUtcOffset(-new Date().getTimezoneOffset());
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => { window.removeEventListener("focus", update); document.removeEventListener("visibilitychange", update); };
  }, [dashboard.reload]);
  useEffect(() => {
    if (restUntil === null) { setTimer(0); return; }
    const update = () => { const remaining = Math.max(0, Math.ceil((restUntil - Date.now()) / 1000)); setTimer(remaining); if (!remaining) setRestUntil(null); };
    update();
    const tick = window.setInterval(update, 500);
    return () => window.clearInterval(tick);
  }, [restUntil]);
  useEffect(() => {
    if (previousView.current !== view) headingRef.current?.focus();
    previousView.current = view;
  }, [view]);

  const saveDraft = useCallback((notifyFailure = true) => {
    if (!formRef.current || !active || !draft) return;
    const values = Object.fromEntries([...new FormData(formRef.current)].map(([key, value]) => [key, String(value)]));
    const next = { ...draft, values };
    setDraft(next);
    try { localStorage.setItem(draftKey, JSON.stringify(next)); }
    catch { if (notifyFailure) toast.error(en ? "Unable to save the workout draft on this device." : "Impossibile salvare la bozza su questo dispositivo.", { id: "workout-draft" }); }
  }, [active, draft, draftKey, en]);

  function start(assignment: Assignment, index: number) {
    if (pending || !draftLoaded) return;
    const next = draft?.assignment_id === assignment.id && draft.workout_index === index ? draft : { request_id: crypto.randomUUID(), assignment_id: assignment.id, workout_index: index, values: {} };
    if (draft && next !== draft && Object.keys(draft.values).length && !window.confirm(en ? "Replace the saved workout draft?" : "Sostituire la bozza di allenamento salvata?")) return;
    setDraft(next); setActive({ assignment, workout: index }); setRestUntil(null); setView("workout");
  }

  async function finish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!active || !draft || !workout || pending) return;
    saveDraft(false);
    const data = new FormData(event.currentTarget);
    const sets = workout.exercises.flatMap((exercise, x) => Array.from({ length: exercise.sets }, (_, s) => ({ exercise_index: x, set_number: s + 1, reps: Number(data.get(`reps-${x}-${s}`)), weight_kg: Number(data.get(`weight-${x}-${s}`)), rpe: data.get(`rpe-${x}-${s}`) ? Number(data.get(`rpe-${x}-${s}`)) : null })));
    setPending(true);
    try {
      await request("me/training/sessions", "POST", { request_id: draft.request_id, assignment_id: active.assignment.id, workout_index: active.workout, sets, notes: data.get("notes") || "" });
      try { localStorage.removeItem(draftKey); } catch { /* A stale draft retains the same idempotency key. */ }
      setActive(null); setDraft(null); setOffset(0); records.reload(); dashboard.reload(); setRestUntil(null); setView("progress");
      toast.success(en ? "Workout recorded." : "Allenamento registrato.", { id: "workout-save" });
    } catch (error) { toast.error(portalMessage(error, en), { id: "workout-save" }); }
    finally { setPending(false); }
  }

  function navItems(mobile = false) {
    return navigation.filter(item => !["settings", "profile"].includes(item.id) && (!mobile || ["home", "paths", "workout", "progress", "coach"].includes(item.id))).map(item => <Link key={item.id} href={athleteRoutes[item.id]} className={`${styles.navItem} ${view === item.id ? styles.navActive : ""}`} aria-current={view === item.id ? "page" : undefined}>
      <TrainingIcon name={item.icon} /><span>{mobile ? ({ home: "Home", paths: en ? "Paths" : "Percorsi", programs: en ? "Programs" : "Programmi", library: en ? "Exercises" : "Esercizi", workout: en ? "Workout" : "Allenamento", progress: en ? "Progress" : "Progressi", coach: "Coach", settings: en ? "Settings" : "Impostazioni", profile: en ? "Profile" : "Profilo" })[item.id] : en ? item.en : item.it}</span>
    </Link>);
  }

  function programList() {
    const query = programQuery.trim().toLocaleLowerCase();
    const filtered = assignments.items.filter(assignment => `${assignment.program.title} ${assignment.program.workouts.map(item => item.title).join(" ")}`.toLocaleLowerCase().includes(query));
    return <>
      <ListState result={assignments} empty={en ? "Your Trainer has not assigned a program yet. Your workouts will appear here when it is ready." : "Il tuo Trainer non ha ancora assegnato un programma. I tuoi allenamenti appariranno qui quando sarà pronto."} en={en} />
      {!!assignments.items.length && <label className={styles.programSearch}><TrainingIcon name="search" /><input type="search" aria-label={en ? "Search programs on this page" : "Cerca programmi in questa pagina"} placeholder={en ? "Find a program or workout…" : "Cerca un programma o allenamento…"} value={programQuery} onChange={event => setProgramQuery(event.target.value)} maxLength={120} /></label>}
      {!!assignments.items.length && !filtered.length && <p className={styles.empty}>{en ? "No matching programs on this page." : "Nessun programma corrispondente in questa pagina."}</p>}
      <div className={styles.programGrid}>{filtered.map((assignment, i) => <article key={assignment.id} className={styles.programCard}>
        <div className={styles.programTop}><span className={styles.programNumber}>{String(assignmentOffset + i + 1).padStart(2, "0")}</span><span className={styles.tag}>v{assignment.program.version}</span></div>
        <span className={styles.eyebrow}>{en ? "YOUR TRAINER’S PROGRAM" : "IL PROGRAMMA DEL TUO TRAINER"}</span><h3>{assignment.program.title}</h3>
        <p className={styles.muted}>{assignment.program.workouts.length} {en ? "workouts" : "allenamenti"} · <time dateTime={assignment.created_at}>{new Date(assignment.created_at).toLocaleDateString(en ? "en-GB" : "it-IT")}</time></p>
        <div className={styles.workoutChoices}>{assignment.program.workouts.map((item, index) => <button type="button" key={index} disabled={pending || !draftLoaded} onClick={() => start(assignment, index)}>
          <span className={styles.workoutLetter}>{String(index + 1).padStart(2, "0")}</span><span><strong>{item.title}</strong><small>{item.exercises.length} {en ? "exercises" : "esercizi"}</small></span><TrainingIcon name={draft?.assignment_id === assignment.id && draft.workout_index === index ? "play" : "arrow"} />
        </button>)}</div>
      </article>)}</div>
      <Pagination offset={assignmentOffset} count={assignments.items.length} pending={assignments.pending} onChange={setAssignmentOffset} en={en} />
    </>;
  }

  return <div className={styles.workspace}>
    <aside data-athlete-sidebar className={styles.sidebar}>
      <div className={styles.sidebarIntro}><TrainingBrand href="/athlete" /><span className={styles.eyebrow}>MOVE. LEARN. EVOLVE.</span></div>
      <nav className={styles.navigation} aria-label={en ? "Athlete navigation" : "Navigazione atleta"}>{navItems()}<Link href="/academy" className={styles.navItem}><TrainingIcon name="book" /><span>{en ? "Become a coach" : "Diventa coach"}</span><TrainingIcon name="arrow" /></Link></nav>
      <div className={styles.sidebarBottom}>
        <div className={styles.sideNote}><TrainingIcon name="dumbbell" /><strong>{en ? "Your next level starts here." : "Il tuo prossimo livello inizia qui."}</strong><p>{en ? "One session at a time. Every detail counts." : "Una sessione alla volta. Ogni dettaglio conta."}</p><button className={styles.textButton} type="button" onClick={() => setView("programs")}>{en ? "Explore your program" : "Scopri il tuo programma"}<TrainingIcon name="arrow" /></button></div>
        <Link className={`${styles.navItem} ${view === "settings" || view === "profile" ? styles.navActive : ""}`} href="/athlete/settings" aria-current={view === "settings" ? "page" : undefined}><TrainingIcon name="settings" /><span>{en ? "Settings" : "Impostazioni"}</span></Link>
        <TrainingInfoButton kind="help" className={styles.navItem}><TrainingIcon name="help" /><span>{en ? "Help & support" : "Aiuto e supporto"}</span></TrainingInfoButton>
        <div className={styles.accountLinks}><PortalSwitcher /></div>
      </div>
    </aside>
    <div className={styles.mainColumn}>
      <header className={styles.hubHeader}><div className={styles.breadcrumb}><span>EUREKA! FIT</span><span>/</span><span>{en ? currentNav.en : currentNav.it}</span></div><div className={styles.mobileTools}><span className={styles.accountBadge}><i />{en ? "ATHLETE" : "ATLETA"}</span><TrainingLanguage /><TrainingAccountMenu /></div></header>
      <header className={styles.mobileHeader}><TrainingBrand href="/athlete" /><div className={styles.mobileTools}><TrainingLanguage /><TrainingAccountMenu /></div></header>
      <main id="training-main" className={styles.main}>
        <header className={styles.pageHeading}><div><span className={styles.eyebrow}>{view === "home" ? en ? "WELCOME BACK TO YOUR SPACE" : "BENTORNATO NEL TUO SPAZIO" : "YOUR BODY. YOUR NEXT LEVEL."}</span><h1 ref={headingRef} tabIndex={-1}>{view === "home" ? <>{name ? `${name}, ` : ""}{en ? "let’s build something." : "oggi si costruisce."}<span className={styles.spark} aria-hidden="true">✳</span></> : en ? currentNav.en : currentNav.it}</h1></div><span className={styles.headingLabel}>{dashboard.data ? new Date(`${dashboard.data.local_date}T12:00:00Z`).toLocaleDateString(en ? "en-GB" : "it-IT", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" }) : "THE EUREKA WAY"}</span></header>

        {view === "home" && <>
          <AthletePathChoices result={dashboard} onTrain={() => setView("programs")} onLibrary={() => setView("library")} />
          <AthleteHero onStart={() => setView("programs")} />
          <div className={styles.energyRibbon} aria-hidden="true"><span>STRENGTH</span>✳<span>CONTROL</span>✳<span>BALANCE</span>✳<span>EUREKA! FIT</span></div>
          <AthleteDashboardNotice result={dashboard} />
          <div className={styles.trainingDeck}>
            <section className={styles.nextWorkout}><div className={styles.sectionTop}><span className={styles.eyebrow}>{en ? "YOUR NEXT MOVE" : "IL PROSSIMO PASSO È TUO"}</span><TrainingIcon name="dumbbell" /></div>
              {assignments.pending || assignments.error || !primaryWorkout ? <ListState result={assignments} empty={en ? "Your next workout will appear when your Trainer assigns a program." : "Il tuo prossimo allenamento apparirà quando il Trainer assegnerà un programma."} en={en} /> : <><span className={styles.tag}>{primaryAssignment.program.title}</span><h2>{primaryWorkout.title}</h2><div className={styles.workoutFacts}><span><TrainingIcon name="dumbbell" />{primaryWorkout.exercises.length} {en ? "exercises" : "esercizi"}</span><span><TrainingIcon name="check" />{primarySets} {en ? "sets" : "serie"}</span></div><button className={styles.primary} type="button" disabled={pending || !draftLoaded} onClick={() => start(primaryAssignment, primaryIndex)}>{draft?.assignment_id === primaryAssignment.id && draft.workout_index === primaryIndex ? en ? "Resume workout" : "Riprendi allenamento" : en ? "Start workout" : "Inizia allenamento"}<TrainingIcon name="play" /></button></>}
            </section>
            <section className={styles.journalTeaser}><span className={styles.eyebrow}>TRAINING JOURNAL</span><TrainingIcon name="chart" /><h2>{en ? "Every session.\nA step forward." : "Ogni sessione.\nUn passo avanti."}</h2><p>{en ? "Your recorded sets, session notes and your coach’s feedback, together." : "Le serie registrate, le note della sessione e i feedback del coach, insieme."}</p><button className={styles.textButton} type="button" onClick={() => setView("progress")}>{en ? "See your progress" : "Vedi i tuoi progressi"}<TrainingIcon name="arrow" /></button></section>
          </div>
          <AthleteActivity result={dashboard} />
          <AthleteMetrics result={dashboard} />
          <AthleteCourses result={dashboard} />
        </>}

        {view === "paths" && <><AthleteDashboardNotice result={dashboard} /><AthletePathChoices result={dashboard} onTrain={() => setView("programs")} onLibrary={() => setView("library")} /><AthleteCourses result={dashboard} /><div className={styles.sectionIntro}><span className={styles.eyebrow}>YOUR TRAINING PATHS</span><h2>{en ? "Continue with your Trainer." : "Continua con il tuo Trainer."}</h2></div>{programList()}</>}

        {view === "library" && <><ListState result={assignments} empty={en ? "Your exercise library will appear when your Trainer assigns a program." : "La tua libreria esercizi apparirà quando il Trainer assegnerà un programma."} en={en} />{!!assignments.items.length && <AthleteExerciseLibrary assignments={assignments.items} pending={pending || !draftLoaded} onStart={start} />}<Pagination offset={assignmentOffset} count={assignments.items.length} pending={assignments.pending} onChange={setAssignmentOffset} en={en} /></>}

        {view === "programs" && <section aria-label={en ? "Assigned programs" : "Programmi assegnati"}><div className={styles.sectionIntro}><span className={styles.eyebrow}>BUILT FOR YOU</span><h2>{en ? "Your program. Your pace." : "Il tuo programma. Il tuo ritmo."}</h2><p>{en ? "Choose a workout from the program your Trainer has assigned." : "Scegli un allenamento dal programma assegnato dal tuo Trainer."}</p></div>{programList()}</section>}

        {view === "workout" && !active && <section className={styles.workoutWelcome}><span className={styles.eyebrow}>LET’S GET MOVING</span><h2>{en ? "Make your next move." : "Fai il prossimo passo."}</h2><p>{en ? "Choose your session. Record your sets. Build your progress." : "Scegli la sessione. Registra le serie. Costruisci i tuoi progressi."}</p>{programList()}</section>}

        {/* Keep the form mounted while changing views so typed set values stay intact. */}
        {active && workout && draft && <div hidden={view !== "workout"}>
          <form ref={formRef} key={`${active.assignment.id}:${active.workout}`} className={styles.workoutLayout} onChange={() => saveDraft()} onSubmit={finish} onInvalidCapture={event => { event.preventDefault(); event.currentTarget.querySelector<HTMLElement>(":invalid")?.focus(); toast.error(en ? "Check the required fields and values." : "Controlla i campi obbligatori e i valori.", { id: "workout-save" }); }} aria-busy={pending}>
            <div className={styles.exerciseColumn}><section className={styles.workoutOverview}><span className={styles.tag}>{active.assignment.program.title} · v{active.assignment.program.version}</span><h2>{workout.title}</h2><div className={styles.workoutFacts}><span><TrainingIcon name="dumbbell" />{workout.exercises.length} {en ? "exercises" : "esercizi"}</span><span><TrainingIcon name="check" />{totalSets} {en ? "sets" : "serie"}</span></div><label className={styles.progressLabel} htmlFor="athlete-set-progress"><span>{en ? "Sets entered" : "Serie compilate"}</span><strong>{enteredSets} / {totalSets}</strong></label><progress id="athlete-set-progress" className={styles.progress} value={enteredSets} max={Math.max(1, totalSets)} /></section>
              <div className={styles.exerciseHeading}><span>{en ? "YOUR EXERCISES" : "I TUOI ESERCIZI"}</span><span>{en ? "QUALITY BEFORE QUANTITY" : "QUALITÀ PRIMA DELLA QUANTITÀ"}</span></div>
              {workout.exercises.map((exercise, x) => <fieldset className={styles.exercise} key={x} disabled={pending}><legend><span className={styles.exerciseNumber}>{String(x + 1).padStart(2, "0")}</span><span><strong>{exercise.name}</strong><small>{exercise.sets} {en ? "sets" : "serie"} · {exercise.reps}</small></span></legend>
                <div className={styles.setRows}>{Array.from({ length: exercise.sets }, (_, s) => <div key={s} className={styles.setRow}><span className={styles.setNumber}>#{s + 1}</span><label>{en ? "Reps" : "Rip."}<input type="number" inputMode="numeric" name={`reps-${x}-${s}`} aria-label={`${exercise.name}, ${en ? "set" : "serie"} ${s + 1}, ${en ? "repetitions" : "ripetizioni"}`} defaultValue={draft.values[`reps-${x}-${s}`] ?? ""} min={0} max={1000} required /></label><label>kg<input type="number" inputMode="decimal" name={`weight-${x}-${s}`} aria-label={`${exercise.name}, ${en ? "set" : "serie"} ${s + 1}, kg`} defaultValue={draft.values[`weight-${x}-${s}`] ?? "0"} min={0} max={1500} step="0.1" required /></label><label>RPE<input type="number" inputMode="decimal" name={`rpe-${x}-${s}`} aria-label={`${exercise.name}, ${en ? "set" : "serie"} ${s + 1}, RPE`} defaultValue={draft.values[`rpe-${x}-${s}`] ?? ""} min={0} max={10} step="0.5" /></label></div>)}</div>
                <button className={styles.restButton} type="button" onClick={() => setRestUntil(Date.now() + exercise.rest_seconds * 1000)}><TrainingIcon name="clock" />{en ? "Start rest" : "Avvia recupero"}<strong>{exercise.rest_seconds}s</strong></button>
              </fieldset>)}
              <div className={styles.finishBar}><span>{en ? "Make every rep count." : "Dai valore a ogni ripetizione."}</span><button className={styles.primary} type="submit" disabled={pending}>{pending ? en ? "Saving…" : "Salvataggio…" : en ? "Complete workout" : "Completa allenamento"}<TrainingIcon name="check" /></button></div>
            </div>
            <aside className={styles.workoutAside}><section className={styles.timerCard}><span className={styles.eyebrow}>{en ? "TAKE A BREATH" : "PRENDI FIATO"}</span><div role="timer" aria-label={en ? "Rest remaining" : "Recupero rimanente"}>{Math.floor(timer / 60).toString().padStart(2, "0")}<span>:</span>{(timer % 60).toString().padStart(2, "0")}</div><p>{en ? "Start your recovery from an exercise." : "Avvia il recupero da un esercizio."}</p><button className={styles.textButton} type="button" disabled={!timer} onClick={() => setRestUntil(null)}>{en ? "End rest" : "Termina recupero"}<TrainingIcon name="close" /></button></section>
              <section className={styles.notesCard}><span className={styles.eyebrow}>TRAINING JOURNAL</span><label htmlFor="athlete-session-notes">{en ? "Your session notes" : "Le note della sessione"}</label><textarea id="athlete-session-notes" name="notes" defaultValue={draft.values.notes ?? ""} maxLength={4000} rows={6} disabled={pending} placeholder={en ? "How did it feel? What would you like your coach to know?" : "Come ti sei sentito? Cosa vorresti far sapere al coach?"} /><p>RPE: {en ? "effort from 0 to 10 (optional). Use 0 kg for bodyweight sets." : "sforzo da 0 a 10 (facoltativo). Usa 0 kg per le serie a corpo libero."}</p></section>
              <section className={styles.qualityCard}><TrainingIcon name="check" /><h3>{en ? "Control comes first." : "Prima il controllo."}</h3><p>{en ? "Take your time. Follow your Trainer’s prescription and focus on your technique." : "Prenditi il tuo tempo. Segui le indicazioni del Trainer e concentrati sulla tecnica."}</p></section>
            </aside>
          </form>
        </div>}

        {view === "progress" && <section><div className={styles.sectionIntro}><span className={styles.eyebrow}>YOUR WORK, RECORDED</span><h2>{en ? "Small steps. Real progress." : "Piccoli passi. Progressi reali."}</h2><p>{en ? "Your full training history, with recorded workouts and weekly activity." : "Tutto il tuo storico, con gli allenamenti registrati e l’attività settimanale."}</p></div>
          <AthleteDashboardNotice result={dashboard} /><AthleteMetrics result={dashboard} /><AthleteActivity result={dashboard} chart />
          <div className={styles.sectionTop}><h2>{en ? "Your training journal" : "Il tuo diario di allenamento"}</h2><button className={styles.textButton} type="button" onClick={() => { records.reload(); dashboard.reload(); }} disabled={records.pending || dashboard.pending}>{en ? "Refresh" : "Aggiorna"}<TrainingIcon name="arrow" /></button></div>
          <ListState result={records} empty={en ? "Your first recorded workout starts your story. Choose a program and get moving." : "Il primo allenamento registrato dà inizio alla tua storia. Scegli un programma e comincia."} en={en} />
          <div className={styles.history}>{records.items.map(record => <RecordCard key={record.id} record={record} en={en} />)}</div>
          <Pagination offset={offset} count={records.items.length} pending={records.pending} onChange={setOffset} en={en} />
        </section>}

        {view === "coach" && <section><div className={styles.coachBanner}><span className={styles.eyebrow}>STRONGER, TOGETHER</span><h2>{en ? "Your work.\nYour coach’s perspective." : "Il tuo impegno.\nLo sguardo del coach."}</h2><p>{en ? "Read your Trainer’s feedback alongside the session it belongs to." : "Leggi i feedback del Trainer insieme alla sessione a cui si riferiscono."}</p><TrainingIcon name="message" /></div><AthleteDashboardNotice result={dashboard} /><AthleteCoaches result={dashboard} />
          <div className={styles.sectionTop}><h2>{en ? "Session feedback" : "Feedback delle sessioni"}</h2><button className={styles.textButton} type="button" onClick={() => { records.reload(); dashboard.reload(); }} disabled={records.pending || dashboard.pending}>{en ? "Refresh" : "Aggiorna"}<TrainingIcon name="arrow" /></button></div><p className={styles.muted}>{en ? "Comments from sessions on this history page." : "Commenti delle sessioni in questa pagina dello storico."}</p>
          <ListState result={{ ...records, items: feedbackRecords }} empty={en ? "No coach feedback on this page yet. Check other history pages or come back after your Trainer’s review." : "Nessun feedback del coach in questa pagina. Controlla le altre pagine dello storico o torna dopo la revisione del Trainer."} en={en} />
          <div className={styles.history}>{feedbackRecords.map(record => <RecordCard key={record.id} record={record} en={en} />)}</div>
          <Pagination offset={offset} count={records.items.length} pending={records.pending} onChange={setOffset} en={en} />
        </section>}

        {view === "settings" && <AthleteSettings />}
        {view === "profile" && <AthleteProfile />}
        <footer className={styles.pageFooter}><span>EUREKA! <strong>FIT</strong></span><span>YOUR BODY. YOUR NEXT LEVEL.</span><Link href="/athlete/settings">{en ? "Your settings" : "Le tue impostazioni"}<TrainingIcon name="arrow" /></Link></footer>
      </main>
    </div>
    <nav className={styles.mobileNav} aria-label={en ? "Athlete navigation" : "Navigazione atleta"}>{navItems(true)}</nav>
  </div>;
}
