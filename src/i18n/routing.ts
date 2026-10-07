import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["it", "en"],
  defaultLocale: "it",
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/academy": "/academy",
    "/training": "/training",
    "/training/app": "/training/app",
    "/training/app/onboarding": "/training/app/onboarding",
    "/training/app/workout": "/training/app/workout",
    "/training/app/membership": "/training/app/membership",
    "/training/app/settings": "/training/app/settings",
    "/training/app/profile": "/training/app/profile",
    "/app": "/app",
    "/prezzi": {
      it: "/prezzi",
      en: "/pricing",
    },
    "/contatti": {
      it: "/contatti",
      en: "/contact",
    },
    "/chi-siamo": {
      it: "/chi-siamo",
      en: "/about-us",
    },
    "/academy/corsi": {
      it: "/academy/corsi",
      en: "/academy/courses",
    },
    "/academy/corsi/personal-trainer": {
      it: "/academy/corsi/personal-trainer",
      en: "/academy/courses/personal-trainer",
    },
    "/academy/corsi/[slug]": {
      it: "/academy/corsi/[slug]",
      en: "/academy/courses/[slug]",
    },
  },
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
