"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type KeyboardEvent, type TouchEvent } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import type { TrainingGoal } from "@/lib/training/types";
import { useTraining } from "./TrainingProvider";
import { TrainingHeader, TrainingLoading } from "./TrainingShell";
import { TrainingIcon } from "./TrainingIcon";
import { cn } from "@/lib/utils";
import styles from "./training-app.module.css";

const slides = [
  { image: "/images/eureka-training-hero.webp", copy: "welcome", position: "66% center" },
  { image: "/images/eureka-personal-trainer-hero.webp", copy: "welcome.slides.guidance", position: "70% center" },
  { image: "/images/eureka-functional-training.webp", copy: "welcome.slides.consistency", position: "50% 25%" },
] as const;
const SLIDE_DURATION_MS = 5000;

export interface WelcomeProps { initialGoal?: TrainingGoal }
export function Welcome({ initialGoal }: WelcomeProps) {
  const t = useTranslations("TrainingApp");
  const { state, dispatch, hydrated } = useTraining();
  const router = useRouter();
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [pageVisible, setPageVisible] = useState(false);
  const [controlsHovered, setControlsHovered] = useState(false);
  const [touching, setTouching] = useState(false);
  const indicators = useRef<(HTMLButtonElement | null)[]>([]);
  const playbackControl = useRef<HTMLButtonElement | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateVisibility = () => setPageVisible(!document.hidden);
    const updateMotion = () => { if (motion.matches) setIsPlaying(false); };
    setIsPlaying(!motion.matches);
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    motion.addEventListener("change", updateMotion);
    return () => {
      document.removeEventListener("visibilitychange", updateVisibility);
      motion.removeEventListener("change", updateMotion);
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !isPlaying || !pageVisible || controlsHovered || touching) return;
    const timer = window.setTimeout(() => setActiveSlide(current => (current + 1) % slides.length), SLIDE_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [activeSlide, hydrated, isPlaying, pageVisible, controlsHovered, touching]);

  function navigateIndicator(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    if (event.key === "ArrowRight") next = (index + 1) % slides.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + slides.length) % slides.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = slides.length - 1;
    else return;
    event.preventDefault();
    setActiveSlide(next);
    indicators.current[next]?.focus();
  }
  function beginSwipe(event: TouchEvent<HTMLDivElement>) {
    touchStart.current = null;
    setTouching(true);
    if (event.touches.length !== 1 || (event.target as Element).closest("a, button, input, select")) return;
    touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }
  function endSwipe(event: TouchEvent<HTMLDivElement>) {
    const origin = touchStart.current;
    touchStart.current = null;
    setTouching(false);
    const end = event.changedTouches[0];
    if (!origin || !end) return;
    const distance = end.clientX - origin.x;
    if (Math.abs(distance) < 50 || Math.abs(distance) <= Math.abs(end.clientY - origin.y)) return;
    setActiveSlide(current => (current + (distance < 0 ? 1 : -1) + slides.length) % slides.length);
  }

  if (!hydrated) return <TrainingLoading />;
  const resumeWorkout = state.complete && !initialGoal;
  function start() {
    if (resumeWorkout) { router.push("/training/app/workout"); return; }
    if (initialGoal) {
      dispatch({ type: "restart" });
      dispatch({ type: "profile", patch: { goal: initialGoal } });
    }
    router.push("/training/app/onboarding");
  }
  return <div className={styles.welcome} role="region" aria-roledescription={t("welcome.carousel")} aria-label={t("welcome.carouselLabel")} onFocusCapture={event => { if (!playbackControl.current?.contains(event.target)) setIsPlaying(false); }} onTouchStart={beginSwipe} onTouchEnd={endSwipe} onTouchCancel={() => { touchStart.current = null; setTouching(false); }}>
    <div id="training-welcome-photo" className={styles.welcomePhoto}>{slides.map((item, index) => <Image key={item.image} src={item.image} alt={t(`${item.copy}.imageAlt`)} aria-hidden={index !== activeSlide} fill unoptimized preload={index === 0} loading={index === 0 ? undefined : "eager"} sizes="(min-width: 900px) 65vw, 100vw" className={cn(styles.welcomeSlideImage, index === activeSlide && styles.welcomeSlideActive)} style={{ objectPosition: item.position }} />)}</div>
    <TrainingHeader />
    <main id="training-main" className={styles.welcomeContent}>
      <span className={styles.eyebrow}>{t("welcome.eyebrow")}</span>
      <div id="training-welcome-slide" className={styles.welcomeSlideText} aria-live={isPlaying ? "off" : "polite"} aria-atomic="true">
        <span className={styles.srOnly}>{t("welcome.slideCount", { current: activeSlide + 1, total: slides.length })}</span>
        {slides.map((item, index) => <div key={item.image} className={cn(styles.welcomeSlideCopy, index === activeSlide && styles.welcomeSlideCopyActive)} aria-hidden={index !== activeSlide}>
          <h1>{t(`${item.copy}.title`)}<br /><em>{t(`${item.copy}.titleAccent`)}</em></h1>
          <p>{t(`${item.copy}.description`)}</p>
        </div>)}
      </div>
      <div className={styles.welcomeFacts}><span><TrainingIcon name="clock" />{t("welcome.time")}</span><span><TrainingIcon name="dumbbell" />{t("welcome.personal")}</span></div>
      {initialGoal && <p className={styles.goalHint}>{t("welcome.selectedGoal")}: <strong>{t(`goals.${initialGoal}`)}</strong></p>}
      <div className={styles.introControls} onPointerEnter={event => { if (event.pointerType !== "touch") setControlsHovered(true); }} onPointerLeave={() => setControlsHovered(false)} onPointerCancel={() => setControlsHovered(false)}>
        <button ref={playbackControl} type="button" className={styles.carouselToggle} aria-label={t(isPlaying ? "welcome.pauseSlides" : "welcome.playSlides")} title={t(isPlaying ? "welcome.pauseSlides" : "welcome.playSlides")} aria-controls="training-welcome-slide training-welcome-photo" onClick={() => setIsPlaying(current => !current)}><TrainingIcon name={isPlaying ? "pause" : "play"} /></button>
        <div className={styles.introProgress} role="group" aria-label={t("welcome.slideNavigation")}>{slides.map((item, index) => <button key={item.image} type="button" ref={element => { indicators.current[index] = element; }} aria-label={t("welcome.showSlide", { current: index + 1, title: `${t(`${item.copy}.title`)} ${t(`${item.copy}.titleAccent`)}` })} aria-pressed={index === activeSlide} aria-controls="training-welcome-slide training-welcome-photo" onClick={() => setActiveSlide(index)} onKeyDown={event => navigateIndicator(event, index)} />)}</div>
      </div>
      <button type="button" className={styles.primaryButton} onClick={start}>{resumeWorkout ? t("welcome.openWorkout") : state.step > 0 && !initialGoal ? t("welcome.resume") : t("welcome.start")}<TrainingIcon name="arrow" /></button>
      {state.complete && <button type="button" className={styles.textButton} onClick={() => { dispatch({ type: "restart" }); router.push("/training/app/onboarding"); }}>{t("welcome.startOver")}</button>}
      <Link href="/" className={styles.backToSite}>{t("backToSite")}</Link>
    </main>
  </div>;
}
