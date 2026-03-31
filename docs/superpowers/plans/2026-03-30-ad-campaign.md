# Multi-Channel Ad Campaign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Launch a 4-stage retargeting ad funnel across LinkedIn and Google, plus GEO technical optimization for AI search citations, to drive briefing downloads and compendium sales for The Pharma Closeout.

**Architecture:** Two workstreams executed in parallel — (A) code/technical changes to the website deployed via git push to GitHub Pages, and (B) creative assets + platform campaign setup. Code tasks are prerequisites for platform tasks. All work saved to both the repo and `C:\Users\xadro\OneDrive\Documents\documents\AI Projects\BZG\Marketing\`.

**Tech Stack:** HTML/CSS/JS (inline, no build tools), GitHub Pages hosting, GA4 (gtag.js), LinkedIn Campaign Manager, Google Ads, JSON-LD schema

**Spec:** `docs/superpowers/specs/2026-03-30-ad-campaign-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `llms.txt` | Create | Tell AI crawlers what the site is about |
| `robots.txt` | Create | Allow AI crawlers access |
| `ai-research.html` | Modify | Google Ads tag, JSON-LD schema, FAQ section |
| `index.html` | Modify | Google Ads tag, JSON-LD Organization schema |
| `about.html` | Modify | Google Ads tag, JSON-LD Organization schema |
| `Marketing/teaser-briefing.html` | Create | 5-page LinkedIn-native teaser PDF source (render to PDF) |
| `Marketing/ad-copy.md` | Create | All 5 ad copy variations documented |
| `Marketing/campaign-setup-guide.md` | Create | Step-by-step LinkedIn + Google campaign config |

---

### Task 1: Create `llms.txt`

**Files:**
- Create: `llms.txt` (site root)

- [ ] **Step 1: Create the file**

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

## URLs
- Homepage: https://thepharmacloseout.com/
- AI Research: https://thepharmacloseout.com/ai-research
- About: https://thepharmacloseout.com/about
- Free Briefing: https://thepharmacloseout.gumroad.com/l/briefing
- Compendium: https://thepharmacloseout.gumroad.com/l/compendium
- Podcast: https://open.spotify.com/show/6bib0887ucySx51e49M3tp
- Newsletter: https://thepharmacloseout.substack.com/
```

- [ ] **Step 2: Verify file is accessible**

Open `https://thepharmacloseout.com/llms.txt` after deploy.

- [ ] **Step 3: Commit**

```bash
git add llms.txt
git commit -m "feat: add llms.txt for AI crawler discovery"
```

---

### Task 2: Create `robots.txt`

**Files:**
- Create: `robots.txt` (site root)

- [ ] **Step 1: Create the file**

```
User-agent: *
Allow: /

# AI Crawlers — explicitly allowed
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: https://thepharmacloseout.com/sitemap.xml
```

- [ ] **Step 2: Commit**

```bash
git add robots.txt
git commit -m "feat: add robots.txt allowing AI crawlers"
```

---

### Task 3: Add JSON-LD Schema Markup

**Files:**
- Modify: `ai-research.html` (add schema in `<head>` after LinkedIn Insight Tag, ~line 27)
- Modify: `index.html` (add Organization schema in `<head>`)
- Modify: `about.html` (add Organization schema in `<head>`)

- [ ] **Step 1: Add Organization + Article + FAQPage schema to ai-research.html**

Insert after the closing `</noscript>` of the LinkedIn Insight Tag (around line 27):

```html
<!-- JSON-LD Schema -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "name": "The Pharma Closeout",
      "url": "https://thepharmacloseout.com",
      "description": "Daily pharma intelligence and original research on AI in pharmaceutical and biotechnology industries.",
      "sameAs": [
        "https://open.spotify.com/show/6bib0887ucySx51e49M3tp",
        "https://thepharmacloseout.substack.com/"
      ]
    },
    {
      "@type": "Article",
      "headline": "The AI Reckoning: AI in Pharma Research",
      "description": "Original research on AI adoption in pharmaceutical companies. 63 use cases, case studies, the Cascade Framework, and a 180-day action roadmap.",
      "author": {
        "@type": "Organization",
        "name": "The Pharma Closeout"
      },
      "publisher": {
        "@type": "Organization",
        "name": "The Pharma Closeout"
      },
      "datePublished": "2026-03-29",
      "dateModified": "2026-03-30",
      "mainEntityOfPage": "https://thepharmacloseout.com/ai-research"
    }
  ]
}
</script>
```

