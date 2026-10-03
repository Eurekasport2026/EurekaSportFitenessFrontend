/**
 * Type-Safe HTTP Client for Eureka Sport & Fitness
 * 
 * Unwraps standardized backend response envelopes ({ success: true, data: T })
 * and automatically injects authentication headers and locale parameters.
 */

import { apiConfig, getAuthToken } from "./config";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface RequestOptions extends RequestInit {
  locale?: string;
  token?: string;
}

export class ApiClientError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.data = data;
  }
}

function buildUrl(endpoint: string, locale?: string): string {
  const base = apiConfig.apiUrl.replace(/\/+$/, "");
  const path = endpoint.replace(/^\/+/, "");
  const url = new URL(`${base}/${path}`);

  if (locale) {
    url.searchParams.set("locale", locale);
  }

  return url.toString();
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { locale, token, headers, ...rest } = options;
  const url = buildUrl(endpoint, locale);

  const bearerToken = token || getAuthToken();

  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Accept-Language": locale || "it",
    ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
    ...(headers as Record<string, string> | undefined),
  };

  // Controller for request timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), apiConfig.timeoutMs);

  try {
    const res = await fetch(url, {
      ...rest,
      headers: finalHeaders,
      signal: options.signal || controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorBody: unknown;
      try {
        errorBody = await res.json();
      } catch {
        errorBody = await res.text();
      }

      const msg =
        typeof errorBody === "object" && errorBody !== null && "message" in errorBody
          ? String((errorBody as { message: unknown }).message)
          : `HTTP ${res.status}: ${res.statusText}`;

      throw new ApiClientError(msg, res.status, errorBody);
    }

    // Handle 204 No Content
    if (res.status === 204) {
      return {} as T;
    }

    const json = await res.json();

    // Unwrap { success: true, data: T } envelope if present
    if (typeof json === "object" && json !== null && "data" in json && "success" in json) {
      return json.data as T;
    }

    return json as T;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof ApiClientError) {
      throw err;
    }

    const message = err instanceof Error ? err.message : "Network error";
    throw new ApiClientError(message, 0, err);
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};
