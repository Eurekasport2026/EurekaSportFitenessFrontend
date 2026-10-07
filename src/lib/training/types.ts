export const goals = ["shape", "fitness", "lean", "muscle", "weight", "strength", "mobility", "calisthenics", "wellbeing"] as const;
export type TrainingGoal = (typeof goals)[number];
export type Experience = "new" | "months" | "year" | "years" | "advanced";
export type Equipment = "commercial" | "small" | "home" | "bodyweight";
export type Lifestyle = "sedentary" | "active" | "standing";
export type Units = "metric" | "imperial";

export const steps = ["gender", "experience", "goal", "frequency", "lifestyle", "equipment", "motivation", "height", "weight", "age", "schedule", "ready"] as const;
export type OnboardingStep = (typeof steps)[number];

export interface TrainingProfile {
  name: string;
  avatar: string;
  gender: "male" | "female" | "other" | null;
  experience: Experience | null;
  goal: TrainingGoal | null;
  lifestyle: Lifestyle | null;
  equipment: Equipment | null;
  heightCm: number;
  weightKg: number;
  age: number;
  frequency: number;
  weekdays: number[];
  time: string;
}

export interface TrainingState {
  version: 1;
  profile: TrainingProfile;
  step: number;
  complete: boolean;
  selectedDay: number;
  units: Units;
  reminders: boolean;
}

export interface TrainingExercise {
  id: string;
  name: string;
  muscle: "chest" | "back" | "shoulders" | "quadriceps" | "glutes" | "core" | "full-body";
  sets: number;
  reps: string;
  cue: string;
}

export interface TrainingWorkout {
  id: string;
  focus: "fullBody" | "upperBody" | "lowerBody" | "mobility";
  minutes: number;
  exercises: TrainingExercise[];
}

export interface TrainingPreview {
  source: "preview";
  workouts: TrainingWorkout[];
}
