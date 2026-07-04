"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { StravaAuthError } from "@/lib/strava/api";
import { deauthorize } from "@/lib/strava/oauth";
import { syncUserActivities } from "@/lib/strava/sync";
import { getActivePlan } from "@/lib/plan/persistence";
import { addDays } from "@/lib/plan/dates";
import { buildCoachInput } from "@/lib/ai/coachInput";
import { generateCoachNote } from "@/lib/ai/coach";
import { isDemoEmail } from "@/lib/demo/config";

async function requireUser(): Promise<{ id: string; email: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?redirectTo=/dashboard");
  }
  return { id: user.id, email: user.email ?? null };
}

/** Pull recent Strava runs into `activities`. */
export async function syncStrava() {
  const { id: userId, email } = await requireUser();
  if (isDemoEmail(email)) {
    redirect("/dashboard?demo=readonly");
  }

  let synced = 0;
  try {
    ({ synced } = await syncUserActivities(userId));
  } catch (error) {
    if (error instanceof StravaAuthError) {
      redirect("/dashboard?strava=revoked");
    }
    redirect("/dashboard?strava=sync_error");
  }

  revalidatePath("/dashboard");
  redirect(`/dashboard?strava=synced&count=${synced}`);
}

/** Disconnect Strava: best-effort deauthorize, then remove stored tokens. */
export async function disconnectStrava() {
  const { id: userId, email } = await requireUser();
  if (isDemoEmail(email)) {
    redirect("/dashboard?demo=readonly");
  }
  const admin = createAdminClient();

  const { data: account } = await admin
    .from("strava_accounts")
    .select("access_token")
    .eq("user_id", userId)
    .single();

  if (account?.access_token) {
    try {
      await deauthorize(account.access_token);
    } catch {
      // Best-effort — remove local data regardless.
    }
  }

  // Clean slate: remove synced runs and the connection so the database matches
  // what the UI shows after disconnect (no orphaned activity rows).
  await admin.from("activities").delete().eq("user_id", userId);
  await admin.from("strava_accounts").delete().eq("user_id", userId);

  revalidatePath("/dashboard");
  redirect("/dashboard?strava=disconnected");
}

/** Generate (or regenerate) the AI coaching note for the current plan week. */
export async function refreshCoachNote() {
  const { id: userId } = await requireUser();
  const supabase = await createClient();

  const activePlan = await getActivePlan(supabase, userId);
  if (!activePlan) {
    redirect("/dashboard");
  }

  const { data: activities } = await supabase
    .from("activities")
    .select("start_date, distance_m, average_pace_s_per_km")
    .eq("user_id", userId);

  const input = buildCoachInput(activePlan, activities ?? []);
  const note = await generateCoachNote(input);

  const today = new Date().toISOString().slice(0, 10);
  const currentWeek =
    activePlan.weeks.find(
      (w) => w.start_date <= today && today <= addDays(w.start_date, 6),
    ) ??
    activePlan.weeks.find((w) => w.start_date > today) ??
    activePlan.weeks[activePlan.weeks.length - 1];

  if (currentWeek) {
    await supabase
      .from("weeks")
      .update({
        coach_note: note,
        coach_note_generated_at: new Date().toISOString(),
      })
      .eq("id", currentWeek.id);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?coach=updated");
}
