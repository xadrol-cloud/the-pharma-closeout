# About Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone `about.html` page with a video hero, mission copy, distribution links, and consulting teaser — plus update the homepage nav.

**Architecture:** Single self-contained HTML file mirroring the inline CSS/JS pattern of `index.html`. Nav and footer HTML/CSS duplicated. No build step, no framework, no shared stylesheets.

**Tech Stack:** HTML, CSS, vanilla JavaScript. Static site on GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-03-22-about-page-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `about.html` | Create | New About page — head, CSS, nav, hero, mission, distribution links, consulting teaser, footer, JS |
| `index.html` | Modify (lines 470-474) | Add "About" nav link |
| `assets/about-hero.mp4` | Manual (Midjourney) | Video hero background — user provides |
| `assets/about-hero.jpg` | Manual (Midjourney) | Static fallback image — user provides |

---

### Task 1: Create about.html with head and CSS

**Files:**
- Create: `about.html`

This task creates the file with the full `<head>` (metadata, GA, fonts, favicon) and all CSS needed for the page. CSS is copied from `index.html` for shared components (nav, footer, skip-link, focus-visible, print, reduced-motion) and new CSS is added for the about-specific sections (video hero, mission, distribution links, consulting teaser).

- [ ] **Step 1: Create about.html with head and CSS**

