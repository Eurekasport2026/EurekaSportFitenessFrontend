"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { adminVideosService } from "@/lib/api/client";
import { authService, type AuthUser } from "@/lib/api/auth";
import { isReadCancelled, invalidateClientReads } from "@/lib/api/client-reads";
import { useRequestController } from "@/hooks/use-request-controller";
import { AdminNavTabs } from "./AdminNavTabs";
import { useAuth } from "@/components/features/training-app/AuthProvider";
import type { AdminVideo, VideoCreateInput, VideoStatus, VideoUpdateInput } from "@/lib/api/types";

interface AdminVideosManagerProps {
  locale: string;
}

export function AdminVideosManager({ locale }: AdminVideosManagerProps) {
  const isEn = locale === "en";
  const { logout } = useAuth();
  const router = useRouter();
  const [videos, setVideos] = useState<AdminVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<"checking" | "authenticated" | "unauthenticated" | "forbidden">("checking");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const beginLoad = useRequestController();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Modal dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<AdminVideo | null>(null);
  const [previewVideo, setPreviewVideo] = useState<AdminVideo | null>(null);

  // Form states for Create
  const [createForm, setCreateForm] = useState<VideoCreateInput>({
    video_id: "",
    title_it: "",
    title_en: "",
    category: "Academy",
    provider: "Vimeo",
    provider_video_id: "",
    embed_url: "",
    status: "DRAFT",
    duration_sec: undefined,
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for Update
  const [updateForm, setUpdateForm] = useState<VideoUpdateInput>({});

  // Check auth and load videos
  const loadVideos = useCallback(async () => {
    const signal = beginLoad();
    setIsLoading(true);
    try {
      const [session, result] = await Promise.allSettled([
        authService.session(signal),
        adminVideosService.list({
          locale,
          status: statusFilter === "ALL" ? undefined : (statusFilter as VideoStatus),
          q: debouncedSearch || undefined,
        }, signal),
      ]);
      if (signal.aborted) return;
      if ((session.status === "rejected" && isReadCancelled(session.reason)) ||
          (result.status === "rejected" && isReadCancelled(result.reason))) return;
      setCurrentUser(session.status === "fulfilled" ? session.value?.user ?? null : null);
      if (result.status === "rejected") throw result.reason;
      setVideos(result.value);
      setAuthStatus("authenticated");
    } catch (err: unknown) {
      if (signal.aborted || isReadCancelled(err)) return;
      const status = typeof err === "object" && err !== null && "status" in err ? (err as { status: number }).status : 0;
      if (status === 401) {
        setAuthStatus("unauthenticated");
      } else if (status === 403) {
        setAuthStatus("forbidden");
      } else {
        toast.error(isEn ? "Failed to load admin videos" : "Impossibile caricare i video admin", { id: "admin-videos-load" });
      }
    } finally {
      if (!signal.aborted) setIsLoading(false);
    }
  }, [locale, statusFilter, debouncedSearch, isEn, beginLoad]);

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

  useEffect(() => {
    void loadVideos();
    const onAuthChange = () => { setVideos([]); setCurrentUser(null); void loadVideos(); };
    window.addEventListener("eureka-auth-changed", onAuthChange);
    return () => window.removeEventListener("eureka-auth-changed", onAuthChange);
  }, [loadVideos]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = videos.length;
    const approved = videos.filter((v) => v.status === "APPROVED").length;
    const review = videos.filter((v) => v.status === "REVIEW").length;
    const draft = videos.filter((v) => v.status === "DRAFT").length;
    const archived = videos.filter((v) => v.status === "ARCHIVED").length;
    return { total, approved, review, draft, archived };
  }, [videos]);

  // Handle Create Video Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.video_id.trim() || !createForm.title_it.trim()) {
      toast.error(isEn ? "Video ID and Italian Title are required" : "ID Video e Titolo Italiano sono obbligatori");
      return;
    }

    if (!/^[A-Z0-9][A-Z0-9-]{2,31}$/.test(createForm.video_id.trim())) {
      toast.error(isEn ? "Video ID must be uppercase letters, numbers and hyphens (3-32 chars)" : "L'ID Video deve essere in maiuscolo (3-32 caratteri, es. ACD-VID-001)");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await adminVideosService.create({
        ...createForm,
        video_id: createForm.video_id.trim(),
        title_it: createForm.title_it.trim(),
        title_en: createForm.title_en?.trim() || undefined,
        provider_video_id: createForm.provider_video_id?.trim() || null,
        embed_url: createForm.embed_url?.trim() || null,
        duration_sec: createForm.duration_sec ? Number(createForm.duration_sec) : null,
      });

      toast.success(isEn ? `Video ${created.videoId} created successfully` : `Video ${created.videoId} creato con successo`);
      setIsCreateOpen(false);
      setCreateForm({
        video_id: "",
        title_it: "",
        title_en: "",
        category: "Academy",
        provider: "Vimeo",
        provider_video_id: "",
        embed_url: "",
        status: "DRAFT",
        duration_sec: undefined,
        notes: "",
      });
      void loadVideos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : isEn ? "Failed to create video" : "Errore durante la creazione del video";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (video: AdminVideo) => {
    setEditingVideo(video);
    setUpdateForm({
      title_it: video.titleIt,
      title_en: video.titleEn,
      category: video.category,
      provider: video.provider,
      provider_video_id: video.providerVideoId,
      embed_url: video.embedUrl,
      status: (video.status as VideoStatus) || "DRAFT",
      duration_sec: video.durationSec,
      notes: video.notes,
    });
  };

  // Handle Update Video Submit
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;

    setIsSubmitting(true);
    try {
      const updated = await adminVideosService.update(editingVideo.videoId, {
        ...updateForm,
        title_it: updateForm.title_it?.trim() || null,
        title_en: updateForm.title_en?.trim() || null,
        provider_video_id: updateForm.provider_video_id?.trim() || null,
        embed_url: updateForm.embed_url?.trim() || null,
        duration_sec: updateForm.duration_sec ? Number(updateForm.duration_sec) : null,
      });

      toast.success(isEn ? `Video ${updated.videoId} updated successfully` : `Video ${updated.videoId} aggiornato con successo`);
      setEditingVideo(null);
      void loadVideos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : isEn ? "Failed to update video" : "Errore durante l'aggiornamento del video";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format Duration helper
  const formatDuration = (sec?: number | null) => {
    if (!sec || sec <= 0) return "--:--";
    const mins = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    return `${mins}:${remainingSec.toString().padStart(2, "0")}`;
  };

  // Render Status Badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{status}</span>;
      case "REVIEW":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">{status}</span>;
      case "DRAFT":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">{status}</span>;
      case "ARCHIVED":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">{status}</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300">{status}</span>;
    }
  };

  // Unauthenticated view (401 - no session active)
  if (authStatus === "unauthenticated") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#111827] border border-[#1f2937] rounded-2xl p-8 text-center shadow-2xl">
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
              ? "You must sign in with an administrator account to access the Academy Video Studio."
              : "È necessario accedere con un account amministratore per utilizzare la gestione video."}
          </p>
          <Link
            href="/training/app/login"
            className="inline-flex items-center justify-center w-full px-5 py-3 rounded-xl text-sm font-semibold text-white bg-[#0066ff] hover:bg-[#0052cc] transition shadow-lg shadow-blue-500/20"
          >
            {isEn ? "Sign In" : "Accedi"}
          </Link>
        </div>
      </div>
    );
  }

  // Forbidden view (403 - session is active but user role is not admin)
  if (authStatus === "forbidden") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-[#111827] border border-amber-500/30 rounded-2xl p-8 shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white text-center mb-2">
            {isEn ? "Administrator Access Required" : "Privilegi di Amministratore Richiesti"}
          </h2>
          <p className="text-slate-400 text-sm text-center mb-5 leading-relaxed">
            {isEn
              ? "The Railway backend requires an account with the 'admin' role to manage videos."
              : "Il backend Railway richiede un account con ruolo 'admin' per gestire i video."}
          </p>

          {/* Active Account Info Box */}
          <div className="bg-[#0b0f17] border border-[#1f2937] rounded-xl p-4 mb-6">
            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">
              {isEn ? "Active Session" : "Sessione Attiva"}
            </div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-400">{isEn ? "User:" : "Utente:"}</span>
              <span className="text-white font-medium">{currentUser?.name || "Utente"} ({currentUser?.email || "email"})</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">{isEn ? "Role on Backend:" : "Ruolo sul backend:"}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {currentUser?.role || "user"}
              </span>
            </div>
          </div>

          <p className="mb-6 text-sm text-slate-400">{isEn ? "Ask an administrator to update your roles in Users & Access. Role changes take effect on the next account check." : "Chiedi a un amministratore di aggiornare i tuoi ruoli in Utenti e accessi. Le modifiche sono applicate alla prossima verifica account."}</p>


          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleLogoutAndSwitch}
              disabled={isLoggingOut}
              className="flex-1 inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-semibold text-white bg-[#0066ff] hover:bg-[#0052cc] transition shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              {isLoggingOut
                ? (isEn ? "Logging out..." : "Disconnessione...")
                : (isEn ? "Log Out & Switch Account" : "Disconnetti e Cambia Account")}
            </button>
            <button
              type="button"
              onClick={() => { invalidateClientReads(); void loadVideos(); }}
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
      {/* Navigation Tabs between Courses & Videos */}
      <AdminNavTabs activeTab="videos" currentUser={currentUser} locale={locale} />

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8 border-b border-[#1f2937] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold tracking-wider uppercase bg-[#0066ff]/10 text-[#38bdf8] border border-[#0066ff]/20">
              Console Admin
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">Eureka! Sport & Fitness</span>
            {currentUser && (
              <>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-emerald-400 font-mono">
                  {currentUser.name} ({currentUser.role})
                </span>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {isEn ? "Academy Video Studio" : "Gestione Video Academy"}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {isEn
              ? "Register, organize, and monitor Academy streaming video assets."
              : "Registra, organizza e monitora i flussi video didattici dell'Academy."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => { invalidateClientReads(); void loadVideos(); }}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 bg-[#1e293b] hover:bg-[#334155] border border-[#334155] transition active:scale-95 disabled:opacity-50"
            title={isEn ? "Refresh video list" : "Ricarica elenco video"}
          >
            <svg className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{isEn ? "Refresh" : "Ricarica"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0066ff] hover:bg-[#0052cc] shadow-lg shadow-blue-500/20 transition active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>{isEn ? "Add Video" : "Nuovo Video"}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{isEn ? "Total Videos" : "Totale Video"}</p>
          <p className="text-2xl font-bold text-white mt-1">{metrics.total}</p>
        </div>
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
          <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider">{isEn ? "Approved" : "Approvati"}</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{metrics.approved}</p>
        </div>
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
          <p className="text-xs font-medium text-blue-400 uppercase tracking-wider">{isEn ? "Under Review" : "In Revisione"}</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{metrics.review}</p>
        </div>
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
          <p className="text-xs font-medium text-amber-400 uppercase tracking-wider">{isEn ? "Drafts" : "Bozze"}</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{metrics.draft}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isEn ? "Search by title, video ID or Vimeo ID..." : "Cerca per titolo, ID video o ID Vimeo..."}
            className="w-full pl-10 pr-4 py-2 bg-[#111827] border border-[#1f2937] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#0066ff] transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
          {["ALL", "APPROVED", "REVIEW", "DRAFT", "ARCHIVED"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                statusFilter === status
                  ? "bg-[#0066ff] text-white shadow-sm"
                  : "bg-[#111827] text-slate-400 hover:text-white border border-[#1f2937]"
              }`}
            >
              {status === "ALL" ? (isEn ? "All" : "Tutti") : status}
            </button>
          ))}
        </div>
      </div>

      {/* Video Inventory Table / Grid */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-2xl overflow-hidden shadow-xl">
        {isLoading && videos.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-[#0066ff] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">{isEn ? "Loading videos..." : "Caricamento video in corso..."}</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-sm font-medium">{isEn ? "No videos found" : "Nessun video trovato"}</p>
            <p className="text-xs text-slate-500 mt-1">
              {isEn ? "Try adjusting your search query or status filter." : "Prova a modificare i filtri o il termine di ricerca."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-[#0b0f17]/50 text-slate-400 border-b border-[#1f2937]">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">{isEn ? "Video ID & Title" : "ID Video & Titolo"}</th>
                  <th scope="col" className="px-6 py-4 font-semibold">{isEn ? "Category" : "Categoria"}</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Provider / Vimeo</th>
                  <th scope="col" className="px-6 py-4 font-semibold">{isEn ? "Duration" : "Durata"}</th>
                  <th scope="col" className="px-6 py-4 font-semibold">{isEn ? "Status" : "Stato"}</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-right">{isEn ? "Actions" : "Azioni"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2937]">
                {videos.map((video) => (
                  <tr key={video.videoId} className="hover:bg-[#1f2937]/30 transition group">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#1e293b] border border-[#334155] flex-shrink-0 flex items-center justify-center text-[#38bdf8]">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-[#38bdf8] bg-[#0066ff]/10 px-1.5 py-0.5 rounded border border-[#0066ff]/20">
                              {video.videoId}
                            </span>
                            <span className="font-medium text-white">{video.titleIt || video.title}</span>
                          </div>
                          {video.titleEn && (
                            <p className="text-xs text-slate-500 mt-0.5">EN: {video.titleEn}</p>
                          )}
                          {video.notes && (
                            <p className="text-xs text-slate-500 mt-1 italic line-clamp-1">{video.notes}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs text-slate-400 bg-[#1e293b] px-2 py-1 rounded-md">
                        {video.category || "Academy"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-slate-300 font-medium">
                        {video.provider || "Vimeo"}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {video.providerVideoId ? `#${video.providerVideoId}` : "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-400">
                      {formatDuration(video.durationSec)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStatusBadge(String(video.status))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {video.embedUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewVideo(video)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1e293b] transition"
                            title={isEn ? "Preview video player" : "Anteprima video"}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(video)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-[#1e293b] hover:bg-[#334155] border border-[#334155] transition"
                        >
                          {isEn ? "Edit" : "Modifica"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Video */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111827] border border-[#1f2937] rounded-2xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#1f2937] mb-6">
              <h3 className="text-lg font-bold text-white">
                {isEn ? "Add New Academy Video" : "Registra Nuovo Video Academy"}
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1e293b]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {isEn ? "Video ID (e.g. ACD-VID-005) *" : "ID Video (es. ACD-VID-005) *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.video_id}
                    onChange={(e) => setCreateForm({ ...createForm, video_id: e.target.value.toUpperCase() })}
                    placeholder="ACD-VID-005"
                    className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-[#0066ff]"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">3–32 caratteri maiuscoli, numeri o trattini</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {isEn ? "Status *" : "Stato *"}
                  </label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as VideoStatus })}
                    className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white focus:outline-none focus:border-[#0066ff]"
                  >
                    <option value="DRAFT">DRAFT (Bozza)</option>
                    <option value="REVIEW">REVIEW (In Revisione)</option>
                    <option value="APPROVED">APPROVED (Approvato)</option>
                    <option value="ARCHIVED">ARCHIVED (Archiviato)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {isEn ? "Title (Italian) *" : "Titolo (Italiano) *"}
                </label>
                <input
                  type="text"
                  required
                  value={createForm.title_it}
                  onChange={(e) => setCreateForm({ ...createForm, title_it: e.target.value })}
                  placeholder="Es. Esecuzione del Front Lever e progressioni"
                  className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white focus:outline-none focus:border-[#0066ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {isEn ? "Title (English)" : "Titolo (Inglese)"}
                </label>
                <input
                  type="text"
                  value={createForm.title_en}
                  onChange={(e) => setCreateForm({ ...createForm, title_en: e.target.value })}
                  placeholder="Es. Front Lever execution and progressions"
                  className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white focus:outline-none focus:border-[#0066ff]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Provider</label>
                  <input
                    type="text"
                    value={createForm.provider}
                    onChange={(e) => setCreateForm({ ...createForm, provider: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white focus:outline-none focus:border-[#0066ff]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Vimeo ID</label>
                  <input
                    type="text"
                    value={createForm.provider_video_id || ""}
                    onChange={(e) => setCreateForm({ ...createForm, provider_video_id: e.target.value })}
                    placeholder="1232777945"
                    className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white font-mono focus:outline-none focus:border-[#0066ff]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{isEn ? "Duration (sec)" : "Durata (secondi)"}</label>
                  <input
                    type="number"
                    min="0"
                    value={createForm.duration_sec ?? ""}
                    onChange={(e) => setCreateForm({ ...createForm, duration_sec: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="1200"
                    className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white font-mono focus:outline-none focus:border-[#0066ff]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Embed URL (HTTPS)</label>
                <input
                  type="url"
                  value={createForm.embed_url || ""}
                  onChange={(e) => setCreateForm({ ...createForm, embed_url: e.target.value })}
                  placeholder="https://player.vimeo.com/video/1232777945"
                  className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white font-mono text-xs focus:outline-none focus:border-[#0066ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{isEn ? "Admin Notes" : "Note Amministrative"}</label>
                <textarea
                  rows={2}
                  value={createForm.notes || ""}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  placeholder="Note interne di produzione o requisiti docente..."
                  className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white focus:outline-none focus:border-[#0066ff]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1f2937]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-[#1e293b]"
                >
                  {isEn ? "Cancel" : "Annulla"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0066ff] hover:bg-[#0052cc] transition disabled:opacity-50"
                >
                  {isSubmitting ? (isEn ? "Saving..." : "Salvataggio...") : (isEn ? "Create Video" : "Crea Video")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Video */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111827] border border-[#1f2937] rounded-2xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#1f2937] mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {isEn ? "Edit Video" : "Modifica Video"}
                </h3>
                <p className="text-xs font-mono text-[#38bdf8] mt-0.5">{editingVideo.videoId}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingVideo(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1e293b]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {isEn ? "Status" : "Stato"}
                </label>
                <select
                  value={updateForm.status || "DRAFT"}
                  onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value as VideoStatus })}
                  className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white focus:outline-none focus:border-[#0066ff]"
                >
                  <option value="DRAFT">DRAFT (Bozza)</option>
                  <option value="REVIEW">REVIEW (In Revisione)</option>
                  <option value="APPROVED">APPROVED (Approvato)</option>
                  <option value="ARCHIVED">ARCHIVED (Archiviato)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {isEn ? "Title (Italian)" : "Titolo (Italiano)"}
                </label>
                <input
                  type="text"
                  value={updateForm.title_it || ""}
                  onChange={(e) => setUpdateForm({ ...updateForm, title_it: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white focus:outline-none focus:border-[#0066ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {isEn ? "Title (English)" : "Titolo (Inglese)"}
                </label>
                <input
                  type="text"
                  value={updateForm.title_en || ""}
                  onChange={(e) => setUpdateForm({ ...updateForm, title_en: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white focus:outline-none focus:border-[#0066ff]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Vimeo ID</label>
                  <input
                    type="text"
                    value={updateForm.provider_video_id || ""}
                    onChange={(e) => setUpdateForm({ ...updateForm, provider_video_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white font-mono focus:outline-none focus:border-[#0066ff]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{isEn ? "Duration (sec)" : "Durata (secondi)"}</label>
                  <input
                    type="number"
                    min="0"
                    value={updateForm.duration_sec ?? ""}
                    onChange={(e) => setUpdateForm({ ...updateForm, duration_sec: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white font-mono focus:outline-none focus:border-[#0066ff]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Embed URL (HTTPS)</label>
                <input
                  type="url"
                  value={updateForm.embed_url || ""}
                  onChange={(e) => setUpdateForm({ ...updateForm, embed_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white font-mono text-xs focus:outline-none focus:border-[#0066ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{isEn ? "Admin Notes" : "Note Amministrative"}</label>
                <textarea
                  rows={2}
                  value={updateForm.notes || ""}
                  onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-[#1f2937] rounded-xl text-sm text-white focus:outline-none focus:border-[#0066ff]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1f2937]">
                <button
                  type="button"
                  onClick={() => setEditingVideo(null)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-[#1e293b]"
                >
                  {isEn ? "Cancel" : "Annulla"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0066ff] hover:bg-[#0052cc] transition disabled:opacity-50"
                >
                  {isSubmitting ? (isEn ? "Saving..." : "Salvataggio...") : (isEn ? "Save Changes" : "Salva Modifiche")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Player Preview */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#111827] border border-[#1f2937] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-[#1f2937]">
              <div>
                <h3 className="text-base font-bold text-white">{previewVideo.titleIt || previewVideo.title}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{previewVideo.videoId} • {previewVideo.provider}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewVideo(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1e293b]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="aspect-video w-full bg-black flex items-center justify-center">
              {previewVideo.embedUrl ? (
                <iframe
                  src={previewVideo.embedUrl}
                  title={previewVideo.titleIt}
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <p className="text-sm text-slate-500">{isEn ? "No stream URL configured" : "Nessun URL di streaming configurato"}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
