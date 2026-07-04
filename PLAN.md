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

## Status at a glance *(updated 2026-07-04)*

| Step | Status |
|------|--------|
| 0 Setup · 1 Scaffold | ☑ |
| 2 Auth (Supabase, email) | ☑ |
| 3 Schema + RLS (6 tables) | ☑ |
| 4 Strava OAuth + sync | ☑ *(verified live)* |
| 5 Plan engine | ☑ *(22 tests, Ralph Loop)* |
| 6 Adaptive algorithm | ☑ *(12 tests, Ralph Loop)* |
| 8 Core UI — create + view plan | ☑ *(reordered before 7; engine visible)* |
| 7 AI Coach (OpenAI) | ☑ *(server-side, cached, fallback)* |
| **9 Demo mode** (9.1–9.6) | ☑ *(seeded, adaptation narrated, guarded)* |
| **11 Landing + deploy** | ◐ *(landing + README done; Vercel import in progress)* |
| 10 Stripe *(opt)* | ☐ *(optional, likely skip)* |

**Working today (local):** signup/login **or "Try the demo"** → connect Strava → sync runs →
generate a periodized plan → see it as a week-by-week calendar → AI coach note that narrates a
real adaptation. Demo account seeds a mid-stream plan + aligned runs so the adaptive + AI story
is visible with no signup. **38 unit tests green.** Tags: `step-2`…`step-9`, `step-7`.

**Not yet shipped:** charts, plan-vs-actual overlay, **live deploy** (mid-flight).

**Deploy status (Step 11):** landing hero ☑ and recruiter README ☑ committed + pushed
(`7a89f87`). Method chosen: **Vercel dashboard git-import**. Waiting on: user to import the repo
+ set env vars + first deploy → then wire the prod URL into `STRAVA_REDIRECT_URI` /
`NEXT_PUBLIC_SITE_URL`, set Strava callback domain, run the seed route against prod, and paste
the live URL into the README. See Step 11 below for the exact checklist.

**Recommended next order (max resume impact):** **finish Step 11 deploy** → optional polish
(charts, plan-vs-actual overlay).

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
- ☑ **Supabase MCP** — registered (local scope, scoped to project `bwczykbitphwcvbhwflu`),
  health check **✔ Connected**. PAT stored in `~/.claude.json` (NOT in the repo). Tools
  (`execute_sql`, `apply_migration`, `list_tables`…) activate on next session restart —
  needed from Step 3 onward.
- ⏸ **Vercel MCP** *(optional)* — deferred to Step 11.
- ☑ Verified via `claude mcp list` (Connected).

### 0.3 Claude Code skills to have on hand — ☑ all confirmed available
- ☑ `/run` — launch & drive the app to confirm changes work.
- ☑ `/verify` — exercise a change end-to-end before committing.
- ☑ `/code-review` — review diffs for correctness + cleanups.
- ☑ `/security-review` — matters given auth + OAuth token storage.
- ☑ `/init` — keep CLAUDE.md current as the build grows.
- ☑ `dataviz` skill — for the pace/volume/trend charts in the UI.
- ☑ `ralph-loop` plugin — installed & available. **Not for now** — reserve it for
  Steps 5–6 (deterministic algorithms), and only after tests exist to anchor it. It can't
  do credential/account setup, so it's useless in Steps 0–4.

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

**🎯 Goal:** a visitor can sign up with email+password, log in, land on a protected
`/dashboard` that greets them by identity, and log out — sessions persist across refresh
(cookie-based SSR), and signed-out users hitting `/dashboard` are bounced to `/login`.
No secrets on the client. **Demo loop:** incognito → signup → dashboard(shows email) →
refresh(still in) → logout → `/dashboard` redirects to `/login`.

**Scope decisions:** email confirmation **OFF** (instant signup→login for the showcase);
`profiles` table **deferred to Step 3** (keep Step 2 pure auth-code; do all schema with the
MCP live). Google login = optional stretch. *(Both flippable.)*

