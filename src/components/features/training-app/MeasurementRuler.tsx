"use client";

import { useId, useLayoutEffect, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useTranslations } from "next-intl";
import styles from "./training-app.module.css";

const TICK_WIDTH = 10;

interface MeasurementRulerProps {
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  label: string;
  onChange: (value: number) => void;
}

export function MeasurementRuler({ value, min, max, step, unit, label, onChange }: MeasurementRulerProps) {
  const t = useTranslations("TrainingApp");
  const hintId = useId();
  const scroller = useRef<HTMLDivElement>(null);
  const current = useRef({ value, onChange });
  const drag = useRef<{ id: number; x: number; left: number; touch: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  const ticks = Math.round((max - min) / step);
  const precision = step < 1 ? 1 : 0;
  const clampIndex = (index: number) => Math.max(0, Math.min(ticks, Math.round(index)));
  const indexFor = (measurement: number) => clampIndex((measurement - min) / step);

  useLayoutEffect(() => {
    current.current = { value, onChange };
    const element = scroller.current;
    const left = Math.max(0, Math.min(ticks, Math.round((value - min) / step))) * TICK_WIDTH;
    // Leave native touch momentum intact when the scroll event updates the value.
    if (element && Math.abs(element.scrollLeft - left) > TICK_WIDTH / 2) element.scrollLeft = left;
  }, [value, onChange, min, step, ticks]);

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!delta) return;
      event.preventDefault();
      const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientWidth : 1;
      element.scrollLeft += delta * scale;
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, []);

  function publish(index: number) {
    const next = Number((min + clampIndex(index) * step).toFixed(precision));
    if (next !== current.current.value) current.current.onChange(next);
  }

  function select(index: number) {
    const next = clampIndex(index);
    if (scroller.current) scroller.current.scrollLeft = next * TICK_WIDTH;
    publish(next);
  }

  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    const index = indexFor(current.current.value);
    const next = {
      ArrowLeft: index - 1, ArrowDown: index - 1,
      ArrowRight: index + 1, ArrowUp: index + 1,
      PageDown: index - 10, PageUp: index + 10,
      Home: 0, End: ticks,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(next);
  }

  function beginDrag(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    drag.current = { id: event.pointerId, x: event.clientX, left: event.currentTarget.scrollLeft, touch: event.pointerType === "touch" };
    if (event.pointerType !== "touch") {
      event.currentTarget.focus({ preventScroll: true });
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
    }
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (!start || start.id !== event.pointerId || start.touch) return;
    event.currentTarget.scrollLeft = start.left + start.x - event.clientX;
  }

  function endDrag(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const start = drag.current;
    if (!start || start.id !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (cancelled) return;
    if (Math.abs(event.clientX - start.x) <= 4 && Math.abs(event.currentTarget.scrollLeft - start.left) <= 4) {
      event.currentTarget.focus({ preventScroll: true });
      const bounds = event.currentTarget.getBoundingClientRect();
      select((event.currentTarget.scrollLeft + event.clientX - bounds.left - event.currentTarget.clientWidth / 2) / TICK_WIDTH);
    } else if (!start.touch) select(event.currentTarget.scrollLeft / TICK_WIDTH);
  }

  return <>
    <div className={styles.ruler}>
      <div ref={scroller} className={styles.rulerScroller} data-dragging={dragging || undefined} role="slider" tabIndex={0}
        aria-label={t("measurements.adjust", { label })} aria-describedby={hintId} aria-orientation="horizontal"
        aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} aria-valuetext={`${value} ${unit}`.trim()}
        onScroll={event => publish(event.currentTarget.scrollLeft / TICK_WIDTH)} onKeyDown={keyboard}
        onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={event => endDrag(event)}
        onPointerCancel={event => endDrag(event, true)} onLostPointerCapture={event => endDrag(event, true)}>
        <div className={styles.rulerTicks} style={{ width: `${ticks * TICK_WIDTH + 1}px` }} aria-hidden="true" />
      </div>
    </div>
    <p id={hintId} className={styles.rulerHint}>{t("measurements.hint")}</p>
  </>;
}
