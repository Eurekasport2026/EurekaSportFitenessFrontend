"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { Link } from "@/i18n/routing";
import { useTrainerResource } from "@/hooks/use-trainer-resource";
import { PortalError, portalMessage } from "@/lib/api/portal";
import { safeResourceHref, trainerCourseHref, trainerItemHref, trainerModuleHref, trainerVideoEmbed,
  type CourseResource, type TrainerCourseDetail, type TrainerCoursePage, type TrainerModuleDetail } from "@/lib/training/trainer-courses";
import { TrainingIcon } from "@/components/features/training-app/TrainingIcon";
import { TrainingLoader } from "@/components/features/training-app/TrainingLoader";
import styles from "./trainer-courses.module.css";

function Recovery({ error, retry }: { error: unknown; retry: () => void }) {
  const en = useLocale() === "en";
  return <div className={styles.recovery}><TrainingIcon name="help" /><h2>{error instanceof PortalError && error.status === 404 ? en ? "This course content is unavailable." : "Questo contenuto non è disponibile." : en ? "Your courses could not be loaded." : "Impossibile caricare i corsi."}</h2><p>{portalMessage(error, en)}</p><div className={styles.actions}><button className={styles.secondary} onClick={retry} type="button">{en ? "Try again" : "Riprova"}</button><Link className={styles.primary} href="/trainer/courses">{en ? "All courses" : "Tutti i corsi"}</Link></div></div>;
}

export function TrainerCourseCatalog() {
  const locale = useLocale();
  const en = locale === "en";
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const result = useTrainerResource<TrainerCoursePage>(`trainer/courses?locale=${locale}&q=${encodeURIComponent(search)}&offset=${offset}`);
  return <div className={styles.content}>
    <header className={styles.hero}><div><span className={styles.eyebrow}>{en ? "TRAINING COURSES" : "CORSI DI FORMAZIONE"}</span><h1>{en ? "Learn the method.\nLead the session." : "Impara il metodo.\nGuida l’allenamento."}</h1><p>{en ? "Your course library, organised into modules and exercises. Explore available videos and PDFs in Italian and English." : "La tua libreria di corsi, organizzata in moduli ed esercizi. Esplora video e PDF disponibili in italiano e inglese."}</p></div><div className={styles.heroMark} aria-hidden="true"><TrainingIcon name="book" /><span>LEARN.<br />PRACTISE.<br /><em>EVOLVE.</em></span></div></header>
    <form className={styles.search} onSubmit={event => { event.preventDefault(); setSearch(query.trim()); setOffset(0); }}><TrainingIcon name="search" /><label className={styles.srOnly} htmlFor="trainer-course-search">{en ? "Search training courses" : "Cerca corsi di formazione"}</label><input id="trainer-course-search" type="search" value={query} maxLength={120} placeholder={en ? "Find your next course…" : "Trova il tuo prossimo corso…"} onChange={event => setQuery(event.target.value)} /><button className={styles.secondary} type="submit">{en ? "Search" : "Cerca"}</button></form>
    {result.error && <Recovery error={result.error} retry={result.reload} />}
    {!result.data && result.pending && <TrainingLoader />}
    {result.data && <><div className={styles.sectionHeading}><h2>{en ? "Your training library" : "La tua libreria formativa"}</h2><span>{result.data.total} {en ? "courses" : "corsi"}</span></div><div className={styles.courseGrid}>{result.data.items.map(course => <Link key={course.slug} href={trainerCourseHref(course.slug)} className={styles.courseCard}><div className={styles.courseTop}><span className={styles.tag}>{course.category}</span><TrainingIcon name="book" /></div><span className={styles.eyebrow}>{en ? "LEVEL" : "LIVELLO"} {course.level}</span><h2>{course.title}</h2>{course.description && <p>{course.description}</p>}<div className={styles.facts}><span><TrainingIcon name="book" />{course.module_count} {en ? "modules" : "moduli"}</span><span><TrainingIcon name="play" />{course.item_count} {en ? "learning items" : "contenuti"}</span></div><div className={styles.cardFooter}><strong>{en ? "Explore course" : "Esplora il corso"}</strong><TrainingIcon name="arrow" /></div></Link>)}</div>{!result.data.items.length && <div className={styles.empty}><TrainingIcon name="search" /><h2>{en ? "No courses found." : "Nessun corso trovato."}</h2><p>{search ? en ? "Try another title or clear your search." : "Prova un altro titolo o cancella la ricerca." : en ? "Published courses will appear here when available." : "I corsi pubblicati saranno mostrati qui quando disponibili."}</p></div>}<nav className={styles.pager} aria-label={en ? "Course pages" : "Pagine dei corsi"}><button type="button" className={styles.secondary} disabled={!offset || result.pending} onClick={() => setOffset(value => Math.max(0, value - result.data!.limit))}>{en ? "Previous" : "Precedente"}</button><span>{result.data.items.length ? `${offset + 1}–${offset + result.data.items.length}` : "0"} / {result.data.total}</span><button type="button" className={styles.secondary} disabled={offset + result.data.items.length >= result.data.total || result.pending} onClick={() => setOffset(value => value + result.data!.limit)}>{en ? "Next" : "Successiva"}</button></nav></>}
  </div>;
}

