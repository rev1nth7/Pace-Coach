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

- **5.0 Test tooling** — set `test` script to `vitest run` (headless, non-watch) so the
  loop/`npm test` don't hang; add `test:watch`. ☑ *when:* `npm test` runs headless & reports.
- **5.1 Types** — `plan/types.ts`: `PlanInput`, `GeneratedPlan/Week/Workout` aligned to the
  `goal_type`/`workout_type` enums + DB insert shapes. ☑ *when:* compiles; mirrors schema.
- **5.2 Tests FIRST** — `plan/generatePlan.test.ts`: full spec (week count vs goal/date,
  day assignment per `daysPerWeek`, exactly 1 long + ≥1 rest/week, long-run progression +
  recovery every 4th + taper, determinism/idempotency, dates ≤ goalDate).
  ☑ *when:* tests written and **RED** against the stub (assertion failures, not compile errors).
- **5.3 Framework stub** — `plan/generatePlan.ts` signature returning a typed stub so tests
  compile & run red. ☑ *when:* `npm test` executes; failures are assertion-level.
- **5.4 Ralph Loop** 🔁 — run `ralph-loop` to implement `generatePlan` until all tests green.
  ☑ *when:* 100% of tests pass; output deterministic.
- **5.5 Verify & review** — `/code-review` the generated algorithm; confirm determinism
  (run twice → identical). *(A `createPlan` server action + UI is deferred to Step 8.)*
  ☑ *when:* green + reviewed + deterministic.

**Exit:** given user inputs, generate a structured, testable training plan (tests green,
reviewed, deterministic).

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
