// tests/scoring.unit.mjs — offline, deterministic, zero network/env.
// Run: node --test tests/scoring.unit.mjs   (or: npm run test:unit)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  displayOutcomeScore, isOutcomeUnlocked, outcomeUnlockYear,
  hypeGap, hypeGapLabel, tierForScore, tierLabelFor,
  biobucksPct, canonicalBuyer, acquirerBattingAverage, comparableOutcomeSummary,
} from '../assets/scoring.js'

const CUR = new Date().getUTCFullYear()

test('Move 1 gate: outcome suppressed until 5yr after close/announcement', () => {
  // brand-new deal (the live Lilly/Haisco class) — MUST suppress
  assert.equal(displayOutcomeScore({ announcement_date: `${CUR}-05-29`, outcome_score: 58 }), null)
  // exactly 5 years → unlocked
  assert.equal(displayOutcomeScore({ announcement_date: `${CUR - 5}-01-01`, outcome_score: 72 }), 72)
  // 4 years → locked
  assert.equal(displayOutcomeScore({ announcement_date: `${CUR - 4}-01-01`, outcome_score: 70 }), null)
  // close_date takes precedence: announced long ago but closed recently → locked
  assert.equal(displayOutcomeScore({ announcement_date: `${CUR - 6}-01-01`, close_date: `${CUR - 3}-01-01`, outcome_score: 65 }), null)
  // no usable date → do not suppress
  assert.equal(displayOutcomeScore({ outcome_score: 80 }), 80)
  // no outcome at all
  assert.equal(displayOutcomeScore({ announcement_date: `${CUR - 10}-01-01`, outcome_score: null }), null)
})

test('outcomeUnlockYear / isOutcomeUnlocked', () => {
  assert.equal(outcomeUnlockYear({ announcement_date: '2014-06-01' }), 2019)
  assert.equal(isOutcomeUnlocked({ announcement_date: '2014-06-01' }), true)
  assert.equal(isOutcomeUnlocked({ announcement_date: `${CUR}-01-01` }), false)
  assert.equal(isOutcomeUnlocked({}), true) // no date → not suppressed
})

test('hypeGap null unless both scores present and outcome unlocked', () => {
  assert.equal(hypeGap({ critic_score: 90, outcome_score: 60, announcement_date: `${CUR - 10}-01-01` }), 30)
  assert.equal(hypeGap({ critic_score: 90, outcome_score: 60, announcement_date: `${CUR}-01-01` }), null) // locked
  assert.equal(hypeGap({ critic_score: 90, outcome_score: null }), null)
  assert.equal(hypeGap(null), null)
})

test('hypeGapLabel verdicts', () => {
  assert.equal(hypeGapLabel(30), 'Severely over-hyped')
  assert.equal(hypeGapLabel(15), 'Over-hyped')
  assert.equal(hypeGapLabel(0), 'Lived up to the hype')
  assert.equal(hypeGapLabel(-15), 'Under-rated')
  assert.equal(hypeGapLabel(-30), 'Badly under-rated')
})

test('tierForScore / tierLabelFor bands', () => {
  assert.equal(tierForScore(95), 'exceptional')
  assert.equal(tierForScore(80), 'strong')
  assert.equal(tierForScore(65), 'adequate')
  assert.equal(tierForScore(45), 'weak')
  assert.equal(tierForScore(20), 'failed')
  assert.equal(tierForScore(null), 'none')
  assert.equal(tierLabelFor(95, 'outcome'), 'OUTPERFORMED')
  assert.equal(tierLabelFor(95, 'critic'), 'EXCEPTIONAL')
})

/* ---------- Move 3: Biobucks percentage ---------- */
test('biobucksPct: upfront/total, clamped, null-safe', () => {
  assert.equal(biobucksPct({ upfront_usd_mm: 100, deal_value_usd_mm: 1000 }), 10)
  assert.equal(biobucksPct({ upfront_usd_mm: 0, deal_value_usd_mm: 1000 }), null)   // undisclosed upfront
  assert.equal(biobucksPct({ upfront_usd_mm: 1200, deal_value_usd_mm: 1000 }), 100) // clamp upfront>=total
  assert.equal(biobucksPct({ deal_value_usd_mm: 0 }), null)
  assert.equal(biobucksPct({ upfront_usd_mm: 250, deal_value_usd_mm: 1000 }), 25)
})

