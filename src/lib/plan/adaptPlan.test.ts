import { describe, expect, it } from "vitest";
import { adaptPlan } from "./adaptPlan";
import { addDays } from "./dates";
import { generatePlan } from "./generatePlan";
import type { ActivityInput } from "./adaptTypes";
import type { GeneratedPlan, GeneratedWeek } from "./types";

// Deterministic base plan: half marathon, 10 weeks, 4 days/week.
const basePlan: GeneratedPlan = generatePlan({
  goalType: "half",
  goalDate: "2026-03-15",
  fromDate: "2026-01-01",
  daysPerWeek: 4,
  fitness: "intermediate",
});

const EVAL = 3; // evaluate week 3 (a build week, has upcoming weeks after it)
const evalWeek = (): GeneratedWeek => basePlan.weeks[EVAL - 1];

/** Build `runs` activities inside a given week, splitting `totalM` evenly. */
function activitiesInWeek(
  week: GeneratedWeek,
  runs: number,
  totalM: number,
): ActivityInput[] {
  const each = runs > 0 ? totalM / runs : 0;
  return Array.from({ length: runs }, (_, i) => ({
    startDate: addDays(week.startDate, i + 1), // Tue, Wed, ... within Mon–Sun
    distanceM: each,
  }));
}

describe("adaptPlan — metrics", () => {
  it("counts completed runs and sums actual distance for the evaluated week", () => {
    const week = evalWeek();
    const activities = activitiesInWeek(week, 2, week.totalDistanceM);
    const { metrics } = adaptPlan({
      plan: basePlan,
      activities,
      evaluatedWeekNumber: EVAL,
    });
    expect(metrics.completedRuns).toBe(2);
    expect(metrics.plannedRuns).toBe(4);
    expect(metrics.completionRate).toBeCloseTo(0.5, 5);
    expect(metrics.actualDistanceM).toBeCloseTo(week.totalDistanceM, 5);
    expect(metrics.plannedDistanceM).toBe(week.totalDistanceM);
    expect(metrics.volumeRatio).toBeCloseTo(1, 5);
  });

  it("ignores activities outside the evaluated week's date range", () => {
    const week = evalWeek();
    const inside = activitiesInWeek(week, 1, week.totalDistanceM);
    const outside: ActivityInput[] = [
      { startDate: addDays(week.startDate, 20), distanceM: 99999 },
      { startDate: addDays(week.startDate, -10), distanceM: 99999 },
    ];
    const { metrics } = adaptPlan({
      plan: basePlan,
      activities: [...inside, ...outside],
      evaluatedWeekNumber: EVAL,
    });
    expect(metrics.completedRuns).toBe(1);
    expect(metrics.actualDistanceM).toBeCloseTo(week.totalDistanceM, 5);
  });
});

describe("adaptPlan — classification", () => {
  it("scales down when volumeRatio < 0.7", () => {
    const week = evalWeek();
    const { adjustment } = adaptPlan({
      plan: basePlan,
      activities: activitiesInWeek(week, 2, week.totalDistanceM * 0.5),
      evaluatedWeekNumber: EVAL,
    });
    expect(adjustment.type).toBe("scale_down");
    expect(adjustment.factor).toBeCloseTo(0.85, 5);
    expect(adjustment.reason.length).toBeGreaterThan(0);
  });

  it("holds when volumeRatio is on target", () => {
    const week = evalWeek();
    const { adjustment } = adaptPlan({
      plan: basePlan,
      activities: activitiesInWeek(week, 4, week.totalDistanceM),
      evaluatedWeekNumber: EVAL,
    });
    expect(adjustment.type).toBe("hold");
    expect(adjustment.factor).toBe(1);
  });

  it("scales up when volumeRatio > 1.15", () => {
    const week = evalWeek();
    const { adjustment } = adaptPlan({
      plan: basePlan,
      activities: activitiesInWeek(week, 4, week.totalDistanceM * 1.3),
      evaluatedWeekNumber: EVAL,
    });
    expect(adjustment.type).toBe("scale_up");
    expect(adjustment.factor).toBeCloseTo(1.1, 5);
  });

  it("treats no activities as a missed week (scale_down)", () => {
    const { adjustment, metrics } = adaptPlan({
      plan: basePlan,
      activities: [],
      evaluatedWeekNumber: EVAL,
    });
    expect(metrics.volumeRatio).toBe(0);
    expect(metrics.completedRuns).toBe(0);
    expect(adjustment.type).toBe("scale_down");
  });
});

