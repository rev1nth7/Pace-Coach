# PaceCoach — Build Plan

A running training-plan generator that syncs with Strava and adapts weekly plans
based on actual performance vs planned workouts.

> **Project goal: resume showcase.** Optimized to be *finished, deployed, and
> demonstrably impressive* — not to handle every production edge case. Scope is
> deliberately lean so it actually ships with a live URL. The centerpiece to show off
> is the **Strava integration + adaptive plan algorithm**.

**Stack:** Next.js 14+ (App Router, TS, `src/`) · Tailwind · Supabase (auth + Postgres) ·
Strava API · **OpenAI** (AI coaching layer) · Vercel. *(Stripe optional — see Step 10.)*

**Legend:** ☐ todo · ◐ in progress · ☑ done · ⏸ deferred (intentionally, to a later step)

---

## Step 0 — Setup: skills, MCPs & prerequisites

Get the workshop ready before writing feature code. One-time foundation step.

### 0.1 Accounts & external services
- ☑ **Supabase** — project created (ref `bwczykbitphwcvbhwflu`). URL + anon + service_role
  keys in `.env.local` and **verified working** (auth health 200, REST 200).
- ⏸ **Strava** — **deferred to Step 4** (not needed for Auth). When we get there: create an
  API app at https://www.strava.com/settings/api; note Client ID / Client Secret; set
  Authorization Callback Domain to `localhost` (and later the Vercel domain).
- ⏸ **Vercel** — deferred to Step 11 (deploy). Account + link repo then.
- ☑ **GitHub** — repo live at https://github.com/rev1nth7/Pace-Coach; `main` pushed
  (2 commits). Currently private; flip to public at Step 11.

### 0.2 MCP servers (tools Claude Code can drive)
- ☐ **Supabase MCP** — manage schema, run migrations, inspect tables from within Claude.
  **Pending a Supabase Personal Access Token** from the user (avatar → Account → Access
  Tokens). Would make Step 3 migrations drivable directly instead of pasting SQL.
- ⏸ **Vercel MCP** *(optional)* — deferred to Step 11.
- ☐ Verify with `/mcp` and a smoke call before relying on them.

### 0.3 Claude Code skills to have on hand
- ☐ `/run` — launch & drive the app to confirm changes work.
- ☐ `/verify` — exercise a change end-to-end before committing.
- ☐ `/code-review` — review diffs for correctness + cleanups.
- ☐ `/security-review` — matters given auth + OAuth token storage.
- ☐ `/init` — keep CLAUDE.md current as the build grows.
- ☐ `dataviz` skill — for the pace/volume/trend charts in the UI.
- ☐ `ralph-loop` plugin — autonomous "iterate until tests pass" loop. **Not for now** —
  reserve it for Steps 5–6 (deterministic algorithms), and only after tests exist to
  anchor it. It can't do credential/account setup, so it's useless in Steps 0–4.

### 0.4 Local dev prerequisites
- ☑ Node v22.21 + npm 11.16 confirmed (pnpm not installed → using **npm**).
- ☑ Next.js 16 scaffolded (App Router, TS, `src/`, Tailwind 4, ESLint) — Step 1 genuinely
  done now (the prior "complete" claim was stale; nothing had actually been scaffolded).
- ☑ Deps installed: `@supabase/supabase-js`, `@supabase/ssr`, `openai`, `zod`, `vitest`.
- ☑ Lib structure created: `src/lib/{supabase,strava,ai,plan}`.
- ☑ `.env.local` (git-ignored) holds working values:
  - ☑ `OPENAI_API_KEY`
  - ☑ `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - ⏸ `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_REDIRECT_URI` — fill in Step 4
- ☑ `.env.example` committed documenting every required var (no secrets).
- ☑ `npm run typecheck` + `npm run lint` clean; `npm run build` passes.
- ☑ Git initialized (`main`); baseline pushed to GitHub.

**Exit (Step 0):** ✅ **essentially done.** Local scaffold, GitHub, and Supabase (verified)
are complete — enough to start Step 2. Remaining items are intentionally deferred: Strava
→ Step 4, Vercel → Step 11, Supabase MCP → whenever the user provides a Personal Access
Token (optional convenience).

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

## Step 5 — Plan generation engine ⭐ 🔁 Ralph Loop candidate
*The intellectual centerpiece — talk about this in interviews.*
> **Workflow:** write the test scaffolding FIRST (expected plan shape for given inputs),
> then hand it to the `ralph-loop` plugin to iterate until green. Deterministic + no
> external deps = ideal autonomous-loop territory.
- ☐ **Write unit tests first** (deterministic given inputs) — these anchor the Ralph Loop.
- ☐ Core algorithm in `/src/lib/plan` (pure business logic, no React).
- ☐ Inputs: goal distance, target date, current fitness, days/week.
- ☐ Output: multi-week plan → weeks → typed workouts (easy, tempo, interval, long, rest).

**Exit:** given user inputs, generate a structured, testable training plan.

---

## Step 6 — Adaptive algorithm (planned vs actual) ⭐ 🔁 Ralph Loop candidate
*The other half of the centerpiece — what makes this more than a CRUD app.*
> **Workflow:** same as Step 5 — tests first, then Ralph Loop until green.
- ☐ **Write unit tests first** covering over-/under-performance scenarios — these anchor
  the Ralph Loop.
- ☐ Logic in `/src/lib/plan` (or `/src/lib/adapt`): compare `activities` against planned
  `workouts` (completion, pace vs target, volume).
- ☐ Weekly adjustment rules (scale up/down, insert recovery, shift long run).
- ☐ Recompute upcoming weeks; preserve history.

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
