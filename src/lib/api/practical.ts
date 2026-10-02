import type { WorkoutPlan, MuscleGroupItem } from "./types";
import itPractical from "./data/it/practical.json";
import enPractical from "./data/en/practical.json";

export interface GymExercise {
  id: string;
  name: string;
  muscleGroupId: string;
  equipment: "Machines" | "Free Weights" | "Cables" | "Kettlebells" | "Bodyweight";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  movementType: "Push" | "Pull" | "Squat" | "Hinge" | "Carry" | "Core";
  primaryMuscles: string[];
  secondaryMuscles: string[];
  setup: string;
  execution: string;
  safetyPoints: string[];
  commonMistakes: string[];
}

interface PracticalData {
  workoutPlans: WorkoutPlan[];
  muscleGroups: MuscleGroupItem[];
  sampleGymExercises: GymExercise[];
}

const practicalDataByLocale: Record<string, PracticalData> = {
  it: itPractical as unknown as PracticalData,
  en: enPractical as unknown as PracticalData,
};

export function getWorkoutPlans(locale: string = "it"): WorkoutPlan[] {
  return (practicalDataByLocale[locale] || practicalDataByLocale.it).workoutPlans;
}

export function getMuscleGroups(locale: string = "it"): MuscleGroupItem[] {
  return (practicalDataByLocale[locale] || practicalDataByLocale.it).muscleGroups;
}

export function getGymExercises(locale: string = "it"): GymExercise[] {
  return (practicalDataByLocale[locale] || practicalDataByLocale.it).sampleGymExercises;
}

export const pt1WorkoutPlans: WorkoutPlan[] = practicalDataByLocale.it.workoutPlans;
export const muscleGroups: MuscleGroupItem[] = practicalDataByLocale.it.muscleGroups;
export const sampleGymExercises: GymExercise[] = practicalDataByLocale.it.sampleGymExercises;
