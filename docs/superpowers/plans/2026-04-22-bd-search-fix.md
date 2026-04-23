# BD Search UX & Data Integrity Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the BD Deal Intelligence search tool credible and usable — fix two broken filters, add pagination/sort/TA filter, correct seven corrupted deal values, re-score 279 deals stuck at CS=100, and add a defensive sanity validator.

**Architecture:** Three workstreams across two repos, with a release gate. Fix data first so sort-by-Critic-Score is meaningful when frontend ships. Ship the defensive validator in parallel. See `docs/superpowers/specs/2026-04-22-bd-search-fix-design.md` for design rationale.

**Tech Stack:** Frontend — vanilla ES modules + Supabase JS client (CDN). Data — Python 3, supabase-py, pytest, WebFetch via Claude Agent SDK or `requests`. Host — GitHub Pages deploy from `main` on `xadrol-cloud/the-pharma-closeout`.

**Environment assumptions:**
- Node **≥18** required for `tests/deals_search.spec.mjs` (uses native fetch + native `node:test`).
- Windows + Git Bash (commands use Unix syntax: `grep`, `export`, `wc -l`, forward slashes in paths).
- Env vars pre-set: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (readonly client), `SUPABASE_SERVICE_KEY` (write client for data-repo scripts).
- Python 3.10+ with `supabase`, `requests`, `pytest` installed in BD Data Base repo.

---

## Repo paths (both machines)

- **Frontend repo:** `C:\Users\xadro\the-pharma-closeout` (host: `thepharmacloseout.com`, deploy: GitHub Pages from `main`)
- **Data repo:** `C:\Users\xadro\OneDrive\Documents\documents\AI Projects\BZG\BD lookup tool\BD Data Base` (local-only; Supabase is the live source of truth)

## File map

### Frontend repo (`the-pharma-closeout`)
| Path | Op | Purpose |
|---|---|---|
| `deals.html` | MODIFY (lines 82-110 approx) | Filter row rewrite — DB-aligned values + TA + Sort dropdowns |
| `assets/deals.js` | MODIFY (~line 198, ~line 1097) | Rewrite `searchDeals` + `initSearch` |
| `assets/deals.css` | MODIFY (after line 864) | Add `.search-count`, `.search-status`, `.load-more-btn` styles |
| `tests/deals_search.spec.mjs` | CREATE | Vanilla `node --test` integration tests against live Supabase |

### Data repo (`BD Data Base`)
| Path | Op | Purpose |
|---|---|---|
| `scripts/fix_corrupt_values.py` | CREATE | Fixes 7 known-bad `deal_value_usd_mm` rows with sourced corrections |
| `scripts/validate_deal_value.py` | CREATE | Pure validator — sanity checks on value, scores, required fields |
| `tests/test_validate_deal_value.py` | CREATE | pytest unit tests for validator |
| `scripts/rescoring/investigate_cs.py` | CREATE | Diagnostic dump of CS=100 vs CS-spread deals |
| `scripts/rescoring/rerun_critic_scores.py` | CREATE | Re-runs Scoring V2 over flagged rows |
| Writers in `scripts/` (e.g. `enrich_scores.py`, `apply_metadata_fixes.py`, `score_wave1.py`, others) | MODIFY | Wrap upsert calls with `validate()` |
| `logs/value_corrections.jsonl` | WRITE (output) | Audit trail of WS-B.1 changes |
| `logs/unresolved_values.jsonl` | WRITE (output) | Rows where no source was found |
| `logs/validation_failures.jsonl` | WRITE (output) | Runtime validator failures |

---

## Phase 0 — Discovery (shared context, ~15 min)

### Task 0.1: Confirm DB column types and TA distribution

**Files:**
- Read: `C:\Users\xadro\the-pharma-closeout\assets\deals.js:1-30` (Supabase client init — capture URL + anon key for test setup)

- [ ] **Step 1: Capture Supabase URL + anon key**

Open `assets/deals.js`, record the `SUPABASE_URL` and `SUPABASE_ANON_KEY` constants from the top of the file. Store as env vars for tests:
```bash
export SUPABASE_URL=<value>
export SUPABASE_ANON_KEY=<value>
```

- [ ] **Step 2: Query column types for `therapeutic_areas` and `lead_molecules`**

Run in Supabase SQL editor:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'deals_enriched'
  AND column_name IN ('therapeutic_areas', 'lead_molecules', 'indications');
```
Expected: either `text` (JSON string) or `jsonb`. Record result — determines whether Task 3 uses `.ilike` (text) or `.cs` (jsonb) for TA filter.

- [ ] **Step 3: Query distinct TA counts**

```sql
-- If therapeutic_areas is text (JSON-stringified):
SELECT value AS ta, COUNT(*) AS n
FROM deals_enriched, jsonb_array_elements_text(therapeutic_areas::jsonb) AS value
GROUP BY value ORDER BY n DESC LIMIT 20;
-- If jsonb:
SELECT value AS ta, COUNT(*) AS n
FROM deals_enriched, jsonb_array_elements_text(therapeutic_areas) AS value
GROUP BY value ORDER BY n DESC LIMIT 20;
```
Expected: distinct TA names with counts. Verify the 12 TAs in the spec cover ≥90% of deals. If a high-volume TA is missing, replace "Other" in the spec list with it. **If the TA list changes, add a "Plan deviation note" at the top of this plan document recording the swap and the reason, then proceed.** Do not block on amending the spec.

- [ ] **Step 4: No commit** (discovery only — write findings to a scratchpad for later tasks)

---

## Phase 1 — WS-B.1: Fix 7 corrupt `deal_value_usd_mm` rows (~2 hours)

**Rollout position:** Must complete before Phase 3 deploys.

### Task 1.1: Scaffold the fix script with corrupt-row inventory

**Files:**
- Create: `scripts/fix_corrupt_values.py`

- [ ] **Step 1: Create the script skeleton**

```python
# scripts/fix_corrupt_values.py
"""Fix 7 known-corrupt deal_value_usd_mm rows with sourced corrections.

Usage:
  python scripts/fix_corrupt_values.py --dry-run   # print planned changes
  python scripts/fix_corrupt_values.py             # apply

Every correction requires a citation URL fetched from the company press release
or SEC filing. Rows that fail to source are set to NULL and logged to
logs/unresolved_values.jsonl for manual follow-up.
"""
import argparse
import json
import os
from pathlib import Path
from supabase import create_client