Create `about.html` with:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-K6XEWCK7W4"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-K6XEWCK7W4');
</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>About — The Pharma Closeout</title>
<meta name="description" content="The Pharma Closeout is a daily AI-powered intelligence briefing for pharma and biotech professionals. The signal. The synthesis. The closeout.">
<meta property="og:title" content="About — The Pharma Closeout">
<meta property="og:description" content="Daily AI-powered pharma intelligence. The signal. The synthesis. The closeout.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://thepharmacloseout.com/about">
<meta name="twitter:card" content="summary">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%230a0a0a'/%3E%3Ccircle cx='16' cy='16' r='3' fill='%23c49332'/%3E%3C/svg%3E">
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,600;0,6..72,700;0,6..72,800;1,6..72,300;1,6..72,400&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root {
    --black: #0a0a0a;
    --gold: #c49332;
    --gold-dim: rgba(196, 147, 50, 0.12);
    --white: #e8e4de;
    --gray: #6b6b6b;
    --gray-light: #999;
    --rule: rgba(196, 147, 50, 0.15);

    --font-display: 'Newsreader', Georgia, 'Times New Roman', serif;
    --font-body: 'DM Sans', system-ui, sans-serif;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }

  body {
    font-family: var(--font-body);
    background: var(--black);
    color: var(--white);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  a { color: inherit; text-decoration: none; }

  /* ── NAV (duplicated from index.html) ── */
  nav {
    position: fixed; top: 0; width: 100%; z-index: 100;
    transition: background 0.3s, border-color 0.3s;
  }
  nav.scrolled {
    background: rgba(10, 10, 10, 0.9);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--rule);
  }
  .nav-inner {
    max-width: 1400px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between;
    height: 72px; padding: 0 clamp(1.5rem, 4vw, 4rem);
  }
  .logo {
    font-family: var(--font-display); font-weight: 700;
    font-size: 1.1rem; letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .logo a { transition: opacity 0.3s; }
  .logo a:hover { opacity: 0.7; }
  .nav-links { display: flex; gap: 2.5rem; list-style: none; }
  .nav-links a {
    color: var(--gray-light); font-size: 0.75rem;
    font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase;
    transition: color 0.3s;
  }
  .nav-links a:hover { color: var(--white); }
  .nav-links a.active {
    color: var(--gold);
    border-bottom: 1px solid var(--gold);
    padding-bottom: 2px;
  }

  /* ── MOBILE NAV (duplicated from index.html) ── */
  .nav-toggle {
    display: none; background: none; border: none; cursor: pointer;
    width: 44px; height: 44px; position: relative;
    align-items: center; justify-content: center;
  }
  .nav-toggle span,
  .nav-toggle span::before,
  .nav-toggle span::after {
    display: block; width: 20px; height: 1.5px;
    background: var(--white); position: absolute;
    transition: transform 0.3s, opacity 0.2s;
  }
  .nav-toggle span::before { content: ''; top: -6px; left: 0; }
  .nav-toggle span::after { content: ''; top: 6px; left: 0; }
  .nav-toggle.active span { background: transparent; }
  .nav-toggle.active span::before { transform: rotate(45deg); top: 0; }
  .nav-toggle.active span::after { transform: rotate(-45deg); top: 0; }

  /* ── VIDEO HERO ── */
  .about-hero {
    position: relative;
    min-height: 420px;
    display: flex;
    align-items: center;
    overflow: hidden;
    padding: calc(72px + 4rem) clamp(1.5rem, 4vw, 4rem) 4rem;
  }
  .about-hero-video {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: cover;
  }
  .about-hero-fallback {
    position: absolute; inset: 0;
    background: var(--black);
    background-image: radial-gradient(ellipse at 25% 50%, rgba(196, 147, 50, 0.06), transparent 65%);
  }
  .about-hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(
      90deg,
      rgba(10, 10, 10, 0.6) 0%,
      rgba(10, 10, 10, 0.3) 50%,
      rgba(10, 10, 10, 0.7) 100%
    );
  }
  .about-hero-content {
    position: relative; z-index: 1;
    max-width: 1400px; margin: 0 auto; width: 100%;
  }
  .about-hero h1 {
    font-family: var(--font-display);
    font-size: clamp(2.2rem, 5vw, 4.5rem);
    font-weight: 300;
    line-height: 1.05;
    letter-spacing: -0.03em;
    max-width: 700px;
  }

  /* ── SHARED ── */
  .section {
    max-width: 1400px; margin: 0 auto;
    padding: 0 clamp(1.5rem, 4vw, 4rem);
  }
  .gold-rule {
    border: none; height: 1px;
    background: var(--rule);
    margin: 0;
  }
  .section-label {
    font-size: 0.7rem; font-weight: 500;
    letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--gold);
  }

  /* ── MISSION ── */
  .mission {
    padding-top: 4rem; padding-bottom: 4rem;
  }
  .mission-body {
    max-width: 680px;
    font-size: 0.95rem;
    line-height: 1.75;
    color: var(--gray-light);
  }
  .mission-body p {
    margin-bottom: 1.5rem;
  }
  .mission-body p:last-child {
    margin-bottom: 0;
  }

  /* ── DISTRIBUTION LINKS ── */
  .distribution {
    padding-top: 3rem; padding-bottom: 3rem;
  }
  .distribution .section-label {
    margin-bottom: 1.5rem;
  }
  .distribution-links {
    display: flex; gap: 3rem;
  }
  .distribution-link {
    transition: opacity 0.2s;
  }
  .distribution-link:hover {
    opacity: 0.65;
  }
  .distribution-link-label {
    font-size: 0.7rem; color: var(--gray);
    text-transform: uppercase; letter-spacing: 0.15em;
    margin-bottom: 0.4rem;
  }
  .distribution-link-name {
    font-size: 0.85rem; color: var(--white);
  }
  .distribution-link-arrow {
    display: inline-block;
    transition: transform 0.2s;
    margin-left: 0.25rem;
  }
  .distribution-link:hover .distribution-link-arrow {
    transform: translateX(3px);
  }

  /* ── CONSULTING TEASER ── */
  .consulting {
    padding: 2rem clamp(1.5rem, 4vw, 4rem);
    max-width: 1400px; margin: 0 auto;
  }
  .consulting p {
    font-size: 0.8rem; color: var(--gray);
  }
  .consulting a {
    color: var(--gold);
    transition: opacity 0.3s;
  }
  .consulting a:hover { opacity: 0.7; }

  /* ── FOOTER (duplicated from index.html) ── */
  footer {
    border-top: 1px solid var(--rule);
    padding: 3rem clamp(1.5rem, 4vw, 4rem);
  }
  .footer-inner {
    max-width: 1400px; margin: 0 auto;
    display: flex; justify-content: space-between;
    align-items: flex-start; flex-wrap: wrap; gap: 2rem;
  }
  .footer-brand {
    font-family: var(--font-display); font-weight: 700;
    font-size: 0.9rem; letter-spacing: 0.06em;
    text-transform: uppercase; margin-bottom: 0.4rem;
  }
  .footer-tagline {
    font-family: var(--font-display); font-style: italic;
    color: var(--gray); font-size: 0.8rem;
    font-weight: 300; letter-spacing: 0.03em;
  }
  .footer-right {
    display: flex; flex-direction: column;
    align-items: flex-end; gap: 0.75rem;
  }
  .footer-connect {
    display: flex; gap: 2rem; list-style: none;
  }
  .footer-connect a {
    font-size: 0.75rem; color: var(--gray-light);
    letter-spacing: 0.08em; text-transform: uppercase;
    transition: color 0.3s;
  }
  .footer-connect a:hover { color: var(--gold); }
  .copyright {
    color: rgba(255,255,255,0.2); font-size: 0.7rem;
  }

  /* ── PRINT ── */
  @media print {
    nav, .about-hero-video { display: none !important; }
    body { background: #fff; color: #111; }
    .about-hero { min-height: 0; padding-top: 2rem; padding-bottom: 2rem; }
    a { color: #111; }
    .gold-rule { background: #ccc; }
  }

  /* ── ACCESSIBILITY ── */
  :focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
  }
  .skip-link {
    position: absolute; top: -100%; left: 1rem;
    background: var(--gold); color: var(--black);
    padding: 0.75rem 1.5rem; font-weight: 600;
    font-size: 0.85rem; z-index: 200;
    transition: top 0.2s;
  }
  .skip-link:focus { top: 0; }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
    .about-hero-video { display: none; }
    .about-hero-fallback {
      background-image: url('assets/about-hero.jpg');
      background-size: cover;
      background-position: center;
    }
  }

  /* ── RESPONSIVE ── */
  @media (max-width: 800px) {
    .nav-toggle { display: flex; }
    .nav-links {
      display: none; position: absolute; top: 72px; left: 0; right: 0;
      flex-direction: column; gap: 0;
      padding: 1rem clamp(1.5rem, 4vw, 4rem) 1.5rem;
      background: rgba(10, 10, 10, 0.95);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--rule);
    }
    .nav-links.open { display: flex; }
    .nav-links a { padding: 0.75rem 0; font-size: 0.85rem; }

    .about-hero {
      min-height: 300px;
      padding-top: calc(72px + 2.5rem);
      padding-bottom: 2.5rem;
    }

    .distribution-links {
      flex-direction: column;
      gap: 1.5rem;
    }

    .footer-inner { flex-direction: column; }
    .footer-right { align-items: flex-start; }
  }
