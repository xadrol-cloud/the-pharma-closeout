// assets/scoring.js — pure, dependency-free scoring/gating/aggregation logic.
// CDN-FREE by contract: imports ONLY ./format.js (no ?v= query string) so that
// `node --test` can import this module offline. deals.js re-exports everything
// here for the browser. Do not add CDN or Supabase imports to this file.
import { isPlausibleDate } from './format.js'

/* ---------- Outcome-unlock gate (Move 1) ----------
 * Methodology (methodology.html §03): the Outcome Score "unlocks five years
 * after close." Until a deal is >= OUTCOME_UNLOCK_YEARS past its close date (or
 * announcement date, when close is unknown), a stored outcome_score is not yet
 * displayable. Keeps the product consistent with its own published method. */
export const OUTCOME_UNLOCK_YEARS = 5

export function outcomeUnlockYear(deal) {
  if (!deal) return null
  const base = [deal.close_date, deal.announcement_date]
    .find(d => d && isPlausibleDate(String(d).slice(0, 10)))
  if (!base) return null
  const y = parseInt(String(base).slice(0, 4), 10)
  return isNaN(y) ? null : y + OUTCOME_UNLOCK_YEARS
}

export function isOutcomeUnlocked(deal) {
  const unlockYear = outcomeUnlockYear(deal)
  if (unlockYear == null) return true          // no usable date → don't suppress
  return unlockYear <= new Date().getUTCFullYear()
}

/** outcome_score, but only once the 5-year window has elapsed; else null. */
export function displayOutcomeScore(deal) {
  if (!deal || deal.outcome_score == null) return null
  return isOutcomeUnlocked(deal) ? deal.outcome_score : null
}

/* ---------- Score tiers ---------- */
export function tierForScore(score) {
  if (score == null) return 'none'
  if (score >= 90) return 'exceptional'
  if (score >= 75) return 'strong'
  if (score >= 60) return 'adequate'
  if (score >= 40) return 'weak'
  return 'failed'
}

export function tierLabelFor(score, dimension = 'critic') {
  const t = tierForScore(score)
  if (t === 'none') return ''
  const critic = { exceptional: 'EXCEPTIONAL', strong: 'STRONG', adequate: 'ADEQUATE', weak: 'WEAK', failed: 'FAILED' }
  const outcome = { exceptional: 'OUTPERFORMED', strong: 'MET THESIS', adequate: 'TRACKING', weak: 'UNDERPERFORMED', failed: 'FAILED' }
  return (dimension === 'outcome' ? outcome : critic)[t]
}

/* ---------- Hype Gap = Announcement Sentiment − Outcome Score ----------
 * Gated: outcome must be present AND unlocked (via displayOutcomeScore), so a
 * too-recent deal never produces a gap. Positive ⇒ over-hyped; negative ⇒
 * under-rated. */
export function hypeGap(deal) {
  if (!deal) return null
  const cs = deal.critic_score, os = displayOutcomeScore(deal)
  if (cs == null || os == null) return null
  return Math.round(cs) - Math.round(os)
}

export function hypeGapLabel(gap) {
  if (gap == null) return ''
  if (gap >= 25) return 'Severely over-hyped'
  if (gap >= 12) return 'Over-hyped'
  if (gap <= -25) return 'Badly under-rated'
  if (gap <= -12) return 'Under-rated'
  return 'Lived up to the hype'
}

/* ---------- Move 3: Biobucks percentage ----------
 * Upfront as % of total deal value. Mirrors renderCascadeBar's clamp
 * (upfront >= total collapses to 100%). NULL when upfront is undisclosed
 * (0/absent) or total is unknown — never a fabricated split. */
export function biobucksPct(deal) {
  if (!deal) return null
  const total = +deal.deal_value_usd_mm
  const up = +deal.upfront_usd_mm
  if (!total || total <= 0 || !up || up <= 0) return null
  return Math.min(100, Math.round((up / total) * 100))
}

/* ---------- Move 6: Acquirer track records ----------
 * canonicalBuyer folds legal-suffix and known-alias variants so a serial
 * acquirer isn't fragmented across "Pfizer" / "Pfizer Inc" / "Pfizer Inc.".
 * Extend BUYER_ALIASES as new splits surface; keep it small and explicit. */
const BUYER_ALIASES = {
  'glaxosmithkline': 'gsk', 'gsk': 'gsk',
  'bristol-myers squibb': 'bms', 'bristol myers squibb': 'bms', 'bms': 'bms',
  'johnson johnson': 'johnson & johnson', 'j j': 'johnson & johnson',
}
export function canonicalBuyer(name) {
  if (!name) return ''
  let s = String(name).toLowerCase().trim()
  s = s.replace(/\(.*?\)/g, ' ')                        // drop parentheticals
  s = s.replace(/\b(incorporated|inc|ltd|limited|plc|ag|sa|corp|corporation|company|co|holding|holdings|group|the)\b/g, ' ')
  s = s.replace(/[.,]/g, ' ').replace(/\s+/g, ' ').trim()
  return BUYER_ALIASES[s] || s
}

