export type CourseLevel = 1 | 2 | 3;

export interface CourseFact {
  icon: "medal" | "video" | "certificate" | "clipboard" | "growth" | "people";
  label: string;
  value: string;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  category: "Personal Trainer" | "Calisthenics";
  level: CourseLevel;
  subtitle: string;
  description: string;
  longDescription: string;
  duration: string;
  mode: string;
  certification: string;
  access: string;
  price: number;
  originalPrice: number;
  heroImage: string;
  badgeText: string;
  facts: CourseFact[];
  topics: string[];
  modulesCount: number;
  totalLessonsCount: number;
  hasPractical: boolean;
  hasExam: boolean;
}

export type ModuleType = "theory" | "skill" | "practical";

export interface CourseModule {
  id: string;
  courseSlug: string;
  number: number;
  title: string;
  subtitle?: string;
  description: string;
  type: ModuleType;
  durationMinutes: number;
  lessonsCount: number;
  isPractical?: boolean;
}

export interface ExerciseDetail {
  code?: string;
  targetMuscle: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string;
  difficulty: string;
  movementType: string;
  setup: string;
  execution: string;
  safetyPoints: string[];
  commonMistakes: string[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  courseSlug: string;
  order: number;
  title: string;
  description: string;
  durationMinutes: number;
  videoUrl?: string;
  videoDuration?: string;
  summary: string;
  keyTakeaways: string[];
  pdfUrl?: string;
  pdfTitle?: string;
  pdfSize?: string;
  allowsDownload?: boolean;
  exerciseDetail?: ExerciseDetail;
}

export interface ExamQuestion {
  id: string;
  number: number;
  question: string;
  correctAnswer: boolean;
  explanation: string;
}

export interface CourseExam {
  id: string;
  courseSlug: string;
  title: string;
  description: string;
  questionsCount: number;
  passingScorePercent: number;
  timeLimitMinutes?: number;
  certificateBody: string;
  questions: ExamQuestion[];
}

export interface WorkoutPlan {
  id: string;
  courseSlug: string;
  title: string;
  subtitle: string;
  description: string;
  level: string;
  durationWeeks: string;
  pdfUrl: string;
  pdfSize: string;
}

export interface MuscleGroupItem {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  primaryEquipment: string[];
}

export interface UserCourseProgress {
  courseSlug: string;
  completedLessonIds: string[];
  completedModuleIds: string[];
  examPassed: boolean;
  examScore?: number;
  lastAccessedModuleId?: string;
  lastAccessedLessonId?: string;
  updatedAt: string;
}
