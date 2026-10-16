"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/features/training-app/AuthProvider";
import type { LearningProgress } from "@/lib/api/learning";
import { useLearningService } from "./use-portal-request";

export function useCourseProgress(slug: string) {
  const learningService = useLearningService();
  const { session, status } = useAuth();
  const empty: LearningProgress = { courseSlug: slug, enrolled: false, completedLessonIds: [], completedModuleIds: [], examPassed: false, assignmentStatus: "not_submitted", updatedAt: "" };
  const [record, setRecord] = useState({ scope: "", progress: empty });
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);
  const scope = `${session?.user.id}:${slug}`;
  useEffect(() => {
    const onFocus = () => { if (document.visibilityState === "visible") setRevision(v => v + 1); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    if (status !== "authenticated") return () => controller.abort();
    setPending(true);
    learningService.progress(slug, controller.signal).then(progress => {
      if (!controller.signal.aborted) setRecord({ scope, progress });
    }).catch(failure => { if (!controller.signal.aborted) setError(failure); })
      .finally(() => { if (!controller.signal.aborted) setPending(false); });
    return () => controller.abort();
  }, [scope, slug, status, revision]);
  return { progress: record.scope === scope && status === "authenticated" ? record.progress : empty, pending, error,
    setProgress: (progress: LearningProgress) => setRecord({ scope, progress }), reload: () => setRevision(v => v + 1) };
}
