# BD Deal Intelligence — Search UX & Data Integrity Fix

**Date:** 2026-04-22
**Author:** Bin Zhu (design via Claude)
**Status:** Spec — design approved, pending review

## Problem

Live browser testing of `thepharmacloseout.com/deals.html` found the search surface is partially broken:

1. **Two filter dropdowns return zero results on every selection.** The HTML option values (`Acquisition`, `Pre-2010`, etc.) don't match the actual database column values (`Acquisition/Merger`, `2020s`, etc.). Both `deal_type` and `era` filters are effectively unreachable.
2. **Search is capped at 50 results with no pagination and no sort control.** Users querying common terms ("oncology" → 50 hits of 477) cannot browse further or reorder.
3. **Seven `deal_value_usd_mm` rows are corrupted** with unit-conversion errors, rendering values like `$25,947,200.0B` on cards. This destroys credibility across both the search results grid and the three carousels.
4. **78% of deals (279/358 sampled) have `critic_score = 100`.** Either Scoring V2 hasn't run on these rows or the rubric defaults to max when inputs are missing.
5. **No therapeutic area filter chip**, despite TA being the most common browse axis for pharma BD users.

The combined effect: the search tool — the product's core utility — is unusable for its primary use cases (filter by TA, sort by Critic Score, browse more than 50 results).

## Scope

### In scope (this spec)

- **WS-A Frontend** — Fix broken filter values, add pagination (Load More), add sort control (4 options), add TA filter chip, add min-query-length gate.
- **WS-B Data corrections** — Fix 7 known-corrupt deal value rows; investigate + re-score the 279 CS=100 rows (time-boxed 1 day, with fallback).
- **WS-C Inline validator** — ~30-line Python value-sanity checker hooked into existing enrichment writers; defends against re-contamination.

### Out of scope (owned elsewhere)

| Concern | Owned by |
|---|---|
| Auto-enrichment pipeline, confidence gates, `enrichment_status` column | Research Standards spec (2026-04-21) |
| Deep source-hierarchy methodology (7-tier validation) | Research Standards spec |
| Carousel redesign / homepage layout changes | Not needed — fixing the 7 corrupt values repairs carousel display automatically |
| Mobile/responsive audit | Separate spec after this ships |
| URL state / shareable search links | YAGNI for now |

## Architecture

Three workstreams across two repos:

| Workstream | Repo | Touched files |
|---|---|---|
| WS-A Search UX | `the-pharma-closeout` | `deals.html`, `assets/deals.js` |
| WS-B Data | `BD Data Base` | `scripts/fix_corrupt_values.py`, scoring script re-run |
| WS-C Validator | `BD Data Base` | `scripts/validate_deal_value.py` + writer hooks |

**Release gating:** WS-B ships before WS-A so sort-by-CS is meaningful when users see it. WS-C can ship in parallel (defensive only).

## WS-A — Frontend changes (repo: `the-pharma-closeout`)

### A.1 — `deals.html` filter row rewrite (lines 86-108)

Replace existing options with DB-aligned values + add two new filter chips:

```html
<!-- Deal Type: exact DB values -->
<select name="deal_type" class="f-chip" aria-label="Deal Type">
  <option value="">All Deal Types</option>
  <option value="Acquisition/Merger">Acquisition / M&A</option>
  <option value="Licensing/Option">Licensing / Option</option>
  <option value="Co-Development">Co-Dev / Collaboration</option>
  <option value="Asset Purchase">Asset Purchase</option>
</select>

<!-- Era: decade buckets matching era_tag -->
<select name="era" class="f-chip" aria-label="Era">
  <option value="">All Eras</option>
  <option value="2020s">2020s</option>
  <option value="2010s">2010s</option>
  <option value="2000s">2000s</option>
  <option value="1990s">1990s</option>
</select>

<!-- NEW: Therapeutic Area -->
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

<!-- Keep existing min_value select unchanged -->

<!-- NEW: Sort -->
<select name="sort" class="f-chip" aria-label="Sort">
  <option value="date_desc">Newest First</option>
  <option value="value_desc">Highest Value</option>
  <option value="critic_desc">Highest Critic Score</option>
  <option value="outcome_desc">Highest Outcome Score</option>
</select>
```

**Rationale for decade buckets over year ranges:** The DB stores `era_tag` as `2020s`/`2010s`/`2000s`/`1990s`. Aligning the UI to the DB is simpler than translating "Pre-2010" → `['1990s','2000s']` in JS and matches how users think when scanning the timestamp column on cards.

**TA list derivation:** The 12 TAs above are the product's intended canonical list. Before implementation, run a distinct count across `therapeutic_areas` JSON arrays in Supabase to confirm all listed TAs have ≥5 deals and to identify any missing high-volume TA that should replace "Other."

### A.2 — `assets/deals.js` `searchDeals()` rewrite (line 198)

