/**
 * Types for the deterministic plan-generation engine. These mirror the DB
 * `goal_type` / `workout_type` enums (src/lib/supabase/types.ts) but stay
 * dependency-free so the engine remains pure and easily unit-tested. The
 * persistence layer (Step 8) maps these to DB insert rows.
 */

export type GoalType = "5k" | "10k" | "half" | "full";

export type WorkoutType = "easy" | "tempo" | "interval" | "long" | "rest";

export type FitnessLevel = "beginner" | "intermediate" | "advanced";

export type Phase = "base" | "build" | "peak" | "taper";

export interface PlanInput {
  goalType: GoalType;
  /** Race day, ISO date (YYYY-MM-DD). */
  goalDate: string;
  /** Reference date the plan is generated from, ISO date (YYYY-MM-DD). */
  fromDate: string;
  /** Training days per week (1–7). */
  daysPerWeek: number;
  /** Current fitness — influences starting volume. */
  fitness: FitnessLevel;
}

export interface GeneratedWorkout {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  /** Day of week, Monday=0 … Sunday=6. */
  dayOfWeek: number;
  type: WorkoutType;
  /** Planned distance in meters (0 for rest). */
  distanceM: number;
  description: string;
}

export interface GeneratedWeek {
  /** 1-based week index. */
  weekNumber: number;
  /** Monday of this week, ISO date (YYYY-MM-DD). */
  startDate: string;
  phase: Phase;
  isRecovery: boolean;
  /** Sum of workout distances for the week, in meters. */
  totalDistanceM: number;
  workouts: GeneratedWorkout[];
}

export interface GeneratedPlan {
  goalType: GoalType;
  goalDate: string;
  daysPerWeek: number;
  totalWeeks: number;
  weeks: GeneratedWeek[];
}
