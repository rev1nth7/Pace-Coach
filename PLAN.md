and # PaceCoach — Build Plan

A running training-plan generator that syncs with Strava and adapts weekly plans
based on actual performance vs planned workouts.

> **Project goal: resume showcase.** Optimized to be *finished, deployed, and
> demonstrably impressive* — not to handle every production edge case. Scope is
> deliberately lean so it actually ships with a live URL. The centerpiece to show off
> is the **Strava integration + adaptive plan algorithm**.

**Stack:** Next.js 14+ (App Router, TS, `src/`) · Tailwind · Supabase (auth + Postgres) ·
Strava API · **OpenAI** (AI coaching layer) · Vercel. *(Stripe optional — see Step 10.)*

**Legend:** ☐ todo · ◐ in progress · ☑ done

---

## Step 0 — Setup: skills, MCPs & prerequisites

Get the workshop ready before writing feature code. One-time foundation step.

### 0.1 Accounts & external services
- ☐ **Supabase** — create project; note Project URL, `anon` key, `service_role` key.
- ☐ **Strava** — create an API app at https://www.strava.com/settings/api;
  note Client ID / Client Secret; set Authorization Callback Domain to `localhost`
  (and later the Vercel domain).
- ☐ **Vercel** — account + install `vercel` CLI; link the repo.
- ☐ **GitHub** — repo created and pushed (this project reports *not* a git repo yet —
  run `git init`, commit, and push first). A clean public repo is part of the showcase.

### 0.2 MCP servers (tools Claude Code can drive)
- ☐ **Supabase MCP** — manage schema, run migrations, inspect tables from within Claude.
- ☐ **Vercel MCP** *(optional)* — manage deployments/env vars.
- ☐ Verify with `/mcp` and a smoke call before relying on them.

### 0.3 Claude Code skills to have on hand
- ☐ `/run` — launch & drive the app to confirm changes work.
- ☐ `/verify` — exercise a change end-to-end before committing.
- ☐ `/code-review` — review diffs for correctness + cleanups.
- ☐ `/security-review` — matters given auth + OAuth token storage.
- ☐ `/init` — keep CLAUDE.md current as the build grows.
- ☐ `dataviz` skill — for the pace/volume/trend charts in the UI.

