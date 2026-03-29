# AI Research Product Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a funnel-structured research product page to thepharmacloseout.com with Stripe payment for the Compendium, Kit email capture for the Briefing, and embedded podcast players.

**Architecture:** Pure HTML/CSS/JS on GitHub Pages (no framework, no build step). One new HTML file (`ai-research.html`), two edits to existing pages (`index.html`, `about.html`). Payment via Stripe Payment Links. Email capture via Kit (ConvertKit). All external service URLs centralized in a config block in the page's `<script>` section for easy wiring.

**Tech Stack:** HTML5, CSS3 (custom properties, grid, keyframe animations, IntersectionObserver), vanilla JS, Stripe Payment Links, Kit (ConvertKit) embedded form, Spotify embed API.

**Spec:** `docs/superpowers/specs/2026-03-29-ai-research-product-page-design.md`
**Mockup (source of truth for all CSS/HTML):** `.superpowers/brainstorm/1264-1774766118/ai-research-v2.html`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| CREATE | `ai-research.html` | Full product page (~700 lines). All CSS inline, all JS inline. Self-contained. |
| EDIT | `index.html:470-475` | Add "Research" nav link |
| EDIT | `index.html:534-536` | Add teaser section between `</main>` and `<footer>` |
| EDIT | `about.html:336-341` | Add "Research" nav link |

---

### Task 1: Create ai-research.html — Document skeleton + Config block

**Files:**
- Create: `ai-research.html`

This task creates the full file with the document skeleton: `<head>`, meta tags, Google Analytics, font imports, nav, footer, and the config block. No page-specific CSS or content sections yet.

- [ ] **Step 1: Create the file with head, GA, fonts, nav, footer, and config block**

Copy the `<head>` structure from `index.html` (GA tag, meta viewport, title, OG tags, font import). Update title to "The AI Reckoning — The Pharma Closeout" and OG tags accordingly.

Add the config block as the first `<script>` in the page:

```javascript
/* ── CONFIG: Wire external URLs here after manual setup ── */
var CONFIG = {
  stripePaymentLink: '#', // Replace with Stripe Payment Link URL
  kitFormAction: '#',     // Replace with Kit form action URL
  spotifyEpisodes: {
    ep1: { embedId: '6bib0887ucySx51e49M3tp', linkId: '6bib0887ucySx51e49M3tp' }, // Replace with real episode IDs
    ep2: { embedId: '6bib0887ucySx51e49M3tp', linkId: '6bib0887ucySx51e49M3tp' },
    ep3: { embedId: '6bib0887ucySx51e49M3tp', linkId: '6bib0887ucySx51e49M3tp' },
    ep4: { embedId: '6bib0887ucySx51e49M3tp', linkId: '6bib0887ucySx51e49M3tp' }
  }
};
```

Note: Placeholders use the general show ID so embeds render (not broken) until real episode IDs are wired in.

Nav structure — identical to homepage but with "Research" added and active:

```html
<ul class="nav-links">
  <li><a href="index.html#podcast">Podcast</a></li>
  <li><a href="index.html#articles">Articles</a></li>
  <li><a href="ai-research.html" class="active">Research</a></li>
  <li><a href="about.html">About</a></li>
  <li><a href="https://www.linkedin.com/company/the-pharma-closeout" target="_blank" rel="noopener">LinkedIn</a></li>
</ul>
```

Footer — identical to homepage. Copy from `index.html:537-552`.

Include: skip link, noscript fallback, mobile nav toggle button + JS, `prefers-reduced-motion` media query.

- [ ] **Step 2: Verify the page loads in browser**

Open `ai-research.html` locally. Confirm: nav renders, footer renders, no console errors, GA tag fires.

- [ ] **Step 3: Commit**

```bash
git add ai-research.html
git commit -m "feat: add ai-research.html skeleton with nav, footer, and config block"
```

---

### Task 2: ai-research.html — CSS foundation

**Files:**
- Modify: `ai-research.html`

Add all CSS inside the `<style>` block. The mockup file (`.superpowers/brainstorm/1264-1774766118/ai-research-v2.html`) is the **source of truth** — copy CSS from it directly. This includes:

- [ ] **Step 1: Add CSS variables and base styles**

