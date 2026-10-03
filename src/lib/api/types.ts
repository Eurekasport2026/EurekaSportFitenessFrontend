export type CourseLevel = 1 | 2 | 3;

export interface CourseFact {
  icon: "medal" | "video" | "certificate" | "clipboard" | "growth" | "people";
  label: string;
  value: string;
}

export type PracticalType = "gym_library" | "advanced_resources" | "case_studies_project" | "skill_library";

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
  hasProjectWork?: boolean;
  hasPracticalSubmission?: boolean;
  practicalType?: PracticalType;
}

export type ModuleType = "theory" | "skill" | "practical" | "case_study";

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
  skillLevel?: string;
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

export type LearningItemType = "video" | "pdf" | "case_study" | "exercise_card" | "template" | "assignment";
export type MediaStatus = "available" | "in_production" | "offline_only";

export interface Lesson {
  id: string;
  moduleId: string;
  courseSlug: string;
  order: number;
  title: string;
  description: string;
  durationMinutes: number;
  itemType?: LearningItemType;
  mediaStatus?: MediaStatus;
  videoUrl?: string;
  videoDuration?: string;
  summary: string;
  keyTakeaways: string[];
  pdfUrl?: string;
  pdfTitle?: string;
  pdfSize?: string;
  allowsDownload?: boolean;
  rapidCode?: string;
  programCode?: string;
  progressionStep?: number;
  phase?: string;
  regressionCode?: string;
  progressionCode?: string;
  exerciseDetail?: ExerciseDetail;
  caseStudyDetail?: {
    clientProfile: string;
    challenge: string;
    solutionRationale: string;
    outcomeMetrics: string;
  };
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

export interface CaseStudyItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  overview: string;
  rationale: string;
  keyOutcomes: string;
  pdfUrl?: string;
}

export interface ProfessionalDocItem {
  id: string;
  title: string;
  description: string;
  format: string;
  category: string;
  pdfUrl?: string;
}

export interface ProjectWorkBrief {
  id: string;
  courseSlug: string;
  title: string;
  subtitle: string;
  description: string;
  rubric: string[];
  templateUrl: string;
  submissionGuidelines: string[];
}

export type AssignmentStatus = "not_submitted" | "draft" | "submitted" | "under_review" | "approved" | "changes_requested";

export interface AssignmentSubmission {
  id: string;
  courseSlug: string;
  type: "project_work" | "practical_video";
  status: AssignmentStatus;
  submittedAt?: string;
  title: string;
  notes?: string;
  fileName?: string;
  reviewerFeedback?: string;
  updatedAt: string;
}

export interface UserCourseProgress {
  version?: number;
  courseSlug: string;
  completedLessonIds: string[];
  completedModuleIds: string[];
  examPassed: boolean;
  examScore?: number;
  assignmentStatus?: AssignmentStatus;
  lastAccessedModuleId?: string;
  lastAccessedLessonId?: string;
  updatedAt: string;
}
