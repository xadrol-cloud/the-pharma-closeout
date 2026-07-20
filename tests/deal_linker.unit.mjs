import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveDealLinks } from '../scripts/lib/deal_linker.mjs'
import { _setSlugMap } from '../assets/deal-links.mjs'

const INDEX = { deals: [
  { deal_id: 'd1', buyer: 'Eli Lilly and Company', target: 'AtaiBeckley Inc.', year: 2026, has_slug: true },
  { deal_id: 'd2', buyer: 'GSK plc', target: 'Bellus Health', year: 2023, has_slug: false },
] }

// REAL shape: top-level array; target usually in mentioned_companies.
const STORIES = [
  { companies: ['Eli Lilly'], mentioned_companies: ['AtaiBeckley'], drugs: [], mentioned_drugs: [] },
  { companies: ['GSK'], mentioned_companies: ['Bellus Health'], drugs: ['camlipixant'], mentioned_drugs: [] },
  { companies: ['Moderna'], mentioned_companies: [], drugs: [], mentioned_drugs: [] },
]

test('PAIR match (buyer+target in same story) resolves the exact deal; static with slug seeded', () => {
  _setSlugMap({ d1: 'eli-lilly-and-ataibeckley-2026' })
  const r = resolveDealLinks(STORIES, INDEX)
  const d1 = r.links.find(l => l.dealId === 'd1')
  assert.ok(d1, 'd1 resolved via Eli Lilly + AtaiBeckley pair')
  assert.equal(d1.state, 'static')
  assert.equal(d1.href, 'deals/eli-lilly-and-ataibeckley-2026.html')
  assert.equal(d1.entity, 'AtaiBeckley')          // anchored on the target surface form
})

test('same pair resolves interactive when no static slug is seeded', () => {
  _setSlugMap({})
  const r = resolveDealLinks(STORIES, INDEX)
  const d1 = r.links.find(l => l.dealId === 'd1')
  assert.equal(d1.state, 'interactive')
  assert.equal(d1.href, 'deal.html?id=d1')
})

test('second pair (GSK + Bellus Health) also resolves', () => {
  _setSlugMap({})
  const r = resolveDealLinks(STORIES, INDEX)
  assert.ok(r.links.some(l => l.dealId === 'd2'))
})

test('BARE BUYER alone is NOT linked (the key precision guard)', () => {
  _setSlugMap({})
  // GSK named, but no target in the story -> must not link to some random GSK deal.
  const r = resolveDealLinks([{ companies: ['GSK'], mentioned_companies: [], drugs: [], mentioned_drugs: [] }], INDEX)
  assert.equal(r.links.length, 0)
  assert.ok(r.pending.includes('GSK'))
})

test('a LONE company (even a target) is NOT linked without its counterparty (pair-only discipline)', () => {
  _setSlugMap({})
  // Only the target named, no buyer -> not linked (avoids ambiguous/historical matches).
  const r = resolveDealLinks([{ companies: ['AtaiBeckley'], mentioned_companies: [], drugs: [], mentioned_drugs: [] }], INDEX)
  assert.equal(r.links.length, 0)
})

test('unmatched company goes to pending, not links', () => {
  _setSlugMap({})
  const r = resolveDealLinks(STORIES, INDEX)
  assert.ok(r.pending.includes('Moderna'))
  assert.ok(!r.links.some(l => l.entity === 'Moderna'))
})

test('drugs never appear in links or the pending company list', () => {
  _setSlugMap({})
  const r = resolveDealLinks(STORIES, INDEX)
  assert.ok(!r.pending.includes('camlipixant'))
  assert.ok(!r.links.some(l => l.entity === 'camlipixant'))
})

test('legacy { stories: [...] } wrapper is accepted', () => {
  _setSlugMap({})
  const r = resolveDealLinks({ stories: STORIES }, INDEX)
  assert.ok(r.links.some(l => l.dealId === 'd1'))
})

test('a deal is linked at most once across stories (dedup by dealId)', () => {
  _setSlugMap({})
  const dup = [STORIES[0], STORIES[0]]
  const r = resolveDealLinks(dup, INDEX)
  assert.equal(r.links.filter(l => l.dealId === 'd1').length, 1)
})

test('empty input yields empty links and pending', () => {
  _setSlugMap({})
  const r = resolveDealLinks([], INDEX)
  assert.deepEqual(r, { links: [], pending: [] })
})
