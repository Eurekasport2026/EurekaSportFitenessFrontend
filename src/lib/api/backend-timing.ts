import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

type UpstreamTiming = {
  method: string;
  path: string;
  status?: number;
  headersMs: number;
  jsonMs: number;
  error?: "timeout" | "cancelled" | "network";
  networkCode?: string;
};
type ApiTrace = { id: string; upstream: UpstreamTiming[] };
const traces = new AsyncLocalStorage<ApiTrace>();
const responses = new WeakMap<Response, { timing: UpstreamTiming; signal?: AbortSignal | null }>();

function routeLabel(url: string) {
  return new URL(url).pathname
    .replace(/\/(courses|modules|lessons|videos)\/[^/]+/g, "/$1/:id");
}

export class BackendTimeout extends Error {
  constructor() { super("Backend request timed out"); this.name = "BackendTimeout"; }
}

export async function backendFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const trace = traces.getStore();
  const timing: UpstreamTiming = {
    method: options.method || "GET", path: routeLabel(url), headersMs: 0, jsonMs: 0,
  };
  trace?.upstream.push(timing);
  const headers = new Headers(options.headers);
  if (trace) headers.set("X-Request-ID", trace.id);
  const start = performance.now();
  try {
    const response = await fetch(url, { ...options, headers });
    timing.headersMs = performance.now() - start;
    timing.status = response.status;
    responses.set(response, { timing, signal: options.signal });
    return response;
  } catch (error) {
    timing.headersMs = performance.now() - start;
    const timedOut = options.signal?.reason?.name === "TimeoutError";
    timing.error = timedOut ? "timeout" : options.signal?.aborted ? "cancelled" : "network";
    const cause = error instanceof Error ? error.cause : null;
    const code = cause && typeof cause === "object" && "code" in cause ? cause.code : null;
    if (typeof code === "string" && ["ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN", "UND_ERR_CONNECT_TIMEOUT", "UND_ERR_HEADERS_TIMEOUT", "UND_ERR_SOCKET"].includes(code)) timing.networkCode = code;
    if (timedOut) throw new BackendTimeout();
    throw error;
  }
}

/** Includes body download and JSON parsing in the same request deadline. */
export async function backendJson(response: Response): Promise<Record<string, unknown> | null> {
  const measured = responses.get(response);
  const start = performance.now();
  try {
    const body: unknown = await response.json();
    return body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : null;
  }
  catch (error) {
    if (measured?.signal?.reason?.name === "TimeoutError") {
      measured.timing.error = "timeout";
      throw new BackendTimeout();
    }
    if (measured?.signal?.aborted) {
      measured.timing.error = "cancelled";
      throw error;
    }
    return null;
  } finally {
    if (measured) measured.timing.jsonMs += performance.now() - start;
  }
}

export function withApiTiming<Args extends [Request, ...unknown[]]>(
  handler: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return (...args) => traces.run({ id: randomUUID(), upstream: [] }, async () => {
    const trace = traces.getStore()!;
    const start = performance.now();
    let status = 500;
    try {
      const response = await handler(...args);
      status = response.status;
      const total = performance.now() - start;
      const upstream = trace.upstream.reduce((sum, item) => sum + item.headersMs, 0);
      const json = trace.upstream.reduce((sum, item) => sum + item.jsonMs, 0);
      response.headers.set("X-Request-ID", trace.id);
      response.headers.set("Server-Timing", `total;dur=${total.toFixed(1)}, upstream;dur=${upstream.toFixed(1)}, json;dur=${json.toFixed(1)}, local;dur=${Math.max(0, total - upstream - json).toFixed(1)}`);
      return response;
    } finally {
      const totalMs = performance.now() - start;
      if (process.env.NODE_ENV !== "production" || process.env.EUREKA_API_TIMING === "1" || status >= 500 || totalMs >= 1000) {
        console.info("[api-timing]", JSON.stringify({
          requestId: trace.id, method: args[0].method, path: routeLabel(args[0].url), status,
          totalMs: Math.round(totalMs),
          upstream: trace.upstream.map(item => ({ ...item, headersMs: Math.round(item.headersMs), jsonMs: Math.round(item.jsonMs) })),
        }));
      }
    }
  });
}
