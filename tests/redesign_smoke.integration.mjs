// tests/redesign_smoke.integration.mjs
//
// Spec-as-tests smoke suite for the "Closeout redesign" (2026-07-18 plan,
// Task 0). This is intentionally written BEFORE the redesign work lands —
// most checks are expected to FAIL on the pre-redesign worktree and should
// flip to PASS as Tasks 1-4 land.
//
// Zero external deps: fs/path only. Node >= 18.
// Run from the worktree root: node tests/redesign_smoke.integration.mjs
//
// Output contract: one line per check —
//   PASS <check-id> <short description>
//   FAIL <check-id> <description> — <what was found instead>
// followed by a summary line. Exit code 0 iff every check passed.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SUBSTACK_SUBSCRIBE = 'https://thepharmacloseout.substack.com/subscribe';

// ---------------------------------------------------------------------------
// tiny check harness
// ---------------------------------------------------------------------------

const results = [];

/**
 * Register and immediately run one check.
 * @param {string} id - short check id, e.g. "NAV-001"
 * @param {string} description - short human description (used in both PASS/FAIL lines)
 * @param {() => {ok: boolean, found?: string}} fn - returns {ok, found} where
 *   `found` is only used (and required) when ok === false, describing what
 *   was found instead of the expected condition.
 */
function check(id, description, fn) {
  let outcome;
  try {
    outcome = fn();
  } catch (err) {
    outcome = { ok: false, found: `threw ${err && err.message ? err.message : String(err)}` };
  }
  const ok = !!(outcome && outcome.ok);
  results.push({ id, description, ok, found: outcome && outcome.found });
  if (ok) {
    console.log(`PASS ${id} ${description}`);
  } else {
    console.log(`FAIL ${id} ${description} — ${outcome && outcome.found ? outcome.found : 'condition not met'}`);
  }
}

// ---------------------------------------------------------------------------
// file helpers
// ---------------------------------------------------------------------------

function readIfExists(relPath) {
  const abs = path.join(ROOT, relPath);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
}

/** Extract the first <nav ...>...</nav> block from an HTML string, or null. */
function extractNav(html) {
  if (html == null) return null;
  const m = /<nav[\s\S]*?<\/nav>/i.exec(html);
  return m ? m[0] : null;
}

/** Extract the substring of `html` for a section identified by `id="<sectionId>"`,
 *  from that tag's opening `<` through the NEXT top-level sibling section boundary.
 *  Since these are ad-hoc HTML files (not parsed DOM), we take a pragmatic approach:
 *  find the opening tag containing id="<sectionId>", then take everything from there
 *  up to (but not including) the next `<section` or `<footer` tag at the same nesting
 *  depth heuristic — in practice: the next occurrence of `<section` or `<footer` after
 *  the opening tag's end, OR end of file. This is intentionally permissive (a superset
 *  of the true section) since these are presence checks, not exclusivity checks. */
function extractSectionById(html, sectionId) {
  if (html == null) return null;
  const openRe = new RegExp(`<(section|div)\\b[^>]*\\bid=["']${sectionId}["'][^>]*>`, 'i');
  const openMatch = openRe.exec(html);
  if (!openMatch) return null;
  const start = openMatch.index;
  const afterOpenTag = start + openMatch[0].length;
  const nextBoundaryRe = /<(section|footer)\b/gi;
  nextBoundaryRe.lastIndex = afterOpenTag;
  const boundaryMatch = nextBoundaryRe.exec(html);
  const end = boundaryMatch ? boundaryMatch.index : html.length;
  return html.slice(start, end);
}

/** Match anchor ELEMENTS (not CSS rules) whose class attribute contains `cls`.
 *  Guards against `.btn-primary { ... }` CSS rules inside <style> blocks by
 *  requiring an actual `<a ...>` opening tag with a class="..." attribute. */
function findAnchorElementsWithClass(html, cls) {
  const re = new RegExp(`<a\\b[^>]*class="[^"]*\\b${cls}\\b[^"]*"[^>]*>`, 'gi');
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) out.push(m[0]);
  return out;
}

function hrefOf(anchorTag) {
  const m = /href\s*=\s*"([^"]*)"/i.exec(anchorTag);
  return m ? m[1] : null;
}

/** Extract every href="..." value from an HTML string. */
function extractHrefs(html) {
  const hrefs = [];
  const re = /href\s*=\s*"([^"]*)"/gi;
  let m;
  while ((m = re.exec(html)) !== null) hrefs.push(m[1]);
  return hrefs;
}

