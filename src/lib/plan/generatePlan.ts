import { addDays, dayOfWeekMon0, diffDays } from "./dates";
import type {
  FitnessLevel,
  GeneratedPlan,
  GeneratedWeek,
  GeneratedWorkout,
  GoalType,
  Phase,
  PlanInput,
  WorkoutType,
} from "./types";

const GOAL_DISTANCE_M: Record<GoalType, number> = {
  "5k": 5000,
  "10k": 10000,
  half: 21097,
  full: 42195,
};

/** [min, max] plan length in weeks per goal. */
const WEEK_RANGE: Record<GoalType, [number, number]> = {
  "5k": [4, 12],
  "10k": [6, 14],
  half: [8, 16],
  full: [12, 20],
};

/** Peak long-run distance as a fraction of goal distance. */
const LONG_CAP: Record<GoalType, number> = {
  "5k": 1.4,
  "10k": 1.2,
  half: 0.9,
  full: 0.75,
};

const FITNESS_FACTOR: Record<FitnessLevel, number> = {
  beginner: 0.85,
  intermediate: 1.0,
  advanced: 1.15,
};

const START_LONG_FRACTION = 0.4;

/**
 * Run days in priority order (Monday=0 … Sunday=6) with their workout type.
 * Sunday long run first, then quality, then easy fillers; Monday is filled last
 * so it stays a rest day for any plan with <= 6 running days.
 */
const RUN_SLOTS: { day: number; type: WorkoutType }[] = [
  { day: 6, type: "long" },
  { day: 2, type: "tempo" },
  { day: 4, type: "easy" },
  { day: 1, type: "interval" },
  { day: 5, type: "easy" },
  { day: 3, type: "easy" },
  { day: 0, type: "easy" },
];

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(Math.max(n, lo), hi);

function distanceForType(type: WorkoutType, longM: number): number {
  switch (type) {
    case "long":
      return Math.round(longM);
    case "tempo":
      return Math.round(longM * 0.6);
    case "interval":
      return Math.round(longM * 0.5);
    case "easy":
      return Math.round(longM * 0.5);
    case "rest":
      return 0;
  }
}

const DESCRIPTIONS: Record<WorkoutType, string> = {
  long: "Long run — steady aerobic effort",
  tempo: "Tempo run — comfortably hard",
  interval: "Intervals — repeats at faster pace",
  easy: "Easy run — conversational pace",
  rest: "Rest day",
};

export function generatePlan(input: PlanInput): GeneratedPlan {
  const { goalType, goalDate, fromDate, daysPerWeek, fitness } = input;

  // 1. Plan length: whole weeks to the goal, clamped per goal type.
  const [minWeeks, maxWeeks] = WEEK_RANGE[goalType];
  const weeksUntil = Math.floor(diffDays(goalDate, fromDate) / 7);
  const totalWeeks = clamp(weeksUntil, minWeeks, maxWeeks);

  // 2. Phase boundaries (base -> build -> peak -> taper).
  const taperWeeks = Math.max(1, Math.round(totalWeeks * 0.15));
  const baseEnd = Math.max(1, Math.round(totalWeeks * 0.3));
  const peakWeeks = Math.max(1, Math.round(totalWeeks * 0.2));
  const taperStart = totalWeeks - taperWeeks + 1;
  const peakStart = taperStart - peakWeeks;

  const phaseFor = (wk: number): Phase => {
    if (wk >= taperStart) return "taper";
    if (wk <= baseEnd) return "base";
    if (wk >= peakStart) return "peak";
    return "build";
  };

  // 3. Long-run progression, anchored to goal distance + fitness.
  const fitnessFactor = FITNESS_FACTOR[fitness];
  const goalDistance = GOAL_DISTANCE_M[goalType];
  const startLongM = goalDistance * START_LONG_FRACTION * fitnessFactor;
  const peakLongM = goalDistance * LONG_CAP[goalType] * fitnessFactor;
  const peakWeekNum = Math.max(1, taperStart - 1);

  const longRunM = (wk: number, phase: Phase, isRecovery: boolean): number => {
    let base: number;
    if (phase === "taper") {
      // Ease down across the taper, always below the peak.
      const t = taperWeeks > 1 ? (wk - taperStart) / (taperWeeks - 1) : 0;
      base = peakLongM * (0.7 - 0.3 * t);
    } else {
      const denom = Math.max(1, peakWeekNum - 1);
      const t = clamp((wk - 1) / denom, 0, 1);
      base = startLongM + (peakLongM - startLongM) * t;
    }
    if (isRecovery) base *= 0.7;
    return base;
  };

  // 4. Calendar: Monday-aligned weeks counting back from the goal's week.
  const goalMonday = addDays(goalDate, -dayOfWeekMon0(goalDate));

  const runDays = RUN_SLOTS.slice(0, daysPerWeek);
  const typeByDay = new Map<number, WorkoutType>(
    runDays.map((s) => [s.day, s.type]),
  );

  const weeks: GeneratedWeek[] = [];
  for (let weekNumber = 1; weekNumber <= totalWeeks; weekNumber++) {
    const startDate = addDays(goalMonday, -(totalWeeks - weekNumber) * 7);
    const phase = phaseFor(weekNumber);
    const isRecovery = weekNumber % 4 === 0 && phase !== "taper";
    const longM = longRunM(weekNumber, phase, isRecovery);

    const workouts: GeneratedWorkout[] = [];
    for (let day = 0; day < 7; day++) {
      const date = addDays(startDate, day);
      // Drop any day past the goal date (e.g. a mid-week race).
      if (diffDays(date, goalDate) > 0) continue;
      const type = typeByDay.get(day) ?? "rest";
      workouts.push({
        date,
        dayOfWeek: day,
        type,
        distanceM: distanceForType(type, longM),
        description: DESCRIPTIONS[type],
      });
    }

    const totalDistanceM = workouts.reduce((acc, w) => acc + w.distanceM, 0);
    weeks.push({
      weekNumber,
      startDate,
      phase,
      isRecovery,
      totalDistanceM,
      workouts,
    });
  }

  return {
    goalType,
    goalDate,
    daysPerWeek,
    totalWeeks,
    weeks,
  };
}
