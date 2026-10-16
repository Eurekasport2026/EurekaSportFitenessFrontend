"use client";

import { useLocale } from "next-intl";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/features/training-app/AuthProvider";
import { PortalAccess, PortalSwitcher } from "@/components/layout/PortalAccess";
import { portalMessage, type AuditRecord, type Program, type ProgramWorkout, type RosterLink, type UserPage, type WorkoutRecord } from "@/lib/api/portal";
import { roles, type Role } from "@/lib/auth/roles";
import { usePortalRequest } from "@/hooks/use-portal-request";
import { TrainingIcon } from "@/components/features/training-app/TrainingIcon";
import { TrainingLoader } from "@/components/features/training-app/TrainingLoader";
import adminUi from "@/components/features/admin/admin-users.module.css";
import type { AssignmentSubmission } from "@/lib/api/types";

const field = "w-full min-w-0 rounded-xl border border-[#1f2937] bg-[#111827] px-3 py-2 text-slate-100";
const button = "rounded-xl bg-[#0066ff] px-4 py-2 font-semibold text-white disabled:opacity-50";
const card = "rounded-2xl border border-[#1f2937] bg-[#111827] p-5 space-y-4";

function invalid(event: FormEvent<HTMLFormElement>, en: boolean) {
  event.preventDefault();
  const first = event.currentTarget.querySelector<HTMLElement>("input:invalid, select:invalid, textarea:invalid");
  if (first !== event.target) return;
  first?.focus();
  toast.error(en ? "Check the required fields and values." : "Controlla i campi obbligatori e i valori.", { id: "portal-validation" });
}

function Frame({ role, title, children }: { role: Role; title: string; children: ReactNode }) {
  return <main id={role === "athlete" ? "training-main" : "main"} className="mx-auto w-full max-w-7xl space-y-6 p-4 text-slate-100 sm:p-8">
    {role !== "admin" && <PortalSwitcher />}<h1 className="text-3xl font-bold">{title}</h1><PortalAccess role={role}>{children}</PortalAccess>
  </main>;
}

function Pager({ offset, count, next, total }: { offset: number; count: number; next: (value: number) => void; total?: number }) {
  const en = useLocale() === "en";
  return <nav className="flex items-center gap-4" aria-label={en ? "Pages" : "Pagine"}>
    <button className={button} type="button" disabled={!offset} onClick={() => next(Math.max(0, offset - 25))}>{en ? "Previous" : "Precedente"}</button>
    <span>{count ? `${offset + 1}–${offset + count}` : "0"}{total !== undefined ? ` / ${total}` : ""}</span>
    <button className={button} type="button" disabled={total === undefined ? count < 25 : offset + count >= total} onClick={() => next(offset + 25)}>{en ? "Next" : "Successiva"}</button>
  </nav>;
}

function usePortalLoad<T>(path: string, initial: T) {
  const portalRequest = usePortalRequest();
  const { session, status } = useAuth();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(true);
  const [revision, setRevision] = useState(0);
  const owner = session?.user.id;
  const scope = `${owner ?? ""}:${path}`;
  const [loadedScope, setLoadedScope] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setPending(true); setError(null);
    if (status !== "authenticated") return () => controller.abort();
    portalRequest<T>(path, "GET", undefined, controller.signal).then(data => {
      if (!controller.signal.aborted) { setValue(data); setLoadedScope(scope); }
    }).catch(failure => { if (!controller.signal.aborted) setError(failure); })
      .finally(() => { if (!controller.signal.aborted) setPending(false); });
    return () => controller.abort();
  }, [path, owner, status, revision, scope]);
  return { value: loadedScope === scope ? value : initial, error, pending, reload: () => setRevision(v => v + 1) };
}

function Recovery({ error, retry }: { error: unknown; retry: () => void }) {
  const en = useLocale() === "en";
  return <div className={card}><p>{portalMessage(error, en)}</p><button className={button} type="button" onClick={retry}>{en ? "Retry" : "Riprova"}</button></div>;
}

