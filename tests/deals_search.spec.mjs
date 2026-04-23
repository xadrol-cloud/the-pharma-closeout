// tests/deals_search.spec.mjs
// Run with: source ~/.claude/bd-env.sh && node --test tests/deals_search.spec.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

async function search(query, filters = {}, { limit = 25, offset = 0 } = {}) {
  let q = sb.from('deals_enriched').select('*', { count: 'exact' })
  if (query) q = q.or(`buyer_name.ilike.%${query}%,target_name.ilike.%${query}%,therapeutic_areas.ilike.%${query}%,lead_molecules.ilike.%${query}%,indications.ilike.%${query}%`)
  if (filters.deal_type) q = q.eq('deal_type', filters.deal_type)
  if (filters.era) q = q.eq('era_tag', filters.era)
  if (filters.therapeutic_area) q = q.ilike('therapeutic_areas', `%${filters.therapeutic_area}%`)
  if (filters.min_value) q = q.gte('deal_value_usd_mm', filters.min_value)
  const sortMap = { date_desc: 'announcement_date', value_desc: 'deal_value_usd_mm', critic_desc: 'critic_score', outcome_desc: 'outcome_score' }
  q = q.order(sortMap[filters.sort || 'date_desc'], { ascending: false, nullsFirst: false })
        .order('deal_id', { ascending: true })
  q = q.range(offset, offset + limit - 1)
  const { data, count, error } = await q
  if (error) throw error
  return { deals: data || [], total: count || 0 }
}

test('deal_type filter returns >0 for every valid value', async () => {
  for (const v of ['Acquisition/Merger', 'Licensing/Option', 'Co-Development', 'Asset Purchase']) {
    const { total } = await search('', { deal_type: v })
    assert.ok(total > 0, `deal_type="${v}" returned 0`)
  }
})

test('era filter returns >0 for every decade', async () => {
  for (const v of ['1990s', '2000s', '2010s', '2020s']) {
    const { total } = await search('', { era: v })
    assert.ok(total > 0, `era="${v}" returned 0`)
  }
})

test('TA filter single-variant returns >0', async () => {
  for (const v of ['Oncology', 'Neurology', 'Immunology', 'Cardiovascular', 'Metabolic', 'Vaccines', 'Gene Therapy']) {
    const { total } = await search('', { therapeutic_area: v })
    assert.ok(total > 0, `therapeutic_area="${v}" returned 0`)
  }
})

test('sort=value_desc returns results in descending value order', async () => {
  const { deals } = await search('', { therapeutic_area: 'Oncology', sort: 'value_desc' })
  const vals = deals.map(d => d.deal_value_usd_mm).filter(v => v != null)
  for (let i = 1; i < vals.length; i++) assert.ok(vals[i-1] >= vals[i], `out of order at ${i}: ${vals[i-1]} < ${vals[i]}`)
})

test('sort=critic_desc returns non-null scores first, in descending order', async () => {
  const { deals } = await search('', { therapeutic_area: 'Oncology', sort: 'critic_desc' })
  const firstNullIdx = deals.findIndex(d => d.critic_score == null)
  const firstNonNullIdx = deals.findIndex(d => d.critic_score != null)
  if (firstNullIdx !== -1 && firstNonNullIdx !== -1) {
    assert.ok(firstNonNullIdx < firstNullIdx, `nulls appear before non-nulls (first null at ${firstNullIdx}, first score at ${firstNonNullIdx})`)
  }
  const vals = deals.map(d => d.critic_score).filter(v => v != null)
  for (let i = 1; i < vals.length; i++) assert.ok(vals[i-1] >= vals[i], `out of order at ${i}: ${vals[i-1]} < ${vals[i]}`)
})

test('sort=outcome_desc returns results in descending OS order', async () => {
  const { deals } = await search('', { therapeutic_area: 'Oncology', sort: 'outcome_desc' })
  const vals = deals.map(d => d.outcome_score).filter(v => v != null)
  for (let i = 1; i < vals.length; i++) assert.ok(vals[i-1] >= vals[i], `out of order at ${i}: ${vals[i-1]} < ${vals[i]}`)
})

test('pagination: offset=25 returns disjoint set from offset=0', async () => {
  const page1 = await search('', { therapeutic_area: 'Oncology' }, { offset: 0, limit: 25 })
  if (page1.total < 50) return  // skip if dataset too small
  const page2 = await search('', { therapeutic_area: 'Oncology' }, { offset: 25, limit: 25 })
  const p1ids = new Set(page1.deals.map(d => d.deal_id))
  const overlap = page2.deals.filter(d => p1ids.has(d.deal_id))
  assert.equal(overlap.length, 0, 'page 1 and 2 overlap')
  assert.ok(page2.deals.length > 0, 'page 2 empty')
})

test('zzzzzz query returns zero', async () => {
  const { total } = await search('zzzzzz')
  assert.equal(total, 0)
})

test('combined query: pfizer + Oncology + $1B+', async () => {
  const { deals, total } = await search('pfizer', { therapeutic_area: 'Oncology', min_value: 1000 })
  assert.ok(total > 0, 'no results for pfizer + oncology + $1B+')
  for (const d of deals) {
    const matchesPfizer = (d.buyer_name + ' ' + d.target_name + ' ' + (d.therapeutic_areas || '')).toLowerCase().includes('pfizer')
    assert.ok(matchesPfizer || (d.lead_molecules && d.lead_molecules.toLowerCase().includes('pfizer')) || (d.indications && d.indications.toLowerCase().includes('pfizer')), `result doesn't match pfizer: ${d.deal_id}`)
  }
})

test('data integrity: no values above $400B', async () => {
  const { data } = await sb.from('deals_enriched').select('deal_id,deal_value_usd_mm').gt('deal_value_usd_mm', 400000)
  assert.equal(data?.length || 0, 0, 'outlier values still present')
})

test('data integrity: CS distribution is not stuck at 100', async () => {
  const { data } = await sb.from('deals_enriched').select('critic_score').eq('critic_score', 100)
  const { count: total } = await sb.from('deals_enriched').select('*', { count: 'exact', head: true }).not('critic_score', 'is', null)
  const ratio = (data?.length || 0) / (total || 1)
  assert.ok(ratio < 0.15, `CS=100 is ${(ratio*100).toFixed(1)}% of scored deals (expected <15%)`)
})
