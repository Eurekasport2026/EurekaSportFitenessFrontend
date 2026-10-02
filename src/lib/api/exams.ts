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
