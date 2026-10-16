"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { healthService, type HealthTelemetry } from "@/lib/api/client";
import { authService, type AuthUser } from "@/lib/api/auth";
import { isReadCancelled } from "@/lib/api/client-reads";
import { useRequestController } from "@/hooks/use-request-controller";
import { AdminNavTabs } from "./AdminNavTabs";
import { useAuth } from "@/components/features/training-app/AuthProvider";

interface AdminSystemHealthProps {
  locale: string;
}

interface EndpointRecord {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  category: "auth" | "academy" | "videos" | "admin" | "system" | "trainer" | "learning";
  summary: string;
  implemented: boolean;
}

const ALL_ENDPOINTS: EndpointRecord[] = [
  // Auth
  { method: "POST", path: "/api/v1/auth/signup", category: "auth", summary: "Register new user account", implemented: true },
  { method: "POST", path: "/api/v1/auth/login", category: "auth", summary: "Authenticate and issue session cookies", implemented: true },
  { method: "POST", path: "/api/v1/auth/refresh", category: "auth", summary: "Refresh session access token", implemented: true },
  { method: "POST", path: "/api/v1/auth/logout", category: "auth", summary: "Revoke session and clear cookies", implemented: true },
  { method: "GET", path: "/api/v1/auth/me", category: "auth", summary: "Current authenticated session identity", implemented: true },

  // Public Academy
  { method: "GET", path: "/api/v1/courses", category: "academy", summary: "List public active Academy courses", implemented: true },
  { method: "GET", path: "/api/v1/courses/{slug}", category: "academy", summary: "Get course detail by slug", implemented: true },
  { method: "GET", path: "/api/v1/courses/{slug}/modules", category: "academy", summary: "Get course curriculum modules", implemented: true },
  { method: "GET", path: "/api/v1/courses/{slug}/videos", category: "academy", summary: "Get videos associated with course", implemented: true },
  { method: "GET", path: "/api/v1/modules", category: "academy", summary: "List all curriculum modules", implemented: true },
  { method: "GET", path: "/api/v1/modules/{module_id}", category: "academy", summary: "Get single module details", implemented: true },
  { method: "GET", path: "/api/v1/modules/{module_id}/lessons", category: "academy", summary: "Get lessons inside module", implemented: true },
  { method: "GET", path: "/api/v1/modules/{module_id}/videos", category: "academy", summary: "Get videos inside module", implemented: true },
  { method: "GET", path: "/api/v1/lessons", category: "academy", summary: "List all lessons", implemented: true },
  { method: "GET", path: "/api/v1/lessons/{lesson_id}", category: "academy", summary: "Get lesson details by ID", implemented: true },
  { method: "GET", path: "/api/v1/lessons/{lesson_id}/adjacent", category: "academy", summary: "Get next & previous lesson pointers", implemented: true },

  // Public Videos
  { method: "GET", path: "/api/v1/videos", category: "videos", summary: "List approved streaming videos", implemented: true },
  { method: "GET", path: "/api/v1/videos/{video_id}", category: "videos", summary: "Get streaming video details by ID", implemented: true },

  // Admin Videos
  { method: "GET", path: "/api/v1/admin/videos", category: "admin", summary: "Admin list & filter video library", implemented: true },
  { method: "POST", path: "/api/v1/admin/videos", category: "admin", summary: "Admin register new video asset", implemented: true },
  { method: "PATCH", path: "/api/v1/admin/videos/{video_id}", category: "admin", summary: "Admin update video metadata", implemented: true },

  // Admin Courses
  { method: "GET", path: "/api/v1/admin/courses", category: "admin", summary: "Admin list all courses (including drafts)", implemented: true },
  { method: "POST", path: "/api/v1/admin/courses", category: "admin", summary: "Admin create new course", implemented: true },
  { method: "GET", path: "/api/v1/admin/courses/{slug}/design", category: "admin", summary: "Admin fetch curriculum hierarchy tree", implemented: true },
  { method: "PATCH", path: "/api/v1/admin/courses/{slug}", category: "admin", summary: "Admin update course details & publishing", implemented: true },
  { method: "POST", path: "/api/v1/admin/courses/{slug}/modules", category: "admin", summary: "Admin add new module to course", implemented: true },

  // Admin Curriculum
  { method: "PATCH", path: "/api/v1/admin/modules/{module_id}", category: "admin", summary: "Admin update module metadata", implemented: true },
  { method: "POST", path: "/api/v1/admin/modules/{module_id}/lessons", category: "admin", summary: "Admin add lesson to module", implemented: true },
  { method: "PATCH", path: "/api/v1/admin/lessons/{lesson_id}", category: "admin", summary: "Admin update lesson metadata", implemented: true },
  { method: "PUT", path: "/api/v1/admin/lessons/{lesson_id}/video", category: "admin", summary: "Admin link video asset to lesson", implemented: true },
  { method: "DELETE", path: "/api/v1/admin/lessons/{lesson_id}/video", category: "admin", summary: "Admin detach video asset from lesson", implemented: true },

  // Infrastructure / Health
  { method: "GET", path: "/health", category: "system", summary: "Backend liveness probe & status check", implemented: true },
  { method: "GET", path: "/api/v1/admin/users", category: "admin", summary: "Paginated account inventory", implemented: true },
  { method: "PATCH", path: "/api/v1/admin/users/{user_id}", category: "admin", summary: "Manage memberships and account status", implemented: true },
  { method: "POST", path: "/api/v1/admin/invitations", category: "admin", summary: "Create an email-bound role invitation", implemented: true },
  { method: "GET", path: "/api/v1/admin/roster", category: "admin", summary: "List Trainer–Athlete relationships", implemented: true },
  { method: "POST", path: "/api/v1/admin/roster", category: "admin", summary: "Assign an Athlete to a Trainer", implemented: true },
  { method: "DELETE", path: "/api/v1/admin/roster/{coach_id}/{athlete_id}", category: "admin", summary: "Remove a roster relationship", implemented: true },
  { method: "GET", path: "/api/v1/admin/audit", category: "admin", summary: "Read administrative and training audit events", implemented: true },
  { method: "POST", path: "/api/v1/me/invitations/accept", category: "auth", summary: "Accept an invitation for the current account email", implemented: true },
  { method: "GET", path: "/api/v1/trainer/athletes", category: "trainer", summary: "Assigned Athlete roster", implemented: true },
  { method: "GET", path: "/api/v1/trainer/programs", category: "trainer", summary: "Trainer-owned program inventory", implemented: true },
  { method: "POST", path: "/api/v1/trainer/programs", category: "trainer", summary: "Create a training program", implemented: true },
  { method: "PATCH", path: "/api/v1/trainer/programs/{program_id}", category: "trainer", summary: "Update a program with a version check", implemented: true },
  { method: "POST", path: "/api/v1/trainer/assignments", category: "trainer", summary: "Assign a frozen program version", implemented: true },
  { method: "GET", path: "/api/v1/trainer/athletes/{athlete_id}/sessions", category: "trainer", summary: "Review an assigned Athlete's workouts", implemented: true },
  { method: "POST", path: "/api/v1/trainer/sessions/{session_id}/feedback", category: "trainer", summary: "Record Trainer feedback", implemented: true },
  { method: "GET", path: "/api/v1/me/training/profile", category: "trainer", summary: "Read own training profile", implemented: true },
  { method: "PUT", path: "/api/v1/me/training/profile", category: "trainer", summary: "Save own profile with a revision check", implemented: true },
  { method: "GET", path: "/api/v1/me/training/assignments", category: "trainer", summary: "Read own assigned program versions", implemented: true },
  { method: "GET", path: "/api/v1/me/training/sessions", category: "trainer", summary: "Read own workout history and feedback", implemented: true },
  { method: "POST", path: "/api/v1/me/training/sessions", category: "trainer", summary: "Record a workout with an idempotency key", implemented: true },
  { method: "GET", path: "/api/v1/courses/{slug}/exam", category: "learning", summary: "Public localized questions without answer keys", implemented: true },
  { method: "GET", path: "/api/v1/me/courses/{slug}/progress", category: "learning", summary: "Read own course progress", implemented: true },
  { method: "POST", path: "/api/v1/me/courses/{slug}/enrollment", category: "learning", summary: "Enable account-owned course progress", implemented: true },
  { method: "POST", path: "/api/v1/me/courses/{slug}/progress/import", category: "learning", summary: "Explicitly import valid legacy lesson checkmarks", implemented: true },
  { method: "PUT", path: "/api/v1/me/courses/{slug}/lessons/{lesson_id}", category: "learning", summary: "Set completion for a lesson in the course", implemented: true },
  { method: "POST", path: "/api/v1/me/courses/{slug}/exam", category: "learning", summary: "Score answers and persist non-practice results", implemented: true },
  { method: "POST", path: "/api/v1/me/courses/{slug}/exam/practice", category: "learning", summary: "Review a practice answer without recording an exam outcome", implemented: true },
  { method: "GET", path: "/api/v1/me/courses/{slug}/assignment", category: "learning", summary: "Read own submission", implemented: true },
  { method: "POST", path: "/api/v1/me/courses/{slug}/assignment", category: "learning", summary: "Submit work and an optional resource link", implemented: true },
  { method: "GET", path: "/api/v1/admin/courses/{slug}/submissions", category: "learning", summary: "Paginated submission review inventory", implemented: true },
  { method: "PATCH", path: "/api/v1/admin/courses/{slug}/submissions/{user_id}", category: "learning", summary: "Approve or request revision as an Admin", implemented: true },
];

