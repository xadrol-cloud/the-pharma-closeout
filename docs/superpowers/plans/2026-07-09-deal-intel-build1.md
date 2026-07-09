# Deal Intelligence — Build 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Ship the zero-fabrication differentiation core — extract a test-covered pure-logic module, then build Acquirer Track Records, the "comparables aged" panel, the Hype-Gap hero, the weekly-gap generator, and Biobucks math — all over data that already exists.

**Architecture:** All pure logic (gates, aggregations, hype-gap, biobucks, buyer canonicalization, HTML-string renderers) lives in a new CDN-free `assets/scoring.js`, importable by both the browser (`deals.js` re-exports) and `node --test` (offline). New pages/panels call thin Supabase fetchers in `deals.js` that hand rows to the pure functions. No backend, no enrichment.

**Tech Stack:** Vanilla ESM, Supabase-js (browser CDN), Node built-in test runner (`node --test`), static GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-07-09-deal-intel-differentiation-design.md`

**Branch:** `deal-intel-differentiation-2026-07` (already checked out; Move 1 + spec committed).

---

## File structure

- **Create** `assets/scoring.js` — pure, CDN-free. Imports ONLY `./format.js` (no `?v=`). Exports: existing gate/hype/tier fns moved from `deals.js` (`outcomeUnlockYear, isOutcomeUnlocked, displayOutcomeScore, hypeGap, hypeGapLabel, tierForScore, tierLabelFor`) + new (`biobucksPct, canonicalBuyer, acquirerBattingAverage, comparableOutcomeSummary`) + pure renderers (`renderHypeGap` moved here).
- **Modify** `assets/deals.js` — import + re-export from `scoring.js` (back-compat); add fetchers `fetchTopGapDeals`, `fetchAcquirerRecords`; fix `renderFeaturedInfo` divergence is out-of-scope (Move 2). Bump internal `./scoring.js?v=` + all HTML `deals.js?v=`.
- **Create** `assets/scoring.js` consumers: `acquirers.html` (Move 6).
- **Modify** `deal.html` (Move 9 panel), `deals.html` + `index.html` (Move 4 hero).
- **Create** `tests/scoring.unit.mjs` — offline unit + string-assertion "render-smoke".
- **Rename** `tests/deals_search.spec.mjs` → `tests/deals_search.integration.mjs`.
- **Modify** `package.json` — `test:unit`, `test:integration` scripts.
- **Create** `scripts/weekly_hype_gap.mjs` (Move 10 generator).

**Cache-buster:** bump `deals.js?v=20260709a → 20260709b` in `compare.html deal.html deals.html hype-gap.html`, and add `scoring.js?v=20260709b` wherever imported. Verify with grep that all references match before commit.

---

## Task 1 — WS-0: extract `scoring.js`, split test suites, regression-lock Move 1

**Files:** Create `assets/scoring.js`, `tests/scoring.unit.mjs`; Modify `assets/deals.js`, `package.json`; Rename `tests/deals_search.spec.mjs`.

- [ ] **Step 1 — Write failing unit tests** in `tests/scoring.unit.mjs`. Import from `../assets/scoring.js`. Cover the 8 Move-1 gate cases (2026→null, 2025→null, 2022→null, 2021→score, 2014→score, close_date-overrides, null-outcome→null, no-date→score) plus `hypeGap` (both scores present → cs−os; locked → null) and `tierForScore` bands.

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { displayOutcomeScore, hypeGap, tierForScore } from '../assets/scoring.js'
const CUR = new Date().getUTCFullYear()
test('outcome suppressed until 5yr after close/announcement', () => {
  assert.equal(displayOutcomeScore({announcement_date:`${CUR}-05-29`, outcome_score:58}), null)
  assert.equal(displayOutcomeScore({announcement_date:`${CUR-5}-01-01`, outcome_score:72}), 72)
  assert.equal(displayOutcomeScore({announcement_date:`${CUR-4}-01-01`, close_date:`${CUR-3}-01-01`, outcome_score:65}), null)
  assert.equal(displayOutcomeScore({outcome_score:80}), 80)              // no date → show
  assert.equal(displayOutcomeScore({announcement_date:`${CUR-10}-01-01`, outcome_score:null}), null)
})
test('hypeGap null unless both present and unlocked', () => {
  assert.equal(hypeGap({critic_score:90, outcome_score:60, announcement_date:`${CUR-10}-01-01`}), 30)
  assert.equal(hypeGap({critic_score:90, outcome_score:60, announcement_date:`${CUR}-01-01`}), null) // locked
  assert.equal(hypeGap({critic_score:90, outcome_score:null}), null)
})
test('tierForScore bands', () => {
  assert.equal(tierForScore(95),'exceptional'); assert.equal(tierForScore(80),'strong')
  assert.equal(tierForScore(65),'adequate'); assert.equal(tierForScore(45),'weak'); assert.equal(tierForScore(20),'failed')
})
```

