"use client";

import Image from "next/image";
import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/routing";
import { TrainingIcon } from "@/components/features/training-app/TrainingIcon";
import { TrainingLoader } from "@/components/features/training-app/TrainingLoader";
import { portalMessage, type Assignment, type AthleteDashboard } from "@/lib/api/portal";
import styles from "./athlete-hub.module.css";

export interface DashboardResult { data: AthleteDashboard | null; pending: boolean; error: unknown; reload: () => void }
const slides = [
  { photo: "bodyweight", it: ["DOMINA", "IL TUO", "CORPO."], en: ["MASTER", "YOUR", "BODY."], title: ["Controllo", "Control"] },
  { photo: "gym", it: ["COSTRUISCI", "LA TUA", "FORZA."], en: ["BUILD", "YOUR", "STRENGTH."], title: ["Forza", "Strength"] },
  { photo: "mobility", it: ["TROVA", "IL TUO", "EQUILIBRIO."], en: ["FIND", "YOUR", "BALANCE."], title: ["Equilibrio", "Balance"] },
];

function dateLabel(date: string, en: boolean, long = false) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString(en ? "en-GB" : "it-IT", { timeZone: "UTC", ...(long ? { weekday: "long", day: "numeric", month: "long" } : { weekday: "short" }) });
}

export function AthleteDashboardNotice({ result }: { result: DashboardResult }) {
  const en = useLocale() === "en";
  if (result.pending && !result.data) return <TrainingLoader compact label={en ? "Loading your training hub…" : "Caricamento del tuo spazio allenamento…"} />;
  if (!result.error) return null;
  return <div className={styles.notice}><p>{portalMessage(result.error, en)}</p><button type="button" onClick={result.reload}>{en ? "Retry dashboard" : "Riprova il riepilogo"}<TrainingIcon name="arrow" /></button></div>;
}

export function AthletePathChoices({ result, onTrain, onLibrary }: { result: DashboardResult; onTrain: () => void; onLibrary: () => void }) {
  const en = useLocale() === "en";
  const data = result.data;
  return <section className={styles.paths} aria-label={en ? "Choose your path" : "Scegli il tuo percorso"}>
    <div className={styles.sectionHeading}><span className={styles.eyebrow}>EUREKA! FIT / TWO WAYS TO EVOLVE</span><h2>{en ? "Two paths. A new version of you." : "Due percorsi. Una nuova versione di te."}</h2></div>
    <div className={styles.pathGrid}>
      <Link href="/academy" className={styles.educationPath}><span className={styles.eyebrow}>{en ? "01 / EDUCATION" : "01 / FORMAZIONE"}</span><h3>{en ? "BECOME\nA COACH." : "DIVENTA\nUN COACH."}</h3><p>{en ? "Explore professional education.\nLearn the method. Develop your expertise." : "Esplora la formazione professionale.\nImpara il metodo. Sviluppa le tue competenze."}</p><div className={styles.pathFooter}><strong>{data ? `${data.education_count} ${en ? "education paths" : "percorsi formativi"}` : en ? "Explore education" : "Scopri la formazione"}</strong><TrainingIcon name="arrow" /></div><span className={styles.pathSpark} aria-hidden="true">✳</span></Link>
      <button className={styles.trainingPath} type="button" onClick={onTrain}><Image src="/images/fit/gym.webp" alt="" fill sizes="(min-width: 900px) 38vw, 100vw" className={styles.pathPhoto} /><span className={styles.eyebrow}>{en ? "02 / TRAINING APP" : "02 / APP DI ALLENAMENTO"}</span><h3>{en ? "TRAIN.\nEVOLVE." : "ALLENATI.\nEVOLVI."}</h3><p>{en ? "Your Trainer’s programs.\nWorkouts, recorded progress and personal feedback." : "I programmi del tuo Trainer.\nAllenamenti, progressi registrati e feedback personali."}</p><div className={styles.pathFooter}><strong>{data ? `${data.assigned_programs} ${en ? "assigned programs" : "programmi assegnati"}` : en ? "Your training space" : "Il tuo spazio allenamento"}</strong><TrainingIcon name="arrow" /></div></button>
    </div><button className={styles.libraryLink} type="button" onClick={onLibrary}><TrainingIcon name="search" />{en ? "Explore exercises in your programs" : "Esplora gli esercizi dei tuoi programmi"}<TrainingIcon name="arrow" /></button>
  </section>;
}