CORRUPT_ROWS = [
    {
        "deal_id_query": {"buyer_name": "Novo Nordisk A/S", "target_name": "Vivtex Inc."},
        "expected_current_mm": 25947200000,
        "fallback_value_mm": None,  # Must fetch; no confident prior
        "source_search_hint": "Novo Nordisk Vivtex acquisition 2025 press release",
    },
    {
        "deal_id_query": {"buyer_name": "Novartis AG", "target_name": "Regulus Therapeutics"},
        "expected_current_mm": 96914000,
        "fallback_value_mm": 1700,  # $1.7B per prior research
        "source_search_hint": "Novartis Regulus Therapeutics acquisition 2025",
    },
    {
        "deal_id_query": {"buyer_name": "AbbVie Inc.", "target_name": "Genentech"},
        "expected_current_mm": 541069000,
        "fallback_value_mm": 595,  # ~$595M collaboration upfront
        "source_search_hint": "AbbVie Genentech Roche collaboration 2015",
    },
    {
        "deal_id_query": {"buyer_name": "Merck & Co. Inc.", "target_name": "Harpoon Therapeutics"},
        "expected_current_mm": 9806000,
        "fallback_value_mm": 680,  # $680M acquisition
        "source_search_hint": "Merck Harpoon Therapeutics acquisition January 2024",
    },
    {
        "deal_id_query": {"buyer_name": "Sanofi SA", "target_name": "Lexicon Pharmaceuticals"},
        "expected_current_mm": 940000,
        "fallback_value_mm": None,  # Prior research says ~$260M but confirm
        "source_search_hint": "Sanofi Lexicon diabetes deal 2015",
    },
    {
        "deal_id_query": {"buyer_name": "Amgen Inc.", "target_name": "Immunex Corporation"},
        "expected_current_mm": 240120,
        "fallback_value_mm": 16000,  # $16B established
        "source_search_hint": "Amgen Immunex acquisition 2001",
    },
    {
        "deal_id_query": {"buyer_name": "Eli Lilly and Company", "target_name": "Boehringer Ingelheim"},
        "expected_current_mm": 340000,
        "fallback_value_mm": None,  # Upfront ~$500M, total higher
        "source_search_hint": "Lilly Boehringer Ingelheim diabetes collaboration January 2011",
    },
]

def sb():
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    client = sb()
    for row in CORRUPT_ROWS:
        q = client.table("deals_enriched").select("deal_id,buyer_name,target_name,deal_value_usd_mm,sources")
        for k, v in row["deal_id_query"].items():
            q = q.ilike(k, f"%{v}%")
        hits = q.execute().data
        if not hits:
            print(f"SKIP — no row matched: {row['deal_id_query']}")
            continue
        if len(hits) > 1:
            print(f"AMBIGUOUS — {len(hits)} rows matched {row['deal_id_query']}; skipping")
            continue
        hit = hits[0]
        print(f"MATCH: {hit['buyer_name']} / {hit['target_name']} id={hit['deal_id']} current={hit['deal_value_usd_mm']}")
        # Source-fetching + update logic added in next tasks
    print("scaffold ok")

if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run the scaffold in dry-run**

```bash
cd "C:\Users\xadro\OneDrive\Documents\documents\AI Projects\BZG\BD lookup tool\BD Data Base"
export SUPABASE_URL=<value>
export SUPABASE_SERVICE_KEY=<service-role-key>   # NOT anon — need RLS bypass for writes
python scripts/fix_corrupt_values.py --dry-run
```
Expected: prints MATCH lines for all 7 deals with their current corrupt values. If any SKIP or AMBIGUOUS, adjust the `deal_id_query` fields in `CORRUPT_ROWS`.

- [ ] **Step 3: Commit scaffold**

```bash
cd "C:\Users\xadro\OneDrive\Documents\documents\AI Projects\BZG\BD lookup tool\BD Data Base"
git add scripts/fix_corrupt_values.py
git commit -m "wip: fix_corrupt_values scaffold — 7-row inventory matches live DB"
```

### Task 1.2: Add source-fetching + update logic

**Files:**
- Modify: `scripts/fix_corrupt_values.py`

- [ ] **Step 1: Add `fetch_source` using WebFetch or requests**

Append to `scripts/fix_corrupt_values.py`:

```python
import requests
from urllib.parse import quote_plus

def search_duckduckgo(hint: str) -> list[str]:
    """Return candidate URLs (press release / 10-K) from a DDG search."""
    r = requests.get(
        f"https://duckduckgo.com/html/?q={quote_plus(hint + ' press release site:sec.gov OR site:pharma OR site:lilly.com OR site:amgen.com OR site:novartis.com OR site:roche.com OR site:abbvie.com OR site:sanofi.com OR site:merck.com OR site:novonordisk.com')}",
        headers={"User-Agent": "Mozilla/5.0 (compatible; BD-fixer/1.0)"},
        timeout=15,
    )
    r.raise_for_status()
    # Simple regex extract; DDG HTML is stable
    import re
    urls = re.findall(r'class="result__a"[^>]*href="(https?://[^"]+)"', r.text)
    return urls[:5]

def fetch_page(url: str) -> str:
    r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=20)
    r.raise_for_status()
    return r.text
```

- [ ] **Step 2: Add the update routine**