export function TrainerCourseOverview({ slug }: { slug: string }) {
  const locale = useLocale();
  const en = locale === "en";
  const result = useTrainerResource<TrainerCourseDetail>(`trainer/courses/${encodeURIComponent(slug)}?locale=${locale}`);
  if (!result.data) return result.error ? <Recovery error={result.error} retry={result.reload} /> : <TrainingLoader />;
  const { course, modules } = result.data;
  return <div className={styles.content}><nav className={styles.breadcrumb} aria-label={en ? "Breadcrumb" : "Percorso"}><Link href="/trainer/courses">{en ? "Training courses" : "Corsi di formazione"}</Link><span>/</span><span aria-current="page">{course.title}</span></nav><header className={styles.courseHeading}><span className={styles.eyebrow}>{course.category} / {en ? "LEVEL" : "LIVELLO"} {course.level}</span><h1>{course.title}</h1><p>{course.description}</p></header>{result.error && <Recovery error={result.error} retry={result.reload} />}<div className={styles.sectionHeading}><h2>{en ? "Your course, module by module." : "Il tuo corso, modulo per modulo."}</h2><span>{modules.length} {en ? "modules" : "moduli"}</span></div><div className={styles.moduleGrid}>{modules.map(module => <Link className={styles.moduleCard} key={module.id} href={trainerModuleHref(slug, module.id)}><span className={styles.moduleNumber}>{String(module.number).padStart(2, "0")}</span><div><span className={styles.eyebrow}>{en ? "MODULE" : "MODULO"} {module.number}</span><h2>{module.title}</h2><p>{module.description}</p><span className={styles.moduleMeta}>{module.item_count ? `${module.item_count} ${en ? "lessons & exercises" : "lezioni ed esercizi"}` : en ? "Module materials" : "Materiali del modulo"}</span></div><TrainingIcon name="arrow" /></Link>)}</div>{!modules.length && <p className={styles.empty}>{en ? "No modules have been published for this course yet." : "Nessun modulo ancora pubblicato per questo corso."}</p>}</div>;
}

