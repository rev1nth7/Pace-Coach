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
Steps 0–1 done (local): Next.js 16 scaffolded (App Router, TS, src/, Tailwind 4, ESLint),
deps installed (supabase, openai, zod, vitest), `src/lib/{supabase,strava,ai,plan}` created,
`.env.local` has the OpenAI key, `.env.example` committed, git initialized on `main`,
build/typecheck/lint all green.

Step 0 essentially done: GitHub repo live (github.com/rev1nth7/Pace-Coach, private) and
Supabase project created + keys verified working (in `.env.local`). Deferred on purpose:
Strava → Step 4, Vercel → Step 11, Supabase MCP → pending a user Personal Access Token.

Next: Step 2 — Auth (email-first via Supabase; Google login optional).
Track progress against PLAN.md.