- **2.1 Supabase client layer** ☑ — `/src/lib/supabase`: `client.ts` (browser),
  `server.ts` (cookie-wired server client), `middleware.ts` (session-refresh helper).
  ☑ *done:* all three import cleanly, typecheck + lint pass, keys from env only.
  - ☑ `client.ts` · ☑ `server.ts` · ☑ `middleware.ts` helper
- **2.2 Middleware** ☑ — `src/middleware.ts`: refresh session every request; redirect
  unauthenticated users from `/dashboard/*` (preserving refreshed cookies); `matcher`
  skips Next internals + static assets. Build shows `ƒ Proxy (Middleware)` registered.
  Full redirect check runs in 2.6. — ☑ session refresh · ☑ route protection · ☑ matcher
- **2.3 Sign-up** ☑ — `(auth)/signup` page + shared `AuthForm` + `signup` server
  action (`signUp`); errors surfaced via `?error=`. Builds as `ƒ /signup`.
  Live user-creation check runs in 2.6. — ☑ form · ☑ action · ☑ errors
- **2.4 Login + logout** ☑ — `(auth)/login` page (`signInWithPassword`, honors
  `redirectTo`); `signOut` action (wired to dashboard button in 2.5); errors via
  `?error=`. Builds as `ƒ /login`. Live check in 2.6.
  - ☑ login · ☑ logout action · ☑ error states
- **2.5 Protected dashboard** ☑ — `/dashboard`: server component reads user via
  `getUser()` (+ defense-in-depth redirect), greets by email, logout button posts to
  `signOut`; placeholder shell for Step 8. Builds as `ƒ /dashboard`.
  - ☑ server read · ☑ greeting + logout · ☑ shell
- **2.6 Verify** ☑ — Email provider on + confirmation off (`mailer_autoconfirm: true`
  via Management API); `/dashboard` protection confirmed (307 → `/login?redirectTo`);
  Supabase signup returns an immediate session; `/security-review` passed (open-redirect
  found & hardened via `safeRedirect`). Final browser click-through recommended as a
  30-sec manual sanity check. — ☑ Email provider · ☑ automated checks · ☑ `/security-review`

**Exit:** ☑ a user can sign up, log in, reach a protected dashboard, and log out —
mechanisms verified (route protection, autoconfirm signup, security review). Browser
click-through pending as a final manual sanity check.

---

## Step 3 — Data model & schema

**🎯 Goal:** a fully typed Postgres schema with RLS on every table (each user sees only
their own rows), a trigger that auto-creates a `profiles` row on signup, and generated
TypeScript types importable across the app.

**Design:** `user_id` denormalized onto every table (simple/fast RLS: `user_id = auth.uid()`);
Postgres enums for `goal_type` (5k/10k/half/full) and `workout.type`
(easy/tempo/interval/long/rest); `workout.activity_id` FK links a planned workout to the
Strava activity that fulfilled it (1:1, for the Step 6 adaptive engine); `strava_accounts`
tokens are owner-scoped and written server-side only.

- **3.1 profiles** ☑ — 1:1 with `auth.users` + auto-create trigger + RLS + backfill.
  Verified: test signup auto-created a profile row; cascade-delete confirmed.
