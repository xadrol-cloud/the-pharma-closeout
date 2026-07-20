// tests/episodes.integration.mjs
//
// Post-build integrity audit for the episode transcript pages. Verifies that:
//   1. every episodes/<slug>.html carries PodcastEpisode JSON-LD + a canonical link
//   2. episodes/index.html carries PodcastSeries JSON-LD
//   3. every episode page URL appears in sitemap.xml (SEO discoverability)
//   4. no episode page links to a deals/<slug>.html that doesn't exist on disk
//      (broken static-link guard)
//
// Meaningless before `node scripts/build_episodes.mjs` has produced
// episodes/index.html, so every test guards on that file and skips cleanly.
//
// Run: node --test tests/episodes.integration.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const EP_DIR = path.join(ROOT, 'episodes');
const EP_INDEX = path.join(EP_DIR, 'index.html');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');
const DEALS_DIR = path.join(ROOT, 'deals');

const EP_BUILT = fs.existsSync(EP_INDEX);
const SKIP = 'run after `node scripts/build_episodes.mjs` (episodes/index.html not found)';

function episodePages() {
  if (!fs.existsSync(EP_DIR)) return [];
  return fs.readdirSync(EP_DIR).filter((f) => f.endsWith('.html') && f !== 'index.html');
}

test('every episode page has PodcastEpisode JSON-LD and a canonical link', { skip: EP_BUILT ? false : SKIP }, () => {
  const pages = episodePages();
  assert.ok(pages.length > 0, 'expected at least one episode page');
  for (const f of pages) {
    const html = fs.readFileSync(path.join(EP_DIR, f), 'utf8');
    assert.match(html, /"@type":\s*"PodcastEpisode"/, `${f} missing PodcastEpisode schema`);
    assert.match(html, /<link rel="canonical" href="https:\/\/thepharmacloseout\.com\/episodes\/[^"]+\.html">/, `${f} missing/!.html canonical`);
  }
});

test('episodes index carries PodcastSeries JSON-LD', { skip: EP_BUILT ? false : SKIP }, () => {
  const html = fs.readFileSync(EP_INDEX, 'utf8');
  assert.match(html, /"@type":\s*"PodcastSeries"/);
});

test('every episode page URL appears in sitemap.xml', { skip: EP_BUILT ? false : SKIP }, () => {
  const sitemap = fs.readFileSync(SITEMAP_PATH, 'utf8');
  for (const f of episodePages()) {
    assert.ok(sitemap.includes(`/episodes/${f}`), `sitemap missing /episodes/${f}`);
  }
  assert.ok(sitemap.includes('/episodes/index.html'), 'sitemap missing episodes index');
});

test('no episode page links to a non-existent static deal page', { skip: EP_BUILT ? false : SKIP }, () => {
  const broken = [];
  for (const f of episodePages()) {
    const html = fs.readFileSync(path.join(EP_DIR, f), 'utf8');
    const hrefs = [...html.matchAll(/href="deals\/([^"]+\.html)"/g)].map((m) => m[1]);
    for (const h of hrefs) {
      if (!fs.existsSync(path.join(DEALS_DIR, h))) broken.push(`${f} -> deals/${h}`);
    }
  }
  assert.deepEqual(broken, [], `broken static deal links:\n${broken.join('\n')}`);
});
