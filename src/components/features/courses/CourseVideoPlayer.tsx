"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import type { APITypes, PlyrOptions, PlyrSource } from "plyr-react";
import "plyr-react/plyr.css";
import styles from "./lesson-view.module.css";
import { toast } from "sonner";

const Plyr = dynamic(() => import("plyr-react").then((mod) => mod.Plyr), {
  ssr: false,
});

interface CourseVideoPlayerProps {
  src: string;
  title: string;
  poster?: string;
  isEn?: boolean;
  pdfUrl?: string;
  pdfTitle?: string;
  onDurationChange?: (durationStr: string, durationSec: number) => void;
}

export function CourseVideoPlayer({
  src,
  title,
  poster,
  isEn = false,
  pdfUrl,
  pdfTitle,
  onDurationChange,
}: CourseVideoPlayerProps) {
  const plyrRef = useRef<APITypes>(null);
  const hlsRef = useRef<any>(null);
  const [playerKey, setPlayerKey] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorDetails, setErrorDetails] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [reported, setReported] = useState(false);

  // Resolve Vimeo embed URL or YouTube embed URL with auto-detection of Vimeo IDs
  const embedUrl = useMemo(() => {
    // 1. Direct Vimeo embed
    if (src.includes("player.vimeo.com/video/")) {
      return src;
    }
    // 2. Vimeo standard URL or progressive redirect with numeric video ID
    const vimeoMatch = src.match(/(?:vimeo\.com\/(?:video\/)?|playback\/)(\d+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    // 3. YouTube embed or standard watch URL
    if (src.includes("youtube.com/watch?v=")) {
      const id = src.split("v=")[1]?.split("&")[0];
      return id ? `https://www.youtube.com/embed/${id}` : src;
    }
    if (src.includes("youtu.be/")) {
      const id = src.split("youtu.be/")[1]?.split("?")[0];
      return id ? `https://www.youtube.com/embed/${id}` : src;
    }
    if (src.includes("youtube.com/embed/")) {
      return src;
    }
    return null;
  }, [src]);

  const isEmbed = Boolean(embedUrl);
  const isHls = !isEmbed && (src.includes(".m3u8") || src.includes("/playlist/av/"));

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const plyrOptions: PlyrOptions = useMemo(
    () => ({
      controls: [
        "play-large",
        "play",
        "rewind",
        "fast-forward",
        "progress",
        "current-time",
        "duration",
        "mute",
        "volume",
        "settings",
        "pip",
        "airplay",
        "fullscreen",
      ],
      seekTime: 10,
      settings: ["captions", "quality", "speed"],
      quality: isHls
        ? {
            default: 720,
            options: [1080, 720, 540, 360],
            forced: true,
            onChange: (newQuality: number) => {
              if (hlsRef.current && Array.isArray(hlsRef.current.levels)) {
                hlsRef.current.levels.forEach((level: any, levelIndex: number) => {
                  if (level.height === newQuality) {
                    hlsRef.current.currentLevel = levelIndex;
                  }
                });
              }
            },
          }
        : {
            default: 720,
            options: [720],
            forced: true,
          },
      speed: {
        selected: 1,
        options: [0.5, 0.75, 1, 1.25, 1.5, 2],
      },
      keyboard: {
        focused: true,
        global: false,
      },
      tooltips: {
        controls: true,
        seek: true,
      },
      autoplay: true,
      i18n: isEn
        ? {
            restart: "Restart",
            rewind: "Rewind {seektime}s",
            play: "Play",
            pause: "Pause",
            fastForward: "Forward {seektime}s",
            seek: "Seek",
            seekLabel: "{currentTime} of {duration}",
            played: "Played",
            buffered: "Buffered",
            currentTime: "Current time",
            duration: "Duration",
            volume: "Volume",
            mute: "Mute",
            unmute: "Unmute",
            enableCaptions: "Enable captions",
            disableCaptions: "Disable captions",
            download: "Download",
            enterFullscreen: "Enter fullscreen",
            exitFullscreen: "Exit fullscreen",
            frameTitle: "Player for {title}",
            captions: "Captions",
            settings: "Settings",
            pip: "PIP",
            speed: "Speed",
            normal: "Normal",
            quality: "Quality",
            loop: "Loop",
            start: "Start",
            end: "End",
            all: "All",
            reset: "Reset",
            disabled: "Disabled",
            enabled: "Enabled",
            advertisement: "Ad",
            qualityBadge: {
              2160: "4K",
              1440: "HD",
              1080: "HD",
              720: "HD",
              576: "SD",
              480: "SD",
            },
          }
        : {
            restart: "Riavvia",
            rewind: "Riavvolgi {seektime}s",
            play: "Riproduci",
            pause: "Pausa",
            fastForward: "Avanza {seektime}s",
            seek: "Cerca",
            seekLabel: "{currentTime} di {duration}",
            played: "Riprodotto",
            buffered: "In memoria",
            currentTime: "Tempo corrente",
            duration: "Durata",
            volume: "Volume",
            mute: "Disattiva audio",
            unmute: "Attiva audio",
            enableCaptions: "Attiva sottotitoli",
            disableCaptions: "Disattiva sottotitoli",
            download: "Scarica",
            enterFullscreen: "Schermo intero",
            exitFullscreen: "Esci da schermo intero",
            frameTitle: "Player per {title}",
            captions: "Sottotitoli",
            settings: "Impostazioni",
            pip: "Picture-in-Picture",
            speed: "Velocità",
            normal: "Normale",
            quality: "Qualità",
            loop: "Ripeti",
            start: "Inizio",
            end: "Fine",
            all: "Tutto",
            reset: "Reimposta",
            disabled: "Disabilitato",
            enabled: "Abilitato",
            advertisement: "Pubblicità",
            qualityBadge: {
              2160: "4K",
              1440: "HD",
              1080: "HD",
              720: "HD",
              576: "SD",
              480: "SD",
            },
          },
    }),
    [isEn]
  );

  const plyrSource: PlyrSource = useMemo(
    () => ({
      type: "video",
      title: title,
      sources: [
        {
          src: src,
          type: isHls ? "application/x-mpegURL" : "video/mp4",
          size: 720,
        },
      ],
      poster: poster,
    }),
    [src, title, poster, isHls]
  );

  useEffect(() => {
    if (!isHls || !isMounted || loadError) return;

    let hlsInstance: any = null;
    let networkRetryCount = 0;

    const timer = setTimeout(() => {
      const plyr = plyrRef.current?.plyr;
      const media = (plyr as any)?.media as HTMLVideoElement | undefined;
      if (!media) return;

      if (media.canPlayType("application/vnd.apple.mpegurl")) {
        return;
      }

      const initHls = () => {
        const Hls = (window as any).Hls;
        if (Hls && Hls.isSupported()) {
          hlsInstance = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
          });
          hlsRef.current = hlsInstance;
          hlsInstance.loadSource(src);
          hlsInstance.attachMedia(media);

          hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
            const availableQualities = (hlsInstance.levels || [])
              .map((l: any) => l.height)
              .filter(Boolean);
            if (availableQualities.length > 0) {
              const plyr = plyrRef.current?.plyr;
              if (plyr) {
                (plyr as any).options.quality = availableQualities;
                if (typeof (plyr as any).setQualityMenu === "function") {
                  (plyr as any).setQualityMenu(availableQualities);
                }
              }
            }
          });

          hlsInstance.on(Hls.Events.ERROR, (_event: any, data: any) => {
            if (data.fatal) {
              console.error("[Plyr HLS] Fatal stream error:", data);
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  networkRetryCount++;
                  if (networkRetryCount <= 2) {
                    hlsInstance.startLoad();
                  } else {
                    hlsInstance.destroy();
                    hlsRef.current = null;
                    setLoadError(true);
                    setErrorMessage(
                      isEn
                        ? "Video stream unavailable. The link may have expired or the network is unreachable."
                        : "Streaming video non disponibile. Il collegamento potrebbe essere scaduto o la rete non è raggiungibile."
                    );
                    setErrorDetails(data.details || (data.response?.code ? `HTTP Status ${data.response.code}` : "HLS Network Stream Error"));
                  }
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  hlsInstance.recoverMediaError();
                  break;
                default:
                  hlsInstance.destroy();
                  hlsRef.current = null;
                  setLoadError(true);
                  setErrorMessage(
                    isEn
                      ? "Unable to stream adaptive video. The CDN token may have expired."
                      : "Impossibile riprodurre lo stream adattivo. Il token CDN potrebbe essere scaduto."
                  );
                  setErrorDetails(data.details || "HLS Fatal Error");
                  break;
              }
            }
          });
        }
      };

      if ((window as any).Hls) {
        initHls();
      } else {
        const scriptId = "hls-js-cdn-loader";
        let script = document.getElementById(scriptId) as HTMLScriptElement | null;
        if (!script) {
          script = document.createElement("script");
          script.id = scriptId;
          script.src = "https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js";
          script.async = true;
          document.head.appendChild(script);
        }
        script.addEventListener("load", initHls);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      if (hlsInstance) {
        hlsInstance.destroy();
      }
      hlsRef.current = null;
    };
  }, [src, isHls, isMounted, isEn, playerKey, loadError]);

  // General media error and playback stall detector
  useEffect(() => {
    if (!isMounted || loadError) return;

    let cleanupMediaListeners: (() => void) | null = null;
    let stallTimer: NodeJS.Timeout | null = null;

    const timer = setTimeout(() => {
      const plyr = plyrRef.current?.plyr;
      const media = (plyr as any)?.media as HTMLVideoElement | undefined;
      if (!media) return;

      let hasDecodedFrames = false;

      const onCanPlayOrPlaying = () => {
        hasDecodedFrames = true;
        if (stallTimer) clearTimeout(stallTimer);
      };

      const onNativeMediaError = () => {
        const err = media.error;
        console.error("[CourseVideoPlayer] Native video error:", err);
        setLoadError(true);
        setErrorMessage(
          isEn
            ? "Playback error: the video stream source could not be loaded."
            : "Errore di riproduzione: impossibile caricare la sorgente video."
        );
        setErrorDetails(
          err
            ? `MediaError Code ${err.code}: ${err.message || "Network / Source unreachable"}`
            : "MediaError (Source not supported or expired)"
        );
      };

      media.addEventListener("playing", onCanPlayOrPlaying);
      media.addEventListener("loadedmetadata", onCanPlayOrPlaying);
      media.addEventListener("canplay", onCanPlayOrPlaying);
      media.addEventListener("error", onNativeMediaError);

      // 8-second stall detector if media stays stuck on HAVE_NOTHING (readyState 0)
      stallTimer = setTimeout(() => {
        if (!hasDecodedFrames && media.readyState === 0 && !loadError) {
          console.warn("[CourseVideoPlayer] Playback stalled (no frames after 8s)");
          setLoadError(true);
          setErrorMessage(
            isEn
              ? "The video is taking too long to respond. The CDN link may be expired or blocked."
              : "Il video sta impiegando troppo tempo a caricarsi. Il link CDN potrebbe essere scaduto o bloccato."
          );
          setErrorDetails("Connection timeout (no buffered frames after 8s)");
        }
      }, 8000);

      cleanupMediaListeners = () => {
        media.removeEventListener("playing", onCanPlayOrPlaying);
        media.removeEventListener("loadedmetadata", onCanPlayOrPlaying);
        media.removeEventListener("canplay", onCanPlayOrPlaying);
        media.removeEventListener("error", onNativeMediaError);
        if (stallTimer) clearTimeout(stallTimer);
      };
    }, 300);

    return () => {
      clearTimeout(timer);
      if (stallTimer) clearTimeout(stallTimer);
      if (cleanupMediaListeners) cleanupMediaListeners();
    };
  }, [isMounted, playerKey, loadError, isEn]);

  useEffect(() => {
    if (!isMounted || !onDurationChange) return;

    let cleanupListeners: (() => void) | null = null;

    const timer = setTimeout(() => {
      const plyr = plyrRef.current?.plyr;
      const media = (plyr as any)?.media as HTMLVideoElement | undefined;
      if (!media) return;

      const reportDuration = () => {
        if (
          media.duration &&
          !isNaN(media.duration) &&
          isFinite(media.duration) &&
          media.duration > 0
        ) {
          const totalSec = Math.round(media.duration);
          const mins = Math.floor(totalSec / 60);
          const secs = totalSec % 60;
          const formatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
          onDurationChange(formatted, totalSec);
        }
      };

      if (media.duration && !isNaN(media.duration) && media.duration > 0) {
        reportDuration();
      }

      media.addEventListener("loadedmetadata", reportDuration);
      media.addEventListener("durationchange", reportDuration);

      cleanupListeners = () => {
        media.removeEventListener("loadedmetadata", reportDuration);
        media.removeEventListener("durationchange", reportDuration);
      };
    }, 250);

    return () => {
      clearTimeout(timer);
      if (cleanupListeners) cleanupListeners();
    };
  }, [isMounted, src, onDurationChange]);

  // Ensure control labels have .plyr__tooltip and single-rendition MP4s display genuine resolution
  useEffect(() => {
    if (!isMounted) return;

    const setupUI = () => {
      const plyr = plyrRef.current?.plyr;
      const container = (plyr as any)?.elements?.container as HTMLElement | undefined;
      if (!container) return;

      const srLabels = container.querySelectorAll(".plyr__controls [data-plyr] .plyr__sr-only");
      srLabels.forEach((label) => {
        label.classList.remove("plyr__sr-only");
        label.classList.add("plyr__tooltip");
      });

      // For single-rendition MP4 video, display the genuine 720p HD stream resolution
      if (!isHls && (plyr as any)?.elements?.settings) {
        const qualityBtn = (plyr as any).elements.settings.buttons?.quality as HTMLElement | undefined;
        if (qualityBtn) {
          qualityBtn.hidden = false;
          qualityBtn.removeAttribute("hidden");
          qualityBtn.style.display = "flex";
          const qualityVal = qualityBtn.querySelector(".plyr__menu__value");
          if (qualityVal) {
            qualityVal.textContent = "720p HD";
          }
        }

        const qualityPanel = (plyr as any).elements.settings.panels?.quality as HTMLElement | undefined;
        const list = qualityPanel?.querySelector('[role="menu"]');
        if (list && !list.querySelector('[role="menuitemradio"]')) {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "plyr__control";
          btn.setAttribute("role", "menuitemradio");
          btn.setAttribute("aria-checked", "true");
          btn.value = "720";
          btn.innerHTML = `<span>720p HD <span class="plyr__badge">${isEn ? "SOURCE" : "ORIGINALE"}</span></span>`;
          list.appendChild(btn);
        }
      }
    };

    const t1 = setTimeout(setupUI, 250);
    const t2 = setTimeout(setupUI, 800);
    const t3 = setTimeout(setupUI, 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isMounted, src, isHls, isEn]);

  // Dynamic video scrub frame thumbnail preview on seek bar hover
  useEffect(() => {
    if (!isMounted) return;

    let cleanupPreview: (() => void) | null = null;

    const timer = setTimeout(() => {
      const plyr = plyrRef.current?.plyr;
      const progressContainer = (plyr as any)?.elements?.progress as HTMLElement | undefined;
      if (!progressContainer) return;

      // Clean existing thumbnail if any
      const existing = progressContainer.querySelector(".plyr__preview-thumb");
      if (existing) existing.remove();

      const thumb = document.createElement("div");
      thumb.className = "plyr__preview-thumb";

      const imageContainer = document.createElement("div");
      imageContainer.className = "plyr__preview-thumb__image-container";

      const previewVideo = document.createElement("video");
      previewVideo.muted = true;
      previewVideo.playsInline = true;
      previewVideo.preload = "auto";
      previewVideo.style.width = "100%";
      previewVideo.style.height = "100%";
      previewVideo.style.objectFit = "cover";
      previewVideo.style.display = "block";

      let previewHls: any = null;
      if (isHls && (window as any).Hls && (window as any).Hls.isSupported()) {
        previewHls = new (window as any).Hls({
          enableWorker: true,
          lowLatencyMode: false,
        });
        previewHls.loadSource(src);
        previewHls.attachMedia(previewVideo);
      } else {
        previewVideo.src = src;
      }

      imageContainer.appendChild(previewVideo);

      const timeContainer = document.createElement("div");
      timeContainer.className = "plyr__preview-thumb__time-container";
      const timeSpan = document.createElement("span");
      timeSpan.textContent = "00:00";
      timeContainer.appendChild(timeSpan);
      imageContainer.appendChild(timeContainer);

      thumb.appendChild(imageContainer);
      progressContainer.appendChild(thumb);

      let isHovering = false;
      let lastSeekTime = -1;
      let seekTimeout: any = null;

      const onMouseMove = (e: MouseEvent) => {
        const rect = progressContainer.getBoundingClientRect();
        if (rect.width <= 0) return;

        const offsetX = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(100, (offsetX / rect.width) * 100));

        const media = (plyr as any)?.media as HTMLVideoElement | undefined;
        const duration = media?.duration && !isNaN(media.duration) ? media.duration : 0;
        if (duration <= 0) return;

        const time = (duration / 100) * percent;

        // Format timestamp (MM:SS)
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        timeSpan.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

        // Clamping to avoid overflowing container edges
        const thumbWidth = 160;
        const halfWidth = thumbWidth / 2;
        const clampedX = Math.max(halfWidth, Math.min(rect.width - halfWidth, offsetX));
        thumb.style.left = `${clampedX}px`;
        thumb.style.transform = "translateX(-50%)";

        const arrowOffset = offsetX - clampedX;
        thumb.style.setProperty("--preview-arrow-offset", `${arrowOffset}px`);

        if (!isHovering) {
          isHovering = true;
          thumb.classList.add("plyr__preview-thumb--is-shown");
        }

        // Throttle seeking for smooth performance
        if (Math.abs(time - lastSeekTime) >= 0.5) {
          lastSeekTime = time;
          if (seekTimeout) clearTimeout(seekTimeout);
          seekTimeout = setTimeout(() => {
            if (previewVideo.readyState >= 1 || previewVideo.duration > 0) {
              previewVideo.currentTime = time;
            }
          }, 35);
        }
      };

      const onMouseLeave = () => {
        isHovering = false;
        thumb.classList.remove("plyr__preview-thumb--is-shown");
        if (seekTimeout) clearTimeout(seekTimeout);
      };

      progressContainer.addEventListener("mousemove", onMouseMove);
      progressContainer.addEventListener("mouseleave", onMouseLeave);

      cleanupPreview = () => {
        progressContainer.removeEventListener("mousemove", onMouseMove);
        progressContainer.removeEventListener("mouseleave", onMouseLeave);
        if (seekTimeout) clearTimeout(seekTimeout);
        if (previewHls) previewHls.destroy();
        thumb.remove();
        previewVideo.src = "";
      };
    }, 400);

    return () => {
      clearTimeout(timer);
      if (cleanupPreview) cleanupPreview();
    };
  }, [isMounted, src, isHls]);

  const handleRetry = () => {
    setIsRetrying(true);
    setLoadError(false);
    setErrorMessage("");
    setErrorDetails("");
    setPlayerKey((k) => k + 1);
    setTimeout(() => {
      setIsRetrying(false);
    }, 400);
  };

  const handleReport = () => {
    setReported(true);
    toast.success(
      isEn
        ? "Issue reported to the tech team. Thank you!"
        : "Segnalazione inviata al team tecnico. Grazie!"
    );
  };

  if (loadError) {
    return (
      <div className={styles.videoErrorOverlay}>
        <div className={styles.errorIconCircle}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <span className={styles.errorBadge}>
          {isEn ? "Playback Notice" : "Avviso Riproduzione"}
        </span>
        <h3 className={styles.errorTitle}>
          {isEn ? "Video Stream Unavailable" : "Video Momentaneamente Non Disponibile"}
        </h3>
        <p className={styles.errorDescription}>
          {errorMessage || (isEn ? "Unable to load video stream. The link may have expired." : "Impossibile caricare il flusso video. Il collegamento potrebbe essere scaduto.")}
        </p>

        <div className={styles.errorActionsRow}>
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            className={styles.retryBtn}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: isRetrying ? "spin 1s linear infinite" : "none" }}>
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            {isEn ? (isRetrying ? "Retrying..." : "Retry Video") : (isRetrying ? "Riavvio..." : "Riprova Video")}
          </button>

          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.pdfFallbackBtn}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              {pdfTitle || (isEn ? "Study Guide (PDF)" : "Dispensa Didattica (PDF)")}
            </a>
          )}

          <button
            type="button"
            onClick={handleReport}
            disabled={reported}
            className={styles.reportBtn}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            {reported
              ? (isEn ? "Reported ✓" : "Segnalato ✓")
              : (isEn ? "Report Issue" : "Segnala Problema")}
          </button>
        </div>

        {errorDetails && (
          <div>
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className={styles.detailsToggle}
            >
              {showDetails
                ? (isEn ? "Hide technical details ▲" : "Nascondi dettagli tecnici ▲")
                : (isEn ? "Show technical details ▼" : "Mostra dettagli tecnici ▼")}
            </button>
            {showDetails && (
              <div className={styles.detailsBox}>
                <span>{errorDetails}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(`${errorDetails} | ${src}`);
                    toast.info(isEn ? "Diagnostic info copied" : "Informazioni diagnostiche copiate");
                  }}
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "none",
                    color: "#fff",
                    borderRadius: "3px",
                    padding: "2px 6px",
                    fontSize: "0.68rem",
                    cursor: "pointer",
                  }}
                >
                  {isEn ? "Copy" : "Copia"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (isEmbed && embedUrl) {
    const separator = embedUrl.includes("?") ? "&" : "?";
    const isVimeo = embedUrl.includes("player.vimeo.com/video");
    const params = isVimeo
      ? "autoplay=1&color=0066ff&title=0&byline=0&portrait=0&dnt=1"
      : "autoplay=1";
    const iframeSrc = `${embedUrl}${separator}${params}`;

    return (
      <iframe
        src={iframeSrc}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        className={styles.videoIframe}
      />
    );
  }

  if (!isMounted) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#050b11",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748b",
          fontSize: "0.9rem",
        }}
      >
        {isEn ? "Loading player..." : "Caricamento player..."}
      </div>
    );
  }

  return (
    <div key={playerKey} style={{ width: "100%", height: "100%" }}>
      <Plyr
        ref={plyrRef}
        source={plyrSource}
        options={plyrOptions}
      />
    </div>
  );
}
