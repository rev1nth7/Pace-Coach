import { describe, expect, it } from "vitest";
import { generatePlan } from "./generatePlan";
import type { GeneratedPlan, PlanInput, WorkoutType } from "./types";

// --- date helpers (independent of the implementation) ---
const DAY_MS = 86_400_000;
const parse = (iso: string) => new Date(`${iso}T00:00:00Z`).getTime();
const isoOf = (ms: number) => new Date(ms).toISOString().slice(0, 10);
/** Monday=0 … Sunday=6 */
const dow = (iso: string) => (new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7;
const diffDays = (a: string, b: string) => Math.round((parse(a) - parse(b)) / DAY_MS);

const PHASE_RANK = { base: 0, build: 1, peak: 2, taper: 3 } as const;
const VALID_TYPES: WorkoutType[] = ["easy", "tempo", "interval", "long", "rest"];

// --- fixtures ---
// 2026-03-15 is a Sunday; 10 whole weeks after 2026-01-01.
const halfInput: PlanInput = {
  goalType: "half",
  goalDate: "2026-03-15",
  fromDate: "2026-01-01",
  daysPerWeek: 4,
  fitness: "intermediate",
};

const allWorkouts = (plan: GeneratedPlan) => plan.weeks.flatMap((w) => w.workouts);

describe("generatePlan — plan length clamping", () => {
  it("uses the exact week count when within the goal's range (half, 10 weeks out → 10)", () => {
    expect(generatePlan(halfInput).totalWeeks).toBe(10);
  });

  it("caps a far-future goal at the max weeks (full → 20)", () => {
    const plan = generatePlan({
      ...halfInput,
      goalType: "full",
      goalDate: "2027-01-03", // ~52 weeks out, a Sunday
    });
    expect(plan.totalWeeks).toBe(20);
  });

  it("caps a far-future 5k at 12 and 10k at 14", () => {
    expect(
      generatePlan({ ...halfInput, goalType: "5k", goalDate: "2027-01-03" })
        .totalWeeks,
    ).toBe(12);
    expect(
      generatePlan({ ...halfInput, goalType: "10k", goalDate: "2027-01-03" })
        .totalWeeks,
    ).toBe(14);
  });

  it("clamps up to the minimum weeks when the goal is very soon (full, 4 weeks out → 12)", () => {
    const plan = generatePlan({
      ...halfInput,
      goalType: "full",
      goalDate: "2026-02-01", // Sunday, ~4 weeks out
    });
    expect(plan.totalWeeks).toBe(12);
  });
});

describe("generatePlan — week structure & calendar", () => {
  const plan = generatePlan(halfInput);

  it("produces exactly totalWeeks weeks, numbered 1..N", () => {
    expect(plan.weeks).toHaveLength(plan.totalWeeks);
    plan.weeks.forEach((w, i) => expect(w.weekNumber).toBe(i + 1));
  });

  it("starts every week on a Monday, consecutive and 7 days apart", () => {
    plan.weeks.forEach((w) => expect(dow(w.startDate)).toBe(0));
    for (let i = 1; i < plan.weeks.length; i++) {
      expect(diffDays(plan.weeks[i].startDate, plan.weeks[i - 1].startDate)).toBe(7);
    }
  });

  it("ends on race day: the final week's Sunday equals the goal date", () => {
    const last = plan.weeks[plan.weeks.length - 1];
    expect(isoOf(parse(last.startDate) + 6 * DAY_MS)).toBe(plan.goalDate);
  });

  it("keeps every workout within its week and on/before the goal date", () => {
    plan.weeks.forEach((w) => {
      w.workouts.forEach((wo) => {
        const offset = diffDays(wo.date, w.startDate);
        expect(offset).toBeGreaterThanOrEqual(0);
        expect(offset).toBeLessThanOrEqual(6);
        expect(wo.dayOfWeek).toBe(dow(wo.date));
        expect(parse(wo.date)).toBeLessThanOrEqual(parse(plan.goalDate));
      });
    });
  });
});

describe("generatePlan — weekly workout shape", () => {
  const plan = generatePlan(halfInput);

  it("gives each week exactly one long run, on Sunday", () => {
    plan.weeks.forEach((w) => {
      const longs = w.workouts.filter((wo) => wo.type === "long");
      expect(longs).toHaveLength(1);
      expect(longs[0].dayOfWeek).toBe(6);
    });
  });

  it("rests on Monday and has at least one rest day", () => {
    plan.weeks.forEach((w) => {
      const monday = w.workouts.find((wo) => wo.dayOfWeek === 0);
      expect(monday?.type).toBe("rest");
      expect(w.workouts.filter((wo) => wo.type === "rest").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("has exactly daysPerWeek running days (non-rest) per week", () => {
    plan.weeks.forEach((w) => {
      const running = w.workouts.filter((wo) => wo.type !== "rest");
      expect(running).toHaveLength(halfInput.daysPerWeek);
    });
  });

  it("uses only valid workout types; rest is 0m and runs are > 0m", () => {
    allWorkouts(plan).forEach((wo) => {
      expect(VALID_TYPES).toContain(wo.type);
      if (wo.type === "rest") expect(wo.distanceM).toBe(0);
      else expect(wo.distanceM).toBeGreaterThan(0);
    });
  });

  it("includes tempo and interval quality sessions when daysPerWeek >= 4", () => {
    const types = new Set(allWorkouts(plan).map((wo) => wo.type));
    expect(types.has("tempo")).toBe(true);
    expect(types.has("interval")).toBe(true);
  });
});

describe("generatePlan — volume, periodization & progression", () => {
  const plan = generatePlan(halfInput);

  it("reports totalDistanceM equal to the sum of its workouts", () => {
    plan.weeks.forEach((w) => {
      const sum = w.workouts.reduce((acc, wo) => acc + wo.distanceM, 0);
      expect(w.totalDistanceM).toBe(sum);
    });
  });

  it("progresses: the peak long run exceeds week 1's long run", () => {
    const longOf = (wk: (typeof plan.weeks)[number]) =>
      wk.workouts.find((wo) => wo.type === "long")!.distanceM;
    const peak = Math.max(...plan.weeks.map(longOf));
    expect(peak).toBeGreaterThan(longOf(plan.weeks[0]));
  });

  it("orders phases base → build → peak → taper (non-decreasing rank)", () => {
    expect(plan.weeks[0].phase).toBe("base");
    expect(plan.weeks[plan.weeks.length - 1].phase).toBe("taper");
    for (let i = 1; i < plan.weeks.length; i++) {
      expect(PHASE_RANK[plan.weeks[i].phase]).toBeGreaterThanOrEqual(
        PHASE_RANK[plan.weeks[i - 1].phase],
      );
    }
  });

  it("marks every 4th week (outside the taper) as recovery with reduced volume", () => {
    plan.weeks.forEach((w, i) => {
      const expectRecovery = w.weekNumber % 4 === 0 && w.phase !== "taper";
      expect(w.isRecovery).toBe(expectRecovery);
      if (expectRecovery && i > 0) {
        expect(w.totalDistanceM).toBeLessThan(plan.weeks[i - 1].totalDistanceM);
      }
    });
  });

  it("tapers: the final week's volume is below the peak week's volume", () => {
    const peak = Math.max(...plan.weeks.map((w) => w.totalDistanceM));
    expect(plan.weeks[plan.weeks.length - 1].totalDistanceM).toBeLessThan(peak);
  });
});

describe("generatePlan — determinism & inputs", () => {
  it("is deterministic (same input → identical output)", () => {
    expect(generatePlan(halfInput)).toEqual(generatePlan(halfInput));
  });

  it("passes goalType and goalDate through unchanged", () => {
    const plan = generatePlan(halfInput);
    expect(plan.goalType).toBe("half");
    expect(plan.goalDate).toBe("2026-03-15");
    expect(plan.daysPerWeek).toBe(4);
  });

  it("keeps all workout dates on/before a mid-week (non-Sunday) goal date", () => {
    const plan = generatePlan({ ...halfInput, goalDate: "2026-03-11" }); // Wednesday
    allWorkouts(plan).forEach((wo) => {
      expect(parse(wo.date)).toBeLessThanOrEqual(parse("2026-03-11"));
    });
  });

  it("supports 6 running days with a single rest day", () => {
    const plan = generatePlan({ ...halfInput, daysPerWeek: 6 });
    plan.weeks.forEach((w) => {
      expect(w.workouts.filter((wo) => wo.type === "rest")).toHaveLength(1);
      expect(w.workouts.filter((wo) => wo.type !== "rest")).toHaveLength(6);
    });
  });
});
