/**
 * Deterministic demo-data builder. Given a reference `today`, it produces a
 * mid-stream training plan (several weeks already behind us) plus aligned
 * "actual" runs for the completed weeks — with the most-recent completed week
 * deliberately under-target so the adaptive engine (adaptPlan) classifies it as
 * `scale_down` and the AI coach has a real adaptation to narrate.
 *
 * Pure: no DB, no env, no `Date.now()`. The seed route supplies `today` and the
 * user id, then persists the result. A unit test pins the shape.
 */
import { addDays, dayOfWeekMon0 } from "@/lib/plan/dates";
import { generatePlan } from "@/lib/plan/generatePlan";
import type { GeneratedWeek, PlanInput } from "@/lib/plan/types";

/** A synthetic activity, ready for the route to stamp with `user_id`. */
export interface SeededActivity {
  strava_activity_id: number;
  name: string;
  sport_type: string;
  start_date: string;
  distance_m: number;
  moving_time_s: number;
  elapsed_time_s: number;
  average_pace_s_per_km: number;
}

export interface DemoSeed {
  planInput: PlanInput;
  activities: SeededActivity[];
}

/** Move a date forward to the Sunday of its week (Mon=0 … Sun=6). */
function snapToSunday(iso: string): string {
  return addDays(iso, 6 - dayOfWeekMon0(iso));
}

/** Base pace (s/km) with a small, deterministic per-run wobble. */
function paceFor(index: number): number {
  return 330 + ((index * 7) % 25) - 12; // ~318–342 s/km (≈5:18–5:42 /km)
}

/**
 * Build the demo plan + aligned activities relative to `today` (ISO date).
 *
 * The goal is set ~3 weeks out so the engine clamps a half-marathon plan to its
 * 8-week minimum, placing the start ~5 weeks in the past → several completed
 * weeks, a current week, and a taper still ahead.
 */
export function buildDemoSeed(today: string): DemoSeed {
  const planInput: PlanInput = {
    goalType: "half",
    goalDate: snapToSunday(addDays(today, 21)),
    fromDate: addDays(today, -35),
    daysPerWeek: 4,
    fitness: "intermediate",
  };

  const plan = generatePlan(planInput);

  // Completed weeks = fully in the past (their Sunday is before today).
  const completed = plan.weeks.filter((w) => addDays(w.startDate, 6) < today);

  const activities: SeededActivity[] = [];
  let counter = 0;
  completed.forEach((week, i) => {
    // Athlete nailed the early weeks (~100% of plan) but fell short in the most
    // recent one (~60%) — e.g. travel/illness — which drives the scale_down.
    const isLastCompleted = i === completed.length - 1;
    const ratio = isLastCompleted ? 0.6 : 1.0;
    activities.push(...runsForWeek(week, ratio, () => counter++));
  });

  return { planInput, activities };
}

/** One synthetic run per non-rest workout in the week, scaled by `ratio`. */
function runsForWeek(
  week: GeneratedWeek,
  ratio: number,
  nextIndex: () => number,
): SeededActivity[] {
  const NAMES = ["Morning Run", "Lunch Run", "Evening Run", "Weekend Long Run"];
  return week.workouts
    .filter((w) => w.type !== "rest" && w.distanceM > 0)
    .map((w) => {
      const idx = nextIndex();
      const distance_m = Math.round(w.distanceM * ratio);
      const pace = paceFor(idx);
      const moving_time_s = Math.round((distance_m / 1000) * pace);
      return {
        strava_activity_id: 9_000_000_000 + idx,
        name: w.type === "long" ? "Weekend Long Run" : NAMES[idx % NAMES.length],
        sport_type: "Run",
        start_date: `${w.date}T07:30:00Z`,
        distance_m,
        moving_time_s,
        elapsed_time_s: moving_time_s,
        average_pace_s_per_km: pace,
      };
    });
}