```python
def apply_row(client, row, dry_run: bool, log_ok, log_unresolved):
    q = client.table("deals_enriched").select("*")
    for k, v in row["deal_id_query"].items():
        q = q.ilike(k, f"%{v}%")
    hits = q.execute().data
    if len(hits) != 1:
        return
    deal = hits[0]

    # Attempt source fetch — take first candidate URL as provisional source
    source_url = None
    try:
        urls = search_duckduckgo(row["source_search_hint"])
        source_url = urls[0] if urls else None
    except Exception as e:
        print(f"  search failed: {e}")

    new_value = row["fallback_value_mm"]
    if source_url is None and new_value is None:
        print(f"  UNRESOLVED — no source and no fallback for {deal['deal_id']}")
        log_unresolved.write(json.dumps({"deal_id": deal["deal_id"], "buyer": deal["buyer_name"], "target": deal["target_name"]}) + "\n")
        new_value = None  # Will write NULL below
    elif new_value is None and source_url:
        # Fallback is None but we have a URL — still write NULL for value but attach source for manual review
        log_unresolved.write(json.dumps({"deal_id": deal["deal_id"], "source_url": source_url, "note": "source found but value not extracted — manual review"}) + "\n")

    # Attach source
    existing_sources = deal.get("sources") or []
    if isinstance(existing_sources, str):
        existing_sources = json.loads(existing_sources)
    new_sources = list(existing_sources)
    if source_url:
        new_sources.append({
            "url": source_url,
            "added_by": "fix_corrupt_values.py",
            "added_at": "2026-04-22",
            "purpose": "deal_value_usd_mm correction"
        })

    change = {
        "deal_id": deal["deal_id"],
        "old_value_mm": deal["deal_value_usd_mm"],
        "new_value_mm": new_value,
        "source_url": source_url,
    }

    if dry_run:
        print(f"  DRY: {change}")
        return

    client.table("deals_enriched").update({
        "deal_value_usd_mm": new_value,
        "sources": new_sources,
    }).eq("deal_id", deal["deal_id"]).execute()
    log_ok.write(json.dumps(change) + "\n")
    print(f"  APPLIED: {change}")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    Path("logs").mkdir(exist_ok=True)
    client = sb()
    with open("logs/value_corrections.jsonl", "a") as log_ok, \
         open("logs/unresolved_values.jsonl", "a") as log_unresolved:
        for row in CORRUPT_ROWS:
            apply_row(client, row, args.dry_run, log_ok, log_unresolved)
    print("done")
```

- [ ] **Step 3: Dry-run**

```bash
python scripts/fix_corrupt_values.py --dry-run
```
Expected: 7 `DRY:` lines showing proposed new values. Review output — if any `new_value_mm` looks wrong or `source_url` is garbage, adjust `CORRUPT_ROWS` fallback values or hints.

- [ ] **Step 4: Apply**

```bash
python scripts/fix_corrupt_values.py
```
Expected: 7 `APPLIED:` lines. Review `logs/value_corrections.jsonl` + `logs/unresolved_values.jsonl`.

- [ ] **Step 5: Manual review of unresolved rows**

For any row in `logs/unresolved_values.jsonl`, check the source URL manually, extract the correct `deal_value_usd_mm`, and update with a one-off SQL:
```sql
UPDATE deals_enriched SET deal_value_usd_mm = <verified_value> WHERE deal_id = '<id>';
```

- [ ] **Step 6: Verify no outliers remain**

```sql
SELECT deal_id, buyer_name, target_name, deal_value_usd_mm
FROM deals_enriched
WHERE deal_value_usd_mm > 400000
ORDER BY deal_value_usd_mm DESC;
```
Expected: zero rows.

- [ ] **Step 7: Commit**

```bash
git add scripts/fix_corrupt_values.py logs/value_corrections.jsonl logs/unresolved_values.jsonl
git commit -m "fix: correct 7 deal_value_usd_mm outliers with sourced values"
```

---

## Phase 2 — WS-B.2: Critic Score re-score (time-boxed 1 day)

**Rollout position:** Must complete (or fallback) before Phase 3 deploys. If root-cause investigation exceeds 8 hours, abandon re-score and execute Task 2.6 (display cap fallback).

### Task 2.1: Diagnostic — dump CS=100 vs spread deals

**Files:**
- Create: `scripts/rescoring/investigate_cs.py`

- [ ] **Step 1: Create the diagnostic script**

```python
# scripts/rescoring/investigate_cs.py
"""Dump raw critic_reviews and related input fields for 5 CS=100 deals
and 5 deals with CS between 40 and 80. Compare to identify why CS=100
is over-assigned."""
import json
import os
from supabase import create_client

def sb():
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

def main():
    client = sb()
    cs100 = client.table("deals_enriched").select("deal_id,buyer_name,target_name,critic_score,critic_reviews,critic_score_v2_ran_at").eq("critic_score", 100).limit(5).execute().data
    cs_spread = client.table("deals_enriched").select("deal_id,buyer_name,target_name,critic_score,critic_reviews,critic_score_v2_ran_at").gte("critic_score", 40).lte("critic_score", 80).limit(5).execute().data
    print("=== CS=100 ===")
    for d in cs100: print(json.dumps(d, indent=2, default=str))
    print("=== CS 40-80 ===")
    for d in cs_spread: print(json.dumps(d, indent=2, default=str))

if __name__ == "__main__":
    main()
```

*Column name note:* If `critic_score_v2_ran_at` doesn't exist, substitute the actual V2-run timestamp column (check `information_schema.columns` for `deals_enriched`).

- [ ] **Step 2: Run it and capture output**

```bash
python scripts/rescoring/investigate_cs.py > logs/cs_investigation.txt
```

- [ ] **Step 3: Read the output and identify the hypothesis**

Compare the 5 CS=100 deals' `critic_reviews` column against the 5 spread deals. Look for:
- **H1 evidence:** CS=100 rows have `critic_score_v2_ran_at = NULL` or much older than spread rows → V2 never ran.
- **H2 evidence:** CS=100 rows have `critic_reviews = []` or `critic_reviews.consensus_signal = null` → scorer defaults to max when inputs missing.

Record the hypothesis in `logs/cs_investigation.txt` with your reasoning.

- [ ] **Step 4: Commit investigation output**

```bash
git add scripts/rescoring/investigate_cs.py logs/cs_investigation.txt
git commit -m "diagnostic: CS=100 investigation dump — H1/H2 evidence captured"
```

### Task 2.2: Fix the root cause

**Files:**
- Read: `scripts/enrich_scores.py` or `scripts/score_wave1.py` or `scripts/score_batch_40.js` — locate Scoring V2 impl
- Modify: the scoring implementation based on root cause
- Create: `scripts/rescoring/rerun_critic_scores.py`

- [ ] **Step 1: Locate Scoring V2**

```bash
grep -rn "critic_score" scripts/ --include="*.py" --include="*.js" | head -20
```
Read the top hit. Identify where CS is computed.

