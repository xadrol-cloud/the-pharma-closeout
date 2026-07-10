// Unit tests for pure render helpers in assets/scoring.js (offline, node --test)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SCORE_VOCAB, posterScoreState, financialFieldsFor, dedupeByDealId, sortTimelineEvents } from '../assets/scoring.js'

test('SCORE_VOCAB: canonical names and tooltips for both dimensions', () => {
  assert.equal(SCORE_VOCAB.critic.name, 'Critic Score')
  assert.equal(SCORE_VOCAB.critic.abbr, 'CS')
  assert.match(SCORE_VOCAB.critic.tooltip, /analyst|media|announcement/i)
  assert.equal(SCORE_VOCAB.outcome.name, 'Outcome Score')
  assert.equal(SCORE_VOCAB.outcome.abbr, 'OS')
  assert.match(SCORE_VOCAB.outcome.tooltip, /post-close|5 years|thesis/i)
})

test('posterScoreState: both scores present', () => {
  assert.equal(posterScoreState(82, 65, false), 'both')
  assert.equal(posterScoreState(0, 0, false), 'both')   // 0 is a real score, not null
})

test('posterScoreState: critic scored, outcome locked/absent', () => {
  assert.equal(posterScoreState(82, null, false), 'critic-locked')
  assert.equal(posterScoreState(82, undefined, false), 'critic-locked')
})

test('posterScoreState: outcome-only — OS chip stands alone, never a CS dash', () => {
  assert.equal(posterScoreState(null, 65, false), 'outcome-only')
  // pending flag is irrelevant once an outcome exists
  assert.equal(posterScoreState(null, 65, true), 'outcome-only')
})

test('posterScoreState: pending — no critic yet, announced recently', () => {
  assert.equal(posterScoreState(null, null, true), 'pending')
})

test('posterScoreState: unscored — neither score, not pending', () => {
  assert.equal(posterScoreState(null, null, false), 'unscored')
  assert.equal(posterScoreState(undefined, undefined, false), 'unscored')
})

test('financialFieldsFor: licensing deal never shows M&A-only fields', () => {
  const lic = { deal_type: 'Licensing/Option', deal_value_usd_mm: 11000, financing_type: null,
    close_date: null, deal_ev_revenue_x: null, deal_ev_ebitda_x: null, time_to_close_days: null,
    target_revenue_ltm_usd_mm: null, closing_structure: null, equity_sought_pct: null }
  const labels = financialFieldsFor(lic).map(f => f.label)
  assert.ok(!labels.includes('EV / EBITDA'))
  assert.ok(!labels.includes('Equity Sought'))
  assert.ok(!labels.includes('Target LTM Revenue'))
  assert.ok(labels.includes('Deal Value'))
})
test('financialFieldsFor: null fields are dropped, not dashed', () => {
  const lic = { deal_type: 'Licensing/Option', deal_value_usd_mm: 11000 }
  for (const f of financialFieldsFor(lic)) assert.notEqual(f.value, '—')
})
test('financialFieldsFor: M&A deal with data shows valuation fields', () => {
  const ma = { deal_type: 'Acquisition/Merger', deal_value_usd_mm: 68000, deal_ev_revenue_x: 4.2,
    deal_ev_ebitda_x: 12.1, equity_sought_pct: 100, close_date: '2009-10-15', time_to_close_days: 262 }
  const labels = financialFieldsFor(ma).map(f => f.label)
  assert.ok(labels.includes('EV / Revenue'))
  assert.ok(labels.includes('EV / EBITDA'))
  assert.ok(labels.includes('Equity Sought'))
})
// Recent ISO date (90 days ago) — pending is recency-gated to 24 months
const RECENT_ANN = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)

test('financialFieldsFor: pending flag when close_date missing and status not complete', () => {
  const pending = { deal_type: 'Licensing/Option', deal_value_usd_mm: 500, deal_status: 'Pending',
    announcement_date: RECENT_ANN }
  assert.equal(financialFieldsFor(pending, { withMeta: true }).pending, true)
})
test('financialFieldsFor: Take-Private is in the M&A field family', () => {
  const tp = { deal_type: 'Take-Private', deal_value_usd_mm: 8000, deal_ev_ebitda_x: 14.3 }
  assert.ok(financialFieldsFor(tp).map(f => f.label).includes('EV / EBITDA'))
})
test('financialFieldsFor: recent deal with no close_date reads pending', () => {
  const d = { deal_type: 'Acquisition/Merger', deal_value_usd_mm: 1200, announcement_date: RECENT_ANN }
  assert.equal(financialFieldsFor(d, { withMeta: true }).pending, true)
})
test('financialFieldsFor: 1996 deal with no close_date/status is stale-data, not pending', () => {
  const d = { deal_type: 'Acquisition/Merger', deal_value_usd_mm: 300, announcement_date: '1996-03-14' }
  assert.equal(financialFieldsFor(d, { withMeta: true }).pending, false)
})

test('dedupeByDealId keeps first occurrence, drops repeats', () => {
  const rows = [{ deal_id: 'a', v: 1 }, { deal_id: 'b' }, { deal_id: 'a', v: 2 }]
  const out = dedupeByDealId(rows)
  assert.equal(out.length, 2)
  assert.equal(out[0].v, 1)
})
test('dedupeByDealId tolerates null/undefined input', () => {
  assert.deepEqual(dedupeByDealId(null), [])
})
test('sortTimelineEvents orders by event_date, sort_order as tiebreak', () => {
  const ev = [
    { event_date: '2026-05-28', sort_order: 3, t: 'pending' },
    { event_date: '2026-06-03', sort_order: 2, t: 'binsa' },
    { event_date: '2026-05-28', sort_order: 1, t: 'announced' },
  ]
  assert.deepEqual(sortTimelineEvents(ev).map(e => e.t), ['announced', 'pending', 'binsa'])
})
test('sortTimelineEvents: missing event_date falls back to sort_order at end', () => {
  const ev = [{ sort_order: 2, t: 'b' }, { event_date: '2026-01-01', sort_order: 9, t: 'a' }]
  assert.deepEqual(sortTimelineEvents(ev).map(e => e.t), ['a', 'b'])
})
test('sortTimelineEvents: verdict pin (sort_order >= 99) stays last despite early date', () => {
  const ev = [
    { event_date: '2026-06-03', sort_order: 2, t: 'late' },
    { event_type: 'verdict', event_date: '2020-01-01', sort_order: 99, t: 'pin' },
    { event_date: '2026-05-28', sort_order: 1, t: 'early' },
  ]
  assert.deepEqual(sortTimelineEvents(ev).map(e => e.t), ['early', 'late', 'pin'])
})
test('sortTimelineEvents: milestone at sort_order 100 is NOT a pin — date-sorts among regulars', () => {
  const ev = [
    { event_date: '2026-06-03', sort_order: 2, t: 'late' },
    { event_type: 'milestone', event_date: '2026-06-01', sort_order: 100, t: 'update' },
    { event_date: '2026-05-28', sort_order: 1, t: 'early' },
  ]
  assert.deepEqual(sortTimelineEvents(ev).map(e => e.t), ['early', 'update', 'late'])
})
