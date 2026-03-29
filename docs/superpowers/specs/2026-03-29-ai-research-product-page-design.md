# AI Research Product Page — Design Spec

**Date:** 2026-03-29
**Status:** Approved by user during brainstorming session
**Mockup:** `.superpowers/brainstorm/1264-1774766118/ai-research-v2.html`

---

## Overview

Add a research product page (`/ai-research`) to thepharmacloseout.com that serves as the hub for The Pharma Closeout's AI research content. The page functions as a funnel: free content (podcast series, strategic briefing) builds trust and captures leads, while the paid Compendium converts qualified buyers.

The page also requires updates to the homepage (nav link + teaser section) and the about page (nav link).

## Business Context

- **Free lead magnet:** AI in Pharma Strategic Briefing (25-page PDF, v3)
- **Paid product:** AI in Pharma Definitive Compendium (198-page PDF, v11) — $149 launch price, $197 standard price
- **Podcast series:** "The AI Reckoning" — 4 special episodes already produced and on Spotify
- **Pipeline logic:** Podcast → Briefing download (email capture) → Compendium purchase → Consulting engagement
- **Target audience:** VP+ pharma executives, commercial strategy leaders

## Technical Architecture

### Hosting & Stack

No changes to the existing stack. The site remains pure HTML/CSS/JS on GitHub Pages. No framework, no build step, no backend.

### Payment: Stripe Payment Links

- Create a Product in Stripe Dashboard: "AI in Pharma: The Definitive Compendium"
- Set price: $149 (launch), plan to raise to $197 after collecting social proof
- Generate a Stripe Payment Link
- Upload Compendium PDF to Stripe as digital delivery file
- All "Get the Compendium" buttons link to the Stripe Payment Link URL
- After payment: Stripe emails the buyer a receipt with the PDF download link
- Mobile: Stripe Checkout supports Apple Pay, Google Pay, autofill — frictionless on mobile

### Email Capture & PDF Delivery: Kit (formerly ConvertKit)

- Create free Kit account (free tier up to 10,000 subscribers)
- Upload Strategic Briefing PDF to Kit
- Create a Form in Kit for the briefing download
- Create a Visual Automation: form submit → tag "briefing-download" → auto-send email with Briefing PDF attached
- Embed Kit form action URL into the custom-styled email form on the product page
- Kit is separate from Substack — Substack remains the newsletter publishing platform, Kit handles the briefing download funnel specifically
- Future: can add drip sequences (e.g., Day 3 after download → soft Compendium pitch)

### Analytics

Existing Google Analytics 4 (G-K6XEWCK7W4) covers the new page automatically.

---

## Files to Create / Modify

| Action | File | Description |
|--------|------|-------------|
| **CREATE** | `ai-research.html` | New product page (~600-800 lines) |
| **EDIT** | `index.html` | Add "Research" nav link + teaser section before footer |
| **EDIT** | `about.html` | Add "Research" nav link to nav |
| **EXTERNAL** | Stripe Dashboard | Create product, set price, generate Payment Link, upload PDF |
| **EXTERNAL** | Kit (ConvertKit) | Create account, upload Briefing PDF, create form + automation |

---

## Page Structure: ai-research.html

### Section 1: Navigation

Identical to homepage/about nav with one addition:
- New "Research" link between "Articles" and "About"
- `class="active"` on the Research link
- Podcast and Articles links point to `index.html#podcast` and `index.html#articles`

### Section 2: Hero — "The AI Reckoning"

Compact hero that orients the visitor and presents three offerings with equal visual weight.

**Layout:**
- Section label: "The Pharma Closeout Research"
- Headline: "The AI Reckoning" — uses homepage's weight-800 Newsreader, `clamp(3rem, 8vw, 7rem)`
- One-line description below headline
- Three offering cards in a horizontal grid:

**Offering cards (3-column grid):**

| Card | Visual | Title | Description | CTA |
|------|--------|-------|-------------|-----|
| Podcast | Gold SVG waveform bars, slow breathing animation (~6s cycle) | The Podcast Series | Alex Mercer and Maya Patel unpack who's actually capturing AI value in pharma. Four episodes. | Listen now → |
| Briefing | Three ascending gold bars, slow sequential grow animation (~8s cycle) | The Strategic Briefing | 25-page executive summary. Crisis, opportunity, and a 90-day action roadmap. Delivered to your inbox. | Get the briefing → |
| Compendium | Mock document with continuous upward scroll through masked viewport (12s linear loop, fade edges), reinforcing depth | The Definitive Compendium | The operational intelligence your AI strategy is missing. Case studies, diagnostic scorecard, and proprietary frameworks built for pharma leadership teams. | Get the research → / ~~$197~~ $149 |

**Design details:**
- Compendium card has gold top border (2px) and subtle gold background to signal premium tier
- No "Free" labels on podcast or briefing cards — they present as valuable content, not loss leaders
- Price only appears on the Compendium card, bottom-right, secondary to the value proposition
- "Launch Price" badge next to price (small, bordered)
- All cards link to their respective sections via anchor (`#series`, `#briefing`, `#compendium`)
- Subtle gold radial gradient behind hero, slow gold scanline animation (8s cycle)
- Staggered fadeUp entrance animations on load

