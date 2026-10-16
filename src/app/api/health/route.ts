import { backendFetch, backendJson, withApiTiming } from "@/lib/api/backend-timing";
import { NextResponse } from "next/server";
import { authApiBase } from "@/lib/api/auth-server";

async function handleGET(request: Request) {
  const rootHost = authApiBase.replace(/\/api\/v1\/?$/, "");
  const healthUrl = `${rootHost}/health`;

  const startTime = Date.now();
  try {
    const res = await backendFetch(healthUrl, {
      cache: "no-store",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(6000)]),
    });
    const body = await backendJson(res);
    const latencyMs = Date.now() - startTime;
    const data = body?.data;
    const isHealthy = res.ok && body?.success === true && data && typeof data === "object" && "status" in data && data.status === "ok";

    return NextResponse.json(
      {
        success: isHealthy,
        data: {
          status: isHealthy ? "ok" : "degraded",
          backend: isHealthy ? "healthy" : "unreachable",
          backendUrl: healthUrl,
          httpStatus: res.status,
          latencyMs,
          timestamp: new Date().toISOString(),
        },
      },
      {
        status: isHealthy ? 200 : 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    return NextResponse.json(
      {
        success: false,
        data: {
          status: "down",
          backend: "unreachable",
          backendUrl: healthUrl,
          httpStatus: 503,
          latencyMs,
          timestamp: new Date().toISOString(),
          error: "Backend health probe unavailable",
        },
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}

export const GET = withApiTiming(handleGET);
