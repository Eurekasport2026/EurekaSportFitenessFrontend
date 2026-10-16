"use client";

import { useLocale } from "next-intl";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/components/features/training-app/AuthProvider";
import { TrainingLoader } from "@/components/features/training-app/TrainingLoader";
import { Link } from "@/i18n/routing";
import { hasRole, roleHome, type Role } from "@/lib/auth/roles";

export function PortalSwitcher() {
  const { session, logout } = useAuth();
  const [pending, setPending] = useState(false);
  const en = useLocale() === "en";
  return <nav aria-label={en ? "Account portals" : "Aree account"} className="flex flex-wrap items-center gap-3 text-sm">
    {session?.user.roles.map(role => <Link key={role} href={roleHome(role)} className="rounded-xl border border-[#1f2937] px-3 py-2 hover:bg-[#1f2937]">{role === "coach" ? "Trainer" : role === "admin" ? "Admin" : en ? "Athlete" : "Atleta"}</Link>)}
    {session && <button type="button" disabled={pending} className="px-3 py-2 text-red-300 disabled:opacity-50" onClick={() => { setPending(true); void logout().catch(() => {}).finally(() => setPending(false)); }}>{en ? "Log out" : "Esci"}</button>}
  </nav>;
}

export function PortalAccess({ role, children }: { role: Role; children: ReactNode }) {
  const { status, session, refresh } = useAuth();
  const en = useLocale() === "en";
  if (status === "loading") return <TrainingLoader label={en ? "Checking account…" : "Verifica account…"} />;
  if (status === "error") return <div><p>{en ? "Unable to verify your account." : "Impossibile verificare il tuo account."}</p><button type="button" onClick={() => void refresh()}>{en ? "Retry" : "Riprova"}</button></div>;
  if (status === "anonymous") return <Link href="/training/app/login">{en ? "Sign in to continue" : "Accedi per continuare"}</Link>;
  if (!hasRole(session?.user, role)) return <div><p>{en ? "Your account does not have access to this portal." : "Il tuo account non ha accesso a questa area."}</p><PortalSwitcher /></div>;
  return <>{children}</>;
}
