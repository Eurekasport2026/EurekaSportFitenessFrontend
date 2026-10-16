export const athleteRoutes = {
  home: "/athlete",
  paths: "/athlete/paths",
  programs: "/athlete/programs",
  library: "/athlete/exercises",
  workout: "/athlete/workout",
  progress: "/athlete/progress",
  coach: "/athlete/coach",
  settings: "/athlete/settings",
  profile: "/athlete/profile",
} as const;

export type AthleteView = keyof typeof athleteRoutes;

export function isAthletePath(pathname: string) {
  return pathname === "/athlete" || pathname.startsWith("/athlete/");
}

export function athleteView(pathname: string): AthleteView {
  return (Object.keys(athleteRoutes) as AthleteView[]).find(view => athleteRoutes[view] === pathname) ?? "home";
}
