import { authenticatedFetch, isSameOrigin, SessionUnauthorized } from "@/lib/api/auth-server";
import { BackendTimeout, withApiTiming } from "@/lib/api/backend-timing";

// Closed endpoint and method catalog. This is never a general-purpose proxy.
const allowed: [RegExp, string[]][] = [
  [/^trainer\/courses$/, ["GET"]],
  [/^trainer\/courses\/[a-z0-9-]+$/, ["GET"]],
  [/^trainer\/courses\/[a-z0-9-]+\/modules\/[A-Za-z0-9_-]+$/, ["GET"]],
  [/^admin\/courses\/[a-z0-9-]+\/modules\/[A-Za-z0-9_-]+\/resources$/, ["GET", "POST"]],
  [/^admin\/courses\/[a-z0-9-]+\/modules\/[A-Za-z0-9_-]+\/resources\/[a-f0-9-]{36}$/, ["PUT", "DELETE"]],
  [/^admin\/invitations$/, ["POST"]], [/^me\/invitations\/accept$/, ["POST"]],
  [/^admin\/users$/, ["GET"]], [/^admin\/users\/[a-f0-9-]{36}$/, ["PATCH"]],
  [/^admin\/roster$/, ["GET", "POST"]], [/^admin\/roster\/[a-f0-9-]{36}\/[a-f0-9-]{36}$/, ["DELETE"]],
  [/^admin\/audit$/, ["GET"]], [/^trainer\/athletes$/, ["GET"]],
  [/^trainer\/programs$/, ["GET", "POST"]], [/^trainer\/programs\/[a-f0-9-]{36}$/, ["PATCH"]],
  [/^trainer\/assignments$/, ["POST"]], [/^trainer\/athletes\/[a-f0-9-]{36}\/sessions$/, ["GET"]],
  [/^trainer\/sessions\/[a-f0-9-]{36}\/feedback$/, ["POST"]],
  [/^me\/training\/profile$/, ["GET", "PUT"]], [/^me\/training\/assignments$/, ["GET"]],
  [/^me\/training\/sessions$/, ["GET", "POST"]],
  [/^me\/training\/dashboard$/, ["GET"]],
  [/^me\/courses\/[a-z0-9-]+\/progress$/, ["GET"]],
  [/^me\/courses\/[a-z0-9-]+\/progress\/import$/, ["POST"]],
  [/^me\/courses\/[a-z0-9-]+\/enrollment$/, ["POST"]],
  [/^me\/courses\/[a-z0-9-]+\/lessons\/[A-Za-z0-9_-]+$/, ["PUT"]],
  [/^me\/courses\/[a-z0-9-]+\/exam$/, ["POST"]],
  [/^me\/courses\/[a-z0-9-]+\/exam\/practice$/, ["POST"]],
  [/^me\/courses\/[a-z0-9-]+\/assignment$/, ["GET", "POST"]],
  [/^admin\/courses\/[a-z0-9-]+\/submissions$/, ["GET"]],
  [/^admin\/courses\/[a-z0-9-]+\/submissions\/[a-f0-9-]{36}$/, ["PATCH"]],
];

async function handle(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const headers = { "Cache-Control": "no-store" };
  const path = (await context.params).path.join("/");
  if (!allowed.some(([pattern, methods]) => pattern.test(path) && methods.includes(request.method))) return Response.json({ success: false }, { status: 404, headers });
  if (request.method !== "GET" && !isSameOrigin(request)) return Response.json({ success: false }, { status: 403, headers });
  const account = request.headers.get("x-eureka-account");
  if (!account || !/^[a-f0-9-]{36}$/.test(account)) return Response.json({ success: false }, { status: 401, headers });
  try {
    let body: string | undefined;
    if (request.method !== "GET" && request.method !== "DELETE") {
      // Bound photo/profile and program payloads while streaming, not after buffering.
      const reader = request.body?.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      if (reader) {
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          size += chunk.value.byteLength;
          if (size > 3200000) { await reader.cancel(); return Response.json({ success: false }, { status: 413, headers }); }
          chunks.push(chunk.value);
        }
      }
      body = Buffer.concat(chunks).toString("utf8");
      JSON.parse(body);
    }
    const source = new URL(request.url);
    const query = new URLSearchParams();
    for (const key of ["q", "role", "offset", "limit", "locale", "utc_offset_minutes", "revision"]) {
      const value = source.searchParams.get(key);
      if (value !== null && value.length <= 160) query.set(key, value);
    }
    const response = await authenticatedFetch(`${path}${query.size ? `?${query}` : ""}`, {
      method: request.method, body, signal: request.signal,
      headers: { "X-Eureka-Account": account, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    });
    const payload: unknown = await response.json().catch(() => null);
    // Upstream validation errors can contain submitted values. Never relay them.
    if (!response.ok) return Response.json({ success: false }, { status: [400, 401, 403, 404, 409, 413, 422, 429].includes(response.status) ? response.status : 502, headers });
    if (!payload || typeof payload !== "object" || !("success" in payload) || payload.success !== true || !("data" in payload)) return Response.json({ success: false }, { status: 502, headers });
    return Response.json({ success: true, data: payload.data }, { status: response.status, headers });
  } catch (error) {
    const status = error instanceof SessionUnauthorized ? 401 : error instanceof SyntaxError ? 400 : error instanceof BackendTimeout ? 504 : 503;
    return Response.json({ success: false }, { status, headers });
  }
}

export const GET = withApiTiming(handle);
export const POST = withApiTiming(handle);
export const PUT = withApiTiming(handle);
export const PATCH = withApiTiming(handle);
export const DELETE = withApiTiming(handle);