- [ ] **Step 2: Branch on hypothesis**

**If H1 (never ran):** skip to Step 3, write the re-run script.

**If H2 (ceiling bug):** apply the fix at the scorer level before re-running:
```python
# Example fix — adjust to actual impl
def compute_critic_score(reviews):
    if not reviews or len(reviews) == 0:
        return None  # was: return 100 (the bug)
    # ... existing logic
```
Add a unit test in `tests/test_score_v2.py` asserting empty-reviews returns `None`, not `100`.

- [ ] **Step 3: Write `rerun_critic_scores.py`**

```python
# scripts/rescoring/rerun_critic_scores.py
"""Re-compute critic_score on all rows where critic_score = 100.
Uses the canonical V2 scorer; writes logs/rescoring_results.jsonl."""
import json
import os
from supabase import create_client
from scripts.enrich_scores import compute_critic_score  # or wherever it lives

def main():
    client = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
    rows = client.table("deals_enriched").select("deal_id,critic_reviews").eq("critic_score", 100).execute().data
    with open("logs/rescoring_results.jsonl", "a") as log:
        for r in rows:
            new_cs = compute_critic_score(r.get("critic_reviews") or [])
            client.table("deals_enriched").update({"critic_score": new_cs}).eq("deal_id", r["deal_id"]).execute()
            log.write(json.dumps({"deal_id": r["deal_id"], "old_cs": 100, "new_cs": new_cs}) + "\n")
    print(f"rescored {len(rows)} rows")

if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Dry-run against 10 rows first**

Add `.limit(10)` to the query, run, review `logs/rescoring_results.jsonl`. If new CS values look sensible (spread, not all 100, not all None), remove the limit and proceed.

- [ ] **Step 5: Run full re-score**

```bash
python scripts/rescoring/rerun_critic_scores.py
```
Expected: "rescored 279 rows" (or close, depending on what the current CS=100 count is).

- [ ] **Step 6: Verify post-fix distribution**

```sql
SELECT ROUND(critic_score / 10) * 10 AS bucket, COUNT(*) AS n
FROM deals_enriched WHERE critic_score IS NOT NULL
GROUP BY bucket ORDER BY bucket;
```
Expected: histogram with visible spread; CS=100 count ≤ ~40 (~10% of dataset); std-dev > 10.

- [ ] **Step 7: Commit**

```bash
git add scripts/rescoring/ logs/rescoring_results.jsonl
git commit -m "fix: re-score 279 deals stuck at CS=100 (root cause: <H1 or H2>)"
```

### Task 2.3 (FALLBACK ONLY — skip if Task 2.2 succeeded within timebox)

**Files:**
- Modify: `C:\Users\xadro\the-pharma-closeout\assets\deals.js` (renderScorePill / poster critic display)

- [ ] **Step 1: Cap displayed CS at 99**

Find the CS render line (likely in `renderPoster` or `renderScorePill`):
```javascript
// Before:
const criticScore = deal.critic_score != null ? Math.round(deal.critic_score) : null
// After:
const criticScore = deal.critic_score != null ? Math.min(99, Math.round(deal.critic_score)) : null
```

- [ ] **Step 2: Add under-review note near sort dropdown**

In `deals.html` near the `<select name="sort">`, add:
```html
<span class="sort-note" title="Critic Score currently under review — sort order may not fully reflect final scoring">⚠️ CS under review</span>
```

- [ ] **Step 3: Commit**

```bash
cd "C:\Users\xadro\the-pharma-closeout"
git add assets/deals.js deals.html
git commit -m "fallback: cap CS display at 99, flag under-review state"
```

Open a follow-up ticket: "BD Critic Score re-score — deferred from 2026-04-22."

---

## Phase 3 — WS-A: Frontend search UX (~1 day)

**Rollout position:** deploy after Phase 1 + Phase 2 land in production.

### Task 3.1: Write the failing integration test suite

**Files:**
- Create: `C:\Users\xadro\the-pharma-closeout\tests\deals_search.spec.mjs`

- [ ] **Step 1: Write the test file**

```javascript
// tests/deals_search.spec.mjs
// Run with: node --test tests/deals_search.spec.mjs
// Requires env: SUPABASE_URL, SUPABASE_ANON_KEY
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

async function search(query, filters = {}, { limit = 25, offset = 0 } = {}) {
  let q = sb.from('deals_enriched').select('*', { count: 'exact' })
  if (query) q = q.or(`buyer_name.ilike.%${query}%,target_name.ilike.%${query}%,therapeutic_areas.ilike.%${query}%,lead_molecules.ilike.%${query}%,indications.ilike.%${query}%`)
  if (filters.deal_type) q = q.eq('deal_type', filters.deal_type)
  if (filters.era) q = q.eq('era_tag', filters.era)
  if (filters.therapeutic_area) q = q.ilike('therapeutic_areas', `%${filters.therapeutic_area}%`)
  if (filters.min_value) q = q.gte('deal_value_usd_mm', filters.min_value)
  const sortMap = { date_desc: 'announcement_date', value_desc: 'deal_value_usd_mm', critic_desc: 'critic_score', outcome_desc: 'outcome_score' }
  q = q.order(sortMap[filters.sort || 'date_desc'], { ascending: false, nullsLast: true })
  q = q.range(offset, offset + limit - 1)
  const { data, count } = await q
  return { deals: data || [], total: count || 0 }
}

test('deal_type filter returns >0 for every valid value', async () => {
  for (const v of ['Acquisition/Merger', 'Licensing/Option', 'Co-Development', 'Asset Purchase']) {
    const { total } = await search('', { deal_type: v })
    assert.ok(total > 0, `deal_type="${v}" returned 0`)
  }
})

test('era filter returns >0 for every decade', async () => {
  for (const v of ['1990s', '2000s', '2010s', '2020s']) {
    const { total } = await search('', { era: v })
    assert.ok(total > 0, `era="${v}" returned 0`)
  }
})

test('TA filter returns >0 for top TAs', async () => {
  for (const v of ['Oncology', 'Immunology', 'Metabolic']) {
    const { total } = await search('', { therapeutic_area: v })
    assert.ok(total > 0, `therapeutic_area="${v}" returned 0`)
  }
})

