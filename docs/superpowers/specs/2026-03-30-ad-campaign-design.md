# Multi-Channel Retargeting Ad Campaign — The Pharma Closeout

## Objective

Launch a 4-stage retargeting funnel across LinkedIn and Google to drive free briefing downloads (email capture) and paid compendium sales ($149). Supplement with GEO (Generative Engine Optimization) to earn AI search citations organically.

## Products

- **Free:** AI in Pharma Strategic Briefing (28-page PDF via Gumroad)
- **Paid:** AI in Pharma: The Definitive Compendium (169-page PDF, $149 via Gumroad/Stripe)

## Target Audience

**The Hungry Rising Star** — ambitious mid-career pharma professionals at small/mid companies who don't have consulting armies or analyst teams. $149 is personal money or a trivial expense report.

| Attribute | Spec |
|-----------|------|
| Seniority | Associate, Senior Associate, Manager, Senior Manager, Associate Director, Director |
| Functions | Commercial, Strategy, Marketing, Market Access, Medical Affairs |
| Industry | Pharmaceuticals, Biotechnology |
| Company Size | 11-200 employees |
| Geography | United States |
| Mindset | "I need to walk into that meeting with something nobody else has" |
| Estimated audience | 15,000-40,000 on LinkedIn |

## Brand Constraint

Everything brand-attributed to The Pharma Closeout. No personal branding or individual attribution.

## Budget

| Stage | Channel | Monthly Budget | Activation |
|-------|---------|---------------|------------|
| 1 | LinkedIn Document Ad | $300 | Week 1 |
| 2 | LinkedIn Retarget | $100 | Week 3-4 (audience pool 300+) |
| 3 | Google Display Network | $100 | Week 3-4 (audience pool 100+) |
| 4 | GEO (Generative Engine Optimization) | $0 | Week 1 (technical work) |
| **Total** | | **$500/mo** | |

## Infrastructure (Already Built)

