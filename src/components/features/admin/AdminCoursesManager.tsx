"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { adminCoursesService, adminCurriculumService, adminVideosService } from "@/lib/api/client";
import { authService, type AuthUser } from "@/lib/api/auth";
import { isReadCancelled } from "@/lib/api/client-reads";
import { useRequestController } from "@/hooks/use-request-controller";
import { AdminNavTabs } from "./AdminNavTabs";
import { AdminCourseResources } from "./AdminCourseResources";
import { useAuth } from "@/components/features/training-app/AuthProvider";
import type {
  AdminCourse,
  AdminCourseDesign,
  AdminVideo,
  CourseCreateInput,
  CourseModule,
  CourseUpdateInput,
  Lesson,
  LessonCreateInput,
  LessonUpdateInput,
  ModuleCreateInput,
  ModuleUpdateInput,
} from "@/lib/api/types";

interface AdminCoursesManagerProps {
  locale: string;
}

export function AdminCoursesManager({ locale }: AdminCoursesManagerProps) {
  const isEn = locale === "en";
  const { logout } = useAuth();
  const router = useRouter();

  // Core Data States
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<"checking" | "authenticated" | "unauthenticated" | "forbidden">("checking");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const beginLoad = useRequestController();
  const beginDesign = useRequestController();
  const beginVideos = useRequestController();
  const loadedDesignSlug = useRef<string | null>(null);
  const [videoAssignments, setVideoAssignments] = useState<Record<string, string | null>>({});

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [levelFilter, setLevelFilter] = useState<string>("ALL");

  // Course Modals
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null);
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);

  // Curriculum Builder / Design Modal State
  const [activeDesignSlug, setActiveDesignSlug] = useState<string | null>(null);
  const [designData, setDesignData] = useState<AdminCourseDesign | null>(null);
  const [isLoadingDesign, setIsLoadingDesign] = useState(false);

  // Module Modals
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [isSubmittingModule, setIsSubmittingModule] = useState(false);

  // Lesson Modals
  const [addLessonModuleId, setAddLessonModuleId] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isSubmittingLesson, setIsSubmittingLesson] = useState(false);

  // Video Assignment Modal
  const [assignVideoLesson, setAssignVideoLesson] = useState<Lesson | null>(null);
  const [availableVideos, setAvailableVideos] = useState<AdminVideo[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string>("");
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [isAssigningVideo, setIsAssigningVideo] = useState(false);

  // Forms
  const [courseForm, setCourseForm] = useState<CourseCreateInput>({
    id: "",
    slug: "",
    category: "Personal Training",
    level: 1,
    price: 499,
    originalPrice: 699,
    published: false,
    hasPractical: true,
    hasExam: true,
    hasProjectWork: false,
    hasPracticalSubmission: false,
    title: { it: "", en: "" },
    subtitle: { it: "", en: "" },
    description: { it: "", en: "" },
  });

  const [courseUpdateForm, setCourseUpdateForm] = useState<CourseUpdateInput>({});

  const [moduleForm, setModuleForm] = useState<ModuleCreateInput>({
    number: 1,
    type: "theory",
    durationMinutes: 45,
    isPractical: false,
    title: { it: "", en: "" },
    subtitle: { it: "", en: "" },
    description: { it: "", en: "" },
  });

  const [moduleUpdateForm, setModuleUpdateForm] = useState<ModuleUpdateInput>({});

  const [lessonForm, setLessonForm] = useState<LessonCreateInput>({
    order: 1,
    itemType: "video",
    durationMinutes: 15,
    title: { it: "", en: "" },
    description: { it: "", en: "" },
    allowsDownload: false,
  });

  const [lessonUpdateForm, setLessonUpdateForm] = useState<LessonUpdateInput>({});

  // Load Courses
  const loadCourses = useCallback(async () => {
    const signal = beginLoad();
    setIsLoading(true);
    try {
      const [session, result] = await Promise.allSettled([
        authService.session(signal), adminCoursesService.list({ locale }, signal),
      ]);
      if (signal.aborted) return;
      if ((session.status === "rejected" && isReadCancelled(session.reason)) ||
          (result.status === "rejected" && isReadCancelled(result.reason))) return;
      setCurrentUser(session.status === "fulfilled" ? session.value?.user ?? null : null);
      if (result.status === "rejected") throw result.reason;
      setCourses(result.value);
      setAuthStatus("authenticated");
    } catch (err: unknown) {
      if (signal.aborted || isReadCancelled(err)) return;
      const status = typeof err === "object" && err !== null && "status" in err ? (err as { status: number }).status : 0;
      if (status === 401) {
        setAuthStatus("unauthenticated");
      } else if (status === 403) {
        setAuthStatus("forbidden");
      } else {
        toast.error(isEn ? "Failed to load admin courses" : "Impossibile caricare i corsi admin", { id: "admin-courses-load" });
      }
    } finally {
      if (!signal.aborted) setIsLoading(false);
    }
  }, [locale, isEn, beginLoad]);

  // Load Specific Course Design
  const loadCourseDesign = useCallback(async (slug: string, background = false) => {
    if (background && loadedDesignSlug.current !== slug) return;
    const signal = beginDesign();
    if (!background) {
      loadedDesignSlug.current = slug;
      setActiveDesignSlug(slug);
      setDesignData(null);
      setVideoAssignments({});
      setIsLoadingDesign(true);
    }
    try {
      const design = await adminCoursesService.getDesign(slug, locale, signal);
      if (signal.aborted) return;
      setDesignData(design);
    } catch (err: unknown) {
      if (signal.aborted || isReadCancelled(err)) return;
      const msg = err instanceof Error ? err.message : isEn ? "Failed to load curriculum design" : "Impossibile caricare il curriculum del corso";
      toast.error(msg, { id: "admin-course-design-load" });
    } finally {
      if (!signal.aborted) setIsLoadingDesign(false);
    }
  }, [locale, isEn, beginDesign]);

  useEffect(() => {
    void loadCourses();
    const onAuthChange = () => {
      beginDesign();
      beginVideos();
      loadedDesignSlug.current = null;
      setActiveDesignSlug(null);
      setDesignData(null);
      setAssignVideoLesson(null);
      setVideoAssignments({});
      setCourses([]);
      setCurrentUser(null);
      void loadCourses();
    };
    window.addEventListener("eureka-auth-changed", onAuthChange);
    return () => window.removeEventListener("eureka-auth-changed", onAuthChange);
  }, [loadCourses, beginDesign, beginVideos]);

  // Handle Log Out & Switch Account
  const handleLogoutAndSwitch = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/training/app/login");
    } catch {
      // AuthProvider owns logout feedback.
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Metrics Calculation
  const metrics = useMemo(() => {
    const total = courses.length;
    const published = courses.filter((c) => c.published).length;
    const draft = courses.filter((c) => !c.published).length;
    const totalModules = courses.reduce((acc, c) => acc + (c.modulesCount || 0), 0);
    return { total, published, draft, totalModules };
  }, [courses]);

  // Filtered Courses
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      if (statusFilter === "PUBLISHED" && !c.published) return false;
      if (statusFilter === "DRAFT" && c.published) return false;
      if (levelFilter !== "ALL" && String(c.level) !== levelFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (c.title || "").toLowerCase().includes(q);
        const matchSlug = (c.slug || "").toLowerCase().includes(q);
        const matchCategory = (c.category || "").toLowerCase().includes(q);
        if (!matchTitle && !matchSlug && !matchCategory) return false;
      }
      return true;
    });
  }, [courses, statusFilter, levelFilter, searchQuery]);

  // Curriculum Design Helpers
  const currentDesignCourse = useMemo(() => {
    return courses.find((c) => c.slug === activeDesignSlug);
  }, [courses, activeDesignSlug]);

  const designCourseTitle = useMemo(() => {
    const raw =
      designData?.course?.title ||
      (designData as unknown as { title?: unknown })?.title ||
      currentDesignCourse?.title;
    if (typeof raw === "string" && raw.trim()) return raw.trim();
    if (raw && typeof raw === "object") {
      const t = raw as { it?: string; en?: string };
      return t.it?.trim() || t.en?.trim() || activeDesignSlug || "";
    }
    return currentDesignCourse?.title || activeDesignSlug || "";
  }, [designData, currentDesignCourse, activeDesignSlug]);

  const designModules = useMemo(() => {
    if (!designData) return [];
    if (Array.isArray(designData.modules)) return designData.modules;
    if (Array.isArray(designData)) return designData as unknown as (CourseModule & { lessons?: Lesson[] })[];
    return [];
  }, [designData]);

  // Handle Create Course
  const handleCreateCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.id.trim() || !courseForm.slug.trim() || !courseForm.title.it?.trim()) {
      toast.error(isEn ? "ID, Slug, and Italian Title are required" : "ID, Slug e Titolo Italiano sono obbligatori");
      return;
    }

    if (!/^[a-z0-9-]+$/.test(courseForm.slug.trim())) {
      toast.error(isEn ? "Slug must be lowercase alphanumeric and hyphens (e.g. course-slug)" : "Lo slug deve contenere solo lettere minuscole, numeri e trattini");
      return;
    }

    setIsSubmittingCourse(true);
    try {
      const created = await adminCoursesService.create({
        ...courseForm,
        id: courseForm.id.trim(),
        slug: courseForm.slug.trim(),
        price: Number(courseForm.price) || 0,
        originalPrice: Number(courseForm.originalPrice) || 0,
        level: Number(courseForm.level) as 1 | 2 | 3,
        title: {
          it: courseForm.title.it.trim(),
          en: courseForm.title.en?.trim() || undefined,
        },
      });

      toast.success(isEn ? `Course "${created.slug}" created successfully` : `Corso "${created.slug}" creato con successo`);
      setIsCreateCourseOpen(false);
      void loadCourses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : isEn ? "Failed to create course" : "Errore durante la creazione del corso";
      toast.error(msg);
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  // Open Edit Course Modal
  const handleOpenEditCourse = (course: AdminCourse) => {
    setEditingCourse(course);
    setCourseUpdateForm({
      category: course.category,
      level: course.level,
      price: course.price,
      originalPrice: course.originalPrice,
      published: course.published,
      hasPractical: course.hasPractical,
      hasExam: course.hasExam,
      hasProjectWork: course.hasProjectWork,
      hasPracticalSubmission: course.hasPracticalSubmission,
      title: {
        it: course.title,
        en: (course as unknown as { titleEn?: string }).titleEn || "",
      },
      description: {
        it: course.description || "",
        en: "",
      },
    });
  };

  // Handle Update Course Submit
  const handleUpdateCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    setIsSubmittingCourse(true);
    try {
      const updated = await adminCoursesService.update(editingCourse.slug, {
        ...courseUpdateForm,
        level: courseUpdateForm.level ? (Number(courseUpdateForm.level) as 1 | 2 | 3) : undefined,
        price: courseUpdateForm.price ? Number(courseUpdateForm.price) : undefined,
        originalPrice: courseUpdateForm.originalPrice ? Number(courseUpdateForm.originalPrice) : undefined,
      });

      toast.success(isEn ? `Course "${updated.slug}" updated successfully` : `Corso "${updated.slug}" aggiornato con successo`);
      setEditingCourse(null);
      void loadCourses();
      if (activeDesignSlug === editingCourse.slug) {
        void loadCourseDesign(editingCourse.slug);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : isEn ? "Failed to update course" : "Errore durante l'aggiornamento del corso";
      toast.error(msg);
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  // Open Add Module Modal
  const handleOpenAddModule = () => {
    if (!activeDesignSlug) return;
    const nextNumber = (designModules.length || 0) + 1;
    setModuleForm({
      number: nextNumber,
      type: "theory",
      durationMinutes: 45,
      isPractical: false,
      title: { it: "", en: "" },
      subtitle: { it: "", en: "" },
      description: { it: "", en: "" },
    });
    setIsAddModuleOpen(true);
  };

  // Handle Add Module Submit
  const handleAddModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDesignSlug) return;
    if (!moduleForm.title.it?.trim()) {
      toast.error(isEn ? "Italian Title is required for module" : "Il titolo italiano è obbligatorio");
      return;
    }

    setIsSubmittingModule(true);
    try {
      await adminCoursesService.createModule(activeDesignSlug, {
        ...moduleForm,
        number: Number(moduleForm.number) || 1,
        durationMinutes: Number(moduleForm.durationMinutes) || 0,
        title: {
          it: moduleForm.title.it.trim(),
          en: moduleForm.title.en?.trim() || undefined,
        },
      });

      toast.success(isEn ? "Module created successfully" : "Modulo creato con successo");
      setIsAddModuleOpen(false);
      void loadCourseDesign(activeDesignSlug);
      void loadCourses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : isEn ? "Failed to create module" : "Errore creazione modulo";
      toast.error(msg);
    } finally {
      setIsSubmittingModule(false);
    }
  };

  // Open Edit Module Modal
  const handleOpenEditModule = (mod: CourseModule) => {
    setEditingModule(mod);
    const itTitle = typeof mod.title === "object"
      ? ((mod.title as unknown as { it?: string; en?: string })?.it || (mod.title as unknown as { it?: string; en?: string })?.en || "")
      : (mod.title || "");
    const enTitle = typeof mod.title === "object"
      ? ((mod.title as unknown as { en?: string })?.en || "")
      : "";
    const itDesc = typeof mod.description === "object"
      ? ((mod.description as unknown as { it?: string; en?: string })?.it || (mod.description as unknown as { it?: string; en?: string })?.en || "")
      : (mod.description || "");
    setModuleUpdateForm({
      number: mod.number,
      type: mod.type,
      durationMinutes: mod.durationMinutes,
      isPractical: mod.isPractical,
      skillLevel: mod.skillLevel,
      title: { it: itTitle, en: enTitle },
      description: { it: itDesc, en: "" },
    });
  };

  // Handle Update Module Submit
  const handleUpdateModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModule || !activeDesignSlug) return;

    setIsSubmittingModule(true);
    try {
      await adminCurriculumService.updateModule(editingModule.id, {
        ...moduleUpdateForm,
        number: moduleUpdateForm.number ? Number(moduleUpdateForm.number) : undefined,
        durationMinutes: moduleUpdateForm.durationMinutes !== undefined ? Number(moduleUpdateForm.durationMinutes) : undefined,
      });

      toast.success(isEn ? "Module updated successfully" : "Modulo aggiornato con successo");
      setEditingModule(null);
      void loadCourseDesign(activeDesignSlug);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : isEn ? "Failed to update module" : "Errore aggiornamento modulo";
      toast.error(msg);
    } finally {
      setIsSubmittingModule(false);
    }
  };

  // Open Add Lesson Modal
  const handleOpenAddLesson = (modId: string, currentLessonsCount: number) => {
    setAddLessonModuleId(modId);
    setLessonForm({
      order: currentLessonsCount + 1,
      itemType: "video",
      durationMinutes: 15,
      allowsDownload: false,
      title: { it: "", en: "" },
      description: { it: "", en: "" },
      summary: { it: "", en: "" },
    });
  };

  // Handle Add Lesson Submit
  const handleAddLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addLessonModuleId || !activeDesignSlug) return;
    if (!lessonForm.title.it?.trim()) {
      toast.error(isEn ? "Italian Title is required for lesson" : "Il titolo italiano della lezione è obbligatorio");
      return;
    }

    setIsSubmittingLesson(true);
    try {
      await adminCurriculumService.createLesson(addLessonModuleId, {
        ...lessonForm,
        order: Number(lessonForm.order) || 1,
        durationMinutes: Number(lessonForm.durationMinutes) || 0,
        title: {
          it: lessonForm.title.it.trim(),
          en: lessonForm.title.en?.trim() || undefined,
        },
      });

      toast.success(isEn ? "Lesson created successfully" : "Lezione creata con successo");
      setAddLessonModuleId(null);
      void loadCourseDesign(activeDesignSlug);
      void loadCourses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : isEn ? "Failed to create lesson" : "Errore creazione lezione";
      toast.error(msg);
    } finally {
      setIsSubmittingLesson(false);
    }
  };

  // Open Edit Lesson Modal
  const handleOpenEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    const itLessonTitle = typeof lesson.title === "object"
      ? ((lesson.title as unknown as { it?: string; en?: string })?.it || (lesson.title as unknown as { it?: string; en?: string })?.en || "")
      : (lesson.title || "");
    const enLessonTitle = typeof lesson.title === "object"
      ? ((lesson.title as unknown as { en?: string })?.en || "")
      : "";
    const itLessonDesc = typeof lesson.description === "object"
      ? ((lesson.description as unknown as { it?: string; en?: string })?.it || (lesson.description as unknown as { it?: string; en?: string })?.en || "")
      : (lesson.description || "");
    setLessonUpdateForm({
      order: lesson.order,
      durationMinutes: lesson.durationMinutes,
      itemType: lesson.itemType,
      allowsDownload: lesson.allowsDownload,
      title: { it: itLessonTitle, en: enLessonTitle },
      description: { it: itLessonDesc, en: "" },
      pdfUrl: lesson.pdfUrl,
      pdfSize: lesson.pdfSize,
    });
  };

  // Handle Update Lesson Submit
  const handleUpdateLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson || !activeDesignSlug) return;

    setIsSubmittingLesson(true);
    try {
      await adminCurriculumService.updateLesson(editingLesson.id, {
        ...lessonUpdateForm,
        order: lessonUpdateForm.order ? Number(lessonUpdateForm.order) : undefined,
        durationMinutes: lessonUpdateForm.durationMinutes !== undefined ? Number(lessonUpdateForm.durationMinutes) : undefined,
      });

      toast.success(isEn ? "Lesson updated successfully" : "Lezione aggiornata con successo");
      setEditingLesson(null);
      void loadCourseDesign(activeDesignSlug);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : isEn ? "Failed to update lesson" : "Errore aggiornamento lezione";
      toast.error(msg);
    } finally {
      setIsSubmittingLesson(false);
    }
  };

  // Open Assign Video Modal
  const handleOpenAssignVideo = async (lesson: Lesson) => {
    const signal = beginVideos();
    setAssignVideoLesson(lesson);
    setSelectedVideoId(Object.prototype.hasOwnProperty.call(videoAssignments, lesson.id)
      ? videoAssignments[lesson.id] ?? "" : lesson.rapidCode ?? "");
    setAvailableVideos([]);
    setIsLoadingVideos(true);
    try {
      const vids = await adminVideosService.list({ locale, status: "APPROVED" }, signal);
      if (signal.aborted) return;
      setAvailableVideos(vids);
    } catch (error) {
      if (signal.aborted || isReadCancelled(error)) return;
      toast.error(isEn ? "Could not load video library" : "Impossibile caricare catalogo video", { id: "admin-video-library-load" });
    } finally {
      if (!signal.aborted) setIsLoadingVideos(false);
    }
  };

  // Handle Assign Video Submit
  const handleAssignVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignVideoLesson || !selectedVideoId.trim() || !activeDesignSlug) return;
    if (selectedVideoId.trim().length < 3 || selectedVideoId.trim().length > 32) {
      toast.error(isEn ? "Video ID must contain 3 to 32 characters" : "L'ID video deve contenere da 3 a 32 caratteri", { id: "admin-video-assign" });
      e.currentTarget.querySelector<HTMLInputElement>('input[name="videoId"]')?.focus();
      return;
    }

    setIsAssigningVideo(true);
    try {
      await adminCurriculumService.assignVideo(assignVideoLesson.id, selectedVideoId.trim());
      if (loadedDesignSlug.current !== activeDesignSlug) return;
      setVideoAssignments(current => ({ ...current, [assignVideoLesson.id]: selectedVideoId.trim() }));
      toast.success(isEn ? `Video assigned to lesson` : `Video assegnato alla lezione`, { id: "admin-video-assign" });
      setAssignVideoLesson(null);
      void loadCourseDesign(activeDesignSlug, true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : isEn ? "Failed to assign video" : "Errore assegnazione video";
      toast.error(msg, { id: "admin-video-assign" });
    } finally {
      setIsAssigningVideo(false);
    }
  };

  // Handle Detach Video
  const handleDetachVideo = async (lesson: Lesson) => {
    if (!activeDesignSlug) return;
    try {
      await adminCurriculumService.removeVideo(lesson.id);
      if (loadedDesignSlug.current !== activeDesignSlug) return;
      setVideoAssignments(current => ({ ...current, [lesson.id]: null }));
      toast.success(isEn ? "Video detached from lesson" : "Video rimosso dalla lezione", { id: "admin-video-detach" });
      void loadCourseDesign(activeDesignSlug, true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : isEn ? "Failed to remove video" : "Errore rimozione video";
      toast.error(msg, { id: "admin-video-detach" });
    }
  };

  // Auth Guard: Unauthenticated (401)
  if (authStatus === "unauthenticated") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-md mx-auto bg-[#111827] border border-[#1f2937] rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m12-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {isEn ? "Authentication Required" : "Autenticazione Richiesta"}
          </h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            {isEn
              ? "You must sign in with an administrator account to access the Course Management console."
              : "È necessario accedere con un account amministratore per gestire i corsi."}
          </p>
          <Link
            href="/training/app/login"
            className="inline-flex items-center justify-center w-full px-5 py-3 rounded-xl font-semibold text-white bg-[#0066ff] hover:bg-[#0052cc] transition shadow-lg shadow-[#0066ff]/25"
          >
            {isEn ? "Sign In to Admin" : "Accedi come Amministratore"}
          </Link>
        </div>
      </div>
    );
  }

  // Auth Guard: Forbidden (403)
  if (authStatus === "forbidden") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-lg mx-auto bg-[#111827] border border-amber-500/30 rounded-2xl p-8 shadow-2xl">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-white text-center mb-1">
            {isEn ? "Administrator Role Required" : "Permesso di Amministratore Richiesto"}
          </h2>
          <p className="text-xs text-amber-400/90 text-center font-mono mb-6">
            HTTP 403 Forbidden: role &apos;admin&apos; required
          </p>

          {currentUser && (
            <div className="mb-6 p-4 rounded-xl bg-[#0b0f17] border border-[#1f2937] text-left text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span>{isEn ? "Active Account:" : "Account attivo:"}</span>
                <span className="font-semibold text-slate-200">{currentUser.name}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Email:</span>
                <span className="font-mono text-slate-300">{currentUser.email}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>{isEn ? "Current Role:" : "Ruolo attuale:"}</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono font-bold uppercase">
                  {currentUser.role}
                </span>
              </div>
            </div>
          )}

          <p className="mb-6 text-sm text-slate-400">{isEn ? "Ask an administrator to update your roles in Users & Access. Role changes take effect on the next account check." : "Chiedi a un amministratore di aggiornare i tuoi ruoli in Utenti e accessi. Le modifiche sono applicate alla prossima verifica account."}</p>


          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => void handleLogoutAndSwitch()}
              disabled={isLoggingOut}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50"
            >
              {isLoggingOut
                ? (isEn ? "Logging out..." : "Disconnessione...")
                : (isEn ? "Log Out & Switch Account" : "Disconnetti e Cambia Account")}
            </button>
            <button
              type="button"
              onClick={() => void loadCourses()}
              className="px-4 py-3 rounded-xl text-sm font-medium text-slate-300 bg-[#1f2937] hover:bg-[#374151] transition"
            >
              {isEn ? "Retry" : "Riprova"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Navigation Tabs between Courses & Videos */}
      <AdminNavTabs activeTab="courses" currentUser={currentUser} locale={locale} />

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8 border-b border-[#1f2937] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold tracking-wider uppercase bg-[#0066ff]/10 text-[#38bdf8] border border-[#0066ff]/20">
              Console Admin
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">Eureka! Sport & Fitness</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {isEn ? "Courses & Curriculum Studio" : "Gestione Corsi & Curriculum"}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {isEn
              ? "Manage Academy courses, design curriculum trees, and structure learning modules."
              : "Gestisci i corsi dell'Academy, progetta l'albero curricolare e organizza i moduli formativi."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void loadCourses()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 bg-[#1e293b] hover:bg-[#334155] border border-[#334155] transition active:scale-95 disabled:opacity-50"
            title={isEn ? "Refresh course list" : "Ricarica elenco corsi"}
          >
            <svg className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{isEn ? "Refresh" : "Ricarica"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateCourseOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0066ff] hover:bg-[#0052cc] transition shadow-lg shadow-[#0066ff]/20 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>{isEn ? "New Course" : "Nuovo Corso"}</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-4">
          <p className="text-xs font-medium text-slate-400">{isEn ? "Total Courses" : "Totale Corsi"}</p>
          <p className="text-2xl font-bold text-white mt-1">{metrics.total}</p>
        </div>
        <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-4">
          <p className="text-xs font-medium text-emerald-400">{isEn ? "Published" : "Pubblicati"}</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{metrics.published}</p>
        </div>
        <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-4">
          <p className="text-xs font-medium text-amber-400">{isEn ? "Drafts" : "Bozze"}</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{metrics.draft}</p>
        </div>
        <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-4">
          <p className="text-xs font-medium text-blue-400">{isEn ? "Total Modules" : "Totale Moduli"}</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{metrics.totalModules}</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#111827] border border-[#1f2937] rounded-xl overflow-x-auto">
          {(["ALL", "PUBLISHED", "DRAFT"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === status
                  ? "bg-[#0066ff] text-white shadow"
                  : "text-slate-400 hover:text-white hover:bg-[#1e293b]"
              }`}
            >
              {status === "ALL" && (isEn ? "All Courses" : "Tutti")}
              {status === "PUBLISHED" && (isEn ? "Published" : "Pubblicati")}
              {status === "DRAFT" && (isEn ? "Drafts" : "Bozze")}
            </button>
          ))}
        </div>

        {/* Level Filter & Search */}
        <div className="flex items-center gap-3">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-2 bg-[#111827] border border-[#1f2937] rounded-xl text-xs text-slate-300 focus:outline-none focus:border-[#0066ff]"
          >
            <option value="ALL">{isEn ? "All Levels" : "Tutti i Livelli"}</option>
            <option value="1">{isEn ? "Level 1 (Foundation)" : "Livello 1"}</option>
            <option value="2">{isEn ? "Level 2 (Advanced)" : "Livello 2"}</option>
            <option value="3">{isEn ? "Level 3 (Master)" : "Livello 3"}</option>
          </select>

          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder={isEn ? "Search by slug, title, category..." : "Cerca corso o categoria..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#111827] border border-[#1f2937] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0066ff]"
            />
            <svg className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Courses Inventory Table */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-2xl overflow-hidden shadow-xl mb-12">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#1f2937] bg-[#0d131f] text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Slug & Title</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Level</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Modules</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2937]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-[#0066ff] border-t-transparent rounded-full animate-spin" />
                      <span>{isEn ? "Loading courses..." : "Caricamento corsi..."}</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {isEn ? "No courses found matching criteria" : "Nessun corso trovato"}
                  </td>
                </tr>
              ) : (
                filteredCourses.map((c) => (
                  <tr key={c.id} className="hover:bg-[#1a2333]/50 transition group">
                    {/* Slug & Title */}
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-bold text-white text-base group-hover:text-[#38bdf8] transition">
                          {c.title}
                        </div>
                        <div className="text-xs font-mono text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>{c.slug}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-500 font-sans">{c.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1e293b] text-slate-300 border border-[#334155]">
                        {c.category}
                      </span>
                    </td>

                    {/* Level */}
                    <td className="py-4 px-4">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        Level {c.level}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-4 px-4 font-mono text-xs">
                      <span className="text-white font-bold">€{c.price}</span>
                      {c.originalPrice > c.price && (
                        <span className="text-slate-500 line-through ml-1.5">€{c.originalPrice}</span>
                      )}
                    </td>

                    {/* Modules */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-300">
                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span>{c.modulesCount || 0}</span>
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4">
                      {c.published ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          PUBLISHED
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          DRAFT
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Curriculum Design / Builder button */}
                        <button
                          type="button"
                          onClick={() => void loadCourseDesign(c.slug)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#0066ff] hover:bg-[#0052cc] transition shadow shadow-[#0066ff]/20 flex items-center gap-1.5"
                          title={isEn ? "Open Curriculum Builder" : "Apri Curriculum Builder"}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                          </svg>
                          <span>{isEn ? "Curriculum" : "Curriculum"}</span>
                        </button>

                        {/* Edit Course Details */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditCourse(c)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1e293b] transition"
                          title={isEn ? "Edit course metadata" : "Modifica dettagli corso"}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>

                        {/* View Public Page */}
                        <Link
                          href={{ pathname: "/academy/corsi/[slug]", params: { slug: c.slug } }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1e293b] transition"
                          title={isEn ? "View live public course" : "Visualizza pagina pubblica"}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Create Course */}
      {isCreateCourseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111827] border border-[#1f2937] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#1f2937] mb-6">
              <h3 className="text-lg font-bold text-white">
                {isEn ? "Create New Academy Course" : "Crea Nuovo Corso Academy"}
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateCourseOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1e293b]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateCourseSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Course ID <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. course-pt-pro"
                    value={courseForm.id}
                    onChange={(e) => setCourseForm({ ...courseForm, id: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white font-mono focus:outline-none focus:border-[#0066ff]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Slug <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. personal-trainer-pro"
                    value={courseForm.slug}
                    onChange={(e) => setCourseForm({ ...courseForm, slug: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white font-mono focus:outline-none focus:border-[#0066ff]"
                  />
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">Lowercase, numbers, and hyphens (^[a-z0-9-]+$)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={courseForm.category}
                    onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white focus:outline-none focus:border-[#0066ff]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Level</label>
                  <select
                    value={courseForm.level}
                    onChange={(e) => setCourseForm({ ...courseForm, level: Number(e.target.value) as 1 | 2 | 3 })}
                    className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white focus:outline-none focus:border-[#0066ff]"
                  >
                    <option value={1}>Level 1 (Foundation)</option>
                    <option value={2}>Level 2 (Advanced)</option>
                    <option value={3}>Level 3 (Master)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Published</label>
                  <select
                    value={courseForm.published ? "true" : "false"}
                    onChange={(e) => setCourseForm({ ...courseForm, published: e.target.value === "true" })}
                    className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white focus:outline-none focus:border-[#0066ff]"
                  >
                    <option value="false">Draft (Bozza)</option>
                    <option value="true">Published (Pubblicato)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Price (EUR)</label>
                  <input
                    type="number"
                    min="0"
                    value={courseForm.price}
                    onChange={(e) => setCourseForm({ ...courseForm, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white font-mono focus:outline-none focus:border-[#0066ff]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Original Price (EUR)</label>
                  <input
                    type="number"
                    min="0"
                    value={courseForm.originalPrice}
                    onChange={(e) => setCourseForm({ ...courseForm, originalPrice: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white font-mono focus:outline-none focus:border-[#0066ff]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Title (Italian) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Corso Personal Trainer Professionale"
                  value={courseForm.title.it || ""}
                  onChange={(e) => setCourseForm({ ...courseForm, title: { ...courseForm.title, it: e.target.value } })}
                  className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white focus:outline-none focus:border-[#0066ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Title (English - Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Professional Personal Trainer Course"
                  value={courseForm.title.en || ""}
                  onChange={(e) => setCourseForm({ ...courseForm, title: { ...courseForm.title, en: e.target.value } })}
                  className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white focus:outline-none focus:border-[#0066ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description (Italian)</label>
                <textarea
                  rows={2}
                  value={courseForm.description?.it || ""}
                  onChange={(e) => setCourseForm({ ...courseForm, description: { ...courseForm.description, it: e.target.value } })}
                  className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white focus:outline-none focus:border-[#0066ff]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1f2937]">
                <button
                  type="button"
                  onClick={() => setIsCreateCourseOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-[#1e293b]"
                >
                  {isEn ? "Cancel" : "Annulla"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCourse}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0066ff] hover:bg-[#0052cc] transition disabled:opacity-50"
                >
                  {isSubmittingCourse ? (isEn ? "Creating..." : "Creazione...") : (isEn ? "Create Course" : "Crea Corso")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Course Metadata */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111827] border border-[#1f2937] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#1f2937] mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {isEn ? "Edit Course Details" : "Modifica Corso"}
                </h3>
                <p className="text-xs font-mono text-slate-400 mt-0.5">{editingCourse.slug}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCourse(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1e293b]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateCourseSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
                  <select
                    value={courseUpdateForm.published ? "true" : "false"}
                    onChange={(e) => setCourseUpdateForm({ ...courseUpdateForm, published: e.target.value === "true" })}
                    className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white focus:outline-none focus:border-[#0066ff]"
                  >
                    <option value="true">Published</option>
                    <option value="false">Draft</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={courseUpdateForm.category || ""}
                    onChange={(e) => setCourseUpdateForm({ ...courseUpdateForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white focus:outline-none focus:border-[#0066ff]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Price (€)</label>
                  <input
                    type="number"
                    min="0"
                    value={courseUpdateForm.price ?? ""}
                    onChange={(e) => setCourseUpdateForm({ ...courseUpdateForm, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white font-mono focus:outline-none focus:border-[#0066ff]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Original Price (€)</label>
                  <input
                    type="number"
                    min="0"
                    value={courseUpdateForm.originalPrice ?? ""}
                    onChange={(e) => setCourseUpdateForm({ ...courseUpdateForm, originalPrice: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white font-mono focus:outline-none focus:border-[#0066ff]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Title (Italian)</label>
                <input
                  type="text"
                  value={courseUpdateForm.title?.it || ""}
                  onChange={(e) => setCourseUpdateForm({ ...courseUpdateForm, title: { ...courseUpdateForm.title, it: e.target.value } })}
                  className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white focus:outline-none focus:border-[#0066ff]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1f2937]">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-[#1e293b]"
                >
                  {isEn ? "Cancel" : "Annulla"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCourse}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0066ff] hover:bg-[#0052cc] transition disabled:opacity-50"
                >
                  {isSubmittingCourse ? (isEn ? "Saving..." : "Salvataggio...") : (isEn ? "Save Changes" : "Salva Modifiche")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Curriculum Tree Inspector & Builder */}
      {activeDesignSlug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#111827] border border-[#1f2937] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#1f2937] bg-[#0d131f]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0066ff]/10 border border-[#0066ff]/20 flex items-center justify-center text-[#38bdf8]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{designCourseTitle}</span>
                    <span className="text-xs px-2 py-0.5 rounded font-mono bg-[#1e293b] text-slate-300 font-normal">
                      {activeDesignSlug}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isEn ? "Curriculum Structure & Module Tree Builder" : "Struttura del Curriculum & Gestione Moduli e Lezioni"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenAddModule}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-[#0066ff] hover:bg-[#0052cc] transition shadow shadow-[#0066ff]/20 flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>{isEn ? "Add Module" : "Aggiungi Modulo"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    beginDesign();
                    beginVideos();
                    loadedDesignSlug.current = null;
                    setActiveDesignSlug(null);
                    setDesignData(null);
                    setAssignVideoLesson(null);
                    setVideoAssignments({});
                  }}
                  className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-[#1e293b]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body: Module Tree */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isLoadingDesign ? (
                <div className="py-20 text-center text-slate-400">
                  <div className="inline-flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-[#0066ff] border-t-transparent rounded-full animate-spin" />
                    <span>{isEn ? "Loading curriculum tree..." : "Caricamento albero curricolare..."}</span>
                  </div>
                </div>
              ) : !designModules || designModules.length === 0 ? (
                <div className="text-center py-16 bg-[#0b0f17] border border-[#1f2937] rounded-2xl p-8">
                  <p className="text-sm text-slate-400 mb-4">
                    {isEn ? "No modules in this course yet." : "Nessun modulo ancora presente per questo corso."}
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAddModule}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#0066ff] hover:bg-[#0052cc] transition"
                  >
                    {isEn ? "Create First Module" : "Crea Primo Modulo"}
                  </button>
                </div>
              ) : (
                designModules.map((mod) => {
                  const modTitle = typeof mod.title === "object"
                    ? ((mod.title as unknown as { it?: string; en?: string })?.it || (mod.title as unknown as { it?: string; en?: string })?.en || "Modulo")
                    : (mod.title || "Modulo");
                  return (
                  <div key={mod.id} className="bg-[#0b0f17] border border-[#1f2937] rounded-2xl overflow-hidden">
                    {/* Module Header */}
                    <div className="p-4 bg-[#131b2a] border-b border-[#1f2937] flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-[#0066ff]/20 text-[#38bdf8] font-mono text-xs font-bold flex items-center justify-center">
                          M{mod.number}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{modTitle}</h4>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {mod.type}
                            </span>
                            {mod.isPractical && (
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Practical
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">
                            {mod.durationMinutes} min • {mod.lessons?.length || mod.lessonsCount || 0} lessons • ID: {mod.id}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModule(mod)}
                          className="px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-[#1e293b] transition"
                          title={isEn ? "Edit module metadata" : "Modifica modulo"}
                        >
                          {isEn ? "Edit" : "Modifica"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenAddLesson(mod.id, mod.lessons?.length || 0)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span>{isEn ? "Add Lesson" : "Aggiungi Lezione"}</span>
                        </button>
                      </div>
                    </div>

                    {activeDesignSlug && <AdminCourseResources slug={activeDesignSlug} moduleId={mod.id} items={mod.lessons ?? []} />}
                    {/* Nested Lessons List */}
                    <div className="p-4 space-y-2.5">
                      {!mod.lessons || mod.lessons.length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-2 text-center">
                          {isEn ? "No lessons in this module. Click 'Add Lesson' above." : "Nessuna lezione presente. Clicca su 'Aggiungi Lezione'."}
                        </p>
                      ) : (
                        mod.lessons.map((lesson) => {
                          const videoId = Object.prototype.hasOwnProperty.call(videoAssignments, lesson.id)
                            ? videoAssignments[lesson.id] : lesson.rapidCode;
                          const lessonTitle = typeof lesson.title === "object"
                            ? ((lesson.title as unknown as { it?: string; en?: string })?.it || (lesson.title as unknown as { it?: string; en?: string })?.en || "Lezione")
                            : (lesson.title || "Lezione");
                          return (
                          <div
                            key={lesson.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-[#111827] border border-[#1f2937] hover:border-slate-700 transition"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono text-slate-500 w-5">
                                #{lesson.order}
                              </span>
                              <div>
                                <div className="text-xs font-semibold text-white flex items-center gap-2">
                                  <span>{lessonTitle}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                    {lesson.itemType || "video"}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                                  <span>{lesson.durationMinutes}m</span>
                                  <span className="text-slate-600">•</span>
                                  {videoId ? (
                                    <span className="text-emerald-400 flex items-center gap-1">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                      <span>Video: {videoId}</span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-500 italic">No video assigned</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Video Link / Unlink action */}
                              {videoId ? (
                                <button
                                  type="button"
                                  onClick={() => void handleDetachVideo(lesson)}
                                  className="px-2 py-1 rounded text-[11px] text-red-400 hover:bg-red-500/10 transition"
                                  title={isEn ? "Detach video stream" : "Rimuovi video"}
                                >
                                  {isEn ? "Detach Video" : "Scollega Video"}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => void handleOpenAssignVideo(lesson)}
                                  className="px-2.5 py-1 rounded text-[11px] font-medium text-[#38bdf8] bg-[#0066ff]/10 hover:bg-[#0066ff]/20 border border-[#0066ff]/20 transition"
                                  title={isEn ? "Assign video from library" : "Assegna video da studio"}
                                >
                                  {isEn ? "+ Assign Video" : "+ Assegna Video"}
                                </button>
                              )}

                              {/* Edit Lesson */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditLesson(lesson)}
                                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                                title={isEn ? "Edit lesson" : "Modifica lezione"}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                        })
                      )}
                    </div>
                  </div>
                );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL: Add Module */}
      {isAddModuleOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111827] border border-[#1f2937] rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <h4 className="text-base font-bold text-white mb-4">
              {isEn ? "Add Module to Curriculum" : "Aggiungi Modulo al Corso"}
            </h4>

            <form onSubmit={handleAddModuleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Module Number</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={moduleForm.number}
                    onChange={(e) => setModuleForm({ ...moduleForm, number: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white font-mono focus:outline-none focus:border-[#0066ff]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Type</label>
                  <select
                    value={moduleForm.type}
                    onChange={(e) => setModuleForm({ ...moduleForm, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white focus:outline-none focus:border-[#0066ff]"
                  >
                    <option value="theory">Theory</option>
                    <option value="skill">Skill</option>
                    <option value="practical">Practical</option>
                    <option value="case_study">Case Study</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Title (Italian) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fondamenti di Anatomia Funzionale"
                  value={moduleForm.title.it || ""}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: { ...moduleForm.title, it: e.target.value } })}
                  className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white focus:outline-none focus:border-[#0066ff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Duration (min)</label>
                  <input
                    type="number"
                    min="0"
                    value={moduleForm.durationMinutes}
                    onChange={(e) => setModuleForm({ ...moduleForm, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white font-mono focus:outline-none focus:border-[#0066ff]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Practical Flag</label>
                  <select
                    value={moduleForm.isPractical ? "true" : "false"}
                    onChange={(e) => setModuleForm({ ...moduleForm, isPractical: e.target.value === "true" })}
                    className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white focus:outline-none focus:border-[#0066ff]"
                  >
                    <option value="false">Standard Module</option>
                    <option value="true">Practical Module</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1f2937]">
                <button
                  type="button"
                  onClick={() => setIsAddModuleOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  {isEn ? "Cancel" : "Annulla"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingModule}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#0066ff] hover:bg-[#0052cc] transition disabled:opacity-50"
                >
                  {isSubmittingModule ? (isEn ? "Adding..." : "Salvataggio...") : (isEn ? "Add Module" : "Aggiungi Modulo")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: Edit Module */}
      {editingModule && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111827] border border-[#1f2937] rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <h4 className="text-base font-bold text-white mb-4">
              {isEn ? "Edit Module Details" : "Modifica Modulo"}
            </h4>

            <form onSubmit={handleUpdateModuleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Module Number</label>
                  <input
                    type="number"
                    min="1"
                    value={moduleUpdateForm.number ?? ""}
                    onChange={(e) => setModuleUpdateForm({ ...moduleUpdateForm, number: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white font-mono focus:outline-none focus:border-[#0066ff]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Type</label>
                  <select
                    value={moduleUpdateForm.type || "theory"}
                    onChange={(e) => setModuleUpdateForm({ ...moduleUpdateForm, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white focus:outline-none focus:border-[#0066ff]"
                  >
                    <option value="theory">Theory</option>
                    <option value="skill">Skill</option>
                    <option value="practical">Practical</option>
                    <option value="case_study">Case Study</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Title (Italian)</label>
                <input
                  type="text"
                  value={moduleUpdateForm.title?.it || ""}
                  onChange={(e) => setModuleUpdateForm({ ...moduleUpdateForm, title: { ...moduleUpdateForm.title, it: e.target.value } })}
                  className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white focus:outline-none focus:border-[#0066ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Duration (min)</label>
                <input
                  type="number"
                  min="0"
                  value={moduleUpdateForm.durationMinutes ?? ""}
                  onChange={(e) => setModuleUpdateForm({ ...moduleUpdateForm, durationMinutes: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white font-mono focus:outline-none focus:border-[#0066ff]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1f2937]">
                <button
                  type="button"
                  onClick={() => setEditingModule(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  {isEn ? "Cancel" : "Annulla"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingModule}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#0066ff] hover:bg-[#0052cc] transition disabled:opacity-50"
                >
                  {isSubmittingModule ? (isEn ? "Saving..." : "Salvataggio...") : (isEn ? "Save Changes" : "Salva Modifiche")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: Add Lesson */}
      {addLessonModuleId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111827] border border-[#1f2937] rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <h4 className="text-base font-bold text-white mb-4">
              {isEn ? "Add Lesson to Module" : "Aggiungi Lezione al Modulo"}
            </h4>

            <form onSubmit={handleAddLessonSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Order</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={lessonForm.order}
                    onChange={(e) => setLessonForm({ ...lessonForm, order: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white font-mono focus:outline-none focus:border-[#0066ff]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Type</label>
                  <select
                    value={lessonForm.itemType}
                    onChange={(e) => setLessonForm({ ...lessonForm, itemType: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white focus:outline-none focus:border-[#0066ff]"
                  >
                    <option value="video">Video</option>
                    <option value="pdf">PDF</option>
                    <option value="case_study">Case Study</option>
                    <option value="exercise_card">Exercise Card</option>
                    <option value="template">Template</option>
                    <option value="assignment">Assignment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Duration (m)</label>
                  <input
                    type="number"
                    min="0"
                    value={lessonForm.durationMinutes}
                    onChange={(e) => setLessonForm({ ...lessonForm, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white font-mono focus:outline-none focus:border-[#0066ff]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Title (Italian) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Analisi Biomeccanica dello Squat"
                  value={lessonForm.title.it || ""}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: { ...lessonForm.title, it: e.target.value } })}
                  className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white focus:outline-none focus:border-[#0066ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Video ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. ACD-VID-001"
                  value={lessonForm.video_id || ""}
                  onChange={(e) => setLessonForm({ ...lessonForm, video_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white font-mono focus:outline-none focus:border-[#0066ff]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1f2937]">
                <button
                  type="button"
                  onClick={() => setAddLessonModuleId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  {isEn ? "Cancel" : "Annulla"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLesson}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#0066ff] hover:bg-[#0052cc] transition disabled:opacity-50"
                >
                  {isSubmittingLesson ? (isEn ? "Adding..." : "Salvataggio...") : (isEn ? "Add Lesson" : "Aggiungi Lezione")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: Edit Lesson */}
      {editingLesson && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111827] border border-[#1f2937] rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <h4 className="text-base font-bold text-white mb-4">
              {isEn ? "Edit Lesson Details" : "Modifica Lezione"}
            </h4>

            <form onSubmit={handleUpdateLessonSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Order</label>
                  <input
                    type="number"
                    min="1"
                    value={lessonUpdateForm.order ?? ""}
                    onChange={(e) => setLessonUpdateForm({ ...lessonUpdateForm, order: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white font-mono focus:outline-none focus:border-[#0066ff]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Type</label>
                  <select
                    value={lessonUpdateForm.itemType || "video"}
                    onChange={(e) => setLessonUpdateForm({ ...lessonUpdateForm, itemType: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white focus:outline-none focus:border-[#0066ff]"
                  >
                    <option value="video">Video</option>
                    <option value="pdf">PDF</option>
                    <option value="case_study">Case Study</option>
                    <option value="exercise_card">Exercise Card</option>
                    <option value="template">Template</option>
                    <option value="assignment">Assignment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Duration (m)</label>
                  <input
                    type="number"
                    min="0"
                    value={lessonUpdateForm.durationMinutes ?? ""}
                    onChange={(e) => setLessonUpdateForm({ ...lessonUpdateForm, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white font-mono focus:outline-none focus:border-[#0066ff]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Title (Italian)</label>
                <input
                  type="text"
                  value={lessonUpdateForm.title?.it || ""}
                  onChange={(e) => setLessonUpdateForm({ ...lessonUpdateForm, title: { ...lessonUpdateForm.title, it: e.target.value } })}
                  className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white focus:outline-none focus:border-[#0066ff]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1f2937]">
                <button
                  type="button"
                  onClick={() => setEditingLesson(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  {isEn ? "Cancel" : "Annulla"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLesson}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#0066ff] hover:bg-[#0052cc] transition disabled:opacity-50"
                >
                  {isSubmittingLesson ? (isEn ? "Saving..." : "Salvataggio...") : (isEn ? "Save Changes" : "Salva Modifiche")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: Assign Video from Studio */}
      {assignVideoLesson && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111827] border border-[#1f2937] rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <h4 className="text-base font-bold text-white mb-1">
              {isEn ? "Assign Video to Lesson" : "Assegna Video alla Lezione"}
            </h4>
            <p className="text-xs text-slate-400 font-mono mb-4">
              Lesson: {assignVideoLesson.title} ({assignVideoLesson.id})
            </p>

            <form onSubmit={handleAssignVideoSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Select Video from Library ({availableVideos.length} approved available)
                </label>
                {isLoadingVideos ? (
                  <p className="text-xs text-slate-500 py-2">Loading video catalog...</p>
                ) : availableVideos.length > 0 ? (
                  <select
                    value={selectedVideoId}
                    onChange={(e) => setSelectedVideoId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white focus:outline-none focus:border-[#0066ff]"
                  >
                    <option value="">-- Select Video Asset --</option>
                    {availableVideos.map((v) => (
                      <option key={v.videoId} value={v.videoId}>
                        {v.videoId} — {v.titleIt || v.title} ({v.provider})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-amber-400 py-2">
                    No approved videos found in the video studio. You can enter an ID manually below.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Or Enter Video ID Manually (3-32 chars)
                </label>
                <input
                  type="text"
                  name="videoId"
                  placeholder="e.g. ACD-VID-001"
                  value={selectedVideoId}
                  minLength={3}
                  maxLength={32}
                  aria-invalid={Boolean(selectedVideoId.trim() && (selectedVideoId.trim().length < 3 || selectedVideoId.trim().length > 32))}
                  onInvalid={(event) => {
                    event.preventDefault();
                    event.currentTarget.focus();
                    toast.error(isEn ? "Video ID must contain 3 to 32 characters" : "L'ID video deve contenere da 3 a 32 caratteri", { id: "admin-video-assign" });
                  }}
                  onChange={(e) => setSelectedVideoId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white font-mono focus:outline-none focus:border-[#0066ff]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1f2937]">
                <button
                  type="button"
                  onClick={() => { beginVideos(); setAssignVideoLesson(null); }}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  {isEn ? "Cancel" : "Annulla"}
                </button>
                <button
                  type="submit"
                  disabled={isAssigningVideo || !selectedVideoId.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#0066ff] hover:bg-[#0052cc] transition disabled:opacity-50"
                >
                  {isAssigningVideo ? (isEn ? "Assigning..." : "Assegnazione...") : (isEn ? "Assign Video" : "Assegna Video")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
