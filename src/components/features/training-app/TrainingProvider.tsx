"use client";

import { createContext, useContext, useEffect, useReducer, useRef, useState, type Dispatch, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { initialTrainingState, restoreTrainingState, STORAGE_KEY, trainingReducer, type TrainingAction } from "@/lib/training/state";
import type { TrainingState } from "@/lib/training/types";
import { useAuth } from "./AuthProvider";
import { hasRole } from "@/lib/auth/roles";
import { portalMessage, portalRequest } from "@/lib/api/portal";
import styles from "./training-app.module.css";

export interface TrainingProviderProps { children: ReactNode }
interface TrainingContextValue { state: TrainingState; dispatch: Dispatch<TrainingAction>; hydrated: boolean; persistent: boolean }
const TrainingContext = createContext<TrainingContextValue | null>(null);
type RemoteProfile = { state: TrainingState | null; revision: number };
type LegacyTrainingState = { raw: string; sourceKey: string; fingerprint: string };

interface DataDialogProps {
  title: string;
  description: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

function DataDialog({ title, description, primaryLabel, onPrimary, secondaryLabel, onSecondary }: DataDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (!dialog.current?.open) dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className={`${styles.infoDialog} ${styles.dataDialog}`} aria-labelledby="fit-data-dialog-title" aria-describedby="fit-data-dialog-description" onCancel={event => event.preventDefault()}>
    <span className={styles.eyebrow}>EUREKA! FIT</span>
    <h2 id="fit-data-dialog-title">{title}</h2>
    <p id="fit-data-dialog-description">{description}</p>
    <div className={styles.buttonRow}>
      {secondaryLabel && onSecondary && <button type="button" className={styles.secondaryButton} onClick={onSecondary}>{secondaryLabel}</button>}
      <button type="button" className={styles.primaryButton} autoFocus onClick={onPrimary}>{primaryLabel}</button>
    </div>
  </dialog>;
}

function serializable(state: TrainingState) {
  const { name: _name, ...profile } = state.profile;
  return { ...state, profile };
}

function legacyFingerprint(sourceKey: string, raw: string) {
  let hash = 2166136261;
  for (let index = 0; index < raw.length; index += 1) hash = Math.imul(hash ^ raw.charCodeAt(index), 16777619);
  return `${sourceKey}:${raw.length}:${(hash >>> 0).toString(36)}`;
}

export function TrainingProvider({ children }: TrainingProviderProps) {
  const { session, status } = useAuth();
  const en = useLocale() === "en";
  const t = useTranslations("TrainingApp.dataSync");
  const [state, dispatch] = useReducer(trainingReducer, undefined, initialTrainingState);
  const [loaded, setLoaded] = useState("");
  const [persistent, setPersistent] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [revision, setRevision] = useState<number | null>(null);
  const [retry, setRetry] = useState(0);
  const [legacy, setLegacy] = useState<LegacyTrainingState | null>(null);
  const [recovery, setRecovery] = useState<string | null>(null);
  const saved = useRef("");
  const activeWrite = useRef<AbortController | null>(null);
  const key = `${STORAGE_KEY}:account:${session ? encodeURIComponent(session.user.id) : "guest-v2"}`;
  const legacyDecisionKey = `${key}:legacy-reviewed`;
  const canSync = status === "authenticated" && hasRole(session?.user, "athlete");
  const hydrated = loaded === key && (status === "anonymous" || status === "authenticated");
  useEffect(() => {
    const controller = new AbortController();
    activeWrite.current?.abort(); activeWrite.current = null;
    setRevision(null); setError(null); setLegacy(null); setRecovery(null); setLoaded("");
    if (status !== "anonymous" && status !== "authenticated") return () => controller.abort();
    let local = initialTrainingState();
    try {
      local = restoreTrainingState(localStorage.getItem(key));
      setRecovery(localStorage.getItem(key + ":before-reload"));
      const candidates = [STORAGE_KEY, ...(session ? [`${STORAGE_KEY}:account:guest-v2`] : [])];
      const candidate = candidates.map(sourceKey => {
        const raw = localStorage.getItem(sourceKey);
        return raw ? { raw, sourceKey, fingerprint: legacyFingerprint(sourceKey, raw) } : null;
      }).find((value): value is LegacyTrainingState => Boolean(value && localStorage.getItem(legacyDecisionKey) !== value.fingerprint));
      setLegacy(candidate ?? null);
    } catch { setPersistent(false); }
    const hydrate = (next: TrainingState) => {
      dispatch({ type: "hydrate", state: { ...next, profile: { ...next.profile, name: "" } } });
      saved.current = JSON.stringify(serializable(next)); setLoaded(key);
    };
    if (!canSync) { hydrate(local); return () => controller.abort(); }
    portalRequest<RemoteProfile>("me/training/profile", "GET", undefined, controller.signal, session?.user.id ?? "").then(remote => {
      if (controller.signal.aborted) return;
      if (retry > 0 && remote.state && JSON.stringify(serializable(local)) !== JSON.stringify(remote.state)) {
        const backup = JSON.stringify(serializable(local));
        try { localStorage.setItem(key + ":before-reload", backup); setRecovery(backup); } catch { setPersistent(false); }
      }
      hydrate(remote.state ? restoreTrainingState(JSON.stringify(remote.state)) : local);
      if (!remote.state) saved.current = "";
      setRevision(remote.revision);
    }).catch(failure => { if (!controller.signal.aborted) { hydrate(local); setError(failure); } });
    return () => { controller.abort(); activeWrite.current?.abort(); activeWrite.current = null; };
  }, [key, status, canSync, retry, session?.user.id]);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(key, JSON.stringify(serializable(state))); }
    catch { setPersistent(false); }
    const json = JSON.stringify(serializable(state));
    if (!canSync || revision === null || error || activeWrite.current || saved.current === json) return;
    const timer = setTimeout(() => {
      const controller = new AbortController(); activeWrite.current = controller;
      portalRequest<RemoteProfile>("me/training/profile", "PUT", { revision, state: serializable(state) }, controller.signal, session?.user.id ?? "").then(remote => {
        if (!controller.signal.aborted) { saved.current = json; activeWrite.current = null; setRevision(remote.revision); }
      }).catch(failure => { if (!controller.signal.aborted) setError(failure); })
        .finally(() => { if (activeWrite.current === controller) activeWrite.current = null; });
    }, 800);
    return () => clearTimeout(timer);
  }, [state, key, hydrated, canSync, revision, error]);
  const showSyncError = false;
  const dialog = showSyncError && hydrated && error != null
    ? <DataDialog title={t("error.title")} description={portalMessage(error, en)} primaryLabel={t("error.reload")} onPrimary={() => setRetry(value => value + 1)} />
    : hydrated && recovery
      ? <DataDialog title={t("recovery.title")} description={t("recovery.description")} primaryLabel={t("recovery.restore")} onPrimary={() => { dispatch({ type: "hydrate", state: restoreTrainingState(recovery) }); setRecovery(null); }} secondaryLabel={t("recovery.keep")} onSecondary={() => setRecovery(null)} />
      : hydrated && legacy
        ? <DataDialog title={t("legacy.title")} description={t("legacy.description")} primaryLabel={t("legacy.import")} onPrimary={() => {
            const imported = restoreTrainingState(legacy.raw);
            const next = { ...imported, profile: { ...imported.profile, name: "" } };
            try {
              localStorage.setItem(key, JSON.stringify(serializable(next)));
              localStorage.setItem(legacyDecisionKey, legacy.fingerprint);
              localStorage.removeItem(legacy.sourceKey);
            } catch { setPersistent(false); }
            dispatch({ type: "hydrate", state: next });
            setLegacy(null);
          }} secondaryLabel={t("legacy.keep")} onSecondary={() => {
            try { localStorage.setItem(legacyDecisionKey, legacy.fingerprint); } catch { setPersistent(false); }
            setLegacy(null);
          }} />
        : null;
  return <TrainingContext.Provider value={{ state: hydrated ? state : initialTrainingState(), dispatch, hydrated, persistent }}>
    <div className={styles.providerRoot}>{dialog}{children}</div>
  </TrainingContext.Provider>;
}

export function useTraining() {
  const value = useContext(TrainingContext);
  if (!value) throw new Error("TrainingProvider is required");
  return value;
}