/** Does this href look like a local root-relative or relative .html link
 *  (as opposed to an external URL, mailto:, tel:, hash-only, etc.)? */
function isLocalHtmlHref(href) {
  if (!href) return false;
  if (/^https?:\/\//i.test(href)) return false;
  if (/^(mailto|tel|javascript):/i.test(href)) return false;
  if (href.startsWith('#')) return false;
  const bare = href.split(/[?#]/)[0];
  return bare.endsWith('.html');
}

/** Resolve a local href found in `fromFile` (relative to ROOT) to an absolute
 *  filesystem path, honoring root-relative ("/x.html") vs relative ("x.html",
 *  "./x.html", "../x.html") forms. */
function resolveLocalHref(href, fromFileRelToRoot) {
  const bare = href.split(/[?#]/)[0];
  if (bare.startsWith('/')) {
    return path.join(ROOT, bare);
  }
  const fromDir = path.dirname(path.join(ROOT, fromFileRelToRoot));
  return path.resolve(fromDir, bare);
}

// ---------------------------------------------------------------------------
// shared fixtures
// ---------------------------------------------------------------------------

const indexHtml = readIfExists('index.html');
const indexNav = extractNav(indexHtml);

const ALL_STATIC_PAGES = [
  'index.html',
  'about.html',
  'ai-research.html',
  'deals.html',
  'methodology.html',
  'compare.html',
  'hype-gap.html',
  'acquirers.html',
  'browse.html',
  'hindsight.html',
];

const REQUIRED_NAV_LABELS = ['Podcast', 'Deal Intelligence', 'Newsletter', 'About', 'Subscribe'];

// ===========================================================================
// NAV-* — index.html nav block checks
// ===========================================================================

check('NAV-001', 'index.html has an extractable <nav>...</nav> block', () => {
  if (indexHtml == null) return { ok: false, found: 'index.html does not exist' };
  return { ok: !!indexNav, found: 'no <nav>...</nav> match in index.html' };
});

check('NAV-002', 'index.html nav contains Podcast link targeting #day', () => {
  if (!indexNav) return { ok: false, found: 'no nav block extracted' };
  const ok = /<a\b[^>]*href="[^"]*#day"[^>]*>\s*Podcast\s*<\/a>/i.test(indexNav)
    || (/>\s*Podcast\s*<\/a>/i.test(indexNav) && /href="[^"]*#day"/i.test(indexNav));
  return { ok, found: ok ? undefined : 'no Podcast link targeting #day found in nav' };
});

check('NAV-003', 'index.html nav contains Deal Intelligence link targeting deals.html', () => {
  if (!indexNav) return { ok: false, found: 'no nav block extracted' };
  const ok = /<a\b[^>]*href="[^"]*deals\.html[^"]*"[^>]*>\s*Deal Intelligence\s*<\/a>/i.test(indexNav);
  return { ok, found: ok ? undefined : 'no Deal Intelligence link targeting deals.html found in nav' };
});

check('NAV-004', 'index.html nav contains Newsletter link targeting #news', () => {
  if (!indexNav) return { ok: false, found: 'no nav block extracted' };
  const ok = /<a\b[^>]*href="[^"]*#news"[^>]*>\s*Newsletter\s*<\/a>/i.test(indexNav);
  return { ok, found: ok ? undefined : 'no Newsletter link targeting #news found in nav' };
});

check('NAV-005', 'index.html nav contains About link targeting about.html', () => {
  if (!indexNav) return { ok: false, found: 'no nav block extracted' };
  const ok = /<a\b[^>]*href="[^"]*about\.html[^"]*"[^>]*>\s*About\s*<\/a>/i.test(indexNav);
  return { ok, found: ok ? undefined : 'no About link targeting about.html found in nav' };
});

check('NAV-006', 'index.html nav contains a Subscribe CTA targeting the substack subscribe URL', () => {
  if (!indexNav) return { ok: false, found: 'no nav block extracted' };
  const anchors = indexNav.match(/<a\b[^>]*>[\s\S]*?<\/a>/gi) || [];
  const ok = anchors.some((a) => /subscribe/i.test(a) && a.includes(SUBSTACK_SUBSCRIBE));
  return { ok, found: ok ? undefined : `no anchor with Subscribe text/href starting ${SUBSTACK_SUBSCRIBE} found in nav` };
});

check('NAV-007', 'index.html nav does NOT contain ai-research.html', () => {
  if (!indexNav) return { ok: false, found: 'no nav block extracted' };
  const ok = !indexNav.includes('ai-research.html');
  return { ok, found: ok ? undefined : 'nav still links to ai-research.html' };
});

check('NAV-008', 'index.html does not contain /jobs or a "job" nav item anywhere in the file', () => {
  if (indexHtml == null) return { ok: false, found: 'index.html does not exist' };
  const hasJobsPath = /\/jobs\b/i.test(indexHtml);
  const hasJobWord = /\bjob(s)?\b/i.test(indexHtml);
  const ok = !hasJobsPath && !hasJobWord;
  const bits = [];
  if (hasJobsPath) bits.push('/jobs path present');
  if (hasJobWord) bits.push('"job(s)" word present');
  return { ok, found: ok ? undefined : bits.join('; ') };
});

// ===========================================================================
// HERO-* — index.html S1 hero checks
// ===========================================================================

check('HERO-001', 'index.html contains exact mission line', () => {
  if (indexHtml == null) return { ok: false, found: 'index.html does not exist' };
  const ok = indexHtml.includes('Your edge in pharma — the daily brief and the deal record.');
  return { ok, found: ok ? undefined : 'exact mission line string not found' };
});

check('HERO-002', 'index.html contains hero CTA "Play today\'s episode"', () => {
  if (indexHtml == null) return { ok: false, found: 'index.html does not exist' };
  const ok = indexHtml.includes("Play today's episode");
  return { ok, found: ok ? undefined : 'CTA text "Play today\'s episode" not found' };
});

check('HERO-003', 'index.html contains hero CTA "Explore Deal Intelligence"', () => {
  if (indexHtml == null) return { ok: false, found: 'index.html does not exist' };
  const ok = indexHtml.includes('Explore Deal Intelligence');
  return { ok, found: ok ? undefined : 'CTA text "Explore Deal Intelligence" not found' };
});

check('HERO-004', 'index.html hero uses min-height:85vh (or 88vh), not 100vh/calc(100vh', () => {
  if (indexHtml == null) return { ok: false, found: 'index.html does not exist' };
  const hasApproved = /min-height\s*:\s*8[58]vh/i.test(indexHtml);
  const hasBanned = /min-height\s*:\s*100vh/i.test(indexHtml) || /calc\(\s*100vh/i.test(indexHtml);
  const ok = hasApproved && !hasBanned;
  const bits = [];
  if (!hasApproved) bits.push('no min-height:85vh/88vh found');
  if (hasBanned) bits.push('banned 100vh/calc(100vh pattern present');
  return { ok, found: ok ? undefined : bits.join('; ') };
});

// ===========================================================================
// S2-* — index.html section 2 (podcast/day)
// ===========================================================================

check('S2-001', 'index.html S2 contains Spotify show embed', () => {
  if (indexHtml == null) return { ok: false, found: 'index.html does not exist' };
  const ok = indexHtml.includes('open.spotify.com/embed/show/6bib0887ucySx51e49M3tp');
  return { ok, found: ok ? undefined : 'Spotify embed URL not found in index.html' };
});

check('S2-002', 'index.html S2 section has id="day"', () => {
  if (indexHtml == null) return { ok: false, found: 'index.html does not exist' };
  const ok = /\bid="day"/.test(indexHtml);
  return { ok, found: ok ? undefined : 'id="day" not found in index.html' };
});

// ===========================================================================
// S3-* — index.html section 3 (deal intelligence)
// ===========================================================================

check('S3-001', 'index.html S3 links to hype-gap.html', () => {
  if (indexHtml == null) return { ok: false, found: 'index.html does not exist' };
  const ok = indexHtml.includes('hype-gap.html');
  return { ok, found: ok ? undefined : 'hype-gap.html link not found in index.html' };
});

check('S3-002', 'index.html S3 links to deals/index.html (or deals.html)', () => {
  if (indexHtml == null) return { ok: false, found: 'index.html does not exist' };
  const ok = indexHtml.includes('deals/index.html') || indexHtml.includes('deals.html');
  return { ok, found: ok ? undefined : 'neither deals/index.html nor deals.html link found' };
});

check('S3-003', 'index.html S3 contains text "1,329"', () => {
  if (indexHtml == null) return { ok: false, found: 'index.html does not exist' };
  const ok = indexHtml.includes('1,329');
  return { ok, found: ok ? undefined : '"1,329" not found in index.html' };
});

// ===========================================================================
// S4-* — index.html section 4 (newsletter/news)
// ===========================================================================

check('S4-001', 'index.html S4 section has id="news"', () => {
  if (indexHtml == null) return { ok: false, found: 'index.html does not exist' };
  const ok = /\bid="news"/.test(indexHtml);
  return { ok, found: ok ? undefined : 'id="news" not found in index.html' };
});

check('S4-002', 'index.html S4 contains an articles container', () => {
  if (indexHtml == null) return { ok: false, found: 'index.html does not exist' };
  const ok = /class="[^"]*\bart-list\b[^"]*"/.test(indexHtml) || /class="[^"]*\barticles\b[^"]*"/i.test(indexHtml);
  return { ok, found: ok ? undefined : 'no .art-list or .articles container found' };
});

check('S4-003', 'index.html S4 contains a thepharmacloseout.substack.com link', () => {
  if (indexHtml == null) return { ok: false, found: 'index.html does not exist' };
  const ok = indexHtml.includes('thepharmacloseout.substack.com');
  return { ok, found: ok ? undefined : 'no thepharmacloseout.substack.com reference found' };
});

check('S4-004', 'index.html S4 has a form/link whose action or href starts with the substack subscribe URL', () => {
  if (indexHtml == null) return { ok: false, found: 'index.html does not exist' };
  const formActionRe = /<form\b[^>]*action="(https:\/\/thepharmacloseout\.substack\.com\/subscribe[^"]*)"/i;
  const anchorHrefRe = /<a\b[^>]*href="(https:\/\/thepharmacloseout\.substack\.com\/subscribe[^"]*)"/i;
  const ok = formActionRe.test(indexHtml) || anchorHrefRe.test(indexHtml);
  return { ok, found: ok ? undefined : 'no <form action="https://thepharmacloseout.substack.com/subscribe...> or matching <a href> found' };
});