Note: The FAQPage schema will be added in Task 4 alongside the FAQ HTML.

- [ ] **Step 2: Add Organization schema to index.html**

Insert after the closing `</noscript>` of the LinkedIn Insight Tag:

```html
<!-- JSON-LD Schema -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "The Pharma Closeout",
  "url": "https://thepharmacloseout.com",
  "description": "Daily pharma intelligence and original research on AI in pharmaceutical and biotechnology industries.",
  "sameAs": [
    "https://open.spotify.com/show/6bib0887ucySx51e49M3tp",
    "https://thepharmacloseout.substack.com/"
  ]
}
</script>
```

- [ ] **Step 3: Add Organization schema to about.html**

Same schema as index.html, inserted in the same location.

- [ ] **Step 4: Validate schema**

Open `https://validator.schema.org/` and paste the page URL after deploy. Verify no errors.

- [ ] **Step 5: Commit**

```bash
git add ai-research.html index.html about.html
git commit -m "feat: add JSON-LD schema markup for AI search citation"
```

---

### Task 4: Add FAQ Section + FAQPage Schema to ai-research.html

**Files:**
- Modify: `ai-research.html` — add CSS, HTML section, and FAQPage JSON-LD

- [ ] **Step 1: Add FAQ CSS**

Add to the `<style>` block:

```css
/* ── FAQ ── */
.faq-list { margin-top: 2rem; }
.faq-item {
  border-bottom: 1px solid var(--rule);
  padding: 1.5rem 0;
}
.faq-q {
  font-family: var(--font-display); font-size: 1.1rem;
  font-weight: 600; color: var(--white); margin-bottom: 0.75rem;
}
.faq-a {
  font-size: 0.9rem; color: var(--gray-light); line-height: 1.7;
}
.faq-a a { color: var(--gold); text-decoration: underline; }
```

- [ ] **Step 2: Add FAQ HTML section**

Insert BETWEEN the closing CTA section (`</section>` around line 1472) and the footer comment (`<!-- ── FOOTER ──>` at line 1474):

