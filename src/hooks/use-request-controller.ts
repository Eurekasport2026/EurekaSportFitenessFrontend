"use client";

import { useCallback, useEffect, useRef } from "react";

/** Cancel superseded loads and unmounted consumers. */
export function useRequestController() {
  const active = useRef<AbortController | null>(null);
  const begin = useCallback(() => {
    active.current?.abort();
    active.current = new AbortController();
    return active.current.signal;
  }, []);

  useEffect(() => {
    return () => active.current?.abort();
  }, []);

  return begin;
}
