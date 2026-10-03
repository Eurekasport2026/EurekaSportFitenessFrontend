import type { CourseExam } from "./types";
import itExams from "./data/it/exams.json";
import enExams from "./data/en/exams.json";

const examsData: Record<string, Record<string, CourseExam>> = {
  it: itExams as unknown as Record<string, CourseExam>,
  en: enExams as unknown as Record<string, CourseExam>,
};

export const courseExams: Record<string, CourseExam> = examsData.it;

export function getExamByCourse(courseSlug: string, locale: string = "it"): CourseExam | undefined {
  const dict = examsData[locale] || examsData.it;
  return dict[courseSlug];
}

import { apiConfig } from "./config";
import { apiClient } from "./client";

export const examsService = {
  getByCourse: async (courseSlug: string, locale: string = "it"): Promise<CourseExam | undefined> => {
    if (apiConfig.useMockData) {
      return getExamByCourse(courseSlug, locale);
    }
    try {
      return await apiClient.get<CourseExam>(`/courses/${courseSlug}/exam`, { locale });
    } catch (err) {
      if (apiConfig.mockFallback) {
        console.warn(`[examsService.getByCourse] Live API unavailable for ${courseSlug}, falling back to mock dataset`, err);
        return getExamByCourse(courseSlug, locale);
      }
      throw err;
    }
  },

  submit: async (
    courseSlug: string,
    answers: Record<number, boolean>,
    mode: "exam" | "practice" = "exam"
  ): Promise<{ score: number; passed: boolean }> => {
    if (apiConfig.useMockData) {
      const exam = getExamByCourse(courseSlug);
      if (!exam) return { score: 0, passed: false };
      let correct = 0;
      exam.questions.forEach((q, idx) => {
        if (answers[idx] === q.correctAnswer) correct++;
      });
      const score = Math.round((correct / exam.questions.length) * 100);
      return { score, passed: score >= exam.passingScorePercent };
    }
    try {
      return await apiClient.post<{ score: number; passed: boolean }>(`/courses/${courseSlug}/exam/submit`, {
        answers,
        mode,
      });
    } catch (err) {
      if (apiConfig.mockFallback) {
        console.warn(`[examsService.submit] Live API unavailable for ${courseSlug}, falling back to local calculation`, err);
        const exam = getExamByCourse(courseSlug);
        if (!exam) return { score: 0, passed: false };
        let correct = 0;
        exam.questions.forEach((q, idx) => {
          if (answers[idx] === q.correctAnswer) correct++;
        });
        const score = Math.round((correct / exam.questions.length) * 100);
        return { score, passed: score >= exam.passingScorePercent };
      }
      throw err;
    }
  },
};
