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

const STORAGE_PREFIX = "eureka_assignment_v2_";

export function loadAssignmentSubmission(courseSlug: string): AssignmentSubmission {
  if (typeof window === "undefined") {
    return {
      id: `${courseSlug}-sub`,
      courseSlug,
      type: courseSlug === "calisthenics-2" ? "practical_video" : "project_work",
      status: "not_submitted",
      title: "",
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${courseSlug}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Failed to load assignment submission", err);
  }

  return {
    id: `${courseSlug}-sub`,
    courseSlug,
    type: courseSlug === "calisthenics-2" ? "practical_video" : "project_work",
    status: "not_submitted",
    title: "",
    updatedAt: new Date().toISOString(),
  };
}

export function saveAssignmentSubmission(
  courseSlug: string,
  submission: Partial<AssignmentSubmission>
): AssignmentSubmission {
  const current = loadAssignmentSubmission(courseSlug);
  const updated: AssignmentSubmission = {
    ...current,
    ...submission,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${courseSlug}`, JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to save assignment submission", err);
    }
  }

  return updated;
}

import { apiConfig } from "./config";
import { apiClient } from "./client";

export const assignmentsService = {
  getBrief: async (courseSlug: string, locale: string = "it"): Promise<ProjectWorkBrief | undefined> => {
    if (apiConfig.useMockData) {
      return getAssignmentBrief(courseSlug, locale);
    }
    try {
      return await apiClient.get<ProjectWorkBrief>(`/courses/${courseSlug}/assignments/brief`, { locale });
    } catch (err) {
      if (apiConfig.mockFallback) {
        console.warn(`[assignmentsService.getBrief] Live API unavailable for ${courseSlug}, falling back to mock dataset`, err);
        return getAssignmentBrief(courseSlug, locale);
      }
      throw err;
    }
  },

  getSubmission: async (courseSlug: string): Promise<AssignmentSubmission> => {
    if (apiConfig.useMockData) {
      return loadAssignmentSubmission(courseSlug);
    }
    try {
      return await apiClient.get<AssignmentSubmission>(`/me/courses/${courseSlug}/assignment`);
    } catch (err) {
      if (apiConfig.mockFallback) {
        return loadAssignmentSubmission(courseSlug);
      }
      throw err;
    }
  },

  saveSubmission: async (courseSlug: string, submission: Partial<AssignmentSubmission>): Promise<AssignmentSubmission> => {
    if (apiConfig.useMockData) {
      return saveAssignmentSubmission(courseSlug, submission);
    }
    try {
      const result = await apiClient.post<AssignmentSubmission>(`/me/courses/${courseSlug}/assignment`, submission);
      // Synchronize with local storage as secondary backup
      saveAssignmentSubmission(courseSlug, result);
      return result;
    } catch (err) {
      if (apiConfig.mockFallback) {
        console.warn(`[assignmentsService.saveSubmission] Live API unavailable for ${courseSlug}, falling back to local storage`, err);
        return saveAssignmentSubmission(courseSlug, submission);
      }
      throw err;
    }
  },
};
