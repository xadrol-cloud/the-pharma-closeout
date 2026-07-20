import test from 'node:test';
import assert from 'node:assert/strict';
import { renderEpisode } from '../scripts/lib/render_episode.mjs';
import { renderEpisodeIndex } from '../scripts/lib/render_episode_index.mjs';

const BASE_EPISODE = {
  slug: '2026-07-19-gsk-camlipixant-p2x3-cough',
  title: 'GSK Kills Camlipixant: The P2X3 Cough Bet Just Went to Zero',
  date: '2026-07-19',
  description: 'GSK wrote off most of a $2 billion bet as camlipixant becomes the third P2X3 antagonist to fail in chronic cough.',
  spotifyEpisodeUrl: 'https://open.spotify.com/episode/abc123',
  segments: [
    {
      title: 'Cold Open',
      turns: [
        { speaker: 'Alex', role: 'host', text: 'This week Lilly closed AtaiBeckley in a big deal.' },
        { speaker: 'Maya', role: 'host', text: 'GSK walked away from camlipixant entirely.' },
      ],
    },
    {
      title: 'Deal Landscape',
      turns: [
        { speaker: 'Marcus', role: 'guest', text: 'The AtaiBeckley deal tells you Lilly is buying categories.' },
      ],
    },
  ],
};

const RESOLVED = {
  links: [
    { entity: 'AtaiBeckley', dealId: 'd1', href: 'deals/eli-lilly-and-ataibeckley-2026.html', state: 'static' },
  ],
  pending: [],
};

test('renderEpisode: includes PodcastEpisode JSON-LD with datePublished and canonical link', () => {
  const html = renderEpisode(BASE_EPISODE, RESOLVED);

  assert.match(html, /"@type":\s*"PodcastEpisode"/);
  assert.match(html, /"datePublished":\s*"2026-07-19"/);
  assert.match(html, /<link rel="canonical" href="https:\/\/thepharmacloseout\.com\/episodes\/2026-07-19-gsk-camlipixant-p2x3-cough\.html">/);
  assert.match(html, /"partOfSeries"/);
  assert.match(html, /"PodcastSeries"/);
  assert.match(html, /"associatedMedia"/);
  assert.match(html, /https:\/\/open\.spotify\.com\/episode\/abc123/);
});

