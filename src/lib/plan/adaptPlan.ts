import type {
  AdaptInput,
  AdaptationResult,
  Adjustment,
  WeekMetrics,
} from "./adaptTypes";
import { diffDays } from "./dates";
import type { GeneratedWeek } from "./types";

const SCALE_DOWN_BELOW = 0.7;
const SCALE_UP_ABOVE = 1.15;
const SCALE_DOWN_FACTOR = 0.85;
const SCALE_UP_FACTOR = 1.1;

/** True if an activity's date falls within the week's Monday–Sunday range. */
function isInWeek(week: GeneratedWeek, activityStart: string): boolean {
  const offset = diffDays(activityStart.slice(0, 10), week.startDate);
  return offset >= 0 && offset <= 6;
}

function classify(volumeRatio: number): Adjustment {
  if (volumeRatio < SCALE_DOWN_BELOW) {
    return {
      type: "scale_down",
      factor: SCALE_DOWN_FACTOR,
      reason:
        "Completed less volume than planned — easing upcoming weeks to recover.",
    };
  }
  if (volumeRatio > SCALE_UP_ABOVE) {
    return {
      type: "scale_up",
      factor: SCALE_UP_FACTOR,
      reason: "Ran more than planned — nudging upcoming weeks up.",
    };
  }
  return {
    type: "hold",
    factor: 1,
    reason: "On track with the plan — keeping upcoming weeks as scheduled.",
  };
}

export function adaptPlan(input: AdaptInput): AdaptationResult {
  const { plan, activities, evaluatedWeekNumber } = input;
  const week = plan.weeks[evaluatedWeekNumber - 1];

  // 1. Match actuals to the evaluated week.
  const matched = activities.filter((a) => isInWeek(week, a.startDate));
  const completedRuns = matched.length;
  const actualDistanceM = matched.reduce((sum, a) => sum + a.distanceM, 0);

  const plannedRuns = plan.daysPerWeek;
  const plannedDistanceM = week.totalDistanceM;
  const volumeRatio =
    plannedDistanceM > 0 ? actualDistanceM / plannedDistanceM : 0;
  const completionRate = plannedRuns > 0 ? completedRuns / plannedRuns : 0;

  const metrics: WeekMetrics = {
    weekNumber: evaluatedWeekNumber,
    completedRuns,
    plannedRuns,
    completionRate,
    actualDistanceM,
    plannedDistanceM,
    volumeRatio,
  };

  // 2. Classify and 3. apply the factor to upcoming weeks (past weeks untouched).
  const adjustment = classify(volumeRatio);
  const { factor } = adjustment;

  const adaptedWeeks =
    factor === 1
      ? plan.weeks
      : plan.weeks.map((w) => {
          if (w.weekNumber <= evaluatedWeekNumber) return w;
          const workouts = w.workouts.map((wo) => ({
            ...wo,
            distanceM: Math.round(wo.distanceM * factor),
          }));
          const totalDistanceM = workouts.reduce((s, x) => s + x.distanceM, 0);
          return { ...w, workouts, totalDistanceM };
        });

  return {
    evaluatedWeekNumber,
    metrics,
    adjustment,
    adaptedPlan: { ...plan, weeks: adaptedWeeks },
  };
}
