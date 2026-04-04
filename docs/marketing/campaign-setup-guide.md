# The Pharma Closeout — Campaign Setup Guide

## Prerequisites

- [ ] LinkedIn Campaign Manager account 521570287 (created, payment added)
- [ ] LinkedIn Insight Tag installed on all pages (partner ID 521570287) — DONE
- [x] Teaser briefing PDF created (teaser-briefing.pdf) — 5-page, 1080×1350px (4:5 portrait), DONE
- [x] Ad images created — DONE: ad-retarget-1200x627.png, ad-display-1200x628.png, ad-display-1200x1200.png
- [ ] Google Ads account created + remarketing tag installed
- [ ] GEO technical changes deployed (llms.txt, robots.txt, schema, FAQ) — DONE

---

## LinkedIn Campaign Manager Setup

### Step 1: Create Campaign Group

1. Go to https://www.linkedin.com/campaignmanager/accounts/521570287/
2. Click "Create" → "Campaign Group"
3. Name: **"The Pharma Closeout — Lead Gen"**
4. Budget: Set total budget to $400/mo (covers Stage 1 + Stage 2)
5. Schedule: Start date = today, no end date
6. Save

### Step 2: Create Campaign 1 — Briefing Document Ad (Stage 1)

1. Inside the campaign group, click "Create Campaign"
2. **Objective:** Website visits
3. **Format:** Document Ad
4. **Budget & Schedule:**
   - Daily budget: $10
   - Schedule: Start immediately, run continuously
   - Bidding strategy: Manual CPC
   - Bid: $7.00
5. **Targeting:**
   - Location: United States
   - Click "Audience attributes"
   - Seniority: Senior, Manager, Director
   - Member Skills (ADD ALL): Pharmaceutical Industry, Biotechnology, Oncology, Drug Development, Market Access, Commercial Strategy, Medical Affairs, Pharmaceutical Marketing, Launch Strategy
   - Job Function: Marketing, Business Development, Healthcare Services
   - Company Industry: Pharmaceuticals, Biotechnology
   - Company Size: 11-200 employees
   - Verify estimated audience size: should be 10,000-40,000
6. **Ads:** Create 3 ads using copy from ad-copy.md:
   - For each ad: upload teaser-briefing.pdf as the document
   - Enter the intro text, headline, and destination URL from ad-copy.md (Ads A, B, C)
   - CTA button: "Download"
7. **Review & Launch**

### Step 3: Create Retargeting Audiences

Before creating Campaign 2, set up the audiences it will target:

**Audience 1: Document Ad Engagers**
1. Go to Plan → Audiences → Create audience
2. Type: Retargeting → "People who engaged with your ad"
3. Source: Select Campaign 1 (Briefing Document Ad)
4. Engagement type: All engagement (opens, clicks, shares)
5. Lookback: 90 days
6. Name: "Document Ad Engagers"
7. Save

**Audience 2: Website Visitors**
1. Go to Plan → Audiences → Create audience
2. Type: Retargeting → "Website visitors"
3. Source: LinkedIn Insight Tag
4. URL match: All pages (thepharmacloseout.com)
5. Lookback: 90 days
6. Name: "Website Visitors"
7. Save

### Step 4: Create Campaign 2 — Compendium Retarget (Stage 2)

**Wait until retargeting audience reaches 300+ members (approximately week 3-4).**

1. Inside the campaign group, click "Create Campaign"
2. **Objective:** Website visits
3. **Format:** Single Image Ad
4. **Budget & Schedule:**
   - Daily budget: $3.33
   - Schedule: Start when audience is ready
   - Bidding strategy: Manual CPC
   - Bid: $5.00
5. **Targeting:**
   - Audiences: Select "Document Ad Engagers" OR "Website Visitors"
   - No other targeting filters needed (audience is already qualified)
6. **Ads:** Create 2 ads using copy from ad-copy.md:
   - Upload ad-retarget-1200x627.png as the image
   - Enter intro text, headline, and URL from ad-copy.md (Ads D, E)
   - CTA button: "Learn More"
