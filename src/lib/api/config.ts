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
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
  mockFallback: process.env.NEXT_PUBLIC_MOCK_FALLBACK !== "false",
  timeoutMs: Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS) || 8000,
};

/**
 * Retrieves the current authentication bearer token from client storage
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("eureka_auth_token") || localStorage.getItem("token") || null;
  } catch {
    return null;
  }
}