Copy `:root` variables, `*` reset, `html`, `body`, `a` styles from mockup lines 9-33. These match homepage exactly.

- [ ] **Step 2: Add nav CSS**

Copy nav styles from mockup lines 35-78. Includes `.nav-inner`, `.logo`, `.nav-links`, `.nav-toggle`, hamburger animation.

- [ ] **Step 3: Add shared component CSS**

Copy `.section`, `.gold-rule`, `.section-label` from mockup lines 80-93.

- [ ] **Step 4: Add hero CSS**

Copy `.hero-compact` styles from mockup. Includes: padding, radial gradient `::before`, scanline `::after` with `@keyframes scanline`, `h1` styles, `.hero-tagline`, hero offerings grid, offering cards, offering images, mock-doc previews, all three icon animations (`@keyframes waveBreathe`, `@keyframes barSlowGrow`, `@keyframes docContinuousScroll`), price line styles.

- [ ] **Step 5: Add content section CSS**

Copy from mockup: `.podcast-series`, `.episode-card`, `.ep-header`, `.ep-number`, `.ep-info`, `.ep-title`, `.ep-subtitle`, `.ep-duration`, `.ep-toggle`, `.ep-player` (accordion expand/collapse), `.briefing` (layout, copy, form, form-field, form-submit), `.compendium` (headline, value-grid, value-card, inside-grid, inside-part, price-block, price-display, price-badge, btn-primary with shimmer), `.cascade` (chain, link, connectors), `.closing` (centered CTA with radial gradient).

- [ ] **Step 6: Add footer CSS**

Copy footer styles from mockup. Match homepage.

- [ ] **Step 7: Add utility CSS**

Copy: `.reveal` (scroll reveal), `:focus-visible`, `.skip-link`, `@media (prefers-reduced-motion)`, `@media print`, responsive `@media (max-width: 800px)` and `@media (max-width: 500px)`.

- [ ] **Step 8: Verify page renders with styled nav/footer**

Open in browser. Confirm: nav is styled, footer is styled, no CSS errors in console.

- [ ] **Step 9: Commit**

```bash
git add ai-research.html
git commit -m "feat: add full CSS to ai-research.html from approved mockup"
```

---

### Task 3: ai-research.html — Hero section HTML

**Files:**
- Modify: `ai-research.html`

Add the hero section HTML between nav and the first content section. Copy from mockup — the section with id `content`.

- [ ] **Step 1: Add hero HTML**

Includes:
- Section label: "The Pharma Closeout Research"
- `<h1>The AI<br>Reckoning</h1>`
- Tagline paragraph
- Three offering cards in `.hero-offerings` grid:
  - **Podcast:** SVG waveform (20 gold `<rect>` bars), title, description, "Listen now →" CTA linking to `#series`
  - **Briefing:** SVG bar chart (3 ascending gold `<rect>` bars), title, description, "Get the briefing →" CTA linking to `#briefing`
  - **Compendium:** `.offering-featured` with gold top border, mock-doc with extended content (multiple line/grid/spacer elements for scroll depth), title, description, CTA + price line (~~$197~~ $149) linking to `#compendium`

- [ ] **Step 2: Verify hero renders**

Open in browser. Confirm: all three cards visible, animations playing (waveform breathing, bars growing, doc scrolling), responsive at 800px (cards stack), links scroll to anchors (will be empty targets for now).

- [ ] **Step 3: Commit**

```bash
git add ai-research.html
git commit -m "feat: add hero section with three animated offering cards"
```

---

### Task 4: ai-research.html — Podcast series section

**Files:**
- Modify: `ai-research.html`

- [ ] **Step 1: Add podcast series HTML**

Section with `id="series"`. Includes:
- Section label: "Special 4-Part Series"
- Headline: "The AI Reckoning — Listen Free"
- Description paragraph
- Four `.episode-card` elements, each containing:
  - `.ep-header` (clickable): ghost number, title, subtitle, duration, toggle "+"
  - `.ep-player` (hidden by default): Spotify `<iframe>` embed using config URL pattern `https://open.spotify.com/embed/show/` + config episode ID, "Open in Spotify →" link using config link URL

Episode data from spec:
1. The Reckoning — 28 min
2. From Molecule to Market — 30 min
3. The Agentic Enterprise — 30 min
4. Who Wins — 32 min