- **3.2 strava_accounts** ☑ — token storage; owner-read RLS, writes service-role only
  (client can't forge tokens).
- **3.3 activities** ☑ — normalized runs; owner-read RLS; unique (user, strava id).
- **3.4 plans + weeks + workouts** ☑ — enums (`goal_type`, `workout_type`), FKs,
  `workout.activity_id` → matched run, owner full-CRUD RLS on all three.
- **3.5 TS types** ☑ — generated → `src/lib/supabase/types.ts`, wired into all three
  clients (`createClient<Database>`); typecheck + build pass.
- **3.6 Verify** ☑ — `get_advisors`: fixed 2 SECURITY DEFINER warnings (revoked public
  EXECUTE on trigger fn); RLS clean on all 6 tables. *(Leaked-password/HIBP check is
  Supabase Pro-only — accepted limitation on free tier.)*

**Exit:** ☑ typed schema with RLS on every table; types importable across the app.

---

## Step 4 — Strava integration (OAuth + sync) ⭐
*One half of the showcase — a real third-party OAuth integration.*

**🎯 Goal:** a logged-in user can connect their Strava account (real OAuth), click
**"Sync now"**, and see their recent runs appear as normalized `activities` rows — with
automatic token refresh and graceful disconnect/revoke handling.

**Design / decisions (sensible defaults, flippable):**
- **Scope `activity:read`** (public activities). *(Flip to `activity:read_all` only if you
  want private runs to sync too.)*
- **Manual sync only** — a "Sync now" button, no webhooks/cron (same skill, far less infra).
- **Sync window:** most recent 100 activities, runs only.
- `STRAVA_CLIENT_SECRET` is **server-side only** (never `NEXT_PUBLIC_`); token writes use
  the **service-role** client (RLS blocks client writes); OAuth **`state`** param guards CSRF.

- **4.0 Credentials** ☑ — Strava app created (Client ID `262605`); keys in `.env.local`
  (gitignored, server-side); app boots.
- **4.1 Strava lib** ☑ — `/src/lib/strava`: `constants.ts`, `types.ts`, `oauth.ts`
  (`buildAuthorizeUrl`/`exchangeCode`/`refreshToken`/`deauthorize`, `server-only` guard).
- **4.2 Connect flow** ☑ — `GET /api/strava/connect`: httpOnly `state` cookie + redirect
  to Strava; button on `/dashboard`. **Verified live** (landed on Strava authorize).
- **4.3 Callback** ☑ — `GET /api/strava/callback`: validate `state`, `exchangeCode`, upsert
  into `strava_accounts` via service role. **Verified live** (row created: athlete 195840822,
  scope `read,activity:read`, tokens stored).
- **4.4 Token refresh** ☑ — `getValidAccessToken(userId)`: refreshes within 60s of expiry,
  rotates + persists. Code-verified (auto-fires near expiry).
- **4.5 Sync now** ☑ — `strava/{api,sync}.ts` + `syncStrava` action + button.
  **Verified live**: synced 12 runs, normalized correctly (km, pace s/km, dates); idempotent.
- **4.6 Disconnect / revoke** ☑ — `disconnectStrava` (best-effort `deauthorize`, then
  **clean-slate delete of activities + connection**); dashboard shows connected/not +
  recent runs + `?strava=` status banners (`revoked` → reconnect). Verified live.
- **4.7 Verify** ☑ — end-to-end connect → sync → runs appear → disconnect all confirmed;
  `/security-review` clean (no HIGH/MEDIUM: `state` CSRF, service-role token writes, no
  secret leak, no open redirect/SSRF).

**Exit:** ☑ a connected user's Strava runs appear as normalized activities via a Sync
button; tokens refresh automatically; disconnect is a clean slate.

---

## Step 5 — Plan generation engine ⭐ 🔁 Ralph Loop candidate
*The intellectual centerpiece — talk about this in interviews.*

**🎯 Goal:** a deterministic, unit-tested `generatePlan(input)` in `/src/lib/plan` that turns
`{ goalType, goalDate, daysPerWeek, currentFitness }` into a structured multi-week plan
(weeks → typed workouts) matching the DB schema shapes — with periodization, recovery
weeks, a progressive long run, and a taper. Same input → same output (no randomness).

**Algorithm rules (encoded as tests — the loop targets these):**
- **Plan length** = full weeks from next Monday to `goalDate`, clamped per goal:
  5k 4–12 · 10k 6–14 · half 8–16 · full 12–20.
- **Phases** base → build → peak → **taper** (final 1–2 weeks reduced).
- **Recovery week** every 4th week (~30% volume cut).
- **Weekly shape** by `daysPerWeek`: exactly **one long run**, ≥1 **rest** day, quality
  sessions (tempo/interval) scale with days, remainder **easy**.
- **Long run** progresses weekly, dips on recovery weeks, caps at a fraction of goal
  distance; every workout has a date on/before `goalDate`.

- **5.0 Test tooling** ☑ — `test` → `vitest run` (headless) + `test:watch`; `vitest.config.ts`
  with `@` alias. `npm test` runs headless & reports.
- **5.1 Types** ☑ — `plan/types.ts`: `PlanInput` (incl. `fromDate` for determinism),
  `GeneratedPlan/Week/Workout`, mirrors `goal_type`/`workout_type` enums. Compiles.
- **5.2 Tests FIRST** ☑ — `plan/generatePlan.test.ts`: 22 tests (clamping, Monday-aligned
  calendar, 1 long + Monday rest + `daysPerWeek` runs, quality sessions, volume sum,
  progression, phase ordering, recovery every 4th, taper, determinism, mid-week goal).
  **RED**: 9 failed / 13 passed (assertion-level).
- **5.3 Framework stub** ☑ — `plan/generatePlan.ts` typed stub; `npm test` runs red.
- **5.4 Ralph Loop** ☑ 🔁 — implemented `generatePlan` + `dates.ts`; **all 22 tests green**,
  typecheck + lint clean, deterministic. Loop cancelled (iteration 1).
- **5.5 Verify & review** ☑ — `/code-review` clean (no correctness bugs; determinism via
  UTC math, no `Date.now`). One noted edge for Step 8 (below). `createPlan` action + UI
  deferred to Step 8.

> **Step 8 TODO (from 5.5 review):** a non-Sunday `goalDate` drops the final week's Sunday
> long run (kept consistent with tests). Handle in the create-plan UI by snapping `goalDate`
> to its race-week Sunday, or place the race as the final workout on `goalDate`.

**Exit:** ☑ deterministic, unit-tested plan engine — 22 tests green, reviewed.

---

## Step 6 — Adaptive algorithm (planned vs actual) ⭐ 🔁 Ralph Loop candidate
*The other half of the centerpiece — what makes this more than a CRUD app.*

**🎯 Goal:** a deterministic, unit-tested `adaptPlan(input)` in `/src/lib/plan` that
evaluates a completed week (actual `activities` vs the planned week), classifies performance,
and recomputes upcoming weeks — while preserving history. Its metrics + reason feed the
Step 7 AI coach.

**Signals & rules (encoded as tests — the loop targets these):**
- **Match actuals → week** by date: an activity counts for the week whose Mon–Sun range
  contains its `startDate`. `completedRuns` = count; `actualDistanceM` = sum.
- **Metrics**: `completionRate = completedRuns / daysPerWeek`;
  `volumeRatio = actualDistanceM / plannedWeek.totalDistanceM`.
- **Classification** on `volumeRatio`: `< 0.7` → **scale_down** (factor 0.85);
  `> 1.15` → **scale_up** (factor 1.1); else **hold** (1.0). No activities → scale_down.
- **Apply** the factor to all **upcoming** weeks (> evaluated) — scale each workout's
  distance + week total; **past weeks unchanged** (history preserved); structure
  (weeks, phases, rest days, one long/week) intact. Deterministic.

- **6.0/6.1 Types** ☑ — `plan/adaptTypes.ts`: `ActivityInput`, `AdaptInput`, `WeekMetrics`,
  `Adjustment`, `AdaptationResult`. Compiles; pure.
- **6.2 Tests FIRST** ☑ — `plan/adaptPlan.test.ts`: 12 tests (metrics, classification +
  factors, history preserved, upcoming scaled, out-of-week ignored, no-runs → scale_down,
  last-week no-op, determinism). **RED**: 6 failing.
- **6.3 Framework stub** ☑ — `plan/adaptPlan.ts` typed no-op stub; `npm test` runs red.
- **6.4 Ralph Loop** ☑ 🔁 — implemented `adaptPlan`; **all 34 tests green** (12 adapt + 22
  plan), typecheck + lint clean. Loop started with `--completion-promise ADAPTDONE
  --max-iterations 8` → self-terminated cleanly (no manual cancel needed).
- **6.5 Verify & review** ☑ — reviewed: pure/deterministic, history preserved (weeks ≤ N
  unchanged), `hold` is a no-op, per-workout scaling with recomputed totals.

**Exit:** ☑ next week's plan visibly adapts to last week's actual performance — tests
green, reviewed, deterministic. Metrics + reason ready to feed the Step 7 AI coach.

---

## Step 7 — AI Coach (OpenAI) ⭐ (your "AI" bullet)
*A coaching layer on top of the deterministic algorithm — explains the data, doesn't
replace the engine. Keep all OpenAI calls server-side.*

**🎯 Goal:** the dashboard shows a short (2–4 sentence) AI-written coaching note for the
current week — grounded in **real numbers** the engine computed (plan phase, this week's
workouts, recent run summary, any adaptation) — that the LLM only *narrates*, never invents.
Server-side only; graceful fallback to a deterministic note if the key/API is missing;
cached so it isn't re-called on every page load.

**Architecture rule (from CLAUDE.md):** OpenAI receives **pre-computed facts** and returns
prose. It never computes distances, paces, or the plan. `OPENAI_API_KEY` is server-side only.

- **7.1 AI module** ☑ — `ai/coach.ts`: typed `CoachInput` → prompt → OpenAI (server-side,
  `server-only` guard, model `OPENAI_MODEL` default `gpt-4o-mini`); `fallbackNote`
  deterministic fallback on missing key / API error.
- **7.2 Data bridge** ☑ — `ai/coachInput.ts`: reconstructs the engine plan from DB rows,
  picks the current week, summarizes recent runs, runs `adaptPlan` on the last completed
  week (if real runs overlap) → `CoachInput`.
- **7.3 Caching** ☑ — migration `add_coach_note_to_weeks` (`coach_note`,
  `coach_note_generated_at`); note stored per week, reused on load, regenerated on demand.
- **7.4 UI** ☑ — dashboard "🧠 Coach" card with the current-week note + Generate/Regenerate
  action (`refreshCoachNote`); fallback styled the same.
- **7.5 Verify** ☑ — OpenAI + `gpt-4o-mini` access confirmed (HTTP 200); key hygiene clean
  (server-only, no `NEXT_PUBLIC_`, not in client bundle); build/typecheck/lint green.
  *(coach.ts can't be vitest-tested — `server-only` shim is Next-runtime only; browser
  click is the final e2e.)*

> **Data caveat:** your synced runs (June) don't overlap the new plan's weeks (Jul–Aug), so
> the *adaptation* narration won't shine until **Step 9 demo mode** seeds aligned data. The
> coach still gives a grounded current-week note now (phase, workouts, recent-run summary).

**Exit:** each week shows an AI-written coaching summary grounded in the user's real data,
with a safe server-side call and a working fallback.

---

## Step 8 — Core UI + polish  *(reordered before Step 7 — make the engine visible)*
*First thing any recruiter sees — worth extra time.*

**🎯 Goal:** a logged-in user can create a training plan from a short form and see it
rendered as a multi-week calendar on the dashboard — persisted to the DB, current week
highlighted — so the Step 5/6 engine becomes visible before we add the AI coach.

**Design defaults:** one active plan per user (creating archives the previous); create form
on a dedicated `/plan/new` page; plan renders on `/dashboard`; snap `goalDate` to its
race-week **Sunday** (handles the Step 5.5 note); `fromDate` = today (server-side);
plan generation is server-side (engine is pure) and persisted via the user session (RLS
owner-CRUD). Charts (`dataviz`) + full plan-vs-actual view are a later polish pass.

- **8.1 Persistence** ☑ — `plan/persistence.ts`: `savePlan` (replace-on-create: delete
  cascades old plan → one plan at a time), `getActivePlan` loads plan+weeks+workouts.
  RLS-scoped via user session. Verified: plan round-trips DB.
- **8.2 Create-plan form + action** ☑ — `/plan/new` + `createPlan` (zod-validated, snaps
  goal to Sunday, future-date check, `generatePlan` → `savePlan`). Verified: creates rows.
- **8.3 Plan view** ☑ — `PlanView`: weeks as a 7-day color strip (Long/Tempo/Intvl/Easy/
  Rest), phase badges, recovery markers, current-week highlight, weekly total.
- **8.4 Dashboard integration** ☑ — plan card (active plan) or "Create a plan" CTA; Strava
  card + recent runs kept below. Server components, typed props.
- **8.5 Verify** ☑ — browser end-to-end (created a half plan: 8 weeks, 56 workouts, DB
  verified); build + typecheck + lint + 34 tests green; reviewed (caught & fixed the
  orphaned-archived-plan issue).

**Later polish (this step or a follow-up):** activity feed, pace/volume charts (`dataviz`),
plan-vs-actual (apply `adaptPlan` to real synced runs), loading/empty/error states.

**Exit:** a logged-in user creates a plan and sees it as a multi-week calendar on the
dashboard — the Step 5/6 engine made visible.

---

## Step 9 — Demo mode ⭐ (showcase essential)
*No recruiter will connect their own Strava. This is what makes the live link explorable.*

**🎯 Goal:** a signed-out visitor clicks **"Try the demo"**, lands on a fully populated
`/dashboard` (no signup) — a mid-stream training plan, several weeks of real "actual" runs,
and an AI coach note that narrates a *genuine* adaptation the engine computed from that data.

**Design / decisions (sensible defaults, flippable):**
- **Single shared demo account** (`DEMO_EMAIL` / `DEMO_PASSWORD`, server-side env). "Try the
  demo" signs into it — a real Supabase session, no signup. *(Flip to per-visitor sandboxes
  only if abuse becomes a problem.)*
