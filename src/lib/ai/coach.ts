import "server-only";
import OpenAI from "openai";

/** Workout summary passed to the coach (rest days excluded). */
export interface CoachWorkout {
  type: string;
  distanceKm: number;
}

/** Pre-computed facts for the coach to narrate — never numbers it invents. */
export interface CoachInput {
  goalLabel: string;
  weekNumber: number;
  totalWeeks: number;
  phase: string;
  isRecovery: boolean;
  weekTotalKm: number;
  longRunKm: number;
  workouts: CoachWorkout[];
  recent: {
    runs: number;
    totalKm: number;
    avgPaceLabel: string | null;
  } | null;
  adaptation: {
    volumeRatioPct: number;
    type: string;
    reason: string;
  } | null;
}

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

const SYSTEM_PROMPT = [
  "You are an encouraging, knowledgeable running coach.",
  "Using ONLY the facts provided, write 2–4 short sentences to the athlete about their current training week.",
  "Do NOT invent numbers, paces, distances, or workouts that are not in the facts.",
  "Be specific, motivating, and plain-spoken. Address the athlete as 'you'. No headings or lists — just the note.",
].join(" ");

function buildUserPrompt(input: CoachInput): string {
  const lines: string[] = [];
  lines.push(`Goal race: ${input.goalLabel}`);
  lines.push(
    `Current week: ${input.weekNumber} of ${input.totalWeeks} (${input.phase} phase${input.isRecovery ? ", recovery week" : ""})`,
  );
  lines.push(
    `This week: ${input.weekTotalKm.toFixed(1)} km total, long run ${input.longRunKm.toFixed(1)} km`,
  );
  lines.push(
    `Key sessions: ${input.workouts
      .map((w) => `${w.type} ${w.distanceKm.toFixed(1)}km`)
      .join(", ")}`,
  );
  if (input.recent) {
    lines.push(
      `Recent training: ${input.recent.runs} runs, ${input.recent.totalKm.toFixed(1)} km${
        input.recent.avgPaceLabel ? `, avg pace ${input.recent.avgPaceLabel}` : ""
      }`,
    );
  }
  if (input.adaptation) {
    lines.push(
      `Adaptation: last week was ${input.adaptation.volumeRatioPct}% of planned volume → ${input.adaptation.type} (${input.adaptation.reason})`,
    );
  }
  return `Facts:\n${lines.join("\n")}\n\nWrite the coaching note.`;
}

/** Deterministic note used when OpenAI is unavailable (no key or API error). */
export function fallbackNote(input: CoachInput): string {
  const parts: string[] = [];
  parts.push(
    `Week ${input.weekNumber} of ${input.totalWeeks} — your ${input.phase} phase${input.isRecovery ? " recovery week" : ""}.`,
  );
  parts.push(
    `You've got ${input.weekTotalKm.toFixed(1)} km planned, topped by a ${input.longRunKm.toFixed(1)} km long run.`,
  );
  if (input.adaptation && input.adaptation.type !== "hold") {
    const dir = input.adaptation.type === "scale_down" ? "eased" : "nudged up";
    parts.push(
      `Based on last week (${input.adaptation.volumeRatioPct}% of plan), upcoming volume was ${dir}.`,
    );
  } else if (input.recent && input.recent.runs > 0) {
    parts.push(
      `Nice work logging ${input.recent.runs} recent runs — keep the momentum going.`,
    );
  }
  return parts.join(" ");
}

/**
 * Generate a natural-language coaching note. Server-side only. Falls back to a
 * deterministic note if OPENAI_API_KEY is missing or the API call fails.
 */
export async function generateCoachNote(input: CoachInput): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackNote(input);
  }
  try {
    const client = new OpenAI();
    const res = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.6,
      max_tokens: 200,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(input) },
      ],
    });
    const text = res.choices[0]?.message?.content?.trim();
    return text && text.length > 0 ? text : fallbackNote(input);
  } catch {
    return fallbackNote(input);
  }
}