export function AdminUsersContent() {
  const portalRequest = usePortalRequest();
  const { session } = useAuth();
  const locale = useLocale();
  const en = locale === "en";
  const [invitation, setInvitation] = useState<{ url: string; expires: string; recipient: string } | null>(null);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const users = usePortalLoad<UserPage>("admin/users?q=" + encodeURIComponent(search) + "&offset=" + offset + (roleFilter ? "&role=" + roleFilter : ""), { items: [], total: 0, offset: 0, limit: 25 });
  const [rosterOffset, setRosterOffset] = useState(0);
  const roster = usePortalLoad<RosterLink[]>("admin/roster?offset=" + rosterOffset, []);
  const [auditOffset, setAuditOffset] = useState(0);
  const audit = usePortalLoad<AuditRecord[]>("admin/audit?offset=" + auditOffset, []);
  async function action(work: () => Promise<unknown>, success?: string) {
    if (busy) return;
    setBusy(true);
    try {
      await work(); users.reload(); roster.reload(); audit.reload();
      toast.success(success ?? (en ? "Saved." : "Salvato."), { id: "admin-access" });
    } catch (error) { toast.error(portalMessage(error, en), { id: "admin-access" }); }
    finally { setBusy(false); }
  }
  const metrics = [
    { icon: "user" as const, label: en ? "Matching accounts" : "Account corrispondenti", value: users.value.total, detail: en ? "Across all results" : "Su tutti i risultati" },
    { icon: "check" as const, label: en ? "Active accounts" : "Account attivi", value: users.value.items.filter(user => user.status === "active").length, detail: en ? "On this page" : "In questa pagina" },
    { icon: "dumbbell" as const, label: en ? "Trainers" : "Trainer", value: users.value.items.filter(user => user.roles.includes("coach")).length, detail: en ? "On this page" : "In questa pagina" },
  ];
  return <div className={adminUi.content}>
    <div className={adminUi.metrics}>{metrics.map(metric => <div className={adminUi.metric} key={metric.label}><div><span>{metric.label}</span><TrainingIcon name={metric.icon} /></div><strong>{users.pending || users.error ? "—" : metric.value}</strong><small>{metric.detail}</small></div>)}</div>
    <div className={adminUi.managementGrid}>
      <section className={adminUi.directory} aria-labelledby="admin-directory-title">
        <div className={adminUi.panelHeading}><div><span className={adminUi.eyebrow}>{en ? "YOUR PEOPLE" : "LE PERSONE"}</span><h2 id="admin-directory-title">{en ? "Account directory" : "Elenco degli account"}</h2><p>{en ? "Find an account, review its permissions and save changes when ready." : "Trova un account, controlla i permessi e salva le modifiche quando sei pronto."}</p></div><button type="button" className={adminUi.secondary} disabled={users.pending || busy} onClick={() => { users.reload(); roster.reload(); audit.reload(); }}><TrainingIcon name="clock" />{en ? "Refresh" : "Ricarica"}</button></div>
        <form className={adminUi.searchForm} onSubmit={event => { event.preventDefault(); setOffset(0); setSearch(query.trim()); }}>
          <label className={adminUi.searchInput}><TrainingIcon name="search" /><span className={adminUi.srOnly}>{en ? "Search users by name or email" : "Cerca utenti per nome o email"}</span><input type="search" value={query} maxLength={120} placeholder={en ? "Search by name or email…" : "Cerca per nome o email…"} onChange={event => setQuery(event.target.value)} /></label>
          <label className={adminUi.roleFilter}><span className={adminUi.srOnly}>{en ? "Filter by role" : "Filtra per ruolo"}</span><select value={roleFilter} onChange={event => { setRoleFilter(event.target.value); setOffset(0); }}><option value="">{en ? "All roles" : "Tutti i ruoli"}</option>{roles.map(role => <option key={role} value={role}>{adminRoleLabel(role, en)}</option>)}</select></label>
          <button className={adminUi.primary} type="submit">{en ? "Search" : "Cerca"}<TrainingIcon name="arrow" /></button>
        </form>
        {users.error ? <Recovery error={users.error} retry={users.reload} /> : users.pending ? <TrainingLoader compact /> : <>
          <div className={adminUi.directoryLabels} aria-hidden="true"><span>{en ? "PERSON" : "PERSONA"}</span><span>{en ? "ACCOUNT ROLES" : "RUOLI ACCOUNT"}</span><span>{en ? "STATUS" : "STATO"}</span><span>{en ? "ACTION" : "AZIONE"}</span></div>
          <div className={adminUi.userList}>{users.value.items.map(user => <AdminUserRow key={user.id + ":" + user.roles.join() + ":" + user.status} user={user} currentId={session?.user.id ?? ""} busy={busy} en={en} save={(selectedRoles, status) => action(() => portalRequest("admin/users/" + user.id, "PATCH", { roles: selectedRoles, status }), en ? "Account access updated." : "Accesso all’account aggiornato.")} />)}</div>
          {!users.value.items.length && <div className={adminUi.empty}><TrainingIcon name="search" /><h3>{en ? "No matching accounts." : "Nessun account corrispondente."}</h3><p>{en ? "Try another name, email address or role." : "Prova un altro nome, indirizzo email o ruolo."}</p></div>}
          <AdminPager offset={offset} count={users.value.items.length} total={users.value.total} pending={users.pending || busy} next={setOffset} />
        </>}
      </section>
      <section className={adminUi.roster} aria-labelledby="admin-roster-title">
        <div className={adminUi.panelHeading}><div><span className={adminUi.eyebrow}>{en ? "BUILD YOUR TEAM" : "COSTRUISCI IL TEAM"}</span><h2 id="admin-roster-title">{en ? "Trainer–Athlete connections" : "Collegamenti Trainer–Atleta"}</h2><p>{en ? "Assign an athlete to the Trainer who will guide their training." : "Assegna un atleta al Trainer che seguirà il suo allenamento."}</p></div><TrainingIcon name="share" /></div>
        <form className={adminUi.assignmentForm} onInvalidCapture={event => invalid(event, en)} onSubmit={event => {
          event.preventDefault(); const data = new FormData(event.currentTarget);
          if (!data.get("coach") || !data.get("athlete")) { toast.error(en ? "Choose a Trainer and an Athlete." : "Scegli un Trainer e un Atleta.", { id: "admin-access" }); event.currentTarget.querySelector<HTMLElement>("select:not(:disabled)")?.focus(); return; }
          void action(() => portalRequest("admin/roster", "POST", { coach_id: data.get("coach"), athlete_id: data.get("athlete") }), en ? "Trainer assigned." : "Trainer assegnato.");
        }}>
          <AccountPicker role="coach" name="coach" label="Trainer" />
          <AccountPicker role="athlete" name="athlete" label={en ? "Athlete" : "Atleta"} />
          <button className={adminUi.primary} disabled={busy}>{en ? "Connect accounts" : "Collega gli account"}<TrainingIcon name="arrow" /></button>
        </form>
        {roster.error ? <Recovery error={roster.error} retry={roster.reload} /> : roster.pending ? <TrainingLoader compact /> : <div className={adminUi.rosterList}>
          {roster.value.map(row => <div className={adminUi.rosterRow} key={row.coach_id + ":" + row.athlete_id}><div><span className={adminUi.eyebrow}>TRAINER</span><strong>{row.coach_name}</strong><small>{row.coach_email}</small></div><TrainingIcon name="arrow" /><div><span className={adminUi.eyebrow}>{en ? "ATHLETE" : "ATLETA"}</span><strong>{row.athlete_name}</strong><small>{row.athlete_email}</small></div><button className={adminUi.dangerText} type="button" disabled={busy} onClick={() => void action(() => portalRequest("admin/roster/" + row.coach_id + "/" + row.athlete_id, "DELETE"), en ? "Assignment removed." : "Assegnazione rimossa.")}>{en ? "Unassign" : "Rimuovi"}</button></div>)}
          {!roster.value.length && <p className={adminUi.muted}>{en ? "No connections yet. Choose a Trainer and an athlete above to get started." : "Nessun collegamento. Scegli un Trainer e un atleta per iniziare."}</p>}
        </div>}
        <AdminPager offset={rosterOffset} count={roster.value.length} pending={roster.pending || busy} next={setRosterOffset} />
      </section>
      <section className={adminUi.invite} id="admin-invite" aria-labelledby="admin-invite-title">
        <div className={adminUi.inviteIcon}><TrainingIcon name="user" /></div><span className={adminUi.eyebrow}>{en ? "GROW YOUR TEAM" : "AMPLIA IL TEAM"}</span><h2 id="admin-invite-title">{en ? "A new Trainer.\nA stronger team." : "Un nuovo Trainer.\nUn team più forte."}</h2><p>{en ? "Create a personal invitation for a Trainer. The link is tied to their email address." : "Crea un invito personale per un Trainer. Il collegamento è associato al suo indirizzo email."}</p>
        <form className={adminUi.invitationForm} onInvalidCapture={event => invalid(event, en)} onSubmit={event => {
          event.preventDefault(); const email = String(new FormData(event.currentTarget).get("email"));
          void action(async () => {
            const result = await portalRequest<{ token: string; expires_at: string }>("admin/invitations", "POST", { email, roles: ["coach"] });
            setInvitation({ url: window.location.origin + "/" + locale + "/training/app/signup?invite=" + encodeURIComponent(result.token), expires: result.expires_at, recipient: email });
          }, en ? "Trainer invitation created." : "Invito Trainer creato.");
        }}><label>{en ? "Trainer email address" : "Email del Trainer"}<input name="email" type="email" autoComplete="off" required maxLength={254} placeholder="trainer@example.com" disabled={busy} /></label><button className={adminUi.primary} disabled={busy}>{en ? "Create invitation" : "Crea invito"}<TrainingIcon name="arrow" /></button></form>
        {invitation && <div className={adminUi.invitationResult}><label>{en ? "Invitation for " : "Invito per "}{invitation.recipient}<input readOnly value={invitation.url} onFocus={event => event.currentTarget.select()} /></label><p>{en ? "Expires" : "Scade"} {new Date(invitation.expires).toLocaleString(locale)}. {en ? "Copy and share this link with the recipient." : "Copia e condividi questo collegamento con il destinatario."}</p><button className={adminUi.secondary} type="button" onClick={() => void navigator.clipboard.writeText(invitation.url).then(() => toast.success(en ? "Invitation link copied." : "Collegamento invito copiato.", { id: "invite-copy" })).catch(() => toast.error(en ? "Select and copy the invitation link." : "Seleziona e copia il collegamento invito.", { id: "invite-copy" }))}><TrainingIcon name="share" />{en ? "Copy invitation link" : "Copia invito"}</button></div>}
      </section>
      <section className={adminUi.audit} aria-labelledby="admin-audit-title">
        <div className={adminUi.panelHeading}><div><span className={adminUi.eyebrow}>{en ? "RECENT RECORDS" : "ULTIME REGISTRAZIONI"}</span><h2 id="admin-audit-title">{en ? "Access & training activity" : "Attività di accesso e allenamento"}</h2><p>{en ? "Recorded actions across accounts and training." : "Azioni registrate su account e allenamenti."}</p></div><TrainingIcon name="clock" /></div>
        {audit.error ? <Recovery error={audit.error} retry={audit.reload} /> : audit.pending ? <TrainingLoader compact /> : <ol className={adminUi.auditList}>{audit.value.map(row => <li key={row.id}><span className={adminUi.activityDot} /><div><strong>{row.action.replaceAll(".", " · ").replaceAll("_", " ")}</strong><small>{row.target_id}</small></div><time dateTime={row.created_at}>{new Date(row.created_at).toLocaleString(locale)}</time></li>)}</ol>}
        {!audit.pending && !audit.error && !audit.value.length && <p className={adminUi.muted}>{en ? "No activity has been recorded yet." : "Nessuna attività ancora registrata."}</p>}
        <AdminPager offset={auditOffset} count={audit.value.length} pending={audit.pending || busy} next={setAuditOffset} />
      </section>
      <details className={adminUi.reviews} onToggle={event => setReviewsOpen(event.currentTarget.open)}><summary><TrainingIcon name="book" /><div><h2>{en ? "Academy submission reviews" : "Revisione elaborati Academy"}</h2><p>{en ? "Open to review submitted coursework and give feedback." : "Apri per esaminare gli elaborati e fornire feedback."}</p></div><TrainingIcon name="chevron" /></summary>{reviewsOpen && <AcademyReviews />}</details>
    </div>
  </div>;
}