- [ ] **Step 2 — Run, verify FAIL.** `node --test tests/scoring.unit.mjs` → FAIL (module/exports missing).
- [ ] **Step 3 — Create `assets/scoring.js`.** Move the pure fns out of `deals.js` verbatim (gate helpers, `hypeGap`, `hypeGapLabel`, `tierForScore`, `tierLabelFor`, `renderHypeGap`). Add at top: `import { isPlausibleDate } from './format.js'` (NO `?v=`). Export everything.
- [ ] **Step 4 — Rewire `deals.js`.** Replace the moved definitions with `import { ... } from './scoring.js?v=20260709b'` then `export { ... }` (preserve every existing named export so importers in `deal.html`/`deals.html` keep working). Route `renderHypeGap` display through `displayOutcomeScore` (collapse the raw-`outcome_score` divergence).
- [ ] **Step 5 — Run unit tests, verify PASS.** `node --test tests/scoring.unit.mjs` → PASS.
- [ ] **Step 6 — Split suites.** `git mv tests/deals_search.spec.mjs tests/deals_search.integration.mjs`. In `package.json` scripts: `"test:unit": "node --test tests/*.unit.mjs"`, `"test:integration": "node --test tests/*.integration.mjs"`, `"test": "npm run test:unit"`.
- [ ] **Step 7 — Bump cache-busters** to `20260709b` across the 4 HTML files' `deals.js?v=` and add `scoring.js?v=20260709b` in `deals.js`'s import. `grep -rho "deals.js?v=[0-9a-z]*" *.html | sort -u` → single value.
- [ ] **Step 8 — Full check.** `node --check assets/scoring.js && npm run test:unit` → green. `git add -A && git commit -m "WS-0: extract scoring.js, split test suites, lock Move 1"`.

---

## Task 2 — Move 6: Acquirer Track Records (pure aggregation over existing scores)

**Files:** Modify `assets/scoring.js` (+ tests), `assets/deals.js` (fetcher); Create `acquirers.html`.

- [ ] **Step 1 — Failing tests** for `canonicalBuyer` and `acquirerBattingAverage` in `tests/scoring.unit.mjs`.

```js
import { canonicalBuyer, acquirerBattingAverage } from '../assets/scoring.js'
test('canonicalBuyer folds name variants', () => {
  assert.equal(canonicalBuyer('Pfizer Inc.'), canonicalBuyer('Pfizer Inc'))
  assert.equal(canonicalBuyer('GSK plc'), canonicalBuyer('GlaxoSmithKline plc'))
})
test('acquirerBattingAverage: min-n guard + mean, only unlocked scored', () => {
  const CUR = new Date().getUTCFullYear()
  const d = (b,os,y)=>({buyer_name:b, outcome_score:os, announcement_date:`${y}-01-01`})
  const rows = [d('Pfizer Inc.',80,2010), d('Pfizer Inc',60,2011), d('Pfizer',70,2012),
                d('Tiny Co',90,2010), d('Locked Co',99,CUR)]  // Tiny <3, Locked unlocked=false
  const recs = acquirerBattingAverage(rows, {minN:3})
  assert.equal(recs.length, 1)
  assert.equal(recs[0].n, 3); assert.equal(recs[0].mean, 70)
  assert.equal(recs[0].buyer, canonicalBuyer('Pfizer Inc.'))
})
```

- [ ] **Step 2 — Run, verify FAIL.**
- [ ] **Step 3 — Implement** `canonicalBuyer(name)` (strip legal suffixes Inc./Ltd./plc/AG/SA/Corp; a small alias map for known splits e.g. GSK↔GlaxoSmithKline, BMS↔Bristol-Myers Squibb; lowercase/trim key) and `acquirerBattingAverage(deals,{minN=3})` (filter `displayOutcomeScore!=null`, group by `canonicalBuyer`, compute n/mean/pctMetThesis(≥60)/best/worst, drop groups < minN, sort by mean desc).
- [ ] **Step 4 — Run, verify PASS.**
- [ ] **Step 5 — Add fetcher** `fetchAcquirerRecords()` in `deals.js`: select `buyer_name, outcome_score, announcement_date, close_date, target_name, deal_id` where `outcome_score not null`, non-archived, limit 2000; return `acquirerBattingAverage(rows)`.
- [ ] **Step 6 — Create `acquirers.html`** (clone `hype-gap.html` structure/nav/footer): ranked list of buyers with n, mean tier-chip, best/worst deal links. Min-n guard message if empty. Uses `deals.js?v=20260709b`.
- [ ] **Step 7 — Integration test** `tests/acquirers.integration.mjs`: `fetchAcquirerRecords()` returns ≥10 buyers, every `n>=3`, means in 0–100. (env-gated)
- [ ] **Step 8 — Verify live** via curl/node against Supabase (spot-check J&J≈75, Gilead≈54). `npm run test:unit` green. Commit.

---

## Task 3 — Move 9: "How comparables aged" panel for locked deals

**Files:** Modify `assets/scoring.js` (+tests), `assets/deals.js` (raise comparable limit), `deal.html`.

- [ ] **Step 1 — Failing test** for `comparableOutcomeSummary(comps)`:

