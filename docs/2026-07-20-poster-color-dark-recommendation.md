# Deal-Poster Colors on Dark — Recommendation
*2026-07-20 · design-research pass (dark-UI color theory) + reconciliation against the site's existing semantic colors. Implementation-ready.*

## Problem
The deal-type poster gradients were tuned for the old **white** canvas. On the new near-black `#0a0a0a` canvas their darkest stops (`#070d1e`, `#100800`, `#000f08`, `#0a0015`) are luminance-equivalent to the page, so **card edges dissolve, elevation cues die, and hues collapse toward the same near-black.** Separately, the posters and the type-pills shipped **two contradictory color maps** (M&A = navy on the poster but purple on the pill).

## Diagnosis (color theory)
- **Edge dissolves:** canvas ≈ L\* 3–4; poster floors sat at L\* 4–7 — a 1–3 L\* step is below the threshold the eye needs to resolve a boundary. On white the same stops had a ~90-pt delta.
- **Elevation is dead:** the CSS still uses light-mode shadows (`rgba(0,0,0,0.12)`). On near-black a shadow can't get darker than the canvas. Material/Apple/Carbon all switch to **lighter surfaces (tonal elevation), not shadow,** on dark.
- **Hue collapse:** below L\* ~8 every hue reads as the same near-black. Fix is **lift lightness + slightly desaturate,** NOT crank saturation (saturated-on-black vibrates/halates — NN/g).

## Approach (chosen): preserve the moody posters + reframe
Keep the cinematic full-bleed "Criterion poster" cards (real brand equity — do **not** flatten to a SaaS card + tag). Re-cut each gradient so its **floor clears the canvas by ~7 L\*** and its **crest is a muted mid-lightness identity hue,** then wrap every card in an explicit edge + tonal-lift frame so the boundary never depends on the gradient alone. Principle: on dark, **elevation = lighter surface; category = mid-lightness desaturated hue.**

## Reconciliation against the site's semantics (the binding constraint)
Three hue lanes on these pages already carry **meaning** and sit *on the same cards* as the posters:
- **green `#3ddc84`** = Outcome score ("the deal worked") — the green chip renders on every card
- **gold `#c49332` / `#f6c547`** = brand accent + Critic score — the gold chip renders on every card
- **red `#f2695c`** = negative

So the categorical palette must **vacate the green, gold/amber, and red lanes.** The first-draft palette violated this twice (Co-Dev was green → reads "good outcome"; Licensing was amber-bronze → competes with gold/critic). Corrected below.

## FINAL locked categorical palette
One hue per category, used by poster crest **and** pill **and** filter toggle (single source of truth). Add to `:root` in `assets/deals.css` beside the semantic tokens:

```css
/* CATEGORICAL — deliberately vacates the gold, green, and red (meaning) lanes.
   Drives poster ring accent + pill + filter toggle for each deal type. */
--cat-ma:    #4373c4;   /* M&A       — navy-azure ~220°, deeper than info-blue #6ea0ff */
--cat-lic:   #a9703a;   /* Licensing — bronze ~32°, darker/redder than gold; NOT amber, NOT red */
--cat-codev: #2f9fb3;   /* Co-Dev    — cyan-teal ~190°, moved OFF outcome-green #3ddc84 */
--cat-asset: #9165c0;   /* Asset     — violet ~272°, distinct from incidental purple #a78bfa */
--cat-other: #6a6f78;   /* Other     — slate, neutral, recedes */
```
Pills/toggles (`.deal-type-pill[data-type=…]`, `.dt-toggle.active[data-type=…]`) use these hexes directly (L\* ~50–62). Adjacent categories differ by ≥40° hue or a large lightness/chroma gap; none reads as positive/negative/brand.

**Locked table** (poster-crest = lightest gradient stop = the poster's identity color; floor = darkest stop, sets the card's edge-clearing lift):

