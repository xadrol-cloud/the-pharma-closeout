// build_episodes.mjs — RSS-gated episode-page build.
//
// Source of truth for "what published" = the Spotify RSS feed (Bin publishes
// manually and skips days). For each PUBLISHED item we find the committed
// transcript, render episodes/<slug>.html, build episodes/index.html, and log
// unresolved deal mentions to episodes/pending_deal_links.json.
//
// This script does NOT write sitemap.xml — build_deal_pages.py owns the sitemap
// and is extended to include episodes/ (single owner, no wipe race).
//
// Idempotent: same RSS + same deal-index + same transcripts -> identical bytes.
// Deal links self-heal on each run as BD ingests deals (plain -> interactive ->
// static) because we re-resolve every mention against the current index/slug-map.

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseTranscript } from './lib/transcript.mjs'
import { resolveDealLinks } from './lib/deal_linker.mjs'
import { renderEpisode } from './lib/render_episode.mjs'
import { renderEpisodeIndex } from './lib/render_episode_index.mjs'
import { fetchShowRss } from './lib/rss.mjs'
import { _setSlugMap } from '../assets/deal-links.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const P = (...p) => join(ROOT, ...p)

const SHOW_URL = 'https://open.spotify.com/show/6bib0887ucySx51e49M3tp'

/** Deterministic slug for listen-only episodes with no stored front-matter. */
function slugify(title, date) {
  const afterPipe = title.includes('|') ? title.split('|').pop() : title
  const base = afterPipe
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8)
    .join('-')
  return `${date}-${base}`
}

/** Strip a "Week in Review | " / "Daily Roundup | " prefix for display. */
function cleanTitle(title) {
  return title.includes('|') ? title.split('|').slice(1).join('|').trim() : title.trim()
}

/** Parse simple YAML front-matter; returns { data, body }. */
function readFrontMatter(text) {
  if (!text.startsWith('---')) return { data: {}, body: text }
  const end = text.indexOf('\n---', 3)
  if (end === -1) return { data: {}, body: text }
  const fm = text.slice(3, end)
  const body = text.slice(end + 4).replace(/^\r?\n/, '')
  const data = {}
  for (const line of fm.split(/\r?\n/)) {
    const m = line.match(/^([a-zA-Z_]+):\s*(.*)$/)
    if (m) data[m[1]] = m[2].trim().replace(/^["'](.*)["']$/, '$1') // strip quotes
  }
  return { data, body }
}

const SITE = 'https://thepharmacloseout.com'
const EP_BEGIN = '  <!-- BEGIN EPISODES -->'
const EP_END = '  <!-- END EPISODES -->'

/** Insert/replace the delimited episodes block in sitemap.xml (idempotent). */
function writeSitemapEpisodes(list) {
  const path = P('sitemap.xml')
  if (!existsSync(path)) return
  let xml = readFileSync(path, 'utf8')
  // Preserve the file's existing line ending (it's CRLF, written by the Python
  // SSG on Windows) so injecting the block yields a minimal diff, not a whole-
  // file EOL flip.
  const eol = xml.includes('\r\n') ? '\r\n' : '\n'
  // Drop any existing block (and its surrounding EOLs) so re-runs are stable.
  xml = xml.replace(new RegExp(`(\\r?\\n)?${EP_BEGIN}[\\s\\S]*?${EP_END}(\\r?\\n)?`), '$1')
  const lines = [EP_BEGIN]
  if (list.length) {
    lines.push(`  <url><loc>${SITE}/episodes/index.html</loc><lastmod>${list[0].date}</lastmod></url>`)
  }
  for (const ep of list) {
    lines.push(`  <url><loc>${SITE}/episodes/${ep.slug}.html</loc><lastmod>${ep.date}</lastmod></url>`)
  }
  lines.push(EP_END)
  xml = xml.replace('</urlset>', `${lines.join(eol)}${eol}</urlset>`)
  writeFileSync(path, xml)
}

async function main() {
  // 1. Seed the slug map from disk — WITHOUT this every deal degrades to the
  //    interactive deal.html?id= link (dealUrl reads this module-level map).
  const slugMap = JSON.parse(readFileSync(P('assets/deal-slugs.json'), 'utf8'))
  _setSlugMap(slugMap)

  // 2. Load the deal index (buyer/target/year/has_slug) for entity matching.
  const dealIndex = existsSync(P('assets/deal-index.json'))
    ? JSON.parse(readFileSync(P('assets/deal-index.json'), 'utf8'))
    : { deals: [] }

  // 3. Published episodes (the gate). Skipped days simply aren't here.
  const items = await fetchShowRss()
  if (!items.length) {
    console.error('build_episodes: RSS returned 0 items — aborting (no gate).')
    process.exit(1)
  }

  mkdirSync(P('episodes'), { recursive: true })

  // Clean stale generated pages so a changed slug never orphans an old file.
  for (const f of readdirSync(P('episodes'))) {
    if (f.endsWith('.html')) rmSync(P('episodes', f))
  }

  const contentDir = P('content/episodes')
  const haveContent = existsSync(contentDir)
    ? new Set(readdirSync(contentDir))
    : new Set()

  const indexList = []
  const pendingAll = new Set()
  const seenDates = new Set()
  let withTranscript = 0
  let listenOnly = 0

  for (const item of items) {
    if (!item.date) continue
    const date = item.date.slice(0, 10) // YYYY-MM-DD

    // One page per published date (a date maps to one episode transcript).
    if (seenDates.has(date)) continue
    seenDates.add(date)

    // The RSS feed is the published truth — derive slug + display title from it
    // (reliable for every episode, unlike parsing old engine metadata blocks).
    const slug = slugify(item.title, date)
    const title = cleanTitle(item.title)
    let description = item.description || ''
    let segments = []
    let resolved = { links: [], pending: [] }

    if (haveContent.has(`${date}.md`)) {
      const raw = readFileSync(join(contentDir, `${date}.md`), 'utf8')
      const { data, body } = readFrontMatter(raw)
      if (data.description) description = data.description // authored one, if present
      segments = parseTranscript(body).segments
      if (haveContent.has(`${date}.stories.json`)) {
        const stories = JSON.parse(readFileSync(join(contentDir, `${date}.stories.json`), 'utf8'))
        resolved = resolveDealLinks(stories, dealIndex)
        resolved.pending.forEach(p => pendingAll.add(p))
      }
      withTranscript++
    } else {
      // Published but no transcript on disk -> listen-only page (still indexed).
      listenOnly++
    }

    const episode = { slug, title, date, description, spotifyEpisodeUrl: item.link || SHOW_URL, segments }
    const html = renderEpisode(episode, resolved)
    writeFileSync(P('episodes', `${slug}.html`), html)
    indexList.push({ slug, title, date })
  }

  // 4. Index page (newest first) + pending log (sorted for stable bytes).
  indexList.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  writeFileSync(P('episodes/index.html'), renderEpisodeIndex(indexList))
  writeFileSync(
    P('episodes/pending_deal_links.json'),
    JSON.stringify([...pendingAll].sort(), null, 2) + '\n',
  )

  // 5. Sitemap (SEO): inject an idempotent, delimited episodes block. We own
  //    only the block between the markers; build_deal_pages.py preserves it on
  //    its daily regen. Deterministic order (newest first) -> stable bytes.
  writeSitemapEpisodes(indexList)

  console.log(`build_episodes: ${indexList.length} pages (${withTranscript} with transcript, ${listenOnly} listen-only), ${pendingAll.size} pending deal mentions.`)
}

main().catch(e => { console.error(e); process.exit(1) })
