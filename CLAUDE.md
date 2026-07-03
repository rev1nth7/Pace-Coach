# PaceCoach — Project Context

## What this is
A running training-plan generator that syncs with Strava and adapts weekly plans based
on actual performance vs planned workouts, with an OpenAI-powered coaching layer that
explains each week's adjustments in plain language.

**Goal: resume showcase** — optimized to be finished, deployed, and demonstrably
impressive, not to earn revenue. Scope is deliberately lean so it ships with a live URL.
See PLAN.md for the full step-by-step build plan and current status.

## Stack
- Next.js 14+ (App Router, TypeScript, src/ directory)
- Tailwind CSS
- Supabase (auth + Postgres database)
- Strava API (OAuth, activity sync)
- OpenAI (AI coaching layer — server-side only)
- Deployed on Vercel
- Stripe (subscriptions) — optional/stretch, not core scope

## Conventions
- Server components by default; "use client" only when interactivity is needed
- Business logic (plan generation, adaptive algorithm) lives in /src/lib, not in components
- Supabase client setup lives in /src/lib/supabase; Strava in /src/lib/strava; OpenAI in /src/lib/ai
- The plan-generation and adaptive algorithms are deterministic and unit-tested; OpenAI
  only explains/narrates their output — it never computes the plan or the numbers
- All OpenAI calls run server-side (route handler / server action); OPENAI_API_KEY is
  never exposed to the client (no NEXT_PUBLIC_ prefix)
- Environment variables go in .env.local, never hardcoded; document them in .env.example
- Keep components small and typed with explicit interfaces/types

## Workflow
- Track work against PLAN.md; keep its ☐/☑ status current as steps complete.
- Steps 0–4 (setup, auth, schema, Strava) need human credentials/decisions — do these
  interactively, not autonomously.
- Steps 5–6 (deterministic plan + adaptive algorithms) are the Ralph Loop candidates:
  write unit tests FIRST, then run the `ralph-loop` plugin to iterate until green. Don't
  start a loop before the tests exist — it has nothing to anchor to.

## Current build stage
**Steps 0–8 done** (Step 8 was reordered before Step 7). GitHub live
(github.com/rev1nth7/Pace-Coach, private); Supabase project + keys in `.env.local`; Supabase
MCP connected; Strava + OpenAI keys in `.env.local`. **34 unit tests green.** Milestone tags:
`step-2`…`step-8`. See PLAN.md "Status at a glance" for the table.

- **0–1** ☑ scaffold, deps, `src/lib/{supabase,strava,ai,plan}`, env, git.
- **2 Auth** ☑ `@supabase/ssr` clients, `src/middleware.ts` (session + `/dashboard` guard),
  `(auth)/{login,signup}` + `actions.ts`, protected `/dashboard`. Email confirmation OFF.
- **3 Schema** ☑ 6 tables + RLS on all, signup trigger, enums, generated `types.ts`.
- **4 Strava** ☑ OAuth connect/callback, token refresh+rotate, "Sync now" → `activities`,
  disconnect (clean slate). `src/lib/strava/*`, `/api/strava/*`. Verified live.
- **5 Plan engine** ☑ `src/lib/plan/generatePlan.ts` (+ `dates.ts`) — deterministic,
  periodized, 22 tests (built via Ralph Loop, tests-first).
- **6 Adaptive** ☑ `src/lib/plan/adaptPlan.ts` — planned-vs-actual → scale up/down/hold,
  12 tests (Ralph Loop).
- **8 Core UI** ☑ `/plan/new` form + `createPlan`, `plan/persistence.ts` (save/load,
  replace-on-create), `dashboard/PlanView.tsx` calendar. Engine now visible.
- **7 AI Coach** ☑ `src/lib/ai/{coach,coachInput}.ts` — OpenAI (server-side, `server-only`,
  `gpt-4o-mini`, fallback), cached on `weeks.coach_note`, dashboard "Coach" card.

Next: **Step 9 — Demo mode** (seed a demo account with a plan + aligned activities so the
adaptive + AI story is visible to visitors with no signup), then **Step 11 — deploy to
Vercel** (live URL + landing page). Optional polish: charts (`dataviz`), plan-vs-actual
overlay. Track progress against PLAN.md.