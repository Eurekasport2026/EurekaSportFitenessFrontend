import type { ProjectWorkBrief, AssignmentSubmission } from "./types";
import itAssignments from "./data/it/assignments.json";
import enAssignments from "./data/en/assignments.json";

interface AssignmentData {
  brief: ProjectWorkBrief;
}

const assignmentsDataByLocale: Record<string, Record<string, AssignmentData>> = {
  it: itAssignments as unknown as Record<string, AssignmentData>,
  en: enAssignments as unknown as Record<string, AssignmentData>,
};

export function getAssignmentBrief(courseSlug: string, locale: string = "it"): ProjectWorkBrief | undefined {
  const dict = assignmentsDataByLocale[locale] || assignmentsDataByLocale.it;
  return dict[courseSlug]?.brief;
}

import { learningService } from "./learning";

export const assignmentsService = {
  getBrief: async (courseSlug: string, locale = "it") => getAssignmentBrief(courseSlug, locale),
  getSubmission: learningService.submission,
  saveSubmission: (courseSlug: string, submission: Partial<AssignmentSubmission>) =>
    learningService.submit(courseSlug, submission.title ?? "", submission.notes ?? ""),
};
