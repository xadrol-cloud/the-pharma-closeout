// Pulls all deals from Supabase (deals_enriched) and writes assets/deal-index.json,
// the lookup consumed by the episode deal-linker.
//
// Usage: node scripts/refresh_deal_index.mjs

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(ROOT, 'assets');
const SLUGS_PATH = path.join(ASSETS_DIR, 'deal-slugs.json');
const OUTPUT_PATH = path.join(ASSETS_DIR, 'deal-index.json');

const SUPABASE_BASE = 'https://nuqhlvlslwroupedduog.supabase.co/rest/v1/deals_enriched';
const SUPABASE_APIKEY = 'sb_publishable_amtSGMKyQTDPPjkUHcoquw_uoSZfipS';
const SELECT = 'deal_id,buyer_name,target_name,announcement_date';
const PAGE_SIZE = 1000;

async function fetchPage(cursor) {
  const params = new URLSearchParams({
    select: SELECT,
    order: 'deal_id.asc',
    limit: String(PAGE_SIZE),
  });
  if (cursor) {
    params.set('deal_id', `gt.${cursor}`);
  }
  const url = `${SUPABASE_BASE}?${params.toString()}`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_APIKEY },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase request failed (${res.status}): ${body}`);
  }
  return res.json();
}

async function fetchAllDeals() {
  const all = [];
  let cursor = null;
  let pageNum = 0;

  while (true) {
    pageNum += 1;
    const page = await fetchPage(cursor);
    all.push(...page);
    console.log(`Page ${pageNum}: fetched ${page.length} rows (running total ${all.length})`);

    if (page.length < PAGE_SIZE) {
      break;
    }
    cursor = page[page.length - 1].deal_id;
  }

  return all;
}

function yearFromDate(announcementDate) {
  if (!announcementDate) return null;
  const d = new Date(announcementDate);
  if (Number.isNaN(d.getTime())) return null;
  return d.getUTCFullYear();
}

async function main() {
  console.log('Reading deal-slugs.json...');
  const slugsRaw = await readFile(SLUGS_PATH, 'utf8');
  const slugs = JSON.parse(slugsRaw);

  console.log('Fetching deals from Supabase (keyset pagination)...');
  const rows = await fetchAllDeals();
  console.log(`Total rows fetched: ${rows.length}`);

  if (rows.length <= 1000) {
    throw new Error(
      `Pagination looks broken: only ${rows.length} rows fetched (expected ~1,300). Aborting without writing output.`
    );
  }

  const deals = rows
    .map((row) => ({
      deal_id: row.deal_id,
      buyer: row.buyer_name,
      target: row.target_name,
      year: yearFromDate(row.announcement_date),
      has_slug: Object.prototype.hasOwnProperty.call(slugs, row.deal_id),
    }))
    .sort((a, b) => (a.deal_id < b.deal_id ? -1 : a.deal_id > b.deal_id ? 1 : 0));

  const output = { deals };

  await writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${deals.length} deals to ${OUTPUT_PATH}`);

  // Verification: AtaiBeckley / Eli Lilly deal (target_name in Supabase is "AtaiBeckley Inc.").
  const atai = deals.find((d) => typeof d.target === 'string' && d.target.startsWith('AtaiBeckley'));
  if (!atai) {
    console.error('VERIFY FAILED: no deal found with target starting with "AtaiBeckley"');
    process.exitCode = 1;
    return;
  }

  console.log('AtaiBeckley row:', JSON.stringify(atai, null, 2));

  const expectedSlug = 'eli-lilly-and-ataibeckley-2026';
  const actualSlug = slugs[atai.deal_id];
  const slugMatches = actualSlug === expectedSlug;

  console.log(`deal-slugs.json[${atai.deal_id}] = ${actualSlug}`);
  console.log(`Expected slug: ${expectedSlug} -> match: ${slugMatches}`);
  console.log(`has_slug flag: ${atai.has_slug}`);

  if (!slugMatches || !atai.has_slug || atai.buyer !== 'Eli Lilly and Company' && !/eli lilly/i.test(atai.buyer)) {
    console.error('VERIFY WARNING: AtaiBeckley row did not fully match expectations.');
    process.exitCode = 1;
  } else {
    console.log('VERIFY OK: AtaiBeckley row matches expected id/slug/buyer.');
  }
}

main().catch((err) => {
  console.error('refresh_deal_index.mjs failed:', err);
  process.exitCode = 1;
});
