"use client";

import { useCallback, useMemo } from "react";
import { useAuth } from "@/components/features/training-app/AuthProvider";
import { portalRequest } from "@/lib/api/portal";
import { learningServiceFor } from "@/lib/api/learning";

export function usePortalRequest() {
  const owner = useAuth().session?.user.id ?? "";
  return useCallback(<T,>(path: string, method = "GET", body?: unknown, signal?: AbortSignal) =>
    portalRequest<T>(path, method, body, signal, owner), [owner]);
}

export function useLearningService() {
  const owner = useAuth().session?.user.id ?? "";
  return useMemo(() => learningServiceFor(owner), [owner]);
}