check('S4-005', 'index.html footer contains "We never sell your identity"', () => {
  if (indexHtml == null) return { ok: false, found: 'index.html does not exist' };
  const ok = indexHtml.includes('We never sell your identity');
  return { ok, found: ok ? undefined : 'trust line "We never sell your identity" not found' };
});

// ===========================================================================
// SEO-* — index.html SEO checks
// ===========================================================================

check('SEO-001', 'index.html has canonical link to https://thepharmacloseout.com/', () => {
  if (indexHtml == null) return { ok: false, found: 'index.html does not exist' };
  const ok = indexHtml.includes('<link rel="canonical" href="https://thepharmacloseout.com/"');
  return { ok, found: ok ? undefined : 'canonical link tag not found (or does not match exactly)' };
});

check('SEO-002', 'index.html has GA4 gtag script (googletagmanager.com/gtag)', () => {
  if (indexHtml == null) return { ok: false, found: 'index.html does not exist' };
  const ok = indexHtml.includes('googletagmanager.com/gtag');
  return { ok, found: ok ? undefined : 'googletagmanager.com/gtag not found' };
});

check('SEO-003', 'index.html has at least one application/ld+json block', () => {
  if (indexHtml == null) return { ok: false, found: 'index.html does not exist' };
  const count = (indexHtml.match(/application\/ld\+json/g) || []).length;
  return { ok: count >= 1, found: count >= 1 ? undefined : `found ${count} application/ld+json occurrences` };
});

