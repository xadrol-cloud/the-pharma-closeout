# Mobile Optimization — Release Notes

**Date shipped:** 2026-05-05
**Branch:** `mobile-optimization-2026-05-02`
**Plan:** `docs/superpowers/plans/2026-05-02-bd-mobile-optimization.md`
**Spec:** `docs/superpowers/specs/2026-05-02-bd-mobile-optimization-design.md`
**Cache-buster bumped to:** `v=20260505b` across all 6 pages

---

## Summary

Mobile-optimized the public site (6 pages: index / deals / deal / compare / about / ai-research) via incremental responsive CSS pass + nav unification + Gumroad overlay for the briefing form. Phases 1-9 of the plan complete. Phase 10 final QA gates partially deferred (see below).

## What shipped, by phase

### Phase 1 — Foundation (already on branch before this session)
- Global `input/textarea/select { font-size: 16px }` to suppress iOS auto-zoom
- `prefers-reduced-motion` guards
- 480px / 375px / hover / no-hover breakpoint scaffolding

### Phase 2 — Shared nav infrastructure (already on branch)
- `assets/nav.js` — shared hamburger toggle (open/close, escape, click-outside, focus return)
- Canonical `.nav-toggle` + `.nav-links[data-collapsed]` CSS in `assets/deals.css`

### Phase 3 — Per-page nav migration
| Task | File | Commit |
|---|---|---|
| 3.1 | deals.html | `1d33e1b` |
| 3.2 | deal.html | `85c04fb` |
| 3.3 | compare.html | `7985f15` |
| 3.4 | index.html (diff-and-preserve) | `051fd5c` |

All 6 pages now share `nav.js` and the `data-collapsed` / `aria-expanded` markup contract. Index.html keeps its brand identity (Newsreader serif wordmark, gold-thread accent, 6-link IA — Articles + LinkedIn).

### Phase 4 — deals.html mobile experience
| Task | Commit |
|---|---|
| 4.1 filter accordion HTML | `38e47b0` |
| 4.2 filter accordion CSS | `723dcf6` |
| 4.3 filter accordion JS | `26ba9bd` |
| 4.4 hover guards + touch tap targets | `4fb5669` |
| 4.5 FAB safe-area + grid poster sizing | `aedd620` |

Filter row collapses on phone behind a 44px-tall toggle button. Active-filter count badge populates from non-default selects. Hover-state side-effects nullified on touch devices via `@media (hover: none)`. `.poster-select` 22→36px tap target. Carousel arrows hidden on touch. `.fab` and `.compare-fab` use `env(safe-area-inset-*)` to clear iPhone home indicator. Search results render full-width within `.grid` container.

### Phase 5 — deal.html mobile experience
| Task | Commit |
|---|---|
| 5.1 + 5.2 hero padding + prose + footer | `30b1268` |
| 5.3 + 6.1 cmp-table mobile pattern | `aaec555` |
| 5.4 breadcrumb + share button | `35344d5` |

Hero padding tightened on phone (20px/16px). FAB labels wrap to 2-up at 600px, stack 1-up at 480px. Body + prose 15px on phone. `.mkt-row` collapses to 1-col at 480px. Footer becomes column at 600px. `.cmp-wrap` adds horizontal scroll + sticky label column for compare table. "← All deals" breadcrumb above hero. Share button (4th FAB entry) using `navigator.share` with clipboard fallback + window.prompt final fallback.

### Phase 7 — index.html mobile experience
| Task | Commit |
|---|---|
| 7.1 + 7.2 hero CTAs + footer + wire-meta | `a294fb5` |

`.hero-tagline` floor 0.85rem (was 0.7rem). `.hero-links a` display:inline-block + 0.75rem padding + 44px min-height. `.hero` min-height auto on phone (no longer balloons). `.footer-connect` column-stack with per-link tap target. `.wire-meta` hidden below 480px (news ticker becomes title-only on tightest band).

### Phase 8 — about.html
| Task | Commit |
|---|---|
| 8.1 distribution-link + video saveData | `a27cc20` |

`.distribution-link` block + 0.75rem 0 padding (Spotify/Substack/LinkedIn links proper tap height). Hero video gets `preload="none"` and a `navigator.connection` saveData/2g/slow-2g check that removes autoplay on slow phones.

### Phase 9 — ai-research.html
| Task | Commit |
|---|---|
| 9.1 + 9.2 + 9.3 Gumroad + tap targets + price-block | `a6d2ecc` |