```html
<!-- ══════════════════════════════════════════════
     SECTION 7: FAQ — Citation targets for AI search
     ══════════════════════════════════════════════ -->
<section class="section reveal" id="faq" aria-label="Frequently Asked Questions" style="padding-top: 5rem; padding-bottom: 5rem;">
  <div class="section-label">Frequently Asked Questions</div>
  <h2 style="font-family: var(--font-display); font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 300;">AI in Pharma: What You Need to Know</h2>
  <div class="faq-list">
    <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
      <div class="faq-q" itemprop="name">How is AI being used in pharmaceutical companies?</div>
      <div class="faq-a" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
        <div itemprop="text">AI is being deployed across the full pharmaceutical value chain — from drug discovery and clinical trial optimization to commercial operations and market access. The Pharma Closeout's research maps 63 distinct GenAI use cases across six domains. The full mapping and implementation evidence is available in the <a href="https://thepharmacloseout.gumroad.com/l/briefing" target="_blank" rel="noopener">free Strategic Briefing</a>.</div>
      </div>
    </div>
    <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
      <div class="faq-q" itemprop="name">How many AI-discovered drugs are in clinical development?</div>
      <div class="faq-a" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
        <div itemprop="text">As of 2026, 173 AI-discovered drug programs have entered clinical development across the pharmaceutical industry. This represents a significant acceleration from fewer than 50 programs three years ago. The Pharma Closeout's research tracks three distinct waves of AI adoption driving this growth.</div>
      </div>
    </div>
    <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
      <div class="faq-q" itemprop="name">What is the Cascade Framework for pharma AI maturity?</div>
      <div class="faq-a" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
        <div itemprop="text">The Cascade Framework is a 6-link AI maturity model developed by The Pharma Closeout that maps value creation across the entire pharma value chain: Discover, Develop, Deliver, Commercialize, Workforce, and Governance. It powers a 30-question diagnostic scorecard for benchmarking organizational AI readiness. The full framework and scorecard are detailed in the <a href="https://thepharmacloseout.gumroad.com/l/compendium" target="_blank" rel="noopener">Definitive Compendium</a>.</div>
      </div>
    </div>
    <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
      <div class="faq-q" itemprop="name">What are the biggest AI use cases in pharma commercial operations?</div>
      <div class="faq-a" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
        <div itemprop="text">The highest-impact commercial AI use cases in pharma include AI-driven HCP engagement, omnichannel orchestration, market access optimization, and competitive intelligence automation. The Pharma Closeout's research identifies 63 use cases across discovery, trials, operations, and commercial functions — with implementation evidence for each.</div>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Add FAQPage JSON-LD schema**

Add a second `<script type="application/ld+json">` block in the `<head>`, after the existing Article schema:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How is AI being used in pharmaceutical companies?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "AI is being deployed across the full pharmaceutical value chain — from drug discovery and clinical trial optimization to commercial operations and market access. The Pharma Closeout's research maps 63 distinct GenAI use cases across six domains."
      }
    },
    {
      "@type": "Question",
      "name": "How many AI-discovered drugs are in clinical development?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "As of 2026, 173 AI-discovered drug programs have entered clinical development across the pharmaceutical industry. This represents a significant acceleration from fewer than 50 programs three years ago."
      }
    },
    {
      "@type": "Question",
      "name": "What is the Cascade Framework for pharma AI maturity?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The Cascade Framework is a 6-link AI maturity model developed by The Pharma Closeout that maps value creation across the entire pharma value chain: Discover, Develop, Deliver, Commercialize, Workforce, and Governance. It powers a 30-question diagnostic scorecard for benchmarking organizational AI readiness."
      }
    },
    {
      "@type": "Question",
      "name": "What are the biggest AI use cases in pharma commercial operations?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The highest-impact commercial AI use cases in pharma include AI-driven HCP engagement, omnichannel orchestration, market access optimization, and competitive intelligence automation. The Pharma Closeout's research identifies 63 use cases across discovery, trials, operations, and commercial functions."
      }
    }
  ]
}
</script>
```

- [ ] **Step 4: Commit**

```bash
git add ai-research.html
git commit -m "feat: add FAQ section with citation-target answers and FAQPage schema"
```

---

### Task 5: Install Google Ads Remarketing Tag

**Files:**
- Modify: `ai-research.html` (add tag in `<head>`)
- Modify: `index.html` (add tag in `<head>`)
- Modify: `about.html` (add tag in `<head>`)

**Prerequisite:** User must create a Google Ads account and provide the Conversion ID (format: `AW-XXXXXXXXX`). The tag cannot be installed without this ID.

- [ ] **Step 1: User creates Google Ads account**

Navigate to `ads.google.com`, create account linked to GA4 property G-K6XEWCK7W4. Note the Conversion ID from Settings → Measurement → Google Tag.

- [ ] **Step 2: Add Google Ads gtag to all 3 pages**

Insert after the existing GA4 config line (`gtag('config', 'G-K6XEWCK7W4');`) in each file:

```javascript
  gtag('config', 'AW-XXXXXXXXX'); // Replace with actual Conversion ID
```

This piggybacks on the existing gtag.js loader — no additional script tag needed.

- [ ] **Step 3: Verify tag fires**

Open any page → DevTools → Network → filter by "googleads". Should see a request to `googleads.g.doubleclick.net`.

- [ ] **Step 4: Commit**

```bash
git add ai-research.html index.html about.html
git commit -m "feat: add Google Ads remarketing tag for retargeting"
```

- [ ] **Step 5: Push all code changes**

```bash
git push origin main
```

---

### Task 6: Create Teaser Briefing PDF (5 pages, 1080x1080)

