export type CourseLevel = 1 | 2 | 3;

export interface CatalogCourse {
  id: string;
  slug: string;
  title: string;
  category: string;
  heroImage: string;
  description?: string;
}

export type CourseCatalogState =
  | { status: "ready"; courses: CatalogCourse[] }
  | { status: "error" };

export interface CourseFact {
  icon: string;
  label: string;
  value: string;
}

export type PracticalType = "gym_library" | "advanced_resources" | "case_studies_project" | "skill_library" | (string & {});

export interface Course {
  id: string;
  slug: string;
  title: string;
  category: string;
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
  practicalType?: PracticalType | null;
}

export interface CourseDetail extends Course {
  modules: CourseModule[];
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

export type AcademyDataState<T> =
  | { status: "ready"; data: T }
  | { status: "not_found" }
  | { status: "error" };

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

export type LessonReference = Pick<Lesson, "id" | "moduleId" | "courseSlug">;

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

export type PublicCourseExam = Omit<CourseExam, "questions"> & { questions: Omit<ExamQuestion, "correctAnswer" | "explanation">[] };

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
  resourceUrl?: string | null;
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

export type VideoStatus = "DRAFT" | "REVIEW" | "APPROVED" | "ARCHIVED";

export interface AcademyVideo {
  id: string;
  videoId: string;
  title: string;
  titleIt: string;
  titleEn: string;
  category: string;
  equipment?: string | null;
  provider: string;
  version: string;
  status: VideoStatus | string;
  durationSec?: number | null;
  thumbnailUrl?: string | null;
  providerVideoId?: string | null;
  embedUrl?: string | null;
  localeFallback?: boolean;
}

export interface AdminVideo extends AcademyVideo {
  notes?: string | null;
  aliases?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface VideoCreateInput {
  video_id: string;
  title_it: string;
  title_en?: string;
  category?: string;
  equipment?: string | null;
  provider?: string;
  provider_video_id?: string | null;
  embed_url?: string | null;
  version?: string;
  status?: VideoStatus;
  duration_sec?: number | null;
  thumbnail_url?: string | null;
  notes?: string | null;
  aliases?: string[];
}

export interface VideoUpdateInput {
  title_it?: string | null;
  title_en?: string | null;
  category?: string | null;
  equipment?: string | null;
  provider?: string | null;
  provider_video_id?: string | null;
  embed_url?: string | null;
  version?: string | null;
  status?: VideoStatus | null;
  duration_sec?: number | null;
  thumbnail_url?: string | null;
  notes?: string | null;
}

export interface AdminVideoQuery {
  locale?: string | null;
  status?: VideoStatus | string | null;
  q?: string | null;
}

export interface TranslationText {
  it?: string;
  en?: string;
}

export interface CourseFactInput {
  icon: string;
  label: string;
  value: string;
}

export interface CourseCreateInput {
  id: string;
  slug: string;
  category: string;
  level: CourseLevel | number;
  price: number;
  originalPrice: number;
  heroImage?: string | null;
  hasPractical?: boolean;
  hasExam?: boolean;
  hasProjectWork?: boolean;
  hasPracticalSubmission?: boolean;
  practicalType?: string | null;
  published?: boolean;
  title: TranslationText;
  subtitle?: TranslationText;
  description?: TranslationText;
  longDescription?: TranslationText;
  duration?: TranslationText;
  mode?: TranslationText;
  certification?: TranslationText;
  access?: TranslationText;
  badgeText?: TranslationText;
  facts?: Record<string, CourseFactInput[]>;
  topics?: Record<string, string[]>;
}

export interface CourseUpdateInput {
  category?: string | null;
  level?: number | null;
  price?: number | null;
  originalPrice?: number | null;
  heroImage?: string | null;
  hasPractical?: boolean | null;
  hasExam?: boolean | null;
  hasProjectWork?: boolean | null;
  hasPracticalSubmission?: boolean | null;
  practicalType?: string | null;
  published?: boolean | null;
  title?: TranslationText | null;
  subtitle?: TranslationText | null;
  description?: TranslationText | null;
  longDescription?: TranslationText | null;
  duration?: TranslationText | null;
  mode?: TranslationText | null;
  certification?: TranslationText | null;
  access?: TranslationText | null;
  badgeText?: TranslationText | null;
  facts?: Record<string, CourseFactInput[]> | null;
  topics?: Record<string, string[]> | null;
}

export interface ModuleCreateInput {
  id?: string | null;
  number: number;
  type?: "theory" | "skill" | "practical" | "case_study" | string;
  durationMinutes?: number;
  isPractical?: boolean;
  skillLevel?: string | null;
  title: TranslationText;
  subtitle?: TranslationText;
  description?: TranslationText;
}

export interface AdminCourse extends Course {
  published?: boolean;
  translations?: {
    title?: TranslationText;
    subtitle?: TranslationText;
    description?: TranslationText;
    longDescription?: TranslationText;
  };
}

export interface AdminCourseDesign {
  course: AdminCourse;
  modules: (CourseModule & { lessons?: Lesson[] })[];
}

export interface ModuleUpdateInput {
  number?: number | null;
  type?: "theory" | "skill" | "practical" | "case_study" | string | null;
  durationMinutes?: number | null;
  isPractical?: boolean | null;
  skillLevel?: string | null;
  title?: TranslationText | null;
  subtitle?: TranslationText | null;
  description?: TranslationText | null;
}

export interface LessonCreateInput {
  id?: string | null;
  order: number;
  durationMinutes?: number;
  itemType?: LearningItemType | string;
  video_id?: string | null;
  pdfUrl?: string | null;
  pdfSize?: string | null;
  allowsDownload?: boolean;
  title: TranslationText;
  description?: TranslationText;
  summary?: TranslationText;
  videoDuration?: string | null;
  pdfTitle?: TranslationText;
  keyTakeaways?: Record<string, string[]>;
}

export interface LessonUpdateInput {
  order?: number | null;
  durationMinutes?: number | null;
  itemType?: LearningItemType | string | null;
  video_id?: string | null;
  pdfUrl?: string | null;
  pdfSize?: string | null;
  allowsDownload?: boolean | null;
  title?: TranslationText | null;
  description?: TranslationText | null;
  summary?: TranslationText | null;
  videoDuration?: string | null;
  pdfTitle?: TranslationText | null;
  keyTakeaways?: Record<string, string[]> | null;
}

export interface LessonVideoAssignInput {
  video_id: string;
}