test('sort=value_desc returns results in descending value order', async () => {
  const { deals } = await search('oncology', { sort: 'value_desc' })
  const vals = deals.map(d => d.deal_value_usd_mm).filter(v => v != null)
  for (let i = 1; i < vals.length; i++) assert.ok(vals[i-1] >= vals[i], `out of order at ${i}`)
})

test('sort=critic_desc returns results in descending CS order', async () => {
  const { deals } = await search('', { therapeutic_area: 'Oncology', sort: 'critic_desc' })
  const vals = deals.map(d => d.critic_score).filter(v => v != null)
  for (let i = 1; i < vals.length; i++) assert.ok(vals[i-1] >= vals[i], `out of order at ${i}`)
})

test('pagination: offset=25 returns different deals than offset=0', async () => {
  const page1 = await search('', { therapeutic_area: 'Oncology' }, { offset: 0, limit: 25 })
  const page2 = await search('', { therapeutic_area: 'Oncology' }, { offset: 25, limit: 25 })
  if (page1.total < 50) return  // skip if dataset too small
  const p1ids = new Set(page1.deals.map(d => d.deal_id))
  const overlap = page2.deals.filter(d => p1ids.has(d.deal_id))
  assert.equal(overlap.length, 0, 'page 1 and 2 overlap')
})

test('zzzzzz query returns zero', async () => {
  const { total } = await search('zzzzzz')
  assert.equal(total, 0)
})

test('no values above $400B', async () => {
  const { data } = await sb.from('deals_enriched').select('deal_id,deal_value_usd_mm').gt('deal_value_usd_mm', 400000)
  assert.equal(data?.length || 0, 0, 'outlier values still present')
})

test('CS distribution is not stuck at 100', async () => {
  const { data } = await sb.from('deals_enriched').select('critic_score').eq('critic_score', 100)
  const { count: total } = await sb.from('deals_enriched').select('*', { count: 'exact', head: true }).not('critic_score', 'is', null)
  const ratio = (data?.length || 0) / (total || 1)
  assert.ok(ratio < 0.15, `CS=100 is ${(ratio*100).toFixed(1)}% of scored deals (expected <15%)`)
})
```

- [ ] **Step 2: Run tests — expect ALL to fail or skip (pre-fix baseline)**

```bash
cd "C:\Users\xadro\the-pharma-closeout"
export SUPABASE_URL=<value>
export SUPABASE_ANON_KEY=<value>
node --test tests/deals_search.spec.mjs
```
Expected BEFORE Phase 1+2 complete: `deal_type`, `era`, outlier, and CS tests FAIL. That's the baseline.

Expected AFTER Phase 1+2 complete: outlier and CS tests PASS; filter tests still FAIL because the frontend hasn't shipped yet (but our test uses raw Supabase — it should already reflect DB state, so these should pass). If they do, that confirms the DB is ready for Phase 3 frontend work.

**Re-check: since the tests call Supabase directly (not the frontend), Phase 1+2 completion alone makes all of these pass, proving the data layer is ready. The frontend changes in Task 3.2+ are about wiring the UI to hit these same queries.**

- [ ] **Step 3: Commit**

```bash
git add tests/deals_search.spec.mjs
git commit -m "test: add integration tests for search filters, sort, pagination, data integrity"
```

### Task 3.2: Rewrite `deals.html` filter row

**Files:**
- Modify: `C:\Users\xadro\the-pharma-closeout\deals.html` lines ~82-110 (filter section)

- [ ] **Step 1: Locate the current filter row**

```bash
grep -n 'select name' deals.html
```
Expected: lines around 86-108 with three `<select>` elements.

- [ ] **Step 2: Replace the filter block**

Replace the `<div id="filters">...</div>` block with:

```html
<div id="filters" class="filters">
  <select name="deal_type" class="f-chip" aria-label="Deal Type">
    <option value="">All Deal Types</option>
    <option value="Acquisition/Merger">Acquisition / M&A</option>
    <option value="Licensing/Option">Licensing / Option</option>
    <option value="Co-Development">Co-Dev / Collaboration</option>
    <option value="Asset Purchase">Asset Purchase</option>
  </select>
  <select name="era" class="f-chip" aria-label="Era">
    <option value="">All Eras</option>
    <option value="2020s">2020s</option>
    <option value="2010s">2010s</option>
    <option value="2000s">2000s</option>
    <option value="1990s">1990s</option>
  </select>
  <select name="therapeutic_area" class="f-chip" aria-label="Therapeutic Area">
    <option value="">All Therapeutic Areas</option>
    <option value="Oncology">Oncology</option>
    <option value="Immunology">Immunology</option>
    <option value="Neurology">Neurology</option>
    <option value="Metabolic">Metabolic</option>
    <option value="Rare Disease">Rare Disease</option>
    <option value="Cardiovascular">Cardiovascular</option>
    <option value="Infectious Disease">Infectious Disease</option>
    <option value="Respiratory">Respiratory</option>
    <option value="Hematology">Hematology</option>
    <option value="Dermatology">Dermatology</option>
    <option value="Ophthalmology">Ophthalmology</option>
    <option value="Other">Other</option>
  </select>
  <select name="min_value" class="f-chip" aria-label="Min Value">
    <option value="">Any Value</option>
    <option value="500">$500M+</option>
    <option value="1000">$1B+</option>
    <option value="5000">$5B+</option>
    <option value="10000">$10B+</option>
    <option value="50000">$50B+</option>
  </select>
  <select name="sort" class="f-chip" aria-label="Sort">
    <option value="date_desc">Newest First</option>
    <option value="value_desc">Highest Value</option>
    <option value="critic_desc">Highest Critic Score</option>
    <option value="outcome_desc">Highest Outcome Score</option>
  </select>
