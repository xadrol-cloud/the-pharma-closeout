# BD Deal Intelligence — Broadway-Aesthetic Refresh

**Date:** 2026-05-05
**Author:** Bin Zhu (design via Claude)
**Status:** Spec — pending review
**Reference site:** broadwayscorecard.com (Bin's chosen aesthetic anchor)

---

## 1. Problem & Motivation

The Pharma Closeout's Deal Intelligence product (`/deals.html`, `/deal.html`, `/compare.html`) is positioned as "Rotten Tomatoes for pharma deals" — but the visual treatment reads as a reporting tool, not a consumer-product scorecard.

Specific gaps surfaced during a side-by-side review against broadwayscorecard.com:

- **Score chips are pastel and non-tier-coded.** A 100/100 looks the same color as a 50/50. Users have to read the number to assess. Broadway's saturated green/teal/yellow/orange/red chips communicate tier at a glance.
- **No verbal tier callouts.** Broadway pairs every score with bold colored words ("RECOMMENDED" green, "WORTH SEEING" teal, "CRITICAL MISS" red). We have anchored ranges in Scoring V2 (Exceptional / Strong / Adequate / Weak / Failed) but never surface the verbs.
- **Filter UI uses 5 native `<select>` dropdowns side-by-side.** Functional but generic. Broadway uses pill toggles for primary scope + segmented chips for category + small all-caps text chips for secondary controls (Status, Sort).
- **No row-list view for search results.** We only render poster grids. Broadway combines both: poster carousels for highlights + a row-list (poster thumb + meta + score chip + tier label) for the primary listing.
- **Deal-type chips are barely visible.** Black-on-light-blue 10px monospace at the corner of a poster — easy to miss. Broadway's category chips (MUSICAL purple, PLAY blue, REVIVAL gray, ORIGINAL gold) are loud and semantic.
- **Wordmark is small and quiet (16px).** Broadway's wordmark is a heavy two-tone hero element — it sells the product before any content loads.
- **No persistent primary CTA.** Broadway's gold-filled "Get the Scorecard" pill is always in the nav, channeling traffic to monetization. Our nav has no equivalent — the briefing CTA only exists on `/ai-research.html`.
- **Detail page lacks a stat-cascade visualization.** Broadway's hero shows a horizontal segmented bar ("7 Rave / 9 Positive / 5 Mixed") — a one-glance breakdown of the underlying review distribution. Our deal hero has scores but no comparable breakdown of deal economics (upfront / milestones / royalties / equity), which we already have in the schema.
- **Critic Reviews section has no per-outlet score chips.** We show pull-quotes from analyst sources but never visualize the analyst's own rating per article. Broadway shows a small colored chip per outlet next to the quote.

**The combined effect:** the Deal Intelligence product looks like a Tableau dashboard, not the Rotten-Tomatoes-for-pharma category-defining product Bin wants it to be.

## 2. Goal & Audience

Refresh the visual + interaction language of Deal Intelligence to match the Broadway Scorecard aesthetic confidence — **at-a-glance signal, verbal+color tier reinforcement, semantic chip palette, persistent monetization CTA** — without breaking existing functionality, IA, or data contracts.

**Primary audiences (descending):**
1. **Consulting prospect / LinkedIn-tap visitor.** Lands on a deal page, decides in 10 seconds whether this product is credible. Tier chip + verbal label is the single biggest perceived-quality lever.
2. **Bin in a meeting.** Pulls up a deal on his phone to demo to a client. Needs the page to *look* like a real product when held up at arm's length.
3. **Briefing buyer.** Mobile traffic that should funnel to `/ai-research.html` Gumroad checkout. A persistent gold-pill nav CTA captures this without forcing a deep page visit.
4. **Analyst-on-the-go.** Browses, filters, compares. The row-list view is for them — denser than poster grid, sortable.

## 3. Design Principles (Informed by Broadway)

1. **Color is the signal, words are the confirmation.** Tier color on the chip (green/teal/yellow/orange/red), tier label in matching color above it. Skim → parse → act.
2. **Loud semantic chips.** Categorical pills (deal type, status) get strong fills. Tags (therapeutic area, era) stay quiet pastel.
3. **Two listing formats, two purposes.** Poster grid for "highlights" carousels, row-list for "search results" — never one or the other.
4. **One persistent primary CTA.** A single gold-filled pill action lives in the nav across all pages. Phase 9's Gumroad work converts this.
5. **Confidence in the wordmark.** Heavy weight, two-tone, larger. Brand sells before content loads.
6. **Inherit Broadway's restraint.** Dark background, generous padding, minimum chrome. Don't import their specific colors literally — keep our gold (`#c9a84c` / `#c49332`) as the anchor.

## 4. Scope

### In scope (this spec)

| Workstream | Surface | Effort estimate |
|---|---|---|
| **WS-A** — Tier-coded score chip system | `assets/deals.css`, `assets/deals.js`, `deal.html` template | 1-2h |
| **WS-B** — Verbal tier callouts | `assets/deals.js` rendering, `assets/deals.css` | 0.5h |
| **WS-C** — Semantic deal-type pill palette | `assets/deals.css`, `assets/deals.js` poster + row renderers | 0.5h |
| **WS-D** — Filter row → pill toggles + status/sort chips | `deals.html`, `assets/deals.css`, `assets/deals.js` | 2-3h |
| **WS-E** — Row-list view for search results | `assets/deals.js` (new render fn), `assets/deals.css` | 2h |
| **WS-F** — Wordmark + nav refresh + persistent gold-pill CTA | All 6 pages, `assets/deals.css`, `index.html` inline | 2h |
| **WS-G** — Deal value cascade bar | `deal.html` template via `assets/deals.js`, `assets/deals.css` | 1.5h |
| **WS-H** — Per-outlet critic score chips | `assets/deals.js` review renderer, `assets/deals.css` | 1h |

### Out of scope (deferred or owned elsewhere)

| Concern | Status |
|---|---|
| Mobile responsive optimization | Already in flight (`2026-05-02-bd-mobile-optimization`) — Phase 3 done, Phases 4-10 pending. Phase 11 layers ON TOP, not replacing. |
| New scoring methodology, new economic dimensions | Owned by data team; this spec only surfaces existing schema |
| Search bar funnel-icon expand pattern | Cleaned up by mobile Phase 4 filter accordion already |
| `index.html` landing page redesign beyond nav | Brand identity stays — only the nav-CTA pill is added |
| `compare.html` mobile sticky-label table | Already covered by mobile Phase 6 |
| Gumroad overlay button | Already covered by mobile Phase 9 |
| Color palette overhaul | Keep existing tokens (`--gold`, `--bg`, `--ink`); only tier colors are added |
| Font swap | Keep current fonts; only weights/sizes change |
| New illustration system | Out of scope |

### Layering order with mobile-optimization plan

The mobile-optimization plan (Phase 3 done; Phases 4-10 pending) and this spec must layer cleanly. Recommended sequencing:

1. **Finish mobile Phases 4-9 first** (deals/deal/compare/index/about/ai-research mobile fixes). These are CSS additions inside breakpoints — they don't conflict with anything in this spec.
2. **Mobile Phase 10 QA + cache-buster bump** lands.
3. **This spec executes as Phase 11** with its own plan doc. Order can be 11A → 11H or interleaved as judgment dictates.

If executed out of order, conflicts are localized: WS-A (score chips) overlaps with mobile Phase 5 (deal.html prose), but only on font-size rules — easy to resolve. WS-D (filter row) overlaps with mobile Phase 4 filter accordion — needs to be sequenced carefully (the filter row markup gets rebuilt either way, so doing WS-D first and then layering accordion on top is the cleanest order).

## 5. WS-A — Tier-Coded Score Chip System

### A.1 — Tier→color mapping (Scoring V2 anchored ranges)

Surface our existing Scoring V2 anchored ranges as visual tiers:

| Score range | Tier name | Chip color | Hex (proposed) | Tier label color |
|---|---|---|---|---|
| 90–100 | Exceptional | Bright green | `#2d8a4f` | Same green |
| 75–89 | Strong | Teal | `#2a8a8a` | Same teal |
| 60–74 | Adequate | Gold | `#c9a84c` | Same gold |
| 40–59 | Weak | Orange | `#c47b3a` | Same orange |
| 0–39 | Failed | Red | `#c43a3a` | Same red |

These ranges already exist in `scripts/score_calculator.py` (Phase 6 Scoring V2). The frontend just needs to consume them.

**Same chip system applies to both Critic Score and Outcome Score**, but Outcome Score uses the same tier breakpoints with its own anchor naming ("Outperformed / Met / Underperformed / Failed"). The label text differs; the color does not.

### A.2 — Chip CSS

```css
.score-chip {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  font-family: var(--sans);
  font-weight: 700;
  font-size: 36px;
  color: #fff;
  line-height: 1;
}
.score-chip[data-tier='exceptional'] { background: #2d8a4f; }
.score-chip[data-tier='strong']      { background: #2a8a8a; }
.score-chip[data-tier='adequate']    { background: #c9a84c; color: #0a0a0a; }
.score-chip[data-tier='weak']        { background: #c47b3a; }
.score-chip[data-tier='failed']      { background: #c43a3a; }
.score-chip-mini { width: 44px; height: 44px; font-size: 18px; border-radius: 6px; }
```

Two sizes: full `score-chip` (80px) for hero use on `deal.html`, mini (`score-chip-mini` 44px) for row-list and per-outlet-review use.

### A.3 — Markup contract

```html
<div class="score-block">
  <span class="tier-label" data-tier="exceptional">EXCEPTIONAL</span>
  <div class="score-chip" data-tier="exceptional">94</div>
  <span class="score-meta">Critic Score · Industry consensus</span>
</div>
```

JS computes the tier attribute from the numeric score via a single helper (`tierForScore(n) → 'exceptional' | 'strong' | ...`). Helper is a 5-line lookup, not a server change.

### A.4 — Where it lands

- `deal.html` hero — replaces existing two pastel pills (`100 CRITIC SCORE Industry consensus` / `86 OUTCOME SCORE Measured results`) with two `.score-block` instances stacked vertically.
- `deals.html` Featured Deal hero — same treatment.
- `deals.html` row-list view (WS-E) — uses the mini variant on the right side of each row.
- `compare.html` — adopts mini variant in the comparison cells.

## 6. WS-B — Verbal Tier Callouts

The tier label sits *above* the chip in matching color, in 11px all-caps with 1.5× letter-spacing.

```css
.tier-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.tier-label[data-tier='exceptional'] { color: #2d8a4f; }
.tier-label[data-tier='strong']      { color: #2a8a8a; }
.tier-label[data-tier='adequate']    { color: #c9a84c; }
.tier-label[data-tier='weak']        { color: #c47b3a; }
.tier-label[data-tier='failed']      { color: #c43a3a; }
```

**Outcome Score uses different tier nouns:**

| Range | Critic Score label | Outcome Score label |
|---|---|---|
| 90–100 | EXCEPTIONAL | OUTPERFORMED |
| 75–89 | STRONG | MET THESIS |
| 60–74 | ADEQUATE | TRACKING |
| 40–59 | WEAK | UNDERPERFORMED |
| 0–39 | FAILED | FAILED |

Helper: `tierLabelFor(score, dimension) → 'EXCEPTIONAL' | 'OUTPERFORMED' | ...`

## 7. WS-C — Semantic Deal-Type Pill Palette

Promote deal type from a poster-corner footnote to a real categorical pill.

| Deal type | Color | Hex |
|---|---|---|
| Acquisition/Merger (M&A) | Purple | `#7a4c8f` |
| Licensing/Option | Blue | `#3d5fa3` |
| Co-Development | Teal | `#2a8a8a` |
| Asset Purchase | Orange | `#c47b3a` |

```css
.deal-type-pill {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-family: var(--sans);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: #fff;
}
.deal-type-pill[data-type='ma']         { background: #7a4c8f; }
.deal-type-pill[data-type='licensing']  { background: #3d5fa3; }
.deal-type-pill[data-type='codev']      { background: #2a8a8a; }
.deal-type-pill[data-type='asset']      { background: #c47b3a; }
```

**Status pill (separate, smaller palette):**

| Status | Color | Hex |
|---|---|---|
| Complete | Green | `#2d8a4f` |
| Pending | Gold | `#c9a84c` (dark text) |
| Archived | Gray | `#5c5c5c` |

**Therapeutic-area pills stay light/pastel (existing pattern unchanged)** — they're tags, not status.

## 8. WS-D — Filter Row → Pill Toggles + Status/Sort Chips

### D.1 — Top row: pill toggles (deal type)

Replace `<select name="deal_type">` with 4 pill toggle buttons + an "All" reset:

```html
<div class="deal-type-toggles" role="group" aria-label="Deal type filter">
  <button class="dt-toggle active" data-dt="">All <span class="dt-count">1297</span></button>
  <button class="dt-toggle" data-dt="Acquisition/Merger" data-type="ma">M&A <span class="dt-count">387</span></button>
  <button class="dt-toggle" data-dt="Licensing/Option" data-type="licensing">Licensing <span class="dt-count">512</span></button>
  <button class="dt-toggle" data-dt="Co-Development" data-type="codev">Co-Dev <span class="dt-count">274</span></button>
  <button class="dt-toggle" data-dt="Asset Purchase" data-type="asset">Asset <span class="dt-count">124</span></button>
</div>
```

Counts populated from a single Supabase aggregation call on page load (cached). `.dt-toggle.active` gets a fill in the matching deal-type color.

### D.2 — Second row: dropdowns for high-cardinality filters

Therapeutic Area (16+ options) and Era (4 options) stay as `<select>` — too many options for chips. Visual treatment changes: dark-charcoal rounded-rect with subtle border, gold-on-focus.

Min Value also stays as `<select>` (5 options) for tabular consistency with TA + Era.

### D.3 — Third row: status + sort as text chips

```html
<div class="aux-controls">
  <span class="aux-group">
    <span class="aux-label">STATUS:</span>
    <button class="aux-chip active" data-status="">ALL</button>
    <button class="aux-chip" data-status="complete">COMPLETE</button>
    <button class="aux-chip" data-status="pending_review">PENDING</button>
    <button class="aux-chip" data-status="archived">ARCHIVED</button>
  </span>
  <span class="aux-group">
    <span class="aux-label">SORT:</span>
    <button class="aux-chip active" data-sort="date_desc">NEWEST <span class="aux-arrow">↓</span></button>
    <button class="aux-chip" data-sort="value_desc">DEAL VALUE</button>
    <button class="aux-chip" data-sort="critic_desc">CRITIC SCORE</button>
    <button class="aux-chip" data-sort="outcome_desc">OUTCOME</button>
    <button class="aux-chip" data-sort="alpha">A–Z</button>
  </span>
</div>
```

CSS: small all-caps text, gold on active with underline + arrow indicator.

```css
.aux-chip {
  background: none; border: none; cursor: pointer;
  font-family: var(--sans); font-size: 11px; font-weight: 600;
  letter-spacing: 1px; text-transform: uppercase;
  color: var(--ink-muted); padding: 6px 4px;
}
.aux-chip.active {
  color: var(--gold);
  border-bottom: 1px solid var(--gold);
}
.aux-label {
  font-size: 11px; letter-spacing: 1.5px; color: var(--ink-faint);
  margin-right: 8px;
}
```

### D.4 — JS wiring

Existing `searchDeals()` in `assets/deals.js` already accepts a filter object. The pill-toggle click handlers update the filter object and call `searchDeals()` — no API changes. Active state managed via `.active` class on the clicked toggle, with siblings cleared.

### D.5 — Filter row layering with mobile Phase 4 accordion

Mobile Phase 4 plans an accordion that hides the filter row behind a `<button class="filter-toggle">`. WS-D's new pill+chip layout becomes the *content* of that accordion on mobile. Order matters: WS-D first (rebuilds the markup), then Phase 4 wraps the accordion around it.

If the mobile-optimization plan finishes Phase 4 *before* this spec executes, the Phase 4 toggle wraps the existing 5-select markup. WS-D then refactors the inside of the accordion. **Either order works**, but documenting both in the plan doc avoids a "wait, who renders what" question mid-implementation.

## 9. WS-E — Row-List View for Search Results

### E.1 — Pattern

Replace the search-results grid (currently poster cards) with a row-list:

```
┌──────────────────────────────────────────────────────────────────┐
│ [poster] Deal Title                              ┌────────┐     │
│  120×170  Buyer × Target                         │   77   │     │
│          [M&A purple] [Oncology] [Complete]     └────────┘     │
│          $5.2B · Mar 2024 · Closes Q3 2026     STRONG         │
│                                                  ┌────┐        │
│                                                  │ 84 │ ★      │
│                                                  └────┘        │
└──────────────────────────────────────────────────────────────────┘
```

- Left: poster thumb (120×170, rounded 6px corners, no overlay)
- Middle: title (18px bold) → deal pair (14px muted) → pill row (deal type + therapeutic area + status) → meta row (value · date · closure if recent)
- Right: tier label (11px caps, colored) over score-chip (80px) over mini outcome chip below
- Closure date in gold if within next 90 days (urgency cue)

### E.2 — Carousels stay

Top-of-page carousels (Latest Deals / Trending / Highest Outcome) keep the poster grid format. The row-list only replaces the **search-results** rendering inside `#results-container`.

### E.3 — JS

New render function `renderResultRow(deal)` in `assets/deals.js`. Existing `renderResults()` calls it instead of `renderPoster(d, 'carousel')`.

### E.4 — Layering with mobile Phase 4

Mobile Phase 4 Task 4.5 wanted to change `renderResults()` from carousel-poster to grid-poster. WS-E supersedes that — row-list IS the new format and it's already mobile-friendly (single column flow on phone, side-by-side on desktop). The row-list naturally collapses to a phone-friendly layout via flex-wrap on the right-side score block.

## 10. WS-F — Wordmark + Nav Refresh + Persistent Gold-Pill CTA

### F.1 — Wordmark size + weight

Bump `.nav-brand` from 16px → 22px on desktop, 20px on mobile. Weight stays 700 but the larger size carries more presence.

```css
.nav-brand {
  font-family: var(--brand);
  font-weight: 700;
  font-size: 22px;
  letter-spacing: -0.3px;
}
@media (max-width: 600px) {
  .nav-brand { font-size: 20px; }
}
```

`<em>Closeout</em>` already gets the gold accent. Two-tone preserved.

### F.2 — Persistent primary CTA pill

Add a "Get the Briefing →" gold-filled pill in the nav, right-aligned, before the search input on desktop. On mobile, the pill becomes its own row below the brand (or stays in nav next to hamburger — TBD by space).

```html
<a class="nav-cta" href="ai-research.html#briefing">Get the Briefing <span aria-hidden="true">→</span></a>
```

```css
.nav-cta {
  display: inline-flex;
  align-items: center;
  background: var(--gold);
  color: #0a0a0a;
  padding: 8px 16px;
  border-radius: 18px;
  font-family: var(--sans);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-decoration: none;
  margin-left: auto;
  margin-right: 16px;
  white-space: nowrap;
  transition: transform 0.15s, box-shadow 0.15s;
}
.nav-cta:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(196, 168, 76, 0.3);
}
```

### F.3 — Apply across all 6 pages

`assets/deals.css` adds `.nav-cta` rule (gets cascaded to deals/deal/compare). `index.html` adds an equivalent inline rule + the markup. `about.html` and `ai-research.html` get the same markup but the latter is the destination — when on `/ai-research.html` the pill should anchor-jump to `#briefing` rather than navigate.

### F.4 — Mobile placement decision

Two options:
- **A.** Pill stays in the nav header next to the hamburger (44×44) — visible on every page on every viewport.
- **B.** Pill becomes a row 2 of the nav on mobile, full-width.

**Recommendation: A.** Maximum visibility, single-row nav, matches Broadway's pattern (their gold "Get the Scorecard" CTA stays in the nav at all viewports). Only collapses to icon-only at <360px (rare).

## 11. WS-G — Deal Value Cascade Bar

### G.1 — Pattern

Horizontal segmented bar visualizing deal economics on `deal.html` hero:

```
$5.2B Total
┌─────┬───────────────┬─────────┬────────┐
│ $1B │   $2.5B       │  $1.2B  │ $500M  │
│Up.  │   Milestones  │ Roy.    │ Equity │
└─────┴───────────────┴─────────┴────────┘
```

Segments proportional to value. Colors:
- Upfront: green (cash now, lowest risk to the seller)
- Milestones: gold (probability-weighted)
- Royalties: teal (long-tail revenue)
- Equity: purple (M&A consideration)

### G.2 — Data source

`deals.economics_breakdown` JSONB column from Phase 16c migration — already populated with `{upfront, milestones, royalties, equity}` for ~340 enriched deals. Render only when the breakdown is available; fall back to total-only for legacy rows.

### G.3 — Markup

```html
<div class="value-cascade" data-total="5200">
  <div class="vc-segment" data-kind="upfront" style="--pct: 19">
    <span class="vc-amount">$1B</span>
    <span class="vc-label">Upfront</span>
  </div>
  <div class="vc-segment" data-kind="milestones" style="--pct: 48">...</div>
  <div class="vc-segment" data-kind="royalties" style="--pct: 23">...</div>
  <div class="vc-segment" data-kind="equity" style="--pct: 10">...</div>
</div>
```

### G.4 — CSS

```css
.value-cascade {
  display: flex;
  width: 100%;
  height: 64px;
  border-radius: 6px;
  overflow: hidden;
  margin: 16px 0 8px;
}
.vc-segment {
  flex: var(--pct, 1);
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: #fff;
  font-family: var(--sans);
  border-right: 1px solid rgba(255,255,255,0.2);
}
.vc-segment:last-child { border-right: 0; }
.vc-segment[data-kind='upfront']    { background: #2d8a4f; }
.vc-segment[data-kind='milestones'] { background: #c9a84c; color: #0a0a0a; }
.vc-segment[data-kind='royalties']  { background: #2a8a8a; }
.vc-segment[data-kind='equity']     { background: #7a4c8f; }
.vc-amount { font-size: 16px; font-weight: 700; }
.vc-label  { font-size: 10px; opacity: 0.85; text-transform: uppercase; letter-spacing: 1px; }
```

Below 480px segments stack vertically (each takes full width with left-aligned labels).

## 12. WS-H — Per-Outlet Critic Score Chips

### H.1 — Pattern

In the Critic Reviews section on `deal.html`, each review row currently shows quote + outlet name + date + "Full Review →". Add a mini score chip on the left.

```
┌────┐ FiercePharma                                Apr 25, 2024
│ 88 │ "Largest IDH-mutant franchise consolidation in oncology..."
└────┘ By Andrew Dunn · FULL REVIEW ↗
```

### H.2 — Data source

Each `deal_sources` row already has a `critic_score` column populated by enrichment. The frontend just needs to render it.

### H.3 — Markup + CSS

Use the existing `.score-chip-mini` from WS-A. No new CSS needed beyond the chip system.

### H.4 — Color coding

Same tier mapping as WS-A — 88 renders teal (Strong), 75 renders gold (Adequate), 50 renders orange (Weak). At a glance, users see the distribution of opinion across outlets.

## 13. Cross-Cutting Aesthetic Polish

### Backgrounds

- Keep `deals.html` and `deal.html` light backgrounds (matches print-publication aesthetic Bin chose for the data tool).
- Keep `index.html` dark background (brand landing identity).
- Row-list cards (WS-E) get a subtle `1px solid rgba(0,0,0,0.06)` border with `2px` inner shadow for tactile feel.

### Typography weight contrast

- Deal titles bumped 18px → 20px on row list, 24px → 28px on detail hero.
- Body 14px → 15px on detail page (also covered by mobile Phase 5).
- Brand wordmark 16 → 22 (WS-F.1).

### Motion

- Hover states keep current transitions (no new motion).
- All `transform` hover effects already wrapped in `@media (hover: hover)` per mobile Phase 4 — nothing to redo.

## 14. Accessibility

- All score chips include the numeric value visible (not color-only). Tier label provides verbal reinforcement. Color-blind users see numbers + words.
- Pill toggles and aux chips use `<button>` elements with proper `aria-pressed` / `aria-current` states.
- Focus rings preserved (gold outline already in `--gold` token).
- Tier label colors meet WCAG AA on the dark/light backgrounds where they appear (verify with Lighthouse during Phase 11 QA).

## 15. Testing

- **Visual regression sweep:** screenshots of `deals.html`, `deal.html`, `compare.html`, `index.html` at 1440 / 600 / 375 px before and after each WS lands.
- **Lighthouse mobile audit:** captured at end of Phase 11 (separate from mobile Phase 10's audit).
- **Tier-rendering smoke:** for each of the 5 tier ranges (94 / 80 / 65 / 50 / 30), render a deal and confirm chip color + tier label match.
- **No automated visual diff** in this scope — implementer captures screenshots manually.

## 16. Out of Scope (explicit)

- New scoring methodology
- New deal economic dimensions beyond what's in the schema
- Color palette overhaul beyond tier additions
- Font swap
- Comparison page redesign beyond mini score chips
- LinkedIn / Articles section restructure on `index.html`
- Email service provider integration
- A/B testing infrastructure

## 17. File Inventory (predicted)

**Files modified:**
- `assets/deals.css` — score-chip system, tier-label rules, deal-type pill palette, aux-chip styles, value-cascade rules, nav-cta rule, .nav-brand size bump
- `assets/deals.js` — `tierForScore()` + `tierLabelFor()` helpers, `renderResultRow()`, score-chip + value-cascade render functions, filter pill-toggle handlers, per-outlet score-chip injection in review render
- `deals.html` — replace filter row markup with pill toggles + aux chips
- `deal.html` — hero score block restructure (template region rendered by JS), value-cascade slot
- `compare.html` — adopt mini score chips in comparison cells
- `index.html` — wordmark size bump in inline `<style>`, nav-cta markup + inline rule
- `about.html` — nav-cta markup
- `ai-research.html` — nav-cta markup with anchor-aware behavior

**Files created:**
- (none expected — all changes additive to existing files)

## 18. Risk

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Tier color choices don't read well on light vs dark backgrounds | Medium | Medium | Test on both `deals.html` (light) and `index.html` (dark) backgrounds before committing palette. Adjust contrast if needed. |
| Filter pill-toggle counts (D.1) require Supabase aggregation that doesn't exist yet | Low | Low | Existing `count` query supports it; add a single endpoint method or use the row-count from each filtered fetch. |
| Mobile Phase 4 accordion + WS-D pill toggles have a sequencing conflict | Medium | Low | Document order in Phase 11 plan doc. Either-order works with adjustment. |
| Wordmark size bump breaks index.html's hand-tuned hero rhythm | Low | Medium | Check baseline screenshots; index.html is a separate inline-styled page so the change is locally scoped. |
| Persistent nav CTA cannibalizes other in-page CTAs (e.g., on `/ai-research.html` itself) | Low | Low | Suppress the nav CTA OR convert to anchor-jump on the destination page (already in F.3). |
| Score-chip color (`#c9a84c` Adequate) clashes with existing gold token use | Low | Low | Adequate tier intentionally uses the brand gold to anchor the system. Test visually; adjust the gold variant for chip use only if needed. |

## 19. Approval Gates

This spec is the "Spec — pending review" gate. After Bin reviews:
1. **If approved:** write the implementation plan (`docs/superpowers/plans/2026-05-XX-broadway-aesthetic.md`) breaking this into checkbox tasks per WS.
2. **If revisions needed:** revise spec, re-review.
3. **If a WS gets cut:** strike from this spec + plan together.

**Do not begin implementation before the plan doc lands and is approved.**

---

**Companion documents (existing):**
- `docs/superpowers/plans/2026-05-02-bd-mobile-optimization.md` — sequenced before this; Phase 3 done, Phases 4-10 pending
- `docs/superpowers/specs/2026-05-02-bd-mobile-optimization-design.md` — sequenced before this
