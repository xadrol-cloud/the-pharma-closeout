// scripts/lib/rss.mjs
//
// Minimal, dependency-free RSS parser for the podcast feed's episode gate.
// Uses regex/string parsing only — no XML library.

/**
 * Decode basic HTML/XML entities used in RSS text nodes.
 * @param {string} str
 * @returns {string}
 */
function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

/**
 * Strip HTML tags from a string.
 * @param {string} str
 * @returns {string}
 */
function stripHtmlTags(str) {
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Extract and clean the text content of a single RSS/XML tag from a block
 * of XML. Handles CDATA sections and decodes entities. Does NOT strip HTML
 * tags (callers decide whether that's appropriate for the field).
 *
 * @param {string} block - XML fragment to search within (e.g. one <item>...</item>)
 * @param {string} tagName - tag to extract, e.g. 'title'
 * @returns {string} trimmed, decoded text content, or '' if not found
 */
function extractTagText(block, tagName) {
  const re = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'i');
  const match = block.match(re);
  if (!match) return '';

  let raw = match[1];

  const cdataMatch = raw.match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
  if (cdataMatch) {
    raw = cdataMatch[1];
  }

  return decodeEntities(raw.trim());
}

/**
 * Parse a podcast RSS XML string into an array of episode items.
 * Pure function — no I/O.
 *
 * @param {string} xmlString
 * @returns {Array<{title: string, date: string, guid: string, link: string, description: string}>}
 */
export function parseRssItems(xmlString) {
  if (!xmlString || typeof xmlString !== 'string') return [];

  const items = [];
  const itemRe = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRe.exec(xmlString)) !== null) {
    const block = match[1];

    const title = extractTagText(block, 'title');
    const guid = extractTagText(block, 'guid');
    const link = extractTagText(block, 'link');
    const description = stripHtmlTags(extractTagText(block, 'description'));
    const pubDate = extractTagText(block, 'pubDate');

    let date = '';
    if (pubDate) {
      const parsed = new Date(pubDate);
      if (!Number.isNaN(parsed.getTime())) {
        date = parsed.toISOString();
      }
    }

    items.push({ title, date, guid, link, description });
  }

  return items;
}

/**
 * Fetch and parse the show's RSS feed.
 * Thin async wrapper around parseRssItems — not unit tested (network call).
 *
 * @param {string} [url]
 * @returns {Promise<Array<{title: string, date: string, guid: string, link: string, description: string}>>}
 */
export async function fetchShowRss(url = 'https://spotifeed.timdorr.com/6bib0887ucySx51e49M3tp') {
  const r = await fetch(url);
  return parseRssItems(await r.text());
}
