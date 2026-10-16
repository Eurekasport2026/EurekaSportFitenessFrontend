"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useLocale, useMessages } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/routing";
import { english } from "@/lib/translations";
import { isAthletePath } from "@/lib/training/athlete-navigation";

type Language = "it" | "en";
type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (italian: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const locale = (useLocale() || "it") as Language;
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const messages = (useMessages() || {}) as Record<string, string>;

  function setLanguage(nextLanguage: Language) {
    if (nextLanguage === locale) return;
    if (typeof params.slug === "string") {
      const query = Object.fromEntries(new URLSearchParams(window.location.search));
      if (pathname === "/trainer/courses/[slug]/modules/[moduleId]/lessons/[lessonId]" && typeof params.moduleId === "string" && typeof params.lessonId === "string") {
        router.replace({ pathname, params: { slug: params.slug, moduleId: params.moduleId, lessonId: params.lessonId }, query }, { locale: nextLanguage });
        return;
      }
      if (pathname === "/trainer/courses/[slug]/modules/[moduleId]/exercises/[exerciseId]" && typeof params.moduleId === "string" && typeof params.exerciseId === "string") {
        router.replace({ pathname, params: { slug: params.slug, moduleId: params.moduleId, exerciseId: params.exerciseId }, query }, { locale: nextLanguage });
        return;
      }
      if (pathname === "/trainer/courses/[slug]/modules/[moduleId]" && typeof params.moduleId === "string") {
        router.replace({ pathname, params: { slug: params.slug, moduleId: params.moduleId }, query }, { locale: nextLanguage });
        return;
      }
      if (pathname === "/trainer/courses/[slug]") {
        router.replace({ pathname, params: { slug: params.slug }, query }, { locale: nextLanguage });
        return;
      }
      if (pathname === "/academy/corsi/[slug]/learn/[moduleId]" && typeof params.moduleId === "string") {
        router.replace({ pathname, params: { slug: params.slug, moduleId: params.moduleId }, query }, { locale: nextLanguage });
        return;
      }
      if (pathname === "/academy/corsi/[slug]" || pathname === "/academy/corsi/[slug]/learn") {
        router.replace({ pathname, params: { slug: params.slug }, query }, { locale: nextLanguage });
        return;
      }
    }
    if (pathname === "/training/app" || pathname.startsWith("/training/app/") || pathname === "/trainer" || pathname.startsWith("/trainer/") || isAthletePath(pathname)) {
      router.replace({
        pathname: pathname as any,
        query: Object.fromEntries(new URLSearchParams(window.location.search)),
      }, { locale: nextLanguage });
      return;
    }
    router.replace(pathname as any, { locale: nextLanguage });
  }

  const t = (italian: string) => {
    const safeKey = italian.replaceAll(".", "\u2024");
    if (locale === "en") {
      return messages[safeKey] ?? messages[italian] ?? english[safeKey] ?? english[italian] ?? italian;
    }
    return messages[safeKey] ?? messages[italian] ?? italian;
  };

  return (
    <LanguageContext.Provider value={{ language: locale, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}

export function T({ children }: { children: string }) {
  const { t } = useLanguage();
  return <>{t(children)}</>;
}
