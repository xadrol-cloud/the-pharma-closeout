# Episode Transcript Pages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give The Pharma Closeout an on-site episode surface — one indexed, transcript-bearing HTML page per published episode — so podcast content contributes crawlable text + `PodcastEpisode` schema to the domain and links every deal mention into the deal database.

**Architecture:** A static build step (`scripts/build_episodes.mjs`) gated by the Spotify RSS feed. RSS is the authoritative "what actually published" signal (Bin publishes manually and skips days, so the build must never assume daily cadence). For each *published* episode it finds the committed transcript, renders `episodes/<slug>.html` from a pure template, and rewrites a delimited episodes block in `sitemap.xml`. A pure deal-linker resolves each deal mention to one of three states — static SEO page, live interactive page, or plain text — reusing the existing `dealUrl()` semantics so links are never broken and **self-upgrade on the next build** as BD ingests deals on its own cadence. Catch-up and steady-state are the *same idempotent build* run against the full RSS history.

**Tech Stack:** Node ESM (`.mjs`), `node --test` (matches existing `tests/*.unit.mjs`), static HTML output, Supabase publishable client for deal-index data (same project as `assets/deals.js`), no new runtime deps.

---

## Design Decisions (locked)

1. **URL scheme:** `episodes/<YYYY-MM-DD>-<title-slug>.html`, index at `episodes/index.html`. **Slug rule (deterministic + stable):** at import time compute `slugify(title)` = lowercase, strip punctuation (incl. the colon in titles like `GSK Kills Camlipixant: The P2X3…`), spaces→`-`, then truncate to the first **8** words; **store the result in the transcript front-matter** (`slug:`) so a later title edit never changes a live URL. The build reads the stored slug — it is never re-derived from the title at build time. (The mockup's `…-gsk-camlipixant-p2x3-cough` was hand-shortened for illustration; the real slug is whatever the stored rule produces — canonical tag, sitemap, and JSON-LD all read that same stored value, so they stay internally consistent.)
2. **Source of truth for "published" = Spotify RSS** (`https://open.spotify.com/show/6bib0887ucySx51e49M3tp` → RSS). Skipped days simply don't appear. No cron/date assumptions anywhere.
3. **Transcript store = the site repo**, not a cross-repo read at build time. `content/episodes/<YYYY-MM-DD>.md` (cleaned transcript) + `content/episodes/<YYYY-MM-DD>.stories.json` (copied from the engine's `story_index.json`). Import is a separate, guarded step so the render build is self-contained and deterministic.
4. **Deal links degrade in three states** (this is the answer to "sometimes the deal link won't be ready"):
   - deal in DB **with** a static slug → `deals/<slug>.html`
   - deal in DB, **no** static slug yet → `deal.html?id=<deal_id>` (live Supabase interactive page)
   - deal **not in DB yet** → plain text, logged to `episodes/pending_deal_links.json`
   Every build re-resolves *all* mentions against the current index, so a plain-text mention becomes a link, and an interactive link becomes a static link, automatically once BD catches up. Zero manual reconciliation.
5. **Deal matching keys off `story_index.json`** (entities already extracted per episode — see engine BestPractice #20), **not** raw-text NER. Raw text is only used to locate *where* to inject the resolved link for a matched entity. **CONFIRMED shape (do not trust the intuition here):** `story_index.json` is a **top-level JSON array** of story objects — there is **no `{ stories: [...] }` wrapper**. Each story splits entities across **four** fields: `companies`, `mentioned_companies` (⚠️ the acquisition *target* usually lives here, e.g. story has `companies:["Eli Lilly"]` and `mentioned_companies:["AtaiBeckley"]`), `drugs`, `mentioned_drugs`. The linker MUST union all four per story or it will miss every target (the flagship AtaiBeckley link would silently fail). Load defensively: `const stories = Array.isArray(raw) ? raw : (raw.stories ?? [])`.
6. **Published-but-no-transcript** (a day Bin skips the transcript, or a pre-story_index legacy episode) → render a **listen-only page** (embed + RSS description, no transcript block). Still valid, still indexed, never a gap.
7. **Catch-up == steady-state.** `build_episodes.mjs` is idempotent and re-runnable; running it once against full RSS history *is* the backfill.

## File Structure

```
scripts/
  build_episodes.mjs          # orchestrator: RSS gate → render → sitemap → pending log  (NEW)
  import_transcripts.mjs       # engine .md + story_index → content/episodes/*  (NEW)
  refresh_deal_index.mjs       # Supabase → assets/deal-index.json  (NEW)
  lib/
    transcript.mjs             # pure: raw engine .md → structured transcript  (NEW)
    deal_index.mjs             # pure: normalize + match (buyer,target,year)→deal_id  (NEW)
    deal_linker.mjs            # pure: transcript + stories + index → resolved spans  (NEW)
    render_episode.mjs         # pure: structured episode → full HTML string  (NEW)
    render_episode_index.mjs   # pure: episode list → episodes/index.html  (NEW)
    rss.mjs                    # thin fetch + pure parse of show RSS  (NEW)
content/
  episodes/<YYYY-MM-DD>.md            # committed cleaned transcript  (NEW, data)
  episodes/<YYYY-MM-DD>.stories.json  # committed copy of story_index  (NEW, data)
assets/
  deal-index.json             # (buyer,target,year)→deal_id lookup, build artifact  (NEW)
  deal-links.mjs              # REUSE dealUrl()/slug semantics — do not duplicate
episodes/
  <slug>.html                 # generated pages  (OUTPUT)
  index.html                  # generated index  (OUTPUT)
  pending_deal_links.json     # unresolved mentions for observability  (OUTPUT)
sitemap.xml                   # MODIFY: idempotent <!-- EPISODES --> block
tests/
  transcript.unit.mjs         # (NEW)
  deal_index.unit.mjs         # (NEW)
  deal_linker.unit.mjs        # (NEW)
  render_episode.unit.mjs     # (NEW)
  seo_link_graph.integration.mjs  # MODIFY: assert episode schema + sitemap coverage
```

**Toolchain notes for the implementer:** Pure logic modules live under `scripts/lib/` and are imported by `tests/*.unit.mjs` with `node --test` — mirror the existing `scoring.js` (pure) vs `deals.js` (browser/Supabase) split. Never put a `cdn.jsdelivr.net` import in a file a unit test imports; keep network calls in the thin `rss.mjs`/`refresh_deal_index.mjs`/`import_transcripts.mjs` wrappers only. **Hard constraint:** `deal_linker.mjs` imports **only** `{ dealUrl, _setSlugMap }` from `assets/deal-links.mjs` (pure, CDN-free, verified). It must **never** import `assets/deals.js` — that file top-level-imports the Supabase CDN client and does a top-level `await loadSlugMap()`, which crashes `node --test` offline.

---

## Phase A — Transcript parser (pure)

Engine scripts look like:
```
### [COLD OPEN]

ALEX: ...text...

MAYA: ...text...

---

### [WEEK IN REVIEW — TOP STORY]
...
### EPISODE METADATA (For Podcast Hosting Upload)
**Title:** ...
```
The parser must: split on `### [SEGMENT]` headers, parse `SPEAKER:` turns, drop `---` rules, and **truncate everything at `### EPISODE METADATA`** (that block is upload-only and must never reach the public page). Guest speakers (e.g. `MARCUS:`) are tagged `guest`.

**Real headers are em-dash prefixed**, e.g. `[WEEK IN REVIEW — TOP STORY]`, `[WEEK IN REVIEW — DEAL LANDSCAPE]` (U+2014). The mockup shows *shortened* titles ("Deal Landscape", not "Week In Review — Deal Landscape"). **Title rule (matches approved design):** if a header contains ` — ` (spaced em-dash), keep only the text **after the last** ` — `; otherwise keep the whole bracket contents. Then title-case. So `[WEEK IN REVIEW — DEAL LANDSCAPE]` → `Deal Landscape`. The fixture below uses the **real** header forms and includes an em-dash + typographic apostrophe (`'`, U+2019) so escaping into HTML is covered.

### Task A1: Transcript parser

**Files:**
- Create: `scripts/lib/transcript.mjs`
- Test: `tests/transcript.unit.mjs`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/transcript.unit.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseTranscript } from '../scripts/lib/transcript.mjs'

const SAMPLE = `### [COLD OPEN]

ALEX: Money came roaring back — it's a risk-on market.

MAYA: Risk and reward in five days.

---

### [WEEK IN REVIEW — DEAL LANDSCAPE]

ALEX: Lilly agreed to buy AtaiBeckley for $2.8 billion.

MARCUS: Eleven acquisitions is a serial-acquirer signature.

---

### EPISODE METADATA (For Podcast Hosting Upload)

**Title:** GSK Kills Camlipixant
`

test('splits segments and turns, tags guest, strips metadata', () => {
  const ep = parseTranscript(SAMPLE)
  assert.equal(ep.segments.length, 2)
  assert.equal(ep.segments[0].title, 'Cold Open')
  assert.equal(ep.segments[1].title, 'Deal Landscape')     // text after last " — ", title-cased
  assert.equal(ep.segments[1].turns[0].speaker, 'ALEX')
  assert.equal(ep.segments[1].turns[1].speaker, 'MARCUS')
  assert.equal(ep.segments[1].turns[1].role, 'guest')      // not a primary host
  assert.equal(ep.segments[0].turns[0].role, 'host')
  assert.ok(ep.segments[0].turns[0].text.includes('—'))    // em-dash + apostrophe survive
  // metadata block never leaks into content
  assert.ok(!JSON.stringify(ep).includes('EPISODE METADATA'))
  assert.ok(!JSON.stringify(ep).includes('Podcast Hosting'))
})

test('empty/short input yields zero segments, not a throw', () => {
  assert.equal(parseTranscript('').segments.length, 0)
})
```

- [ ] **Step 2: Run test to verify it fails** — `node --test tests/transcript.unit.mjs` → FAIL (module not found).

- [ ] **Step 3: Write minimal implementation**

```javascript
// scripts/lib/transcript.mjs
const PRIMARY_HOSTS = new Set(['ALEX', 'MAYA'])
const META_MARKER = /^###\s*EPISODE METADATA/im

/** Bracketed header → shortened, title-cased segment name.
 *  "[WEEK IN REVIEW — DEAL LANDSCAPE]" → "Deal Landscape". */
function cleanSegmentTitle(raw) {
  let s = raw.replace(/^\[|\]$/g, '').trim()
  if (s.includes(' — ')) s = s.split(' — ').pop().trim()  // keep text after last em-dash
  s = s.toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\b(And|The|Of|In)\b/g, m => m.toLowerCase())
  return s.charAt(0).toUpperCase() + s.slice(1)   // never lowercase the FIRST word
}
// e.g. "[THE WEEK AHEAD]" → "The Week Ahead" (not "the Week Ahead")

/** Parse a raw engine episode script into { segments:[{title,turns:[{speaker,role,text}]}] }. */
export function parseTranscript(raw) {
  if (!raw || !raw.trim()) return { segments: [] }
  // Hard stop at the upload-only metadata block.
  const body = raw.split(META_MARKER)[0]
  const parts = body.split(/^###\s*/m).map(s => s.trim()).filter(Boolean)
  const segments = []
  for (const part of parts) {
    const nl = part.indexOf('\n')
    const headerLine = (nl === -1 ? part : part.slice(0, nl)).trim()
    if (!headerLine.startsWith('[')) continue           // not a segment header
    const rest = nl === -1 ? '' : part.slice(nl + 1)
    const turns = []
    for (const line of rest.split('\n')) {
      const t = line.trim()
      if (!t || t === '---') continue
      const m = t.match(/^([A-Z][A-Z .'-]{1,24}):\s*(.*)$/)
      if (m) {
        const speaker = m[1].trim()
        turns.push({
          speaker,
          role: PRIMARY_HOSTS.has(speaker) ? 'host' : 'guest',
          text: m[2].trim(),
        })
      } else if (turns.length) {
        turns[turns.length - 1].text += ' ' + t   // wrapped line continuation
      }
    }
    segments.push({ title: cleanSegmentTitle(headerLine), turns })
  }
  return { segments }
}
```

- [ ] **Step 4: Run test to verify it passes** — `node --test tests/transcript.unit.mjs` → PASS.
- [ ] **Step 5: Commit** — `git add scripts/lib/transcript.mjs tests/transcript.unit.mjs && git commit -m "feat(episodes): pure transcript parser with metadata stripping"`

---

## Phase B — Deal index + linker (pure)

### Task B1: Deal index normalize + match

**Files:**
- Create: `scripts/lib/deal_index.mjs`
- Test: `tests/deal_index.unit.mjs`

The index is `{ deals: [{ deal_id, buyer, target, year, has_slug }] }` (built from Supabase in Task E2). Matching is deterministic: normalize company names (lowercase, strip `inc/ltd/plc/corp/pharmaceuticals/therapeutics/and`, punctuation), then match a story-index company/target against `target` first (most specific), then `buyer`. Ambiguous matches (>1 deal) resolve to the most recent year.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/deal_index.unit.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeCompany, matchDeal } from '../scripts/lib/deal_index.mjs'

const INDEX = { deals: [
  { deal_id: 'd1', buyer: 'Eli Lilly and Company', target: 'AtaiBeckley', year: 2026, has_slug: true },
  { deal_id: 'd2', buyer: 'GSK plc', target: 'Bellus Health', year: 2023, has_slug: false },
  { deal_id: 'd3', buyer: 'Pfizer Inc', target: 'Arena Pharmaceuticals', year: 2021, has_slug: true },
] }

test('normalize strips suffixes and case', () => {
  assert.equal(normalizeCompany('Eli Lilly and Company'), 'eli lilly')
  assert.equal(normalizeCompany('GSK plc'), 'gsk')
  assert.equal(normalizeCompany('Arena Pharmaceuticals'), 'arena')
})

test('matches target then buyer', () => {
  assert.equal(matchDeal('AtaiBeckley', INDEX).deal_id, 'd1')
  assert.equal(matchDeal('Bellus Health', INDEX).deal_id, 'd2')
  assert.equal(matchDeal('Pfizer', INDEX).deal_id, 'd3')       // buyer fallback
})

test('unknown entity returns null (→ plain text)', () => {
  assert.equal(matchDeal('Moderna', INDEX), null)
})
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** `normalizeCompany` (regex suffix strip) + `matchDeal` (target-first, buyer-fallback, newest-year tiebreak) in `scripts/lib/deal_index.mjs`. Keep pure; no network.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(episodes): deterministic deal-index matcher"`

### Task B2: Deal linker — three-state resolution

**Files:**
- Create: `scripts/lib/deal_linker.mjs`
- Test: `tests/deal_linker.unit.mjs`

Reuse `dealUrl(dealId)` from `assets/deal-links.mjs` (import **only** `{ dealUrl, _setSlugMap }` from there — never `deals.js`). Input: the episode's `stories.json` (**top-level array**; entities across `companies`/`mentioned_companies`/`drugs`/`mentioned_drugs`) + deal index. The linker unions **all four** entity fields per story, dedupes, `matchDeal`s each, and resolves via `dealUrl`. Output: `{ links:[{ entity, dealId, href, state }], pending:[entity,…] }` where `state ∈ static|interactive|plain`; unmatched entities go to `pending`.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/deal_linker.unit.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveDealLinks } from '../scripts/lib/deal_linker.mjs'
import { _setSlugMap } from '../assets/deal-links.mjs'

const INDEX = { deals: [
  { deal_id: 'd1', buyer: 'Eli Lilly and Company', target: 'AtaiBeckley', year: 2026, has_slug: true },
  { deal_id: 'd2', buyer: 'GSK plc', target: 'Bellus Health', year: 2023, has_slug: false },
] }
// REAL shape: top-level array; target lives in mentioned_companies, not companies.
const STORIES = [
  { companies: ['Eli Lilly'], mentioned_companies: ['AtaiBeckley'], drugs: [], mentioned_drugs: [] },
  { companies: ['GSK'], mentioned_companies: ['Bellus Health'], drugs: ['camlipixant'], mentioned_drugs: [] },
  { companies: ['Moderna'], mentioned_companies: [], drugs: [], mentioned_drugs: [] },
]

test('unions mentioned_companies → matches target → static slug', () => {
  _setSlugMap({ d1: 'eli-lilly-and-ataibeckley-2026' })
  const r = resolveDealLinks(STORIES, INDEX)
  const lilly = r.links.find(l => l.dealId === 'd1')   // matched via AtaiBeckley in mentioned_companies
  assert.equal(lilly.state, 'static')
  assert.equal(lilly.href, 'deals/eli-lilly-and-ataibeckley-2026.html')
})

test('in DB but no slug → interactive deal.html?id=', () => {
  _setSlugMap({})                              // no static page for d2 yet
  const r = resolveDealLinks(STORIES, INDEX)
  const gsk = r.links.find(l => l.dealId === 'd2')
  assert.equal(gsk.state, 'interactive')
  assert.equal(gsk.href, 'deal.html?id=d2')
})

test('accepts legacy { stories:[…] } wrapper defensively', () => {
  const r = resolveDealLinks({ stories: STORIES }, INDEX)
  assert.ok(r.links.some(l => l.dealId === 'd1'))
})

test('not in DB → plain text + recorded pending', () => {
  const r = resolveDealLinks(STORIES, INDEX)
  assert.ok(r.pending.includes('Moderna'))
  assert.ok(!r.links.some(l => l.entity === 'Moderna'))
})
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** `resolveDealLinks(storiesRaw, index)`: normalize input with `const stories = Array.isArray(storiesRaw) ? storiesRaw : (storiesRaw?.stories ?? [])`; per story union `[...companies, ...mentioned_companies, ...drugs, ...mentioned_drugs]` (guard each with `?? []`); dedupe entities across the whole episode (case-insensitive); `matchDeal` each; on a hit, `dealUrl(deal_id)` and classify `state` = `'static'` if the href starts with `deals/`, else `'interactive'`; on a miss push the entity to `pending`. Import only `{ dealUrl, _setSlugMap }` from `../assets/deal-links.mjs`. Pure — no network.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(episodes): three-state deal-link resolver (static/interactive/plain)"`

---

## Phase C — Episode page renderer (pure) + SEO schema (SEO item 3)

### Task C1: render_episode

**Files:**
- Create: `scripts/lib/render_episode.mjs`
- Test: `tests/render_episode.unit.mjs`

Renderer produces the full HTML matching the approved mockup (`docs/superpowers/plans/assets/episode-mockup.html` is the visual reference; copy its CSS + structure). Injects the **`PodcastEpisode` JSON-LD** (SEO item 3) into `<head>` and links resolved deals at the first occurrence of each matched entity in the transcript. Listen-only mode when `episode.segments` is empty.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/render_episode.unit.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderEpisode } from '../scripts/lib/render_episode.mjs'

const EP = {
  slug: '2026-07-19-gsk-camlipixant-p2x3-cough',
  title: 'GSK Kills Camlipixant',
  date: '2026-07-19',
  description: 'GSK wrote off most of a $2B bet.',
  spotifyUrl: 'https://open.spotify.com/episode/abc',
  segments: [{ title: 'Deal Landscape', turns: [
    { speaker: 'ALEX', role: 'host', text: 'Lilly agreed to buy AtaiBeckley for $2.8 billion.' },
  ] }],
}
const LINKS = { links: [{ dealId: 'd1', entity: 'AtaiBeckley', href: 'deals/eli-lilly-and-ataibeckley-2026.html', state: 'static' }], pending: [] }

test('emits PodcastEpisode schema', () => {
  const html = renderEpisode(EP, LINKS)
  assert.ok(html.includes('"@type": "PodcastEpisode"'))
  assert.ok(html.includes('"datePublished": "2026-07-19"'))
  assert.ok(html.includes('<link rel="canonical" href="https://thepharmacloseout.com/episodes/2026-07-19-gsk-camlipixant-p2x3-cough">'))
})

test('links matched deal at first mention', () => {
  const html = renderEpisode(EP, LINKS)
  assert.ok(html.includes('href="deals/eli-lilly-and-ataibeckley-2026.html"'))
  assert.ok(html.includes('>AtaiBeckley<') === false)   // it's inside an <a>, not bare
})

test('listen-only when no transcript', () => {
  const html = renderEpisode({ ...EP, segments: [] }, { links: [], pending: [] })
  assert.ok(html.includes('open.spotify.com/embed'))        // still has player
  assert.ok(!html.includes('id="transcript"'))              // no transcript block
})
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** `renderEpisode(episode, resolved)`. Escape all text first (reuse/replicate an `esc()` helper). **Deal linking (robust):** for each `resolved.links`, regex-escape the `entity`, then replace the **first** whole-word, case-insensitive occurrence in the already-escaped turn HTML with `<a class="deal" href=...>`. Rules: (a) skip if the entity isn't found — inline injection is best-effort; (b) never inject inside an already-placed `<a>` (replace once per render pass / track consumed ranges); (c) subsequent mentions stay plain. **Critical de-risk:** the bottom "Deals mentioned in this episode" rail lists **every** `resolved.links` entry regardless of whether an inline anchor landed — so a surface-form mismatch (story_index "Eli Lilly" vs transcript "Lilly") never drops the deal link; it still shows in the rail. Build the JSON-LD via `JSON.stringify` (no hand-quoting). Include the mockup's `<style>` block verbatim.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(episodes): episode renderer with PodcastEpisode schema + inline deal links"`

### Task C2: render_episode_index

**Files:**
- Create: `scripts/lib/render_episode_index.mjs`; Test: `tests/render_episode.unit.mjs` (extend)

- [ ] **Step 1:** Add test: `renderEpisodeIndex([{slug,title,date}])` returns HTML containing `PodcastSeries` JSON-LD, a link to each episode page, and reverse-chronological order.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement pure `renderEpisodeIndex(list)` (sorted desc by date, `PodcastSeries` schema, nav matches site).
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(episodes): episodes index page with PodcastSeries schema"`

---

## Phase D — RSS gate + data ingestion (thin wrappers)

### Task D1: RSS parse

**Files:** Create `scripts/lib/rss.mjs`; Test `tests/rss.unit.mjs`
- [ ] **Step 1:** Test a pure `parseRssItems(xmlString)` → `[{ title, date(ISO from pubDate), guid, link, description }]` against a small inline RSS fixture (2 items). Assert `date` is a valid ISO string and `link` is captured (this is the per-episode Spotify URL used below). Fetch stays in a separate `fetchShowRss()` export (untested/thin).
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement `parseRssItems` (regex/`<item>` split; no XML dep; parse `pubDate`→ISO) + `fetchShowRss(url)` wrapper.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5: Verify against the REAL feed** (thin, manual): fetch the live show RSS once and confirm each `<item>` has a usable `pubDate` + `<link>`/`<guid>`. Record the actual field names — some Spotify feeds put the episode URL in `<link>`, others only in `<guid isPermaLink="true">`. Whichever carries the per-episode URL is what feeds the embed decision below.
- [ ] **Step 6: Embed mapping decision (resolves reviewer #8):** the page embeds the **show** player (`open.spotify.com/embed/show/6bib…`, matches the mockup, always renders) **plus** a direct "Listen on Spotify" link to the per-episode URL from the RSS `link`/`guid` when present. The `PodcastEpisode` JSON-LD `associatedMedia.contentUrl` = per-episode URL when available, else the show URL. Do **not** block on obtaining a per-episode *embed* id — the show embed + episode deep-link is sufficient and degradation-safe. Wire this in C1's renderer, not hard-coded ad hoc.
- [ ] **Step 7: Commit** — `git commit -m "feat(episodes): RSS parser as published-episode gate + embed mapping"`

### Task D2: import_transcripts (engine → content store)

**Files:** Create `scripts/import_transcripts.mjs`
- [ ] **Step 1:** Implement guarded importer: given an engine episodes dir (default `../pce-work/02_Episodes`, overridable via `--src`), for each `YYYY-MM-DD/Episode_Script_*.md`: compute the slug **once** from the episode title (per Design Decision #1's rule) and write it plus the date into YAML front-matter at the top of `content/episodes/<date>.md`, followed by the raw script body; copy `story_index.json` → `content/episodes/<date>.stories.json`. Write **only if newer / missing**, and **never overwrite an existing `slug:`** already in the target front-matter (URL stability — a re-import after a title edit keeps the original slug). If `--src` is absent, exit 0 with a logged notice (degrades to already-committed content). `--all` = bulk catch-up; no flag = last 3 days.
- [ ] **Step 2: Manual verify:** run `node scripts/import_transcripts.mjs --all`; confirm `content/episodes/` populated. (No unit test — thin FS glue; covered end-to-end by Phase E.)
- [ ] **Step 3: Commit** — `git commit -m "feat(episodes): guarded transcript importer (bulk + incremental)"`

---

## Phase E — Orchestrator, sitemap (SEO item 2), deal-index refresh

### Task E1: build_episodes orchestrator

**Files:** Create `scripts/build_episodes.mjs`; Modify `sitemap.xml`
- [ ] **Step 1a — SEED THE SLUG MAP FIRST (fixes the "every deal is interactive" bug):** at build start, read `assets/deal-slugs.json` from disk and call `_setSlugMap(JSON.parse(...))` from `deal-links.mjs` **before** any `resolveDealLinks`. Without this the module-level `slugMap` is `{}` and `dealUrl` returns `deal.html?id=` for *every* deal → zero static links. (The `has_slug` field in `deal-index.json` is advisory only; the actual static-vs-interactive decision comes from this seeded map via `dealUrl`.) Also read the **stored slug** via a regex on the front-matter region (`/^slug:\s*(.+)$/m` on the text before the first `### ` — no YAML dep) since `package.json` has none.
- [ ] **Step 1b:** Implement: `fetchShowRss('https://spotifeed.timdorr.com/6bib0887ucySx51e49M3tp')` → published items. For each item: use the stored slug; load the transcript + `.stories.json` if present → `parseTranscript` + `resolveDealLinks`; else listen-only. `renderEpisode` → write `episodes/<slug>.html`. Collect list → `renderEpisodeIndex` → `episodes/index.html`. Union all `pending`, **sort** (by slug then entity), → `episodes/pending_deal_links.json`. **Every generated artifact must be deterministically sorted** (episode list reverse-chron by date; sitemap block by date; pending by slug) so byte output is stable run-to-run.
- [ ] **Step 2: Sitemap (SEO item 2) — SINGLE-OWNER via `build_deal_pages.py`, NOT a block in build_episodes.** Discovered constraint: `sitemap.xml` is regenerated from scratch every day by the deal-pages SSG (`…/BD Data Base/scripts/ssg/build_deal_pages.py`, from its `MAIN_PAGES` list + a deals-only regex). A hand-injected block in `build_episodes.mjs` would be **wiped within 24h**. So `build_episodes.mjs` does **NOT** write `sitemap.xml`. Instead, extend `build_deal_pages.py`: add `/episodes/index.html` to `MAIN_PAGES` and glob `episodes/*.html` into the sitemap URL set (with `lastmod` from file mtime or episode date). The local build order that produces a coherent commit is: `build_episodes.mjs` (writes pages) **then** `build_deal_pages.py` (regenerates sitemap now including those pages). This keeps one sitemap owner and eliminates the wipe race. *(This edit lives in the BD Data Base repo — see Phase G.)*
- [ ] **Step 3: Manual verify (the load-bearing check):** `node scripts/build_episodes.mjs` then:
  - `ls episodes/*.html | wc -l` equals RSS item count
  - `grep -c "PodcastEpisode" episodes/*.html` > 0
  - `grep "BEGIN EPISODES" sitemap.xml` present and block lists every page
  - open 2–3 pages in Chrome; confirm AtaiBeckley resolves to a real `deals/…html`, a no-slug deal resolves to `deal.html?id=`, and an un-ingested deal is plain text
  - **idempotency check (fixed inputs):** re-run **only** `build_episodes.mjs` (NOT `refresh_deal_index.mjs`) → `git status` shows **no diff**. The invariant is "same deal-index + same RSS → identical bytes." A diff after re-running `refresh_deal_index.mjs` is *expected and desirable* (BD ingested a new deal → a link upgraded) — that's the self-heal, not a bug.
- [ ] **Step 4: Commit** — `git commit -m "feat(episodes): RSS-gated build orchestrator + sitemap episodes block"`

### Task E2: refresh_deal_index

**Files:** Create `scripts/refresh_deal_index.mjs`; Output `assets/deal-index.json`
- [ ] **Step 1: Verify the id/key-space match FIRST (resolves reviewer #5):** `deal-slugs.json` is keyed by a 32-char hex hash. Before writing any code, confirm which Supabase column equals that key space — spot-check that the id column value for the Lilly/AtaiBeckley row is a key in `deal-slugs.json` whose value is `eli-lilly-and-ataibeckley-2026`. If the DB primary key ≠ the slug-map key, **every** `has_slug` lookup silently returns false and every deal degrades to interactive, defeating the static-link SEO goal. Use whichever column matches; name it `deal_id` in the output.
- [ ] **Step 2 (PINNED schema — the plan's earlier `buyer/target/year` names DO NOT EXIST):** table is **`deals_enriched`**; select **`deal_id,buyer_name,target_name,announcement_date`**. There is **no `year` column** — derive `year = new Date(announcement_date).getUTCFullYear()`. Emit rows as `{ deal_id, buyer: buyer_name, target: target_name, year }`. **Keyset-paginate** (order by `deal_id`, 500/page, cursor on last `deal_id`) — a plain `.select()` caps at Supabase's 1,000-row default and would silently truncate ~1,300 deals. Set `has_slug = (deal_id in deal-slugs.json)`; write `assets/deal-index.json` (`{ deals:[…] }`) **sorted by deal_id**. Verified reachable: `GET /rest/v1/deals_enriched?select=deal_id,buyer_name,target_name,announcement_date` returns rows with the publishable key.
- [ ] **Step 3: Manual verify:** run it; confirm `assets/deal-index.json` has ~1,300 rows and the AtaiBeckley row has `has_slug:true` and its `deal_id` maps to `eli-lilly-and-ataibeckley-2026` in `deal-slugs.json`.
- [ ] **Step 4: Commit** — `git commit -m "feat(episodes): deal-index refresh from Supabase for episode linking"`

> **Cadence note (Bin's concern #2):** `refresh_deal_index.mjs` runs before each `build_episodes.mjs`. Because BD ingests deals on its own schedule, a deal mentioned today may only get a `deal_id`/slug days later. The build re-resolves every mention each run, so links upgrade plain→interactive→static automatically as BD catches up. `pending_deal_links.json` is the observability surface for what's still un-ingested — never a broken link, just a not-yet-a-link.

---

## Phase F — SEO regression coverage + catch-up run

### Task F1: extend seo_link_graph integration test

**Files:** Modify `tests/seo_link_graph.integration.mjs`
- [ ] **Step 1: Mirror the existing build-guard.** The current test already self-guards on `deals/index.html` and skips cleanly when unbuilt (lines ~38–41). Add the same pattern: `const EP_BUILT = fs.existsSync('episodes/index.html')`; wrap all new assertions in `if (EP_BUILT) {…}` (or `test(..., { skip: !EP_BUILT })`). Without this, `node --test tests/*.integration.mjs` goes **red on any clean checkout/CI where the episode build hasn't run** — and `npm test` (unit only) never builds.
- [ ] **Step 2:** Add assertions (guarded): (a) every `episodes/*.html` contains `PodcastEpisode` JSON-LD + a canonical tag; (b) `episodes/index.html` contains `PodcastSeries`; (c) every episode page URL appears in `sitemap.xml`; (d) no episode page links to a `deals/<slug>.html` that doesn't exist on disk (broken-static-link guard).
- [ ] **Step 3:** With a build present: `node scripts/build_episodes.mjs && npm run test:integration` → PASS. On a clean tree (no build): `npm run test:integration` → PASS via skip.
- [ ] **Step 4: Commit** — `git commit -m "test(episodes): SEO + sitemap coverage for episode pages (build-guarded)"`

### Task F2: Catch-up backfill (one command)

- [ ] **Step 1:** `node scripts/import_transcripts.mjs --all` (bulk-copy historical transcripts from the engine archive).
- [ ] **Step 2:** `node scripts/refresh_deal_index.mjs && node scripts/build_episodes.mjs` — the **same** steady-state build; because it's RSS-gated it backfills exactly the episodes that actually published.
- [ ] **Step 3: Verify** page count matches RSS history; spot-check an early episode (pre-`story_index` → should render listen-only or regex-fallback, never crash). Commit generated pages: `git commit -m "content(episodes): backfill transcript pages for published back-catalog"`

---

## Phase G — Auto-update wiring

### Task G1: hook into publish-site

**Files:** Modify `C:\Users\xadro\OneDrive\…\BD Data Base\scripts\publish_site.ps1` (the real `publish-site` runner) + `…\build_deal_pages.py` (sitemap owner). Confirmed behavior: operates on the home clone `C:\Users\xadro\the-pharma-closeout`, `git pull --no-edit` (**no reset --hard — local commits are safe**), regenerates `deals/`+`sitemap.xml`+`llms.txt`, then `git add deals sitemap.xml llms.txt assets/deal-slugs.json` + commit + push.
- [ ] **Step 1 (build_deal_pages.py):** include episodes in the sitemap (add `/episodes/index.html` to `MAIN_PAGES`; glob `episodes/*.html`). Run it locally, diff `sitemap.xml`, confirm all deal pages still present + episodes now listed (no regression).
- [ ] **Step 2 (publish_site.ps1):** after `git pull`, **before** the `build_deal_pages.py` call, insert (each guarded so a failure logs and continues — must never break the deal-page publish): `node scripts/refresh_deal_index.mjs`, `node scripts/import_transcripts.mjs`, `node scripts/build_episodes.mjs`. Extend the git-add scope to `git add deals sitemap.xml llms.txt assets/deal-slugs.json assets/deal-index.json episodes`. Order guarantees episodes exist before the sitemap regen globs them.
- [ ] **Step 2: Verify** one live publish cycle: an episode Bin published that day appears at its URL within the deploy window; a day he skipped produces no new page and no error.
- [ ] **Step 3: Commit** (in claude-brain) — `git commit -m "feat(site): generate episode transcript pages in daily publish"`

---

## Phase H — One-time Google Search Console nudge (SEO item 2/3 finish)

**Not code — Bin's ~2-minute manual step, after Phase G's first successful deploy.** Document in `docs/marketing/`:
- [ ] In GSC: **URL Inspection** on `https://thepharmacloseout.com/episodes/` → **Request Indexing** (index page only; crawler discovers the rest via the sitemap + internal links).
- [ ] Confirm `sitemap.xml` still shows **Success** in GSC → **Sitemaps** (it re-reads automatically; no resubmit needed — the episodes block is inside the already-submitted file).
- [ ] Repeat the URL-inspection nudge once for the newest 1–2 episode pages to seed discovery. Then leave it to passive crawl (1–6 weeks), consistent with the 7/17 audit.

> **This does not re-run the SEO audit.** The 7/17 deployment stands. Episodes are a new surface layered on the existing sitemap + GSC property: same file, one indexing nudge, plus the new `PodcastEpisode`/`PodcastSeries` schema.

---

## Review Loop
After writing/executing: dispatch one plan-document-reviewer (spec = this file's Design Decisions). Fix issues, re-review. Reviewers advisory; explain disagreements.

## Execution Handoff
Two options once approved: **(1) Subagent-driven** — one fresh subagent per task with review between (recommended; Phases A–C are cleanly independent pure modules). **(2) Inline** — batch with checkpoints. Model routing: pure-module tasks (A–E) are mechanical enough for Sonnet builders under an Opus orchestrator; the deal-matching heuristics (B1/B2) and the live-publish wiring (G) want Opus review.
