export const roles = ["admin", "coach", "athlete"] as const;
export type Role = typeof roles[number];
export type PortalPath = "/admin/videos" | "/trainer/courses" | "/athlete";

export function parseRoles(value: unknown, legacy?: unknown): Role[] | null {
  const source = value === undefined ? [legacy === "user" ? "athlete" : legacy] : value;
  if (!Array.isArray(source) || !source.length || source.some(role => !roles.includes(role as Role))) return null;
  return roles.filter(role => source.includes(role));
}

export function hasRole(user: { roles: Role[] } | null | undefined, role: Role) {
  return Boolean(user?.roles.includes(role));
}

export function roleHome(role: Role): PortalPath {
  return role === "admin" ? "/admin/videos" : role === "coach" ? "/trainer/courses" : "/athlete";
}

export function accountHome(user: { roles: Role[] } | null | undefined): PortalPath {
  return roleHome(user?.roles[0] ?? "athlete");
}
