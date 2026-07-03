import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables, TablesInsert } from "@/lib/supabase/types";
import type { GeneratedPlan, PlanInput } from "./types";

type DB = SupabaseClient<Database>;

export interface ActivePlan {
  plan: Tables<"plans">;
  weeks: Tables<"weeks">[];
  workouts: Tables<"workouts">[];
}

/**
 * Persist a generated plan for a user: archives any existing active plan, then
 * inserts the plan, its weeks, and their workouts. Uses the passed (user-session)
 * client so RLS scopes every write to the owner. Returns the new plan id.
 */
export async function savePlan(
  supabase: DB,
  userId: string,
  input: PlanInput,
  plan: GeneratedPlan,
): Promise<string> {
  await supabase
    .from("plans")
    .update({ status: "archived" })
    .eq("user_id", userId)
    .eq("status", "active");

  const { data: planRow, error: planErr } = await supabase
    .from("plans")
    .insert({
      user_id: userId,
      goal_type: plan.goalType,
      goal_date: plan.goalDate,
      days_per_week: plan.daysPerWeek,
      current_fitness: input.fitness,
      status: "active",
    })
    .select("id")
    .single();
  if (planErr || !planRow) {
    throw planErr ?? new Error("Failed to create plan");
  }
  const planId = planRow.id;

  const weekRows: TablesInsert<"weeks">[] = plan.weeks.map((w) => ({
    plan_id: planId,
    user_id: userId,
    week_number: w.weekNumber,
    start_date: w.startDate,
    focus: w.phase,
    planned_distance_m: w.totalDistanceM,
  }));
  const { data: insertedWeeks, error: weekErr } = await supabase
    .from("weeks")
    .insert(weekRows)
    .select("id, week_number");
  if (weekErr || !insertedWeeks) {
    throw weekErr ?? new Error("Failed to create weeks");
  }
  const weekIdByNumber = new Map(
    insertedWeeks.map((r) => [r.week_number, r.id]),
  );

  const workoutRows: TablesInsert<"workouts">[] = plan.weeks.flatMap((w) =>
    w.workouts.map((wo) => ({
      week_id: weekIdByNumber.get(w.weekNumber)!,
      plan_id: planId,
      user_id: userId,
      date: wo.date,
      type: wo.type,
      planned_distance_m: wo.distanceM,
      description: wo.description,
    })),
  );
  const { error: woErr } = await supabase.from("workouts").insert(workoutRows);
  if (woErr) {
    throw woErr;
  }

  return planId;
}

/** Load the user's active plan with its weeks and workouts, or null if none. */
export async function getActivePlan(
  supabase: DB,
  userId: string,
): Promise<ActivePlan | null> {
  const { data: plan } = await supabase
    .from("plans")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!plan) return null;

  const [{ data: weeks }, { data: workouts }] = await Promise.all([
    supabase
      .from("weeks")
      .select("*")
      .eq("plan_id", plan.id)
      .order("week_number"),
    supabase.from("workouts").select("*").eq("plan_id", plan.id).order("date"),
  ]);

  return { plan, weeks: weeks ?? [], workouts: workouts ?? [] };
}