test('renderEpisode: escapes title/description in head', () => {
  const html = renderEpisode(BASE_EPISODE, RESOLVED);
  assert.match(html, /<title>GSK Kills Camlipixant: The P2X3 Cough Bet Just Went to Zero — The Pharma Closeout<\/title>/);
  assert.match(html, /<meta name="description" content="GSK wrote off most of a \$2 billion bet/);
});

test('renderEpisode: injects a deal link at first mention in transcript', () => {
  const html = renderEpisode(BASE_EPISODE, RESOLVED);
  assert.match(html, /<a class="deal" href="\/deals\/eli-lilly-and-ataibeckley-2026\.html">AtaiBeckley<\/a>/);
});

test('renderEpisode: "Deals mentioned" rail lists a link even if entity is absent from all turn text (safety net)', () => {
  const resolvedWithGhost = {
    links: [
      { entity: 'Moderna', dealId: 'd9', href: 'deals/some-moderna-deal-2026.html', state: 'static' },
    ],
    pending: [],
  };
  const html = renderEpisode(BASE_EPISODE, resolvedWithGhost);
  // Entity text never appears in any turn (BASE_EPISODE has no "Moderna" mention),
  // but the rail must still surface the href.
  assert.match(html, /Deals mentioned in this episode/);
  assert.match(html, /href="\/deals\/some-moderna-deal-2026\.html"/);
  assert.match(html, /Moderna/);
});

test('renderEpisode: rail omitted when resolved.links is empty', () => {
  const html = renderEpisode(BASE_EPISODE, { links: [], pending: [] });
  assert.doesNotMatch(html, /Deals mentioned in this episode/);
});

test('renderEpisode: listen-only mode (no segments) has the show embed but no transcript turns, still has schema', () => {
  const listenOnly = { ...BASE_EPISODE, segments: [] };
  const html = renderEpisode(listenOnly, { links: [], pending: [] });

  assert.match(html, /open\.spotify\.com\/embed/);
  assert.doesNotMatch(html, /class="turn/);
  assert.doesNotMatch(html, /Deals mentioned in this episode/);
  assert.match(html, /"@type":\s*"PodcastEpisode"/);
});

test('renderEpisode: listen-only mode omits transcript section entirely when segments absent (undefined)', () => {
  const { segments, ...noSegments } = BASE_EPISODE;
  const html = renderEpisode(noSegments, { links: [], pending: [] });
  assert.doesNotMatch(html, /class="turn/);
  assert.match(html, /open\.spotify\.com\/embed/);
});

test('renderEpisode: listen bar always includes the show embed iframe, plus episode link when non-empty', () => {
  const html = renderEpisode(BASE_EPISODE, RESOLVED);
  assert.match(html, /open\.spotify\.com\/embed\/show\/6bib0887ucySx51e49M3tp/);
  assert.match(html, /https:\/\/open\.spotify\.com\/episode\/abc123/);
});

test('renderEpisode: omits "Listen on Spotify" episode link when spotifyEpisodeUrl is empty', () => {
  const noLink = { ...BASE_EPISODE, spotifyEpisodeUrl: '' };
  const html = renderEpisode(noLink, RESOLVED);
  assert.match(html, /open\.spotify\.com\/embed\/show\/6bib0887ucySx51e49M3tp/);
  // Should still validly render — associatedMedia falls back to the show URL.
  assert.match(html, /"contentUrl":\s*"https:\/\/open\.spotify\.com\/show\/6bib0887ucySx51e49M3tp"/);
});

test('renderEpisode: escapes turn text content (XSS-safe)', () => {
  const withXss = {
    ...BASE_EPISODE,
    segments: [
      { title: 'Cold Open', turns: [{ speaker: 'Alex', role: 'host', text: 'Beware <script>alert(1)</script> & "quotes"' }] },
    ],
  };
  const html = renderEpisode(withXss, { links: [], pending: [] });
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});

test('renderEpisode: guest turns get the "guest" class, host turns do not', () => {
  const html = renderEpisode(BASE_EPISODE, RESOLVED);
  assert.match(html, /<div class="turn guest">[\s\S]*?Marcus/);
  assert.match(html, /<div class="turn">[\s\S]*?Alex/);
});

test('renderEpisode: segment title rendered with .seg class', () => {
  const html = renderEpisode(BASE_EPISODE, RESOLVED);
  assert.match(html, /<div class="seg">Cold Open<\/div>/);
  assert.match(html, /<div class="seg">Deal Landscape<\/div>/);
});

test('renderEpisode: deal link only injected once even if entity could match twice', () => {
  const episodeRepeated = {
    ...BASE_EPISODE,
    segments: [
      {
        title: 'Cold Open',
        turns: [
          { speaker: 'Alex', role: 'host', text: 'AtaiBeckley deal, then AtaiBeckley again.' },
        ],
      },
    ],
  };
  const html = renderEpisode(episodeRepeated, RESOLVED);
  const matches = html.match(/<a class="deal" href="\/deals\/eli-lilly-and-ataibeckley-2026\.html">AtaiBeckley<\/a>/g);
  assert.equal(matches.length, 1);
  // second occurrence remains plain text
  assert.match(html, /again\./);
});

test('renderEpisode: mockup style block is copied verbatim (spot-check key selectors)', () => {
  const html = renderEpisode(BASE_EPISODE, RESOLVED);
  assert.match(html, /--gold:#c49332/);
  assert.match(html, /a\.deal\{color:var\(--gold\)/);
  assert.match(html, /\.related\{margin:44px 0/);
  // The pink ribbon MARKUP is mockup-only annotation and must not render,
  // even though its CSS rule may still be present as part of the verbatim style block.
  assert.doesNotMatch(html, /class="mock-note"/);
  assert.doesNotMatch(html, /MOCKUP for review/);
});

test('renderEpisode: subscribe CTA and footer present', () => {
  const html = renderEpisode(BASE_EPISODE, RESOLVED);
  assert.match(html, /Close out your day/);
  assert.match(html, /The Pharma Closeout &middot; Daily pharma intelligence|The Pharma Closeout · Daily pharma intelligence/);
});

// ---- renderEpisodeIndex ----

test('renderEpisodeIndex: contains PodcastSeries JSON-LD', () => {
  const html = renderEpisodeIndex([
    { slug: 'ep-1', title: 'Episode One', date: '2026-07-01' },
  ]);
  assert.match(html, /"@type":\s*"PodcastSeries"/);
});

test('renderEpisodeIndex: links to each episode slug with title and date, newest first', () => {
  const list = [
    { slug: 'ep-1', title: 'Episode One', date: '2026-07-01' },
    { slug: 'ep-3', title: 'Episode Three', date: '2026-07-19' },
    { slug: 'ep-2', title: 'Episode Two', date: '2026-07-10' },
  ];
  const html = renderEpisodeIndex(list);

  for (const ep of list) {
    assert.match(html, new RegExp(`href="${ep.slug}\\.html"`));
    assert.match(html, new RegExp(ep.title));
  }

  const idx1 = html.indexOf('ep-3');
  const idx2 = html.indexOf('ep-2');
  const idx3 = html.indexOf('ep-1');
  assert.ok(idx1 < idx2 && idx2 < idx3, 'expected newest-first ordering: ep-3, ep-2, ep-1');
});

test('renderEpisodeIndex: handles empty list without throwing', () => {
  const html = renderEpisodeIndex([]);
  assert.match(html, /"@type":\s*"PodcastSeries"/);
});
