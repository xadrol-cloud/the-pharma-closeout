# BD Website Mobile Optimization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mobile-optimize the full public site at thepharmacloseout.com (6 pages) via incremental responsive CSS pass + nav unification + Gumroad overlay for the briefing form.

**Architecture:** Static HTML + vanilla CSS/JS, no framework. Extend existing `assets/deals.css` with new breakpoints (480px, 375px, hover, reduced-motion). Promote about.html's hamburger nav as the canonical pattern across all pages. Replace fake briefing form with Gumroad's official overlay button. No HTML restructuring beyond nav markup harmonization.

**Tech Stack:** HTML5, CSS3, vanilla JS (ES modules), Supabase JS client, GitHub Pages deployment.

**Spec:** `docs/superpowers/specs/2026-05-02-bd-mobile-optimization-design.md`

---

## Verification Model

This is responsive CSS work. The spec explicitly excludes automated mobile regression testing. Per-task verification uses:
- **DevTools breakpoint sweep:** open the relevant page in Chrome DevTools, toggle device toolbar, test at 375px / 414px / 600px / 768px / 1024px / 1440px.
- **Existing test smoke:** `node --test tests/` must continue passing for tasks that touch `assets/deals.js` or markup that affects search/filter behavior.
- **Real-device pass:** deferred to Phase 10 (final QA).
- **Lighthouse mobile audit:** captured in Phase 10.

**Local preview:** site is static. To preview changes: `cd` to repo root, run `python -m http.server 8000` (or any static server), open `http://localhost:8000/index.html` etc. Resize browser or use DevTools device toolbar.

---

## Phase 1 — Foundation: Global Rules & Breakpoint Scaffolding

Establishes site-wide guarantees (input font 16px, body font bump on mobile, hover/reduced-motion guards, tap-target floor) that every later task depends on. Zero HTML changes; CSS-only.

### Task 1.1: Add global cross-cutting rules to deals.css

**Files:**
- Modify: `assets/deals.css` (append a new section near top after `:root` variables)

- [ ] **Step 1: Open `assets/deals.css` and locate the `:root` block (lines ~1-50).**

- [ ] **Step 2: Immediately after the `body { ... }` block (around line 85-90), add the following section.** Insert after `body` rule, before any component rules.

```css
/* ===================================================================
   Mobile-optimization global rules (added 2026-05-02)
   - Input font-size 16px globally to suppress iOS Safari auto-zoom
   - Reduced-motion guards
   - Print baseline (untouched)
   =================================================================== */

input, textarea, select {
  font-size: 16px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 3: Verify in DevTools.** Open `deals.html` in Chrome, toggle device toolbar to iPhone 14 (390×844). Tap any `<select>` filter. Confirm no auto-zoom occurs (iOS Safari only — verify on real device in Phase 10; Chrome DevTools won't trigger zoom). Visually confirm filter selects are now 16px text.

- [ ] **Step 4: Run existing tests to confirm no regression.**

```bash
node --test tests/
```

Expected: all tests pass (env vars required; if Supabase env not configured locally, this step is informational — the change is CSS-only, not data).

- [ ] **Step 5: Commit.**

```bash
git add assets/deals.css
git commit -m "css: global input font-size 16px + reduced-motion guards"
```

### Task 1.2: Add 480px and 375px breakpoint scaffolding to deals.css

**Files:**
- Modify: `assets/deals.css` (add new `@media` blocks after the existing `max-width: 600px` block, around line ~1948)

- [ ] **Step 1: Locate the end of the `@media (max-width: 600px)` block** in `assets/deals.css` (search for `@media (max-width: 600px)` and find its closing `}`).

- [ ] **Step 2: Add two new media query blocks immediately after** the closing `}` of the 600px block:

```css
/* ===================================================================
   New mobile breakpoints (added 2026-05-02)
   600px: existing tablet-portrait band (unchanged above)
   480px: standard phone band — single-col grids, accordion filters,
          tighter padding, hamburger-only nav
   375px: tightest band — font-size floors, hide non-essential metadata
   =================================================================== */

@media (max-width: 480px) {
  .grid {
    grid-template-columns: 1fr;
  }
  /* additional rules added by later tasks */
}

@media (max-width: 375px) {
  /* additional rules added by later tasks */
}

@media (hover: hover) {
  /* hover rules wrapped here by Task 4.4 */
}

@media (hover: none) {
  /* touch-only adjustments added by Task 4.4 */
}
```

- [ ] **Step 3: Verify in DevTools.** Open `deals.html` at 375px viewport. Confirm the deal grid renders as a single column (was 2-column before).

- [ ] **Step 4: Verify desktop unchanged.** Resize to 1440px. Confirm grid still renders 4 columns.

- [ ] **Step 5: Commit.**

```bash
git add assets/deals.css
git commit -m "css: add 480/375/hover/no-hover breakpoint scaffolding; phone grid 1-col"
```

---

## Phase 2 — Shared Nav Infrastructure

Creates the canonical hamburger pattern (CSS + JS) that all 6 pages will adopt in Phase 3. Until Phase 3 lands the markup, these rules and the JS file are dormant — no visible change yet.

### Task 2.1: Create assets/nav.js with hamburger toggle logic

**Files:**
- Create: `assets/nav.js`

- [ ] **Step 1: Create `assets/nav.js` with the following content.**

```js
// assets/nav.js
// Shared hamburger nav toggle. Loaded by all pages via <script defer src="...">.
// Markup contract (must exist on each page):
//   <button class="nav-toggle" aria-expanded="false" aria-controls="nav-links">...</button>
//   <ul id="nav-links" class="nav-links" data-collapsed="true">...</ul>

