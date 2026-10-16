import { portalRequest } from "./portal";
import type { AssignmentSubmission, UserCourseProgress } from "./types";

export interface LearningProgress extends UserCourseProgress { enrolled: boolean }
export interface ExamResult { score: number; passed: boolean; practice: boolean; review: { id: string; correctAnswer: boolean; explanation: string }[] }

export function learningServiceFor(owner?: string) {
  const portalRequestForAccount = <T,>(path: string, method = "GET", body?: unknown, signal?: AbortSignal) => portalRequest<T>(path, method, body, signal, owner);
  return {
  progress: (slug: string, signal?: AbortSignal) => portalRequestForAccount<LearningProgress>(`me/courses/${slug}/progress`, "GET", undefined, signal),
  importLessons: (slug: string, completed_lesson_ids: string[]) => portalRequestForAccount<LearningProgress>(`me/courses/${slug}/progress/import`, "POST", { completed_lesson_ids }),
  enroll: (slug: string) => portalRequestForAccount<LearningProgress>(`me/courses/${slug}/enrollment`, "POST", {}),
  lesson: (slug: string, lesson: string, completed: boolean) => portalRequestForAccount<LearningProgress>(`me/courses/${slug}/lessons/${lesson}`, "PUT", { completed }),
  exam: (slug: string, answers: Record<string, boolean>, practice: boolean, locale: "it" | "en" = "it") => portalRequestForAccount<ExamResult>(`me/courses/${slug}/exam`, "POST", { answers, practice, locale }),
  practice: (slug: string, question_id: string, answer: boolean, locale: "it" | "en" = "it") => portalRequestForAccount<ExamResult["review"][number]>(`me/courses/${slug}/exam/practice`, "POST", { question_id, answer, locale }),
  submission: (slug: string, signal?: AbortSignal) => portalRequestForAccount<AssignmentSubmission>(`me/courses/${slug}/assignment`, "GET", undefined, signal),
  submit: (slug: string, title: string, notes: string, resource_url?: string) => portalRequestForAccount<AssignmentSubmission>(`me/courses/${slug}/assignment`, "POST", { title, notes, resource_url: resource_url || null }),
  };
}
export const learningService = learningServiceFor();