- [ ] **Step 2: Add accordion JS**

Add `toggleEpisode()` function from mockup. On click: close all other open cards, toggle clicked card's `.open` class. The CSS handles the expand animation via `max-height` and `opacity` transitions.

- [ ] **Step 3: Wire config URLs into Spotify embeds**

After the page loads, use the CONFIG object to set the correct `src` attributes on the iframes and `href` on the Spotify links. This way, updating CONFIG is the only change needed when real episode IDs arrive.

```javascript
/* ── WIRE SPOTIFY EMBEDS FROM CONFIG ── */
(function() {
  var episodes = CONFIG.spotifyEpisodes;
  var cards = document.querySelectorAll('.episode-card');
  var keys = ['ep1', 'ep2', 'ep3', 'ep4'];
  cards.forEach(function(card, i) {
    var ep = episodes[keys[i]];
    if (!ep) return;
    var iframe = card.querySelector('iframe');
    var link = card.querySelector('.ep-player-link');
    if (iframe) iframe.src = 'https://open.spotify.com/embed/show/' + ep.embedId + '?utm_source=generator&theme=0';
    if (link) link.href = 'https://open.spotify.com/show/' + ep.linkId;
  });
})();
```

Note: Uses `/embed/show/` with the general show ID as placeholder. When real episode IDs are available, change to `/embed/episode/` and update CONFIG values.

- [ ] **Step 4: Verify accordion works**

Open in browser. Click each episode: confirm player expands with animation, only one open at a time, click again to collapse. Spotify embed should load (general show player as placeholder).

- [ ] **Step 5: Commit**

```bash
git add ai-research.html
git commit -m "feat: add podcast series section with accordion Spotify players"
```

---

### Task 5: ai-research.html — Free briefing section

**Files:**
- Modify: `ai-research.html`

- [ ] **Step 1: Add briefing section HTML**

Section with `id="briefing"`. Two-column `.briefing-layout` grid:

**Left (`.briefing-copy`):**
- Section label: "Free Download"
- Headline: "The Strategic Briefing"
- Description paragraph
- Bullet list with 4 items (gold em-dash `::before` prefix)

**Right (`.briefing-form`):**
- Title: "Download the Briefing"
- Subtitle: "Free PDF, delivered to your inbox."
- `<form>` element with `action` and `method="POST"` pointing to Kit endpoint from CONFIG
- Email `<input>` (type="email", required, custom styled)
- Submit `<button>`: "Get the Free Briefing →"
- Note paragraph about newsletter

- [ ] **Step 2: Wire form to Kit via CONFIG**

```javascript
/* ── WIRE KIT FORM FROM CONFIG ── */
(function() {
  var form = document.querySelector('.briefing-form form');
  if (form && CONFIG.kitFormAction !== '#') {
    form.action = CONFIG.kitFormAction;
  }
})();
```

When CONFIG.kitFormAction is still `#`, the form submits to the current page (does nothing). Once Kit is set up, update the CONFIG value.

- [ ] **Step 3: Verify section renders**

Open in browser. Confirm: two-column layout, form renders, responsive at 800px stacks to single column. Email input focuses with gold border.

- [ ] **Step 4: Commit**

```bash
git add ai-research.html
git commit -m "feat: add free briefing section with email capture form"
```

---

### Task 6: ai-research.html — Compendium pitch section

**Files:**
- Modify: `ai-research.html`

- [ ] **Step 1: Add compendium section HTML**

Section with `id="compendium"`. Includes:
- Section label: "The Full Research"
- Headline: "AI in Pharma: *The Definitive Compendium*" (em in gold)
- Description paragraph
- `.value-grid` (4 columns): 63 GenAI Use Cases, 3 Deep Case Studies, 60 Self-Assessment Items, 90 Day Action Framework — each with number, title, description
- `.inside-grid` (2×2): Part I–III + Appendices — each with label, title, description
- `.price-block`: ~~$197~~ $149 with "Launch Price" badge, CTA button, meta text

- [ ] **Step 2: Wire Stripe link via CONFIG**

All "Get the Compendium" links (hero card, price block, closing CTA) use CONFIG.stripePaymentLink:

