# SEO Fix Runbook — Bin's steps + deploy decision
**Date:** 2026-07-16 · Companion to `docs/2026-07-16-seo-audit.md` (diagnosis) and `docs/superpowers/plans/2026-07-16-seo-fixes.md` (implementation, executed)

## What's built and waiting (nothing is live yet — nothing was pushed)

| Where | Branch | What's on it |
|---|---|---|
| Site worktree `C:\Users\xadro\worktrees\tpc-seo-2026-07` | `seo-2026-07` (from main) | 6 commits: slug-map link routing in deals.js (+compare-pill fix, top-level await), deal.html JS canonical, hub links + keyworded homepage title on root pages, link-graph audit test, regenerated library (1,271 deal pages + 130 hubs + index + sitemap + deal-slugs.json) |
| BD worktree `C:\Users\xadro\worktrees\bd-seo-ssg-2026-07` | `seo-ssg-2026-07` (from jobboard-phase01 HEAD) | 7 commits: content-hash lastmod, slug-map artifact + publish script update, hub generation, related-deals + GA4 on deal pages, pagination-dedupe fix + recursive pruning, seeded lastmod map |

Verified: 16/16 SSG unit tests, 36/36 site unit tests, 6/6 link-graph audit (sitemap⇄disk parity, zero orphan pages, hub reachability, lastmod cross-check, on-page invariants, slug-map integrity), triple-build byte-level idempotency, 215 stale dupe files pruned.

**Production bug found & fixed en route:** unstable Supabase pagination (no `order` clause) was duplicating ~212 rows AND silently dropping ~200 real deals from the nightly build — the sitemap listed only 1,059 of 1,271 deals, with canonical URLs flapping between suffixed/unsuffixed variants night to night. Fixed with `order=deal_id.asc` + dedupe.

## Step 1 — Google Search Console (you; ~10 min; do this first, it gates everything)
1. Go to search.google.com/search-console → Add property → **Domain** → `thepharmacloseout.com`. Copy the TXT record, add it at your DNS registrar, verify. (Fallback if DNS is a pain: **URL prefix** `https://thepharmacloseout.com/` verifies instantly via the existing GA4 tag — you're already logged into that Google account.)
2. Sitemaps → submit `https://thepharmacloseout.com/sitemap.xml`. **Do this AFTER the deploy (Step 3)** so Google fetches the new 1,408-URL version.
3. URL Inspection → Request Indexing (one by one, ~2 min total) for: `deals/index.html`, `deals/by-year/2026.html`, `deals/by-year/2025.html`, `deals/by-year/2024.html`, `deals/by-ta/oncology.html`, top acquirer hubs (`by-acquirer/pfizer.html`, `merck.html`, `astrazeneca.html`, `novartis.html`, `johnson-johnson.html`), `hype-gap.html`, and 3-5 flagship deal pages (e.g. `deals/pfizer-seagen-2023.html`).

## Step 2 — Bing Webmaster Tools (you; ~3 min)
bing.com/webmasters → "Import from Google Search Console" (after Step 1). Bing feeds ChatGPT search — cheap AI-search win. Also manually check Bing's index (`site:thepharmacloseout.com`) — the automated check hit a CAPTCHA.

## Step 3 — Deploy decision (you decide, I execute on your word)
- **Merge order question:** `seo-2026-07` touches `deals.html`, `assets/deals.js`, `index.html` — same files as the in-flight `ux-overhaul-2026-07` branch. Options: (a) merge SEO first (it's smaller/surgical; UX branch rebases over it), or (b) land UX first and rebase SEO. My recommendation: **(a) SEO first** — it's verified end-to-end tonight and every day un-deployed is a day of the indexing clock not running.
- **BD side:** the nightly `publish-site` (6:35 AM) runs whatever branch is checked out in the OneDrive BD working tree (currently `jobboard-phase01`). To activate the new SSG nightly: merge `seo-ssg-2026-07` into `jobboard-phase01` (or your preferred branch) and it picks up automatically — no task re-registration. Until then, the nightly keeps running the OLD generator, which would **overwrite the new site output on its next run** — so merge BOTH sides in the same sitting, or disable `publish-site` for a day.
- Push of the site repo = live deploy via GitHub Pages within minutes.

## Step 4 — What to watch (weeks 1–6, in GSC)
- **Pages → Indexing report:** the funnel Discovered → Crawled → Indexed. Expect "Discovered - currently not indexed" to swell first (normal), then convert. A few hundred indexed by ~6 weeks is a healthy trajectory; near-zero crawling after 2 weeks despite sitemap submission = flag it and we diagnose.
- **Performance report:** first impressions on long-tail queries ("did the X acquisition work", "[buyer] [target] deal"). Clicks lag impressions by weeks.
- GA4: organic sessions landing on `/deals/` pages (they carry the GA4 tag now).

## Known cosmetic items (deliberately not blocking)
- 8 acquirer hubs got `-2` suffixed twins (e.g. `astrazeneca.html` + `astrazeneca-2.html`) because raw buyer names aren't normalized ("AstraZeneca" vs "AstraZeneca plc"). Harmless, self-heals when the BD maintenance queue's company-merge normalization lands. The collision guard prints a WARNING line in the nightly log listing them.
- `deal_outcomes` has no dedupe protection (it's legitimately one-to-many; existing best-row selection tolerates dupes gracefully).

## P2 — the authority flywheel (the actual rank driver; from audit §4)
Nothing above builds backlinks. When ready: quarterly "Pharma Deal Report Card" / flop rankings / Hype Gap as citable stat pages pitched to Endpoints/Fierce/STAT; deep-link every Substack issue, podcast show-note, and LinkedIn post to its `/deals/` page (not the homepage). This is what determines whether organic plateaus at tens/day or compounds.