### 0.4 Local dev prerequisites
- ☐ Node LTS (18+/20+) and package manager confirmed.
- ☐ `.env.local` created (git-ignored) with:
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_REDIRECT_URI`
  - `OPENAI_API_KEY` *(server-side only — never expose to the client)*
  - `NEXT_PUBLIC_SITE_URL`
- ☐ `.env.example` committed documenting every required var (no secrets).
- ☐ `next lint` and `tsc --noEmit` run clean.
- ☐ Dev server boots (`npm run dev`) and renders the scaffold.

**Exit:** services provisioned, MCPs smoke-tested, env vars in place, app boots, repo on GitHub.

---

## Step 1 — Scaffold ☑ (complete)
Next.js + Tailwind + Supabase project scaffolded. *(Per CLAUDE.md.)*

---

## Step 2 — Auth (Supabase)
- ☐ Supabase client setup in `/src/lib/supabase` (browser + server clients).
- ☐ **Email auth first** (log in / sign up / log out / reset). Google login = *optional
  stretch* — add only if quick.
- ☐ Session handling via middleware; protect `/dashboard` routes.
- ☐ `profiles` table + row-level security (RLS); auto-create profile on signup (trigger).
- ☐ Verify full flow with `/verify`.

**Exit:** a user can sign up, log in, and reach a protected dashboard.

---

## Step 3 — Data model & schema
- ☐ Tables: `profiles`, `plans`, `weeks`, `workouts`, `activities`, `strava_accounts`.
- ☐ Migrations (via Supabase MCP) applied.
- ☐ RLS policies on every table (user owns their rows).
- ☐ Generate TypeScript types from the schema.

**Exit:** typed schema with RLS; types importable across the app.

---

## Step 4 — Strava integration (OAuth + sync) ⭐
*One half of the showcase — a real third-party OAuth integration.*
- ☐ Strava OAuth flow: connect → authorize → callback stores tokens in
  `strava_accounts` (with refresh-token rotation).
- ☐ Token refresh helper in `/src/lib/strava`.
- ☐ **Manual "Sync now" button** pulls recent runs, normalizes (distance, pace,
  duration, date), upserts into `activities`. *(No webhooks/cron — same skill shown,
  far less infra.)*
- ☐ Handle disconnect / revoked access gracefully.

**Exit:** a connected user's Strava runs appear as normalized activities via a Sync button.

---

## Step 5 — Plan generation engine ⭐
*The intellectual centerpiece — talk about this in interviews.*
- ☐ Core algorithm in `/src/lib/plan` (pure business logic, no React).
- ☐ Inputs: goal distance, target date, current fitness, days/week.
- ☐ Output: multi-week plan → weeks → typed workouts (easy, tempo, interval, long, rest).
- ☐ Unit tests (deterministic given inputs).

**Exit:** given user inputs, generate a structured, testable training plan.

---

## Step 6 — Adaptive algorithm (planned vs actual) ⭐
*The other half of the centerpiece — what makes this more than a CRUD app.*
- ☐ Logic in `/src/lib/plan` (or `/src/lib/adapt`): compare `activities` against planned
  `workouts` (completion, pace vs target, volume).
- ☐ Weekly adjustment rules (scale up/down, insert recovery, shift long run).
- ☐ Recompute upcoming weeks; preserve history.
- ☐ Unit tests covering over-/under-performance scenarios.

**Exit:** next week's plan visibly adapts to last week's actual performance.

---

## Step 7 — AI Coach (OpenAI) ⭐ (your "AI" bullet)
*A coaching layer on top of the deterministic algorithm — explains the data, doesn't
replace the engine. Keep all OpenAI calls server-side.*
- ☐ `/src/lib/ai` module: build a prompt from the user's plan + planned-vs-actual data
  (Step 6 output) and call OpenAI via a server action / route handler.
- ☐ **Weekly coach note:** natural-language summary + rationale for this week's
  adjustments ("skipped 2 long runs → eased volume, added recovery").
- ☐ Cache/store the generated note (avoid re-calling on every page load; save cost).
- ☐ Graceful fallback if the API errors or the key is missing (show the raw stats).
- ☐ *Optional stretch:* a chat box to ask questions about your training.

**Exit:** each week shows an AI-written coaching summary grounded in the user's real data.

---

## Step 8 — Core UI + polish
*First thing any recruiter sees — worth extra time.*
- ☐ Dashboard: current week, next workout, plan-vs-actual summary.
- ☐ Plan view: full multi-week calendar.
- ☐ Activity feed from synced Strava data.
- ☐ Pace/volume/trend charts (use the `dataviz` skill).
- ☐ Loading / empty / error states so the demo never looks broken.
- ☐ Server components by default; `"use client"` only where interactive.
- ☐ Small, typed components with explicit interfaces.

**Exit:** a polished dashboard showing plan, workouts, activities, and progress.

---

## Step 9 — Demo mode ⭐ (showcase essential)
*No recruiter will connect their own Strava. This is what makes the live link explorable.*
- ☐ Seed a demo account with a realistic plan + several weeks of "actual" activities.
- ☐ **"Try the demo"** button on the landing page → instant read-only (or sandboxed)
  session into that account, no signup.
- ☐ Ensure the adaptive algorithm shows a visible plan change in the seeded data.
- ☐ Seed data rich enough that the AI Coach note (Step 7) has something real to say.

**Exit:** anyone with the URL can click "Try the demo" and explore a live, populated app.

---

## Step 10 — Stripe subscriptions *(optional — skip unless you want the "payments" bullet)*
Cut from the core scope: high plumbing cost, near-zero demo value. Do this **only** if you
specifically want "integrated Stripe payments" on the resume — and if so, keep it minimal:
- ☐ One Stripe Checkout (test mode) "Upgrade to Pro" button.
- ☐ Webhook → store subscription state in a `subscriptions` table.
- ☐ Gate one feature behind Pro.

*(Skipping this is a perfectly good choice for a showcase.)*

---

## Step 11 — Landing page + deploy to Vercel
- ☐ Simple landing page: what PaceCoach is, a screenshot/GIF, "Try the demo" + "Sign up".
- ☐ Configure env vars in Vercel (production + preview).
- ☐ Update Strava callback domain to the production domain; add it to Supabase redirect URLs.
- ☐ Add `OPENAI_API_KEY` to Vercel env (server-side).
- ☐ Deploy; smoke-test auth, Strava connect, plan gen, adapt, AI coach, and demo mode.
- ☐ `README.md` with the live URL, a screenshot, the stack, and a short "how it works"
  on the adaptive algorithm + AI coach — this is the recruiter's entry point.

**Exit:** PaceCoach is live on Vercel with a shareable URL and a resume-ready README.

---

### Working conventions (from CLAUDE.md)
- Server components by default; `"use client"` only when interactivity is needed.
- Business logic lives in `/src/lib`, not in components.
- Supabase client setup lives in `/src/lib/supabase`.
- Env vars in `.env.local`, never hardcoded.
- Keep components small and typed with explicit interfaces/types.
