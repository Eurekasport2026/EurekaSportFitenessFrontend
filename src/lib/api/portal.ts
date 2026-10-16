import { invalidateClientReads } from "./client-reads";
import type { AuthUser } from "./auth";
import { getStorageOwner } from "@/lib/auth/account-storage";
import { validPortalResponse } from "./portal-contracts";

export interface ExercisePrescription { name: string; sets: number; reps: string; rest_seconds: number }
export interface ProgramWorkout { title: string; exercises: ExercisePrescription[] }
export interface Program { id: string; title: string; version: number; workouts: ProgramWorkout[] }
export interface Assignment { id: string; athlete_id: string; coach_id: string; program: Program; created_at: string }
export interface LoggedSet { exercise_index: number; set_number: number; reps: number; weight_kg: number; rpe: number | null }
export interface WorkoutRecord { id: string; athlete_id: string; assignment_id: string; workout_index: number; sets: LoggedSet[]; notes: string; completed_at: string; program: Program; feedback: { id: string; text: string; created_at: string }[] }
export interface AthleteDashboard {
  as_of: string; local_date: string; utc_offset_minutes: number;
  total_sessions: number; month_sessions: number; week_sessions: number;
  assigned_programs: number; feedback_count: number; education_count: number;
  week_days: { date: string; sessions: number }[];
  weekly_activity: { date: string; sessions: number }[];
  coaches: { id: string; name: string }[];
  education: { slug: string; title: string; category: string; level: number; modules: number; lessons: number }[];
}
export interface UserPage { items: (Omit<AuthUser, "status"> & { status: "active" | "suspended" })[]; total: number; offset: number; limit: number }
export interface RosterLink { coach_id: string; athlete_id: string; coach_name: string; coach_email: string; athlete_name: string; athlete_email: string }
export interface AuditRecord { id: string; actor_id: string; action: string; target_id: string; created_at: string }

export class PortalError extends Error {
  constructor(public status: number) { super(`Request failed (${status})`); }
}

/** Same-origin only. Credentials are forwarded to the backend by the server. */
export async function portalRequest<T>(path: string, method = "GET", body?: unknown, signal?: AbortSignal, expectedOwner?: string): Promise<T> {
  const owner = expectedOwner === undefined ? getStorageOwner() : expectedOwner;
  if (!owner) throw new PortalError(401);
  if (getStorageOwner() !== owner) throw new PortalError(409);
  const headers: Record<string, string> = { Accept: "application/json", "X-Eureka-Account": owner };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(`/api/portal/${path}`, {
    method, credentials: "same-origin", cache: "no-store", signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(20000)]) : AbortSignal.timeout(20000),
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const envelope: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new PortalError(response.status);
  if (getStorageOwner() !== owner) throw new PortalError(409);
  if (!validPortalResponse(path, method, envelope)) throw new PortalError(502);
  if (method !== "GET") invalidateClientReads();
  return envelope.data as T;
}

export function portalMessage(error: unknown, en: boolean) {
  const status = error instanceof PortalError ? error.status : 0;
  if (status === 401) return en ? "Please sign in again." : "Accedi nuovamente.";
  if (status === 403) return en ? "Your account does not have permission for this action." : "Il tuo account non ha i permessi per questa azione.";
  if (status === 409) return en ? "The record changed or conflicts with an existing record. Reload and try again." : "Il record è cambiato o è in conflitto. Ricarica e riprova.";
  if (status === 422) return en ? "Check the required fields and values." : "Controlla i campi obbligatori e i valori.";
  if (status === 404) return en ? "This record is unavailable for your account." : "Questo record non è disponibile per il tuo account.";
  return en ? "The service is unavailable. Please try again." : "Il servizio non è disponibile. Riprova.";
}
