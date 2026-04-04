# Teaser Briefing PDF v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the LinkedIn teaser briefing PDF from 1080x1080 square to 1080x1350 (4:5) portrait format, replace the discovery-focused page 3 with a commercial operations stat, enhance page 5 CTA, and render final PDF.

**Architecture:** Modify existing `teaser-briefing.html` in the BZG Marketing folder. Use `frontend-design` skill for the page 3 redesign and page 5 enhancement. Render via `pagedjs-cli`. Copy final assets to both Marketing folder and repo.

**Tech Stack:** HTML/CSS (inline, Google Fonts), pagedjs-cli for PDF rendering

**Existing file:** `C:\Users\xadro\OneDrive\Documents\documents\AI Projects\BZG\Marketing\teaser-briefing.html` (540 lines, 5-page 1080x1080 template with Wire Service aesthetic)

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `Marketing/teaser-briefing.html` | Modify | Update page size, page 3 content, page 5 content |
| `Marketing/teaser-briefing.pdf` | Create | Rendered PDF output |

---

### Task 1: Update page dimensions from 1080x1080 to 1080x1350

**Files:**
- Modify: `C:\Users\xadro\OneDrive\Documents\documents\AI Projects\BZG\Marketing\teaser-briefing.html`

- [ ] **Step 1: Change @page size**

Change `@page { size: 1080px 1080px; }` → `@page { size: 1080px 1350px; }`

- [ ] **Step 2: Change all .page heights**

Change `.page { height: 1080px; }` → `.page { height: 1350px; }`

- [ ] **Step 3: Verify in browser**

Open teaser-briefing.html in Chrome. All 5 pages should render as portrait 4:5 rectangles. Content should remain centered vertically with more breathing room above and below.

---

### Task 2: Redesign page 3 with commercial operations stat

**Files:**
- Modify: `C:\Users\xadro\OneDrive\Documents\documents\AI Projects\BZG\Marketing\teaser-briefing.html`

**Skill:** Use `frontend-design` skill for this task.

- [ ] **Step 1: Replace page 3 CSS classes**

Replace `.p3-number`, `.p3-text`, `.p3-subtext` with new styles for a two-stat layout:
- Hero stat 1: "5-15%" in gold, large display size
- Connecting text: "of pharma's AI budget goes to commercial" in off-white
- Hero stat 2: "$18-30B" in gold, large display size
- Supporting text: "is the actual opportunity" in off-white
- Visual treatment: gold divider or "vs." between the two stat blocks

Design should use the same Wire Service aesthetic (Newsreader display, DM Sans body, #0a0a0a bg, #c49332 gold, #e8e4de white).

- [ ] **Step 2: Replace page 3 HTML**

Replace the existing page 3 content (`<!-- ═══ PAGE 3: 173 ═══ -->`) with the new commercial stat layout.

- [ ] **Step 3: Verify in browser**

Page 3 should show the two-stat tension clearly. The "5-15%" and "$18-30B" should be immediately readable at LinkedIn feed scale (~600px wide). The visual contrast between the small budget % and the large opportunity $ should create tension.

---

### Task 3: Enhance page 5 CTA with offer details

**Files:**
- Modify: `C:\Users\xadro\OneDrive\Documents\documents\AI Projects\BZG\Marketing\teaser-briefing.html`

- [ ] **Step 1: Update page 5 subtitle**

Change: `28 pages of AI intelligence for pharma leaders`
To: `The Cascade Framework · 180-Day Roadmap · 3 Case Studies`

This tells the reader specifically what they'll get — not just page count.

- [ ] **Step 2: Update page 5 CTA URL**

Change: `thepharmacloseout.com`
To: `thepharmacloseout.com/ai-research`

Direct to the product page, not the homepage.

- [ ] **Step 3: Verify in browser**

Page 5 should read as a clear value proposition: what you get (framework, roadmap, cases) + where to get it (URL) + brand.

---

### Task 4: Render PDF and verify

**Files:**
- Create: `C:\Users\xadro\OneDrive\Documents\documents\AI Projects\BZG\Marketing\teaser-briefing.pdf`

- [ ] **Step 1: Render PDF via pagedjs-cli**

```bash
cd "C:/Users/xadro/OneDrive/Documents/documents/AI Projects/BZG/Marketing"
npx pagedjs-cli teaser-briefing.html -o teaser-briefing.pdf
```

- [ ] **Step 2: Verify PDF**

Open the PDF. Check:
- 5 pages, each 1080x1350 (4:5 portrait)
- Page 1: Title + branding ✓
- Page 2: $275B stat ✓
- Page 3: Commercial budget gap (5-15% vs $18-30B) — new content ✓
- Page 4: Aspirational quote ✓
- Page 5: CTA with offer details + URL ✓
- Fonts rendered correctly (Newsreader + DM Sans)
- Gold accents, borders, corner marks all intact

- [ ] **Step 3: Open PDF in browser to visually verify**

Use Chrome browser automation to open the PDF and confirm visual quality.

---

### Task 5: Copy to repo and commit

**Files:**
- Copy to: `C:\Users\xadro\the-pharma-closeout\` (for git tracking)

- [ ] **Step 1: Copy HTML source to repo docs**

```bash
cp "C:/Users/xadro/OneDrive/Documents/documents/AI Projects/BZG/Marketing/teaser-briefing.html" "C:/Users/xadro/the-pharma-closeout/docs/marketing/teaser-briefing.html"
```

- [ ] **Step 2: Commit**

```bash
cd C:/Users/xadro/the-pharma-closeout
git add docs/marketing/teaser-briefing.html
git commit -m "feat: update teaser briefing to 4:5 portrait with commercial stats"
```
