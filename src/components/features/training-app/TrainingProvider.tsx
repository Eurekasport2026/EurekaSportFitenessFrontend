"use client";

import { createContext, useContext, useEffect, useReducer, useState, type Dispatch, type ReactNode } from "react";
import { initialTrainingState, restoreTrainingState, STORAGE_KEY, trainingReducer, type TrainingAction } from "@/lib/training/state";
import type { TrainingState } from "@/lib/training/types";

export interface TrainingProviderProps { children: ReactNode }
interface TrainingContextValue { state: TrainingState; dispatch: Dispatch<TrainingAction>; hydrated: boolean; persistent: boolean }
const TrainingContext = createContext<TrainingContextValue | null>(null);

export function TrainingProvider({ children }: TrainingProviderProps) {
  const [state, dispatch] = useReducer(trainingReducer, undefined, initialTrainingState);
  const [hydrated, setHydrated] = useState(false);
  const [persistent, setPersistent] = useState(true);
  useEffect(() => {
    try { dispatch({ type: "hydrate", state: restoreTrainingState(localStorage.getItem(STORAGE_KEY)) }); }
    catch { setPersistent(false); }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch { setPersistent(false); }
  }, [state, hydrated]);
  return <TrainingContext.Provider value={{ state, dispatch, hydrated, persistent }}>{children}</TrainingContext.Provider>;
}

export function useTraining() {
  const value = useContext(TrainingContext);
  if (!value) throw new Error("TrainingProvider is required");
  return value;
}