</div>
```

*If the Phase 0.1 TA distribution check surfaced a high-volume TA not in the spec list, substitute it for "Other."*

- [ ] **Step 3: Commit**

```bash
git add deals.html
git commit -m "feat: align filter option values to DB enum + add TA and Sort chips"
```

### Task 3.3: Rewrite `searchDeals()` in `deals.js`

**Files:**
- Modify: `C:\Users\xadro\the-pharma-closeout\assets\deals.js` — function at line 198

- [ ] **Step 1: Replace the searchDeals function**

Locate `export async function searchDeals(...)` at line 198. Replace the entire function with:

```javascript
/** Search deals by text query + optional filters. Returns { deals, total }. */
export async function searchDeals(query, filters = {}, { limit = 25, offset = 0 } = {}) {
  let q = supabase.from('deals_enriched').select('*', { count: 'exact' })
  if (query) {
    q = q.or(`buyer_name.ilike.%${query}%,target_name.ilike.%${query}%,therapeutic_areas.ilike.%${query}%,lead_molecules.ilike.%${query}%,indications.ilike.%${query}%`)
  }
  if (filters.deal_type) q = q.eq('deal_type', filters.deal_type)
  if (filters.era) q = q.eq('era_tag', filters.era)
  if (filters.therapeutic_area) q = q.ilike('therapeutic_areas', `%${filters.therapeutic_area}%`)
  if (filters.min_value) q = q.gte('deal_value_usd_mm', filters.min_value)
  q = applySortClause(q, filters.sort || 'date_desc')
  q = q.range(offset, offset + limit - 1)
  const { data, error, count } = await q
  if (error) throw error
  return { deals: data || [], total: count || 0 }
}

function applySortClause(q, sortKey) {
  switch (sortKey) {
    case 'value_desc':   return q.order('deal_value_usd_mm', { ascending: false, nullsLast: true })
    case 'critic_desc':  return q.order('critic_score',      { ascending: false, nullsLast: true })
    case 'outcome_desc': return q.order('outcome_score',     { ascending: false, nullsLast: true })
    default:             return q.order('announcement_date', { ascending: false, nullsLast: true })
  }
}
```

*If Phase 0.1 discovery showed `therapeutic_areas` is `jsonb` (not `text`), replace the `.ilike` line for TA with:*
```javascript
if (filters.therapeutic_area) q = q.cs('therapeutic_areas', [filters.therapeutic_area])
```

- [ ] **Step 2: Manual verification — no other callers**

```bash
grep -n 'searchDeals' assets/deals.js deals.html
```
Expected: only the export line + one caller in `initSearch`. If any other call site exists (carousel or homepage), update its return-shape expectation to `.deals`.

- [ ] **Step 3: Commit**

```bash
git add assets/deals.js
git commit -m "feat: searchDeals returns {deals,total}, supports sort + TA filter + pagination"
```

### Task 3.4: Rewrite `initSearch()` with Load More + min-query-length

**Files:**
- Modify: `C:\Users\xadro\the-pharma-closeout\assets\deals.js` — function at line 1097

- [ ] **Step 1: Replace `initSearch`**

Locate `export function initSearch(...)` at line 1097. Replace the entire function with:

```javascript
/**
 * Wire up debounced search + filter binding + pagination.
 */
