import type { ActivePlan } from "@/lib/plan/persistence";
import type { Tables } from "@/lib/supabase/types";
import { adaptPlan } from "@/lib/plan/adaptPlan";
import { addDays, dayOfWeekMon0 } from "@/lib/plan/dates";
import type {
  GeneratedPlan,
  GeneratedWeek,
  Phase,
  WorkoutType,
} from "@/lib/plan/types";
import type { CoachInput } from "./coach";

const GOAL_LABEL: Record<string, string> = {
  "5k": "5K",
  "10k": "10K",
  half: "Half marathon",
  full: "Marathon",
};

type ActivityRow = Pick<
  Tables<"activities">,
  "start_date" | "distance_m" | "average_pace_s_per_km"
>;

/** Rebuild the engine's GeneratedPlan from persisted rows so we can reuse adaptPlan. */
function reconstructPlan(ap: ActivePlan): GeneratedPlan {
  const byWeek = new Map<string, Tables<"workouts">[]>();
  for (const wo of ap.workouts) {
    const list = byWeek.get(wo.week_id) ?? [];
    list.push(wo);
    byWeek.set(wo.week_id, list);
  }
  const weeks: GeneratedWeek[] = ap.weeks.map((w) => ({
    weekNumber: w.week_number,
    startDate: w.start_date,
    phase: (w.focus ?? "base") as Phase,
    isRecovery: w.week_number % 4 === 0 && w.focus !== "taper",
    totalDistanceM: w.planned_distance_m ?? 0,
    workouts: (byWeek.get(w.id) ?? [])
      .slice()
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .map((wo) => ({
        date: wo.date,
        dayOfWeek: dayOfWeekMon0(wo.date),
        type: wo.type as WorkoutType,
        distanceM: wo.planned_distance_m ?? 0,
        description: wo.description ?? "",
      })),
  }));
  return {
    goalType: ap.plan.goal_type,
    goalDate: ap.plan.goal_date,
    daysPerWeek: ap.plan.days_per_week,
    totalWeeks: weeks.length,
    weeks,
  };
}

function paceLabel(sPerKm: number): string {
  return `${Math.floor(sPerKm / 60)}:${String(Math.round(sPerKm % 60)).padStart(2, "0")}/km`;
}

/** Assemble the facts the coach narrates from the active plan + synced runs. */
export function buildCoachInput(
  activePlan: ActivePlan,
  activities: ActivityRow[],
): CoachInput {
  const plan = reconstructPlan(activePlan);
  const today = new Date().toISOString().slice(0, 10);

  // Current week = the week containing today, else the next upcoming, else the last.
  const current =
    plan.weeks.find(
      (w) => w.startDate <= today && today <= addDays(w.startDate, 6),
    ) ??
    plan.weeks.find((w) => w.startDate > today) ??
    plan.weeks[plan.weeks.length - 1];

  const longRunKm =
    (current.workouts.find((w) => w.type === "long")?.distanceM ?? 0) / 1000;
  const workouts = current.workouts
    .filter((w) => w.type !== "rest")
    .map((w) => ({ type: w.type, distanceKm: w.distanceM / 1000 }));

  // Recent-run summary from synced activities.
  const withPace = activities.filter((a) => a.average_pace_s_per_km != null);
  const avgPaceS = withPace.length
    ? withPace.reduce((s, a) => s + (a.average_pace_s_per_km as number), 0) /
      withPace.length
    : null;
  const recent =
    activities.length > 0
      ? {
          runs: activities.length,
          totalKm:
            activities.reduce((s, a) => s + (a.distance_m ?? 0), 0) / 1000,
          avgPaceLabel: avgPaceS != null ? paceLabel(avgPaceS) : null,
        }
      : null;

  // Adaptation: evaluate the most recent fully-completed week that has real runs.
  let adaptation: CoachInput["adaptation"] = null;
  const completed = [...plan.weeks]
    .reverse()
    .find((w) => addDays(w.startDate, 6) < today);
  if (completed) {
    const result = adaptPlan({
      plan,
      activities: activities.map((a) => ({
        startDate: a.start_date,
        distanceM: a.distance_m ?? 0,
      })),
      evaluatedWeekNumber: completed.weekNumber,
    });
    if (result.metrics.completedRuns > 0) {
      adaptation = {
        volumeRatioPct: Math.round(result.metrics.volumeRatio * 100),
        type: result.adjustment.type,
        reason: result.adjustment.reason,
      };
    }
  }

  return {
    goalLabel: GOAL_LABEL[plan.goalType] ?? plan.goalType,
    weekNumber: current.weekNumber,
    totalWeeks: plan.totalWeeks,
    phase: current.phase,
    isRecovery: current.isRecovery,
    weekTotalKm: current.totalDistanceM / 1000,
    longRunKm,
    workouts,
    recent,
    adaptation,
  };
}