7. **Review & Launch**

---

## Google Ads Setup

### Step 1: Create Google Ads Account

1. Go to https://ads.google.com
2. Click "Start now"
3. Choose "Switch to Expert Mode" (skip the guided setup)
4. Create account without a campaign first
5. Set billing country: United States, currency: USD
6. Add payment method (credit card)
7. Note your Conversion ID (format: AW-XXXXXXXXX) from:
   Settings → Measurement → Google Tag

### Step 2: Link GA4

1. In Google Ads: Tools → Linked accounts → Google Analytics (GA4)
2. Link property G-K6XEWCK7W4
3. Import conversions: compendium_click_main, compendium_click_close

### Step 3: Install Google Ads Tag

**After getting the Conversion ID, update the website code:**

In ai-research.html, index.html, and about.html, find this line:
```javascript
gtag('config', 'G-K6XEWCK7W4');
```

Add directly after it:
```javascript
gtag('config', 'AW-XXXXXXXXX'); // Replace with your actual Conversion ID
```

Commit and push to deploy.

### Step 4: Create Remarketing Audience

1. In Google Ads: Tools → Audience manager → Your data segments
2. Create segment: Website visitors
3. Source: Google Ads tag
4. Segment members: Visitors of a page — URL contains "thepharmacloseout.com"
5. Lookback: 30 days
6. Name: "All Site Visitors"
7. Save

### Step 5: Create Display Campaign (Stage 3)

**Wait until remarketing audience reaches 100+ members (approximately week 3-4).**

1. Click "+ New Campaign"
2. Goal: Sales
3. Campaign type: Display
4. Campaign name: "TPC — Compendium Retarget"
5. **Budget:** $3.33/day
6. **Bidding:** Manual CPC (switch to Target CPA $30 when audience > 500)
7. **Targeting:**
   - Audiences: Select "All Site Visitors" remarketing segment
   - Content exclusions: Sensitive content, parked domains
8. **Ads:** Create Responsive Display Ad
   - Headlines: from ad-copy.md (3 headlines)
   - Long headline: from ad-copy.md
   - Descriptions: from ad-copy.md (2 descriptions)
   - Images: upload ad-display-1200x628.png + ad-display-1200x1200.png
   - Logo: The Pharma Closeout logo
   - Final URL: from ad-copy.md
9. **Review & Launch** (or save as draft until audience is ready)

---

## Monitoring Cadence

| When | What | Where |
|------|------|-------|
| Daily (first 2 weeks) | Check spend pacing, impressions, CTR | LinkedIn Campaign Manager + Google Ads |
| Weekly | Compare ad variations A/B/C, adjust bids | LinkedIn Campaign Manager |
| Weekly | Check retargeting audience sizes | Both platforms → Audiences |
| Bi-weekly | Review GA4 conversion events | GA4 → Reports → Events |
| Monthly | Full funnel review: spend → clicks → downloads → purchases | All platforms + Gumroad dashboard |
| Monthly | Refresh ad creative: retire lowest-CTR variation, create new hook | LinkedIn Campaign Manager |
| Quarterly | Refresh teaser PDF | Design asset update |

## Key Metrics to Track

| Metric | Target | Platform |
|--------|--------|----------|
| Stage 1 CTR | >0.7% | LinkedIn |
| Stage 1 CPC | <$10 | LinkedIn |
| Stage 1 engagement rate | >5% | LinkedIn |
| Briefing downloads (paid) | 10-15/mo | Gumroad |
| Stage 2 CTR | >1% | LinkedIn |
| Compendium purchases | 2-3/mo | Gumroad/Stripe |
| Stage 3 CTR | >0.5% | Google Ads |
| Overall ROAS | >2x | Calculated: (purchases × $149) / $500 |
| Break-even | 4 purchases/mo | $596 revenue / $500 spend |