</style>
</head>
```

- [ ] **Step 2: Verify the file was created**

Open `about.html` in a browser. Should see a blank dark page (no body content yet) with no console errors. Google Fonts and GA should load.

- [ ] **Step 3: Commit**

```bash
git add about.html
git commit -m "feat: scaffold about.html with head, metadata, and CSS"
```

---

### Task 2: Add nav and hero HTML to about.html

**Files:**
- Modify: `about.html`

Add the body content: skip link, nav (with cross-page links and active state), and video hero section with fallback.

- [ ] **Step 1: Add body content after the closing `</head>` tag**

```html
<body>

<a href="#mission" class="skip-link">Skip to content</a>

<nav aria-label="Main navigation">
  <div class="nav-inner">
    <div class="logo"><a href="index.html">The Pharma Closeout</a></div>
    <button class="nav-toggle" aria-label="Toggle navigation" aria-expanded="false"><span></span></button>
    <ul class="nav-links">
      <li><a href="index.html#podcast">Podcast</a></li>
      <li><a href="index.html#articles">Articles</a></li>
      <li><a href="about.html" class="active">About</a></li>
      <li><a href="https://www.linkedin.com/company/the-pharma-closeout" target="_blank" rel="noopener">LinkedIn</a></li>
    </ul>
  </div>
