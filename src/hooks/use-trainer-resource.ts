"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/features/training-app/AuthProvider";
import { usePortalRequest } from "./use-portal-request";

export function useTrainerResource<T>(path: string) {
  const request = usePortalRequest();
  const { session, status } = useAuth();
  const scope = `${session?.user.id ?? ""}:${path}`;
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{ scope: string; data: T | null; pending: boolean; error: Error | null }>({ scope: "", data: null, pending: true, error: null });
  const reload = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    if (status !== "authenticated") return;
    const controller = new AbortController();
    setResult(previous => ({ scope, data: previous.scope === scope ? previous.data : null, pending: true, error: null }));
    request<T>(path, "GET", undefined, controller.signal).then(data => {
      if (!controller.signal.aborted) setResult({ scope, data, pending: false, error: null });
    }).catch(error => {
      if (!controller.signal.aborted) setResult(previous => ({ scope, data: previous.scope === scope ? previous.data : null, pending: false, error: error instanceof Error ? error : new Error("Request failed") }));
    });
    return () => controller.abort();
  }, [request, path, status, scope, revision]);
  return { data: result.scope === scope ? result.data : null, pending: result.scope !== scope || result.pending,
    error: result.scope === scope ? result.error : null, reload };
}
