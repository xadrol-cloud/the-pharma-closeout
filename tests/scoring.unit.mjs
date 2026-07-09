// tests/scoring.unit.mjs — offline, deterministic, zero network/env.
// Run: node --test tests/scoring.unit.mjs   (or: npm run test:unit)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  displayOutcomeScore, isOutcomeUnlocked, outcomeUnlockYear,
  hypeGap, hypeGapLabel, tierForScore, tierLabelFor,
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