</nav>

<!-- ── VIDEO HERO ── -->
<section class="about-hero" aria-label="About">
  <div class="about-hero-fallback"></div>
  <video class="about-hero-video" autoplay muted loop playsinline aria-hidden="true">
    <source src="assets/about-hero.mp4" type="video/mp4">
  </video>
  <div class="about-hero-overlay"></div>
  <div class="about-hero-content">
    <div class="section-label" style="margin-bottom: 1.5rem;">About</div>
    <h1>The signal.<br>The synthesis.<br>The closeout.</h1>
  </div>
</section>
```

Note: The video will not play yet (no MP4 file). The fallback gradient background will show instead, which is correct behavior.

- [ ] **Step 2: Verify in browser**

Open `about.html`. Should see:
- Fixed nav with "About" highlighted in gold
- Hero area with dark background, radial gold glow, section label, and headline
- Logo should be a clickable link (hover shows opacity change)

- [ ] **Step 3: Commit**

```bash
git add about.html
git commit -m "feat: add nav and video hero to about page"
```

---

### Task 3: Add mission copy, distribution links, consulting teaser, and footer

**Files:**
- Modify: `about.html`

Add the remaining page content after the hero section closing tag.

- [ ] **Step 1: Add content sections after `</section>` (hero closing tag)**

```html
<hr class="gold-rule">

<!-- ── MISSION ── -->
<main>
<section id="mission" class="section mission" aria-label="Our mission">
  <div class="mission-body">
    <p>The Pharma Closeout is a daily intelligence briefing for pharma and biotech professionals who need to know what happened, what it means, and what to do about it. No filler. No speculation. Signal only.</p>
    <p>Every episode is powered by AI — research, synthesis, and delivery — with human editorial direction setting the agenda. The result is coverage that moves at the speed of the industry without sacrificing the depth that decisions require.</p>
    <p>This is not a trade publication. This is not a newsletter that summarizes press releases. This is the briefing you read before the meeting starts.</p>
  </div>
</section>
</main>

<hr class="gold-rule">

<!-- ── WHERE TO FIND US ── -->
<section class="section distribution" aria-label="Where to find us">
  <div class="section-label">Where to find us</div>
  <div class="distribution-links">
    <a href="https://open.spotify.com/show/6bib0887ucySx51e49M3tp" target="_blank" rel="noopener" class="distribution-link">
      <div class="distribution-link-label">Listen</div>
      <div class="distribution-link-name">Spotify <span class="distribution-link-arrow">&rarr;</span></div>
    </a>
    <a href="https://thepharmacloseout.substack.com/" target="_blank" rel="noopener" class="distribution-link">
      <div class="distribution-link-label">Read</div>
      <div class="distribution-link-name">Substack <span class="distribution-link-arrow">&rarr;</span></div>
    </a>
    <a href="https://www.linkedin.com/company/the-pharma-closeout" target="_blank" rel="noopener" class="distribution-link">
      <div class="distribution-link-label">Connect</div>
      <div class="distribution-link-name">LinkedIn <span class="distribution-link-arrow">&rarr;</span></div>
    </a>
  </div>
</section>

<hr class="gold-rule">

<!-- ── CONSULTING TEASER ── -->
<div class="consulting">
  <!-- TODO: Replace href with Bin's personal LinkedIn profile URL when provided -->
  <p>For advisory and consulting inquiries <a href="https://www.linkedin.com/company/the-pharma-closeout" target="_blank" rel="noopener">&rarr; LinkedIn</a></p>
</div>