**Files:**
- Create: `C:\Users\xadro\OneDrive\Documents\documents\AI Projects\BZG\Marketing\teaser-briefing.html` (source for PDF render)
- Output: `C:\Users\xadro\OneDrive\Documents\documents\AI Projects\BZG\Marketing\teaser-briefing.pdf`

- [ ] **Step 1: Build the 5-page HTML**

Create an HTML file with 5 pages, each 1080x1080px. Use the `frontend-design` skill. Design system:
- Background: #0a0a0a
- Gold accent: #c49332
- Display font: Newsreader
- Body font: DM Sans
- One idea per page, large text, maximum visual impact

Page content (from spec):

| Page | Content |
|------|---------|
| 1 | "AI in Pharma: What Your Leadership Team Isn't Telling You" — TPC logo, branding |
| 2 | "$275B in pharma revenue is at risk. AI is the only lever at scale." |
| 3 | "173 AI-discovered drug programs are now in clinical development." |
| 4 | "The people who read this briefing will walk into the room prepared. The rest will be catching up." |
| 5 | "Free 28-page Strategic Briefing" — CTA with thepharmacloseout.com URL |

- [ ] **Step 2: Render to PDF**

Use the browser print-to-PDF or a rendering tool to create a 5-page 1080x1080 PDF.

```bash
npx pagedjs-cli teaser-briefing.html -o teaser-briefing.pdf
```

Or export from browser as PDF with custom page size 1080x1080px.

- [ ] **Step 3: Verify PDF**

Open the PDF. Each page should be square (1080x1080), readable when scaled to LinkedIn's document preview size (~600px wide in feed), with one clear message per page.

---

### Task 7: Create Ad Images for Stage 2 + Stage 3

**Files:**
- Output: `C:\Users\xadro\OneDrive\Documents\documents\AI Projects\BZG\Marketing\ad-retarget-1200x627.png`
- Output: `C:\Users\xadro\OneDrive\Documents\documents\AI Projects\BZG\Marketing\ad-display-1200x628.png`
- Output: `C:\Users\xadro\OneDrive\Documents\documents\AI Projects\BZG\Marketing\ad-display-1200x1200.png`

- [ ] **Step 1: Build retarget ad image (1200x627)**

