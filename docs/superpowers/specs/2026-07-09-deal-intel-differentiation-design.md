# Deal Intelligence Differentiation Build — Design Spec

**Date:** 2026-07-09
**Owner:** Bin Zhu (BZG / The Pharma Closeout)
**Source:** Strategic review of the Deal Intelligence product (2026-07-09). Executes all 10 ranked moves, Tier 1–3.
**Execution model:** Fable 5 orchestrates; cheaper models (Sonnet for judgment-light code/content, Haiku for mechanical bulk) execute per-move. Every code build is test-first.

---

## 0. Guiding constraints (non-negotiable)

1. **Static host.** The site is plain HTML/JS on GitHub Pages, data read live from Supabase (publishable key). **There is no server-side backend.** Any move implying a backend (email gating, server compute) must be re-scoped to a client-side or third-party-service approach.
2. **Two repos, two substrates (critique round 1).** This repo — `the-pharma-closeout` (frontend + tests, git remote `xadrol-cloud/the-pharma-closeout`) — owns HTML/JS/pure-logic and closes its own TDD loop. The **`BD Data Base` repo lives in the parent BZG directory, NOT here** (confirmed: `../BD Data Base`). All DB migrations, the `deals_enriched` view, and enrichment (service-key writes, web research) are **out-of-repo dependencies**. Moves 2/3/5 therefore split: their frontend parts are in-repo and testable here; their **DB + enrichment parts cannot be committed or `npm test`-verified from this repo** and are tracked as external prerequisites with data-density preconditions.
3. **Zero fabrication.** All enrichment (editorial_lede, upfront, outcomes) is primary-source-gated per `methodology.html` and the BD `research-standards` SOP. Undisclosed → NULL, never a guessed value. (Ref: prior corrections — Sonnet over-relies on Wikipedia; `fill_sources.py` fabricates and is banned.)
4. **`deals_enriched` is a VIEW**, not a table; writes go to the base `deals` table. `critic_score`/`outcome_score` are computed in the view. The view DDL is **not checked in** — never blind-rewrite it; always `pg_get_viewdef` first, then `CREATE OR REPLACE`. **`CREATE OR REPLACE VIEW` is append-only for columns** (Postgres forbids renaming/reordering/removing existing output columns) — new columns (`editorial_lede`, `upfront_usd_mm`) MUST be appended at the tail of the projection, never interleaved. No `DROP`.
5. **Move 1 is already shipped** this session (outcome-unlock gating, unit-tested 8/8). Included here only for verification and regression-locking.
6. **Test-first, with a real gate (critique round 1).** No implementation lands without a failing test first, then code, then green. **Two suites, separated so the offline gate is enforceable:**
   - `npm run test:unit` → `node --test tests/*.unit.mjs` — **offline, deterministic, zero network/env.** This is the real CI gate. Covers all pure logic AND "render-smoke."
   - `npm run test:integration` → env-gated (`bd-env.sh`, live Supabase) — data-shape checks; NOT a merge blocker (network-dependent).
   - **"Render-smoke" is defined concretely** as offline **string-assertion** tests: the pure HTML-string render functions (`renderHypeGap`, `renderScorePill`, `renderResultRow`, new `acquirers`/`hindsight`/`comparable` renderers) are extracted into a CDN-free module (`scoring.js` or a sibling `render.js`) so `node --test` can import them and assert on substrings (e.g. `renderHypeGap(fixture)` contains `hg-verdict` and `+12`). There is NO DOM/Playwright harness; "render-smoke" never means a browser.
   - **Env reality:** `node_modules` is not installed and integration needs creds. WS-0 must add `test:unit`/`test:integration` scripts so the pure suite runs with zero setup.

---

## 1. Enabling workstream — WS-0: Testability foundation

**Problem:** `assets/deals.js` imports Supabase from a CDN URL, so `node --test` cannot import it; the existing test (`tests/deals_search.spec.mjs`) *re-implements* query logic, which drifts from production. Every new pure function (gates, aggregations, Biobucks math, hype-gap) needs to be unit-testable directly.

