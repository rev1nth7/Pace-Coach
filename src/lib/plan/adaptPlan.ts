import type { AdaptInput, AdaptationResult } from "./adaptTypes";

/**
 * Evaluate a completed week (actual activities vs the planned week) and
 * recompute upcoming weeks accordingly, preserving history.
 *
 * STUB — implemented in Step 6.4 via the Ralph Loop until `adaptPlan.test.ts`
 * passes. Returns a hold/no-op result so tests compile and fail on assertions.
 */
export function adaptPlan(input: AdaptInput): AdaptationResult {
  return {
    evaluatedWeekNumber: input.evaluatedWeekNumber,
    metrics: {
      weekNumber: input.evaluatedWeekNumber,
      completedRuns: 0,
      plannedRuns: 0,
      completionRate: 0,
      actualDistanceM: 0,
      plannedDistanceM: 0,
      volumeRatio: 0,
    },
    adjustment: { type: "hold", factor: 1, reason: "" },
    adaptedPlan: input.plan,
  };
}