| Category | Pill / toggle | Poster crest | Poster floor |
|---|---|---|---|
| M&A | `#4373c4` | `#1d3169` | `#0d1730` |
| Licensing | `#a9703a` | `#433014` | `#1c1206` |
| Co-Dev | `#2f9fb3` | `#12414d` | `#06181c` |
| Asset | `#9165c0` | `#301a58` | `#140a26` |
| Other | `#6a6f78` | *(neutral)* | `#141518` |

## FINAL poster gradients (5-stop, 172°; floors ~L\*10–13, crests ~L\*19–24)
```css
.bg-ma    { background: linear-gradient(172deg,
  #0d1730 0%, #14224e 28%, #1d3169 52%, #16264f 76%, #101b3a 100%); } /* navy */

.bg-lic   { background: linear-gradient(172deg,
  #1c1206 0%, #2e1f0c 28%, #433014 52%, #2f210d 76%, #1e1408 100%); } /* bronze (crest #433014, not gold) */

.bg-codev { background: linear-gradient(172deg,
  #06181c 0%, #0c2f39 28%, #12414d 52%, #0d323c 76%, #071e24 100%); } /* cyan-teal (not outcome-green) */

.bg-asset { background: linear-gradient(172deg,
  #140a26 0%, #21123f 28%, #301a58 52%, #221340 76%, #160b28 100%); } /* violet */
```

## Framing / elevation spec (do NOT rely on the gradient for the edge)
1. **Tonal layers** (elevation = lighter surface): `--bg:#0a0a0a` (canvas) · `--surface:#141518` (grid gutters, filter bar) · `--paper:#1b1d22` (card chrome/modals — nudge current `#17181c` lighter).
2. **Hairline edge (the reliable boundary):** `box-shadow: inset 0 0 0 1px rgba(232,228,218,0.14);` on `.p-edge/.fp-edge` (was `0.08` — too faint).
3. **Glow, not drop-shadow, for hover:**
```css
.poster        { box-shadow: 0 8px 24px rgba(0,0,0,0.55), 0 1px 0 rgba(232,228,218,0.06); }
.poster:hover  { box-shadow: 0 16px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(196,147,50,0.35), 0 0 28px rgba(196,147,50,0.12); }
```
(Dark mode needs shadow opacity ~0.55, not the ~0.12 that's there now; hover lift is a **gold-tinted glow** = brand-tied.)
4. **Legibility:** off-white text/logos `#e8e4de` over every crest clears **APCA Lc ~65–71** (> Lc 60 body-text bar) — no scrim needed as long as crests stay ≤ L\* ~24. Validate final stops in the APCA calculator once in CSS.

## What to avoid
Don't chase legibility with saturation (vibrates/halates on black — lift lightness + cut chroma instead). No pure `#000`. Don't signal elevation with low-opacity black shadows (invisible on dark). Don't let any category enter the gold/green/red meaning lanes. Don't run two category→color maps. "Moody" comes from low crest-lightness + desaturation, not from touching the canvas.

## Ship-one-option summary
Apply the locked `--cat-*` palette + the four reconciled `.bg-*` gradients + the inset hairline (`rgba(232,228,218,0.14)`) + the gold hover glow. Non-negotiables the reconciliation forced: **Co-Dev must not be green; Licensing must not be gold/amber.** All classes live in `assets/deals.css` (`.bg-ma/.bg-lic/.bg-codev/.bg-asset`, `.deal-type-pill`, `.dt-toggle`, `.poster/.p-edge/.fp-edge`, `:root`).

## Sources
Material Design (dark theme / tonal elevation) · Apple HIG (Dark Mode base↔elevated) · IBM Carbon (layers lighter on dark; categorical palette) · AWS Cloudscape (data-vis colors on dark) · NN/g (dark-mode issues, halation, avoid pure black) · Datawrapper (data-vis color style guides) · cssShowcase (shadow opacity 12%→55%, glow on near-black) · APCA (Lc 60 threshold).
