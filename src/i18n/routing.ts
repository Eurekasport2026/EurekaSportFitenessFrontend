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
    "/training/app/login": "/training/app/login",
    "/training/app/signup": "/training/app/signup",
    "/training/app/workout": "/training/app/workout",
    "/training/app/membership": "/training/app/membership",
    "/training/app/settings": "/training/app/settings",
    "/training/app/profile": "/training/app/profile",
    "/admin/videos": "/admin/videos",
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
    "/academy/corsi/[slug]/learn": {
      it: "/academy/corsi/[slug]/learn",
      en: "/academy/courses/[slug]/learn",
    },
    "/academy/corsi/[slug]/learn/[moduleId]": {
      it: "/academy/corsi/[slug]/learn/[moduleId]",
      en: "/academy/courses/[slug]/learn/[moduleId]",
    },
  },
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
