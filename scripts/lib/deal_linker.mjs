// Pure module: resolve an episode's story_index entities into deal links.
// No network/CDN/Supabase imports.
//
// Matching precision (a wrong link is worse than none):
//   1. PAIR match — a deal whose BOTH buyer and target are named in the SAME
//      story uniquely identifies the exact deal discussed (story names
//      "Eli Lilly" + "AtaiBeckley" -> the Lilly/AtaiBeckley deal).
//   2. TARGET-only fallback — an entity equal to a deal's target (the acquired
//      company is specific enough to pin one deal).
//   BARE-BUYER matches are deliberately NOT linked: "GSK"/"Novartis" alone would
//   resolve to an arbitrary deal by that serial acquirer and mislead readers.
//
// story_index is a top-level JSON array (legacy {stories:[...]} accepted
// defensively). Entities split across companies / mentioned_companies (target
// usually here) / drugs / mentioned_drugs; only company fields identify a deal
// party, so drugs are not used for matching (they land in neither links nor the
// pending company list).

import { normalizeCompany } from './deal_index.mjs';
import { dealUrl } from '../../assets/deal-links.mjs';

const pickNewest = (cands) =>
  cands.reduce((best, cur) => (best === null || (cur.year ?? 0) > (best.year ?? 0) ? cur : best), null);

export function resolveDealLinks(storiesRaw, index) {
  const stories = Array.isArray(storiesRaw) ? storiesRaw : (storiesRaw?.stories ?? []);
  const deals = index?.deals ?? [];

  const links = [];
  const seenDealIds = new Set();
  const matchedNorms = new Set();   // normalized entities that produced a link
  const allCompanies = new Map();   // norm -> first surface form (for pending)

  const addLink = (deal, surface) => {
    if (!deal || seenDealIds.has(deal.deal_id)) return;
    seenDealIds.add(deal.deal_id);
    const href = dealUrl(deal.deal_id);
    links.push({
      entity: surface,
      dealId: deal.deal_id,
      href,
      state: href.startsWith('deals/') ? 'static' : 'interactive',
      buyer: deal.buyer,
      target: deal.target,
    });
    matchedNorms.add(normalizeCompany(surface));
  };

  for (const story of stories) {
    const companies = [...(story?.companies ?? []), ...(story?.mentioned_companies ?? [])];
    const norm = new Map(); // norm -> surface, this story's companies
    for (const c of companies) {
      if (!c) continue;
      const n = normalizeCompany(c);
      if (!n) continue;
      if (!norm.has(n)) norm.set(n, c);
      if (!allCompanies.has(n)) allCompanies.set(n, c);
    }

    // PAIR match ONLY — a deal whose buyer AND target are both named in this
    // story. This is an actual deal being discussed. We deliberately do NOT
    // fall back to lone company matches: big-pharma names (GSK, Novartis, Merck)
    // appear as the target in old carve-outs/mergers, so a lone match links to
    // an unrelated historical deal. Both parties named = unambiguous; anything
    // less is left unlinked.
    const pairs = deals.filter(
      (d) => norm.has(normalizeCompany(d.buyer)) && norm.has(normalizeCompany(d.target)),
    );
    for (const d of pairs) {
      const surface = norm.get(normalizeCompany(d.target)) || d.target;
      addLink(d, surface);
      matchedNorms.add(normalizeCompany(d.buyer)); // buyer's deal is linked too
    }
  }

  // pending = company entities that never produced a link (drugs excluded).
  const pending = [...allCompanies.entries()]
    .filter(([n]) => !matchedNorms.has(n))
    .map(([, surface]) => surface)
    .sort();

  return { links, pending };
}
