# Move 2 — Editorial "Takes" (editorial_lede) Runbook

> Resume point for the editorial-take work. Everything here is durable so a fresh
> session (post-/clear) can pick up without this conversation's context.

## Goal
Give each deal a 1–2 sentence editorial **verdict** (`editorial_lede`) — the
"Rotten Tomatoes blurb" that is the whole differentiation thesis. Zero fabrication.

## Current state (2026-07-09)
- **Column is live.** The 2026-07-09 migration exposed `editorial_lede` in the
  `deals_enriched` view. `deal.html:360` already renders it. **94 deals already
  have a take; ~1,269 do not.**
- **The 94 existing takes were audited** (`scripts/run_take_audit.py` + `audit_claims.py`
  in `BD lookup tool/BD Data Base/scripts/`). Result: **40 fully self-contained,
  54 include claims beyond the deal's own sources** — spot-checked as mostly
  *accurate cross-deal context* (e.g. a Takeda/Millennium take citing the later
  $62B Takeda/Shire deal), not fabrications. Report: `_take_audit_report.txt`.
- **The key lesson:** editorial takes *naturally reach for cross-deal context*,
  which is exactly the fabrication surface. So generation must be **constrained
  to the deal's own sourced facts only.**

## Field-unification fix (do first, in the-pharma-closeout repo)
`deals.js` `renderFeaturedInfo` (~line 728) renders `deal.editorial_summary`, a
DIFFERENT column, on the featured card. Standardize on `editorial_lede`:
change that render to `deal.editorial_lede || deal.editorial_summary`. Bump the
`deals.js?v=` cache-buster across the pages (currently `20260709c`). This makes
the take show on every surface, not just the deal page.

## Generation plan (mirror the outcome-backfill pipeline)
1. **Target list:** start with the highest-value / highest-traffic **dual-scored**
   deals lacking `editorial_lede` (they already have both scores → the take can
   reference the Hype Gap, which IS this deal's own data). Query:
   `deals_enriched?editorial_lede=is.null&outcome_score=not.is.null&critic_score=not.is.null&order=deal_value_usd_mm.desc`.
   **First batch: 20–30 deals.**
2. **Workflow (Fable orchestrates, Sonnet doers)** — clone the outcome-backfill
   workflow pattern. Per deal, a research/write agent produces a 1–2 sentence take
   with a **CONSTRAINED prompt**: "Use ONLY this deal's own sourced facts (its
   deal_summary, its scores, its deal_sources excerpts). Do NOT mention any other
   deal, company, or drug not in those sources. State the verdict, not a summary."
   Then an adversarial verify agent + `audit_claims.audit_text(take, [excerpts +
   structured facts])` — write ONLY takes with zero hard flags.
3. **Writer:** simple PATCH of `deals.editorial_lede` (the BASE `deals` table, not
   the view) via the secret key — pattern is in `write_outcomes.py` (`_req` PATCH).
4. **GATE (Bin's rule): 100% human review of batch 1** before scaling. Do NOT
   mass-generate 1,269 unsupervised. Show Bin the first 20–30, then continue.

## Schema / gotchas (from the outcome batch — same DB)
- Writes go to base `deals` (view is read-only). PATCH `deals?deal_id=eq.<id>`
  with `{"editorial_lede": "..."}` + `apikey`+`Authorization: Bearer <SECRET_KEY>`.
- Creds in `~/.claude/bd-env.sh` (`SUPABASE_SECRET_KEY`). Publishable key = read only.
- `audit_claims.audit_text` needs excerpts + the deal's structured facts (value in
  $B/$M digit forms, dates, names, molecules) as the evidence corpus — see
  `run_take_audit.py`'s evidence-building loop.
- Reference existing good takes for house voice (verdict, not summary; e.g. the
  Gilead/Pharmasset, Amgen/Immunex takes if present).

## One-line resume
> "Continue Move 2 editorial takes per docs/superpowers/plans/2026-07-09-editorial-takes-move2-runbook.md — do the field-unification fix, then generate + audit the first 20-30-deal batch and hold for my review."