```javascript
/* ── WIRE STRIPE LINKS FROM CONFIG ── */
(function() {
  var links = document.querySelectorAll('a[data-stripe]');
  links.forEach(function(a) {
    a.href = CONFIG.stripePaymentLink;
  });
})();
```

Add `data-stripe` attribute to all Compendium buy buttons/links in the HTML.

- [ ] **Step 3: Verify section renders**

Confirm: value grid (4 columns, 2 on mobile, 1 on small mobile), inside grid (2×2, 1 column on mobile), price block with strikethrough and badge. Button links to `#` (placeholder).

- [ ] **Step 4: Commit**

```bash
git add ai-research.html
git commit -m "feat: add compendium pitch section with value grid and pricing"
```

---

### Task 7: ai-research.html — Cascade framework + Closing CTA

**Files:**
- Modify: `ai-research.html`

- [ ] **Step 1: Add Cascade Framework HTML**

Section with no id (placed after compendium). Includes:
- Section label: "Proprietary Framework"
- Headline: "The Cascade Framework"
- Description paragraph
- `.cascade-chain` flex container with 6 `.cascade-link` items: Discover, Develop, Deliver, Commercialize, Workforce, Governance — each with number (01-06), name, subtitle. CSS `›` connector between each via `::after`.

- [ ] **Step 2: Add Closing CTA HTML**

Section with class `closing`. Includes:
- Headline: "The evidence base pharma leaders need."
- Description paragraph
- Price display: ~~$197~~ $149 with "Launch Price" badge
- CTA button with `data-stripe` attribute
- Meta text

- [ ] **Step 3: Add scroll reveal JS**

```javascript
/* ── SCROLL REVEAL ── */
(function() {
  var els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  els.forEach(function(el) { observer.observe(el); });
})();
```

Ensure all content sections have class `reveal` on their section element.

- [ ] **Step 4: Verify full page end-to-end**

Scroll through entire page. Confirm: all sections render, scroll reveal animations fire, accordion works, hero animations play, responsive at 800px and 500px breakpoints. Test in a second browser if possible.

- [ ] **Step 5: Commit**

```bash
git add ai-research.html
git commit -m "feat: add cascade framework, closing CTA, and scroll reveal"
```

---

### Task 8: Update index.html — Nav link + Teaser section

**Files:**
- Modify: `index.html:470-475` (nav)
- Modify: `index.html:534-536` (between `</main>` and `<footer>`)

- [ ] **Step 1: Add "Research" nav link**

In `index.html`, find the nav-links `<ul>` (line 470-475). Add the Research link between Articles and About:

```html
<!-- Before: -->
<li><a href="#articles">Articles</a></li>
<li><a href="about.html">About</a></li>

<!-- After: -->
<li><a href="#articles">Articles</a></li>
<li><a href="ai-research.html">Research</a></li>
<li><a href="about.html">About</a></li>
```

- [ ] **Step 2: Add teaser section**

Between `</main>` (line 534) and `<footer>` (line 537), add:

```html
<hr class="gold-rule section">

<section id="research" class="section" aria-label="Research" style="padding-top: 5rem; padding-bottom: 5rem; text-align: center;">
  <h2 style="font-family: var(--font-display); font-size: clamp(1.6rem, 3vw, 2.2rem); font-weight: 300; line-height: 1.2; margin-bottom: 0.75rem;">AI in Pharma: The Definitive Research</h2>
  <p style="font-size: 0.9rem; color: var(--gray-light); max-width: 550px; margin: 0 auto 1.5rem; line-height: 1.6;">63 use cases. 3 deep case studies. The framework pharma leaders are using to separate AI signal from noise.</p>
  <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
    <a href="ai-research.html#briefing" style="font-size: 0.8rem; color: var(--gold); border-bottom: 1px solid rgba(196,147,50,0.4); padding-bottom: 2px; transition: border-color 0.3s;">Free Strategic Briefing &rarr;</a>
    <a href="ai-research.html#compendium" style="display: inline-flex; align-items: center; background: var(--gold); color: var(--black); font-size: 0.8rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; padding: 0.7rem 1.5rem; transition: box-shadow 0.3s;">Get the Compendium — $149</a>
  </div>
</section>

<hr class="gold-rule section">
```