**Design:** Extract pure, dependency-free logic into `assets/scoring.js` (no CDN imports): `outcomeUnlockYear`, `isOutcomeUnlocked`, `displayOutcomeScore`, `hypeGap`, `hypeGapLabel`, `tierForScore`, `tierLabelFor`, plus new `biobucksPct`, `acquirerBattingAverage`, `comparableOutcomeSummary`. `deals.js` imports and re-exports them (back-compat: existing importers unchanged). `format.js`'s `isPlausibleDate` moves or is imported by `scoring.js`.

**Interface:** `scoring.js` exports pure functions `(input) => value`, no I/O. **Test:** `tests/scoring.test.mjs` unit-tests each (including the 8 gate cases already validated). This is the prerequisite for TDD on Moves 3, 6, 9.

**Feasibility — CONFIRMED (2026-07-09):** `assets/format.js` has zero imports and is directly `node`-importable (exports `formatDate, formatValue, isPlausibleDate`). So `scoring.js` importing only from `format.js` is `node --test`-loadable without touching the CDN Supabase import in `deals.js`. No circular-import risk: dependency is one-way `deals.js → scoring.js → format.js`.

**WS-0 done-definition (critique round 1 — hard requirements):**
- `scoring.js` imports `./format.js` with **NO `?v=` query string** (Node ESM would try to resolve a file literally named `format.js?v=…` and fail). Browser cache-busters stay only in HTML and in `deals.js`.
- `scoring.js` (and the extracted render module) get their **own `?v=` version**, and **all five HTML consumers + `deal.html`'s import list must bump `deals.js?v=` in lockstep** (`compare/deal/deals/hype-gap.html` currently pin `deals.js?v=20260709a`) or a browser serves a stale `deals.js` against a new `scoring.js` shape.
- Collapse the **one known divergence**: `renderHypeGap` currently reads raw `deal.outcome_score` for display while `hypeGap()` uses `displayOutcomeScore` — route both through the single gated source in `scoring.js`.
- Add `package.json` scripts `test:unit` (offline) and `test:integration` (env-gated); move the existing live test to `*.integration.mjs`.
- Regression-lock Move 1: the 8 gate cases become `tests/scoring.unit.mjs` fixtures.

---

## 2. WS-A — Data model + enrichment (Moves 2, 3, 5)

All three require base-column adds + a view recreate (the staged migration `BD Data Base/migrations/2026-07-09_add_editorial_lede_and_upfront.sql`) and enrichment runs via the BD pipeline with the service key.

### Move 2 — Wire the editorial "take"
- **Field reconciliation (critique round 1):** the frontend reads TWO different columns — `deal.html:360` renders `editorial_lede`; `deals.js:728` (`renderFeaturedInfo`, the featured card) renders `editorial_summary`. **Decision: standardize on `editorial_lede`** as the single "take" field; update `renderFeaturedInfo` to read `editorial_lede` (fall back to `editorial_summary` if present for back-compat). Enumerate all render sites in the plan so Move 2 lights up every surface, not just `deal.html`.
- **DB:** add `editorial_lede text` to `deals`; append to view projection (append-only). Frontend renders after the `renderFeaturedInfo` fix above.
- **Enrichment:** cheaper-model pass generates a 1–2 sentence editorial verdict per deal, grounded in that deal's existing sourced facts (summary, outcome, sources) — **no new claims**. Tone = the Pharma Closeout house voice (a verdict, not a summary). Populate highest-traffic first (dual-scored + featured + recent), not all 1,307 at once.
- **Test:** migration verified by `count(editorial_lede IS NOT NULL)`; a sample audit that no lede introduces a figure absent from the deal's sources; render smoke that `.feat-lede` shows.

### Move 3 — Capture structured upfront + Biobucks Index
- **DB:** add `upfront_usd_mm numeric`; recreate view. Cascade bar (`renderCascadeBar`) and Excel export already reference it → light up for free.
- **Enrichment:** extract upfront/at-signing consideration from each deal's SEC 8-K / PR sources (Tier 1–2 only); undisclosed → NULL. Licensing deals prioritized (upfront-% is the point).
- **New surface:** `biobucksPct(deal)` pure fn + an aggregate "Biobucks Discount" stat (avg upfront-% across licensing deals) surfaced as a stat card on `methodology.html` and/or a compact block on the deals hero. **Test:** unit-test `biobucksPct` (edge cases: upfront≥total, null, zero); integration test the aggregate query; verify cascade renders when upfront populated.

