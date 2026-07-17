// tests/seo_link_graph.integration.mjs
//
// Link-graph + sitemap integrity audit for the full SSG deal-page build.
// Verifies, post-build, that:
//   1. sitemap.xml and the on-disk deals/ tree are in parity
//   2. every flat deal page (deals/<slug>.html) is reachable from >=1 hub page
//   3. every hub page (deals/by-year|by-acquirer|by-ta) is reachable from deals/index.html,
//      and the root deals.html links to deals/index.html
//   4. every <lastmod> in the sitemap is a valid YYYY-MM-DD (optionally cross-checked
//      against an SSG_LASTMOD_MAP JSON file)
//   5. a sampled set of deal pages carries the GA4 tag, canonical link, and JSON-LD
//   6. assets/deal-slugs.json is well-formed and every slug maps to a real file
//
// This suite is meaningless before a full SSG build has produced deals/index.html,
// so every test guards on that file's existence and skips cleanly (exit 0) when absent.
//
// Run: node --test tests/seo_link_graph.integration.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const DEALS_DIR = path.join(ROOT, 'deals');
const DEALS_INDEX = path.join(DEALS_DIR, 'index.html');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');
const ROOT_DEALS_HTML = path.join(ROOT, 'deals.html');
const SLUG_MAP_PATH = path.join(ROOT, 'assets', 'deal-slugs.json');

const SITE_ORIGIN = 'https://thepharmacloseout.com';
const GA4_ID = 'G-K6XEWCK7W4';

// The whole suite only makes sense against a fully built site. Guard once,
// up front, and skip every test individually so `node --test` reports a
// clean, green (but explicitly skipped) run on a pre-build checkout.
const BUILD_PRESENT = fs.existsSync(DEALS_INDEX);
const SKIP_REASON = 'run after full SSG build (deals/index.html not found)';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function readIfExists(p) {
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}

/** Recursively list files under `dir` matching `re`, relative to `dir`. */
function listFilesRecursive(dir, re) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFilesRecursive(full, re).map((f) => path.join(entry.name, f)));
    } else if (re.test(entry.name)) {
      out.push(entry.name);
    }
  }
  return out;
}

/** All *.html files directly inside deals/ (i.e. flat deal pages), excluding index.html. */
function listFlatDealPages() {
  return fs
    .readdirSync(DEALS_DIR, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.html') && e.name !== 'index.html')
    .map((e) => e.name)
    .sort();
}

/** All hub subdirectories: deals/by-year, deals/by-acquirer, deals/by-ta, etc. */
function listHubDirs() {
  return fs
    .readdirSync(DEALS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith('by-'))
    .map((e) => e.name);
}

/** All hub html files under deals/by-<kind>/ (one level deep), relative to deals/. */
function listHubFiles() {
  const files = [];
  for (const hubDir of listHubDirs()) {
    const abs = path.join(DEALS_DIR, hubDir);
    for (const name of fs.readdirSync(abs).filter((n) => n.endsWith('.html'))) {
      files.push(path.join(hubDir, name));
    }
  }
  return files;
}

/** Extract every href="..." value from an HTML string. */
function extractHrefs(html) {
  const hrefs = [];
  const re = /href\s*=\s*"([^"]*)"/gi;
  let m;
  while ((m = re.exec(html)) !== null) hrefs.push(m[1]);
  return hrefs;
}

/** Extract every <loc>...</loc> value from the sitemap. */
function extractLocs(xml) {
  const locs = [];
  const re = /<loc>([^<]*)<\/loc>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) locs.push(m[1].trim());
  return locs;
}

/** Extract every <url> block's loc + lastmod pair from the sitemap. */
function extractUrlEntries(xml) {
  const entries = [];
  const re = /<url>([\s\S]*?)<\/url>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const block = m[1];
    const loc = /<loc>([^<]*)<\/loc>/i.exec(block)?.[1]?.trim() ?? null;
    const lastmod = /<lastmod>([^<]*)<\/lastmod>/i.exec(block)?.[1]?.trim() ?? null;
    entries.push({ loc, lastmod });
  }
  return entries;
}