Note: Uses inline styles to avoid adding new CSS classes to the homepage stylesheet. This keeps the change minimal and self-contained.

- [ ] **Step 3: Verify homepage**

Open `index.html` in browser. Confirm: "Research" link appears in nav between Articles and About. Scroll to bottom: teaser section visible with both buttons. Click each: navigates to correct anchors on `ai-research.html`. Mobile: nav shows Research link.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add Research nav link and teaser section to homepage"
```

---

### Task 9: Update about.html — Nav link

**Files:**
- Modify: `about.html:336-341`

- [ ] **Step 1: Add "Research" nav link**

In `about.html`, find the nav-links `<ul>` (line 336-341). Add the Research link between Articles and About:

```html
<!-- Before: -->
<li><a href="index.html#articles">Articles</a></li>
<li><a href="about.html" class="active">About</a></li>

<!-- After: -->
<li><a href="index.html#articles">Articles</a></li>
<li><a href="ai-research.html">Research</a></li>
<li><a href="about.html" class="active">About</a></li>
```

- [ ] **Step 2: Verify about page**

Open `about.html` in browser. Confirm: "Research" link appears in nav, clicking it navigates to `ai-research.html`. About is still active/highlighted.

- [ ] **Step 3: Commit**

```bash
git add about.html
git commit -m "feat: add Research nav link to about page"
```

---

### Task 10: Full integration test + OG/SEO meta tags

**Files:**
- Modify: `ai-research.html` (if needed)

- [ ] **Step 1: Cross-page navigation test**

Navigate between all three pages. On each page confirm:
- "Research" link is in the nav
- Research link is active (gold) only on ai-research.html
- Podcast and Articles links work correctly from ai-research.html (navigate to index.html anchors)
- About link works from ai-research.html
- Logo links back to index.html from ai-research.html
- Mobile hamburger menu works on ai-research.html

- [ ] **Step 2: Add OG meta tags to ai-research.html**

If not already present in the `<head>`:

```html
<meta property="og:title" content="The AI Reckoning — The Pharma Closeout">
<meta property="og:description" content="Original research on AI in pharma. Free podcast series, strategic briefing, and the definitive 198-page compendium.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://thepharmacloseout.com/ai-research">
<meta name="twitter:card" content="summary">
<meta name="description" content="Original research on AI in pharma. Free podcast series, strategic briefing, and the definitive 198-page compendium for pharma leaders.">
```

- [ ] **Step 3: Accessibility check**

Verify on ai-research.html:
- Skip link works (jumps to `#content`)
- All sections have `aria-label`
- Episode toggle buttons are keyboard accessible (Enter/Space)
- Email form has `aria-label` on input
- All external links have `target="_blank" rel="noopener"`
- `prefers-reduced-motion`: disable browser animations, reload, confirm all animations are off

- [ ] **Step 4: Final responsive check**

Resize browser to test breakpoints:
- **> 800px:** Three-column hero offerings, two-column briefing, four-column value grid, horizontal cascade chain
- **≤ 800px:** All grids stack to single column, hamburger nav, episode subtitles still visible
- **≤ 500px:** Value grid goes to single column, episode subtitles hidden

- [ ] **Step 5: Commit**

```bash
git add ai-research.html
git commit -m "feat: add OG meta tags and verify full integration"
```

---

### Task 11: Stripe Setup — Guided walkthrough with user

**Files:**
- Modify: `ai-research.html` (CONFIG block only)

This task requires the user to perform actions in their browser while Claude guides them through each step. Claude cannot access Stripe directly.

- [ ] **Step 1: Create Stripe account**

Ask the user to go to https://dashboard.stripe.com/register and create an account (or log in if they already have one). Wait for confirmation before proceeding.

- [ ] **Step 2: Verify identity and connect bank**

Stripe requires identity verification and a connected bank account before payouts work. Guide the user through:
- Settings → Business details → Verify identity
- Settings → Payouts → Add bank account

Note: This can be completed later — it doesn't block product creation. But payouts won't process until it's done.

- [ ] **Step 3: Create the product**

Guide the user step by step:
1. Go to Products → Add product
2. Name: "AI in Pharma: The Definitive Compendium"
3. Description: "198 pages of original research on AI in pharma. Includes the Cascade Framework, 63 GenAI use cases, 3 deep case studies, 60-item self-assessment scorecard, and 90-day action framework."
4. Pricing: One-time → $149.00 USD
5. Save product