export function AthleteHero({ onStart }: { onStart: () => void }) {
  const en = useLocale() === "en";
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [inView, setInView] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const pointer = useRef<number | null>(null);
  const slide = slides[index];
  const words = en ? slide.en : slide.it;
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPlaying(!motion.matches);
    const update = () => { if (motion.matches) setPlaying(false); };
    motion.addEventListener("change", update);
    return () => motion.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!playing || hovered || !inView) return;
    const interval = window.setInterval(() => { if (!document.hidden) setIndex(current => (current + 1) % slides.length); }, 6000);
    return () => window.clearInterval(interval);
  }, [playing, hovered, inView]);
  useEffect(() => {
    if (!heroRef.current) return;
    const observer = new IntersectionObserver(entries => setInView(entries.some(entry => entry.isIntersecting)), { threshold: .15 });
    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);
  function select(next: number) { setIndex((next + slides.length) % slides.length); setPlaying(false); }
  return <section ref={heroRef} className={styles.hero} aria-roledescription="carousel" aria-label={en ? "The Eureka way" : "Il metodo Eureka"}
    onPointerEnter={event => { if (event.pointerType === "mouse") setHovered(true); }} onPointerLeave={() => setHovered(false)}
    onFocusCapture={() => setPlaying(false)} onKeyDown={event => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); select(index + (event.key === "ArrowRight" ? 1 : -1)); } }}
    onPointerDown={event => { if (event.pointerType === "touch") pointer.current = event.clientX; }}
    onPointerUp={event => { if (pointer.current !== null && Math.abs(event.clientX - pointer.current) > 50) select(index + (event.clientX < pointer.current ? 1 : -1)); pointer.current = null; }}
    onPointerCancel={() => { pointer.current = null; }}>
    <Image key={slide.photo} src={`/images/fit/${slide.photo}.webp`} alt="" fill sizes="(min-width: 1600px) 1200px, (min-width: 900px) 78vw, 100vw" loading="eager" fetchPriority={index === 0 ? "high" : "auto"} className={styles.heroPhoto} />
    <div className={styles.heroCopy}><span className={styles.eyebrow}><i /> THE EUREKA WAY</span><h2>{words[0]}<span className={styles.outline}>{words[1]}</span><span>{words[2]}</span></h2><p>{en ? "Control is built. One workout at a time." : "Il controllo si costruisce. Un allenamento alla volta."}</p><button className={styles.primary} type="button" onClick={onStart}>{en ? "START YOUR JOURNEY" : "INIZIA IL TUO PERCORSO"}<TrainingIcon name="arrow" /></button></div>
    <span className={styles.heroIndex} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
    <div className={styles.heroBottom}><span>YOUR BODY. YOUR NEXT LEVEL.</span><div className={styles.heroTabs}>{slides.map((item, i) => <button key={item.photo} type="button" aria-pressed={i === index} onClick={() => select(i)} aria-label={`${i + 1}: ${item.title[en ? 1 : 0]}`}><small>{String(i + 1).padStart(2, "0")}</small><strong>{item.title[en ? 1 : 0]}</strong><i /></button>)}</div><button className={styles.playButton} type="button" aria-label={playing ? en ? "Pause carousel" : "Ferma carosello" : en ? "Play carousel" : "Avvia carosello"} aria-pressed={playing} onClick={() => setPlaying(value => !value)}><TrainingIcon name={playing ? "pause" : "play"} /></button></div>
  </section>;
}

