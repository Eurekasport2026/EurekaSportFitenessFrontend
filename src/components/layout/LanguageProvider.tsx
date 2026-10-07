"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useLocale, useMessages } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { english } from "@/lib/translations";

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
  const messages = (useMessages() || {}) as Record<string, string>;

  function setLanguage(nextLanguage: Language) {
    if (nextLanguage === locale) return;
    if (pathname === "/training/app" || pathname.startsWith("/training/app/")) {
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
