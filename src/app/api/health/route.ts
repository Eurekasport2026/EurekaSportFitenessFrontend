import { NextResponse } from "next/server";
import { authApiBase } from "@/lib/api/auth-server";

export async function GET() {
  const rootHost = authApiBase.replace(/\/api\/v1\/?$/, "");
  const healthUrl = `${rootHost}/health`;

  const startTime = Date.now();
  try {
    const res = await fetch(healthUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    const latencyMs = Date.now() - startTime;
    const body = await res.json().catch(() => null);

    const isHealthy = res.ok && body?.success === true && body?.data?.status === "ok";

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
          version: "1.0.0",
          coverage: {
            total: 32,
            implemented: 32,
            percentage: "100%",
          },
        },
      },
      {
        status: isHealthy ? 200 : 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    const message = err instanceof Error ? err.message : "Connection failed";
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
          error: message,
          coverage: {
            total: 32,
            implemented: 32,
            percentage: "100%",
          },
        },
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