export function acquirerBattingAverage(deals, { minN = 3 } = {}) {
  const groups = new Map()
  for (const d of (deals || [])) {
    const os = displayOutcomeScore(d)               // only unlocked, scored deals
    if (os == null) continue
    const key = canonicalBuyer(d.buyer_name)
    if (!key) continue
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push({ ...d, _os: os })
  }
  const recs = []
  for (const [buyer, arr] of groups) {
    if (arr.length < minN) continue
    const scores = arr.map(x => x._os)
    const mean = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    const sorted = [...arr].sort((a, b) => b._os - a._os)
    const metThesis = scores.filter(s => s >= 60).length
    recs.push({
      buyer, n: arr.length, mean,
      pctMetThesis: Math.round(100 * metThesis / scores.length),
      best: sorted[0], worst: sorted[sorted.length - 1], deals: arr,
    })
  }
  recs.sort((a, b) => (b.mean - a.mean) || (b.n - a.n))
  return recs
}

/* ---------- Move 9: comparable-outcome summary ----------
 * Summarize how a locked deal's comparables aged, WITHOUT asserting anything
 * about the locked deal itself. Only unlocked, scored comps count; needs >=minN
 * or returns null (no thin-data noise). */
export function comparableOutcomeSummary(comps, { minN = 3 } = {}) {
  const scores = (comps || []).map(displayOutcomeScore).filter(s => s != null).sort((a, b) => a - b)
  if (scores.length < minN) return null
  const mid = Math.floor(scores.length / 2)
  const median = scores.length % 2 ? scores[mid] : Math.round((scores[mid - 1] + scores[mid]) / 2)
  return { n: scores.length, median, best: scores[scores.length - 1], worst: scores[0], distribution: scores }
}

/* ---------- Move 9: comparable-aged panel (pure string renderer) ----------
 * Rendered ONLY on a deal whose own outcome is still locked. Describes how its
 * comparables aged; says nothing about this deal's own (ungraded) outcome. */
export function renderComparableAged(summary) {
  if (!summary) return ''
  const t = tierForScore(summary.median)
  return `<div class="card comp-aged" data-tier="${t}">
    <div class="card-head"><span class="card-title">How deals like this aged</span></div>
    <p class="ca-lede">This deal's own outcome hasn't unlocked yet — grades open five years after close. But its ${summary.n} closest comparable deals, old enough to be graded, aged like this:</p>
    <div class="ca-stat"><span class="ca-num" data-tier="${t}">${summary.median}</span><span class="ca-lab">median outcome &middot; ranged ${summary.worst}&ndash;${summary.best}</span></div>
  </div>`
}

/* ---------- Move 4: Hype Gap hero teaser (pure string renderer) ---------- */
function escHtml(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])) }
export function renderGapTeaser(deal) {
  const gap = hypeGap(deal)
  if (gap == null) return ''
  const cs = Math.round(deal.critic_score), os = Math.round(deal.outcome_score)
  const dir = gap > 0 ? 'over' : (gap < 0 ? 'under' : 'even')
  const sign = gap > 0 ? '+' : ''
  return `<a class="gap-teaser" data-dir="${dir}" href="deal.html?id=${escHtml(deal.deal_id)}">
    <span class="gt-label">${escHtml(hypeGapLabel(gap))}</span>
    <span class="gt-pair">${escHtml(deal.buyer_name)} / ${escHtml(deal.target_name)}</span>
    <span class="gt-nums">said <b>${cs}</b> &middot; did <b>${os}</b> &middot; <span class="gt-gap">${sign}${gap}</span></span>
  </a>`
}

/* ---------- Move 7: "Deals of the Year, in hindsight" cohorts ----------
 * Group unlocked, scored deals by announcement year; per year (>= minPerYear)
 * return the aged-best and aged-worst. Pure over the live view. */
export function hindsightCohorts(deals, { minPerYear = 5, topN = 3 } = {}) {
  const byYear = new Map()
  for (const d of deals || []) {
    const os = displayOutcomeScore(d)
    if (os == null) continue
    if (!d.announcement_date || !isPlausibleDate(String(d.announcement_date).slice(0, 10))) continue
    const y = parseInt(String(d.announcement_date).slice(0, 4), 10)
    if (isNaN(y)) continue
    if (!byYear.has(y)) byYear.set(y, [])
    byYear.get(y).push({ ...d, _os: os })
  }
  const cohorts = []
  for (const [year, arr] of byYear) {
    if (arr.length < minPerYear) continue
    const sorted = [...arr].sort((a, b) => b._os - a._os)
    cohorts.push({ year, n: arr.length, best: sorted.slice(0, topN), worst: sorted.slice(-topN).reverse() })
  }
  cohorts.sort((a, b) => b.year - a.year)
  return cohorts
}

// ---------------------------------------------------------------
// UX overhaul R1: single source of truth for score vocabulary.
// Every chip, pill, row and table label MUST read from this map.
// "Announcement Sentiment", "Met Thesis", "Industry consensus" are
// tooltip copy only — never a visible label.
// ---------------------------------------------------------------
export const SCORE_VOCAB = {
  critic: {
    abbr: 'CS',
    name: 'Critic Score',
    tooltip: 'Analyst & media reaction at announcement (0–100)',
  },
  outcome: {
    abbr: 'OS',
    name: 'Outcome Score',
    tooltip: 'Post-close performance vs. the deal thesis — grades open 5 years after close',
  },
}