check('SEO-004', 'index.html has a meta description tag', () => {
  if (indexHtml == null) return { ok: false, found: 'index.html does not exist' };
  const ok = /<meta\s+name="description"/i.test(indexHtml);
  return { ok, found: ok ? undefined : 'no <meta name="description"> found' };
});

check('SEO-005', 'index.html has a noscript fallback', () => {
  if (indexHtml == null) return { ok: false, found: 'index.html does not exist' };
  const ok = /<noscript/i.test(indexHtml);
  return { ok, found: ok ? undefined : 'no <noscript> block found' };
});

// ===========================================================================
// PAGE-NAV-* — every static page's nav block, same 4 labels + Subscribe
// ===========================================================================

for (const page of ALL_STATIC_PAGES) {
  const idBase = `PAGE-NAV-${page.replace(/\.html$/, '').toUpperCase()}`;
  const html = readIfExists(page);
  const nav = extractNav(html);

  check(`${idBase}-EXISTS`, `${page} has an extractable <nav>...</nav> block`, () => {
    if (html == null) return { ok: false, found: `${page} does not exist` };
    return { ok: !!nav, found: nav ? undefined : `no <nav>...</nav> match in ${page}` };
  });

  for (const label of REQUIRED_NAV_LABELS) {
    check(`${idBase}-${label.replace(/\s+/g, '').toUpperCase()}`, `${page} nav contains "${label}"`, () => {
      if (!nav) return { ok: false, found: 'no nav block extracted' };
      let ok;
      if (label === 'Subscribe') {
        const anchors = nav.match(/<a\b[^>]*>[\s\S]*?<\/a>/gi) || [];
        ok = anchors.some((a) => /subscribe/i.test(a) && a.includes(SUBSTACK_SUBSCRIBE));
      } else {
        const re = new RegExp(`<a\\b[^>]*>\\s*${label}\\s*<\\/a>`, 'i');
        ok = re.test(nav);
      }
      return { ok, found: ok ? undefined : `"${label}" nav item not found in ${page}'s nav block` };
    });
  }
}

