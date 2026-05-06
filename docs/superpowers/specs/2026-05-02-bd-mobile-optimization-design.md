# BD Website Mobile Optimization — Design Spec

**Date:** 2026-05-02
**Scope:** Full public site at thepharmacloseout.com (6 pages)
**Architecture:** Incremental responsive CSS pass + nav unification + briefing form bundled fix
**Status:** Design — pending implementation plan

---

## 1. Goal & Audience

Mobile-optimize the full public site (`index.html`, `deals.html`, `deal.html`, `compare.html`, `about.html`, `ai-research.html`) so phone visitors can use it as fluently as desktop users. The codebase is static HTML + vanilla CSS/JS (no framework), deployed via GitHub Pages with CNAME at thepharmacloseout.com.

**User priority (descending):**
1. **LinkedIn-tap reader (primary).** Taps a post link, lands on a deal or home, skims for ~30 seconds, decides whether to follow / subscribe / come back. Optimize for fast first-paint, hero clarity, one obvious next action.
2. **Compendium / Briefing buyer.** Mobile traffic should funnel to `ai-research.html` and complete a Gumroad checkout on phone.
3. **Analyst-on-the-go.** Browses `deals.html`, filters, opens deal pages, possibly compares. Mobile experience should be a real version of the desktop tool, not a stripped-down landing.

Design biases toward (1) but does not cripple (3).

## 2. Architecture: Incremental Responsive Pass

The current desktop CSS architecture is sound. The gap is missing mobile breakpoints, inconsistent navigation, and tap-target / typography misses. The fix matches the actual problem: extend, don't rewrite.

**Why not a mobile-first refactor:** ~3-4× the effort for surfaces that already work on desktop. Risk of regressing tested behavior.

**Why not a separate mobile.css overlay:** creates a shadow CSS layer where two files fight over the same selectors — debugging burden in months when ownership is unclear.

## 3. Breakpoint Strategy

**Existing breakpoints in `assets/deals.css` (preserved):**
- `max-width: 1440px` — grid → 4 col
- `max-width: 1100px` — detail page stack, fin-grid 2-col
- `max-width: 900px` — grid → 3 col, featured stack
- `max-width: 768px` — nav padding, section padding adjustments
- `max-width: 600px` — grid → 2 col, hide nav search, FAB full-width

**New breakpoints to add:**
- `max-width: 480px` — single-column deal grid, accordion filters, tighter padding, hamburger nav.
- `max-width: 375px` — font-size floors, hide non-essential metadata. Avoids designing for 320px.
- `@media (hover: hover)` — wraps all `:hover` poster lift / ring animation rules. Touch devices skip phantom hovers.
- `@media (prefers-reduced-motion: reduce)` — disables transform-heavy animations.

**File ownership:**
- All shared rules live in `assets/deals.css`.
- `index.html` adds a parallel mobile block in its existing inline `<style>`. **This is a deliberate exception, not the same shadow-CSS problem rejected in Section 2** — `index.html` is intentionally self-contained (recent copy refresh, separate ownership). Do not "unify" the inline rules into deals.css during implementation.
- New file: `assets/nav.js` (~20 lines) for shared hamburger toggle logic.

## 4. Nav Unification

**Current state:** three nav implementations.
- `about.html` / `ai-research.html` — proper hamburger (44×44 toggle, aria-expanded, auto-close on tap).
- `deals.html` / `deal.html` / `compare.html` — legacy `.nav` from `deals.css`, no hamburger, links shrink to 12px.
- `index.html` — inline nav with own `@media (max-width: 800px)` rule, no hamburger.

**Target:** the `about.html` hamburger becomes canonical.

