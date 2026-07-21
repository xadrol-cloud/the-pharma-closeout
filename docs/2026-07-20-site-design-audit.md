# The Pharma Closeout — Site Design Audit
*2026-07-20 · grounded in live-site screenshots of every section*

## The core problem (the "so what")

**The site is running three disconnected design systems under one brand.** The same content — a single deal — renders in three different visual languages depending on which URL you land on. To a visitor moving between sections it doesn't read as one product; it reads as three different websites that happen to share a name. That is the root of every "these don't match" observation, including the Pfizer example and the deals.html header.

Your Pfizer case is the clearest proof: `deals/pfizer-biontech-se-2020.html` (static, **dark**, Georgia serif, **no navigation at all**) and `deal.html?id=…` (interactive, **light**, Cormorant serif, full nav + poster + score breakdown) are the *same deal* — and look nothing alike.

## The three systems

| System | Pages | Font stack | Theme | Header |
|---|---|---|---|---|
| **A — Editorial** | home, **episodes**, about, research, methodology | Newsreader + DM Sans | Dark (`#0a0a0a`) + gold | `.logo` "The Pharma Closeout" (links home) |
| **B — Deals app** | deals, deal, compare, hype-gap, acquirers, browse, hindsight | Cormorant + Outfit + IBM Plex + Baskerville | **Light** (cream/white) + gold | `.nav-brand` + search box + Subscribe pill |
| **C — Static deal pages** | `deals/<slug>.html` (1,276 pages) | **Georgia / Times** (system serif) | Dark navy (`#141518`) | `.kicker` eyebrow — **no nav/logo** |

Three font stacks. Two opposing themes (dark vs light). Three different headers. The brand wordmark links home in A, doesn't in B, and doesn't exist in C.

---

## Section by section

### System A — Editorial (home, episodes, about, research, methodology)
**Works.** This is the strongest, most cohesive part of the site and the natural brand anchor. Newsreader display + DM Sans body on a dark canvas with gold accents reads premium and editorial. The new episode pages match the homepage exactly (by design). The logo now links home.
**Doesn't.** The nav is minimal; there's no shared, reusable header component — each page re-declares its own nav markup/CSS, so they drift over time (that's how we got here).
**Align.** Treat this as the reference system. Everything else should move toward it.

### System B — Deals app (deals.html, deal.html, compare, hype-gap, …)
**Works.** Genuinely the most *product-rich* part of the site. The interactive deal page is excellent — poster card with company logos, a live score breakdown with weighted dimensions and methodology tooltips, export. deals.html's Cormorant hero ("…grades how deals *aged*") is elegant. This is real design investment; don't throw it away.
**Doesn't.**
- **Different font stack** than the brand anchor (Cormorant/Outfit vs Newsreader/DM Sans).
- **Light theme** while home/episodes are dark — the jump from homepage to deals.html is a jarring white flash.
- **The nav is a different component** (`.nav-brand`, not `.logo`); the wordmark **doesn't link home**; and **"Deal Intelligence" wraps to two rows on desktop** (confirmed on both deals.html and deal.html) because the fixed 280px search box + Subscribe pill squeeze the flex row with no `nowrap`.
- **Mobile:** the 280px search box has no responsive handling — it overflows on phones (there's already a big search section in the page body, so the nav search is redundant on mobile anyway).
**Align.** Adopt System A's header + font pairing; fix the nav wrap + mobile; decide the theme question (below).

### System C — Static deal pages (`deals/<slug>.html`)
**Works.** SEO-friendly (crawlable, one URL per deal, good `<title>`). The dark score cards ("THE STREET SAID 67 / HISTORY SAYS 100") communicate the core value fast.
**Doesn't — this is the biggest offender.**
- **Georgia/Times system serif** — the cheapest-looking type on the site; instantly reads as a different, lower-quality page.
- **No site header or navigation whatsoever.** It's a dead end: a visitor (or someone arriving from Google) cannot get back to the homepage, search, or anything else. No logo, no nav, no way in.
- **Dark navy** while the interactive version of the *same deal* is **light** — the exact whiplash you flagged.
- It **duplicates** the interactive deal page with a worse design. Two pages, same deal, competing.
**Align.** Give these a real header (System A nav) and converge their look with the interactive deal page — or better, unify the two so a deal has *one* design that's both crawlable and rich.

---

## Cross-cutting issues (ranked by brand damage)

1. **Theme split — dark vs light.** Home/episodes/static-deals are dark; deals.html/interactive-deals are light. Every crossing is a visual jolt. **Pick one canonical theme.**
2. **Three font stacks.** Newsreader+DM Sans / Cormorant+Outfit+IBM Plex+Baskerville / Georgia. **Pick one pairing** (or one pairing + one *deliberate* accent).
3. **Three headers, no shared component.** `.logo` / `.nav-brand` / none. This guarantees future drift. **Build one header partial and use it everywhere.**
4. **Wordmark-links-home is inconsistent** (yes in A, no in B, absent in C).
5. **"Deal Intelligence" nav wrap** on desktop (System B) — your original bug.
6. **Static deal pages are navigation dead-ends** — no way back into the site.

---

## Recommended alignment (prioritized)

**P0 — Establish one system (the brand decision).**
- **Header:** extract System A's `.logo` nav into a single reusable header and put it on every page (including the static deal pages, which have none). Wordmark links home everywhere.
- **Type:** standardize on **Newsreader (display) + DM Sans (body)**. Retire Georgia outright. Decide whether Cormorant stays as a *deliberate* deals-section accent or is retired too — my lean: retire it; one serif is cleaner and Newsreader is already your brand face.
- **Theme:** go **dark** as canonical (home, episodes, brand identity, and the highest-traffic pages already are). Re-skin the deals app + interactive deal page from light → dark. This is the bigger lift but the biggest coherence win.

**P1 — Fix the deals-app nav (your original request).** `nowrap` on nav links, responsive/hidden search on mobile, wordmark → home, Subscribe styled as System A's bordered button. Small, self-contained, testable — a good first commit.

**P2 — Converge the deal pages.** Give static deal pages the shared header and align them to the interactive deal design (fonts, theme, score cards) so "same deal" = one design.

---

## Decisions I need from you

1. **Canonical theme — dark or light?** (Home/episodes are dark; deals app is light. I recommend dark.)
2. **Cormorant — keep as a deals accent, or standardize on Newsreader everywhere?** (I recommend standardize.)
3. **Static deal pages — converge with the interactive deal design, or keep them lightweight but re-skin to match?**

Answer these three and the alignment work becomes mechanical. P1 (the deals nav) I can do immediately regardless of the above — it's an improvement under any decision.
