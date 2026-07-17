import test from 'node:test';
import assert from 'node:assert/strict';
import { dealUrl, _setSlugMap } from '../assets/deal-links.mjs';

test('dealUrl returns static page when slug known', () => {
  _setSlugMap({ abc123: 'pfizer-seagen-2023' });
  assert.equal(dealUrl('abc123'), 'deals/pfizer-seagen-2023.html');
});
test('dealUrl falls back to interactive page when slug unknown', () => {
  _setSlugMap({});
  assert.equal(dealUrl('zzz'), 'deal.html?id=zzz');
});
test('dealUrl encodes the fallback id', () => {
  _setSlugMap({});
  assert.equal(dealUrl('a b'), 'deal.html?id=a%20b');
});
