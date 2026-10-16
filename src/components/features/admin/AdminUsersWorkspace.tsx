"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/components/features/training-app/AuthProvider";
import { TrainingIcon } from "@/components/features/training-app/TrainingIcon";
import { TrainingLoader } from "@/components/features/training-app/TrainingLoader";
import { PortalSwitcher } from "@/components/layout/PortalAccess";
import { AdminUsersContent } from "@/components/features/portals/PortalWorkspace";
import { hasRole } from "@/lib/auth/roles";
import { AdminNavTabs } from "./AdminNavTabs";
import styles from "./admin-users.module.css";

export function AdminUsersWorkspace() {
  const locale = useLocale();
  const en = locale === "en";
  const { status, session, refresh } = useAuth();
  const allowed = status === "authenticated" && hasRole(session?.user, "admin");
  return <main id="main" data-admin-workspace className={styles.page}>
    {allowed && <div className={styles.consoleNav}><AdminNavTabs activeTab="users" locale={locale} currentUser={session?.user} /></div>}
    <header className={styles.pageHeader}>
      <div><span className={styles.eyebrow}><i />{en ? "EUREKA / ADMIN WORKSPACE" : "EUREKA / AREA ADMIN"}</span><h1>{en ? "Users & access" : "Utenti e accessi"}<span>.</span></h1><p>{en ? "A clear view of your people, their permissions and the team around them." : "Una visione chiara delle persone, dei loro permessi e del team che le affianca."}</p></div>
      {allowed && <a className={styles.primary} href="#admin-invite"><TrainingIcon name="user" />{en ? "Invite a Trainer" : "Invita un Trainer"}<TrainingIcon name="arrow" /></a>}
    </header>
    {status === "loading" ? <div className={styles.loading}><TrainingLoader label={en ? "Checking your Admin access…" : "Verifica del tuo accesso Admin…"} /></div> : allowed ? <AdminUsersContent key={session?.user.id} /> : <section className={styles.accessLayout}>
      <div className={styles.accessIntro}><div className={styles.accessMark}><TrainingIcon name="crown" /></div><span className={styles.eyebrow}>{en ? "ONE PLACE. YOUR WHOLE TEAM." : "UN SOLO SPAZIO. TUTTO IL TEAM."}</span><h2>{en ? "Keep your team\nmoving forward." : "Fai crescere\nil tuo team."}</h2><p>{en ? "The Admin workspace brings account access, Trainer invitations and athlete assignments together." : "L’area Admin riunisce accessi agli account, inviti ai Trainer e assegnazioni degli atleti."}</p><ul className={styles.featureList}><li><TrainingIcon name="check" />{en ? "Manage account roles and status" : "Gestisci ruoli e stato degli account"}</li><li><TrainingIcon name="check" />{en ? "Connect Trainers with their athletes" : "Collega i Trainer ai loro atleti"}</li><li><TrainingIcon name="check" />{en ? "Review activity and Academy submissions" : "Controlla attività ed elaborati Academy"}</li></ul></div>
      <div className={styles.accessCard}>
        <div className={styles.accessIcon}><TrainingIcon name={status === "error" ? "help" : "user"} /></div>
        <span className={styles.eyebrow}>{en ? "ADMIN ACCESS" : "ACCESSO ADMIN"}</span>
        <h2>{status === "error" ? en ? "Let’s reconnect." : "Riconnettiamoci." : status === "anonymous" ? en ? "Your workspace awaits." : "Il tuo spazio ti aspetta." : en ? "Admin permission required." : "È necessario il ruolo Admin."}</h2>
        <p>{status === "error" ? en ? "We couldn’t verify your account. Try again to securely open this workspace." : "Non è stato possibile verificare il tuo account. Riprova per aprire questa area." : status === "anonymous" ? en ? "Sign in with an Admin account to manage users, invitations and team access." : "Accedi con un account Admin per gestire utenti, inviti e accessi del team." : en ? "Your signed-in account does not have Admin access. You can open one of your available portals or sign out to use another account." : "Il tuo account non dispone dell’accesso Admin. Puoi aprire un’area disponibile o uscire per usare un altro account."}</p>
        {status === "anonymous" ? <><Link href="/training/app/login" className={styles.primary}>{en ? "Sign in to Admin" : "Accedi all’area Admin"}<TrainingIcon name="arrow" /></Link><Link href="/" className={styles.secondary}>{en ? "Back to the website" : "Torna al sito"}</Link></> : status === "error" ? <button className={styles.primary} type="button" onClick={() => void refresh()}>{en ? "Try again" : "Riprova"}<TrainingIcon name="arrow" /></button> : <div className={styles.availablePortals}><strong>{session?.user.name}</strong><PortalSwitcher /></div>}
        <div className={styles.accessNote}><TrainingIcon name="check" /><span>{en ? "Access follows the permissions assigned to your account." : "L’accesso segue i permessi assegnati al tuo account."}</span></div>
      </div>
    </section>}
  </main>;
}