### Move 5 — Backfill outcome scores on marquee pre-2019 deals
- **Scope guardrail (SIZED 2026-07-09):** NOT all pre-2019 deals. Live counts of pre-2019 deals missing `outcome_score`: **229 at ≥$1B**, 353 at ≥$500M, 558 at any value. **Batch 1 = the 229 ≥$1B deals** (bounded, highest-search, biggest Hype-Gap payoff). ≥$500M (next 124) and the long tail are explicitly DEFERRED to later batches. Produce the exact ID list by query first; log the count and any deals deliberately excluded (no silent caps).
- **Execution — CORRECTED (BLOCKER, verified 2026-07-09):** the assumed reusable `bd-deal-review` workflow **does not exist**. The real `BD lookup tool/BD Data Base/scripts/` holds 294 hand-written one-off per-deal scripts, not a parameterized runner. **Prerequisite = build the reusable harness first** (argv/ID-list-driven: reads DB state → web-researches per `research-standards.md` Historical-Deal Protocol → scores 4 dims → per-deal commit → structured result), then run **small batches (25–50), traffic-prioritized**, audit-per-batch. Cheaper models. This is a standing operational process, not a one-shot.
- **Test:** per batch — coverage delta verified; **real claim-tracing audit** (see R2) run on 100% of the batch, not a sample; Hype Gap leaderboard re-checked (mature deals only).

---

## 3. WS-B — Frontend features (Moves 4, 6, 9; Move 1 done)

### Move 4 — Make the Hype Gap the hero
- Restructure `deals.html` hero + `index.html#deal-intelligence` to LEAD with the value prop ("the only database that grades how deals aged") and a live Hype-Gap teaser (a marquee over-hyped/under-rated pair using the `said X · did Y` device), replacing the price-anchor strip as the primary message (keep price as secondary proof). Pure frontend/CSS + a small fetch of top gap deals (reuse hype-gap.html query, gated by `isOutcomeUnlocked`).
- **Test:** render-smoke that hero shows the hype-gap teaser and value-prop headline; the teaser only lists unlocked deals; no layout overflow (mobile).

### Move 6 — Acquirer Track Records
- **New page** `acquirers.html` + `fetchAcquirerRecords()` + pure `acquirerBattingAverage(deals)` (aggregate unlocked outcome scores by `buyer_name`: n deals, mean outcome, % "Met Thesis+", best/worst deal). Rank buyers; link each to a filtered deals view. Minimum-n guard (≥3 unlocked scored deals) so averages aren't noise.
- **Data density — CONFIRMED (2026-07-09):** 25 buyers already have ≥3 unlocked outcome-scored deals; the big acquirers have 8–16 each and means are genuinely differentiated (J&J 75 vs Gilead 54 vs Bayer 57) — a real story, not noise. **Required detail:** light buyer-name normalization/canonicalization before grouping (e.g., "GSK plc" vs "GlaxoSmithKline plc"; "Johnson & Johnson" vs "Johnson & Johnson (Jan…)"). Build a small alias map; unit-test the canonicalizer. Move 5 backfill will thicken these records further.
- **Test:** unit-test the aggregation (min-n filter, mean, tie-break) with fixtures; integration test the fetch; render-smoke.

### Move 9 — "How comparables aged" for fresh (locked) deals
- On `deal.html`, when a deal's own outcome is locked, render a panel: pull its comparables (same TA/type, `fetchComparables`), keep only unlocked ones, and summarize via pure `comparableOutcomeSummary(comps)` (n, median outcome, distribution, best/worst). Framing: "Deals like this one historically scored X" — insight without fabricating THIS deal's outcome. Complements the Move-1 suppression.
- **Test:** unit-test `comparableOutcomeSummary`; verify panel only appears when own outcome locked AND ≥3 unlocked comps exist; render-smoke.

---

## 4. WS-C — Content-driven surfaces (Moves 7, 10) + Move 8