describe("adaptPlan — recompute upcoming, preserve history", () => {
  const week = evalWeek();
  const result = adaptPlan({
    plan: basePlan,
    activities: activitiesInWeek(week, 2, week.totalDistanceM * 0.5), // scale_down
    evaluatedWeekNumber: EVAL,
  });

  it("leaves the plan shape intact (same weeks, phases, numbers)", () => {
    expect(result.adaptedPlan.totalWeeks).toBe(basePlan.totalWeeks);
    expect(result.adaptedPlan.weeks).toHaveLength(basePlan.weeks.length);
    result.adaptedPlan.weeks.forEach((w, i) => {
      expect(w.weekNumber).toBe(basePlan.weeks[i].weekNumber);
      expect(w.phase).toBe(basePlan.weeks[i].phase);
    });
  });

  it("keeps past + evaluated weeks (≤ N) byte-for-byte identical", () => {
    for (let i = 0; i < EVAL; i++) {
      expect(result.adaptedPlan.weeks[i]).toEqual(basePlan.weeks[i]);
    }
  });

  it("scales every upcoming week (> N) by the factor, rest days stay 0", () => {
    const f = result.adjustment.factor;
    for (let i = EVAL; i < basePlan.weeks.length; i++) {
      const orig = basePlan.weeks[i];
      const adapted = result.adaptedPlan.weeks[i];
      adapted.workouts.forEach((wo, j) => {
        expect(wo.distanceM).toBe(Math.round(orig.workouts[j].distanceM * f));
      });
      const sum = adapted.workouts.reduce((a, w) => a + w.distanceM, 0);
      expect(adapted.totalDistanceM).toBe(sum);
      // structure preserved
      expect(adapted.workouts.filter((w) => w.type === "long")).toHaveLength(1);
    }
  });

  it("scale_up increases upcoming volume; hold leaves it unchanged", () => {
    const up = adaptPlan({
      plan: basePlan,
      activities: activitiesInWeek(week, 4, week.totalDistanceM * 1.3),
      evaluatedWeekNumber: EVAL,
    });
    expect(up.adaptedPlan.weeks[EVAL].totalDistanceM).toBeGreaterThan(
      basePlan.weeks[EVAL].totalDistanceM,
    );

    const hold = adaptPlan({
      plan: basePlan,
      activities: activitiesInWeek(week, 4, week.totalDistanceM),
      evaluatedWeekNumber: EVAL,
    });
    expect(hold.adaptedPlan.weeks[EVAL]).toEqual(basePlan.weeks[EVAL]);
  });
});

describe("adaptPlan — edges & determinism", () => {
  it("is a no-op on the plan when the last week is evaluated", () => {
    const last = basePlan.weeks[basePlan.weeks.length - 1];
    const result = adaptPlan({
      plan: basePlan,
      activities: activitiesInWeek(last, 1, last.totalDistanceM * 0.2),
      evaluatedWeekNumber: basePlan.totalWeeks,
    });
    expect(result.adaptedPlan.weeks).toEqual(basePlan.weeks);
  });

  it("is deterministic (same input → identical output)", () => {
    const week = evalWeek();
    const args = {
      plan: basePlan,
      activities: activitiesInWeek(week, 3, week.totalDistanceM * 0.9),
      evaluatedWeekNumber: EVAL,
    };
    expect(adaptPlan(args)).toEqual(adaptPlan(args));
  });
});
