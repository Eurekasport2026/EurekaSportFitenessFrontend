import "server-only";

/** One backend per frontend deployment; old variable names remain aliases. */
function resolveBackendApiBase(): string {
  const configured = [process.env.EUREKA_API_URL, process.env.EUREKA_AUTH_API_URL, process.env.EUREKA_COURSES_API_URL]
    .filter((value): value is string => Boolean(value?.trim()))
    .map(value => value.trim().replace(/\/+$/, ""));
  if (new Set(configured).size > 1) throw new Error("Eureka backend URL settings must match");
  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
  const defaultUrl = isProd
    ? "https://api-production-c166.up.railway.app/api/v1"
    : "http://localhost:8000/api/v1";
  const value = configured[0] || defaultUrl;
  const url = new URL(value);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/api/v1" ||
      (url.protocol !== "https:" && !(url.protocol === "http:" && local && !isProd))) {
    throw new Error("EUREKA_API_URL must be an HTTPS /api/v1 URL (local HTTP is allowed in development)");
  }
  return value;
}

export const backendApiBase = resolveBackendApiBase();