- Landing page (ai-research.html) with GA4 conversion events, UTM tracking, sticky CTA, hero CTA hierarchy, social proof, comparison strip, urgency deadline
- LinkedIn Insight Tag installed on all pages (partner ID 521570287)
- LinkedIn Campaign Manager account 521570287 with payment method
- GA4 property G-K6XEWCK7W4 on all pages
- Website: thepharmacloseout.com on GitHub Pages
- Google Ads remarketing tag: NOT YET INSTALLED (deliverable #3)

## Stage 1: LinkedIn Document Ad — "The Hook" ($300/mo)

### Teaser PDF (LinkedIn-native, 5 pages, 1080x1080px)

| Page | Content | Tone |
|------|---------|------|
| 1 | "AI in Pharma: What Your Leadership Team Isn't Telling You" — TPC branding, gold/black design | Insider hook |
| 2 | "$275B in pharma revenue is at risk. AI is the only lever at scale." — one stat, source cited | Insider |
| 3 | "173 AI-discovered drug programs are now in clinical development." — second stat, visual impact | Insider |
| 4 | "The people who read this briefing will walk into the room prepared. The rest will be catching up." | Aspirational |
| 5 | "Free 28-page Strategic Briefing — Download now" — CTA page | Conversion |

Design: Wire Service aesthetic (dark background #0a0a0a, gold accent #c49332, Newsreader display font, DM Sans body). Each page is one idea, large text, maximum visual impact for in-feed scrolling.

### Ad Copy (3 variations)

**Ad A — Insider + Stat hook:**
- Intro (under 150 chars above fold): `74% of pharma companies plan agentic AI deployment.` [line break] `Most teams have no playbook for it. This free 28-page briefing is yours.`
- Headline (under 70 chars): `Free: AI in Pharma Strategic Briefing`
- CTA button: Download

**Ad B — Aspirational + Contrarian:**
- Intro: `Not every pharma team has a consulting army behind them.` [line break] `This free 28-page briefing gives you the AI strategy playbook they'd charge six figures for.`
- Headline: `The briefing your competitors are paying consultants for`
- CTA button: Download

**Ad C — Data density:**
- Intro: `173 AI drug programs in clinical development. 63 commercial use cases mapped.` [line break] `Free 28-page briefing from The Pharma Closeout.`
- Headline: `AI in pharma — the data, not the hype`
- CTA button: Download

### Copy Best Practices Applied
- All hooks under 150 characters (above LinkedIn's "see more" fold)
- One message per ad — no multi-benefit clutter
- Stats with specificity over vague claims
- "Free" in headline (power word for CTR lift)
- Line breaks for readability
- No corporate voice, no LinkedIn cliches
- No emoji (conservative for pharma audience)

### Targeting

- Seniority: Senior, Manager, Director (LinkedIn's taxonomy — "Senior" captures 5-10yr ICs including Senior Managers; "Director" captures Directors and Associate Directors; skip "Entry" as too junior for $149 purchases)
- Skills (primary lever for this audience): Pharmaceutical Industry, Biotechnology, Oncology, Drug Development, Market Access, Commercial Strategy, Medical Affairs, Pharmaceutical Marketing, Launch Strategy
- Job Function: Marketing, Business Development, Healthcare Services (supplementary — note: LinkedIn lacks native "Commercial," "Strategy," or "Market Access" job functions, so Skills targeting above is the primary filter for these roles)
- Company Industry: Pharmaceuticals, Biotechnology
- Company Size: 11-200 employees
- Geography: United States

### Bidding

Manual CPC, start at $7, adjust weekly based on CTR data.

### Success Metrics

| Metric | Target |
|--------|--------|
| CTR | >0.7% |
| CPC | <$10 |
| Document engagement rate | >5% |
| Briefing downloads/mo (paid) | 10-15 (at $300/mo and ~$10 CPC = ~30 clicks, ~40% click-to-download on Document Ad CTA) |
| Briefing downloads/mo (paid + organic) | 20-30 (organic traffic from GEO + direct supplements paid) |

## Stage 2: LinkedIn Retarget — "The Close" ($100/mo)

### Audience

Engagement retargeting: people who interacted with Stage 1 Document Ad (scrolled, clicked) OR visited thepharmacloseout.com (via Insight Tag). Minimum pool: 300 before activation.

### Format

Single Image Ad (1200x627px landscape). Wire Service design — dark background, gold accent, compendium mockup visual.

### Ad Copy (2 variations)

**Ad D — Aspirational:**
- Intro: `You read the briefing. The full Compendium goes 6x deeper.` [line break] `63 use cases. 30-question diagnostic. 180-day action framework. $149.`
- Headline: `AI in Pharma: The Definitive Compendium`
- CTA: Learn More
- URL: `thepharmacloseout.com/ai-research?utm_source=linkedin&utm_medium=cpc&utm_campaign=compendium_retarget`

**Ad E — Insider:**
- Intro: `The briefing was the overview. This is the operational playbook.` [line break] `169 pages your competitors don't have. Launch price: $149.`
- Headline: `From briefing to playbook — go deeper`
- CTA: Learn More
- URL: same with UTM

### Bidding

Manual CPC at $5 (warmer audience).

### Success Metrics

| Metric | Target |
|--------|--------|
| CTR | >1% (warm audience) |
| CPC | <$7 |
| Compendium purchases/mo | 2-3 |

## Stage 3: Google Display Network — "The Follow" ($100/mo)

### Audience

Retarget visitors to thepharmacloseout.com and Gumroad briefing/compendium pages via Google Ads remarketing tag. 30-day window. Minimum pool: 100 before activation.

### Format

Responsive Display Ads (Google auto-sizes from provided assets).

### Assets

- Headline 1 (30 chars): `AI in Pharma Compendium`
- Headline 2 (30 chars): `169 Pages. $149.`
- Long headline (90 chars): `The operational AI playbook pharma teams are using. 63 use cases. $149.`
- Description (90 chars): `Case studies, diagnostic scorecard, and frameworks built for pharma operators.`
- Images: 1200x628 (landscape) + 1200x1200 (square) — Wire Service design
- Logo: The Pharma Closeout logo
- URL: `thepharmacloseout.com/ai-research?utm_source=google&utm_medium=display&utm_campaign=compendium_retarget`

### Bidding

Manual CPC initially (audience pool too small for automated bidding to optimize). Switch to Target CPA at $30 once pool exceeds 500 visitors. Stage 2 and Stage 3 at $100/mo each are floor-level experiments — expect limited data for optimization in the first month.

### Success Metrics

| Metric | Target |
|--------|--------|
| Impressions/mo | 10,000+ |
| CTR | >0.5% (display benchmark) |
| CPA | <$40 |

## Stage 4: GEO — "The Citation Engine" ($0)

### Technical Deliverables

**1. `llms.txt` file (site root)**

Tells AI crawlers what the site is about and what content to prioritize for citation.

```
# The Pharma Closeout
> Daily pharma intelligence and original research on AI in pharmaceutical and biotechnology industries.

## Primary Content
- AI in Pharma Strategic Briefing: Free 28-page executive summary on AI adoption in pharma
- AI in Pharma Compendium: 169-page research report with 63 use cases, case studies, and the Cascade Framework
- Daily Podcast: 15-minute pharma intelligence episodes on Spotify and Apple Podcasts

## Key Topics
- AI adoption in pharmaceutical companies
- GenAI use cases in pharma commercial operations
- Drug discovery and clinical development AI
- Pharma AI maturity assessment (Cascade Framework)
- Pharmaceutical industry competitive intelligence
```

**2. `robots.txt` update**

Ensure AI crawlers are NOT blocked:

```
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /
```

**3. JSON-LD Schema Markup**

Add to all pages (ai-research.html, index.html, about.html):
- `Organization` schema for The Pharma Closeout
- `Article` schema on ai-research.html
- `FAQPage` schema on ai-research.html (for the FAQ section)

**4. FAQ Section on ai-research.html**

Add a new section with 4 stat-dense Q&As designed as citation targets. Answers should be citable but not give away the full analysis — appetizer stats that drive hunger for the briefing/compendium.

Questions:
1. "How is AI being used in pharmaceutical companies?"
2. "How many AI-discovered drugs are in clinical development?"
3. "What is the Cascade Framework for pharma AI maturity?"
4. "What are the biggest AI use cases in pharma commercial operations?"

Each answer: 2-3 sentences with specific stats, citing The Pharma Closeout's research. No deep analysis — that's in the product.

Example answer template: "As of 2026, 173 AI-discovered drug programs have entered clinical development across the pharmaceutical industry. The Pharma Closeout's research identifies three distinct waves of AI adoption — the full analysis and Cascade Framework are available in the free Strategic Briefing."

### Success Metrics

| Metric | Target | How to Measure |
|--------|--------|---------------|
| AI search citations | 5+/month | Monitor via Perplexity, ChatGPT, Claude queries |
| Organic traffic from AI referrals | Measurable in GA4 | Track referrer sources |

## Campaign Timeline

| Week | Action |
|------|--------|
| 1 | Create teaser PDF, write all ad copy, install Google Ads tag, set up Google Ads account |
| 1 | Deploy GEO technical changes (llms.txt, robots.txt, schema, FAQ section) |
| 1 | Launch Stage 1 (LinkedIn Document Ad) |
| 2 | Monitor Stage 1 performance, adjust bids |
| 3-4 | Audience pools hit thresholds, activate Stage 2 (LinkedIn Retarget) + Stage 3 (Google Display) |
| 4+ | Optimize: kill underperforming ad variations, reallocate budget to winners |
| Monthly | Refresh ad creative: retire lowest-CTR variation, replace with new hook. Teaser PDF refresh quarterly. |

## Deliverables Summary

| # | Deliverable | Type |
|---|------------|------|
| 1 | 5-page briefing teaser PDF (1080x1080 per page) | Design asset |
| 2 | Ad copy — 5 variations across stages (A, B, C, D, E) | Copy |
| 3 | Google Ads tag installation on all pages | Code |
| 4 | Google Ads account setup + campaign configuration | Platform setup |
| 5 | LinkedIn campaign configuration (Stage 1 + Stage 2) | Platform setup |
| 6 | Stage 2 retargeting image (1200x627) | Design asset |
| 7 | Stage 3 display ad images (1200x628 + 1200x1200) | Design asset |
| 8 | `llms.txt` file | Code |
| 9 | `robots.txt` update | Code |
| 10 | JSON-LD schema markup on all pages | Code |
| 11 | FAQ section on ai-research.html | Code + Copy |

## Out of Scope

- Email nurture sequence (separate spec)
- Organic LinkedIn posting / content calendar
- Personal branding or individual attribution
- Paid AI search placement (ChatGPT ads $200K min, Perplexity killed ad program)
- Google Search Ads (traditional paid search — replaced by GEO)

## All Work Saved To

`C:\Users\xadro\OneDrive\Documents\documents\AI Projects\BZG\Marketing\`