function adminRoleLabel(role: Role, en: boolean) {
  return role === "coach" ? "Trainer" : role === "admin" ? "Admin" : en ? "Athlete" : "Atleta";
}

function AdminUserRow({ user, currentId, busy, en, save }: { user: UserPage["items"][number]; currentId: string; busy: boolean; en: boolean; save: (selected: Role[], status: "active" | "suspended") => Promise<void> }) {
  const [selected, setSelected] = useState<Role[]>(user.roles);
  const [status, setStatus] = useState(user.status);
  const [invalidRoles, setInvalidRoles] = useState(false);
  const self = user.id === currentId;
  const dirty = status !== user.status || selected.length !== user.roles.length || selected.some(role => !user.roles.includes(role));
  return <form className={adminUi.userRow} aria-label={user.name + (en ? " account access" : " accesso account")} onSubmit={event => {
    event.preventDefault();
    if (!selected.length) { setInvalidRoles(true); event.currentTarget.querySelector<HTMLElement>("input[type=checkbox]")?.focus(); toast.error(en ? "Choose at least one account role." : "Scegli almeno un ruolo.", { id: "admin-access" }); return; }
    void save(selected, status);
  }}>
    <div className={adminUi.person}><span className={adminUi.avatar}>{(user.name.trim() || "EF").split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase()}</span><div><strong>{user.name}{self && <span className={adminUi.you}>{en ? "You" : "Tu"}</span>}</strong><small>{user.email}</small></div></div>
    <fieldset className={adminUi.roleChips} disabled={busy} aria-invalid={invalidRoles || undefined}><legend className={adminUi.srOnly}>{en ? "Account roles" : "Ruoli account"}</legend>{roles.map(role => <label key={role} data-selected={selected.includes(role)}><input type="checkbox" checked={selected.includes(role)} disabled={self && role === "admin"} onChange={() => { setSelected(current => current.includes(role) ? current.filter(value => value !== role) : roles.filter(value => value === role || current.includes(value))); setInvalidRoles(false); }} /><span>{adminRoleLabel(role, en)}</span></label>)}</fieldset>
    <label className={adminUi.statusField}><span className={adminUi.srOnly}>{en ? "Account status" : "Stato account"}</span><select value={status} disabled={busy || self} data-status={status} onChange={event => setStatus(event.target.value as "active" | "suspended")}><option value="active">{en ? "Active" : "Attivo"}</option><option value="suspended">{en ? "Suspended" : "Sospeso"}</option></select></label>
    <button className={adminUi.secondary} type="submit" disabled={busy || !dirty}>{en ? "Save access" : "Salva accesso"}<TrainingIcon name="check" /></button>
  </form>;
}