```js
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

**Behavior changes:**
- Return shape is now `{ deals, total }` (was raw array) — all callers must update.
- Default page size 25 (was 50).
- Adds `sort`, `therapeutic_area` filters; honors `offset`.
- Throws on Supabase error instead of silently returning empty array.

**Caller enumeration (as of 2026-04-22):** only `initSearch()` in `assets/deals.js` calls `searchDeals`. The homepage carousels use `fetchLatestDeals`, `fetchTrendingDeals`, `fetchTopOutcomeDeals`, and `fetchFeaturedDeal` — all separate functions with raw-array returns, untouched by this change.

**Column-type note for `therapeutic_areas` / `lead_molecules`:** the existing `.ilike('%query%')` search matches against JSON-stringified representations of these columns. Before implementation, confirm whether the columns are stored as `text` (JSON string) or true `jsonb` — if `jsonb`, switch the TA filter to `.cs()` (contains) for precise matching. Current code treats them as `text`, which works but can match substrings inside unrelated values.

### A.3 — `initSearch()` rewrite (line 1097)

New state + render responsibilities:

```js
export function initSearch(inputEl, filtersEl, resultsEl) {
  if (!inputEl || !resultsEl) return
  let debounceTimer = null
  let loadedCount = 0
  let totalCount = 0
  let lastQuery = ''
  let lastFilters = {}

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
    const hasFilters = Object.keys(filters).filter(k => k !== 'sort').length > 0
    if (query.length < 2 && !hasFilters) { resultsEl.innerHTML = ''; return }
    lastQuery = query; lastFilters = filters
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

Key behaviors:
- **Min query length:** 2 characters required, unless a non-sort filter is set (filter-only browse still works — user can pick "Oncology" without typing).
- **Sort change** triggers fresh search (not append).
- **Load More** appends to grid, updates count label.
- **Back button** preserves scroll position because we don't replace document on sort/page — verified by current carousel behavior.

### A.4 — CSS additions

Add minimal styles to `the-pharma-closeout/assets/site.css` or wherever `.f-chip` lives:

```css
.search-count { color: var(--ink-faint); font-size: 13px; margin-bottom: 12px; }
.search-status { color: var(--ink-faint); font-size: 13px; text-align: center; padding: 40px 0; }
.search-status.error { color: var(--danger, #c13); }
.load-more-btn {
  display: block; margin: 24px auto 0; padding: 10px 24px;
  background: var(--ink); color: var(--paper); border: 0; border-radius: 4px;
  cursor: pointer; font: inherit;
}
.load-more-btn:hover { opacity: 0.85; }
```

## WS-B — Data corrections (repo: `BD Data Base`)

### B.1 — Fix 7 corrupt `deal_value_usd_mm` rows

Script: `scripts/fix_corrupt_values.py`

| Deal | Current (mm) | Target (mm) | Source approach |
|---|---|---|---|
| Novo Nordisk / Vivtex (2025-02-03) | 25,947,200,000 | ~175 | WebFetch Novo Nordisk press release; verify with company site |
| Novartis / Regulus (2025) | 96,914,000 | 1700 | WebFetch Novartis 2025 Q-report; cross-check with deal DB prior-research memory |
| AbbVie / Genentech (2015) | 541,069,000 | ~595 | WebFetch AbbVie/Roche press release |
| Merck / Harpoon (2024) | 9,806,000 | 680 | WebFetch Merck press release (Jan 2024) |
| Sanofi / Lexicon (2015) | 940,000 | ~260 | WebFetch Sanofi press release; cross-check with prior-research memory |
| Amgen / Immunex (2001) | 240,120 | 16000 | WebFetch Amgen 2001 10-K or press release |
| Lilly / Boehringer (2011) | 340,000 | ~500 upfront | WebFetch Lilly/BI Jan 2011 press release — multi-product collab |

**Provenance rule:** every correction must attach a citation URL (company press release or SEC filing) to the `sources` JSONB column. Rows listed above with "prior research" / "established" figures are research anchors — the implementing script MUST still fetch a primary source URL before writing. Do not write a correction with an un-sourced value.

For each corrupt row, the script:
1. Fetches the source via WebFetch (company press release or SEC filing preferred).
2. If a verified value is found, updates `deal_value_usd_mm` and appends source URL to the `sources` JSONB column.
3. If no reliable source is found within 2 attempts, **sets `deal_value_usd_mm = NULL`** and logs the deal_id to `logs/unresolved_values.jsonl` for manual review.
4. Logs every change to `logs/value_corrections.jsonl` with before/after/source.

### B.2 — Critic Score re-score (279 rows)

**Day-1 investigation (time-boxed 8 hours):**

1. Locate Scoring V2 implementation: `scripts/score_batch_*.js` or `scripts/score_v2.py`.
2. Pull raw `critic_reviews` JSONB column from Supabase for 5 CS=100 deals and 5 healthy-spread deals. Diff the inputs.
3. Check two hypotheses in order:
   - **H1 — Scorer never ran on these rows.** Check `critic_score_computed_at` or equivalent timestamp column; if rows are stuck at pre-V2 defaults, re-run V2 over them.
   - **H2 — Rubric ceiling bug.** The "Exceptional ≥95" anchor is too-easily triggered when an input feature defaults to max when a source is missing. Fix the default-max behavior to default-null or penalized, re-run.
4. Fix the root cause, re-run V2 on all 279 CS=100 rows.
5. Verify post-fix distribution: expect CS std-dev > 10, CS=100 count < 30 (≤10% of dataset).

**Fallback if investigation exceeds 1 day:**

- Do not block WS-A release.
- Cap displayed CS at 99 in `renderPoster()` (`Math.min(99, Math.round(score))`).
- Add a one-line note near the Sort dropdown: "Critic Score currently under review."
- Open a follow-up ticket: "BD Critic Score re-score — deferred from 2026-04-22 release."

## WS-C — Inline value-sanity validator (repo: `BD Data Base`)

Script: `scripts/validate_deal_value.py`

```python
"""Lightweight pre-write sanity checks for deal rows.
Integration: every upsert to deals_enriched must call validate() and raise on errors.
This is a defense-in-depth layer until the Research Standards confidence-gated
pipeline ships. Safe to remove once that is live.
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

**Integration:** Grep for `upsert(` and `insert(` calls across `BD Data Base/scripts/` and `writers/`. Wrap each with `validate(deal_dict)` call before the DB write. Estimated 4-6 call sites based on the writer pattern.

**Failure handling:** On raise, log the failing dict to `logs/validation_failures.jsonl` and continue the batch (don't hard-fail the whole run for one bad row). The caller script decides whether to retry or skip.

## Testing

### Frontend (WS-A)

File: `the-pharma-closeout/tests/deals_search.spec.mjs` — vanilla Node fetch tests against live Supabase, no test-runner dependency.

Assertions:
- Each `deal_type` value returns >0 results when no other filter set (4 cases)
- Each `era` value returns >0 results (4 cases)
- Each `therapeutic_area` returns >0 results for at least 10 of 12 TAs
- `sort=value_desc` first result has `deal_value_usd_mm` >= last result
- `sort=critic_desc` first result has `critic_score` >= last result
- `offset=0 limit=25` + `offset=25 limit=25` returns 50 distinct deal_ids for a query with ≥50 hits
- `query='zzzzz'` returns `total=0`
- `query=''` + no filters returns cleared UI (no render)
- `query='a'` (1 char) + no filters returns cleared UI (min-query gate)
- `query=''` + `therapeutic_area=Oncology` returns >0 results (filter-only browse works)

### Data (WS-B)

After B.1 and B.2:
- Re-run the 24-query sweep used in today's audit.
- Assert: `MAX(deal_value_usd_mm) < 400000` across all results.
- Assert: `COUNT(critic_score = 100) / COUNT(*) < 0.1` and `STDDEV(critic_score) > 10`.

### Validator (WS-C)

Unit tests in `tests/test_validate_deal_value.py`:
- Valid row passes
- `deal_value_usd_mm = 25947200000` raises
- `critic_score = 150` raises
- Missing `deal_id` raises
- Boundary values (`0.5`, `400000`, `0`, `100`) pass
- `None` values pass (nullable fields)

## Rollout order

1. **WS-B.1** — ship data fix for 7 corrupt values (1-2 hours).
2. **WS-B.2** — investigate + re-score CS (1 day, with fallback).
3. **WS-A** — frontend UX fix (1 day). Merge after B.1 + B.2 (or fallback) land.
4. **WS-C** — validator (half-day; can ship in parallel with A).
5. **Post-ship** — re-run audit queries to confirm no outliers or CS=100 clustering returned.

## Risks

1. **CS root cause unknown.** Fallback is explicit (display cap + deferred follow-up). Max 1-day delay to WS-A if it blocks.
2. **Unknown-correct values in the 7 corrupt rows** — if WebFetch doesn't surface a trusted source for a given deal, script sets NULL rather than guess. Better to show "Undisclosed" than to keep a corrupted number.
3. **Writer hook coverage** — if validator integration misses a writer path, bad values could still slip in. Mitigate with a post-deploy audit query that alerts if any row's `deal_value_usd_mm` exceeds 400,000.
4. **TA list incomplete** — if the DB has a high-volume TA not in the 12 listed, browse will under-surface it. Mitigate by pre-implementation distinct-count check.
5. **Dependency on Research Standards** — WS-C is intentionally minimal and replaceable. When Research Standards ships, this file can be deleted without migration pain.

## Success criteria

- Every filter dropdown value, when selected in isolation, returns at least one matching deal.
- Users can paginate past the 50-deal limit via Load More.
- Users can reorder results by any of 4 sort keys.
- No deal card in search results or carousels displays a value >$400B.
- Critic Score distribution has std-dev >10 and CS=100 count <10% of dataset (or explicit "under review" banner if fallback taken).
- Post-ship audit: 100% of writer paths call `validate()` before DB write.
