import type { Lesson } from "./types";
import { getAllModules } from "./modules";
import itLessonsData from "./data/it/lessons.json";
import enLessonsData from "./data/en/lessons.json";

const lessonsDataByLocale: Record<string, Record<string, Partial<Lesson>[]>> = {
  it: itLessonsData as unknown as Record<string, Partial<Lesson>[]>,
  en: enLessonsData as unknown as Record<string, Partial<Lesson>[]>,
};

function generateLessonsForModule(moduleItem: (ReturnType<typeof getAllModules>)[0], locale: string = "it"): Lesson[] {
  const customLessons = lessonsDataByLocale[locale] || lessonsDataByLocale.it;
  const existing = customLessons[moduleItem.id];
  const count = moduleItem.lessonsCount;
  const lessons: Lesson[] = [];
  const isEn = locale === "en";

  for (let i = 1; i <= count; i++) {
    if (existing && existing[i - 1]) {
      const custom = existing[i - 1];
      lessons.push({
        id: `${moduleItem.id}-lesson-${i}`,
        moduleId: moduleItem.id,
        courseSlug: moduleItem.courseSlug,
        order: i,
        title: custom.title || (isEn ? `Lesson ${i}: Deep Dive into ${moduleItem.title}` : `Lezione ${i}: Approfondimento ${moduleItem.title}`),
        description: custom.description || (isEn ? `Theoretical and practical study of core concepts in module ${moduleItem.number}.` : `Studio teorico e pratico dei concetti fondamentali del modulo ${moduleItem.number}.`),
        durationMinutes: custom.durationMinutes || 20,
        videoDuration: custom.videoDuration || "16:30",
        videoUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
        summary: custom.summary || (isEn ? `In this lesson of module "${moduleItem.title}", we explore practical methodologies and protocols.` : `In questa lezione del modulo "${moduleItem.title}", esploriamo gli aspetti operativi e le applicazioni pratiche necessarie per padroneggiare l'argomento.`),
        keyTakeaways: custom.keyTakeaways || (isEn ? [
          `Understanding foundational principles of ${moduleItem.title}.`,
          "Practical application of instructional protocols in real-world training.",
          "Identification and prevention of common errors in gym practice.",
        ] : [
          `Comprensione dei principi cardine di ${moduleItem.title}.`,
          "Applicazione pratica dei protocolli didattici nel contesto reale di allenamento.",
          "Identificazione e prevenzione degli errori più frequenti sul campo.",
        ]),
        pdfTitle: custom.pdfTitle || (isEn ? `Study Guide - Module ${moduleItem.number} (Lesson ${i}).pdf` : `Dispensa Didattica - Modulo ${moduleItem.number} (Lezione ${i}).pdf`),
        pdfSize: custom.pdfSize || "2.5 MB",
        pdfUrl: custom.pdfUrl || `/docs/${moduleItem.courseSlug}-mod-${moduleItem.number}-l${i}.pdf`,
        allowsDownload: true,
        exerciseDetail: custom.exerciseDetail,
      });
    } else {
      lessons.push({
        id: `${moduleItem.id}-lesson-${i}`,
        moduleId: moduleItem.id,
        courseSlug: moduleItem.courseSlug,
        order: i,
        title: isEn
          ? (i === 1 ? `Lesson 1: Foundations and Core Principles` : i === 2 ? `Lesson 2: Technical Application & Analysis` : `Lesson 3: Coaching Cues & Common Errors`)
          : (i === 1 ? `Lezione 1: Fondamenti e Principi Guida` : i === 2 ? `Lezione 2: Applicazione Tecnica e Analisi` : `Lezione 3: Didattica, Errori Comuni e Schede`),
        description: isEn
          ? `Video lessons, study material, and review sheets for module ${moduleItem.number}: ${moduleItem.title}.`
          : `Contenuti video, materiale di studio e schede di verifica per il modulo ${moduleItem.number}: ${moduleItem.title}.`,
        durationMinutes: 20,
        videoDuration: "18:20",
        videoUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
        summary: isEn
          ? `Comprehensive overview and step-by-step breakdown of key principles in module ${moduleItem.number}.`
          : `Panoramica approfondita e spiegazione passo dopo passo dei concetti chiave trattati nel modulo ${moduleItem.number}.`,
        keyTakeaways: isEn ? [
          `Detailed analysis of methods applied to: ${moduleItem.title}.`,
          "Safety protocols and progression scaling for various fitness levels.",
          "Case studies and hands-on drills to master practical competencies.",
        ] : [
          `Analisi dettagliata delle metodologie applicate a: ${moduleItem.title}.`,
          "Protocolli di sicurezza e adattamento per diversi livelli di preparazione.",
          "Casi studio ed esercitazioni pratiche per consolidare le competenze acquisite.",
        ],
        pdfTitle: isEn ? `Official Study Guide - Module ${moduleItem.number}.pdf` : `Dispensa Didattica Ufficiale - Modulo ${moduleItem.number}.pdf`,
        pdfSize: "2.3 MB",
        pdfUrl: `/docs/${moduleItem.courseSlug}-mod-${moduleItem.number}.pdf`,
        allowsDownload: true,
      });
    }
  }

  return lessons;
}

export function getAllLessons(locale: string = "it"): Lesson[] {
  const mods = getAllModules(locale);
  return mods.flatMap((mod) => generateLessonsForModule(mod, locale));
}

export const allLessons: Lesson[] = getAllLessons("it");

export function getLessonsByModule(moduleId: string, locale: string = "it"): Lesson[] {
  return getAllLessons(locale).filter((l) => l.moduleId === moduleId);
}

export function getLessonById(lessonId: string, locale: string = "it"): Lesson | undefined {
  return getAllLessons(locale).find((l) => l.id === lessonId);
}

export function getAdjacentLessons(lessonId: string, locale: string = "it"): { prevLesson?: Lesson; nextLesson?: Lesson } {
  const lessons = getAllLessons(locale);
  const currentIndex = lessons.findIndex((l) => l.id === lessonId);
  if (currentIndex === -1) return {};

  const currentLesson = lessons[currentIndex];
  const courseLessons = lessons.filter((l) => l.courseSlug === currentLesson.courseSlug);
  const courseIndex = courseLessons.findIndex((l) => l.id === lessonId);

  return {
    prevLesson: courseIndex > 0 ? courseLessons[courseIndex - 1] : undefined,
    nextLesson: courseIndex < courseLessons.length - 1 ? courseLessons[courseIndex + 1] : undefined,
  };
}