/* ---------- Move 6: Acquirer track records ---------- */
test('canonicalBuyer folds legal-suffix and alias variants', () => {
  assert.equal(canonicalBuyer('Pfizer Inc.'), canonicalBuyer('Pfizer Inc'))
  assert.equal(canonicalBuyer('Pfizer Inc.'), canonicalBuyer('Pfizer'))
  assert.equal(canonicalBuyer('GSK plc'), canonicalBuyer('GlaxoSmithKline plc'))
  assert.equal(canonicalBuyer('Bristol-Myers Squibb Company'), canonicalBuyer('BMS'))
})
test('acquirerBattingAverage: min-n guard, mean, only unlocked scored', () => {
  const d = (b, os, y) => ({ buyer_name: b, target_name: 't', deal_id: b + y, outcome_score: os, announcement_date: `${y}-01-01` })
  const rows = [
    d('Pfizer Inc.', 80, 2010), d('Pfizer Inc', 60, 2011), d('Pfizer', 70, 2012),
    d('Tiny Co', 90, 2010),                       // n<3 → dropped
    d('Locked Co', 99, CUR), d('Locked Co', 88, CUR), d('Locked Co', 77, CUR), // unlocked=false → dropped
  ]
  const recs = acquirerBattingAverage(rows, { minN: 3 })
  assert.equal(recs.length, 1)
  assert.equal(recs[0].n, 3)
  assert.equal(recs[0].mean, 70)
  assert.equal(recs[0].buyer, canonicalBuyer('Pfizer Inc.'))
  assert.ok(recs[0].best.outcome_score >= recs[0].worst.outcome_score)
})

/* ---------- Move 9: comparable-outcome summary ---------- */
test('comparableOutcomeSummary: needs >=3 unlocked, returns median', () => {
  const c = (os, y) => ({ outcome_score: os, announcement_date: `${y}-01-01` })
  assert.equal(comparableOutcomeSummary([c(70, 2010), c(50, 2011)]), null) // <3 unlocked
  const s = comparableOutcomeSummary([c(80, 2010), c(60, 2011), c(40, 2012), c(99, CUR)]) // last locked, excluded
  assert.equal(s.n, 3)
  assert.equal(s.median, 60)
  assert.equal(s.best, 80)
  assert.equal(s.worst, 40)
})

/* ---------- Move 9: render-smoke (string assertion) ---------- */
import { renderComparableAged } from '../assets/scoring.js'
test('renderComparableAged: empty on null, contains stats otherwise', () => {
  assert.equal(renderComparableAged(null), '')
  const html = renderComparableAged({ n: 3, median: 60, best: 80, worst: 40 })
  assert.ok(html.includes('How deals like this aged'))
  assert.ok(html.includes('60'))
  assert.ok(html.includes('comparable'))
})

/* ---------- Move 4: gap teaser render-smoke ---------- */
import { renderGapTeaser } from '../assets/scoring.js'
test('renderGapTeaser: empty unless unlocked dual-scored; contains said/did', () => {
  const CUR2 = new Date().getUTCFullYear()
  assert.equal(renderGapTeaser({ critic_score: 90, outcome_score: 60, announcement_date: `${CUR2}-01-01` }), '') // locked
  const html = renderGapTeaser({ deal_id: 'x', buyer_name: 'A', target_name: 'B', critic_score: 88, outcome_score: 8, announcement_date: '2018-01-01' })
  assert.ok(html.includes('said') && html.includes('did'))
  assert.ok(html.includes('+80'))
})

/* ---------- Task 3.3 (R14): labeled hype-gap ticker ---------- */
test('renderGapTeaser: delta is labeled "hype gap", links to the index, and has a tooltip', () => {
  const html = renderGapTeaser({ deal_id: 'x', buyer_name: 'A', target_name: 'B', critic_score: 88, outcome_score: 8, announcement_date: '2018-01-01' })
  assert.ok(html.includes('hype gap +80'))
  assert.ok(html.includes('href="hype-gap.html"'))
  assert.ok(html.includes('Critic Score'))
})

/* ---------- Move 7: hindsight cohorts ---------- */
import { hindsightCohorts } from '../assets/scoring.js'
test('hindsightCohorts: group unlocked by year, min-per-year guard, best/worst', () => {
  const d = (os, y) => ({ outcome_score: os, announcement_date: `${y}-06-01`, buyer_name: 'B', target_name: 'T', deal_id: `${os}-${y}` })
  const rows = [d(80,2015), d(60,2015), d(40,2015), d(90,2015), d(50,2015), d(70,2016)] // 2015:5, 2016:1
  const c = hindsightCohorts(rows, { minPerYear: 5, topN: 2 })
  assert.equal(c.length, 1)
  assert.equal(c[0].year, 2015)
  assert.equal(c[0].n, 5)
  assert.equal(c[0].best[0]._os, 90)
  assert.equal(c[0].worst[0]._os, 40)
})