```js
import { comparableOutcomeSummary } from '../assets/scoring.js'
test('comparableOutcomeSummary: needs >=3 unlocked, returns median+dist', () => {
  const CUR=new Date().getUTCFullYear(); const c=(os,y)=>({outcome_score:os,announcement_date:`${y}-01-01`})
  assert.equal(comparableOutcomeSummary([c(70,2010),c(50,2011)]), null) // <3 unlocked
  const s = comparableOutcomeSummary([c(80,2010),c(60,2011),c(40,2012),c(99,CUR)]) // last locked, excluded
  assert.equal(s.n, 3); assert.equal(s.median, 60)
})
```

- [ ] **Step 2 — Run, verify FAIL.**
- [ ] **Step 3 — Implement** `comparableOutcomeSummary(comps,{minN=3})`: keep `displayOutcomeScore!=null`, need ≥minN, return `{n, median, best, worst, distribution}` else null.
- [ ] **Step 4 — Run, verify PASS.**
- [ ] **Step 5 — Raise comparable fetch** in `deals.js` `fetchComparables` limit 5→20 (so ≥3 unlocked survive after filtering).
- [ ] **Step 6 — Wire panel** in `deal.html`: when own outcome is LOCKED (`displayOutcomeScore(deal)==null`) AND summary non-null, render a "How deals like this aged" panel ("N comparable deals · median outcome X · ranged A–B"). Reuses fetched comparables.
- [ ] **Step 7 — render-smoke** (string test): a `renderComparableAged(summary)` pure fn returns HTML containing `median` value and `comparable`. Assert offline.
- [ ] **Step 8 — Commit.** `npm run test:unit` green.

---

## Task 4 — Move 3 (frontend logic): Biobucks percentage

**Files:** Modify `assets/scoring.js` (+tests).

- [ ] **Step 1 — Failing test** for `biobucksPct(deal)`: mirrors `renderCascadeBar` clamp.

```js
import { biobucksPct } from '../assets/scoring.js'
test('biobucksPct: upfront/total, clamped, null-safe', () => {
  assert.equal(biobucksPct({upfront_usd_mm:100, deal_value_usd_mm:1000}), 10)
  assert.equal(biobucksPct({upfront_usd_mm:0, deal_value_usd_mm:1000}), null)   // undisclosed upfront
  assert.equal(biobucksPct({upfront_usd_mm:1200, deal_value_usd_mm:1000}), 100) // clamp upfront>=total
  assert.equal(biobucksPct({deal_value_usd_mm:0}), null)
})
```

- [ ] **Step 2-4 — TDD** `biobucksPct` (return null when upfront falsy/undisclosed or total≤0; clamp to 100). Verify PASS.
- [ ] **Step 5 — Commit.** (Aggregate "Biobucks Index" surfacing on the deals hero, gated behind min-populated-N + coverage% disclosure, is deferred until upfront data exists post-Step-0 enrichment — logic ready.)

---

## Task 5 — Move 4: Hype Gap hero

**Files:** Modify `deals.html`, `index.html`, `assets/deals.js` (fetcher `fetchTopGapDeals`).

- [ ] **Step 1 — Fetcher** `fetchTopGapDeals(n=1)`: reuse hype-gap.html light query (dual-scored, unlocked via `isOutcomeUnlocked`), return the single highest-|gap| pair for a teaser.
- [ ] **Step 2 — deals.html hero:** lead with value-prop headline ("The only deal database that grades how deals aged.") + a live teaser using the `said X · did Y` device from `fetchTopGapDeals`. Keep the price strip but demote it below the value prop.
- [ ] **Step 3 — index.html `#deal-intelligence`:** swap the generic copy for the same value-prop line + a link to `hype-gap.html`.
- [ ] **Step 4 — render-smoke:** `renderGapTeaser(deal)` pure fn (in scoring.js) returns HTML with `said` and `did`; assert offline.
- [ ] **Step 5 — Manual mobile check** (no overflow) + commit.

---

## Task 6 — Move 10 (generator only): weekly Hype Gap draft

**Files:** Create `scripts/weekly_hype_gap.mjs`.

- [ ] **Step 1 — Script** queries the current top-|gap| unlocked deal via Supabase and prints a draft unit: headline, `said X · did Y`, a 2-sentence factual frame (from stored fields only — NO new claims), and the deal URL. For editorial review, not auto-publish.
- [ ] **Step 2 — Run** against live data, confirm a sane draft. Commit. (Template/editorial-process doc handed to the content workflow, not built here.)

---

## Definition of done (Build 1)

- `npm run test:unit` green offline (gates + aggregations + biobucks + render-smoke).
- `acquirers.html` lists real buyers (J&J≈75 vs Gilead≈54); comparables panel appears only on locked deals with ≥3 unlocked comps; hero leads with the value prop; generator prints a draft.
- All cache-busters consistent (grep-verified).
- Everything committed on `deal-intel-differentiation-2026-07`. **No push/merge without Bin's go.**
- Out of scope (Build 2 / deferred): editorial_lede enrichment (needs audit tool), upfront data enrichment + view recreate (needs Bin's Step 0), Move 5 backfill (needs harness), Move 8 gate (cut), Move 7 hindsight page.
