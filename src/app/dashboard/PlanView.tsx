import type { ActivePlan } from "@/lib/plan/persistence";
import type { Tables } from "@/lib/supabase/types";

const GOAL_LABEL: Record<string, string> = {
  "5k": "5K",
  "10k": "10K",
  half: "Half marathon",
  full: "Marathon",
};

const PHASE_STYLE: Record<string, string> = {
  base: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  build: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  peak: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  taper: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

const TYPE_STYLE: Record<string, string> = {
  long: "bg-indigo-500 text-white",
  tempo: "bg-orange-500 text-white",
  interval: "bg-rose-500 text-white",
  easy: "bg-emerald-500 text-white",
  rest: "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500",
};

const TYPE_ABBR: Record<string, string> = {
  long: "Long",
  tempo: "Tempo",
  interval: "Intvl",
  easy: "Easy",
  rest: "Rest",
};

const km = (m: number | null) => (m ? `${(m / 1000).toFixed(1)}` : "—");

const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

/** Is today within this week's Mon–Sun range? */
function isCurrentWeek(week: Tables<"weeks">): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const end = new Date(`${week.start_date}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 6);
  const endIso = end.toISOString().slice(0, 10);
  return week.start_date <= today && today <= endIso;
}

export function PlanView({ data }: { data: ActivePlan }) {
  const { plan, weeks, workouts } = data;

  const byWeek = new Map<string, Tables<"workouts">[]>();
  for (const w of workouts) {
    const list = byWeek.get(w.week_id) ?? [];
    list.push(w);
    byWeek.set(w.week_id, list);
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50">
          {GOAL_LABEL[plan.goal_type] ?? plan.goal_type} plan
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {plan.days_per_week} days/week · race {fmtDate(plan.goal_date)} ·{" "}
          {weeks.length} weeks
        </span>
      </div>

      <div className="mt-5 space-y-2">
        {weeks.map((week) => {
          const current = isCurrentWeek(week);
          const dayWorkouts = (byWeek.get(week.id) ?? []).slice().sort((a, b) =>
            a.date < b.date ? -1 : 1,
          );
          return (
            <div
              key={week.id}
              className={`rounded-xl border p-3 ${
                current
                  ? "border-gray-900 ring-1 ring-gray-900 dark:border-gray-100 dark:ring-gray-100"
                  : "border-gray-200 dark:border-gray-800"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Week {week.week_number}
                  </span>
                  {current ? (
                    <span className="rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-medium text-white dark:bg-gray-100 dark:text-gray-900">
                      This week
                    </span>
                  ) : null}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                      PHASE_STYLE[week.focus ?? ""] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {week.focus}
                  </span>
                  {week.week_number % 4 === 0 && week.focus !== "taper" ? (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      recovery
                    </span>
                  ) : null}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {km(week.planned_distance_m)} km total
                </span>
              </div>

              <div className="mt-2 grid grid-cols-7 gap-1">
                {dayWorkouts.map((wo) => (
                  <div
                    key={wo.id}
                    className={`rounded-md px-1 py-1.5 text-center ${TYPE_STYLE[wo.type]}`}
                    title={wo.description ?? wo.type}
                  >
                    <div className="text-[10px] font-medium leading-tight">
                      {TYPE_ABBR[wo.type]}
                    </div>
                    <div className="text-[10px] leading-tight opacity-90">
                      {wo.type === "rest" ? "" : `${km(wo.planned_distance_m)}k`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
