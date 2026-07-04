import "server-only";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDemoCredentials } from "@/lib/demo/config";
import { buildDemoSeed } from "@/lib/demo/seed";
import { generatePlan } from "@/lib/plan/generatePlan";
import { getActivePlan, savePlan } from "@/lib/plan/persistence";
import { addDays } from "@/lib/plan/dates";
import { buildCoachInput } from "@/lib/ai/coachInput";
import { generateCoachNote } from "@/lib/ai/coach";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type Admin = SupabaseClient<Database>;

/** Find the demo user by email, or create it (email pre-confirmed). Returns its id. */
async function ensureDemoUser(
  admin: Admin,
  email: string,
  password: string,
): Promise<string> {
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created?.user) return created.user.id;

  // Already exists — look it up. (Also reset the password so login stays valid.)
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = list?.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );
  if (!existing) {
    throw error ?? new Error("Could not create or find the demo user");
  }
  await admin.auth.admin.updateUserById(existing.id, { password });
  return existing.id;
}

/**
 * Idempotently (re)seed the shared demo account: a mid-stream plan, aligned
 * "actual" runs, a stub Strava connection, and a pre-generated coach note.
 * Guarded by the DEMO_SEED_SECRET header so it's safe to expose in production.
 *
 *   curl -X POST $URL/api/demo/seed -H "x-seed-secret: $DEMO_SEED_SECRET"
 */
export async function POST(req: Request) {
  const secret = process.env.DEMO_SEED_SECRET;
  if (!secret || req.headers.get("x-seed-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const creds = getDemoCredentials();
  if (!creds) {
    return NextResponse.json(
      { error: "DEMO_EMAIL / DEMO_PASSWORD not configured" },
      { status: 500 },
    );
  }

  const admin = createAdminClient();
  const userId = await ensureDemoUser(admin, creds.email, creds.password);

  // Clean slate (savePlan replaces the plan; wipe the rest explicitly).
  await admin.from("activities").delete().eq("user_id", userId);
  await admin.from("strava_accounts").delete().eq("user_id", userId);

  // Plan + aligned runs, relative to today.
  const today = new Date().toISOString().slice(0, 10);
  const seed = buildDemoSeed(today);
  const plan = generatePlan(seed.planInput);
  await savePlan(admin, userId, seed.planInput, plan);

  // Stub Strava connection so the dashboard shows "Connected" + recent runs.
  await admin.from("strava_accounts").insert({
    user_id: userId,
    strava_athlete_id: 195840822,
    access_token: "demo-access-token",
    refresh_token: "demo-refresh-token",
    expires_at: new Date(Date.now() + 365 * 86_400_000).toISOString(),
    scope: "read,activity:read",
  });

  const activityRows = seed.activities.map((a) => ({ ...a, user_id: userId }));
  const { error: actErr } = await admin.from("activities").insert(activityRows);
  if (actErr) {
    return NextResponse.json({ error: actErr.message }, { status: 500 });
  }

  // Pre-generate the coach note for the current week so the demo looks complete.
  const activePlan = await getActivePlan(admin, userId);
  let noteWeek: number | null = null;
  if (activePlan) {
    const { data: activities } = await admin
      .from("activities")
      .select("start_date, distance_m, average_pace_s_per_km")
      .eq("user_id", userId);

    const input = buildCoachInput(activePlan, activities ?? []);
    const note = await generateCoachNote(input);

    const currentWeek =
      activePlan.weeks.find(
        (w) => w.start_date <= today && today <= addDays(w.start_date, 6),
      ) ??
      activePlan.weeks.find((w) => w.start_date > today) ??
      activePlan.weeks[activePlan.weeks.length - 1];

    if (currentWeek) {
      await admin
        .from("weeks")
        .update({
          coach_note: note,
          coach_note_generated_at: new Date().toISOString(),
        })
        .eq("id", currentWeek.id);
      noteWeek = currentWeek.week_number;
    }
  }

  return NextResponse.json({
    ok: true,
    userId,
    goalDate: seed.planInput.goalDate,
    weeks: plan.totalWeeks,
    activities: activityRows.length,
    coachNoteWeek: noteWeek,
  });
}
