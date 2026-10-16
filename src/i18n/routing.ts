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
    "/admin/courses": "/admin/courses",
    "/admin/system": "/admin/system",
    "/admin/users": "/admin/users",
    "/trainer": "/trainer",
    "/trainer/courses": "/trainer/courses",
    "/trainer/coaching": "/trainer/coaching",
    "/trainer/courses/[slug]": "/trainer/courses/[slug]",
    "/trainer/courses/[slug]/modules/[moduleId]": "/trainer/courses/[slug]/modules/[moduleId]",
    "/trainer/courses/[slug]/modules/[moduleId]/exercises/[exerciseId]": "/trainer/courses/[slug]/modules/[moduleId]/exercises/[exerciseId]",
    "/trainer/courses/[slug]/modules/[moduleId]/lessons/[lessonId]": "/trainer/courses/[slug]/modules/[moduleId]/lessons/[lessonId]",
    "/athlete": "/athlete",
    "/athlete/paths": "/athlete/paths",
    "/athlete/programs": "/athlete/programs",
    "/athlete/exercises": "/athlete/exercises",
    "/athlete/workout": "/athlete/workout",
    "/athlete/progress": "/athlete/progress",
    "/athlete/coach": "/athlete/coach",
    "/athlete/settings": "/athlete/settings",
    "/athlete/profile": "/athlete/profile",
    "/training/app/sessions": "/training/app/sessions",
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
