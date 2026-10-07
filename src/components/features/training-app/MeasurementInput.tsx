"use client";

import { useEffect, useState } from "react";
import { canonicalMeasurement, displayMeasurement, measurementLimits } from "@/lib/training/state";
import { MeasurementRuler } from "./MeasurementRuler";
import styles from "./training-app.module.css";

export interface MeasurementInputProps {
  field: "heightCm" | "weightKg" | "age";
  value: number;
  imperial: boolean;
  label: string;
  onChange: (value: number) => void;
  large?: boolean;
}
export function MeasurementInput({ field, value, imperial, label, onChange, large }: MeasurementInputProps) {
  const [text, setText] = useState(String(displayMeasurement(value, field, imperial)));
  useEffect(() => { setText(String(displayMeasurement(value, field, imperial))); }, [value, field, imperial]);
  const limits = measurementLimits(field, imperial);
  return <div className={large ? styles.measurement : styles.profileField}>
    <label htmlFor={`training-${field}`}>{label}</label>
    <div className={styles.measurementControl}><input id={`training-${field}`} name={field} type="number" inputMode={field === "age" ? "numeric" : "decimal"} required min={limits.min} max={limits.max} step={limits.step} value={text} onChange={event => {
      const raw = event.target.value;
      setText(raw);
      const numeric = Number(raw);
      if (raw && Number.isFinite(numeric) && event.target.validity.valid) onChange(canonicalMeasurement(numeric, field, imperial));
    }} /><span>{limits.unit}</span></div>
    {large && <MeasurementRuler key={`${field}-${imperial}`} value={displayMeasurement(value, field, imperial)} {...limits} label={label} onChange={next => {
      setText(String(next));
      onChange(canonicalMeasurement(next, field, imperial));
    }} />}
  </div>;
}