- **Seeded via a secret-guarded route** `POST /api/demo/seed` (guarded by `DEMO_SEED_SECRET`).
  Runs in the Next runtime so the `server-only` coach works and it's **re-runnable in prod on
  Vercel** — no standalone script, no new deps.
- **Plan is generated mid-stream:** goal date ~3 weeks out so the deterministic engine clamps
  to its min length (half = 8 wks) and yields **~4–5 completed weeks + a current week + taper**.
  Synthetic `activities` fill the completed weeks; the **most-recent completed week is
  deliberately under-target (~60%)** so `adaptPlan` classifies **scale_down** — a real, visible
  adaptation for the coach to explain.
- **Shared account is guarded read-only:** destructive actions (create plan, disconnect, sync)
  are blocked + hidden for the demo user; **Regenerate note is kept** (shows the AI live).

- **9.1 Demo config + env** ☑ — `DEMO_EMAIL`, `DEMO_PASSWORD`, `DEMO_SEED_SECRET` in
  `.env.local` + documented in `.env.example`; `src/lib/demo/config.ts` with `isDemoEmail()`.
  - ✅ **Success:** typecheck + lint pass; `isDemoEmail` true only for the demo address;
    `.env.example` documents all three vars (no secrets committed).
- **9.2 Seed builder + test** ☑ — `src/lib/demo/seed.ts`: a pure builder →
  `{ planInput, activities }`, dates computed relative to a passed `today` so it's stable on
  any run date. Fills completed weeks with aligned runs; last completed week under-target.
  - ✅ **Success:** a unit test (fixed `today`) asserts the generated plan has **≥3 completed
    weeks + a current week + ≥1 future week**, and that `adaptPlan` on the last completed week
    returns **`scale_down`**. `npm test` green.