function AdminPager({ offset, count, total, pending, next }: { offset: number; count: number; total?: number; pending: boolean; next: (value: number) => void }) {
  const en = useLocale() === "en";
  return <nav className={adminUi.pager} aria-label={en ? "Record pages" : "Pagine dei risultati"}><span>{count ? (offset + 1) + "–" + (offset + count) : "0"}{total !== undefined ? " / " + total : ""}</span><div><button className={adminUi.secondary} type="button" disabled={!offset || pending} onClick={() => next(Math.max(0, offset - 25))}><TrainingIcon name="back" />{en ? "Previous" : "Precedente"}</button><button className={adminUi.secondary} type="button" disabled={pending || (total === undefined ? count < 25 : offset + count >= total)} onClick={() => next(offset + 25)}>{en ? "Next" : "Successiva"}<TrainingIcon name="arrow" /></button></div></nav>;
}

function AccountPicker({ role, name, label }: { role: "coach" | "athlete"; name: string; label: string }) {
  const en = useLocale() === "en";
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState("");
  useEffect(() => { const timer = setTimeout(() => setSearch(query.trim()), 300); return () => clearTimeout(timer); }, [query]);
  const users = usePortalLoad<UserPage>(`admin/users?role=${role}&q=${encodeURIComponent(search)}&offset=${offset}`, { items: [], total: 0, offset: 0, limit: 25 });
  return <fieldset className="min-w-0 space-y-2"><legend>{label}</legend>
    <input className={field} type="search" value={query} maxLength={120} aria-label={en ? `Search ${label} by name or email` : `Cerca ${label} per nome o email`} placeholder={en ? "Name or email" : "Nome o email"} onChange={e => { setQuery(e.target.value); setSelected(""); setOffset(0); }} />
    {users.error ? <Recovery error={users.error} retry={users.reload} /> : <select className={field} name={name} required value={selected} disabled={users.pending} aria-label={label} onChange={e => setSelected(e.target.value)}>
      <option value="">{en ? "Choose an account" : "Scegli un account"}</option>
      {users.value.items.map(user => <option key={user.id} value={user.id} disabled={user.status !== "active"}>{user.name} ({user.email}){user.status !== "active" ? (en ? " · suspended" : " · sospeso") : ""}</option>)}
    </select>}
    <Pager offset={offset} count={users.value.items.length} total={users.value.total} next={value => { setSelected(""); setOffset(value); }} />
  </fieldset>;
}

