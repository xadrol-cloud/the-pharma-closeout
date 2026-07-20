import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCompany, matchDeal } from '../scripts/lib/deal_index.mjs';

const INDEX = { deals: [
  { deal_id: 'd1', buyer: 'Eli Lilly and Company', target: 'AtaiBeckley', year: 2026, has_slug: true },
  { deal_id: 'd2', buyer: 'GSK plc', target: 'Bellus Health', year: 2023, has_slug: false },
  { deal_id: 'd3', buyer: 'Pfizer Inc', target: 'Arena Pharmaceuticals', year: 2021, has_slug: true },
] };

test('normalizeCompany strips suffixes, punctuation, and lowercases', () => {
  assert.equal(normalizeCompany('Eli Lilly and Company'), 'eli lilly');
  assert.equal(normalizeCompany('GSK plc'), 'gsk');
  assert.equal(normalizeCompany('Arena Pharmaceuticals'), 'arena');
});

test('matchDeal finds by target (most specific)', () => {
  const match = matchDeal('AtaiBeckley', INDEX);
  assert.ok(match);
  assert.equal(match.deal_id, 'd1');
});

test('matchDeal finds by target with different casing/spacing', () => {
  const match = matchDeal('Bellus Health', INDEX);
  assert.ok(match);
  assert.equal(match.deal_id, 'd2');
});

test('matchDeal falls back to buyer when no target matches', () => {
  const match = matchDeal('Pfizer', INDEX);
  assert.ok(match);
  assert.equal(match.deal_id, 'd3');
});

test('matchDeal returns null when neither buyer nor target matches', () => {
  assert.equal(matchDeal('Moderna', INDEX), null);
});

test('matchDeal breaks ties by newest year on target match', () => {
  const idx = { deals: [
    { deal_id: 'old', buyer: 'Buyer A', target: 'Arena Pharmaceuticals', year: 2019, has_slug: true },
    { deal_id: 'new', buyer: 'Buyer B', target: 'Arena Pharmaceuticals', year: 2021, has_slug: true },
  ] };
  const match = matchDeal('Arena', idx);
  assert.ok(match);
  assert.equal(match.deal_id, 'new');
});

test('matchDeal breaks ties by newest year on buyer fallback', () => {
  const idx = { deals: [
    { deal_id: 'old-buyer', buyer: 'Pfizer Inc', target: 'Something Else', year: 2018, has_slug: false },
    { deal_id: 'new-buyer', buyer: 'Pfizer Inc', target: 'Something Different', year: 2022, has_slug: false },
  ] };
  const match = matchDeal('Pfizer', idx);
  assert.ok(match);
  assert.equal(match.deal_id, 'new-buyer');
});
