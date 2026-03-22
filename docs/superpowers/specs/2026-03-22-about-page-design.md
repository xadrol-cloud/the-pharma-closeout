# About Page — Design Spec

## Overview

A standalone `about.html` page for The Pharma Closeout. Mission-forward, editorial voice, with a Midjourney-animated video hero. Positions TPC as an AI-powered intelligence briefing with a subtle consulting funnel.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Page type | Separate `about.html` | Site is growing beyond single-page; proper nav link |
| Layout | Editorial Column | Single vertical flow, typography-driven, consistent with Wire Service aesthetic |
| Voice | Third person, editorial | "The Pharma Closeout delivers..." — matches existing site tone |
| Hero | Video background (Midjourney animated) | Abstract gold waveforms on black, extends homepage waveform visual language |
| AI angle | Owned as differentiator | Woven into mission copy, not hidden |
| Consulting | Subtle one-line teaser | Plants the seed, services page comes later |

## Page Structure

### 1. Navigation (shared with index.html)

- Same fixed header as homepage
- Links: Podcast | Articles | About | LinkedIn ↗
- "About" link added to both `index.html` and `about.html`
- Active state on About: gold underline
- Logo links back to `index.html`
- Mobile: same hamburger toggle at 800px breakpoint

### 2. Video Hero

- Full-width hero area (~420px desktop, ~300px mobile)
- Background: `<video autoplay muted loop playsinline>` with Midjourney-animated abstract signal imagery
- Video file: `assets/about-hero.mp4`
- Content overlay (left-aligned):
  - Section label: "About" (gold, uppercase, small)
  - Headline: "The signal. / The synthesis. / The closeout." (large serif, light weight)
- Dark gradient overlay on video for text readability
- Fallback: CSS-animated waveform if video fails to load
- `prefers-reduced-motion`: static Midjourney still (`assets/about-hero.jpg`) replaces video

### 3. Mission Copy

Three paragraphs, max-width 680px, ~40-50 words each:

- **Paragraph 1 — What it is:** Daily intelligence briefing for pharma/biotech professionals. What happened, what it means, what to do about it. No filler, signal only.
- **Paragraph 2 — The AI differentiator:** AI-powered research, synthesis, and delivery. Human editorial direction sets the agenda. Coverage at the speed of the industry without sacrificing depth.
- **Paragraph 3 — The positioning statement:** Not a trade publication. Not a newsletter that summarizes press releases. The briefing you read before the meeting starts.

### 4. Where To Find Us

Section label: "Where to find us" (gold, uppercase)

Three distribution links in a horizontal row:

| Label | Link | Target |
|-------|------|--------|
| Listen | Spotify | New tab |
| Read | Substack | New tab |
| Connect | LinkedIn | New tab |

Each link has a small uppercase category label above it (gray) and the platform name below (white, with →).

### 5. Consulting Teaser

Single line below a gold rule divider:

> For advisory and consulting inquiries → LinkedIn

Links to Bin's LinkedIn profile. No further detail.

### 6. Footer

Same footer as homepage: brand name + copyright, gold rule divider above.

## Visual Design

### Colors (existing design system)

| Token | Value | Use on this page |
|-------|-------|-----------------|
| `--black` | `#0a0a0a` | Page background |
| `--gold` | `#c49332` | Section labels, active nav, rules, consulting link |
| `--white` | `#e8e4de` | Headline, distribution link text |
| `--gray` | `#6b6b6b` | Category labels, consulting text, footer |
| `--gray-light` | `#999` | Mission copy body text |
| `--rule` | `rgba(196, 147, 50, 0.15)` | Dividers between sections |

### Typography (existing design system)

- Headline: Newsreader, weight 300, `clamp(2.2rem, 5vw, 4.5rem)`, negative letter-spacing
- Section labels: DM Sans, 0.65rem, uppercase, wide letter-spacing, gold
- Body copy: 0.95rem, line-height 1.75
- Distribution links: DM Sans, 0.85rem
- Category labels: DM Sans, 0.7rem, uppercase

### Layout

- Max-width: 1400px, centered (same as homepage)
- Padding: `clamp(1.5rem, 4vw, 4rem)` (fluid, same as homepage)
- Gold rule dividers between all major sections

## Responsive Behavior (800px breakpoint)

| Element | Desktop | Mobile |
|---------|---------|--------|
| Hero height | ~420px | ~300px |
| Headline size | `clamp(2.2rem, 5vw, 4.5rem)` | Scales down via clamp |
| Distribution links | Horizontal row | Stack vertically or wrap |
| Nav | Inline links | Hamburger menu |

## Accessibility

- Video: `muted` attribute, no meaningful audio content
- `prefers-reduced-motion`: static fallback image, no animation
- All sections have `aria-label`
- Distribution links: `target="_blank" rel="noopener"`
- Same focus-visible treatment as homepage (2px gold outline)
- Skip link to main content

## Asset Requirements

| Asset | Source | Format | Notes |
|-------|--------|--------|-------|
| Hero video | Midjourney → animate | MP4 | Abstract gold waveforms on black, ~5-10s loop, 16:9 |
| Hero still | Midjourney | JPG | Same image, static, for reduced-motion fallback |

### Suggested Midjourney Prompt

> Abstract digital waveforms and light traces, fine gold lines flowing horizontally against deep black background, scattered luminous particles, data stream aesthetic, minimal, dark and moody, cinematic lighting, wide aspect ratio --ar 16:9 --style raw

## Technical Implementation

### File structure

```
the-pharma-closeout/
├── index.html          (updated: add About nav link)
├── about.html          (new)
├── assets/
│   ├── about-hero.mp4  (new: Midjourney animated video)
│   └── about-hero.jpg  (new: static fallback)
```

### Architecture notes

- `about.html` is self-contained: all CSS inline, same pattern as `index.html`
- Nav and footer HTML/CSS duplicated from `index.html` (acceptable for two pages)
- No shared stylesheet extraction yet — revisit if a third page is added
- No JavaScript required beyond nav scroll behavior (copied from `index.html`)
- No RSS feeds or dynamic content on this page

## What Is NOT on This Page

- No host bios (Alex Mercer, Maya Patel)
- No episode embeds or podcast player
- No newsletter signup form
- No services/consulting detail
- No testimonials or social proof
- No contact form