// ===========================================================================
// ABOUT-* — about.html specific checks
// ===========================================================================

check('ABOUT-001', 'about.html contains admin@thepharmacloseout.com', () => {
  const html = readIfExists('about.html');
  if (html == null) return { ok: false, found: 'about.html does not exist' };
  const ok = html.includes('admin@thepharmacloseout.com');
  return { ok, found: ok ? undefined : 'admin@thepharmacloseout.com not found' };
});

check('ABOUT-002', 'about.html does NOT match "For advisory and consulting inquiries"', () => {
  const html = readIfExists('about.html');
  if (html == null) return { ok: false, found: 'about.html does not exist' };
  const matched = /For advisory and consulting inquiries/i.test(html);
  return { ok: !matched, found: matched ? 'the phrase "For advisory and consulting inquiries" is still present' : undefined };
});

// ===========================================================================
// AIR-* — ai-research.html specific checks
// ===========================================================================

check('AIR-001', 'ai-research.html first <a> element with class btn-primary links to substack subscribe (not a CSS rule)', () => {
  const html = readIfExists('ai-research.html');
  if (html == null) return { ok: false, found: 'ai-research.html does not exist' };
  const anchors = findAnchorElementsWithClass(html, 'btn-primary');
  if (anchors.length === 0) {
    return { ok: false, found: 'no <a> element with class containing "btn-primary" found' };
  }
  const firstHref = hrefOf(anchors[0]);
  const ok = !!firstHref && firstHref.startsWith(SUBSTACK_SUBSCRIBE);
  return {
    ok,
    found: ok ? undefined : `first btn-primary anchor href is "${firstHref}", expected it to start with ${SUBSTACK_SUBSCRIBE}`,
  };
});

check('AIR-002', 'ai-research.html still contains a Gumroad compendium link', () => {
  const html = readIfExists('ai-research.html');
  if (html == null) return { ok: false, found: 'ai-research.html does not exist' };
  const ok = /gumroad\.com/i.test(html);
  return { ok, found: ok ? undefined : 'no gumroad.com reference found' };
});

check('AIR-003', 'ai-research.html does NOT contain "Your email is collected for delivery only"', () => {
  const html = readIfExists('ai-research.html');
  if (html == null) return { ok: false, found: 'ai-research.html does not exist' };
  const matched = html.includes('Your email is collected for delivery only');
  return { ok: !matched, found: matched ? 'the string is still present' : undefined };
});

// ===========================================================================
// LINK-* — link integrity + zero href="#" in index.html
// ===========================================================================

check('LINK-001', 'index.html contains zero href="#" placeholders', () => {
  if (indexHtml == null) return { ok: false, found: 'index.html does not exist' };
  const count = (indexHtml.match(/href="#"/g) || []).length;
  return { ok: count === 0, found: count === 0 ? undefined : `found ${count} occurrences of href="#"` };
});

check('LINK-002', 'every root-relative/relative .html href in index.html resolves to a file on disk', () => {
  if (indexHtml == null) return { ok: false, found: 'index.html does not exist' };
  const hrefs = extractHrefs(indexHtml).filter(isLocalHtmlHref);
  const missing = [];
  for (const href of hrefs) {
    const abs = resolveLocalHref(href, 'index.html');
    if (!fs.existsSync(abs)) missing.push(href);
  }
  const ok = missing.length === 0;
  return {
    ok,
    found: ok ? undefined : `${missing.length} broken local .html href(s): ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? ` ...(+${missing.length - 10} more)` : ''}`,
  };
});

// ===========================================================================
// summary
// ===========================================================================

const total = results.length;
const passed = results.filter((r) => r.ok).length;
const failed = total - passed;

console.log('');
console.log(`SUMMARY: ${passed}/${total} passed, ${failed} failed`);

if (failed > 0) {
  console.log('');
  console.log('Failing checks:');
  for (const r of results.filter((r) => !r.ok)) {
    console.log(`  - ${r.id}: ${r.description}`);
  }
}

process.exit(failed === 0 ? 0 : 1);