function AcademyReviews() {
  const portalRequest = usePortalRequest();
  const en = useLocale() === "en";
  const [slug, setSlug] = useState("");
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  const submissions = usePortalLoad<(AssignmentSubmission & { user_id: string })[]>(slug ? `admin/courses/${slug}/submissions?offset=${offset}` : "admin/audit?limit=1", []);
  return <section className={card}><h2 className="text-xl font-semibold">{en ? "Academy submission review" : "Revisione elaborati Academy"}</h2>
    <form className="flex flex-wrap gap-3" onInvalidCapture={e => invalid(e, en)} onSubmit={e => { e.preventDefault(); setOffset(0); setSlug(String(new FormData(e.currentTarget).get("slug"))); }}>
      <label className="flex-1">{en ? "Course slug" : "Slug corso"}<input className={field} name="slug" required pattern="[a-z0-9-]+" maxLength={80} /></label><button className={`${button} self-end`}>{en ? "Load submissions" : "Carica elaborati"}</button>
    </form>
    {slug && (submissions.error ? <Recovery error={submissions.error} retry={submissions.reload} /> : <>
      {submissions.value.filter(row => row.status !== "not_submitted").map(row => <article className={card} key={row.user_id}><h3>{row.title}</h3><small>{row.user_id}</small><p className="whitespace-pre-wrap">{row.notes}</p>{row.resourceUrl?.startsWith("https://") && <a className="break-all text-[#38bdf8] underline" href={row.resourceUrl} target="_blank" rel="noopener noreferrer">{row.resourceUrl}</a>}<p>{row.status}</p>{row.reviewerFeedback && <blockquote>{row.reviewerFeedback}</blockquote>}
        {row.status === "under_review" && <form className="space-y-3" onInvalidCapture={e => invalid(e, en)} onSubmit={async e => {
          e.preventDefault(); if (busy) return; const data = new FormData(e.currentTarget); setBusy(true);
          try { await portalRequest(`admin/courses/${slug}/submissions/${row.user_id}`, "PATCH", { status: data.get("status"), feedback: data.get("feedback") }); submissions.reload(); toast.success(en ? "Review saved." : "Revisione salvata.", { id: "submission-review" }); }
          catch (error) { toast.error(portalMessage(error, en), { id: "submission-review" }); }
          finally { setBusy(false); }
        }}><label>{en ? "Review feedback" : "Commento revisione"}<textarea className={field} name="feedback" required maxLength={4000} /></label><select className={field} name="status" aria-label={en ? "Review decision" : "Esito revisione"}><option value="approved">{en ? "Approve" : "Approva"}</option><option value="changes_requested">{en ? "Request revision" : "Richiedi revisione"}</option></select><button className={button} disabled={busy}>{en ? "Save review" : "Salva revisione"}</button></form>}
      </article>)}<Pager offset={offset} count={submissions.value.length} next={setOffset} />
    </>)}
  </section>;
}