(function () {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.getElementById('nav-links');
  if (!toggle || !links) return;

  function open() {
    toggle.setAttribute('aria-expanded', 'true');
    links.setAttribute('data-collapsed', 'false');
  }
  function close() {
    toggle.setAttribute('aria-expanded', 'false');
    links.setAttribute('data-collapsed', 'true');
  }
  function isOpen() {
    return toggle.getAttribute('aria-expanded') === 'true';
  }

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    isOpen() ? close() : open();
  });

  // Close on link tap (lets navigation proceed naturally)
  links.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => close());
  });

  // Close on click outside
  document.addEventListener('click', (e) => {
    if (!isOpen()) return;
    if (toggle.contains(e.target) || links.contains(e.target)) return;
    close();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) close();
  });
})();
```

- [ ] **Step 2: Verify the file is syntactically valid.**

```bash
node --check assets/nav.js
```

Expected: no output (valid).

- [ ] **Step 3: Commit.**

```bash
git add assets/nav.js
git commit -m "js: shared hamburger nav toggle (assets/nav.js)"
```

### Task 2.2: Add canonical hamburger CSS to deals.css

**Files:**
- Modify: `assets/deals.css` (append a new section after the existing `.nav` rules around line ~95-170)

- [ ] **Step 1: Locate the end of the existing `.nav` / `.nav-links` / `.nav-search` rule block** in `assets/deals.css` (search for `.nav-search input`, find the closing `}` of the rule chain).

- [ ] **Step 2: Add a new section immediately after** the existing nav rules:

```css
/* ===================================================================
   Canonical hamburger nav (added 2026-05-02)
   Used when markup includes .nav-toggle + #nav-links[data-collapsed].
   Pages with this markup get hamburger behavior on phone, horizontal
   links on desktop. Pages without the markup retain legacy .nav behavior.
   =================================================================== */

