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
Steps 0–3 done. GitHub repo live (github.com/rev1nth7/Pace-Coach, private); Supabase
project + keys verified in `.env.local`; Supabase MCP registered & connected (tools active).
Milestone tags: `step-2`, `step-3`.

- **Step 0–1** ☑ — scaffold, deps, `src/lib/{supabase,strava,ai,plan}`, env, git.
- **Step 2 (Auth)** ☑ — `@supabase/ssr` clients (`src/lib/supabase/{client,server,middleware}.ts`),
  root `src/middleware.ts` (session refresh + `/dashboard` protection), `(auth)/{login,signup}`
  pages + `actions.ts` (signup/login/signOut, open-redirect-hardened), protected
  `/dashboard`. Email confirmation OFF in Supabase (instant signup) via Management API.
- **Step 3 (Schema)** ☑ — 6 tables (`profiles`, `strava_accounts`, `activities`, `plans`,
  `weeks`, `workouts`) with RLS on all; signup trigger auto-creates `profiles`; enums
  `goal_type`/`workout_type`; generated types in `src/lib/supabase/types.ts` wired into
  clients as `createClient<Database>`. `get_advisors` clean (HIBP is Pro-only, deferred).

Deferred on purpose: Strava → Step 4, Vercel → Step 11.

Next: **Step 4 — Strava integration** ⭐ (OAuth connect → callback stores tokens in
`strava_accounts` → "Sync now" pulls runs into `activities`). Needs user to create a
Strava API app (Client ID/Secret, callback domain `localhost`) and add keys to `.env.local`.
Track progress against PLAN.md.