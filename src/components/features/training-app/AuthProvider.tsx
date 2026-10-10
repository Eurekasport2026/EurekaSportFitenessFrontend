"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { usePathname } from "@/i18n/routing";
import { authService, type AuthSession } from "@/lib/api/auth";

type AuthState = { status: "loading" | "authenticated" | "anonymous" | "error"; session: AuthSession | null; signedOutIntentionally?: boolean };
interface AuthContextValue extends AuthState {
  acceptSession: (session: AuthSession | null) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | null>(null);
const logoutToastId = "fit-auth-logout";

export function AuthProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("TrainingApp");
  const [auth, setAuth] = useState<AuthState>({ status: "loading", session: null });
  const active = useRef<AbortController | null>(null);
  const pathname = usePathname();

  const acceptSession = useCallback((session: AuthSession | null, signedOutIntentionally = false) => {
    active.current?.abort();
    active.current = null;
    setAuth({ status: session ? "authenticated" : "anonymous", session, signedOutIntentionally });
  }, []);

  const refresh = useCallback(async (renew = false) => {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setAuth(current => current.status === "authenticated" ? current : { status: "loading", session: null });
    try {
      const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(35000)]);
      let session = renew ? await authService.refresh(signal) : await authService.session(signal);
      if (!session && !renew && active.current === controller) session = await authService.refresh(signal);
      if (active.current !== controller) return;
      setAuth({ status: session ? "authenticated" : "anonymous", session });
    } catch {
      if (active.current === controller) setAuth({ status: "error", session: null });
    } finally { if (active.current === controller) active.current = null; }
  }, []);

  useEffect(() => {
    void refresh();
    const onFocus = () => { if (!active.current && document.visibilityState === "visible") void refresh(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      active.current?.abort(); active.current = null;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refresh]);

  useEffect(() => { if (!active.current) void refresh(); }, [pathname, refresh]);

  useEffect(() => {
    if (!auth.session) return;
    const remaining = auth.session.expiresAt - Date.now();
    if (remaining <= 0) {
      if (active.current) return;
      if (auth.session.canRefresh) void refresh(true);
      else acceptSession(null);
      return;
    }
    const delay = auth.session.canRefresh ? Math.max(remaining - 60000, remaining / 2) : remaining;
    const timer = setTimeout(() => {
      if (active.current) return;
      if (auth.session?.canRefresh) void refresh(true);
      else acceptSession(null);
    }, Math.min(delay, 2147483647));
    return () => clearTimeout(timer);
  }, [auth.session, acceptSession, refresh]);

  const logout = useCallback(async () => {
    active.current?.abort(); active.current = null;
    toast.dismiss(logoutToastId);
    try {
      await authService.logout(AbortSignal.timeout(35000));
      acceptSession(null, true);
      toast.success(t("notifications.signedOut"), { id: logoutToastId });
    } catch (error) {
      toast.error(t("session.signOutFailed"), { id: logoutToastId });
      throw error;
    }
  }, [acceptSession, t]);

  return <AuthContext.Provider value={{ ...auth, acceptSession, refresh, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider is required");
  return value;
}