export function AthleteMetrics({ result }: { result: DashboardResult }) {
  const en = useLocale() === "en";
  return <div className={styles.metrics}>{[
    { icon: "dumbbell" as const, label: en ? "Workouts recorded" : "Allenamenti registrati", value: result.data?.total_sessions, detail: en ? "Your full training history" : "Tutto il tuo storico" },
    { icon: "calendar" as const, label: en ? "This month" : "Questo mese", value: result.data?.month_sessions, detail: en ? "Sessions completed" : "Sessioni completate" },
    { icon: "message" as const, label: en ? "Coach feedback" : "Feedback del coach", value: result.data?.feedback_count, detail: en ? "Comments on your sessions" : "Commenti sulle tue sessioni" },
  ].map(item => <div key={item.icon}><span><TrainingIcon name={item.icon} />{item.label}</span><strong>{item.value ?? "—"}</strong><small>{item.detail}</small></div>)}</div>;
}

export function AthleteActivity({ result, chart = false }: { result: DashboardResult; chart?: boolean }) {
  const en = useLocale() === "en";
  const data = result.data;
  if (!data) return null;
  const max = Math.max(1, ...data.weekly_activity.map(week => week.sessions));
  return <section className={styles.activity}><div className={styles.sectionHeading}><div><span className={styles.eyebrow}>{chart ? "CONSISTENCY, BUILT BY YOU" : en ? "FIND YOUR RHYTHM" : "TROVA IL TUO RITMO"}</span><h2>{chart ? en ? "Eight weeks of your work." : "Otto settimane del tuo impegno." : en ? "Your week at a glance." : "La tua settimana, a colpo d’occhio."}</h2></div><span className={styles.weekCount}><strong>{data.week_sessions}</strong>{en ? "sessions this week" : "sessioni questa settimana"}</span></div>
    {chart ? <div className={styles.chart}>{data.weekly_activity.map(week => <div className={styles.chartColumn} key={week.date}><strong>{week.sessions}</strong><div className={styles.barTrack}><span style={{ height: `${week.sessions / max * 100}%` }} /></div><time dateTime={week.date}>{new Date(`${week.date}T12:00:00Z`).toLocaleDateString(en ? "en-GB" : "it-IT", { timeZone: "UTC", day: "numeric", month: "short" })}</time></div>)}</div> : <div className={styles.week}>{data.week_days.map(day => <div key={day.date} className={`${styles.day} ${day.date === data.local_date ? styles.today : ""} ${day.sessions ? styles.trained : ""}`} aria-label={`${dateLabel(day.date, en, true)}: ${day.sessions} ${en ? "sessions" : "sessioni"}`} aria-current={day.date === data.local_date ? "date" : undefined}><span>{dateLabel(day.date, en)}</span><strong>{Number(day.date.slice(-2))}</strong><span className={styles.dayMark}>{day.sessions ? <TrainingIcon name="check" /> : <i />}</span></div>)}</div>}
    <p className={styles.footnote}>{en ? "Recorded workouts, grouped by your local dates." : "Allenamenti registrati, raggruppati per le tue date locali."}</p>
  </section>;
}

export function AthleteCourses({ result }: { result: DashboardResult }) {
  const en = useLocale() === "en";
  if (!result.data?.education.length) return null;
  return <section className={styles.courses}><div className={styles.sectionHeading}><div><span className={styles.eyebrow}>ACADEMY / KEEP EVOLVING</span><h2>{en ? "Learn the method." : "Impara il metodo."}</h2></div><Link href="/academy/corsi">{en ? "All education paths" : "Tutti i percorsi"}<TrainingIcon name="arrow" /></Link></div><div className={styles.courseGrid}>{result.data.education.map(course => <Link href={{ pathname: "/academy/corsi/[slug]", params: { slug: course.slug } }} key={course.slug} className={styles.courseCard}><TrainingIcon name="book" /><span className={styles.eyebrow}>{course.category} / {en ? "LEVEL" : "LIVELLO"} {course.level}</span><h3>{course.title}</h3><p>{course.modules} {en ? "modules" : "moduli"} · {course.lessons} {en ? "lessons" : "lezioni"}</p><span>{en ? "Explore the course" : "Scopri il corso"}<TrainingIcon name="arrow" /></span></Link>)}</div></section>;
}