- **9.3 Seed route** ☑ — `POST /api/demo/seed` (secret-guarded): idempotently ensure the demo
  auth user; wipe its plan/activities/connection; `savePlan`; insert a dummy `strava_accounts`
  row + synthetic `activities`; pre-generate & store the coach note on the current week.
  - ✅ **Success:** calling it twice leaves **exactly one** active plan, N activities, one
    connection row, and a populated coach note (no duplicates); returns a JSON summary.
- **9.4 "Try the demo" flow** ☑ — `loginDemo` server action (signs into the demo account) +
  a real landing hero on `/` (replaces the Next boilerplate) with **Try the demo / Sign up /
  Log in**. *(Landing gets its full polish in Step 11.)*
  - ✅ **Success:** from a signed-out browser, "Try the demo" lands on `/dashboard` as the demo
    user with the seeded plan + coach note + recent runs visible — no signup.
- **9.5 Guard the shared account** ☑ — `isDemoEmail` gates `createPlan`, `disconnectStrava`,
  `syncStrava` (return early with a notice); dashboard hides those buttons for the demo user
  and shows a "You're exploring a read-only demo" banner; Regenerate kept.
  - ✅ **Success:** as the demo user the destructive buttons are absent/blocked and the seeded
    data survives clicking around; a normal signed-up user is unaffected.
