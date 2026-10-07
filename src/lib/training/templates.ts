import type { TrainingExercise, TrainingPreview, TrainingProfile, TrainingWorkout } from "./types";

const bodyweight: TrainingExercise[] = [
  { id: "kneePushup", name: "kneePushup", muscle: "chest", sets: 3, reps: "8–12", cue: "pushupCue" },
  { id: "squat", name: "squat", muscle: "quadriceps", sets: 3, reps: "10–15", cue: "squatCue" },
  { id: "bridge", name: "bridge", muscle: "glutes", sets: 3, reps: "12–15", cue: "bridgeCue" },
  { id: "birdDog", name: "birdDog", muscle: "back", sets: 3, reps: "8–10", cue: "birdDogCue" },
  { id: "deadBug", name: "deadBug", muscle: "core", sets: 3, reps: "8–10", cue: "deadBugCue" },
  { id: "plank", name: "plank", muscle: "core", sets: 3, reps: "20–30 s", cue: "plankCue" },
];
const dumbbells: TrainingExercise[] = [
  { id: "benchPress", name: "benchPress", muscle: "chest", sets: 3, reps: "8–12", cue: "pressCue" },
  { id: "dumbbellRow", name: "dumbbellRow", muscle: "back", sets: 3, reps: "10–12", cue: "rowCue" },
  { id: "gobletSquat", name: "gobletSquat", muscle: "quadriceps", sets: 3, reps: "10–12", cue: "squatCue" },
  { id: "shoulderPress", name: "shoulderPress", muscle: "shoulders", sets: 3, reps: "8–12", cue: "shoulderCue" },
  { id: "romanianDeadlift", name: "romanianDeadlift", muscle: "glutes", sets: 3, reps: "10–12", cue: "hingeCue" },
  bodyweight[5],
];
const mobility: TrainingExercise[] = [
  { id: "catCow", name: "catCow", muscle: "back", sets: 2, reps: "8–10", cue: "catCowCue" },
  { id: "hipRotation", name: "hipRotation", muscle: "glutes", sets: 2, reps: "8–10", cue: "hipCue" },
  { id: "thoracicRotation", name: "thoracicRotation", muscle: "back", sets: 2, reps: "8–10", cue: "rotationCue" },
  { id: "ankleRock", name: "ankleRock", muscle: "quadriceps", sets: 2, reps: "10–12", cue: "ankleCue" },
  bodyweight[3], bodyweight[4],
];

/** Illustrative templates only; no prescribed working weights or calorie estimates. */
export function createTrainingPreview(profile: TrainingProfile): TrainingPreview {
  const gentle = profile.goal === "mobility" || profile.goal === "wellbeing";
  const source = gentle ? mobility : profile.equipment === "bodyweight" || profile.goal === "calisthenics" ? bodyweight : dumbbells;
  const beginner = profile.experience === "new" || profile.experience === "months";
  const workouts: TrainingWorkout[] = Array.from({ length: profile.frequency }, (_, day) => {
    const split = !gentle && profile.frequency >= 4;
    const focus = gentle ? "mobility" : split ? day % 2 === 0 ? "upperBody" : "lowerBody" : "fullBody";
    const filtered = split ? source.filter(e => day % 2 === 0 ? ["chest", "back", "shoulders", "core"].includes(e.muscle) : ["quadriceps", "glutes", "core"].includes(e.muscle)) : source;
    const ordered = day % 2 === 0 || split ? filtered : [...filtered.slice(2), ...filtered.slice(0, 2)];
    return { id: `preview-${day}`, focus, minutes: gentle ? 20 : beginner ? 30 : 40, exercises: ordered.map(e => ({ ...e, sets: gentle ? 2 : beginner ? 2 : e.sets, reps: profile.goal === "strength" && !gentle && e.muscle !== "core" ? "6–8" : e.reps })) };
  });
  return { source: "preview", workouts };
}
