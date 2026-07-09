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
