import type { Equipment, TrainingGoal, TrainingProfile } from "@/lib/training/types";

export const trainingPhotos = {
  gym: "/images/fit/gym.webp",
  home: "/images/fit/home.webp",
  mobility: "/images/fit/mobility.webp",
  strength: "/images/eureka-training-hero.webp",
  bodyweight: "/images/fit/bodyweight.webp",
} as const;

export const profilePhotos = {
  male: "/images/fit/profile-male.webp",
  female: "/images/fit/profile-female.webp",
} as const;

export const goalPhotos: Record<TrainingGoal, string> = {
  shape: trainingPhotos.home,
  fitness: trainingPhotos.home,
  lean: trainingPhotos.mobility,
  muscle: trainingPhotos.gym,
  weight: trainingPhotos.home,
  strength: trainingPhotos.strength,
  mobility: trainingPhotos.mobility,
  calisthenics: trainingPhotos.bodyweight,
  wellbeing: trainingPhotos.mobility,
};

export const equipmentPhotos: Record<Equipment, string> = {
  commercial: trainingPhotos.gym,
  small: trainingPhotos.strength,
  home: trainingPhotos.home,
  bodyweight: trainingPhotos.bodyweight,
};

export function trainingPlanPhoto(profile: TrainingProfile): string {
  if (profile.goal === "mobility" || profile.goal === "wellbeing") return trainingPhotos.mobility;
  return equipmentPhotos[profile.equipment || "bodyweight"];
}