### Move 7 — Annual "Deals of the Year, in hindsight"
- **New page** `hindsight.html`: for each recent year cohort (deals whose outcome has now unlocked), rank by outcome score; "aged best / aged worst" columns (mirrors hype-gap.html structure). Pure ranking over the live view. Doubles as recurring shareable content.
- **Test:** integration query returns cohorts; only unlocked deals; render-smoke.

### Move 8 — Deal Sheet export (re-scoped for static host)
- **Constraint:** no backend → true email-gating impossible server-side. **Re-scope:** ship the currently-disabled "Deal Sheet" button as a **client-side printable one-pager** (a clean print/PDF view of the deal — scores, financials, cascade, timeline, sources). "Gate" becomes a **soft** capture: on first use, show the Substack subscribe embed (existing) with a "subscribe to unlock exports" nudge; unlock is honor-system/localStorage, OR wire a third-party form (Formspree free tier) if Bin wants real capture. **Decision needed at execution:** soft-gate (recommended, zero new infra) vs Formspree.
- **Test:** the deal-sheet view renders all sections and is print-clean (`@media print`); button no longer disabled; smoke that export opens.

### Move 10 — Weekly Hype Gap content format
- **Not repo code** — a content mechanism for the podcast/newsletter engine. Deliverable = a template (`docs/marketing/hype-gap-weekly-template.md`) defining the recurring unit (pick the week's most notable newly-unlocked or high-gap deal → `said X · did Y` → 120-word take → link), PLUS an optional generator script that queries the top current gap deal and drafts the LinkedIn/newsletter copy for editorial review. Ties to the existing content flywheel; execution = template + generator, not a site page.
- **Test:** generator produces a draft from live data; template documented.

---

## 5. Sequencing & dependencies (REVISED after two-critic review + verification)

Both adversarial reviews converged: **do not commit all 10 at once.** The differentiation thesis ("the only database that grades how deals aged") is carried by outcome scores that ALREADY exist (31% coverage) plus browse/rank/compare. The lowest-cost, zero-fabrication moves deliver ~80% of the value. Staged:

**Step 0 (Bin, out-of-repo, gates all of WS-A):** run `pg_get_viewdef('deals_enriched')` on **live Supabase (Postgres)** → `CREATE OR REPLACE VIEW` appending `editorial_lede` + `upfront_usd_mm` at the tail. (Reference DDL exists in `BD lookup tool/BD Data Base/database/schema.sql:205`, but that is the **SQLite mirror** — the live Postgres viewdef is authoritative and may have drifted.) Nothing in WS-A renders until this runs.

**BUILD 1 — in-repo, zero new enrichment, zero fabrication risk, executable now (this is what Fable orchestrates this cycle):**
1. **WS-0** testability foundation — prerequisite for all code.
2. **Move 4** Hype Gap hero — pure frontend over existing data.
3. **Move 6** Acquirer Track Records — pure aggregation over the **existing** 262 unlocked scored deals / 25 qualifying buyers. No enrichment.
4. **Move 9** comparables panel — pure aggregation. No enrichment.
5. **Move 10 generator script ONLY** — reuses Move 4's gap query; cheap.
6. **Move 3 FRONTEND prep** — `biobucksPct` fn + cascade already coded; renders live only after Step 0 + upfront data exist. Build+test the logic now; data lights up later.

**BUILD 2 — after Build 1 ships/validates AND the fabrication-audit tool (§2, R2) is built and tested:**
7. **Move 2** editorial_lede — highest fabrication risk (synthesized verdict text). Gated behind: real claim-tracing audit script + **100% human review of the first small high-traffic batch** (not a sample). Do not scale until batch 1 passes clean.
8. **Move 7** hindsight cohorts — pure ranking over existing/deepened data; low risk.
9. **Move 3 DATA** — upfront extraction enrichment (SEC 8-K, undisclosed→NULL).

**DEFERRED / RE-SCOPED / CUT:**
- **Move 5 — DEFERRED, premise corrected (BLOCKER found).** There is **no reusable enrichment pipeline**; the "bd-deal-review workflow" does not exist — verified: 294 hand-written one-off `review_*.py`/`_enrich_deal_*.py` scripts + no parameterized runner. Move 5 = *build the harness first*, then run **small traffic-prioritized batches (25–50 deals)** with full audit-per-batch, funded incrementally based on whether Build 1 drives engagement. NOT a one-shot 500-deal program. It is a depth play, not the headline.
- **Move 8 — CUT the gate.** A localStorage/honor-system "email gate" is theater (bypassable, captures nothing, invisible to returning/private-window users). Ship the Deal Sheet export **fully open** (friction fights the differentiation goal) + a **persistent, non-gating** newsletter CTA beside it. Real capture, if wanted, = Formspree as its own task — not a fake gate first.
- **Move 10 template — RECLASSIFY** as a content-ops artifact handed to the podcast/newsletter engine's existing research-spine flow. Only the generator script is a build item (in Build 1). Decoupled from Move 5 — current 31% coverage already yields weekly gap candidates.

**Data-density preconditions (definition-of-done gates):** Moves 6/7/9 are "buildable now, *meaningful* only above a data floor." Each ships with a min-qualifying-rows guard (6: ≥3 unlocked scored deals per canonical buyer; 9: ≥3 unlocked comps; 7: ≥N unlocked deals per year cohort) and renders nothing below it rather than showing noise.

**Move 1** — DONE; regression-locked in `tests/scoring.unit.mjs`.

## 6. Execution & testing model

- **Orchestrator:** Fable 5 (me), via the Workflow tool. **Workers:** Sonnet (code + editorial content requiring judgment), Haiku (mechanical). Enrichment runs use the existing BD `bd-deal-review` workflow.
- **Per code move (TDD):** (1) write failing test in `tests/`; (2) implement; (3) `npm test` green; (4) render-smoke; (5) revise. Cache-buster bumped on any `deals.js`/asset change.
- **Per data move:** ID-list query → enrichment subagents (per-deal commit, zero fabrication) → coverage delta verified → fabrication sample audit.
- **Deploy:** code changes committed on a feature branch; **push/merge only on Bin's explicit go** (outward-facing). DB migrations applied by Bin/service-key step (needs live view DDL).

## 7. Risks & open decisions (stress-test targets)

- **R1 — Move 8 email gate:** unsolvable server-side on static host. Default to soft-gate; Formspree if real capture wanted. *Decision.*
- **R2 — Enrichment fabrication (Moves 2,3,5):** highest program risk. **"Sample audit" was hand-waving; corrected.** The only existing tool, `audit_sources.py`, is a **regex fingerprint matcher for `fill_sources.py`'s exact template phrases** ("industry observers note", "analysts view … as a strategic") — it catches a re-run of that one incident and nothing else; it is useless against free-generated `editorial_lede`/outcome prose. **Required new guardrail (build before Move 2/5 enrichment):** a claim-tracing audit script that, for each new write, extracts every proper noun / number / date / superlative and grep-verifies each against that deal's stored `deal_sources` excerpts, flagging any claim that doesn't trace. Plus: prompts include the deal's `deal_sources` excerpts verbatim as the ONLY licensed evidence; `editorial_lede` skipped (NULL) below a min-source threshold rather than filled; 100% human review of batch 1. `editorial_lede` is higher-risk than 3/5 (synthesized verdict, not structured fact) — treat accordingly.
- **R3 — Move 5 cost:** ~500 deals × ~66K tokens is a large spend. Mitigation: tight ID list, cheaper models, batch + checkpoint, no silent caps (log exclusions).
- **R4 — View recreate needs live DDL:** blocks 2,3 until the `pg_get_viewdef` + service-key step runs. Frontend for 2,3 already exists, so no frontend block.
- **R5 — Scope realism:** 10 moves is a program, not a sprint. WS-0 + WS-B + WS-A migrations are the high-leverage, low-risk core; Move 5 enrichment and Move 10 are longer tails. Ship in dependency order; each move independently valuable.
- **R6 — Critic=100 compression** (92 deals tie at 100) degrades Hype-Gap hero quality (Move 4). Optional adjunct: tie-break sentiment granularity. Out of the 10 but noted.