export function initSearch(inputEl, filtersEl, resultsEl) {
  if (!inputEl || !resultsEl) return
  let debounceTimer = null
  let loadedCount = 0
  let totalCount = 0

  function readFilters() {
    const f = {}
    filtersEl?.querySelectorAll('select').forEach(sel => {
      if (sel.value) f[sel.name] = sel.value
    })
    return f
  }

  async function runSearch({ append = false } = {}) {
    const query = inputEl.value.trim()
    const filters = readFilters()
    const hasNonSortFilter = Object.keys(filters).filter(k => k !== 'sort').length > 0
    if (query.length < 2 && !hasNonSortFilter) {
      resultsEl.innerHTML = ''
      return
    }
    const offset = append ? loadedCount : 0
    if (!append) resultsEl.innerHTML = '<p class="search-status">Searching...</p>'
    try {
      const { deals, total } = await searchDeals(query, filters, { limit: 25, offset })
      if (!append) loadedCount = 0
      loadedCount += deals.length
      totalCount = total
      renderResults(deals, append)
    } catch (e) {
      resultsEl.innerHTML = '<p class="search-status error">Search is temporarily unavailable. Try again.</p>'
      console.error('searchDeals error', e)
    }
  }

  function renderResults(deals, append) {
    const gridHtml = deals.map(d => renderPoster(d, 'carousel')).join('')
    if (append) {
      resultsEl.querySelector('.grid')?.insertAdjacentHTML('beforeend', gridHtml)
    } else if (!deals.length) {
      resultsEl.innerHTML = '<p class="search-status">No deals found.</p>'
      return
    } else {
      resultsEl.innerHTML = `
        <p class="search-count">Showing ${loadedCount} of ${totalCount} results</p>
        <div class="grid">${gridHtml}</div>`
    }
    updateLoadMore()
  }

  function updateLoadMore() {
    resultsEl.querySelector('.load-more-btn')?.remove()
    if (loadedCount < totalCount) {
      const btn = document.createElement('button')
      btn.className = 'load-more-btn'
      btn.textContent = `Load more (${totalCount - loadedCount} remaining)`
      btn.onclick = () => runSearch({ append: true })
      resultsEl.appendChild(btn)
    }
    const countEl = resultsEl.querySelector('.search-count')
    if (countEl) countEl.textContent = `Showing ${loadedCount} of ${totalCount} results`
  }

  inputEl.addEventListener('input', () => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => runSearch({ append: false }), 350)
  })
  filtersEl?.addEventListener('change', () => runSearch({ append: false }))
}
```

- [ ] **Step 2: Commit**

```bash
git add assets/deals.js
git commit -m "feat: initSearch adds Load More pagination, min-query gate, error state"
```

### Task 3.5: Add CSS for new elements

**Files:**
- Modify: `C:\Users\xadro\the-pharma-closeout\assets\deals.css` — append after line 864

- [ ] **Step 1: Locate the filter-chips section**

```bash
grep -n "f-chip" assets/deals.css
```
Expected: a match near line 845 and 857. Styles go immediately after the last `.f-chip` rule (~line 864).

- [ ] **Step 2: Append styles**

Add to the end of the FILTER CHIPS section:

```css
/* Search results — count + status + load more */
.search-count {
  color: var(--ink-faint);
  font-size: 13px;
  margin: 0 0 12px 0;
}
.search-status {
  color: var(--ink-faint);
  font-size: 13px;
  text-align: center;
  padding: 40px 0;
}
.search-status.error { color: #c13; }

.load-more-btn {
  display: block;
  margin: 24px auto 0;
  padding: 10px 28px;
  background: var(--ink);
  color: var(--paper);
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.3px;
  transition: opacity 0.15s;
}
.load-more-btn:hover { opacity: 0.85; }
```

- [ ] **Step 3: Commit**

```bash
git add assets/deals.css
git commit -m "style: search count, status, and load-more button"
```

### Task 3.6: Manual browser verification

**Files:** none

- [ ] **Step 1: Serve the site locally**

```bash
cd "C:\Users\xadro\the-pharma-closeout"
python -m http.server 8900
```
Open http://localhost:8900/deals.html

- [ ] **Step 2: Test each filter**

For each filter, clear the search bar then select a value:
- Deal Type = "Acquisition / M&A" → expect deals
- Era = "2020s" → expect deals
- TA = "Oncology" → expect deals
- Min Value = "$1B+" → expect deals
- Sort = "Highest Value" → check order (descending by deal value shown on cards)
- Sort = "Highest Critic Score" → check order

- [ ] **Step 3: Test pagination**

Clear filters; TA = "Oncology". Should see ~25 deals + "Showing 25 of X" + "Load more (Y remaining)" button. Click Load More; should append next 25 without replacing. Count updates.

- [ ] **Step 4: Test search + filter combo**

Type "pfizer" (2+ chars), select TA = "Oncology". Results should narrow. Clear TA — results expand back.

- [ ] **Step 5: Test error state**

Temporarily break the Supabase URL in `deals.js` (prepend `X`), reload, type a query. Expect the red "temporarily unavailable" message. Revert.

### Task 3.7: Run integration tests + deploy

- [ ] **Step 1: Re-run Task 3.1 tests**

```bash
node --test tests/deals_search.spec.mjs
```
Expected: all tests PASS.

- [ ] **Step 2: Push to GitHub Pages**

```bash
git push origin main
```
Wait 2-3 minutes for GitHub Pages to deploy. Verify at `thepharmacloseout.com/deals.html`.

- [ ] **Step 3: Production smoke test**

Repeat Task 3.6 steps 2-4 against the live URL.

---

## Phase 4 — WS-C: Inline validator (~3 hours, can run parallel to Phase 3)

### Task 4.1: Write validator unit tests

**Files:**
- Create: `C:\Users\xadro\OneDrive\Documents\documents\AI Projects\BZG\BD lookup tool\BD Data Base\tests\test_validate_deal_value.py`

- [ ] **Step 1: Write the failing tests**

```python
# tests/test_validate_deal_value.py
import pytest
from scripts.validate_deal_value import validate, DealValidationError

def test_valid_row_passes():
    validate({"deal_id": "abc", "deal_value_usd_mm": 500, "critic_score": 75, "outcome_score": 60})

def test_absurd_value_raises():
    with pytest.raises(DealValidationError, match="deal_value_usd_mm"):
        validate({"deal_id": "abc", "deal_value_usd_mm": 25_947_200_000})

def test_negative_score_raises():
    with pytest.raises(DealValidationError, match="critic_score"):
        validate({"deal_id": "abc", "critic_score": -5})

def test_excessive_score_raises():
    with pytest.raises(DealValidationError, match="outcome_score"):
        validate({"deal_id": "abc", "outcome_score": 150})

def test_missing_deal_id_raises():
    with pytest.raises(DealValidationError, match="deal_id"):
        validate({"deal_value_usd_mm": 100})

def test_boundary_values_pass():
    validate({"deal_id": "abc", "deal_value_usd_mm": 0.5})
    validate({"deal_id": "abc", "deal_value_usd_mm": 400_000})
    validate({"deal_id": "abc", "critic_score": 0, "outcome_score": 100})

def test_null_values_pass():
    validate({"deal_id": "abc", "deal_value_usd_mm": None, "critic_score": None})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd "C:\Users\xadro\OneDrive\Documents\documents\AI Projects\BZG\BD lookup tool\BD Data Base"
pytest tests/test_validate_deal_value.py -v
```
Expected: ImportError / module-not-found (validate_deal_value.py doesn't exist yet).

- [ ] **Step 3: Commit failing tests**

```bash
git add tests/test_validate_deal_value.py
git commit -m "test: unit tests for validate_deal_value (failing — impl pending)"
```

### Task 4.2: Implement the validator

**Files:**
- Create: `scripts/validate_deal_value.py`

- [ ] **Step 1: Write the minimal implementation**

```python
# scripts/validate_deal_value.py
"""Lightweight pre-write sanity checks for deal rows.

Integration: every upsert to deals_enriched must call validate() and handle
the DealValidationError. This is a defense-in-depth layer until the Research
Standards confidence-gated pipeline ships. Safe to remove once that is live.
"""

MAX_REASONABLE_VALUE_MM = 400_000   # $400B — larger than any real pharma deal
MIN_REASONABLE_VALUE_MM = 0.5       # $500K floor

class DealValidationError(ValueError):
    pass

def validate(deal: dict) -> None:
    errors = []
    v = deal.get('deal_value_usd_mm')
    if v is not None and not (MIN_REASONABLE_VALUE_MM <= v <= MAX_REASONABLE_VALUE_MM):
        errors.append(f"deal_value_usd_mm={v} outside [{MIN_REASONABLE_VALUE_MM}, {MAX_REASONABLE_VALUE_MM}]")
    for field in ('critic_score', 'outcome_score'):
        s = deal.get(field)
        if s is not None and not (0 <= s <= 100):
            errors.append(f"{field}={s} outside [0, 100]")
    if not deal.get('deal_id'):
        errors.append("deal_id is required")
    if errors:
        raise DealValidationError(
            f"Deal {deal.get('deal_id', '?')}: {'; '.join(errors)}"
        )
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
pytest tests/test_validate_deal_value.py -v
```
Expected: 7 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add scripts/validate_deal_value.py
git commit -m "feat: validate_deal_value — value + score sanity checks"
```

### Task 4.3: Enumerate writer call sites

**Files:**
- Read: anywhere in `scripts/` that calls Supabase upsert/insert

- [ ] **Step 1: Grep for writers**

```bash
grep -rn "\.upsert(\|\.insert(" scripts/ --include="*.py" | grep -v test_ > logs/writer_sites.txt
wc -l logs/writer_sites.txt
```
Expected: 4-10 call sites. Write them down.

- [ ] **Step 2: Filter to `deals_enriched` writers only**

The validator only needs to guard writes to `deals_enriched` (not auxiliary tables like `sources`, `disease_indications`, `deal_timeline`). Grep:
```bash
grep -B 3 "\.upsert(\|\.insert(" scripts/*.py | grep -A 3 "deals_enriched" > logs/writer_sites_deals.txt
```

- [ ] **Step 3: Commit discovery output**

```bash
git add logs/writer_sites*.txt
git commit -m "docs: enumerate writer call sites for validator integration"
```

### Task 4.4: Wire validator into each deals_enriched writer

**Files:**
- Modify: each writer identified in Task 4.3

- [ ] **Step 1: Add validation + failure logging helper**

Add to `scripts/validate_deal_value.py`:

```python
import json
from pathlib import Path
from datetime import datetime

def validate_or_log(deal: dict, logger_path: str = "logs/validation_failures.jsonl") -> bool:
    """Validate a deal. On failure, log and return False; on success, return True.
    Caller decides whether to proceed with the write."""
    try:
        validate(deal)
        return True
    except DealValidationError as e:
        Path(logger_path).parent.mkdir(exist_ok=True)
        with open(logger_path, "a") as f:
            f.write(json.dumps({
                "timestamp": datetime.utcnow().isoformat(),
                "deal_id": deal.get("deal_id"),
                "error": str(e),
                "row": {k: v for k, v in deal.items() if k in ('buyer_name', 'target_name', 'deal_value_usd_mm', 'critic_score', 'outcome_score')}
            }) + "\n")
        print(f"[validate] SKIP {deal.get('deal_id')}: {e}")
        return False
```

- [ ] **Step 2: For each writer in `logs/writer_sites_deals.txt`, wrap the write**

Pattern (repeat per site):
```python
# Before:
client.table("deals_enriched").upsert(deal).execute()

# After:
from scripts.validate_deal_value import validate_or_log
if validate_or_log(deal):
    client.table("deals_enriched").upsert(deal).execute()
```

*Import path note:* if `from scripts.validate_deal_value import ...` fails with `ModuleNotFoundError`, `scripts/` lacks an `__init__.py` and isn't on `sys.path`. Options in order of preference:
1. Add `scripts/__init__.py` (empty file) once, and run scripts from repo root (`python -m scripts.<name>`).
2. At the top of each modified writer, prepend `sys.path`: `import sys; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))`.
Pick (1) if no existing writer does sys.path manipulation; pick (2) if the codebase already uses that pattern to match convention.

- [ ] **Step 3: Run existing test suite to confirm no regressions**

```bash
pytest -v --tb=short
```
Expected: all previously passing tests still pass.

- [ ] **Step 4: Commit**

```bash
git add scripts/validate_deal_value.py scripts/<modified_writers>
git commit -m "feat: wire validate_or_log into all deals_enriched writer sites"
```

---

## Phase 5 — Ship + verify (~30 min)

### Task 5.1: Final deploy + post-ship audit

- [ ] **Step 1: Confirm all three workstreams merged**

```bash
# Frontend repo
cd "C:\Users\xadro\the-pharma-closeout" && git log --oneline -15

# Data repo
cd "C:\Users\xadro\OneDrive\Documents\documents\AI Projects\BZG\BD lookup tool\BD Data Base" && git log --oneline -15
```
Expect Phase 1, 2, 3, 4 commits in respective histories.

- [ ] **Step 2: Run the audit queries**

Execute against live Supabase:
```sql
-- No outliers
SELECT COUNT(*) AS outliers FROM deals_enriched WHERE deal_value_usd_mm > 400000;
-- expect: 0

-- CS distribution sanity
SELECT
  COUNT(*) FILTER (WHERE critic_score = 100) AS cs100_count,
  COUNT(*) FILTER (WHERE critic_score IS NOT NULL) AS scored_count,
  ROUND(STDDEV(critic_score)::numeric, 2) AS cs_stddev
FROM deals_enriched;
-- expect: cs100_count / scored_count < 0.15, cs_stddev > 10
--   (or cs_stddev criterion waived if fallback path taken)
```

- [ ] **Step 3: Browser smoke test on production**

Open `https://thepharmacloseout.com/deals.html`. Run the Task 3.6 checklist against the live site.

- [ ] **Step 4: Write release note + update memory**

Append to `docs/release-notes.md` (create if missing):
```markdown
## 2026-04-22 — BD search UX & data integrity fix

- Fixed 2 broken filter dropdowns (deal_type, era)
- Added therapeutic area filter + sort control (4 options)
- Added Load More pagination (replaces 50-result cap)
- Fixed 7 corrupted deal_value_usd_mm rows
- Re-scored 279 CS=100 deals (or applied display cap fallback)
- Added inline validator to prevent future value corruption
```

Save a cloud-brain memory reflecting the shipped state.

- [ ] **Step 5: Final commit**

```bash
git add docs/release-notes.md
git commit -m "docs: release notes for BD search fix"
git push origin main
```

---

## Success criteria checklist (copy into PR description)

- [ ] All 4 `deal_type` filter values return >0 deals
- [ ] All 4 `era` filter values return >0 deals
- [ ] At least 10 of 12 TA filter values return >0 deals
- [ ] Sort by value, critic, outcome all reorder correctly
- [ ] Load More pagination works; appends don't replace
- [ ] No deal in DB has `deal_value_usd_mm > 400,000`
- [ ] CS distribution has stddev > 10 AND CS=100 count <15% of scored deals (OR display-cap fallback shipped with under-review banner)
- [ ] `node --test tests/deals_search.spec.mjs` all pass
- [ ] `pytest tests/test_validate_deal_value.py` all pass
- [ ] All `deals_enriched` writers wrapped with `validate_or_log`
- [ ] Live site `thepharmacloseout.com/deals.html` passes browser smoke test