function ResourceGroups({ resources, selected, onSelect }: { resources: CourseResource[]; selected: string | null; onSelect: (resource: CourseResource) => void }) {
  const en = useLocale() === "en";
  function rows(items: CourseResource[], kind: "video" | "pdf", language?: string) {
    const matching = items.filter(resource => resource.kind === kind);
    return <div className={styles.resourceType}><h4><TrainingIcon name={kind === "video" ? "play" : "book"} />{kind === "video" ? en ? "Videos" : "Video" : "PDF"}<span>{matching.length}</span></h4>{matching.map(resource => <button key={resource.id} type="button" className={styles.resourceButton} aria-pressed={selected === resource.id} onClick={() => onSelect(resource)}><span lang={resource.language ?? undefined}>{resource.title}</span><span className={styles.srOnly}>{language ? ` · ${language}` : ""} · {kind === "pdf" ? en ? "Open PDF" : "Apri PDF" : en ? "Watch video" : "Guarda video"}</span><TrainingIcon name={kind === "video" ? "play" : "arrow"} /></button>)}{!matching.length && <p className={styles.unavailable}>{kind === "video" ? en ? "No videos added yet." : "Nessun video ancora aggiunto." : en ? "No PDFs added yet." : "Nessun PDF ancora aggiunto."}</p>}</div>;
  }
  const originals = resources.filter(resource => resource.language === null);
  return <div className={styles.resources}><div className={styles.languageGrid}>{(["it", "en"] as const).map(language => <section className={styles.languageCard} key={language}><header><span className={styles.languageCode}>{language.toUpperCase()}</span><h3 lang={language}>{language === "it" ? "Italiano" : "English"}</h3></header>{rows(resources.filter(resource => resource.language === language), "video", language === "it" ? "Italiano" : "English")}{rows(resources.filter(resource => resource.language === language), "pdf", language === "it" ? "Italiano" : "English")}</section>)}</div>{originals.length > 0 && <section className={styles.originals}><h3>{en ? "Original materials" : "Materiali originali"}</h3><p>{en ? "The language of these existing files has not been specified." : "La lingua di questi file esistenti non è stata specificata."}</p>{rows(originals, "video")}{rows(originals, "pdf")}</section>}</div>;
}

