// scripts/weekly_hype_gap.mjs — Move 10 (generator only).
// Drafts the recurring "Hype Gap of the week" content unit from LIVE data for
// EDITORIAL REVIEW — it does not publish, and asserts nothing not already in the
// deal's stored fields (zero fabrication). Dependency-free: global fetch + the
// tested pure logic in ../assets/scoring.js.
//
// Run: node scripts/weekly_hype_gap.mjs
import { hypeGap, hypeGapLabel } from '../assets/scoring.js'

const BASE = 'https://nuqhlvlslwroupedduog.supabase.co/rest/v1'
const KEY = 'sb_publishable_amtSGMKyQTDPPjkUHcoquw_uoSZfipS'

// Two-step (the enriched view is heavy; an unbounded wide scan times out).
// Step 1: light score columns only. Step 2: display fields for the winner.
// Filter only on outcome_score (critic_score is computed in the view; filtering
// it forces a full recompute → 500). hypeGap() drops rows with null critic.
const lightUrl = `${BASE}/deals_enriched?select=deal_id,critic_score,outcome_score,announcement_date,close_date&outcome_score=not.is.null&enrichment_status=neq.archived&limit=2000`
const lres = await fetch(lightUrl, { headers: { apikey: KEY } })
if (!lres.ok) { console.error('fetch failed', lres.status); process.exit(1) }
const light = await lres.json()

// Rank by absolute Hype Gap, using the SAME gated hypeGap() the site uses
// (locked/too-recent deals return null and are excluded automatically).
const scored = light
  .map(d => ({ d, gap: hypeGap(d) }))
  .filter(x => x.gap != null)
  .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))

if (!scored.length) { console.error('no dual-scored unlocked deals found'); process.exit(1) }

const top = scored[0]
const dispUrl = `${BASE}/deals_enriched?select=deal_id,buyer_name,target_name,announcement_date,deal_value_usd_mm,deal_type,critic_score,outcome_score&deal_id=eq.${encodeURIComponent(top.d.deal_id)}`
const dres = await fetch(dispUrl, { headers: { apikey: KEY } })
const [d] = await dres.json()
const gap = top.gap
const yr = String(d.announcement_date).slice(0, 4)
const val = d.deal_value_usd_mm >= 1000
  ? `$${(d.deal_value_usd_mm / 1000).toFixed(1)}B`
  : (d.deal_value_usd_mm ? `$${Math.round(d.deal_value_usd_mm)}M` : 'undisclosed')
const verdict = hypeGapLabel(gap)
const sign = gap > 0 ? '+' : ''
const dir = gap > 0 ? 'The Street oversold it.' : 'The Street undersold it.'

// Draft — factual frame only, from stored fields. No new claims.
console.log(`
================  HYPE GAP OF THE WEEK — DRAFT (for editorial review)  ================

HEADLINE:  ${d.buyer_name} / ${d.target_name}: ${verdict}.

THE NUMBERS:  said ${Math.round(d.critic_score)}  ·  did ${Math.round(d.outcome_score)}  ·  gap ${sign}${gap}

FRAME (${d.deal_type || 'deal'}, ${yr}, ${val}):
  At announcement, sentiment scored ${Math.round(d.critic_score)}/100. With its 5-year
  outcome window now closed, it grades ${Math.round(d.outcome_score)}/100 — a ${Math.abs(gap)}-point
  ${gap > 0 ? 'over-hype' : 'under-rating'}. ${dir}

LINK:  https://thepharmacloseout.com/deal.html?id=${d.deal_id}

CTA:  See every over-hyped and under-rated deal → https://thepharmacloseout.com/hype-gap.html

NOTE: numbers pulled live from the deal record; verify against the deal page before
posting. Do not add claims not present in the deal's sources.
======================================================================================
`)