**Responsive (≤800px):** Cards stack vertically, single column.

### Section 3: Podcast Series

**Layout:**
- Section label: "Special 4-Part Series"
- Headline: "The AI Reckoning — Listen Free"
- Description paragraph
- Four episode cards in accordion pattern

**Episode accordion cards:**
Each card shows:
- Large ghost number (Newsreader, weight 300, gold at 25% opacity)
- Episode title (Newsreader, weight 600)
- Subtitle/description (1 line, gray)
- Duration
- Toggle indicator (+)

On click: card expands to reveal an inline Spotify embed player (152px height, specific episode URL). Only one card open at a time. "Open in Spotify →" link below player goes to the specific episode URL (not the general show page).

**Episode data (placeholder URLs — need real Spotify episode IDs):**

| # | Title | Subtitle | Duration |
|---|-------|----------|----------|
| 1 | The Reckoning | 5% of pharma at genuine competitive advantage. 89% of AI pilots fail to scale. | 28 min |
| 2 | From Molecule to Market | 173 AI-discovered drug programs in clinical development. First FDA approval projected within 18 months. | 30 min |
| 3 | The Agentic Enterprise | 74% of pharma planning agentic AI deployment. Novo cut forecast errors 50%. | 30 min |
| 4 | Who Wins | Three AI strategies emerge. Winners integrate across discovery + operations + talent simultaneously. | 32 min |

**Spotify embed URL pattern:** `https://open.spotify.com/embed/episode/{EPISODE_ID}?utm_source=generator&theme=0`
**Spotify link pattern:** `https://open.spotify.com/episode/{EPISODE_ID}`

**Implementation note:** Use working placeholder markup (e.g., the general show embed) until real episode IDs are wired in. All external URLs (Stripe Payment Link, Kit form action, Spotify episode IDs) should be centralized in a config block at the top of the `<script>` section for easy wiring after manual setup.

### Section 4: Free Strategic Briefing (Email-Gated)

**Layout:** Two-column grid (copy left, form right). Subtle gold-glow gradient background at top.

**Left column (copy):**
- Section label: "Free Download"
- Headline: "The Strategic Briefing"
- Description: "25 pages. The crisis, the opportunity, and a 90-day action roadmap for your leadership team — delivered to your inbox."
- Bullet list (gold em-dash prefix):
  - The $275B revenue cliff and why AI is the only lever at scale
  - The Cascade Framework — where to start and what to prioritize
  - Three case studies compressed into actionable lessons
  - A 90-day action roadmap your leadership team can use Monday

**Right column (form):**
- Title: "Download the Briefing"
- Subtitle: "Free PDF, delivered to your inbox."
- Email input field (custom styled to match Wire Service)
- Submit button: "Get the Free Briefing →" (gold background, black text)
- Note: "You'll also receive The Pharma Closeout newsletter. Unsubscribe anytime."
- Form action: Kit (ConvertKit) form endpoint URL
- On submit: Kit API handles subscription + triggers automation to send Briefing PDF

**Responsive (≤800px):** Single column, copy above form.

### Section 5: The Compendium (Paid Product)

**Layout:**
- Section label: "The Full Research"
- Headline: "AI in Pharma: *The Definitive Compendium*" (italic in gold)
- Description: "Everything in the Briefing — plus 170 more pages of original analysis, operational frameworks, and the evidence base your strategy deck is missing."

**Buyer-focused value grid (4 columns):**

| Stat | Title | Description |
|------|-------|-------------|
| 63 | GenAI Use Cases | Mapped across discovery, trials, operations, and commercial — with implementation evidence for each |
| 3 | Deep Case Studies | Pfizer's $750M AI platform · Recursion-Exscientia $712M · UCB & Novo Nordisk commercial excellence |
| 60 | Self-Assessment Items | The Cascade Scorecard — a diagnostic instrument to benchmark your organization's AI maturity |
| 90 | Day Action Framework | 12 imperatives with governance structure. A ready-to-present roadmap for your leadership team |

**What's inside grid (2×2):**

| Part | Title | Description |
|------|-------|-------------|
| Part I — The Crisis | The AI Reckoning | $275B in revenue at risk. Why the next 36 months determine which companies survive the patent cliff. |
| Part II — The Technology | From Molecule to Market | AI across the full value chain — discovery, clinical trials, operations, and the 63 commercial GenAI use cases. |
| Part III — The Transformation | Workforce, Governance, Action | The AI-augmented workforce. The governance imperative. 12 strategic imperatives for the next 90 days. |
| Appendices | The Evidence Base | AI ecosystem map, 354 curated statistics across 6 domains, source document index, full glossary. |

**Pricing block** (below content, separated by gold rule):
- Price display: ~~$197~~ **$149** `LAUNCH PRICE` (badge with border)
- CTA button: "Get the Compendium →" (gold, links to Stripe Payment Link)
- Meta text: "PDF · 198 pages · Instant delivery · Secure checkout via Stripe"

**Responsive (≤800px):** Value grid goes to 2 columns, inside grid goes to 1 column.
**Responsive (≤500px):** Value grid goes to 1 column.