Use the `frontend-design` skill to create an HTML template at 1200x627px. Content:
- Dark background (#0a0a0a), gold accent
- "AI in Pharma: The Definitive Compendium" — headline
- "169 Pages · 63 Use Cases · $149" — subline
- Mock compendium document visual (reuse the existing mock-doc SVG pattern from ai-research.html)
- The Pharma Closeout branding

Export as PNG.

- [ ] **Step 2: Build display ad images (1200x628 + 1200x1200)**

Same design adapted to two sizes for Google Responsive Display Ads:
- Landscape: 1200x628 (nearly identical to the LinkedIn retarget image)
- Square: 1200x1200 (rearranged layout for square format)

Export both as PNG.

- [ ] **Step 3: Verify image quality**

Check each image at actual size. Text should be readable. No blurriness. Brand colors correct.

---

### Task 8: Document All Ad Copy

**Files:**
- Create: `C:\Users\xadro\OneDrive\Documents\documents\AI Projects\BZG\Marketing\ad-copy.md`

- [ ] **Step 1: Write the ad copy document**

Document all 5 ad variations with exact copy, character counts, targeting, and UTM URLs:

```markdown
# The Pharma Closeout — Ad Copy Variations

## Stage 1: LinkedIn Document Ad (Cold — Free Briefing)

### Ad A — Insider + Stat hook
- **Intro:** 74% of pharma companies plan agentic AI deployment.
  Most teams have no playbook for it. This free 28-page briefing is yours.
- **Headline:** Free: AI in Pharma Strategic Briefing
- **CTA:** Download
- **Link:** https://thepharmacloseout.gumroad.com/l/briefing?utm_source=linkedin&utm_medium=cpc&utm_campaign=briefing_insider

### Ad B — Aspirational + Contrarian
- **Intro:** Not every pharma team has a consulting army behind them.
  This free 28-page briefing gives you the AI strategy playbook they'd charge six figures for.
- **Headline:** The briefing your competitors are paying consultants for
- **CTA:** Download
- **Link:** https://thepharmacloseout.gumroad.com/l/briefing?utm_source=linkedin&utm_medium=cpc&utm_campaign=briefing_aspirational

### Ad C — Data density
- **Intro:** 173 AI drug programs in clinical development. 63 commercial use cases mapped.
  Free 28-page briefing from The Pharma Closeout.
- **Headline:** AI in pharma — the data, not the hype
- **CTA:** Download
- **Link:** https://thepharmacloseout.gumroad.com/l/briefing?utm_source=linkedin&utm_medium=cpc&utm_campaign=briefing_data

## Stage 2: LinkedIn Retarget (Warm — Compendium)

### Ad D — Aspirational
- **Intro:** You read the briefing. The full Compendium goes 6x deeper.
  63 use cases. 30-question diagnostic. 180-day action framework. $149.
- **Headline:** AI in Pharma: The Definitive Compendium
- **CTA:** Learn More
- **Link:** https://thepharmacloseout.com/ai-research?utm_source=linkedin&utm_medium=cpc&utm_campaign=compendium_retarget

### Ad E — Insider
- **Intro:** The briefing was the overview. This is the operational playbook.
  169 pages your competitors don't have. Launch price: $149.
- **Headline:** From briefing to playbook — go deeper
- **CTA:** Learn More
- **Link:** https://thepharmacloseout.com/ai-research?utm_source=linkedin&utm_medium=cpc&utm_campaign=compendium_insider

## Stage 3: Google Display (Retarget — Compendium)

### Responsive Display Ad
- **Headline 1:** AI in Pharma Compendium
- **Headline 2:** 169 Pages. $149.
- **Long headline:** The operational AI playbook pharma teams are using. 63 use cases. $149.
- **Description:** Case studies, diagnostic scorecard, and frameworks built for pharma operators.
- **Link:** https://thepharmacloseout.com/ai-research?utm_source=google&utm_medium=display&utm_campaign=compendium_retarget
```

---

### Task 9: Create Campaign Setup Guide

**Files:**
- Create: `C:\Users\xadro\OneDrive\Documents\documents\AI Projects\BZG\Marketing\campaign-setup-guide.md`

- [ ] **Step 1: Write LinkedIn Campaign Manager setup instructions**

```markdown
# Campaign Setup Guide

## LinkedIn Campaign Manager (Account 521570287)

### Campaign Group
- Name: "The Pharma Closeout — Lead Gen"

### Campaign 1: Briefing Document Ad (Stage 1)
- Objective: Website visits
- Format: Document Ad
- Upload: teaser-briefing.pdf
- Budget: $10/day ($300/mo)
- Schedule: Start immediately, run continuously
- Bidding: Manual CPC, $7.00

**Targeting:**
- Location: United States
- Seniority: Senior, Manager, Director
- Skills: Pharmaceutical Industry, Biotechnology, Oncology, Drug Development, Market Access, Commercial Strategy, Medical Affairs, Pharmaceutical Marketing, Launch Strategy
- Job Function: Marketing, Business Development, Healthcare Services
- Company Industry: Pharmaceuticals, Biotechnology
- Company Size: 11-200 employees

**Ads:** Create 3 ads (A, B, C) using copy from ad-copy.md. Upload teaser-briefing.pdf as the document for all 3. Each ad uses different intro text and headline.

### Campaign 2: Compendium Retarget (Stage 2)
- Objective: Website visits
- Format: Single Image Ad
- Image: ad-retarget-1200x627.png
- Budget: $3.33/day ($100/mo)
- Schedule: Activate when retarget audience reaches 300+
- Bidding: Manual CPC, $5.00

**Targeting:**
- Matched Audience: "Document Ad Engagers" (create from Campaign 1 engagement)
- OR Matched Audience: "Website Visitors" (from Insight Tag)

**Ads:** Create 2 ads (D, E) using copy from ad-copy.md.

## Google Ads

### Account Setup
1. Go to ads.google.com
2. Create account, link to GA4 property G-K6XEWCK7W4
3. Note Conversion ID (AW-XXXXXXXXX)
4. Import GA4 conversions (compendium_click_main, compendium_click_close)

### Campaign: Display Retarget (Stage 3)
- Type: Display
- Goal: Sales
- Budget: $3.33/day ($100/mo)
- Bidding: Manual CPC initially, switch to Target CPA ($30) when audience > 500

**Audience:**
- Create remarketing audience: "All visitors" from Google Ads tag
- Lookback window: 30 days

**Ads:** Responsive Display Ad
- Headlines, descriptions from ad-copy.md
- Images: ad-display-1200x628.png + ad-display-1200x1200.png
- Logo: The Pharma Closeout logo
```

---

### Task 10: Push Code + Deploy

**Files:**
- All modified files from Tasks 1-5

- [ ] **Step 1: Final git status check**

```bash
cd C:/Users/xadro/the-pharma-closeout
git status
```

Verify only expected files are modified/created: `llms.txt`, `robots.txt`, `ai-research.html`, `index.html`, `about.html`.

- [ ] **Step 2: Push to GitHub Pages**

```bash
git push origin main
```

- [ ] **Step 3: Verify live site**

After ~60 seconds, check:
- `https://thepharmacloseout.com/llms.txt` — should return the llms.txt content
- `https://thepharmacloseout.com/robots.txt` — should show AI crawler rules
- `https://thepharmacloseout.com/ai-research` — scroll to bottom, verify FAQ section visible
- View page source on ai-research.html — verify JSON-LD schema blocks present

- [ ] **Step 4: Copy all deliverables to Marketing folder**

```bash
cp docs/superpowers/specs/2026-03-30-ad-campaign-design.md "C:/Users/xadro/OneDrive/Documents/documents/AI Projects/BZG/Marketing/"
cp docs/superpowers/plans/2026-03-30-ad-campaign.md "C:/Users/xadro/OneDrive/Documents/documents/AI Projects/BZG/Marketing/"
```

---

### Task 11: Launch Stage 1 Campaign (LinkedIn)

**Prerequisite:** Tasks 6 (teaser PDF) and 10 (code deployed) must be complete.

**Platform:** LinkedIn Campaign Manager (browser-based, requires user interaction for payment authorization)

- [ ] **Step 1: Create Campaign Group**

In LinkedIn Campaign Manager → Create → Campaign Group
- Name: "The Pharma Closeout — Lead Gen"

- [ ] **Step 2: Create Campaign 1 (Document Ad)**

Follow campaign-setup-guide.md, Campaign 1 section. Upload teaser-briefing.pdf, set targeting, create 3 ad variations (A, B, C).

- [ ] **Step 3: Set up engagement retargeting audience**

In Campaign Manager → Plan → Audiences → Create Audience
- Type: Engagement → Document Ad engagement
- Source: Campaign 1
- Name: "Document Ad Engagers"
- This audience auto-populates as people interact with Stage 1.

- [ ] **Step 4: Launch campaign**

Review all settings. Click "Launch Campaign." Verify ads enter "In Review" status (LinkedIn reviews within 24 hours).

---

### Task 12: Set Up Google Ads Account + Stage 3 (Deferred to Week 3-4)

**Prerequisite:** Tasks 5 (Google Ads tag) and 7 (display images) must be complete. Audience pool must reach 100+.

- [ ] **Step 1: Create Google Ads account at ads.google.com**

Link to GA4 property. Add payment method. Note Conversion ID.

- [ ] **Step 2: Update Google Ads tag in code**

Replace `AW-XXXXXXXXX` placeholder in all 3 HTML files with the actual Conversion ID. Commit and push.

- [ ] **Step 3: Import GA4 conversions**

In Google Ads → Goals → Conversions → Import → Google Analytics. Select `compendium_click_main` and `compendium_click_close`.

- [ ] **Step 4: Create Display Retarget campaign**

Follow campaign-setup-guide.md, Google Ads section. Upload images, set copy, configure remarketing audience.

- [ ] **Step 5: Launch when audience pool hits 100+**

Monitor audience size in Google Ads → Audiences. Activate campaign when retargeting pool is large enough to deliver.
