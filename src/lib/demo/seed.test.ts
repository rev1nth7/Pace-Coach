import { describe, expect, it } from "vitest";
import { buildDemoSeed } from "./seed";
import { generatePlan } from "@/lib/plan/generatePlan";
import { adaptPlan } from "@/lib/plan/adaptPlan";
import { addDays } from "@/lib/plan/dates";

const TODAY = "2026-07-04";

describe("buildDemoSeed", () => {
  const seed = buildDemoSeed(TODAY);
  const plan = generatePlan(seed.planInput);

  const completed = plan.weeks.filter((w) => addDays(w.startDate, 6) < TODAY);
  const current = plan.weeks.filter(
    (w) => w.startDate <= TODAY && TODAY <= addDays(w.startDate, 6),
  );
  const future = plan.weeks.filter((w) => w.startDate > TODAY);

  it("is a mid-stream plan: ≥3 completed, a current week, ≥1 future", () => {
    expect(completed.length).toBeGreaterThanOrEqual(3);
    expect(current.length).toBe(1);
    expect(future.length).toBeGreaterThanOrEqual(1);
  });

  it("seeds aligned runs only in completed weeks", () => {
    expect(seed.activities.length).toBeGreaterThan(0);
    for (const a of seed.activities) {
      const day = a.start_date.slice(0, 10);
      expect(day < TODAY).toBe(true);
    }
  });

  it("uses unique Strava activity ids", () => {
    const ids = new Set(seed.activities.map((a) => a.strava_activity_id));
    expect(ids.size).toBe(seed.activities.length);
  });

  it("makes the last completed week under-target → adaptPlan scale_down", () => {
    const lastCompleted = completed[completed.length - 1];
    const result = adaptPlan({
      plan,
      activities: seed.activities.map((a) => ({
        startDate: a.start_date,
        distanceM: a.distance_m,
      })),
      evaluatedWeekNumber: lastCompleted.weekNumber,
    });
    expect(result.metrics.completedRuns).toBeGreaterThan(0);
    expect(result.metrics.volumeRatio).toBeLessThan(0.7);
    expect(result.adjustment.type).toBe("scale_down");
  });
});
