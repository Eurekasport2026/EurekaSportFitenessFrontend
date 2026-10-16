"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { useAuth } from "@/components/features/training-app/AuthProvider";
import { TrainingIcon } from "@/components/features/training-app/TrainingIcon";
import { TrainingLoader } from "@/components/features/training-app/TrainingLoader";
import { usePortalRequest } from "@/hooks/use-portal-request";
import { useTrainerResource } from "@/hooks/use-trainer-resource";
import { portalMessage } from "@/lib/api/portal";
import { safeResourceHref, type CourseResource, type ResourceWrite } from "@/lib/training/trainer-courses";
import type { Lesson } from "@/lib/api/types";
import styles from "@/components/features/portals/trainer-courses.module.css";

interface ResourceEditorProps { slug: string; moduleId: string; items: Pick<Lesson, "id" | "title">[] }
const emptyResource = (): ResourceWrite => ({ lesson_id: null, language: "it", kind: "video", title: "", url: "", position: 0, published: true });

export function AdminCourseResources(props: ResourceEditorProps) {
  const en = useLocale() === "en";
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  return <details className={styles.adminResources} onToggle={event => setOpen(event.currentTarget.open)}><summary><TrainingIcon name="book" />{en ? "Italian / English videos & PDFs" : "Video e PDF in italiano / inglese"}<TrainingIcon name="chevron" /></summary>{open && session && <ResourceEditor key={`${session.user.id}:${props.slug}:${props.moduleId}`} {...props} />}</details>;
}

