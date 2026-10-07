import { goals, steps, type TrainingProfile, type TrainingState } from "./types";

export const STORAGE_KEY = "eureka-training-v1";

export function initialTrainingState(): TrainingState {
  return {
    version: 1,
    profile: { name: "", avatar: "", gender: null, experience: null, goal: null, lifestyle: null, equipment: null, heightCm: 170, weightKg: 75, age: 32, frequency: 3, weekdays: [1, 3, 5], time: "18:30" },
    step: 0, complete: false, selectedDay: 0, units: "metric", reminders: false,
  };
}

function bounded(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max ? value : fallback;
}

function choice<T extends string>(value: unknown, options: readonly T[]): T | null {
  return typeof value === "string" && options.includes(value as T) ? value as T : null;
}

export function isTrainingTimeValid(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function restoreTrainingState(raw: string | null): TrainingState {
  const defaults = initialTrainingState();
  if (!raw) return defaults;
  try {
    const saved = JSON.parse(raw);
    if (!saved || saved.version !== 1 || !saved.profile) return defaults;
    const p = saved.profile;
    const frequency = Math.round(bounded(p.frequency, 3, 1, 7));
    const weekdays: number[] = Array.isArray(p.weekdays) ? [...new Set<number>(p.weekdays.filter((d: unknown) => typeof d === "number" && Number.isInteger(d) && d >= 0 && d <= 6))].sort() : defaults.profile.weekdays;
    const profile: TrainingProfile = {
      name: typeof p.name === "string" ? p.name.slice(0, 60) : "",
      avatar: typeof p.avatar === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(p.avatar) && p.avatar.length < 3000000 ? p.avatar : "",
      gender: choice(p.gender, ["male", "female", "other"]),
      experience: choice(p.experience, ["new", "months", "year", "years", "advanced"]),
      goal: choice(p.goal, goals),
      lifestyle: choice(p.lifestyle, ["sedentary", "active", "standing"]),
      equipment: choice(p.equipment, ["commercial", "small", "home", "bodyweight"]),
      heightCm: bounded(p.heightCm, 170, 100, 250), weightKg: bounded(p.weightKg, 75, 30, 350), age: Math.round(bounded(p.age, 32, 18, 100)),
      frequency, weekdays, time: typeof p.time === "string" && isTrainingTimeValid(p.time) ? p.time : "18:30",
    };
    return {
      ...defaults, profile,
      step: Math.round(bounded(saved.step, 0, 0, steps.length - 1)),
      complete: saved.complete === true && isProfileComplete(profile),
      selectedDay: Math.round(bounded(saved.selectedDay, 0, 0, frequency - 1)),
      units: saved.units === "imperial" ? "imperial" : "metric", reminders: saved.reminders === true,
    };
  } catch { return defaults; }
}

export function isProfileComplete(profile: TrainingProfile): boolean {
  return Boolean(profile.gender && profile.experience && profile.goal && profile.lifestyle && profile.equipment && profile.weekdays.length === profile.frequency && isTrainingTimeValid(profile.time));
}

export type TrainingAction =
  | { type: "hydrate"; state: TrainingState }
  | { type: "profile"; patch: Partial<TrainingProfile> }
  | { type: "step"; step: number }
  | { type: "complete" }
  | { type: "restart" }
  | { type: "reset" }
  | { type: "preferences"; patch: Partial<Pick<TrainingState, "units" | "reminders" | "selectedDay">> };

export function trainingReducer(state: TrainingState, action: TrainingAction): TrainingState {
  switch (action.type) {
    case "hydrate": return action.state;
    case "profile": {
      const profile = { ...state.profile, ...action.patch };
      return { ...state, profile, complete: state.complete && isProfileComplete(profile), selectedDay: Math.min(state.selectedDay, profile.frequency - 1) };
    }
    case "step": return { ...state, step: Math.max(0, Math.min(steps.length - 1, action.step)) };
    case "complete": return isProfileComplete(state.profile) ? { ...state, complete: true, step: steps.length - 1 } : state;
    case "restart": return { ...state, complete: false, step: 0, selectedDay: 0 };
    case "reset": return initialTrainingState();
    case "preferences": return { ...state, ...action.patch };
  }
}

export function measurementLimits(field: "heightCm" | "weightKg" | "age", imperial: boolean) {
  if (field === "age") return { min: 18, max: 100, step: 1, unit: "" };
  if (field === "heightCm") return imperial ? { min: 39.4, max: 98.4, step: 0.1, unit: "in" } : { min: 100, max: 250, step: 0.1, unit: "cm" };
  return imperial ? { min: 66.2, max: 771.6, step: 0.1, unit: "lb" } : { min: 30, max: 350, step: 0.1, unit: "kg" };
}

export function displayMeasurement(value: number, field: "heightCm" | "weightKg" | "age", imperial: boolean) {
  return Number((imperial && field !== "age" ? field === "heightCm" ? value / 2.54 : value / 0.45359237 : value).toFixed(field === "age" ? 0 : 1));
}

export function canonicalMeasurement(value: number, field: "heightCm" | "weightKg" | "age", imperial: boolean) {
  const converted = imperial && field !== "age" ? field === "heightCm" ? value * 2.54 : value * 0.45359237 : value;
  const limits = measurementLimits(field, false);
  return Math.min(limits.max, Math.max(limits.min, Number(converted.toFixed(field === "age" ? 0 : 2))));
}