- **9.6 Verify** ☑ — seed → Try demo → adapted coach note + calendar + runs; re-seed restores
  cleanly; `npm run typecheck && lint && build && test` green; `/code-review` on the diff.
  - ✅ **Success:** the full demo works from a fresh incognito session; all checks green.

**Exit:** anyone with the URL can click "Try the demo" and explore a live, populated app whose
AI coach explains a real adaptation from seeded data.

---

## Step 10 — Stripe subscriptions *(optional — skip unless you want the "payments" bullet)*
Cut from the core scope: high plumbing cost, near-zero demo value. Do this **only** if you
specifically want "integrated Stripe payments" on the resume — and if so, keep it minimal:
- ☐ One Stripe Checkout (test mode) "Upgrade to Pro" button.
- ☐ Webhook → store subscription state in a `subscriptions` table.
- ☐ Gate one feature behind Pro.

*(Skipping this is a perfectly good choice for a showcase.)*

---

## Step 11 — Landing page + deploy to Vercel  ◐ *(in progress)*

**Method:** Vercel **dashboard git-import** (auto-deploy on push + preview deploys).

- ☑ **Landing page** — real hero on `/` (replaces Next boilerplate): tagline, three feature
  cards, **Try the demo** / **Sign up** / **Log in**. *(Built in Step 9; screenshot/GIF still
  to add to the README after deploy.)*
