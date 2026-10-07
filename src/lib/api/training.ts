import { createTrainingPreview } from "@/lib/training/templates";
import type { TrainingPreview, TrainingProfile } from "@/lib/training/types";

/** Local preview adapter. Production personalization requires an approved API contract. */
export const trainingService = {
  getPreview: async (profile: TrainingProfile): Promise<TrainingPreview> => createTrainingPreview(profile),
};