<!-- ── FOOTER (duplicated from index.html) ── -->
<footer>
  <div class="footer-inner">
    <div class="footer-left">
      <div class="footer-brand">The Pharma Closeout</div>
      <p class="footer-tagline">Daily pharma intelligence in under 15 minutes.</p>
    </div>
    <div class="footer-right">
      <ul class="footer-connect">
        <li><a href="https://www.linkedin.com/company/the-pharma-closeout" target="_blank" rel="noopener">LinkedIn</a></li>
        <li><a href="https://thepharmacloseout.substack.com/" target="_blank" rel="noopener">Newsletter</a></li>
        <li><a href="https://open.spotify.com/show/6bib0887ucySx51e49M3tp" target="_blank" rel="noopener">Spotify</a></li>
      </ul>
      <p class="copyright">&copy; 2026 The Pharma Closeout</p>
    </div>
  </div>
</footer>

</body>
</html>
```

- [ ] **Step 2: Verify in browser**

Full page should now render:
- Hero with headline
- Gold rule divider
- Three paragraphs of mission copy (gray text, max-width 680px)
- Gold rule divider
- "Where to find us" with three distribution links in a row
- Gold rule divider
- Consulting teaser line
- Footer matching homepage (brand + tagline left, links + copyright right)
- Hover states: distribution links fade to 0.65 opacity, arrows translate right

- [ ] **Step 3: Commit**

```bash
git add about.html
git commit -m "feat: add mission, distribution links, consulting teaser, and footer"
```

---

### Task 4: Add JavaScript (nav behavior)

**Files:**
- Modify: `about.html`

Add the nav scroll and mobile toggle JavaScript. Insert the script block just before the existing `</body>` closing tag.

- [ ] **Step 1: Insert script block before the `</body>` tag in about.html**

Find the `</body>` tag in `about.html` and insert this script block immediately before it (the `</body></html>` closing tags should remain at the end of the file):

```html
<script>
/* ── NAV SCROLL ── */
(function() {
  var nav = document.querySelector('nav');
  window.addEventListener('scroll', function() {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });
})();

