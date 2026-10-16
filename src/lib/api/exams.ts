import "server-only";
import { cache } from "react";
import type { PublicCourseExam } from "./types";
import { courseRecord, requestCourseApi } from "./course-api-server";

type ExamResponse = { status: "ready"; exam: PublicCourseExam } | { status: "error" | "not_found" };

/** Read public questions only. The backend retains answer keys and scores attempts. */
export const getExamByCourse = cache(async (slug: string, locale = "it"): Promise<ExamResponse> => {
  const result = await requestCourseApi("courses/" + slug + "/exam", locale === "en" ? "en" : "it");
  if (result.status !== "ready") return result;
  const envelope = courseRecord(result.payload);
  const exam = courseRecord(envelope?.data);
  if (envelope?.success !== true || !exam || typeof exam.id !== "string" || exam.courseSlug !== slug ||
      typeof exam.title !== "string" || typeof exam.description !== "string" || typeof exam.certificateBody !== "string" ||
      typeof exam.passingScorePercent !== "number" || exam.passingScorePercent < 0 || exam.passingScorePercent > 100 ||
      !Array.isArray(exam.questions) || !exam.questions.length || exam.questions.length > 200) return { status: "error" };
  const questions: PublicCourseExam["questions"] = [];
  const ids = new Set<string>();
  for (const value of exam.questions) {
    const question = courseRecord(value);
    if (!question || typeof question.id !== "string" || !question.id || ids.has(question.id) ||
        typeof question.number !== "number" || !Number.isSafeInteger(question.number) ||
        typeof question.question !== "string" || !question.question) return { status: "error" };
    ids.add(question.id);
    questions.push({ id: question.id, number: question.number, question: question.question });
  }
  return { status: "ready", exam: {
    id: exam.id, courseSlug: slug, title: exam.title, description: exam.description,
    questionsCount: questions.length, passingScorePercent: exam.passingScorePercent,
    certificateBody: exam.certificateBody, questions,
    timeLimitMinutes: typeof exam.timeLimitMinutes === "number" && Number.isSafeInteger(exam.timeLimitMinutes) && exam.timeLimitMinutes > 0 ? exam.timeLimitMinutes : undefined,
  } };
});