export function AthleteCoaches({ result }: { result: DashboardResult }) {
  const en = useLocale() === "en";
  if (!result.data) return null;
  return <section className={styles.coaches}><span className={styles.eyebrow}>{en ? "YOUR TRAINING TEAM" : "IL TUO TEAM DI ALLENAMENTO"}</span>{result.data.coaches.length ? <div>{result.data.coaches.map(coach => <article className={styles.coachCard} key={coach.id}><span>{coach.name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase()}</span><div><h3>{coach.name}</h3><p>{en ? "Assigned Trainer" : "Trainer assegnato"}</p></div><TrainingIcon name="check" /></article>)}</div> : <p className={styles.footnote}>{en ? "No Trainer is currently linked to your account. Your training team will appear here once assigned." : "Nessun Trainer è attualmente collegato al tuo account. Il tuo team apparirà qui dopo l’assegnazione."}</p>}</section>;
}

export function AthleteExerciseLibrary({ assignments, pending, onStart }: { assignments: Assignment[]; pending: boolean; onStart: (assignment: Assignment, index: number) => void }) {
  const en = useLocale() === "en";
  const [query, setQuery] = useState("");
  const [program, setProgram] = useState("");
  const normalized = query.trim().toLocaleLowerCase();
  const exercises = assignments.flatMap(assignment => assignment.program.workouts.flatMap((workout, index) => workout.exercises.map((exercise, x) => ({ assignment, workout, index, exercise, x })))).filter(item => (!program || item.assignment.id === program) && `${item.exercise.name} ${item.workout.title} ${item.assignment.program.title}`.toLocaleLowerCase().includes(normalized));
  return <section className={styles.library}><div className={styles.sectionHeading}><div><span className={styles.eyebrow}>EXERCISE LAB / YOUR PROGRAMS</span><h2>{en ? "Know your next move." : "Conosci il tuo prossimo movimento."}</h2></div></div><p className={styles.footnote}>{en ? "Exercise prescriptions from the programs on this page. Open a workout to record your sets." : "Le indicazioni degli esercizi dei programmi in questa pagina. Apri un allenamento per registrare le serie."}</p><div className={styles.filters}><label><TrainingIcon name="search" /><span className={styles.srOnly}>{en ? "Search exercises" : "Cerca esercizi"}</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={en ? "Search exercises, workouts…" : "Cerca esercizi, allenamenti…"} maxLength={120} /></label><label><span className={styles.srOnly}>{en ? "Filter by program" : "Filtra per programma"}</span><select value={program} onChange={event => setProgram(event.target.value)}><option value="">{en ? "All programs on this page" : "Tutti i programmi della pagina"}</option>{assignments.map(assignment => <option value={assignment.id} key={assignment.id}>{assignment.program.title} · v{assignment.program.version}</option>)}</select></label></div><p className={styles.resultCount} role="status">{exercises.length} {en ? "exercise prescriptions" : "indicazioni di esercizi"}</p><div className={styles.exerciseGrid}>{exercises.map(item => <article className={styles.exerciseCard} key={`${item.assignment.id}:${item.index}:${item.x}`}><div><span className={styles.eyebrow}>{item.assignment.program.title}</span><h3>{item.exercise.name}</h3><p>{item.workout.title}</p></div><dl><div><dt>{en ? "Sets" : "Serie"}</dt><dd>{item.exercise.sets}</dd></div><div><dt>{en ? "Reps / dose" : "Rip. / dose"}</dt><dd>{item.exercise.reps}</dd></div><div><dt>{en ? "Rest" : "Recupero"}</dt><dd>{item.exercise.rest_seconds}s</dd></div></dl><button type="button" disabled={pending} onClick={() => onStart(item.assignment, item.index)}>{en ? "Open workout" : "Apri allenamento"}<TrainingIcon name="arrow" /></button></article>)}</div>{!exercises.length && <p className={styles.notice}>{en ? "No matching exercises on this program page. Try another search or browse other pages." : "Nessun esercizio corrispondente in questa pagina. Prova un’altra ricerca o esplora le altre pagine."}</p>}</section>;
}