Gumroad overlay button (briefing CTA) — gumroad.js script in head, `class="gumroad-button"` + `?wanted=true` URL. **Graceful degradation:** if the script fails to load or fails to intercept, the link still navigates to Gumroad's checkout page; funnel stays unbroken either way. `.btn-primary` / `.btn-secondary` padding bumped to ≥44px height with center alignment. Sticky-bar dismiss button now 44×44 tap area (icon kept small). `.form-field` font-size 16px (iOS auto-zoom suppression). `.price-block` stretch + center children on phone. `.proof-strip` 2×2 grid below 500px.

## Phase 10 — Deferred to Bin

| Item | Why deferred | Action needed |
|---|---|---|
| **Lighthouse mobile audit** | Headless Lighthouse not available in current CLI environment. | Run `npx lighthouse <url> --preset=mobile --only-categories=performance,accessibility,best-practices,seo` per page on the live site after merge. Target Accessibility ≥90, Performance ≥85 per spec. Capture before/after if you have the prior baseline. |
| **Real iPhone Safari pass** | No iOS device available to the agent. | On any iPhone (iOS 16+), open Safari → load each of the 6 pages → tap every primary CTA, every nav link, every filter, the briefing button, deal cards, share button, breadcrumb. Confirm: no auto-zoom on inputs, hamburger works on every page, filter accordion opens/closes on deals.html, cmp-table swipes with sticky labels on compare.html, **Gumroad overlay opens correctly on ai-research.html** (highest-risk verification — see fallback note below), FAB doesn't collide with home indicator, all taps register first try. |
| **Gumroad overlay iOS Safari verification** | Real-device test required per spec Section 8 risk. | If the overlay visually clashes or breaks on iOS, **fallback is one-line revert**: in `ai-research.html`, change `class="form-submit gumroad-button"` back to `class="form-submit"` and remove `?wanted=true` from the URL. The script tag in head can stay (harmless if unused). |
| **DevTools breakpoint sweep at 414 / 1024 px** | Browser-tool verification covered 1440 + 600 + 375 px during dev; mid-points not exhaustively swept. | Worth a 5-minute spot check at 414 (iPhone Pro Max) and 1024 (iPad portrait) on each page to catch any weird intermediate flow issues. |

## Files inventory

**Modified:**
- `index.html` — nav migration, hero+footer mobile rules, cache-buster
- `deals.html` — nav migration, filter accordion markup, cache-buster
- `deal.html` — nav migration, breadcrumb + share button, cache-buster
- `compare.html` — nav migration, cache-buster
- `about.html` — distribution-link padding, video saveData
- `ai-research.html` — Gumroad overlay, btn padding, price-block, proof-strip, cache-buster
- `assets/deals.css` — canonical hamburger nav, filter accordion CSS, breakpoint scaffolding, touch hover guards, cmp-wrap, breadcrumb, Phase 5 mobile rules, FAB safe-area
- `assets/deals.js` — filter accordion IIFE, share button IIFE, renderComparison cmp-wrap
- `assets/nav.js` — already created in Phase 2

**Created:**
- `assets/nav.js` (Phase 2)
- `docs/release-notes-mobile-2026-05-05.md` (this file)

## Known limitations

- **Hover-state nullification on touch uses an override block** (`@media (hover: none) { ... transform: none }`) rather than wrapping each `:hover` rule in `@media (hover: hover)`. Same user-facing result, lower-risk edit. Phase 11 (Broadway aesthetic) may rewrite the poster card system entirely, at which point the override becomes inert.
- **`.active` class kept on nav links** instead of plan-literal `nav-active` because existing CSS targets `.active`. Avoided a global rename + new CSS rule.
- **Filter accordion uses `id="filters"`** instead of plan-literal `id="filter-row"` because `assets/deals.js:267` reads via `getElementById('filters')`. Added `filter-row` as a sibling class.
- **Mobile Phase 4 filter accordion will be re-themed by Phase 11 WS-D** (pill-toggles + aux chips). Phase 4 builds the accordion shell; Phase 11 changes the contents. They compose cleanly.

## Companion: Phase 11 spec (queued)

`docs/superpowers/specs/2026-05-05-broadway-aesthetic-design.md` — Broadway-Scorecard-inspired visual refresh (tier-coded score chips, verbal tier callouts, semantic deal-type pills, row-list view, persistent gold-pill nav CTA, deal-value cascade bar). 8 workstreams. Pending Bin's review before plan doc.
