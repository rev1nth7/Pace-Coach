import type { GeneratedPlan } from "./types";

/** Minimal actual-run shape (subset of the DB `activities` row). */
export interface ActivityInput {
  /** ISO date or datetime; only the date portion is used for week matching. */
  startDate: string;
  /** Distance in meters. */
  distanceM: number;
}

export interface AdaptInput {
  plan: GeneratedPlan;
  activities: ActivityInput[];
  /** 1-based week number of the completed week being evaluated. */
  evaluatedWeekNumber: number;
}

export interface WeekMetrics {
  weekNumber: number;
  completedRuns: number;
  plannedRuns: number;
  completionRate: number;
  actualDistanceM: number;
  plannedDistanceM: number;
  volumeRatio: number;
}

export type AdjustmentType = "scale_down" | "hold" | "scale_up";

export interface Adjustment {
  type: AdjustmentType;
  factor: number;
  reason: string;
}

export interface AdaptationResult {
  evaluatedWeekNumber: number;
  metrics: WeekMetrics;
  adjustment: Adjustment;
  /** Plan with upcoming weeks (> evaluated) scaled; past weeks unchanged. */
  adaptedPlan: GeneratedPlan;
}