- ☑ **README** — recruiter-facing: live-URL placeholder, stack, "why it's interesting"
  (deterministic engine + AI narration), architecture, local dev, env table, seed instructions.
  Committed + pushed (`7a89f87`). *(Live URL + screenshot filled in after first deploy.)*
- ☑ **Repo pushed** — `main` @ `7a89f87` on GitHub; `step-9` tag pushed.
- ☐ **Import repo to Vercel** — new project from `rev1nth7/Pace-Coach` (Next.js auto-detected).
- ☐ **Configure env vars** (Production + Preview) — all 11 from `.env.local`:
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
  `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `OPENAI_API_KEY`, `DEMO_EMAIL`, `DEMO_PASSWORD`,
  `DEMO_SEED_SECRET`, plus `STRAVA_REDIRECT_URI` + `NEXT_PUBLIC_SITE_URL` (set to the prod URL
  once known — temp values are fine for the first build).
- ☐ **First deploy** → capture the production URL (`https://<domain>.vercel.app`).
- ☐ **Wire the prod URL** — set `STRAVA_REDIRECT_URI=https://<domain>/api/strava/callback` +
  `NEXT_PUBLIC_SITE_URL=https://<domain>`, redeploy.
- ☐ **Strava** — set Authorization Callback Domain to `<domain>` (Strava → settings → API).
- ☐ **Supabase** *(optional)* — add `<domain>` to Auth → URL Configuration → Site URL.
- ☐ **Seed prod** — `curl -X POST https://<domain>/api/demo/seed -H "x-seed-secret: <secret>"`.
- ☐ **Smoke-test** — Try-the-demo (populated), signup/login, Strava connect, plan gen, adapt,
  AI coach note.
- ☐ **Finish README** — drop in the live URL + a dashboard screenshot; commit + push.
- ☐ *(Optional)* flip the GitHub repo to **public**.

**Blocked on:** user completing the Vercel import + first deploy, then handing back the prod
URL (the callback/site-URL wiring and prod seeding follow from it).

**Exit:** PaceCoach is live on Vercel with a shareable URL and a resume-ready README.

---

### Working conventions (from CLAUDE.md)
- Server components by default; `"use client"` only when interactivity is needed.
- Business logic lives in `/src/lib`, not in components.
- Supabase client setup lives in `/src/lib/supabase`.
- Env vars in `.env.local`, never hardcoded.
- Keep components small and typed with explicit interfaces/types.
