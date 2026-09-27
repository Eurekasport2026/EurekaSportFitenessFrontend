"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { english } from "@/lib/translations";

type Language = "it" | "en";
type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void; t: (italian: string) => string };

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("it");

  useEffect(() => {
    const saved = window.localStorage.getItem("eureka-language");
    if (saved === "it" || saved === "en") {
      setLanguageState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  function setLanguage(nextLanguage: Language) {
    setLanguageState(nextLanguage);
    document.documentElement.lang = nextLanguage;
    window.localStorage.setItem("eureka-language", nextLanguage);
  }

  const t = (italian: string) => language === "en" ? english[italian] ?? italian : italian;
  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>;
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
