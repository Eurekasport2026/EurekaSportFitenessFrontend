import type { CSSProperties } from "react";

export interface TrainingIconProps { name: "back" | "arrow" | "check" | "close" | "dumbbell" | "book" | "chart" | "settings" | "user" | "bell" | "clock" | "crown" | "camera" | "edit" | "search" | "volume" | "ruler" | "help" | "chevron" | "calendar" | "share" | "play" | "pause"; className?: string; style?: CSSProperties }
const paths: Record<TrainingIconProps["name"], string> = {
  back: "m14 5-7 7 7 7", arrow: "M4 12h16m-6-6 6 6-6 6", check: "m5 12 4 4L19 6", close: "m6 6 12 12M6 18 18 6",
  play: "m8 5 11 7-11 7z", pause: "M8 5v14M16 5v14",
  dumbbell: "M6 8v8m-3-6v4m15-6v8m3-6v4M6 12h12M3 12h3m12 0h3",
  book: "M4 4h7v16H4zM11 4h9v16h-9M7 8h1m7 0h2m-2 4h2", chart: "M4 20V10m7 10V4m7 16v-7M2 20h20",
  settings: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z",
  user: "M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M4 21v-3a8 8 0 0 1 16 0v3",
  bell: "M5 17h14l-2-3V9a5 5 0 0 0-10 0v5zM10 21h4M12 2v2", clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v5l3 2",
  crown: "m3 6 4 4 5-7 5 7 4-4-2 12H5zM5 21h14", camera: "M3 6h5l2-3h4l2 3h5v14H3zM12 9a4 4 0 1 0 0 8 4 4 0 0 0 0-8",
  edit: "m14 4 6 6M4 20l2-7L17 2l5 5-11 11z", search: "M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14m5 12 6 6",
  volume: "M3 9h4l5-5v16l-5-5H3zM16 7a7 7 0 0 1 0 10m3-13a11 11 0 0 1 0 16",
  ruler: "m3 16 13-13 5 5L8 21zM8 11l2 2m2-6 2 2m2 2 2 2m-6 2 2 2", help: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3h.01",
  chevron: "m9 5 7 7-7 7", calendar: "M4 5h16v16H4zM8 2v6m8-6v6M4 11h16", share: "M18 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6M5 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6m13 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6M8 11l7-5M8 13l7 5",
};
export function TrainingIcon({ name, className, style }: TrainingIconProps) {
  return <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} style={style}><path d={paths[name]} /></svg>;
}