### Section 6: Cascade Framework

**Layout:**
- Section label: "Proprietary Framework"
- Headline: "The Cascade Framework"
- Description paragraph about the 6-link model
- Horizontal chain of 6 connected cards:

| # | Name | Subtitle |
|---|------|----------|
| 01 | Discover | Target ID, lead optimization, AI-native pipelines |
| 02 | Develop | Trial design, patient matching, regulatory intelligence |
| 03 | Deliver | Supply chain, manufacturing, demand forecasting |
| 04 | Commercialize | Market access, field strategy, omnichannel engagement |
| 05 | Workforce | Role evolution, skill frameworks, augmented teams |
| 06 | Governance | Risk frameworks, compliance, ethical deployment |

Cards share borders, `›` connector between each. Hover reveals subtle gold background.

**Responsive (≤800px):** Cards stack vertically.

### Section 7: Closing CTA

**Layout:** Centered, full-width.
- Headline: "The evidence base pharma leaders need."
- Description listing buyer-focused outcomes
- Price: ~~$197~~ **$149** `LAUNCH PRICE`
- CTA button: "Get the Compendium →"
- Meta: "Secure checkout via Stripe · PDF download · Instant delivery"
- Subtle radial gold gradient behind section

### Section 8: Footer

Identical to homepage and about page footer.

---

## Homepage Changes: index.html

### Nav Update

Add "Research" link to navigation, between "Articles" and "About":
```html
<li><a href="ai-research.html">Research</a></li>
```
Same change in both desktop nav-links and mobile nav.

### Teaser Section

New section between the Articles section and the Footer. Compact — not a full sales pitch.

**Layout:** Centered text block with gold rules above and below.
- Headline (Newsreader, weight 300, ~28px): "AI in Pharma: The Definitive Research"
- One-liner: "198 pages. 63 use cases. The framework pharma leaders are using to separate AI signal from noise."
- Two buttons:
  - Ghost button: "Free Strategic Briefing →" (links to `ai-research.html#briefing`)
  - Primary button: "Get the Compendium — $149" (links to `ai-research.html#compendium`)
- Add `id="research"` to the teaser section for potential anchor linking

---

## About Page Changes: about.html

### Nav Update

Add "Research" link to navigation, between "Articles" and "About":
```html
<li><a href="ai-research.html">Research</a></li>
```

---

## Design System Compliance

All design decisions inherit from the existing Wire Service system documented in `docs/plans/2026-03-21-website-design.md`:

- **Colors:** `--black: #0a0a0a`, `--gold: #c49332`, `--white: #e8e4de`, `--gray: #6b6b6b`, `--gray-light: #999`, `--rule: rgba(196, 147, 50, 0.15)`
- **Typography:** Newsreader (display, weights 300/400/600/700/800) + DM Sans (body, weights 400/500/600)
- **Max-width:** 1400px centered
- **Responsive breakpoint:** 800px
- **Accessibility:** Skip link, ARIA labels on all sections, `:focus-visible` gold outline, `prefers-reduced-motion` disables all animations
- **Print:** Hides nav, iframes, animations

## Animations

All animations respect `prefers-reduced-motion: reduce`.

| Element | Animation | Timing |
|---------|-----------|--------|
| Hero content | Staggered fadeUp on load | 0.7s each, 0.1-0.55s delays |
| Hero scanline | Gold line traverses hero top to bottom | 8s infinite |
| Podcast waveform icon | Bars breathe (scaleY oscillation) | ~6s per bar, staggered |
| Briefing bar chart icon | Bars grow sequentially to peak | ~8s full cycle |
| Compendium doc icon | Continuous upward scroll through masked viewport | 12s linear infinite |
| Sections below fold | fadeUp on scroll (IntersectionObserver) | 0.6s, threshold 0.08 |
| Episode accordion | max-height + opacity transition | 0.4s ease |
| Buy buttons | Shimmer on hover (translateX gradient) | 0.5s |

## External Dependencies (User Action Required)

These cannot be automated and require manual setup:

1. **Stripe account** — Create product, set $149 price, generate Payment Link, upload Compendium PDF
2. **Kit (ConvertKit) account** — Create free account, upload Briefing PDF, create form + automation
3. **Spotify episode IDs** — Need the 4 specific episode IDs for "The AI Reckoning" series to wire into embed players and direct links
4. **Raise price to $197** — Manual update when ready (change button text + strikethrough price, remove "Launch Price" badge)

## Pricing Strategy

- **Launch:** $149 with ~~$197~~ strikethrough and "Launch Price" badge
- **Standard:** $197 (when social proof collected, ~5-10 buyers + testimonials)
- **Team license:** Not at launch. Can add later as second Stripe product at $497.
- **Briefing:** Free, email-gated via Kit

## Success Metrics

- Briefing downloads (Kit subscriber count with "briefing-download" tag)
- Compendium purchases (Stripe dashboard)
- Page traffic and scroll depth (GA4)
- Podcast episode plays (Spotify for Creators dashboard)
- Conversion: briefing download → Compendium purchase (cross-reference Kit + Stripe emails)