export function AdminSystemHealth({ locale }: AdminSystemHealthProps) {
  const isEn = locale === "en";
  const { logout } = useAuth();
  const router = useRouter();

  const [healthData, setHealthData] = useState<HealthTelemetry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProbing, setIsProbing] = useState(false);
  const [authStatus, setAuthStatus] = useState<"checking" | "authenticated" | "unauthenticated" | "forbidden">("checking");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const beginProbe = useRequestController();

  // Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const runHealthProbe = useCallback(async (isManual = false) => {
    const signal = beginProbe();
    if (isManual) setIsProbing(true);
    else setIsLoading(true);

    try {
      const [sessionResult, healthResult] = await Promise.allSettled([
        authService.session(signal), healthService.check(signal),
      ]);
      if (signal.aborted) return;
      if (sessionResult.status === "rejected") throw sessionResult.reason;
      const session = sessionResult.value;
      if (session?.user) {
        setCurrentUser(session.user);
        if (session.user.roles.includes("admin")) {
          setAuthStatus("authenticated");
        } else {
          setAuthStatus("forbidden");
        }
      } else {
        setCurrentUser(null);
        setAuthStatus("unauthenticated");
      }

      if (healthResult.status === "rejected") throw healthResult.reason;
      const data = healthResult.value;
      setHealthData(data);

      if (isManual) {
        const notify = data.status === "ok" ? toast.success : toast.error;
        notify(
          isEn
            ? `Backend ${data.status === "ok" ? "healthy" : "unavailable"} (${data.latencyMs}ms)`
            : `Backend ${data.status === "ok" ? "operativo" : "non disponibile"} (${data.latencyMs}ms)`,
          { id: "admin-health-probe" },
        );
      }
    } catch (err: unknown) {
      if (signal.aborted || isReadCancelled(err)) return;
      const msg = err instanceof Error ? err.message : "Health probe failed";
      if (isManual) {
        toast.error(isEn ? `Probe failed: ${msg}` : `Test fallito: ${msg}`, { id: "admin-health-probe" });
      }
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
        setIsProbing(false);
      }
    }
  }, [isEn, beginProbe]);

  useEffect(() => {
    void runHealthProbe(false);
    const onAuthChange = () => { setCurrentUser(null); setHealthData(null); void runHealthProbe(false); };
    window.addEventListener("eureka-auth-changed", onAuthChange);
    return () => window.removeEventListener("eureka-auth-changed", onAuthChange);
  }, [runHealthProbe]);

  // Handle Log Out & Switch Account
  const handleLogoutAndSwitch = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/training/app/login");
    } catch {
      // AuthProvider owns logout feedback.
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Filtered Endpoints
  const filteredEndpoints = useMemo(() => {
    return ALL_ENDPOINTS.filter((ep) => {
      if (categoryFilter !== "ALL" && ep.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchPath = ep.path.toLowerCase().includes(q);
        const matchSummary = ep.summary.toLowerCase().includes(q);
        const matchMethod = ep.method.toLowerCase().includes(q);
        if (!matchPath && !matchSummary && !matchMethod) return false;
      }
      return true;
    });
  }, [categoryFilter, searchQuery]);

  // Auth Guard: Unauthenticated (401)
  if (authStatus === "unauthenticated") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-md mx-auto bg-[#111827] border border-[#1f2937] rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m12-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {isEn ? "Authentication Required" : "Autenticazione Richiesta"}
          </h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            {isEn
              ? "You must sign in with an administrator account to access the System Health dashboard."
              : "È necessario accedere con un account amministratore per visualizzare lo stato di sistema."}
          </p>
          <Link
            href="/training/app/login"
            className="inline-flex items-center justify-center w-full px-5 py-3 rounded-xl font-semibold text-white bg-[#0066ff] hover:bg-[#0052cc] transition shadow-lg shadow-[#0066ff]/25"
          >
            {isEn ? "Sign In to Admin" : "Accedi come Amministratore"}
          </Link>
        </div>
      </div>
    );
  }

  // Auth Guard: Forbidden (403)
  if (authStatus === "forbidden") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-lg mx-auto bg-[#111827] border border-amber-500/30 rounded-2xl p-8 shadow-2xl">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-white text-center mb-1">
            {isEn ? "Administrator Role Required" : "Permesso di Amministratore Richiesto"}
          </h2>
          <p className="text-xs text-amber-400/90 text-center font-mono mb-6">
            HTTP 403 Forbidden: role &apos;admin&apos; required
          </p>

          {currentUser && (
            <div className="mb-6 p-4 rounded-xl bg-[#0b0f17] border border-[#1f2937] text-left text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span>{isEn ? "Active Account:" : "Account attivo:"}</span>
                <span className="font-semibold text-slate-200">{currentUser.name}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Email:</span>
                <span className="font-mono text-slate-300">{currentUser.email}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>{isEn ? "Current Role:" : "Ruolo attuale:"}</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono font-bold uppercase">
                  {currentUser.role}
                </span>
              </div>
            </div>
          )}

          <p className="mb-6 text-sm text-slate-400">{isEn ? "Ask an administrator to update your roles in Users & Access. Role changes take effect on the next account check." : "Chiedi a un amministratore di aggiornare i tuoi ruoli in Utenti e accessi. Le modifiche sono applicate alla prossima verifica account."}</p>


          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => void handleLogoutAndSwitch()}
              disabled={isLoggingOut}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50"
            >
              {isLoggingOut
                ? (isEn ? "Logging out..." : "Disconnessione...")
                : (isEn ? "Log Out & Switch Account" : "Disconnetti e Cambia Account")}
            </button>
            <button
              type="button"
              onClick={() => void runHealthProbe(true)}
              className="px-4 py-3 rounded-xl text-sm font-medium text-slate-300 bg-[#1f2937] hover:bg-[#374151] transition"
            >
              {isEn ? "Retry" : "Riprova"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Navigation Tabs */}
      <AdminNavTabs activeTab="system" currentUser={currentUser} locale={locale} />

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8 border-b border-[#1f2937] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold tracking-wider uppercase bg-[#0066ff]/10 text-[#38bdf8] border border-[#0066ff]/20">
              Console Admin
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">Eureka! Sport & Fitness</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {isEn ? "System Health & API Diagnostics" : "Stato del Sistema & Diagnostica API"}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {isEn
              ? "Live readiness and latency probes. The endpoint inventory below describes source integrations; it does not test every operation."
              : "Sonde di disponibilità e latenza. L'inventario descrive le integrazioni nel codice e non verifica ogni operazione."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void runHealthProbe(true)}
            disabled={isProbing || isLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0066ff] hover:bg-[#0052cc] transition shadow-lg shadow-[#0066ff]/20 active:scale-95 disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${isProbing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{isProbing ? (isEn ? "Pinging..." : "Test in corso...") : (isEn ? "Run Live Probe" : "Esegui Test Live")}</span>
          </button>
        </div>
      </div>

      {/* Telemetry Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Railway Backend Status */}
        <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-5">
          <p className="text-xs font-medium text-slate-400">{isEn ? "Railway Backend Status" : "Stato Backend Railway"}</p>
          <div className="flex items-center gap-2.5 mt-2">
            <div className={`w-3 h-3 rounded-full ${healthData?.status === "ok" ? "bg-emerald-400 animate-pulse" : "bg-red-500"}`} />
            <span className="text-xl font-bold text-white uppercase">
              {isLoading ? "..." : healthData?.status === "ok" ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
          <p className="text-[11px] font-mono text-slate-500 mt-1 truncate">
            {healthData?.backendUrl || "api-production-c166.up.railway.app"}
          </p>
        </div>

        {/* Roundtrip Latency */}
        <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-5">
          <p className="text-xs font-medium text-slate-400">{isEn ? "Roundtrip Latency" : "Latenza Risposta"}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-[#38bdf8] font-mono">
              {isLoading ? "--" : `${healthData?.latencyMs ?? 0} ms`}
            </span>
            <span className="text-[11px] text-emerald-400 font-medium">
              {healthData && healthData.latencyMs < 300 ? "Excellent" : "Normal"}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">HTTP {healthData?.httpStatus ?? "—"} · /health</p>
        </div>

        {/* API Coverage */}
        <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-5">
          <p className="text-xs font-medium text-emerald-400">{isEn ? "Source endpoint inventory" : "Inventario endpoint nel codice"}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-emerald-400 font-mono">{ALL_ENDPOINTS.length}</span>
            
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{isEn ? "Reference inventory, not a live coverage measurement" : "Inventario di riferimento, non una misura di copertura live"}</p>
        </div>

        {/* Active Session & Role */}
        <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-5">
          <p className="text-xs font-medium text-slate-400">{isEn ? "Admin Identity" : "Identità Amministratore"}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-base font-bold text-white truncate">{currentUser?.name || "Admin"}</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#0066ff]/20 text-[#38bdf8] border border-[#0066ff]/30">
              {currentUser?.role || "admin"}
            </span>
          </div>
          <p className="text-[11px] font-mono text-slate-500 mt-1 truncate">{currentUser?.email || "Session active"}</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#111827] border border-[#1f2937] rounded-xl overflow-x-auto">
          {[
            { id: "ALL", label: isEn ? `All (${ALL_ENDPOINTS.length})` : `Tutti (${ALL_ENDPOINTS.length})` },
            ...["auth", "academy", "videos", "admin", "trainer", "learning", "system"].map(id => ({ id, label: `${id} (${ALL_ENDPOINTS.filter(endpoint => endpoint.category === id).length})` })),
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                categoryFilter === cat.id
                  ? "bg-[#0066ff] text-white shadow"
                  : "text-slate-400 hover:text-white hover:bg-[#1e293b]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 md:w-72">
          <input
            type="text"
            placeholder={isEn ? "Filter by endpoint path, method..." : "Filtra per percorso o metodo..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#111827] border border-[#1f2937] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0066ff]"
          />
          <svg className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Endpoints Matrix Table */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#1f2937] bg-[#0d131f] text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-28">Method</th>
                <th className="py-3.5 px-4">Endpoint Path</th>
                <th className="py-3.5 px-4">Subsystem</th>
                <th className="py-3.5 px-4">Summary</th>
                <th className="py-3.5 px-4 text-right">Implementation Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2937]">
              {filteredEndpoints.map((ep) => (
                <tr key={`${ep.method}-${ep.path}`} className="hover:bg-[#1a2333]/50 transition">
                  {/* HTTP Method Badge */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded font-mono font-bold text-xs ${
                        ep.method === "GET"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : ep.method === "POST"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : ep.method === "PATCH"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : ep.method === "PUT"
                          ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
                      {ep.method}
                    </span>
                  </td>

                  {/* Path */}
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-xs text-white font-medium">{ep.path}</span>
                  </td>

                  {/* Subsystem */}
                  <td className="py-3.5 px-4">
                    <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                      {ep.category}
                    </span>
                  </td>

                  {/* Summary */}
                  <td className="py-3.5 px-4 text-xs text-slate-300">
                    {ep.summary}
                  </td>

                  {/* Implementation Status */}
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>{isEn ? "In source" : "Nel codice"}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