**Implementation:**
- Move hamburger CSS rules into a new section in `assets/deals.css` (additive, doesn't conflict with existing `.nav` rules; old rules retained for legacy markup until HTML migration completes).
- Move toggle JS into `assets/nav.js` (~20 lines: open/close, aria-expanded, auto-close on link tap, click-outside-to-close).
- Update HTML markup on `deals.html` / `deal.html` / `compare.html` / `index.html` to match the about.html nav block (toggle button, nav-links container, same class names).

**Behavior:**
- Desktop (≥768px): horizontal links, no toggle visible.
- Phone (<768px): logo + 44×44 hamburger button. Drawer slides down (matching about.html's existing direction). Tap link or outside to dismiss.
- Brand link always visible, serves as home affordance.
- Active page indicated via `.nav-active` class injected per-page.

**Risk & resolution:** `index.html` inline nav CSS may have specifics tied to the recent copy refresh (gold-thread accent line under brand, etc.). **Resolution path:** before touching nav markup on `index.html`, implementer captures the current rendered nav (screenshot at desktop and phone widths), enumerates the inline CSS rules that affect `.nav` / `.nav-links` / brand area, and confirms each is preserved or intentionally replaced in the new shared pattern. Do not bulk-replace.

## 5. Per-Page Targeted Fixes

### index.html
- [HIGH] `.hero-links a` → `padding: 0.75rem 0; display: inline-block` (44px tap height)
- [HIGH] `.hero-tagline` mobile floor 0.8rem (currently 0.7rem = 11px)
- [HIGH] Section CTA buttons → `min-height: 44px`, vertical padding 0.9-1rem
- [MED] Hero `min-height` → `auto` on phone
- [MED] Footer links: `display: block; padding: 0.75rem 0` on mobile
- [MED] Hide `.wire-meta` below 480px
- Replace nav with shared hamburger pattern (Section 4).

### deals.html
- [HIGH] `@media (max-width: 480px)` → `.grid { grid-template-columns: 1fr }`
- [HIGH] Filter row → inline accordion (see Section 6).
- [HIGH] `.nav-search input` → 16px font (eliminate iOS zoom path)
- [HIGH] `.poster-select` checkbox: `@media (hover: none)` → always visible, 36×36 minimum tap target
- [MED] `@media (hover: none)` → hide `.section-arrows` (carousel becomes swipe-only)
- [MED] Compare FAB: `bottom: max(24px, env(safe-area-inset-bottom) + 12px)`
- [MED] `renderResults()` inside `.grid` → use full-width poster, not 160px carousel poster
- [MED] Load-more button: full-width on phone
- Replace nav with shared hamburger pattern.

### deal.html
- [HIGH] `.hero-inner` padding `20px 16px` below 600px (currently 36px 40px)
- [HIGH] Wrap `.cmp-table` in `<div class="cmp-wrap">` with `overflow-x: auto` (also part of compare.html fix)
- [HIGH] FAB labels: stack vertically below 480px or icon-only
- [MED] `.tl-body`, `.review-quote`, `.dp-block p` → 15-16px on mobile (currently 12-13px)
- [MED] `.mkt-row` → 1-column at ≤480px (currently 2-col still)
- [MED] `.rev-stats` → `flex-wrap: wrap; min-width: 80px` per stat
- [MED] Footer → column stack at ≤600px
- [LOW] Add breadcrumb "← All deals" above hero (helps LinkedIn deeplinks)
- [LOW] Add share button using `navigator.share()` with clipboard fallback
- Replace nav with shared hamburger pattern.

### compare.html
- [HIGH] `renderComparison()` in `assets/deals.js` emits a `<div class="cmp-wrap">` wrapper (see Section 7).
- [HIGH] `.cmp-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch }` + `.cmp-table th.cmp-label { position: sticky; left: 0; background: var(--bg) }`
- [MED] "← swipe →" hint shown only on phone, hidden on `@media (hover: hover)`
- Replace nav with shared hamburger pattern.

### about.html
- [MED] `.distribution-link` → `padding: 0.75rem 0; display: block`
- [MED] Hero video: add `preload="none"` and a `navigator.connection.saveData` skip-autoplay check
- Already has hamburger nav — minimal change.

### ai-research.html
- [HIGH] `.btn-primary`, `.btn-secondary` → `padding: 1rem 2.25rem` (44px min-height)
- [HIGH] Sticky-bar dismiss button → wrap in 44×44 tap area
- [MED] `.price-block` mobile stack: each row gets its own line (price/badge/urgency/CTA)
- [MED] `.proof-strip` → explicit 2×2 grid below 500px
- [MED] Form-field font-size 16px (lands with Section 8 briefing-form work)
- Already has hamburger nav.

## 6. Filter UI Pattern (deals.html)

**Pattern:** inline accordion. Filter row collapses into a single tappable bar at the top of the deals view.

**Markup change** (in `deals.html`):
```html
<button class="filter-toggle" aria-expanded="false" aria-controls="filter-row">
  <span class="filter-toggle-label">Filters</span>
  <span class="filter-toggle-count" data-active="0"></span>
  <span class="filter-toggle-chevron">▾</span>
</button>
<div id="filter-row" class="filter-row" hidden>
  <!-- existing 5 select elements -->
</div>
```

**Behavior:**
- Desktop (≥600px): toggle button hidden via CSS, filter-row always visible (existing layout).
- Phone (<600px): toggle button visible, filter-row collapsed by default. Tap toggles `hidden` attribute and updates `aria-expanded`.
- Active filter count: small JS reads filter-select values and updates `data-active` count (e.g., "Filters · 2 active ▾").
- No overlay, no scroll-lock, no portal — DOM expansion only.

**JS:** ~15 lines added to `assets/deals.js` (toggle handler + active-count updater).

## 7. Compare.html Mobile Pattern

**Pattern:** sticky label column, horizontal scroll for deal columns.

**Markup change** in `renderComparison()` (`assets/deals.js`):
```js
const html = `
  <div class="cmp-wrap">
    <table class="cmp-table">
      <!-- existing rows -->
    </table>
  </div>
  <div class="cmp-swipe-hint">← swipe to compare →</div>
`;
```

**CSS additions:**
```css
.cmp-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.cmp-table th.cmp-label { position: sticky; left: 0; background: var(--bg, #0a0a0a); z-index: 1; }
.cmp-swipe-hint { display: none; text-align: center; font-size: 0.75rem; color: #888; padding: 0.5rem; }
@media (max-width: 600px) { .cmp-swipe-hint { display: block; } }
@media (hover: hover) { .cmp-swipe-hint { display: none !important; } }
```

**Why:** preserves the comparison primitive (the only reason this page exists). Lowest implementation cost. Uses a touch pattern users already know from native tables.

## 8. Briefing Form (Gumroad Overlay)

**Replace** the misleading `.briefing-form` block on `ai-research.html` with Gumroad's official overlay-button.

**Markup:**
```html
<!-- in <head> -->
<script src="https://gumroad.com/js/gumroad.js"></script>

<!-- in body where briefing block is -->
<div class="briefing-block">
  <h3>Free briefing — every Friday</h3>
  <p>The week's pharma deal flow, condensed. Delivered as PDF.</p>
  <a class="gumroad-button" href="https://thepharmacloseout.gumroad.com/l/briefing?wanted=true">
    Get the free Briefing →
  </a>
  <p class="briefing-note">PDF delivered to your inbox · No card required</p>
</div>
```

**Behavior:** tapping the button opens Gumroad's overlay (modal) on top of the page. Email entry, free checkout, PDF auto-delivered. Email lands in Gumroad's customer list.

**CSS:**
- Button styled to match brand (override Gumroad's default styling via `.gumroad-button` selector).
- Mobile: full-width below 500px, `min-height: 48px`, font-size 16px.

**Risk & fallback:** Gumroad's overlay UI has limited theming control. **Implementer must verify Gumroad overlay rendering on iOS Safari before committing to this markup** (test on real device or BrowserStack) — early verification prevents a mid-implementation pivot. If the overlay visually clashes with the site brand or breaks on iOS Safari, fallback to the redirect-link pattern with relabeled CTA "Continue to Gumroad →" so user expectation is set. Decision logged in implementation report.

## 9. Cross-Cutting Global Rules

Applied via `assets/deals.css` (and parallel rules in `index.html` inline `<style>`):

- **Tap target floor:** all interactive elements (`a`, `button`, `input`, `select`) get `min-height: 44px` on phone via a global rule, with intentional overrides where appropriate.
- **Input font-size:** 16px minimum globally (`input, textarea, select { font-size: 16px }`). Eliminates iOS auto-zoom site-wide.
- **Body font:** bump from 14px → 15px on mobile (desktop unchanged). Prose blocks at 12-13px individually raised to 15-16px.
- **Hover guards:** all `:hover` rules with transforms or pointer-state changes wrap in `@media (hover: hover)`.
- **Reduced-motion guards:** `prefers-reduced-motion: reduce` disables transform animations (poster reveal, ring rotation, scroll-snap momentum where it conflicts).
- **Safe-area insets:** all `position: fixed` elements (FAB, sticky CTA bar, mobile drawer) use `env(safe-area-inset-*)` for iPhone home-indicator clearance.

## 10. Testing

- **DevTools breakpoint sweep:** 375 / 414 / 600 / 768 / 1024 / 1440 px on every page after each implementation batch.
- **Real-device pass:** iOS Safari on iPhone. Tap every primary CTA, every nav link, every filter, the briefing form button, deal cards. Confirm no auto-zoom on any input.
- **Lighthouse mobile audit:** before vs. after numbers per page. Target ≥90 Accessibility, ≥85 Performance. Captured in implementation report.
- **Cross-page nav parity:** open all 6 pages on phone and confirm hamburger renders and behaves identically.
- **Tap-target audit:** 44×44 overlay grid (DevTools snippet) on each page; flag elements below floor.
- **No automated mobile regression suite** in this scope. Adding Playwright mobile tests is a separate effort.

## 11. Out of Scope

- Visual redesign — this is responsiveness, not aesthetics.
- Performance budget enforcement — separate concern.
- A/B testing infrastructure.
- Analytics instrumentation for mobile-specific events.
- Service worker / PWA / offline support.
- Image optimization pipeline.
- Email service provider (ESP) integration — the briefing form uses Gumroad's overlay; building a real ESP-backed list is deferred.
- Automated mobile regression test suite.

## 12. File Inventory

**Files modified:**
- `assets/deals.css` — extend breakpoint cascade, add hamburger nav rules, add filter accordion rules, add cmp-wrap rules, global tap-target / typography rules.
- `assets/deals.js` — add filter accordion toggle (~15 lines), modify `renderComparison()` to wrap in `.cmp-wrap`, add active-filter-count updater.
- `index.html` — replace nav markup, add mobile rules to inline `<style>`, hero CTA tap-target fixes, footer link fixes.
- `deals.html` — replace nav markup, add filter toggle button + filter-row container.
- `deal.html` — replace nav markup, add breadcrumb, add share button.
- `compare.html` — replace nav markup.
- `about.html` — `.distribution-link` padding, hero video preload/connection check.
- `ai-research.html` — replace `.briefing-form` block with Gumroad button, add Gumroad script tag, btn-primary/secondary padding, sticky-bar dismiss tap area, price-block mobile stack, proof-strip 2×2 grid.

**Files added:**
- `assets/nav.js` — shared hamburger toggle (~20 lines), loaded by all 6 pages.

**Files unchanged:**
- `assets/format.js`, `assets/logos/`, `tests/`, `package.json`, etc.
