/**
 * Centralized API and Backend Configuration
 * 
 * Provides runtime switches to seamlessly toggle between local mock data
 * and live backend REST/FastAPI endpoints with automatic resilience fallback.
 */

export interface ApiConfiguration {
  useMockData: boolean;
  apiUrl: string;
  mockFallback: boolean;
  timeoutMs: number;
}

export const apiConfig: ApiConfiguration = {
  // Default to mock data unless explicitly configured to false
  useMockData: process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false",
  // Public browser reads share the same server-only backend configuration as auth.
  apiUrl: "/api/public",
  mockFallback: process.env.NEXT_PUBLIC_MOCK_FALLBACK !== "false",
  timeoutMs: Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS) || 8000,
};

/**
 * Legacy generic client compatibility. Session credentials stay server-only.
 */
export function getAuthToken(): string | null {
  // Authenticated requests use same-origin handlers and HTTP-only cookies.
  return null;
}
