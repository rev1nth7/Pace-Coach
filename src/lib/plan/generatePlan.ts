import type { GeneratedPlan, PlanInput } from "./types";

/**
 * Generate a deterministic multi-week training plan from the given input.
 *
 * STUB — to be implemented in Step 5.4 via the Ralph Loop until the test suite
 * in `generatePlan.test.ts` passes. Returns an empty (invalid) plan for now so
 * the tests compile and fail on assertions rather than on missing symbols.
 */
export function generatePlan(input: PlanInput): GeneratedPlan {
  return {
    goalType: input.goalType,
    goalDate: input.goalDate,
    daysPerWeek: input.daysPerWeek,
    totalWeeks: 0,
    weeks: [],
  };
}
