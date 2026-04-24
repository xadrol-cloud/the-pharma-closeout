# The Pharma Closeout — Release Notes

## 2026-04-23 — BD Deal Intelligence: search UX + data integrity

**Ship sha:** `d149ca4` on `main` (post-merge + cache-buster bump). Live at `thepharmacloseout.com/deals.html`.

**What shipped**

- Search filters now work. All 5 filter dropdowns (Deal Type, Era, Therapeutic Area, Min Value, Sort) route to valid DB columns and return results. Previously `deal_type` and `era` were dead — every selection returned zero.
- New **Therapeutic Area** chip (16 options covering ~93% of tagged deals).
- New **Sort** chip (Newest / Highest Value / Highest Critic Score / Highest Outcome Score).
- **Load More** pagination — 25-deal pages, appends on click. Replaces the previous hard 50-result cap.
- **Min-query-length gate** — 2-char floor; filter-only browse (no text) still works.
- **Error state** — "temporarily unavailable" message on Supabase errors instead of silently showing an empty grid.
- **Stable sort** — `deal_id` secondary key means paginated offsets return disjoint rows even when the primary sort key has ties.

**Data corrections**

- **3 deal values fixed** with primary-source citations (Sanofi/Lexicon, AbbVie/Genentech*, plus one kept pending). 7 deals in total received attached `primary_source_url` + `value_confidence` + `deal_sources` rows.
- **CS=100 cluster repaired.** The `deals_enriched` view's critic-score formula weighted Neutral sentiment equivalent to Bullish, pinning 82% of scored deals at 100. Now uses a weighted formula (Bullish=100, Neutral=50, Bearish=0). Distribution: CS=100 now **10.7%**, stddev **16.62**, mean **76.53**. Sort-by-Critic-Score is finally informative.
- Outlier audit (`deal_value_usd_mm > $400B`) returns **0 rows**.

**Defense-in-depth**

- Inline value-sanity validator (`scripts/validate_deal_value.py` in the BD Data Base repo) now wraps every write path to the `deals` base table. Absurd values ($400B+ deal values, scores outside 0-100, missing `deal_id`) are logged to `logs/validation_failures.jsonl` and skipped rather than committed.

**Known follow-ups (not shipped in this release)**

- Sanofi/Lexicon and Lilly/Boehringer each have near-duplicate rows in `deals_enriched` — needs a dedup pass.
- `scripts/supabase_schema.sql` is out of sync with the live view — regenerate from the DB.
- AbbVie/Genentech 2015 deal value remains NULL with `value_confidence = Unknown` — the underlying venetoclax relationship dates to a 2007 collab, not a standalone 2015 deal. Future research can resolve.

**Commits (16):** `154e949` spec … `d149ca4` cache-buster bump.
**Tests:** 11/11 integration green; 7/7 validator unit tests green; 176/176 BD Data Base pytest suite green, zero regressions.