- [ ] **Step 4: Set up digital delivery**

Guide the user:
1. On the product page, find "Digital delivery" or go to Payment Links settings
2. Upload `AI_in_Pharma_Compendium_v11.pdf` (located at `C:\Users\xadro\OneDrive\Documents\documents\AI Projects\BZG\Consulting\Pharma_Closeout\AI_in_Pharma_Compendium_v11.pdf`)
3. Stripe will automatically email the download link to buyers after payment

Note: If Stripe's built-in digital delivery is limited, an alternative is to use the "After payment → redirect to URL" option and host the PDF on a private URL. But try built-in delivery first — it's simpler.

- [ ] **Step 5: Create Payment Link**

Guide the user:
1. Go to Payment Links → Create payment link
2. Select the Compendium product
3. Customize the checkout page: add your logo, set brand color (#c49332)
4. Enable "Collect email address" (should be default)
5. After payment: confirm "Send digital delivery" is enabled
6. Create the link
7. Copy the Payment Link URL (format: `https://buy.stripe.com/XXXXX`)

- [ ] **Step 6: Wire Stripe URL into CONFIG**

Once the user provides the Payment Link URL, update `ai-research.html`:

```javascript
stripePaymentLink: 'https://buy.stripe.com/XXXXX', // User's actual Stripe Payment Link
```

- [ ] **Step 7: Test purchase**

Guide the user:
1. In Stripe Dashboard, toggle to "Test mode" (top-right switch)
2. Create a test Payment Link (or use the live one in test mode)
3. Complete a test purchase using Stripe's test card: `4242 4242 4242 4242`, any future expiry, any CVC
4. Verify: confirmation page shows, email with PDF download link arrives
5. Switch back to live mode when ready to launch

- [ ] **Step 8: Commit**

```bash
git add ai-research.html
git commit -m "feat: wire Stripe Payment Link into CONFIG"
```

---

### Task 12: Kit (ConvertKit) Setup — Guided walkthrough with user

**Files:**
- Modify: `ai-research.html` (CONFIG block + form action)

This task requires the user to perform actions in their browser while Claude guides them through each step.

- [ ] **Step 1: Create Kit account**

Ask the user to go to https://kit.com and create a free account (free tier supports up to 10,000 subscribers). Wait for confirmation.

- [ ] **Step 2: Create a Form**

Guide the user:
1. Go to Grow → Landing pages & forms → Create new → Form
2. Choose "Inline" form type (not modal or slide-in)
3. Customize minimally — we're using our own styled form, we just need Kit's backend
4. Set the form to collect email only (no name field needed)
5. Save the form

- [ ] **Step 3: Upload the Briefing PDF**

Guide the user:
1. Go to Send → Broadcasts or Automations
2. We need to attach the PDF to an automated email, so proceed to Step 4 first
3. The PDF to upload is: `C:\Users\xadro\OneDrive\Documents\documents\AI Projects\BZG\Consulting\Pharma_Closeout\AI_in_Pharma_Strategic_Briefing_v3.pdf`

- [ ] **Step 4: Create the automation**

Guide the user:
1. Go to Automate → Visual Automations → New automation
2. Trigger: "Joins a form" → select the form created in Step 2
3. Add action: "Add tag" → create tag "briefing-download"
4. Add action: "Send email"
5. Compose the delivery email:
   - Subject: "Your Strategic Briefing: AI in Pharma"
   - Body: Brief intro (2-3 sentences) + PDF attached or download link
   - Attach `AI_in_Pharma_Strategic_Briefing_v3.pdf`
   - Include a soft mention: "For the full 198-page research, visit thepharmacloseout.com/ai-research"
6. Activate the automation

- [ ] **Step 5: Get the form action URL**

Guide the user:
1. Go back to the form created in Step 2
2. Click "Embed" or "Share"
3. Choose "HTML" embed option
4. Find the `<form action="https://app.kit.com/forms/XXXXXXX/subscriptions">` URL
5. Copy just the action URL

- [ ] **Step 6: Wire Kit form into the page**

Once the user provides the form action URL, update `ai-research.html`:

1. Update CONFIG:
```javascript
kitFormAction: 'https://app.kit.com/forms/XXXXXXX/subscriptions', // User's actual Kit form URL
```

2. Update the briefing form HTML to properly submit to Kit. The form needs:
```html
<form action="CONFIG.kitFormAction" method="POST">
  <input type="email" name="email_address" class="form-field" placeholder="name@company.com" aria-label="Email address" required>
  <button type="submit" class="form-submit">Get the Free Briefing &rarr;</button>
</form>
```

Key: the email input `name` attribute must be `email_address` (Kit's expected field name).

- [ ] **Step 7: Test the form**

Guide the user:
1. Open ai-research.html in browser
2. Enter a test email address in the briefing form
3. Submit
4. Check: email arrives with Briefing PDF attached
5. Check Kit dashboard: subscriber appears with "briefing-download" tag

- [ ] **Step 8: Commit**

```bash
git add ai-research.html
git commit -m "feat: wire Kit email capture form into CONFIG"
```

---

### Task 13: Spotify Episode IDs — Wire real episode URLs

**Files:**
- Modify: `ai-research.html` (CONFIG block + iframe src pattern)

- [ ] **Step 1: Get episode IDs from user**

Ask the user to find the 4 "AI Reckoning" episodes in Spotify for Creators (or by searching Spotify). For each episode:
1. Open the episode on Spotify (web or app)
2. Click share → Copy link to episode
3. The URL format is: `https://open.spotify.com/episode/XXXXXXXXXXXXXX`
4. The episode ID is the string after `/episode/`

Collect all 4 IDs.

- [ ] **Step 2: Update CONFIG with real episode IDs**

```javascript
spotifyEpisodes: {
  ep1: { embedId: 'REAL_EP1_ID', linkId: 'REAL_EP1_ID' },
  ep2: { embedId: 'REAL_EP2_ID', linkId: 'REAL_EP2_ID' },
  ep3: { embedId: 'REAL_EP3_ID', linkId: 'REAL_EP3_ID' },
  ep4: { embedId: 'REAL_EP4_ID', linkId: 'REAL_EP4_ID' }
}
```

- [ ] **Step 3: Update embed URL pattern**

In the JS that wires Spotify embeds (Task 4 Step 3), change the pattern from `/embed/show/` to `/embed/episode/`:

```javascript
if (iframe) iframe.src = 'https://open.spotify.com/embed/episode/' + ep.embedId + '?utm_source=generator&theme=0';
if (link) link.href = 'https://open.spotify.com/episode/' + ep.linkId;
```

- [ ] **Step 4: Verify each player loads**

Open ai-research.html, expand each accordion. Confirm:
- Each embedded player loads the correct episode (not the general show)
- "Open in Spotify →" links go to the specific episode page
- Players play audio correctly

- [ ] **Step 5: Commit**

```bash
git add ai-research.html
git commit -m "feat: wire real Spotify episode IDs for AI Reckoning series"
```

---

### Task 14: Final end-to-end test + Push to GitHub Pages

**Files:**
- No modifications (verification only)

- [ ] **Step 1: Full purchase flow test**

1. Open ai-research.html
2. Click "Get the Compendium →" — confirm Stripe Checkout loads with correct product/price
3. Complete test purchase (test mode) — confirm PDF delivery email arrives
4. Verify GA4 is tracking the page (check GA4 realtime dashboard)

- [ ] **Step 2: Full briefing flow test**

1. Enter email in briefing form
2. Submit — confirm Kit receives the subscriber with "briefing-download" tag
3. Confirm automation email arrives with Briefing PDF attached

- [ ] **Step 3: Full podcast flow test**

1. Expand each episode accordion — confirm correct episode loads
2. Play each briefly — confirm audio works
3. Click "Open in Spotify →" — confirm it goes to the specific episode

- [ ] **Step 4: Cross-browser spot check**

Test in at least 2 browsers (e.g., Chrome + Firefox or Chrome + Safari). Check: layout, animations, form submission, Stripe button.

- [ ] **Step 5: Push to GitHub Pages**

Ask the user for confirmation, then:

```bash
git push origin main
```

Site will be live at thepharmacloseout.com/ai-research within ~1 minute of push.
