// Unit tests for pure render helpers in assets/scoring.js (offline, node --test)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SCORE_VOCAB } from '../assets/scoring.js'

test('SCORE_VOCAB: canonical names and tooltips for both dimensions', () => {
  assert.equal(SCORE_VOCAB.critic.name, 'Critic Score')
  assert.equal(SCORE_VOCAB.critic.abbr, 'CS')
  assert.match(SCORE_VOCAB.critic.tooltip, /analyst|media|announcement/i)
  assert.equal(SCORE_VOCAB.outcome.name, 'Outcome Score')
  assert.equal(SCORE_VOCAB.outcome.abbr, 'OS')
  assert.match(SCORE_VOCAB.outcome.tooltip, /post-close|5 years|thesis/i)
})
