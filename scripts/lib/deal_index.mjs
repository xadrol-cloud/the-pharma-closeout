// Pure module: match a company/entity name to a deal in a lookup index.
// No network/CDN/Supabase imports.

const SUFFIX_WORDS = new Set([
  'inc', 'ltd', 'plc', 'corp', 'corporation', 'company', 'co',
  'holding', 'holdings', 'ag', 'sa', 'nv',
  'pharmaceuticals', 'pharmaceutical', 'pharma',
  'therapeutics', 'biosciences', 'bio', 'and',
]);

/**
 * Normalize a company name for matching: lowercase, strip punctuation,
 * remove common corporate suffix/connector words, collapse whitespace.
 * @param {string} name
 * @returns {string}
 */
export function normalizeCompany(name) {
  if (!name) return '';
  const lowered = name.toLowerCase();
  // Strip punctuation (keep letters, digits, whitespace)
  const noPunct = lowered.replace(/[^\p{L}\p{N}\s]/gu, ' ');
  const words = noPunct
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => !SUFFIX_WORDS.has(w));
  return words.join(' ').trim();
}

/**
 * Find the best-matching deal for an entity name.
 * Prefers a normalized target match; falls back to a normalized buyer match.
 * Ties broken by newest year.
 * @param {string} entity
 * @param {{deals: Array<{deal_id: string, buyer: string, target: string, year: number, has_slug: boolean}>}} index
 * @returns {object|null}
 */
export function matchDeal(entity, index) {
  const deals = index?.deals ?? [];
  const normEntity = normalizeCompany(entity);
  if (!normEntity) return null;

  const pickNewest = (candidates) =>
    candidates.reduce((best, cur) => (best === null || cur.year > best.year ? cur : best), null);

  const targetMatches = deals.filter((d) => normalizeCompany(d.target) === normEntity);
  if (targetMatches.length > 0) {
    return pickNewest(targetMatches);
  }

  const buyerMatches = deals.filter((d) => normalizeCompany(d.buyer) === normEntity);
  if (buyerMatches.length > 0) {
    return pickNewest(buyerMatches);
  }

  return null;
}