/** Given an href found in a hub/index page, return the bare deal-page filename
 *  it points to (e.g. "pfizer-seagen-2023.html") if it targets deals/<file>.html,
 *  otherwise null. Handles absolute site URLs and relative forms
 *  ("x.html", "./x.html", "../x.html", "deals/x.html", "/deals/x.html"). */
function extractDealFilenameFromHref(href, { fromDealsIndex }) {
  if (!href) return null;
  let rest = null;
  if (href.startsWith(`${SITE_ORIGIN}/deals/`)) {
    rest = href.slice(`${SITE_ORIGIN}/deals/`.length);
  } else if (href.startsWith('/deals/')) {
    rest = href.slice('/deals/'.length);
  } else if (href.startsWith('deals/')) {
    rest = href.slice('deals/'.length);
  } else if (fromDealsIndex) {
    // deals/index.html links to sibling flat pages with a bare relative href
    const cleaned = href.replace(/^\.\//, '');
    if (/^[^/]+\.html(?:[?#].*)?$/.test(cleaned) && cleaned !== 'index.html') {
      rest = cleaned;
    }
  }
  if (rest == null) return null;
  rest = rest.split(/[?#]/)[0]; // strip query/hash
  if (!rest.endsWith('.html') || rest.includes('/')) return null;
  return rest;
}

/** Given an href found on the root deals.html or a hub-listing page, does it
 *  point at deals/index.html (absolute or relative)? */
function hrefTargetsDealsIndex(href) {
  if (!href) return false;
  const noHashQuery = href.split(/[?#]/)[0];
  return (
    noHashQuery === `${SITE_ORIGIN}/deals/index.html` ||
    noHashQuery === `${SITE_ORIGIN}/deals/` ||
    noHashQuery === '/deals/index.html' ||
    noHashQuery === '/deals/' ||
    noHashQuery === 'deals/index.html' ||
    noHashQuery === 'deals/' ||
    noHashQuery === './deals/index.html'
  );
}

/** Does href (found inside deals/index.html) point at the given hub file
 *  (relative path like "by-year/2026.html")? */
function hrefTargetsHubFile(href, hubRelPath) {
  if (!href) return false;
  const noHashQuery = href.split(/[?#]/)[0];
  const normalizedHub = hubRelPath.replace(/\\/g, '/');
  return (
    noHashQuery === `${SITE_ORIGIN}/deals/${normalizedHub}` ||
    noHashQuery === `/deals/${normalizedHub}` ||
    noHashQuery === `deals/${normalizedHub}` ||
    noHashQuery === `./${normalizedHub}` ||
    noHashQuery === normalizedHub
  );
}

function formatOffenders(list, max = 10) {
  const shown = list.slice(0, max);
  const more = list.length > max ? ` ... (+${list.length - max} more)` : '';
  return shown.join(', ') + more;
}

// ---------------------------------------------------------------------------
// Test 1 — sitemap <-> disk parity
// ---------------------------------------------------------------------------

test('sitemap <-> disk parity for /deals/ URLs', { skip: BUILD_PRESENT ? false : SKIP_REASON }, () => {
  const xml = readIfExists(SITEMAP_PATH);
  assert.ok(xml, `sitemap.xml missing at ${SITEMAP_PATH}`);

  const locs = extractLocs(xml).filter((u) => u.startsWith(`${SITE_ORIGIN}/deals/`));
  const sitemapDealPaths = new Set(locs.map((u) => u.slice(SITE_ORIGIN.length + 1))); // "deals/..."

  const onDiskFlat = listFlatDealPages().map((f) => `deals/${f}`);
  const onDiskHub = listHubFiles().map((f) => `deals/${f.replace(/\\/g, '/')}`);
  const onDiskIndex = fs.existsSync(DEALS_INDEX) ? ['deals/index.html'] : [];
  const onDiskAll = new Set([...onDiskFlat, ...onDiskHub, ...onDiskIndex]);

  // sitemap URLs whose file does not exist on disk
  const missingOnDisk = [...sitemapDealPaths].filter((p) => !fs.existsSync(path.join(ROOT, p)));
  // on-disk deal html files not present in the sitemap
  const missingInSitemap = [...onDiskAll].filter((p) => !sitemapDealPaths.has(p));

  assert.equal(
    missingOnDisk.length,
    0,
    `${missingOnDisk.length}/${sitemapDealPaths.size} sitemap /deals/ URLs have no matching file on disk. ` +
      `Examples: ${formatOffenders(missingOnDisk)}`
  );
  assert.equal(
    missingInSitemap.length,
    0,
    `${missingInSitemap.length}/${onDiskAll.size} on-disk deals/**/*.html files are missing from sitemap.xml. ` +
      `Examples: ${formatOffenders(missingInSitemap)}`
  );
});

// ---------------------------------------------------------------------------
// Test 2 — no orphan deal pages
// ---------------------------------------------------------------------------

test('no orphan deal pages (every flat deal page has >=1 inbound hub link)', { skip: BUILD_PRESENT ? false : SKIP_REASON }, () => {
  const flatPages = listFlatDealPages();
  assert.ok(flatPages.length > 0, 'no flat deals/*.html pages found on disk');

  const hubFiles = [...listHubFiles(), 'index.html']; // deals/index.html included
  const linked = new Set();

  for (const rel of hubFiles) {
    const abs = path.join(DEALS_DIR, rel);
    const html = readIfExists(abs);
    if (!html) continue;
    const fromDealsIndex = rel === 'index.html';
    for (const href of extractHrefs(html)) {
      const filename = extractDealFilenameFromHref(href, { fromDealsIndex });
      if (filename) linked.add(filename);
    }
  }

  const orphans = flatPages.filter((f) => !linked.has(f));
  assert.equal(
    orphans.length,
    0,
    `${orphans.length}/${flatPages.length} flat deal pages have no inbound link from any hub page. ` +
      `Examples: ${formatOffenders(orphans)}`
  );
});

// ---------------------------------------------------------------------------
// Test 3 — hub reachability
// ---------------------------------------------------------------------------

test('every hub page is reachable from deals/index.html, and deals.html links to deals/index.html', { skip: BUILD_PRESENT ? false : SKIP_REASON }, () => {
  const indexHtml = readIfExists(DEALS_INDEX);
  assert.ok(indexHtml, `deals/index.html missing at ${DEALS_INDEX}`);
  const indexHrefs = extractHrefs(indexHtml);

  const hubFiles = listHubFiles().map((f) => f.replace(/\\/g, '/'));
  assert.ok(hubFiles.length > 0, 'no hub files found under deals/by-*/');

  const unreachable = hubFiles.filter(
    (hubRel) => !indexHrefs.some((href) => hrefTargetsHubFile(href, hubRel))
  );
  assert.equal(
    unreachable.length,
    0,
    `${unreachable.length}/${hubFiles.length} hub pages are not linked from deals/index.html. ` +
      `Examples: ${formatOffenders(unreachable)}`
  );

  const rootHtml = readIfExists(ROOT_DEALS_HTML);
  assert.ok(rootHtml, `root deals.html missing at ${ROOT_DEALS_HTML}`);
  const rootHrefs = extractHrefs(rootHtml);
  const linksToIndex = rootHrefs.some(hrefTargetsDealsIndex);
  assert.ok(linksToIndex, 'root deals.html does not contain a link to deals/index.html');
});

// ---------------------------------------------------------------------------
// Test 4 — lastmod sanity
// ---------------------------------------------------------------------------

test('sitemap lastmod values are valid dates (optionally cross-checked)', { skip: BUILD_PRESENT ? false : SKIP_REASON }, () => {
  const xml = readIfExists(SITEMAP_PATH);
  assert.ok(xml, `sitemap.xml missing at ${SITEMAP_PATH}`);

  const entries = extractUrlEntries(xml);
  assert.ok(entries.length > 0, 'no <url> entries found in sitemap.xml');

  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  const invalid = entries.filter((e) => !e.lastmod || !DATE_RE.test(e.lastmod) || Number.isNaN(Date.parse(e.lastmod)));
  assert.equal(
    invalid.length,
    0,
    `${invalid.length}/${entries.length} sitemap entries have an invalid <lastmod>. ` +
      `Examples: ${formatOffenders(invalid.map((e) => `${e.loc} => ${e.lastmod}`))}`
  );

  const mapPath = process.env.SSG_LASTMOD_MAP;
  if (!mapPath) {
    console.log('SSG_LASTMOD_MAP not set — skipping lastmod cross-check against external map');
    return;
  }

  assert.ok(fs.existsSync(mapPath), `SSG_LASTMOD_MAP points to a nonexistent file: ${mapPath}`);
  const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

  const mismatches = [];
  for (const e of entries) {
    const entry = map[e.loc];
    const expected = entry && typeof entry === 'object' ? entry.date : entry;
    if (expected != null && expected !== e.lastmod) {
      mismatches.push(`${e.loc}: expected ${expected}, got ${e.lastmod}`);
    }
  }
  assert.equal(
    mismatches.length,
    0,
    `${mismatches.length} sitemap lastmod values disagree with SSG_LASTMOD_MAP. ` +
      `Examples: ${formatOffenders(mismatches)}`
  );
});

// ---------------------------------------------------------------------------
// Test 5 — on-page SEO invariants (sampled)
// ---------------------------------------------------------------------------

test('sampled deal pages carry GA4 tag, canonical link, and JSON-LD', { skip: BUILD_PRESENT ? false : SKIP_REASON }, () => {
  const flatPages = listFlatDealPages(); // already alphabetically sorted
  assert.ok(flatPages.length > 0, 'no flat deals/*.html pages found on disk');

  const STRIDE = 25;
  const sampleSet = new Set();
  for (let i = 0; i < flatPages.length; i += STRIDE) sampleSet.add(flatPages[i]);
  sampleSet.add(flatPages[0]);
  sampleSet.add(flatPages[flatPages.length - 1]);
  const sample = [...sampleSet].sort();

  const failures = [];
  for (const filename of sample) {
    const html = readIfExists(path.join(DEALS_DIR, filename));
    if (!html) {
      failures.push(`${filename}: file unreadable`);
      continue;
    }
    const missing = [];
    if (!html.includes(GA4_ID)) missing.push('GA4 tag');
    if (!/rel\s*=\s*"canonical"/i.test(html)) missing.push('canonical link');
    if (!/application\/ld\+json/i.test(html)) missing.push('JSON-LD');
    if (missing.length) failures.push(`${filename}: missing ${missing.join(', ')}`);
  }

  assert.equal(
    failures.length,
    0,
    `${failures.length}/${sample.length} sampled deal pages fail SEO invariants. ` +
      `Examples: ${formatOffenders(failures)}`
  );
});

// ---------------------------------------------------------------------------
// Test 6 — slug map integrity
// ---------------------------------------------------------------------------

test('assets/deal-slugs.json is well-formed and every slug resolves to a real file', { skip: BUILD_PRESENT ? false : SKIP_REASON }, () => {
  assert.ok(fs.existsSync(SLUG_MAP_PATH), `assets/deal-slugs.json missing at ${SLUG_MAP_PATH}`);

  const raw = fs.readFileSync(SLUG_MAP_PATH, 'utf8');
  let map;
  assert.doesNotThrow(() => {
    map = JSON.parse(raw);
  }, 'assets/deal-slugs.json is not valid JSON');

  const entries = Object.entries(map);
  assert.ok(entries.length > 0, 'assets/deal-slugs.json is empty');

  const slugs = entries.map(([, slug]) => slug);
  const seen = new Map();
  const duplicates = [];
  for (const [dealId, slug] of entries) {
    if (seen.has(slug)) duplicates.push(`${slug} (${seen.get(slug)}, ${dealId})`);
    else seen.set(slug, dealId);
  }
  assert.equal(
    duplicates.length,
    0,
    `${duplicates.length} duplicate slug values in deal-slugs.json. Examples: ${formatOffenders(duplicates)}`
  );

  const missingFiles = entries
    .filter(([, slug]) => !fs.existsSync(path.join(DEALS_DIR, `${slug}.html`)))
    .map(([dealId, slug]) => `${dealId} => deals/${slug}.html`);
  assert.equal(
    missingFiles.length,
    0,
    `${missingFiles.length}/${slugs.length} slug-map entries have no matching deals/<slug>.html file. ` +
      `Examples: ${formatOffenders(missingFiles)}`
  );
});
