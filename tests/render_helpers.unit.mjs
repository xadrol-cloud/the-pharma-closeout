// Unit tests for pure render helpers in assets/scoring.js (offline, node --test)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SCORE_VOCAB, posterScoreState } from '../assets/scoring.js'

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