const newWorkout = (): ProgramWorkout => ({ title: "", exercises: [{ name: "", sets: 3, reps: "8–12", rest_seconds: 60 }] });

export function TrainerWorkspace({ embedded = false }: { embedded?: boolean }) {
  const { session } = useAuth();
  if (embedded) return <Trainer key={session?.user.id} />;
  return <Frame role="coach" title="Trainer"><Trainer key={session?.user.id} /></Frame>;
}

function Trainer() {
  const portalRequest = usePortalRequest();
  const en = useLocale() === "en";
  const [rosterOffset, setRosterOffset] = useState(0);
  const [programOffset, setProgramOffset] = useState(0);
  const athletes = usePortalLoad<{ id: string; name: string }[]>(`trainer/athletes?offset=${rosterOffset}`, []);
  const programs = usePortalLoad<Program[]>(`trainer/programs?offset=${programOffset}`, []);
  const [selected, setSelected] = useState("");
  const [reviewOffset, setReviewOffset] = useState(0);
  const [title, setTitle] = useState("");
  const [workouts, setWorkouts] = useState<ProgramWorkout[]>([newWorkout()]);
  const [editing, setEditing] = useState<Program | null>(null);
  const [busy, setBusy] = useState(false);
  const review = usePortalLoad<WorkoutRecord[]>(selected ? `trainer/athletes/${selected}/sessions?offset=${reviewOffset}` : "trainer/athletes?limit=1", []);
  async function action(work: () => Promise<unknown>) {
    if (busy) return false;
    setBusy(true);
    try { await work(); programs.reload(); review.reload(); toast.success(en ? "Saved." : "Salvato.", { id: "trainer-action" }); return true; }
    catch (error) { toast.error(portalMessage(error, en), { id: "trainer-action" }); return false; }
    finally { setBusy(false); }
  }
  function changeExercise(w: number, x: number, patch: Partial<ProgramWorkout["exercises"][number]>) {
    setWorkouts(current => current.map((workout, i) => i === w ? { ...workout, exercises: workout.exercises.map((exercise, j) => j === x ? { ...exercise, ...patch } : exercise) } : workout));
  }
  return <>
    <section className={card}><h2 className="text-xl font-semibold">{en ? "Assigned athletes" : "Atleti assegnati"}</h2>
      {athletes.error ? <Recovery error={athletes.error} retry={athletes.reload} /> : <>
        {!athletes.pending && !athletes.value.length && <p>{en ? "An Admin can assign athletes to your roster." : "Un Admin può assegnare atleti alla tua lista."}</p>}
        <div className="flex flex-wrap gap-3">{athletes.value.map(user => <button type="button" className={button} key={user.id} aria-pressed={selected === user.id} onClick={() => { setSelected(user.id); setReviewOffset(0); }}>{user.name}</button>)}</div>
        <Pager offset={rosterOffset} count={athletes.value.length} next={setRosterOffset} />
      </>}
    </section>
    <section className={card}><h2 className="text-xl font-semibold">{en ? "Program builder" : "Crea programma"}</h2>
      <form className="space-y-4" onInvalidCapture={e => invalid(e, en)} onSubmit={async e => { e.preventDefault(); const ok = await action(() => portalRequest(editing ? `trainer/programs/${editing.id}` : "trainer/programs", editing ? "PATCH" : "POST", { title, workouts, ...(editing ? { version: editing.version } : {}) })); if (ok) { setEditing(null); setTitle(""); setWorkouts([newWorkout()]); } }}>
        <label className="block">{en ? "Program title" : "Titolo programma"}<input className={field} value={title} onChange={e => setTitle(e.target.value)} required maxLength={160} /></label>
        {workouts.map((workout, w) => <fieldset key={w} className="space-y-3 rounded-xl border border-[#1f2937] p-3" disabled={busy}>
          <legend>{en ? "Workout" : "Allenamento"} {w + 1}</legend>
          <label className="block">{en ? "Workout title" : "Titolo allenamento"}<input className={field} value={workout.title} required maxLength={160} onChange={e => setWorkouts(current => current.map((row, i) => i === w ? { ...row, title: e.target.value } : row))} /></label>
          {workout.exercises.map((exercise, x) => <div key={x} className="grid gap-3 sm:grid-cols-4">
            <label>{en ? "Exercise" : "Esercizio"}<input className={field} value={exercise.name} required maxLength={160} onChange={e => changeExercise(w, x, { name: e.target.value })} /></label>
            <label>{en ? "Sets" : "Serie"}<input className={field} type="number" min={1} max={20} value={exercise.sets} required onChange={e => changeExercise(w, x, { sets: Number(e.target.value) })} /></label>
            <label>{en ? "Reps / target" : "Ripetizioni / obiettivo"}<input className={field} value={exercise.reps} required maxLength={60} onChange={e => changeExercise(w, x, { reps: e.target.value })} /></label>
            <label>{en ? "Rest (seconds)" : "Recupero (secondi)"}<input className={field} type="number" min={0} max={1800} value={exercise.rest_seconds} required onChange={e => changeExercise(w, x, { rest_seconds: Number(e.target.value) })} /></label>
          </div>)}
          <button className={button} type="button" disabled={workout.exercises.length >= 50} onClick={() => setWorkouts(current => current.map((row, i) => i === w ? { ...row, exercises: [...row.exercises, newWorkout().exercises[0]] } : row))}>{en ? "Add exercise" : "Aggiungi esercizio"}</button>
        </fieldset>)}
        <div className="flex flex-wrap gap-3"><button className={button} type="button" disabled={busy || workouts.length >= 30} onClick={() => setWorkouts(current => [...current, newWorkout()])}>{en ? "Add workout" : "Aggiungi allenamento"}</button>
          <button className={button} disabled={busy}>{en ? "Save program" : "Salva programma"}</button>
          {editing && <button className={button} type="button" onClick={() => { setEditing(null); setTitle(""); setWorkouts([newWorkout()]); }}>{en ? "Cancel editing" : "Annulla modifica"}</button>}
        </div>
      </form>
    </section>
    <section className={card}><h2 className="text-xl font-semibold">{en ? "Your programs" : "I tuoi programmi"}</h2>
      {programs.error ? <Recovery error={programs.error} retry={programs.reload} /> : programs.value.map(program => <div className="flex flex-wrap items-center gap-3" key={program.id}>
        <strong className="flex-1">{program.title} · v{program.version}</strong>
        <button className={button} disabled={busy} onClick={() => { setEditing(program); setTitle(program.title); setWorkouts(structuredClone(program.workouts)); }}>{en ? "Edit" : "Modifica"}</button>
        <button className={button} disabled={busy || !selected} onClick={() => void action(() => portalRequest("trainer/assignments", "POST", { program_id: program.id, athlete_id: selected }))}>{en ? "Assign to selected athlete" : "Assegna all'atleta selezionato"}</button>
      </div>)}<Pager offset={programOffset} count={programs.value.length} next={setProgramOffset} />
    </section>
    {selected && <section className={card}><h2 className="text-xl font-semibold">{en ? "Workout review" : "Revisione allenamenti"}</h2>
      {review.error ? <Recovery error={review.error} retry={review.reload} /> : <>
        {!review.pending && !review.value.length && <p>{en ? "No recorded workouts yet." : "Nessun allenamento registrato."}</p>}
        {review.value.map(record => <div key={record.id} className={card}><SessionSummary record={record} />
          <form className="flex flex-wrap gap-3" onInvalidCapture={e => invalid(e, en)} onSubmit={e => { e.preventDefault(); const form = e.currentTarget; const text = new FormData(form).get("text"); void action(() => portalRequest(`trainer/sessions/${record.id}/feedback`, "POST", { text })).then(ok => { if (ok) form.reset(); }); }}>
            <label className="flex-1">{en ? "Feedback" : "Commento"}<textarea name="text" className={field} required maxLength={4000} /></label><button className={`${button} self-end`} disabled={busy}>{en ? "Send feedback" : "Invia commento"}</button>
          </form>
        </div>)}<Pager offset={reviewOffset} count={review.value.length} next={setReviewOffset} />
      </>}
    </section>}
  </>;
}

function SessionSummary({ record }: { record: WorkoutRecord }) {
  const en = useLocale() === "en";
  const workout = record.program.workouts[record.workout_index];
  const volume = record.sets.reduce((total, set) => total + set.reps * set.weight_kg, 0);
  return <div className="space-y-2"><h3 className="font-semibold">{record.program.title} · {workout?.title}</h3><p>{new Date(record.completed_at).toLocaleString(en ? "en" : "it")} · {volume.toFixed(1)} kg</p>
    {record.sets.map(set => <p className="text-sm text-slate-300" key={`${set.exercise_index}:${set.set_number}`}>{workout?.exercises[set.exercise_index]?.name} · #{set.set_number}: {set.reps} × {set.weight_kg} kg{set.rpe !== null ? ` · RPE ${set.rpe}` : ""}</p>)}
    {record.notes && <p>{record.notes}</p>}{record.feedback.map(item => <blockquote key={item.id} className="border-l-2 border-[#0066ff] pl-3">{item.text}</blockquote>)}
  </div>;
}

