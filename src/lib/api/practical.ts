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

export interface PracticalData {
  workoutPlans: WorkoutPlan[];
  pt2WorkoutPlans?: WorkoutPlan[];
  pt3Resources?: {
    templates: { id: string; title: string; description: string; format: string; downloadUrl: string }[];
    caseStudies: { id: string; title: string; subtitle: string; category: string; overview: string; rationale: string; keyOutcomes: string }[];
    professionalDocs: { id: string; title: string; description: string; format: string; category: string }[];
  };
  muscleGroups: MuscleGroupItem[];
  sampleGymExercises: GymExercise[];
}

const practicalDataByLocale: Record<string, PracticalData> = {
  it: itPractical as unknown as PracticalData,
  en: enPractical as unknown as PracticalData,
};

export function getWorkoutPlans(locale: string = "it", courseSlug: string = "personal-trainer-1"): WorkoutPlan[] {
  const data = practicalDataByLocale[locale] || practicalDataByLocale.it;
  if (courseSlug === "personal-trainer-2" && data.pt2WorkoutPlans) {
    return data.pt2WorkoutPlans;
  }
  return data.workoutPlans;
}

export function getMuscleGroups(locale: string = "it"): MuscleGroupItem[] {
  return (practicalDataByLocale[locale] || practicalDataByLocale.it).muscleGroups;
}

export function getGymExercises(locale: string = "it"): GymExercise[] {
  return (practicalDataByLocale[locale] || practicalDataByLocale.it).sampleGymExercises;
}

export function getPT3Resources(locale: string = "it") {
  return (practicalDataByLocale[locale] || practicalDataByLocale.it).pt3Resources;
}

export const pt1WorkoutPlans: WorkoutPlan[] = practicalDataByLocale.it.workoutPlans;
export const muscleGroups: MuscleGroupItem[] = practicalDataByLocale.it.muscleGroups;
export const sampleGymExercises: GymExercise[] = practicalDataByLocale.it.sampleGymExercises;

import { apiConfig } from "./config";
import { apiClient } from "./client";

export const practicalService = {
  getWorkoutPlans: async (locale: string = "it", courseSlug: string = "personal-trainer-1"): Promise<WorkoutPlan[]> => {
    if (apiConfig.useMockData) {
      return getWorkoutPlans(locale, courseSlug);
    }
    try {
      return await apiClient.get<WorkoutPlan[]>(`/courses/${courseSlug}/practical-resources/plans`, { locale });
    } catch (err) {
      if (apiConfig.mockFallback) {
        console.warn(`[practicalService.getWorkoutPlans] Live API unavailable for ${courseSlug}, falling back to mock dataset`, err);
        return getWorkoutPlans(locale, courseSlug);
      }
      throw err;
    }
  },

  getMuscleGroups: async (locale: string = "it"): Promise<MuscleGroupItem[]> => {
    if (apiConfig.useMockData) {
      return getMuscleGroups(locale);
    }
    try {
      return await apiClient.get<MuscleGroupItem[]>("/practical-resources/muscle-groups", { locale });
    } catch (err) {
      if (apiConfig.mockFallback) {
        console.warn("[practicalService.getMuscleGroups] Live API unavailable, falling back to mock dataset", err);
        return getMuscleGroups(locale);
      }
      throw err;
    }
  },

  getGymExercises: async (locale: string = "it"): Promise<GymExercise[]> => {
    if (apiConfig.useMockData) {
      return getGymExercises(locale);
    }
    try {
      return await apiClient.get<GymExercise[]>("/practical-resources/exercises", { locale });
    } catch (err) {
      if (apiConfig.mockFallback) {
        return getGymExercises(locale);
      }
      throw err;
    }
  },

  getPT3Resources: async (locale: string = "it") => {
    if (apiConfig.useMockData) {
      return getPT3Resources(locale);
    }
    try {
      return await apiClient.get<ReturnType<typeof getPT3Resources>>("/courses/personal-trainer-3/practical-resources", { locale });
    } catch (err) {
      if (apiConfig.mockFallback) {
        console.warn("[practicalService.getPT3Resources] Live API unavailable, falling back to mock dataset", err);
        return getPT3Resources(locale);
      }
      throw err;
    }
  },
};