.nav-toggle {
  display: none;
  width: 44px;
  height: 44px;
  border: 1px solid #333;
  background: transparent;
  color: inherit;
  border-radius: 6px;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.nav-toggle .nav-toggle-bars {
  display: block;
  width: 18px;
  height: 2px;
  background: currentColor;
  position: relative;
}
.nav-toggle .nav-toggle-bars::before,
.nav-toggle .nav-toggle-bars::after {
  content: '';
  position: absolute;
  left: 0;
  width: 18px;
  height: 2px;
  background: currentColor;
}
.nav-toggle .nav-toggle-bars::before { top: -6px; }
.nav-toggle .nav-toggle-bars::after { top: 6px; }

.nav-links[data-collapsed] {
  /* desktop default — no collapse behavior */
}

@media (max-width: 768px) {
  .nav-toggle { display: inline-flex; }
  .nav-links[data-collapsed='true'] {
    display: none;
  }
  .nav-links[data-collapsed='false'] {
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 100%;
    right: 0;
    left: 0;
    background: var(--bg, #0a0a0a);
    border-bottom: 1px solid #333;
    padding: 12px 16px;
    gap: 8px;
    z-index: 50;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
  }
  .nav-links[data-collapsed='false'] a {
    display: block;
    padding: 12px 0;
    font-size: 15px;
  }
}
```

- [ ] **Step 3: Verify desktop nav is unchanged.** Open any page (e.g., `deals.html`) at 1440px in DevTools. The toggle button should be `display: none`. The existing nav layout should be unchanged.

- [ ] **Step 4: Verify on phone width (markup not yet present, so no visible change yet).** Open `deals.html` at 375px. The toggle button is still hidden because the markup doesn't include `.nav-toggle` yet — that lands in Phase 3. No visual change should occur on any page in this task.

- [ ] **Step 5: Commit.**

```bash
git add assets/deals.css
git commit -m "css: canonical hamburger nav rules (dormant until Phase 3 markup)"
```

---

## Phase 3 — Per-Page Nav Migration

Adds the canonical nav markup to each of the 4 pages that currently lack hamburger. Each task is independent and reversible. After this phase, all 6 pages share one nav pattern.

**Reference markup (canonical pattern, copy into each page):**

```html
<nav class="nav">
  <a class="nav-brand" href="/">The Pharma Closeout</a>
  <button class="nav-toggle" aria-expanded="false" aria-controls="nav-links" aria-label="Open menu">
    <span class="nav-toggle-bars"></span>
  </button>
  <ul id="nav-links" class="nav-links" data-collapsed="true">
    <li><a href="/index.html">Home</a></li>
    <li><a href="/deals.html">Deals</a></li>
    <li><a href="/compare.html">Compare</a></li>
    <li><a href="/ai-research.html">Research</a></li>
    <li><a href="/about.html">About</a></li>
  </ul>
  <!-- nav-search retained where present (deals.html) -->
</nav>
```

Each task below replaces the existing nav block on that page with the canonical pattern, preserves any page-specific extras (e.g., nav-search on deals.html), adds a `<script defer src="/assets/nav.js"></script>` to `<head>`, and applies `class="nav-active"` to the current-page link.

### Task 3.1: Migrate deals.html nav

**Files:**
- Modify: `deals.html` (lines containing the current `<nav>` block + `<head>`)

- [ ] **Step 1: Read deals.html's current `<nav>` block** (around lines 40-80, search for `<nav`) and capture any page-specific elements (especially the `nav-search` input).

- [ ] **Step 2: Replace the `<nav>` block** with the canonical pattern from the Phase 3 header, preserving the `nav-search` input as a child of `<nav>` after the `<ul>`. Apply `class="nav-active"` to the Deals link.

- [ ] **Step 3: Add `<script defer src="/assets/nav.js"></script>`** to `<head>` (place it next to the existing `<script>` tags or just before `</head>`).

- [ ] **Step 4: Verify desktop in DevTools at 1440px.** Nav links horizontal, search input visible. Toggle button hidden.

- [ ] **Step 5: Verify phone at 375px.** Toggle button visible (44×44). Tap → drawer opens with all 5 links + closes on link tap.

- [ ] **Step 6: Run existing tests to confirm no regression.**

```bash
node --test tests/
```

- [ ] **Step 7: Commit.**

```bash
git add deals.html
git commit -m "html: migrate deals.html nav to canonical hamburger pattern"
```

### Task 3.2: Migrate deal.html nav

**Files:**
- Modify: `deal.html`

- [ ] **Step 1: Replace the current `<nav>` block** with the canonical pattern. No nav-search on this page. Apply `class="nav-active"` to the Deals link (deal pages live under the deals surface).

- [ ] **Step 2: Add `<script defer src="/assets/nav.js"></script>`** to `<head>`.

- [ ] **Step 3: Verify desktop at 1440px and phone at 375px** as in Task 3.1.

- [ ] **Step 4: Commit.**

```bash
git add deal.html
git commit -m "html: migrate deal.html nav to canonical hamburger pattern"
```

### Task 3.3: Migrate compare.html nav

**Files:**
- Modify: `compare.html`

- [ ] **Step 1: Replace the current `<nav>` block** with the canonical pattern. Apply `class="nav-active"` to the Compare link.

- [ ] **Step 2: Add `<script defer src="/assets/nav.js"></script>`** to `<head>`.

- [ ] **Step 3: Verify desktop at 1440px and phone at 375px.**

- [ ] **Step 4: Commit.**

```bash
git add compare.html
git commit -m "html: migrate compare.html nav to canonical hamburger pattern"
```

### Task 3.4: Migrate index.html nav with diff-and-preserve discipline

**Files:**
- Modify: `index.html`

This task is higher risk because `index.html` has its own inline `<style>` with nav rules tied to the recent copy refresh. Per spec Section 4 risk note: capture current rendering first, enumerate inline rules, then migrate.

- [ ] **Step 1: Capture baseline screenshots.** Open `index.html` at 1440px and 375px in DevTools, save screenshots (or note rendered behavior in detail) — these are the "must still look like this" baselines.

- [ ] **Step 2: Read index.html's inline `<style>` block** (around lines 56-492) and enumerate every rule that targets `.nav`, `.nav-links`, `.nav-brand`, or any nav-adjacent selector. Note especially: gold-thread accent line under brand, font-family overrides, hover effects.

- [ ] **Step 3: For each enumerated rule, decide:** keep (move into the new canonical block as a `index.html`-specific override), or drop (if it's covered by deals.css canonical rules). Document the decision inline as a CSS comment.

- [ ] **Step 4: Replace the current `<nav>` markup** in the `<body>` with the canonical pattern. Apply `class="nav-active"` to the Home link.

- [ ] **Step 5: Add `<script defer src="/assets/nav.js"></script>`** to `<head>`.

- [ ] **Step 6: Add a `<link rel="stylesheet" href="/assets/deals.css">` to `<head>`** if not already present (the canonical hamburger rules live in deals.css). Verify by inspecting `<head>`.

- [ ] **Step 7: Visual diff against baseline.** Compare rendering at 1440px and 375px to baseline screenshots. Confirm gold-thread accent / brand spacing / hover effects all preserved.

- [ ] **Step 8: Commit.**

```bash
git add index.html
git commit -m "html: migrate index.html nav to canonical pattern (preserves brand styling)"
```

---

## Phase 4 — deals.html Mobile Experience

Filter accordion, single-column grid (already scaffolded in Task 1.2), poster-select touch fix, FAB safe-area, search-results poster sizing, hover-only state guards.

### Task 4.1: Add filter accordion HTML to deals.html

**Files:**
- Modify: `deals.html` (replace the existing filter row markup)

- [ ] **Step 1: Locate the existing filter markup** in `deals.html` (search for `class="filters"` or similar — around lines 85-133 per the audit).

- [ ] **Step 2: Wrap the existing 5 `<select>` elements in a new container and prepend a toggle button.** Replace:

```html
<!-- existing -->
<div class="filters">
  <select ...>...</select>
  <select ...>...</select>
  ...
</div>
```

With:

```html
<button type="button" class="filter-toggle" aria-expanded="false" aria-controls="filter-row">
  <span class="filter-toggle-label">Filters</span>
  <span class="filter-toggle-count" data-active="0"></span>
  <span class="filter-toggle-chevron" aria-hidden="true">▾</span>
</button>
<div id="filter-row" class="filter-row filters" data-collapsed="true">
  <!-- the 5 existing select elements, unchanged -->
</div>
```

- [ ] **Step 3: Verify desktop at 1440px** — filter button is hidden, filter row visible (because Task 4.2 will add the desktop-hides-toggle CSS, which doesn't exist yet, so on this step the toggle button will be visible on desktop too. Don't worry — it's fixed in 4.2).

- [ ] **Step 4: Commit.** Note the intermediate state in the message so a task-by-task reviewer doesn't flag the desktop toggle visibility as a regression.

```bash
git add deals.html
git commit -m "html(deals): filter accordion markup (toggle hidden on desktop in 4.2; JS in 4.3)"
```

### Task 4.2: Add filter accordion CSS to deals.css

**Files:**
- Modify: `assets/deals.css`

- [ ] **Step 1: Add the following block** at the end of `assets/deals.css` (or near the existing `.filters` rules):

```css
/* Filter accordion (added 2026-05-02) */
.filter-toggle {
  display: none;
  width: 100%;
  padding: 12px 14px;
  background: #181818;
  border: 1px solid #333;
  border-radius: 6px;
  color: inherit;
  font-size: 14px;
  cursor: pointer;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
  min-height: 44px;
}
.filter-toggle-count[data-active]:not([data-active='0'])::before {
  content: '· ' attr(data-active) ' active';
  color: #c9a84c;
  font-size: 12px;
  margin-left: 8px;
}
.filter-toggle[aria-expanded='true'] .filter-toggle-chevron {
  transform: rotate(180deg);
}
.filter-toggle-chevron {
  display: inline-block;
  transition: transform 0.18s ease;
}

@media (max-width: 600px) {
  .filter-toggle { display: inline-flex; }
  .filter-row[data-collapsed='true'] { display: none; }
  .filter-row[data-collapsed='false'] {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background: #111;
    border: 1px solid #c9a84c;
    border-radius: 6px;
    margin-bottom: 12px;
  }
  .filter-row[data-collapsed='false'] select {
    width: 100%;
    min-height: 44px;
  }
}
```

- [ ] **Step 2: Verify desktop at 1440px.** Filter toggle button hidden, filter row visible (existing 5 selects in a flex row).

- [ ] **Step 3: Verify phone at 375px.** Filter toggle button visible, filter row hidden by default. (The toggle won't actually open anything until Task 4.3 adds the JS.)

- [ ] **Step 4: Commit.**

```bash
git add assets/deals.css
git commit -m "css: filter accordion rules — desktop unchanged, phone collapses by default"
```

### Task 4.3: Add filter accordion JS to deals.js

**Files:**
- Modify: `assets/deals.js` (add new function + call site near the existing init flow)

- [ ] **Step 1: Locate the bottom of `assets/deals.js`** (around line 1726). Add a new IIFE block at the very end, outside any existing function:

```js
// Filter accordion toggle (added 2026-05-02)
(function () {
  const toggle = document.querySelector('.filter-toggle');
  const row = document.getElementById('filter-row');
  if (!toggle || !row) return;

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
    row.setAttribute('data-collapsed', open ? 'true' : 'false');
  });

  // Active-filter count: read all selects in the row, count non-default values.
  function updateActiveCount() {
    const selects = row.querySelectorAll('select');
    let active = 0;
    selects.forEach((s) => {
      if (s.value && s.value !== '' && s.value !== 'all' && s.value !== 'date_desc') active += 1;
    });
    const counter = toggle.querySelector('.filter-toggle-count');
    if (counter) counter.setAttribute('data-active', String(active));
  }

  row.querySelectorAll('select').forEach((s) => {
    s.addEventListener('change', updateActiveCount);
  });
  updateActiveCount();
})();
```

- [ ] **Step 2: Run existing tests.**

```bash
node --test tests/
```

Expected: all pass.

- [ ] **Step 3: Verify in browser at 375px.** Open `deals.html` on phone width. Tap "Filters" button — row expands. Tap again — row collapses. Change a select value — count updates ("· 1 active").

- [ ] **Step 4: Verify desktop unchanged at 1440px.** Filter row visible by default; toggle button hidden.

- [ ] **Step 5: Commit.**

```bash
git add assets/deals.js
git commit -m "js: filter accordion toggle + active-count updater"
```

### Task 4.4: Hover-state guards + poster-select touch fix

**Files:**
- Modify: `assets/deals.css`

- [ ] **Step 1: Wrap existing `:hover` rules for `.poster`, `.c-poster`, ring animations in `@media (hover: hover)`.** Use `Grep -n "poster:hover|c-poster:hover|ringCW|ringCCW"` to locate the rules (around lines 194-316). For each rule block, identify the matching closing brace by reading line-by-line — the rule block ends at the first `}` at column 0 (zero indentation) following the opening `{`. Wrap each block in:

```css
@media (hover: hover) {
  /* existing .poster:hover or .c-poster:hover or ring rule */
}
```

**Verify wrap completeness:** after editing, grep for `:hover` rules outside any `@media` wrapper — there should be none for poster/ring selectors.

- [ ] **Step 2: Add touch-only rules for poster-select checkbox.** Append to the file:

```css
@media (hover: none) {
  .poster-select {
    opacity: 1 !important;  /* always visible on touch */
    width: 36px;
    height: 36px;
  }
  .section-arrows {
    display: none;  /* carousel becomes swipe-only */
  }
}
```

- [ ] **Step 3: Verify on phone at 375px.** Open deals.html. Poster-select checkbox visible on every deal card. Carousel arrows hidden.

- [ ] **Step 4: Verify on desktop at 1440px** (mouse pointer, hover available). Poster-select checkbox hidden by default; appears on hover. Carousel arrows visible.

- [ ] **Step 5: Commit.**

```bash
git add assets/deals.css
git commit -m "css: hover guards + always-visible poster-select on touch"
```

### Task 4.5: FAB safe-area inset + search-results poster sizing

**Files:**
- Modify: `assets/deals.css` (FAB rules around lines 1773-1811)
- Modify: `assets/deals.js` (renderResults call site, line ~1694)

- [ ] **Step 1: Update `.compare-fab` rules** to use safe-area insets. Find the existing FAB block and modify:

```css
.compare-fab {
  position: fixed;
  bottom: max(24px, env(safe-area-inset-bottom) + 12px);
  right: max(24px, env(safe-area-inset-right) + 12px);
  /* keep existing other properties */
}
```

- [ ] **Step 2: In `assets/deals.js`, locate `renderResults()`** around line 1694. The current call is `renderPoster(d, 'carousel')`. Change the variant when the result is rendered into a `.grid` context:

```js
// Before:
const html = results.map(d => renderPoster(d, 'carousel')).join('');

// After:
const html = results.map(d => renderPoster(d, 'grid')).join('');
```

(Verify this matches the existing function signature; if `renderPoster` doesn't accept a variant arg, instead set CSS to make `.c-poster` inside `.grid` use full width — see Step 3 fallback.)

- [ ] **Step 3: Fallback if `renderPoster` doesn't take a variant.** Add this CSS instead:

```css
.grid .c-poster {
  width: 100%;
  max-width: none;
}
```

Append to `assets/deals.css` after the existing `.c-poster` rules.

- [ ] **Step 4: Verify on phone at 375px.** Trigger a search, confirm result cards fill the column width (not narrow 160px). FAB does not collide with home-indicator on iPhone (verify on real device in Phase 10).

- [ ] **Step 5: Run existing tests.**

```bash
node --test tests/
```

- [ ] **Step 6: Commit.**

```bash
git add assets/deals.css assets/deals.js
git commit -m "css/js: FAB safe-area inset + search-results full-width in grid context"
```

---

## Phase 5 — deal.html Mobile Experience

Hero-inner padding, FAB labels, prose font sizes, mkt-row, footer, breadcrumb, share button.

### Task 5.1: Hero-inner padding + FAB label stacking

**Files:**
- Modify: `assets/deals.css`

- [ ] **Step 1: Add to the `@media (max-width: 600px)` block:**

```css
@media (max-width: 600px) {
  .hero-inner {
    padding: 20px 16px;
    gap: 16px;
  }
  .fab {
    flex-wrap: wrap;
  }
  .fab-btn {
    flex: 1 1 calc(50% - 4px);
    min-width: 0;
    white-space: normal;
  }
}

@media (max-width: 480px) {
  .fab-btn {
    flex: 1 1 100%;
  }
}
```

- [ ] **Step 2: Verify at 375px.** Open a deal page. Hero side padding tight (16px). FAB stacks 2-up at 600px and 1-up at 480px.

- [ ] **Step 3: Commit.**

```bash
git add assets/deals.css
git commit -m "css(deal): hero-inner padding + FAB label stacking on phone"
```

### Task 5.2: Prose font-size bumps + mkt-row 1-col + rev-stats wrap

**Files:**
- Modify: `assets/deals.css`

- [ ] **Step 1: Add to the `@media (max-width: 600px)` block:**

```css
@media (max-width: 600px) {
  body { font-size: 15px; }
  .tl-body, .review-quote, .dp-block p {
    font-size: 15px;
    line-height: 1.6;
  }
  .rev-stats {
    flex-wrap: wrap;
  }
  .rev-stat {
    min-width: 80px;
  }
  .footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .footer-links {
    flex-wrap: wrap;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .mkt-row {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 2: Verify at 375px.** Open a deal page. Body text is 15px, timeline body is 15px, market data row is 1-column, revenue stats wrap properly, footer stacks vertically.

- [ ] **Step 3: Commit.**

```bash
git add assets/deals.css
git commit -m "css(deal): prose 15px on phone, mkt-row 1-col, footer column"
```

### Task 5.3: cmp-table overflow wrapper (also serves compare.html in Phase 6)

**Files:**
- Modify: `assets/deals.js` (find table rendering)
- Modify: `assets/deals.css`

- [ ] **Step 1: Locate where `.cmp-table` is rendered on deal.html.** Use Grep across the repo for `cmp-table`. Two possibilities:
  - **JS-rendered:** found inside a template string in `assets/deals.js`. Wrap by editing the JS template string to emit `<div class="cmp-wrap"><table class="cmp-table">...</table></div>`.
  - **Static HTML:** found directly in `deal.html`. Wrap by editing the HTML file directly.

  The deal page may render an inline comparable-deals table separate from compare.html's `renderComparison()`. Wrap whichever location holds the table in a `<div class="cmp-wrap">` container.

- [ ] **Step 2: Add CSS to `assets/deals.css`:**

```css
.cmp-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin-bottom: 16px;
}
.cmp-table th.cmp-label {
  position: sticky;
  left: 0;
  background: var(--bg, #0a0a0a);
  z-index: 1;
}
.cmp-swipe-hint {
  display: none;
  text-align: center;
  font-size: 0.75rem;
  color: #888;
  padding: 0.5rem;
}
@media (max-width: 600px) {
  .cmp-swipe-hint { display: block; }
}
@media (hover: hover) {
  .cmp-swipe-hint { display: none !important; }
}
```

- [ ] **Step 3: Verify on phone at 375px.** Open a deal page with comparables. Table can be horizontally swiped without breaking page layout. Label column stays sticky on the left edge while swiping.

- [ ] **Step 4: Run existing tests.**

```bash
node --test tests/
```

- [ ] **Step 5: Commit.**

```bash
git add assets/deals.js assets/deals.css
git commit -m "css/js(deal): cmp-table wrapped in overflow-x container with sticky label"
```

### Task 5.4: Breadcrumb + share button on deal.html

**Files:**
- Modify: `deal.html` (template region rendered for deal pages — likely a JS template)
- Modify: `assets/deals.js` (if breadcrumb / share are JS-rendered)

- [ ] **Step 1: Identify how the deal page hero is rendered.** Read `deal.html` to determine whether the breadcrumb / share affordances should be added as static HTML or via JS. (Likely JS-rendered into a `<main>` slot — confirm.)

- [ ] **Step 2: Add breadcrumb above the hero.** Insert the following just above the `<div class="hero-inner">` (or in the JS template that renders it):

```html
<a class="breadcrumb-back" href="/deals.html">← All deals</a>
```

CSS:

```css
.breadcrumb-back {
  display: inline-block;
  padding: 8px 0;
  font-size: 13px;
  color: #888;
  margin-bottom: 8px;
  text-decoration: none;
}
.breadcrumb-back:hover { color: #c9a84c; }
```

- [ ] **Step 3: Add share button as 4th FAB entry.** In the FAB markup, add:

```html
<button type="button" class="fab-btn" id="fab-share">Share</button>
```

JS handler (append to `assets/deals.js`):

```js
(function () {
  const btn = document.getElementById('fab-share');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const url = window.location.href;
    const title = document.title;
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch (e) { /* user cancelled */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Share'; }, 2000);
    } catch (e) {
      window.prompt('Copy this URL:', url);
    }
  });
})();
```

- [ ] **Step 4: Verify on phone at 375px.** Breadcrumb visible above hero. Share button in FAB. Tap share — opens native share sheet (iOS Safari) or copies to clipboard.

- [ ] **Step 5: Verify on desktop at 1440px.** Breadcrumb visible (good for context); share button uses clipboard fallback.

- [ ] **Step 6: Run existing tests.**

```bash
node --test tests/
```

- [ ] **Step 7: Commit.**

```bash
git add deal.html assets/deals.js assets/deals.css
git commit -m "feat(deal): breadcrumb + share button (navigator.share with clipboard fallback)"
```

---

## Phase 6 — compare.html Mobile Pattern

Sticky-label horizontal-swipe table. Most CSS already landed in Task 5.3 (`.cmp-wrap`); this phase wires it into `renderComparison()` and adds the swipe hint.

### Task 6.1: Wrap renderComparison() output in cmp-wrap + add swipe hint

**Files:**
- Modify: `assets/deals.js` (`renderComparison()` function around lines 1522-1525)

- [ ] **Step 1: Locate `renderComparison()`** in `assets/deals.js`. Modify the returned HTML to wrap the table in `.cmp-wrap` and append the swipe hint:

```js
// Before (something like):
return `<table class="cmp-table">...</table>`;

// After:
return `
  <div class="cmp-wrap">
    <table class="cmp-table">...</table>
  </div>
  <div class="cmp-swipe-hint">← swipe to compare →</div>
`;
```

- [ ] **Step 2: Verify on phone at 375px.** Open `compare.html` with 2-3 deal IDs in URL query. Table renders inside scroll container, label column sticks to left edge while swiping. Swipe hint visible below table.

- [ ] **Step 3: Verify on desktop at 1440px.** Table renders normally (overflow-x auto only kicks in if content exceeds container). Swipe hint hidden via `@media (hover: hover)`.

- [ ] **Step 4: Run existing tests.**

```bash
node --test tests/
```

- [ ] **Step 5: Commit.**

```bash
git add assets/deals.js
git commit -m "js(compare): wrap cmp-table in scroll container + add swipe hint on phone"
```

---

## Phase 7 — index.html Mobile

Hero CTA tap targets, tagline floor, section CTAs, footer link tap targets, hide wire-meta on tightest band.

### Task 7.1: Hero CTA + tagline + section CTA fixes

**Files:**
- Modify: `index.html` (inline `<style>` block, ~lines 56-492)

- [ ] **Step 1: Locate the inline `<style>` block** in `index.html`. Find the existing `@media (max-width: 800px)` rule and the `.hero-links a` rule.

- [ ] **Step 2: Add to `.hero-links a` (base rule):**

```css
.hero-links a {
  display: inline-block;
  padding: 0.75rem 0;
  /* preserve existing other properties */
}
```

- [ ] **Step 3: Add or modify `.hero-tagline` mobile override** inside the existing `@media (max-width: 800px)` block:

```css
@media (max-width: 800px) {
  .hero-tagline {
    font-size: 0.85rem;  /* was 0.7rem — bumped for legibility */
  }
}
```

- [ ] **Step 4: Find Section CTAs (around lines 539-540 and 556 per audit)** and ensure they have `min-height: 44px`. Modify the inline button styles:

```css
.section-cta {
  min-height: 44px;
  padding: 0.9rem 1.5rem;
  display: inline-flex;
  align-items: center;
}
```

(Apply class name as appropriate; if the buttons use inline `style=`, refactor to a class.)

- [ ] **Step 5: Verify on phone at 375px.** Hero CTA links tappable height ~44px. Tagline reads at 13.6px (was 11px). Section CTAs all ≥44px.

- [ ] **Step 6: Verify desktop at 1440px** unchanged.

- [ ] **Step 7: Commit.**

```bash
git add index.html
git commit -m "css(index): hero CTA tap height + tagline floor + section CTAs ≥44px"
```

### Task 7.2: index.html footer + hero min-height + wire-meta hide

**Files:**
- Modify: `index.html` (inline `<style>` block)

- [ ] **Step 1: Add to the inline `@media (max-width: 800px)` block:**

```css
@media (max-width: 800px) {
  .hero {
    min-height: auto;
    padding: 6rem 0 3rem;
  }
  .footer-connect a {
    display: block;
    padding: 0.75rem 0;
  }
}

@media (max-width: 480px) {
  .wire-meta {
    display: none;
  }
}
```

- [ ] **Step 2: Verify on phone at 375px.** Hero no longer balloons to full viewport. Footer connect links each have ~44px tap height. Wire metadata hidden in news ticker.

- [ ] **Step 3: Commit.**

```bash
git add index.html
git commit -m "css(index): hero min-height auto + footer link tap targets + hide wire-meta <480px"
```

---

## Phase 8 — about.html Mobile

Distribution-link tap targets, video preload optimization.

### Task 8.1: about.html distribution-link padding + video preload

**Files:**
- Modify: `about.html` (inline CSS + video element)

- [ ] **Step 1: Find `.distribution-link` rule** in about.html's inline CSS (around line 218-243 per audit). Add:

```css
.distribution-link {
  display: block;
  padding: 0.75rem 0;
  /* preserve existing properties */
}
```

- [ ] **Step 2: Find the hero `<video>` element** (around line 382-388). Add `preload="none"` attribute:

```html
<video autoplay muted loop playsinline preload="none" ...>
```

- [ ] **Step 3: Add a `connection.saveData` skip** to the existing JS error-fallback block (around lines 480-494):

```js
// At the top of the JS block:
const conn = navigator.connection;
if (conn && (conn.saveData || conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g')) {
  const video = document.querySelector('video');
  if (video) { video.removeAttribute('autoplay'); video.pause(); }
}
```

- [ ] **Step 4: Verify on phone at 375px.** Distribution links each have ~44px tap height. (Video saveData skip cannot be tested in DevTools easily — defer to Phase 10 real-device pass.)

- [ ] **Step 5: Commit.**

```bash
git add about.html
git commit -m "css/js(about): distribution-link tap targets + video saveData skip"
```

---

## Phase 9 — ai-research.html: Gumroad Overlay + Mobile Fixes

Replace fake briefing form with Gumroad overlay button. Fix btn-primary/secondary tap targets, sticky-bar dismiss, price-block stack, proof-strip grid.

### Task 9.1: Replace fake briefing form with Gumroad overlay

**Files:**
- Modify: `ai-research.html` (`<head>` + briefing block around line 1397-1401)

- [ ] **Step 1: Add Gumroad's overlay script to `<head>`:**

```html
<script src="https://gumroad.com/js/gumroad.js"></script>
```

- [ ] **Step 2: Replace the `.briefing-form` block** (around lines 1397-1401):

```html
<!-- BEFORE -->
<div class="briefing-form">
  <h3>Free Briefing</h3>
  <p>Some subtitle ...</p>
  <a href="https://thepharmacloseout.gumroad.com/l/briefing">Get the Briefing</a>
  <p class="form-note">Powered by Gumroad</p>
</div>

<!-- AFTER -->
<div class="briefing-block">
  <h3>Free briefing — every Friday</h3>
  <p>The week's pharma deal flow, condensed. Delivered as PDF.</p>
  <a class="gumroad-button" href="https://thepharmacloseout.gumroad.com/l/briefing?wanted=true">
    Get the free Briefing →
  </a>
  <p class="briefing-note">PDF delivered to your inbox · No card required</p>
</div>
```

- [ ] **Step 3: Add CSS** to override Gumroad's default button styling and match brand:

```css
.gumroad-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #c9a84c;
  color: #0a0a0a;
  font-weight: 600;
  padding: 1rem 2rem;
  border-radius: 6px;
  text-decoration: none;
  min-height: 48px;
  font-size: 16px;
  border: none;
}
.gumroad-button:hover {
  background: #d4b35c;
}
@media (max-width: 500px) {
  .gumroad-button {
    width: 100%;
  }
}
.briefing-block { /* match surrounding offerings spacing */ }
.briefing-note {
  font-size: 0.8rem;
  color: #888;
  margin-top: 0.5rem;
}
```

- [ ] **Step 4: Test the Gumroad overlay on iOS Safari** (real device required per spec Section 8 risk). If overlay renders broken or off-brand, fall back to redirect-link with relabeled CTA "Continue to Gumroad →" — flag in implementation report.

- [ ] **Step 5: Verify on phone at 375px and desktop at 1440px** in DevTools. Button is full-width at <500px, fixed-width at desktop. Click should trigger Gumroad overlay (works in any browser if Gumroad's JS loaded).

- [ ] **Step 6: Commit.**

```bash
git add ai-research.html
git commit -m "feat(ai-research): replace fake briefing form with Gumroad overlay button"
```

### Task 9.2: btn-primary / btn-secondary tap height + sticky-bar dismiss

**Files:**
- Modify: `ai-research.html` (inline CSS)

- [ ] **Step 1: Locate `.btn-primary` and `.btn-secondary` rules** (around CSS lines 838-868). Bump padding:

```css
.btn-primary, .btn-secondary {
  padding: 1rem 2.25rem;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

- [ ] **Step 2: Locate sticky-bar dismiss rule** (around CSS line 1150). Wrap the `&times;` in a 44×44 tap area:

Markup (around line 1794):

```html
<!-- BEFORE -->
<button class="sticky-dismiss">&times;</button>

<!-- AFTER -->
<button class="sticky-dismiss" aria-label="Dismiss">
  <span class="sticky-dismiss-icon">&times;</span>
</button>
```

CSS:

```css
.sticky-dismiss {
  width: 44px;
  height: 44px;
  background: transparent;
  border: 0;
  color: inherit;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.sticky-dismiss-icon {
  font-size: 20px;
  line-height: 1;
}
```

- [ ] **Step 3: Verify on phone at 375px.** Both CTA buttons ≥44px height. Sticky-bar dismiss button has 44×44 hit area.

- [ ] **Step 4: Commit.**

```bash
git add ai-research.html
git commit -m "css(ai-research): btn ≥44px + sticky-bar dismiss 44×44 hit area"
```

### Task 9.3: price-block mobile stack + proof-strip grid

**Files:**
- Modify: `ai-research.html` (inline CSS)

- [ ] **Step 1: Locate `.price-block` rules** (around CSS lines 802-872) and the existing `@media (max-width: 800px)` override (around line 1116). Modify or add:

```css
@media (max-width: 800px) {
  .price-block {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .price-display, .price-meta, .price-block .btn-primary {
    width: 100%;
    text-align: center;
  }
  .price-badge {
    vertical-align: baseline;
    display: inline-block;
    margin-left: 8px;
  }
}
```

- [ ] **Step 2: Locate `.proof-strip` rules** (around CSS lines 1027-1033). Add:

```css
@media (max-width: 500px) {
  .proof-strip {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}
```

- [ ] **Step 3: Locate `.form-field` rule** (around CSS line 683). Set font-size:

```css
.form-field {
  font-size: 16px;
  /* existing properties */
}
```

(This is the protective rule for any future form input added — Gumroad overlay uses its own form, but if a real form lands later, this prevents iOS zoom.)

- [ ] **Step 4: Verify on phone at 375px.** Price block stacks vertically with each row centered. Proof strip is 2×2 grid, not 4-row.

- [ ] **Step 5: Commit.**

```bash
git add ai-research.html
git commit -m "css(ai-research): price-block stack + proof-strip 2x2 + form-field 16px"
```

---

## Phase 10 — Final QA & Documentation

Real-device pass, Lighthouse mobile audits, breakpoint sweep, release notes.

### Task 10.1: Lighthouse mobile audit (before/after capture)

**Files:**
- Create: `docs/release-notes-mobile-2026-05-02.md`

- [ ] **Step 1: Identify a baseline.** Find the commit before this work began (likely `2b58114` — "chore: bump cache-buster to 20260425b") and run Lighthouse mobile audit on the live deploy at that commit's URL OR check out that commit locally and serve it.

- [ ] **Step 2: Run Lighthouse mobile audit on each page** post-implementation:
  - `index.html`
  - `deals.html`
  - `deal.html` (use a representative deal URL with query params)
  - `compare.html` (use a representative compare URL with deal IDs)
  - `about.html`
  - `ai-research.html`

For each, capture: Performance, Accessibility, Best Practices, SEO scores at mobile preset.

- [ ] **Step 3: Create release notes** at `docs/release-notes-mobile-2026-05-02.md` capturing:
  - Summary (what shipped)
  - Files modified (full inventory)
  - Lighthouse scores: before vs after, per page, mobile preset
  - Known issues / deferred items (e.g., Gumroad overlay rendering on iOS Safari if fallback used)
  - Out-of-scope items the user might ask about

Target thresholds per spec Section 10: Accessibility ≥90, Performance ≥85.

- [ ] **Step 4: If any page falls below target, file follow-up issues** for the specific gaps and continue. Do not block the merge on perfection.

- [ ] **Step 5: Commit.**

```bash
git add docs/release-notes-mobile-2026-05-02.md
git commit -m "docs: mobile optimization release notes + Lighthouse before/after"
```

### Task 10.2: Real-device pass + breakpoint sweep

**Files:**
- Modify: `docs/release-notes-mobile-2026-05-02.md` (append findings)

- [ ] **Step 1: On a real iPhone (any iOS 16+)**, open Safari and visit each page. Tap every primary CTA, every nav link, every filter, the briefing form button, deal cards, share button, breadcrumb. Confirm:
  - No iOS auto-zoom on any input (filters, search, etc.)
  - Hamburger nav works on every page
  - Filter accordion opens and closes on deals.html
  - cmp-table swipes horizontally with sticky labels on compare.html
  - Gumroad overlay opens and renders correctly (ai-research.html)
  - FAB doesn't collide with home indicator
  - All taps register on first attempt (no <44px miss)

- [ ] **Step 2: DevTools breakpoint sweep** at 375 / 414 / 600 / 768 / 1024 / 1440 px on each of the 6 pages. Document any visual regressions.

- [ ] **Step 3: Cross-page nav parity check.** Open all 6 pages on phone width. Confirm hamburger renders identically in size, position, and behavior.

- [ ] **Step 4: Append a "Real-device & breakpoint sweep" section to the release notes** with pass/fail per page per breakpoint.

- [ ] **Step 5: Commit.**

```bash
git add docs/release-notes-mobile-2026-05-02.md
git commit -m "docs: real-device + breakpoint sweep results in release notes"
```

### Task 10.3: Cache-buster bump + final smoke

**Files:**
- Modify: any cache-buster reference per repo convention (search for `cache-buster` in recent commit messages — pattern is `20260425b` etc.)

- [ ] **Step 1: Find the cache-buster pattern.** Run:

```bash
git log --oneline -20 | grep -i cache-buster
```

Identify the convention (e.g., `?v=20260425b` query string on assets in `<link>` and `<script>` tags).

- [ ] **Step 2: Bump the cache-buster** on all pages that load `assets/deals.css`, `assets/deals.js`, `assets/format.js`, `assets/nav.js`. New value: `20260502a`.

- [ ] **Step 3: Final smoke.** Run existing tests once more:

```bash
node --test tests/
```

- [ ] **Step 4: Commit.**

```bash
git add index.html deals.html deal.html compare.html about.html ai-research.html
git commit -m "chore: bump cache-buster to 20260502a for mobile optimization release"
```

- [ ] **Step 5: Push to remote.**

```bash
git push origin main
```

(Confirm with user before pushing if working on a branch.)

---

## Plan Summary

**Phases:** 10
**Tasks:** 23
**Files modified:** 8 (assets/deals.css, assets/deals.js, index.html, deals.html, deal.html, compare.html, about.html, ai-research.html)
**Files created:** 2 (assets/nav.js, docs/release-notes-mobile-2026-05-02.md)
**Commits:** ~25 (one per task)
**Risk band:** Low to medium. Highest risk = Task 3.4 (index.html nav diff-and-preserve). Lowest = Phases 1, 2, 8.

**Reversibility:** every task is its own commit. Any task can be reverted independently if it causes a regression.
