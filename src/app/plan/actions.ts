"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isDemoEmail } from "@/lib/demo/config";
import { addDays, dayOfWeekMon0 } from "@/lib/plan/dates";
import { generatePlan } from "@/lib/plan/generatePlan";
import { savePlan } from "@/lib/plan/persistence";

const schema = z.object({
  goalType: z.enum(["5k", "10k", "half", "full"]),
  goalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  daysPerWeek: z.coerce.number().int().min(3).max(6),
  fitness: z.enum(["beginner", "intermediate", "advanced"]),
});

/** Move a date forward to the Sunday of its week (Mon=0 … Sun=6). */
function snapToSunday(iso: string): string {
  return addDays(iso, 6 - dayOfWeekMon0(iso));
}

export async function createPlan(formData: FormData) {
  const parsed = schema.safeParse({
    goalType: formData.get("goalType"),
    goalDate: formData.get("goalDate"),
    daysPerWeek: formData.get("daysPerWeek"),
    fitness: formData.get("fitness"),
  });
  if (!parsed.success) {
    redirect(
      `/plan/new?error=${encodeURIComponent("Please fill in every field correctly.")}`,
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  if (parsed.data.goalDate <= today) {
    redirect(
      `/plan/new?error=${encodeURIComponent("Your race date needs to be in the future.")}`,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?redirectTo=/plan/new");
  }
  if (isDemoEmail(user.email)) {
    redirect("/dashboard?demo=readonly");
  }

  const input = {
    goalType: parsed.data.goalType,
    goalDate: snapToSunday(parsed.data.goalDate),
    fromDate: today,
    daysPerWeek: parsed.data.daysPerWeek,
    fitness: parsed.data.fitness,
  };

  const plan = generatePlan(input);
  await savePlan(supabase, user.id, input, plan);

  revalidatePath("/dashboard");
  redirect("/dashboard?plan=created");
}