function ResourceViewer({ resource }: { resource: CourseResource }) {
  const en = useLocale() === "en";
  const heading = useRef<HTMLHeadingElement>(null);
  const href = safeResourceHref(resource.url);
  const embed = resource.kind === "video" ? trainerVideoEmbed(resource.url) : null;
  const directVideo = href && /\.(mp4|webm|ogg)(?:[?#]|$)/i.test(href);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView({ block: "nearest" }); }, []);
  return <section className={styles.viewer}><div className={styles.viewerHeading}><div><span className={styles.eyebrow}>{resource.kind.toUpperCase()} / {resource.language?.toUpperCase() ?? (en ? "ORIGINAL" : "ORIGINALE")}</span><h2 ref={heading} tabIndex={-1} lang={resource.language ?? undefined}>{resource.title}</h2></div><TrainingIcon name={resource.kind === "pdf" ? "book" : "play"} /></div>{!href ? <p>{en ? "This resource link is unavailable." : "Questo collegamento non è disponibile."}</p> : <>{embed && <div className={styles.video}><iframe src={embed} title={resource.title} allow="fullscreen; picture-in-picture" allowFullScreen sandbox="allow-scripts allow-same-origin allow-presentation" referrerPolicy="strict-origin-when-cross-origin" /></div>}{!embed && directVideo && resource.kind === "video" && <div className={styles.video}><video src={href} controls playsInline preload="metadata" aria-label={resource.title} onError={() => toast.error(en ? "Unable to play this video. Try the source link below." : "Impossibile riprodurre il video. Prova il collegamento qui sotto.", { id: "trainer-video" })} /></div>}<div className={styles.actions}><a className={styles.primary} href={href} target="_blank" rel="noopener noreferrer" lang={resource.language ?? undefined}>{resource.kind === "pdf" ? en ? "Open PDF" : "Apri PDF" : en ? "Open video source" : "Apri sorgente video"}<TrainingIcon name="share" /><span className={styles.srOnly}>{en ? " (opens in a new tab)" : " (si apre in una nuova scheda)"}</span></a></div></>}</section>;
}

export function TrainerCourseModule({ slug, moduleId, exerciseId, lessonId }: { slug: string; moduleId: string; exerciseId?: string; lessonId?: string }) {
  const locale = useLocale();
  const en = locale === "en";
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const result = useTrainerResource<TrainerModuleDetail>(`trainer/courses/${encodeURIComponent(slug)}/modules/${encodeURIComponent(moduleId)}?locale=${locale}`);
  if (!result.data) return result.error ? <Recovery error={result.error} retry={result.reload} /> : <TrainingLoader />;
  const { course, module, items, resources } = result.data;
  const itemId = exerciseId ?? lessonId;
  const item = itemId ? items.find(candidate => candidate.id === itemId) : null;
  const isExercise = item?.item_type === "exercise_card";
  if (itemId && (!item || Boolean(exerciseId) !== isExercise)) return <Recovery error={new PortalError(404)} retry={result.reload} />;
  const visible = item ? item.resources : resources;
  const selected = visible.find(resource => resource.id === selectedId);
  const index = item ? items.findIndex(candidate => candidate.id === item.id) : -1;
  const itemLabel = isExercise ? en ? "EXERCISE" : "ESERCIZIO" : en ? "LESSON" : "LEZIONE";
  return <div className={styles.content}>
    <nav className={styles.breadcrumb} aria-label={en ? "Breadcrumb" : "Percorso"}>
      <Link href="/trainer/courses">{en ? "Training courses" : "Corsi di formazione"}</Link><span>/</span>
      <Link href={trainerCourseHref(slug)}>{course.title}</Link><span>/</span>
      {item ? <Link href={trainerModuleHref(slug, moduleId)}>{en ? "Module" : "Modulo"} {module.number}</Link> : <span aria-current="page">{en ? "Module" : "Modulo"} {module.number}</span>}
      {item && <><span>/</span><span aria-current="page">{item.title}</span></>}
    </nav>
    <header className={styles.courseHeading}>
      <span className={styles.eyebrow}>{en ? "MODULE" : "MODULO"} {module.number}{item ? ` / ${itemLabel} ${item.order}` : ""}</span>
      <h1>{item?.title ?? module.title}</h1><p>{item?.description ?? module.description}</p>
      {item?.summary && <p>{item.summary}</p>}
    </header>
    {result.error && <Recovery error={result.error} retry={result.reload} />}
    {selected && <ResourceViewer key={`${selected.id}:${selected.revision}`} resource={selected} />}
    {(item || resources.length > 0 || !items.length) && <>
      <div className={styles.sectionHeading}><h2>{en ? "Videos & course notes" : "Video e dispense"}</h2><span>{en ? "Choose a resource" : "Scegli una risorsa"}</span></div>
      <ResourceGroups resources={visible} selected={selectedId} onSelect={resource => setSelectedId(resource.id)} />
    </>}
    {!item && <>
      <div className={styles.sectionHeading}><h2>{module.type === "skill" || module.type === "practical" ? en ? "Exercise library" : "Libreria esercizi" : en ? "Lessons & exercises" : "Lezioni ed esercizi"}</h2><span>{items.length} {en ? "learning items" : "contenuti"}</span></div>
      <div className={styles.itemList}>{items.map(lesson => <Link key={lesson.id} href={trainerItemHref(slug, moduleId, lesson)} className={styles.itemCard}>
        <span className={styles.itemNumber}>{String(lesson.order).padStart(2, "0")}</span>
        <div><h2>{lesson.title}</h2>{lesson.description && <p>{lesson.description}</p>}
          <div className={styles.facts}>{(["it", "en"] as const).map(language => <span key={language}>{language.toUpperCase()} · {lesson.resources.filter(resource => resource.language === language && resource.kind === "video").length} {en ? "videos" : "video"} · {lesson.resources.filter(resource => resource.language === language && resource.kind === "pdf").length} PDF</span>)}</div>
        </div><TrainingIcon name="arrow" />
      </Link>)}</div>
      {!items.length && <p className={styles.unavailable}>{en ? "No separate lessons or exercises have been added to this module." : "Nessuna lezione o esercizio separato ancora aggiunto a questo modulo."}</p>}
    </>}
    {item && <nav className={styles.exercisePager} aria-label={en ? "Lesson and exercise navigation" : "Navigazione lezioni ed esercizi"}>
      {index > 0 && <Link className={styles.secondary} href={trainerItemHref(slug, moduleId, items[index - 1])}><TrainingIcon name="back" />{en ? "Previous" : "Precedente"}</Link>}
      <Link className={styles.secondary} href={trainerModuleHref(slug, moduleId)}>{en ? "Back to module" : "Torna al modulo"}</Link>
      {index < items.length - 1 && <Link className={styles.primary} href={trainerItemHref(slug, moduleId, items[index + 1])}>{en ? "Next" : "Successivo"}<TrainingIcon name="arrow" /></Link>}
    </nav>}
  </div>;
}