function ResourceEditor({ slug, moduleId, items }: ResourceEditorProps) {
  const en = useLocale() === "en";
  const request = usePortalRequest();
  const path = `admin/courses/${encodeURIComponent(slug)}/modules/${encodeURIComponent(moduleId)}/resources`;
  const result = useTrainerResource<CourseResource[]>(path);
  const [draft, setDraft] = useState<ResourceWrite>(emptyResource);
  const [editing, setEditing] = useState<CourseResource | null>(null);
  const [removing, setRemoving] = useState<CourseResource | null>(null);
  const [busy, setBusy] = useState(false);
  const [invalidField, setInvalidField] = useState<"title" | "url" | null>(null);
  const urlInput = useRef<HTMLInputElement>(null);
  const titleInput = useRef<HTMLInputElement>(null);
  const confirm = useRef<HTMLDialogElement>(null);
  const dialogId = useId();
  const toastId = `course-resources:${moduleId}`;
  useEffect(() => {
    if (removing && !confirm.current?.open) confirm.current?.showModal();
    if (!removing && confirm.current?.open) confirm.current.close();
  }, [removing]);
  function reset() { setEditing(null); setDraft(emptyResource()); setInvalidField(null); }
  function invalid(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const first = event.currentTarget.querySelector<HTMLElement>(":invalid");
    if (first === event.target) { first.focus(); toast.error(en ? "Check the required fields and values." : "Controlla i campi obbligatori e i valori.", { id: toastId }); }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!draft.title.trim()) { setInvalidField("title"); titleInput.current?.focus(); toast.error(en ? "Enter a resource title." : "Inserisci un titolo per la risorsa.", { id: toastId }); return; }
    if (!safeResourceHref(draft.url.trim())) { setInvalidField("url"); urlInput.current?.focus(); toast.error(en ? "Use an HTTPS link or a path starting with /." : "Usa un collegamento HTTPS o un percorso che inizia con /.", { id: toastId }); return; }
    setInvalidField(null);
    setBusy(true);
    try {
      const payload = { ...draft, title: draft.title.trim(), url: draft.url.trim(), ...(editing ? { revision: editing.revision } : {}) };
      await request<CourseResource>(editing ? `${path}/${editing.id}` : path, editing ? "PUT" : "POST", payload);
      reset(); result.reload(); toast.success(en ? "Course resource saved." : "Risorsa del corso salvata.", { id: toastId });
    } catch (error) { toast.error(portalMessage(error, en), { id: toastId }); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!removing || busy) return;
    setBusy(true);
    try {
      await request(`${path}/${removing.id}?revision=${removing.revision}`, "DELETE");
      if (editing?.id === removing.id) reset();
      setRemoving(null); result.reload(); toast.success(en ? "Course resource removed." : "Risorsa del corso rimossa.", { id: toastId });
    } catch (error) { toast.error(portalMessage(error, en), { id: toastId }); }
    finally { setBusy(false); }
  }
  function edit(resource: CourseResource) {
    if (!resource.language) return;
    setInvalidField(null);
    setEditing(resource); setDraft({ lesson_id: resource.lesson_id, language: resource.language, kind: resource.kind,
      title: resource.title, url: resource.url, position: resource.position, published: resource.published });
    titleInput.current?.focus();
  }
  return <div className={styles.resourceEditor}>
    <p>{en ? "Attach one or more videos and PDFs to the whole module or to an individual lesson/exercise. Set each file’s actual language. Add links to hosted files; this form does not upload files." : "Collega uno o più video e PDF all’intero modulo o a una singola lezione/esercizio. Indica la lingua effettiva di ogni file. Aggiungi collegamenti a file già ospitati; il modulo non carica file."}</p>
    {result.error && <div><p>{portalMessage(result.error, en)}</p><button type="button" className={styles.secondary} onClick={result.reload}>{en ? "Reload resources" : "Ricarica risorse"}</button></div>}
    {!result.data && result.pending && <TrainingLoader compact />}
    <form onSubmit={save} onInvalidCapture={invalid}>
      <div className={styles.editorGrid}>
        <label className={styles.editorField}>{en ? "Attach to" : "Collega a"}<select value={draft.lesson_id ?? ""} disabled={busy} onChange={event => setDraft(value => ({ ...value, lesson_id: event.target.value || null }))}><option value="">{en ? "Whole module" : "Intero modulo"}</option>{items.map(item => <option key={item.id} value={item.id}>{typeof item.title === "string" ? item.title : item.id}</option>)}</select></label>
        <label className={styles.editorField}>{en ? "Resource language" : "Lingua della risorsa"}<select value={draft.language} disabled={busy} onChange={event => setDraft(value => ({ ...value, language: event.target.value as "it" | "en" }))}><option value="it">Italiano</option><option value="en">English</option></select></label>
        <label className={styles.editorField}>{en ? "Resource type" : "Tipo di risorsa"}<select value={draft.kind} disabled={busy} onChange={event => setDraft(value => ({ ...value, kind: event.target.value as "video" | "pdf" }))}><option value="video">Video</option><option value="pdf">PDF</option></select></label>
        <label className={styles.editorField}>{en ? "Display order" : "Ordine di visualizzazione"}<input type="number" min={0} max={10000} step={1} required value={draft.position} disabled={busy} onChange={event => setDraft(value => ({ ...value, position: Number(event.target.value) }))} /></label>
      </div>
      <label className={styles.editorField}>{en ? "Resource title" : "Titolo della risorsa"}<input ref={titleInput} required maxLength={240} value={draft.title} aria-invalid={invalidField === "title" || undefined} disabled={busy} onChange={event => { setInvalidField(null); setDraft(value => ({ ...value, title: event.target.value })); }} /></label>
      <label className={styles.editorField}>{en ? "Video / PDF link" : "Collegamento video / PDF"}<input ref={urlInput} inputMode="url" required maxLength={2000} value={draft.url} aria-invalid={invalidField === "url" || undefined} disabled={busy} placeholder="https://…" onChange={event => { setInvalidField(null); setDraft(value => ({ ...value, url: event.target.value })); }} /></label>
      <label className={styles.editorCheckbox}><input type="checkbox" checked={draft.published} disabled={busy} onChange={event => setDraft(value => ({ ...value, published: event.target.checked }))} /><span>{en ? "Visible to Trainers" : "Visibile ai Trainer"}</span></label>
      <div className={styles.actions}><button type="submit" className={styles.primary} disabled={busy || result.pending || Boolean(result.error)}>{busy ? en ? "Saving…" : "Salvataggio…" : editing ? en ? "Save resource changes" : "Salva modifiche" : en ? "Add resource" : "Aggiungi risorsa"}</button>{editing && <button type="button" className={styles.secondary} disabled={busy} onClick={reset}>{en ? "Cancel editing" : "Annulla modifica"}</button>}<button type="button" className={styles.secondary} disabled={busy || result.pending} onClick={result.reload}>{en ? "Refresh" : "Ricarica"}</button></div>
    </form>
    <div className={styles.resourceList}>{result.data?.map(resource => <div key={resource.id} className={styles.resourceRow}><div><strong lang={resource.language ?? undefined}>{resource.title}</strong><small>{resource.language?.toUpperCase()} · {resource.kind.toUpperCase()} · {resource.lesson_id ? items.find(item => item.id === resource.lesson_id)?.title || resource.lesson_id : en ? "Whole module" : "Intero modulo"} · {resource.published ? en ? "Published" : "Pubblicato" : en ? "Hidden" : "Nascosto"}</small></div><div className={styles.actions}><button type="button" className={styles.secondary} disabled={busy} onClick={() => edit(resource)}>{en ? "Edit" : "Modifica"}</button><button type="button" className={styles.danger} disabled={busy} onClick={() => setRemoving(resource)}>{en ? "Remove" : "Rimuovi"}</button></div></div>)}</div>
    <dialog ref={confirm} className={styles.confirmDialog} aria-labelledby={dialogId} onCancel={event => { if (busy) event.preventDefault(); else setRemoving(null); }} onClose={() => setRemoving(null)}><h2 id={dialogId}>{en ? "Remove this resource?" : "Rimuovere questa risorsa?"}</h2><p>{en ? "The course link will be removed. The hosted video or PDF file will not be deleted." : "Il collegamento verrà rimosso dal corso. Il video o PDF ospitato non verrà eliminato."}</p><div className={styles.actions}><button type="button" className={styles.secondary} disabled={busy} autoFocus onClick={() => setRemoving(null)}>{en ? "Cancel" : "Annulla"}</button><button type="button" className={styles.danger} disabled={busy} onClick={() => void remove()}>{en ? "Remove resource" : "Rimuovi risorsa"}</button></div></dialog>
  </div>;
}