/* ── MOBILE NAV TOGGLE ── */
(function() {
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  toggle.addEventListener('click', function() {
    var open = links.classList.toggle('open');
    toggle.classList.toggle('active', open);
    toggle.setAttribute('aria-expanded', open);
  });
  links.querySelectorAll('a').forEach(function(a) {
    a.addEventListener('click', function() {
      links.classList.remove('open');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
})();

/* ── VIDEO FALLBACK ── */
(function() {
  var video = document.querySelector('.about-hero-video');
  if (video) {
    video.addEventListener('error', function() {
      video.style.display = 'none';
    });
    // Also hide if source fails to load
    var source = video.querySelector('source');
    if (source) {
      source.addEventListener('error', function() {
        video.style.display = 'none';
      });
    }
  }
})();
</script>

</body>
</html>
```

- [ ] **Step 2: Verify in browser**

- Scroll down: nav background should blur at 40px scroll
- Resize to <800px: hamburger should appear, clicking it should open/close the nav panel
- Nav links should close the mobile menu when clicked
- No console errors

- [ ] **Step 3: Commit**

```bash
git add about.html
git commit -m "feat: add nav scroll, mobile toggle, and video fallback JS"
```

---

### Task 5: Update index.html nav with About link

**Files:**
- Modify: `index.html` (lines 468-474, nav section)

- [ ] **Step 1: Add About link to the nav**

In `index.html`, find the nav links list (around line 470-474):

```html
    <ul class="nav-links">
      <li><a href="#podcast">Podcast</a></li>
      <li><a href="#articles">Articles</a></li>
      <li><a href="https://www.linkedin.com/company/the-pharma-closeout" target="_blank" rel="noopener">LinkedIn</a></li>
    </ul>
```

Replace with:

```html
    <ul class="nav-links">
      <li><a href="#podcast">Podcast</a></li>
      <li><a href="#articles">Articles</a></li>
      <li><a href="about.html">About</a></li>
      <li><a href="https://www.linkedin.com/company/the-pharma-closeout" target="_blank" rel="noopener">LinkedIn</a></li>
    </ul>
```

- [ ] **Step 2: Verify in browser**

Open `index.html`:
- Nav should show: Podcast | Articles | About | LinkedIn
- Clicking "About" should navigate to `about.html`
- On the about page, clicking "Podcast" should navigate to `index.html#podcast`

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add About link to homepage nav"
```

---

### Task 6: Responsive and accessibility testing

**Files:** None (testing only)

- [ ] **Step 1: Test desktop layout**

Open `about.html` at full width (>800px). Verify:
- Nav: inline links, "About" has gold underline
- Hero: full width, headline readable, gold glow visible behind text
- Mission: three paragraphs, max-width 680px, not stretching full width
- Distribution links: horizontal row with three items
- Consulting teaser: single muted line
- Footer: two-column layout

- [ ] **Step 2: Test mobile layout**

Resize browser to <800px. Verify:
- Nav: hamburger appears, menu slides down on click
- Hero: shorter height (~300px), headline scales down
- Distribution links: stack vertically
- Footer: stacks vertically

- [ ] **Step 3: Test reduced motion**

In browser DevTools, enable `prefers-reduced-motion: reduce` (Chrome: Rendering panel > Emulate CSS media feature). Verify:
- Video element is hidden
- Fallback gradient shows (or static image if `about-hero.jpg` exists)

- [ ] **Step 4: Test keyboard navigation**

Tab through the page. Verify:
- Skip link appears on first tab press, jumps to `#mission`
- All links and buttons have visible gold focus outlines
- Mobile hamburger is keyboard accessible

- [ ] **Step 5: Test cross-page navigation**

- From `index.html`, click "About" → should land on `about.html`
- From `about.html`, click "Podcast" → should land on `index.html#podcast` section
- From `about.html`, click "Articles" → should land on `index.html#articles` section
- From `about.html`, click logo → should land on `index.html`

---

### Task 7: Add video and static assets (manual — user action required)

**Files:**
- Create: `assets/about-hero.mp4` (user provides)
- Create: `assets/about-hero.jpg` (user provides)

This task requires the user to generate assets in Midjourney.

- [ ] **Step 1: Generate Midjourney image**

Suggested prompt:

> Abstract digital waveforms and light traces, fine gold lines flowing horizontally against deep black background, scattered luminous particles, data stream aesthetic, minimal, dark and moody, cinematic lighting, wide aspect ratio --ar 16:9 --style raw

- [ ] **Step 2: Save static image**

Save the Midjourney output as `assets/about-hero.jpg`

- [ ] **Step 3: Generate animated version**

Use Midjourney's animation feature on the same image. Export as MP4.

- [ ] **Step 4: Save video**

Save as `assets/about-hero.mp4`

- [ ] **Step 5: Verify in browser**

Open `about.html`:
- Video should autoplay, loop, and be muted
- Text should be readable over the video (dark overlay ensures contrast)
- Enable reduced-motion: static JPG should show instead

- [ ] **Step 6: Commit**

```bash
git add assets/about-hero.mp4 assets/about-hero.jpg
git commit -m "feat: add hero video and static fallback for about page"
```

---

### Task 8: Final commit and deploy verification

- [ ] **Step 1: Verify git status is clean**

```bash
git status
```

All changes should be committed. No untracked files except `.superpowers/` (if not gitignored).

- [ ] **Step 2: Add .superpowers to .gitignore if needed**

If `.superpowers/` directory is showing in git status:

```bash
echo ".superpowers/" >> .gitignore
git add .gitignore
git commit -m "chore: add .superpowers to gitignore"
```

- [ ] **Step 3: Push to deploy**

```bash
git push origin main
```

Site deploys via GitHub Pages. Verify at `thepharmacloseout.com/about` after deployment completes (typically 1-2 minutes).
