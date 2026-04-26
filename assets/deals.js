/* ==========================================================================
   DEAL INTELLIGENCE — Shared JavaScript Module
   The Pharma Closeout · thepharmacloseout.com/deals

   All data functions query Supabase directly from the browser.
   All render functions return HTML strings using class names from deals.css.
   ========================================================================== */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { formatValue, formatDate } from './format.js?v=20260425b'

export { formatValue, formatDate }

const supabase = createClient(
  'https://nuqhlvlslwroupedduog.supabase.co',
  'sb_publishable_amtSGMKyQTDPPjkUHcoquw_uoSZfipS'
)


/* ==========================================================================
   1. UTILITY FUNCTIONS
   ========================================================================== */

/**
 * Get logo URL for a company.
 * Prefers the enrichment-pipeline's local asset (logo_local_path on companies),
 * falls back to gstatic favicon when only a domain is known.
 */
export function logoUrl(localPath, domain) {
  if (localPath) return `/assets/${localPath}`
  if (!domain) return null
  return `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`
}

/* formatValue + formatDate live in ./format.js (imported + re-exported at top). */

/** Safely parse a JSON array string, returning [] on failure */
export function parseTAs(jsonStr) {
  if (!jsonStr) return []
  try { return JSON.parse(jsonStr) } catch { return [] }
}

/** Get year from ISO date */
function yearOf(isoDate) {
  if (!isoDate) return ''
  return isoDate.substring(0, 4)
}

/** Get CSS background class for a deal type */
function bgClass(dealType) {
  if (!dealType) return 'bg-ma'
  const t = dealType.toLowerCase()
  if (t.includes('licensing') || t.includes('option')) return 'bg-lic'
  if (t.includes('co-dev') || t.includes('codev') || t.includes('collaboration')) return 'bg-codev'
  if (t.includes('asset')) return 'bg-asset'
  return 'bg-ma' // Acquisition/Merger, Take-Private, default
}

/** Get ring override class for carousel/featured posters */
function ringClass(dealType) {
  if (!dealType) return ''
  const t = dealType.toLowerCase()
  if (t.includes('licensing') || t.includes('option')) return 'lic-ring'
  if (t.includes('co-dev') || t.includes('codev') || t.includes('collaboration')) return 'codev-ring'
  if (t.includes('asset')) return 'asset-ring'
  return ''
}

/** Short deal type label for poster badges */
function shortType(dealType) {
  if (!dealType) return 'M&A'
  const t = dealType.toLowerCase()
  if (t.includes('licensing')) return 'LICENSE'
  if (t.includes('co-dev') || t.includes('collaboration')) return 'CO-DEV'
  if (t.includes('asset')) return 'ASSET'
  if (t.includes('take-private') || t.includes('take private')) return 'TAKE-PRIV'
  return 'M&A'
}

/** Build logo HTML for a company — either image or text fallback */
function logoHtml(localPath, domain, name, cssPrefix) {
  const url = logoUrl(localPath, domain)
  if (url) {
    return `<img src="${url}" alt="${esc(name)}" onerror="this.parentElement.innerHTML='<span class=\\'${cssPrefix}-logo-text\\'>${esc(initials(name))}</span>'">`
  }
  return `<span class="${cssPrefix}-logo-text">${esc(initials(name))}</span>`
}

/** Get initials from a company name */
function initials(name) {
  if (!name) return '?'
  return name.split(/[\s&]+/).filter(Boolean).slice(0, 3).map(w => w[0]).join('').toUpperCase()
}

/** HTML-escape a string */
function esc(s) {
  if (!s) return ''
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/**
 * Task 24: progressive-disclosure accordion for long lists.
 * Shows the first N rows, tucks the rest behind a "Show X more" button.
 * Caller passes pre-rendered row HTML strings.
 */
function accordion(visibleRows, hiddenRows) {
  if (!hiddenRows.length) return visibleRows.join('')
  const hidden = hiddenRows.map(r => `<div class="acc-hidden collapsed">${r}</div>`).join('')
  return visibleRows.join('') +
    `<div class="acc-hidden-wrap" data-collapsed="true">${hidden}</div>` +
    `<button class="acc-toggle" type="button" onclick="const w=this.previousElementSibling;w.setAttribute('data-collapsed','false');this.remove()">Show ${hiddenRows.length} more &rarr;</button>`
}

/** Verdict color class from outcome verdict string */
function verdictColor(verdict) {
  if (!verdict) return 'amber'
  const v = verdict.toLowerCase()
  if (v.includes('positive') || v.includes('success') || v.includes('strong')) return 'green'
  if (v.includes('negative') || v.includes('fail') || v.includes('poor')) return 'red'
  return 'amber'
}

/** Sentiment class for review cards */
function sentimentClass(sentiment) {
  if (!sentiment) return 'neut'
  const s = sentiment.toLowerCase()
  if (s.includes('bull') || s.includes('positive')) return 'bull'
  if (s.includes('bear') || s.includes('negative')) return 'bear'
  return 'neut'
}

/** Sentiment badge label */
function sentimentLabel(sentiment) {
  if (!sentiment) return 'Neutral'
  const s = sentiment.toLowerCase()
  if (s.includes('bull') || s.includes('positive')) return 'Bullish'
  if (s.includes('bear') || s.includes('negative')) return 'Bearish'
  return 'Neutral'
}

/** Score tier: high/mid/low */
function scoreTier(score, max = 10) {
  if (score == null) return 'mid'
  const pct = score / max
  if (pct >= 0.7) return 'high'
  if (pct >= 0.4) return 'mid'
  return 'low'
}

/**
 * Deal Status badge for the hero (Task 18).
 * Returns empty string for null / 'Active' — we only surface non-default states.
 * Maps the deal_outcome_status enum onto red/green/gold/gray colorways.
 */
export function renderDealStatus(status) {
  if (!status || status === 'Active') return ''
  const map = {
    'Terminated':          { cls: 'ds-red',   label: 'DEAL TERMINATED' },
    'Regulatory_Failure':  { cls: 'ds-red',   label: 'REGULATORY SETBACK' },
    'Market_Withdrawal':   { cls: 'ds-red',   label: 'MARKET WITHDRAWAL' },
    'Commercial_Success':  { cls: 'ds-green', label: 'COMMERCIAL SUCCESS' },
    'Partial_Success':     { cls: 'ds-gold',  label: 'PARTIAL SUCCESS' },
    'Pending':             { cls: 'ds-gray',  label: 'PENDING' },
    'Unclear':             { cls: 'ds-gray',  label: 'STATUS UNCLEAR' },
  }
  const m = map[status]
  if (!m) return ''
  return `<span class="deal-status ${m.cls}">${m.label}</span>`
}

/**
 * Deal value pill for the hero (Task 19).
 * Gold pill when disclosed, muted gray chip when undisclosed.
 */
export function renderValuePill(usdMm) {
  if (usdMm == null) return '<span class="hero-value hero-value-null">Value Undisclosed</span>'
  return `<span class="hero-value">${formatValue(usdMm)}</span>`
}

/**
 * Detect pre-1990 historical deals (Task 26) — triggers a stripped-down template
 * that hides disease/revenue sections where modern data does not exist.
 */
export function isHistoricalDeal(deal) {
  if (!deal) return false
  const y = deal.announcement_date ? parseInt(deal.announcement_date.substring(0, 4), 10) : null
  return y != null && !isNaN(y) && y < 1990
}

/**
 * Task 39: Copy a deal row to the clipboard as tab-separated values for
 * direct Excel paste. Columns match a typical BD analyst pull sheet.
 */
export function exportDealRow(deal) {
  if (!deal) return false
  let tas = ''
  try { tas = JSON.parse(deal.therapeutic_areas || '[]').join('; ') } catch { tas = '' }
  const cols = [
    'Buyer', 'Target', 'Announcement Date', 'Deal Type', 'Deal Value ($MM)',
    'Upfront ($MM)', 'Cash Portion ($MM)', 'Stock Portion ($MM)',
    'Close Date', 'Time To Close (days)', 'Therapeutic Areas',
    'Critic Score', 'Outcome Score', 'Primary Source URL',
  ]
  const row = [
    deal.buyer_name, deal.target_name, deal.announcement_date,
    deal.deal_type, deal.deal_value_usd_mm, deal.upfront_usd_mm || '',
    deal.cash_portion_usd_mm || '', deal.stock_portion_usd_mm || '',
    deal.close_date || '', deal.time_to_close_days || '',
    tas,
    deal.critic_score != null ? deal.critic_score : '',
    deal.outcome_score != null ? deal.outcome_score : '',
    deal.primary_source_url || '',
  ]
  const q = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`
  const tsv = cols.map(q).join('\t') + '\n' + row.map(q).join('\t')
  const done = () => {
    try {
      if (typeof alert === 'function') {
        alert('Deal row copied (tab-separated). Paste directly into Excel.')
      }
    } catch { /* no-op */ }
  }
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(tsv).then(done, () => {
        fallbackCopy(tsv); done()
      })
    } else {
      fallbackCopy(tsv); done()
    }
  } catch {
    fallbackCopy(tsv); done()
  }
  return true
}

function fallbackCopy(text) {
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'; ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.focus(); ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  } catch { /* no-op */ }
}


/* ==========================================================================
   2. DATA FUNCTIONS (Supabase queries)
   ========================================================================== */

/** Fetch a single deal with all related data */
export async function fetchDeal(dealId) {
  const { data } = await supabase
    .from('deals_enriched').select('*')
    .eq('deal_id', dealId).single()
  return data
}

/** Latest deals by announcement date */
export async function fetchLatestDeals(limit = 20) {
  const { data } = await supabase
    .from('deals_enriched').select('*')
    .order('announcement_date', { ascending: false })
    .limit(limit)
  return data || []
}

/** Trending deals (by trending_rank, fallback to deal_value desc) */
export async function fetchTrendingDeals(limit = 20) {
  const { data } = await supabase
    .from('deals_enriched').select('*')
    .not('trending_rank', 'is', null)
    .order('trending_rank')
    .limit(limit)
  if (data && data.length > 0) return data
  // Fallback: highest value deals
  const { data: fallback } = await supabase
    .from('deals_enriched').select('*')
    .not('deal_value_usd_mm', 'is', null)
    .order('deal_value_usd_mm', { ascending: false })
    .limit(limit)
  return fallback || []
}

/** Top outcome score deals */
export async function fetchTopOutcomeDeals(limit = 20) {
  const { data } = await supabase
    .from('deals_enriched').select('*')
    .not('outcome_score', 'is', null)
    .order('outcome_score', { ascending: false })
    .limit(limit)
  return data || []
}

/** Search deals by text query + optional filters. Returns { deals, total }. */
export async function searchDeals(query, filters = {}, { limit = 25, offset = 0 } = {}) {
  let q = supabase.from('deals_enriched').select('*', { count: 'exact' })
  if (query) {
    q = q.or(`buyer_name.ilike.%${query}%,target_name.ilike.%${query}%,therapeutic_areas.ilike.%${query}%,lead_molecules.ilike.%${query}%,indications.ilike.%${query}%`)
  }
  if (filters.deal_type) q = q.eq('deal_type', filters.deal_type)
  if (filters.era) q = q.eq('era_tag', filters.era)
  if (filters.therapeutic_area) q = q.ilike('therapeutic_areas', `%${filters.therapeutic_area}%`)
  if (filters.min_value) q = q.gte('deal_value_usd_mm', filters.min_value)
  q = applySortClause(q, filters.sort || 'date_desc')
  q = q.range(offset, offset + limit - 1)
  const { data, error, count } = await q
  if (error) throw error
  return { deals: data || [], total: count || 0 }
}

function applySortClause(q, sortKey) {
  const primary = {
    value_desc:   ['deal_value_usd_mm', false],
    critic_desc:  ['critic_score',      false],
    outcome_desc: ['outcome_score',     false],
    date_desc:    ['announcement_date', false],
  }[sortKey] || ['announcement_date', false]
  // deal_id as stable tie-breaker — ensures paginated offset returns disjoint rows
  return q.order(primary[0], { ascending: primary[1], nullsFirst: false })
          .order('deal_id',  { ascending: true })
}

/** Fetch disease indications for a deal (ordered by US patients desc) */
export async function fetchDiseaseIndications(dealId) {
  const { data } = await supabase
    .from('disease_indications')
    .select('*')
    .eq('deal_id', dealId)
    .order('us_patients_annual', { ascending: false, nullsFirst: false });
  return data || [];
}

/** Fetch disease assets for a set of indication IDs */
export async function fetchDiseaseAssets(indicationIds) {
  if (!indicationIds.length) return [];
  const { data } = await supabase
    .from('disease_assets')
    .select('*')
    .in('indication_id', indicationIds)
    .order('created_at', { ascending: true });
  return data || [];
}

/** Fetch sources for a deal */
export async function fetchDealSources(dealId) {
  const { data } = await supabase
    .from('deal_sources').select('*')
    .eq('deal_id', dealId)
    .order('date_accessed', { ascending: false })
  return data || []
}

/** Fetch outcomes + outcome_facts for a deal */
export async function fetchDealOutcomes(dealId) {
  const { data: outcomes } = await supabase
    .from('deal_outcomes').select('*')
    .eq('deal_id', dealId)
    .order('"window"')
  if (!outcomes) return []
  for (const o of outcomes) {
    const { data: facts } = await supabase
      .from('outcome_facts').select('*')
      .eq('outcome_id', o.outcome_id)
      .order('date')
    o.facts = facts || []
  }
  return outcomes
}

/** Timeline events for deal detail page */
export async function fetchDealTimeline(dealId) {
  const { data } = await supabase
    .from('deal_timeline')
    .select('*')
    .eq('deal_id', dealId)
    .order('sort_order', { ascending: true })
  return data || []
}

/** Value arc data for adaptive visualization */
export async function fetchDealValueArc(dealId) {
  const { data } = await supabase
    .from('deal_value_arc')
    .select('*')
    .eq('deal_id', dealId)
    .order('sort_order', { ascending: true })
  return data || []
}

/** Featured deal: check site_config, fallback to highest outcome_score, then most recent */
export async function fetchFeaturedDeal() {
  const { data: config } = await supabase
    .from('site_config').select('value')
    .eq('key', 'featured_deal_id').single()
  if (config && config.value) {
    const { data } = await supabase
      .from('deals_enriched').select('*')
      .eq('deal_id', config.value).single()
    if (data) return data
  }
  // Fallback: highest outcome score
  const { data: top } = await supabase
    .from('deals_enriched').select('*')
    .not('outcome_score', 'is', null)
    .order('outcome_score', { ascending: false })
    .limit(1)
  if (top && top.length) return top[0]
  // Final fallback: most recent high-value deal
  const { data: recent } = await supabase
    .from('deals_enriched').select('*')
    .not('deal_value_usd_mm', 'is', null)
    .order('deal_value_usd_mm', { ascending: false })
    .limit(1)
  return recent?.[0] || null
}

/** Comparable deals: same TA, similar value, same deal type preferred */
export async function fetchComparables(deal, limit = 5) {
  // Try comparable_deal_ids override first
  if (deal.comparable_deal_ids) {
    try {
      const ids = JSON.parse(deal.comparable_deal_ids)
      if (ids.length) {
        const { data } = await supabase
          .from('deals_enriched').select('*')
          .in('deal_id', ids)
        if (data && data.length) return data
      }
    } catch { /* fall through */ }
  }
  // Algorithm: same TA preferred
  const tas = deal.therapeutic_areas ? JSON.parse(deal.therapeutic_areas) : []
  const ta = tas[0] || ''
  let q = supabase.from('deals_enriched').select('*')
    .neq('deal_id', deal.deal_id)
  if (ta) q = q.ilike('therapeutic_areas', `%${ta}%`)
  q = q.order('outcome_score', { ascending: false, nullsFirst: false }).limit(limit)
  const { data } = await q
  return data || []
}


/**
 * Task 41: Corporate lineage. Walk predecessor/successor by matching
 * buyer_name or target_name across deals. Returns up to 10 linked deals
 * (excluding the current deal).
 */
export async function fetchCorporateLineage(deal, limit = 10) {
  if (!deal || (!deal.buyer_name && !deal.target_name)) return []
  const names = []
  if (deal.buyer_name) names.push(deal.buyer_name)
  if (deal.target_name) names.push(deal.target_name)
  // Quote each name so commas inside names don't break the .or() filter
  const esc = n => `"${String(n).replace(/"/g, '\\"')}"`
  const orExpr = names.flatMap(n => [
    `buyer_name.eq.${esc(n)}`,
    `target_name.eq.${esc(n)}`,
  ]).join(',')
  try {
    const { data } = await supabase.from('deals_enriched').select('*')
      .or(orExpr)
      .neq('deal_id', deal.deal_id)
      .order('announcement_date', { ascending: true, nullsFirst: false })
      .limit(limit)
    return data || []
  } catch {
    return []
  }
}

/**
 * Task 43: Companion deals — same buyer + target pair, different deal_id.
 * Detects follow-on deals, option exercises, amendments, etc. Falls back
 * to name match when buyer_id/target_id columns are not populated.
 */
export async function fetchCompanionDeals(deal, limit = 10) {
  if (!deal) return []
  try {
    // Prefer id-based match when available
    if (deal.buyer_id && deal.target_id) {
      const { data } = await supabase.from('deals_enriched').select('*')
        .eq('buyer_id', deal.buyer_id)
        .eq('target_id', deal.target_id)
        .neq('deal_id', deal.deal_id)
        .order('announcement_date', { ascending: true, nullsFirst: false })
        .limit(limit)
      if (data && data.length) return data
    }
    // Fallback: name-based match
    if (deal.buyer_name && deal.target_name) {
      const { data } = await supabase.from('deals_enriched').select('*')
        .eq('buyer_name', deal.buyer_name)
        .eq('target_name', deal.target_name)
        .neq('deal_id', deal.deal_id)
        .order('announcement_date', { ascending: true, nullsFirst: false })
        .limit(limit)
      return data || []
    }
  } catch {
    return []
  }
  return []
}


/* ==========================================================================
   3. RENDER FUNCTIONS — All return HTML strings
   ========================================================================== */

/* ---------- 3a. Poster Cards ---------- */

/**
 * Render a poster card. Sizes: 'featured' (240px), 'carousel' (200px), 'mini' (38px).
 * Wrapped in an anchor tag for click navigation.
 */
export function renderPoster(deal, size = 'carousel') {
  if (!deal) return ''

  // Mini poster for comparables sidebar
  if (size === 'mini') return renderMiniPoster(deal)

  const year = yearOf(deal.announcement_date)
  const bg = bgClass(deal.deal_type)
  const tas = parseTAs(deal.therapeutic_areas)
  // Show up to 2 TAs — join with middot if there are multiple (e.g., "Oncology · Hematology")
  const ta = tas.length > 1 ? `${tas[0]} · ${tas[1]}` : (tas[0] || '')
  const val = formatValue(deal.deal_value_usd_mm)
  const type = shortType(deal.deal_type)
  const ring = ringClass(deal.deal_type)

  if (size === 'featured') {
    return `<a href="deal.html?id=${deal.deal_id}" style="text-decoration:none">
  <div class="feat-poster ${ring}">
    <div class="fp-bg ${bg}"></div>
    <div class="fp-grain"></div>
    <div class="fp-vig"></div>
    <div class="fp-edge"></div>
    <div class="fp-content">
      <div class="fp-top">
        <span class="fp-type">${esc(type)}</span>
        <span class="fp-year">${esc(year)}</span>
      </div>
      <div class="fp-center">
        <div class="fp-logos">
          <div class="fp-logo">${logoHtml(deal.buyer_logo_local_path, deal.buyer_domain, deal.buyer_name, 'fp')}</div>
          <span class="fp-times">&times;</span>
          <div class="fp-logo">${logoHtml(deal.target_logo_local_path, deal.target_domain, deal.target_name, 'fp')}</div>
        </div>
        <div class="fp-buyer">${esc(deal.buyer_name)}</div>
        <div class="fp-target">${esc(deal.target_name)}</div>
      </div>
      <div class="fp-bottom">
        <span class="fp-ta">${esc(ta)}</span>
        <span class="fp-value">${esc(val)}</span>
      </div>
    </div>
  </div>
</a>`
  }

  // Carousel size (default)
  const criticScore = deal.critic_score != null ? Math.round(deal.critic_score) : null
  const outcomeScore = deal.outcome_score != null ? Math.round(deal.outcome_score) : null

  return `<a href="deal.html?id=${deal.deal_id}" style="text-decoration:none">
  <div class="c-poster ${ring}">
    <div class="c-bg ${bg}"></div>
    <div class="c-grain"></div>
    <div class="c-vig"></div>
    <div class="c-edge"></div>
    <div class="c-content">
      <div class="c-top">
        <span class="c-type">${esc(type)}</span>
        <span class="c-year">${esc(year)}</span>
      </div>
      <div class="c-center">
        <div class="c-logos">
          <div class="c-logo">${logoHtml(deal.buyer_logo_local_path, deal.buyer_domain, deal.buyer_name, 'c')}</div>
          <span class="c-times">&times;</span>
          <div class="c-logo">${logoHtml(deal.target_logo_local_path, deal.target_domain, deal.target_name, 'c')}</div>
        </div>
        <div class="c-buyer">${esc(deal.buyer_name)}</div>
        <div class="c-target">${esc(deal.target_name)}</div>
      </div>
      <div class="c-bottom">
        <span class="c-ta">${esc(ta)}</span>
        <span class="c-value">${esc(val)}</span>
      </div>
    </div>
    <div class="c-scores">
      ${criticScore != null
        ? `<div class="c-sc ct"><span class="c-sc-label">CS</span>${criticScore}</div>`
        : `<div class="c-sc lk"><span class="c-sc-label">CS</span>&mdash;</div>`}
      ${outcomeScore != null
        ? `<div class="c-sc os"><span class="c-sc-label">OS</span>${outcomeScore}</div>`
        : `<div class="c-sc lk"><span class="c-sc-label">OS</span>&mdash;</div>`}
    </div>
  </div>
</a>`
}

/** Mini poster for comparables sidebar (36x50) */
function renderMiniPoster(deal) {
  const bg = bgClass(deal.deal_type)
  return `<div class="comp-poster ${bg}"><span>${esc(deal.target_name || '')}</span></div>`
}


/* ---------- 3b. Featured Info (home page hero right side) ---------- */

export function renderFeaturedInfo(deal) {
  if (!deal) return ''
  const tas = parseTAs(deal.therapeutic_areas)
  const val = formatValue(deal.deal_value_usd_mm)
  const criticScore = deal.critic_score != null ? Math.round(deal.critic_score) : null
  const outcomeScore = deal.outcome_score != null ? Math.round(deal.outcome_score) : null

  return `<div class="feat-info">
  <div class="feat-scores">
    ${renderScorePill('critic', criticScore, 'Industry consensus')}
    ${renderScorePill('outcome', outcomeScore, 'Measured results')}
  </div>
  <div class="feat-title">${esc(deal.buyer_name)} acquires ${esc(deal.target_name)}</div>
  <div class="feat-meta">${esc(deal.deal_type || 'Acquisition')} &middot; <strong>${esc(val)}</strong> &middot; ${esc(formatDate(deal.announcement_date))}</div>
  ${deal.editorial_summary ? `<div class="feat-lede">${esc(deal.editorial_summary)}</div>` : ''}
  <div class="feat-tags">
    ${tas.slice(0, 3).map(t => `<span class="feat-tag ft-blue">${esc(t)}</span>`).join('')}
    ${deal.era_tag ? `<span class="feat-tag ft-amber">${esc(deal.era_tag)}</span>` : ''}
  </div>
  <a href="deal.html?id=${deal.deal_id}" class="feat-cta">
    Full Analysis
    <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
  </a>
  <div class="score-explainer">
    <div class="se-item"><div class="se-dot ct"></div> Critic Score — analyst & media consensus at announcement</div>
    <div class="se-item"><div class="se-dot os"></div> Outcome Score — post-close performance vs. thesis</div>
  </div>
</div>`
}


/* ---------- 3c. Score Pill ---------- */

/**
 * Large score pill. type: 'critic' or 'outcome'. score: number or null.
 * Task 22: three-tier coloring + tooltip on low/null scores.
 */
export function renderScorePill(type, score, subtitle = '') {
  const cls = type === 'critic' ? 'fs-critic' : 'fs-outcome'
  const label = type === 'critic' ? 'Critic Score' : 'Outcome Score'
  const tier = score == null ? 'none' : score >= 70 ? 'high' : score >= 40 ? 'mid' : 'low'
  const tip = score == null ? 'Score not yet calculated'
            : tier === 'low' ? 'Low: limited comparables or insufficient data'
            : ''
  const display = score != null ? score : '—'

  return `<div class="feat-score ${cls} score-tier-${tier}"${tip ? ` title="${esc(tip)}"` : ''}>
  <span class="feat-score-num">${display}</span>
  <div class="feat-score-label">
    <span class="feat-score-type">${label}</span>
    ${subtitle ? `<span class="feat-score-desc">${esc(subtitle)}</span>` : ''}
  </div>
</div>`
}


/* ---------- 3d. Outcome Timeline ---------- */

/**
 * Event-driven timeline from deal_timeline table.
 * Falls back to deal_summary if no timeline events exist.
 * Verdict events can link to score breakdown via outcome_id.
 */
export function renderTimeline(events, outcomes, dealSummary) {
  if (!events || !events.length) {
    if (dealSummary) {
      return `<div class="tl"><div class="tl-item">
        <div class="tl-dot amber"></div>
        <div class="tl-date"></div>
        <div class="tl-title">Deal Overview</div>
        <div class="tl-body">${esc(dealSummary)}</div>
      </div></div>
      <p style="color:var(--ink-faint);font-size:12px;margin-top:8px;">Detailed timeline coming soon.</p>`
    }
    return '<p style="color:var(--ink-faint);font-size:13px">No outcome data available yet.</p>'
  }

  const items = events.map(e => {
    const color = e.verdict || 'amber'
    const isVerdict = e.event_type === 'verdict'
    const dotClass = isVerdict ? 'tl-dot tl-dot-verdict' : 'tl-dot'

    let scoreInline = ''
    if (isVerdict && e.outcome_id && outcomes) {
      const linkedOutcome = outcomes.find(o => o.outcome_id === e.outcome_id)
      if (linkedOutcome && linkedOutcome.strategic_fit_score != null) {
        const o = linkedOutcome
        const overall = Math.min(100, Math.round(
          (o.strategic_fit_score * 0.25 + o.financial_return_score * 0.35 +
           o.pipeline_outcome_score * 0.25 + o.integration_score * 0.15) *
          (0.8 + (o.deal_difficulty_score || 50) * 0.004)
        ))
        scoreInline = `<div class="tl-scores">
          <span class="tl-score-pill">Overall: <strong>${overall}</strong></span>
          <span class="tl-score-dim">SF ${o.strategic_fit_score}</span>
          <span class="tl-score-dim">FR ${o.financial_return_score}</span>
          <span class="tl-score-dim">PO ${o.pipeline_outcome_score}</span>
          <span class="tl-score-dim">INT ${o.integration_score}</span>
        </div>`
      }
    }

    return `<div class="tl-item${isVerdict ? ' tl-verdict' : ''}">
      <div class="${dotClass} ${color}"></div>
      <div class="tl-date">${esc(e.event_date || '')}</div>
      <div class="tl-title">${esc(e.headline)}</div>
      <div class="tl-body">${esc(e.summary)}</div>
      ${scoreInline}
      ${e.source_url ? `<div class="tl-src"><a href="${esc(e.source_url)}" target="_blank">${esc(e.source_name || 'Source')} &rarr;</a></div>` : ''}
    </div>`
  })

  // Task 24: progressive disclosure — timeline caps at 5 items before toggle
  const CAP = 5
  const visible = items.slice(0, CAP)
  const hidden = items.slice(CAP)
  return `<div class="tl">${accordion(visible, hidden)}</div>`
}


/* ---------- 3e. Value Arc (adaptive visualization) ---------- */

/**
 * Task 21: data-type contract for Deal Value Arc cells.
 * Accepts explicit currency strings ($1.2B, $500M, etc.) or a whitelist of
 * stage labels. Anything else (raw notes, HTML fragments, mojibake) is rejected
 * so the snapshot card can fall back to "Data pending" instead of rendering junk.
 */
function sanitizeArcCell(v) {
  if (v == null || v === '') return null
  const s = String(v).trim()
  if (/^\$[\d,.]+[KMBT]?(?:\s|$)/.test(s)) return s
  const allowedLabels = ['Pre-revenue', 'Launch phase', 'Divested', 'Terminated',
                         'Pending close', 'N/A', 'Data pending']
  if (allowedLabels.includes(s)) return s
  return null
}

/** Route a raw value_label through sanitizeArcCell; otherwise derive from mm. */
function arcCellLabel(row) {
  const clean = sanitizeArcCell(row.value_label)
  if (clean) return clean
  if (row.value_usd_mm != null) return formatValue(row.value_usd_mm)
  return 'Data pending'
}

/**
 * Adaptive value arc from deal_value_arc table.
 * Switches rendering by arc_type: revenue, pipeline, milestone, snapshot.
 * Accepts an optional `deal` row so Task 27 can surface revenue_annotation.
 */
export function renderValueArc(arcRows, deal = null) {
  if (!arcRows || !arcRows.length) return ''
  const arcType = arcRows[0].arc_type
  if (arcType === 'revenue') return renderRevenueChart(arcRows, deal)
  if (arcType === 'pipeline') return renderPipelineTracker(arcRows)
  if (arcType === 'milestone') return renderMilestoneBar(arcRows)
  if (arcType === 'snapshot') return renderSnapshotCard(arcRows)
  return ''
}

function renderRevenueChart(rows, deal = null) {
  const dataPoints = rows
    .filter(r => r.value_usd_mm != null && (r.year != null || r.period_label))
    .map(r => ({
      date: String(r.year || r.period_label),
      value: r.value_usd_mm / 1000,
      valueMm: r.value_usd_mm,
      label: r.value_label || `$${(r.value_usd_mm / 1000).toFixed(1)}B`,
      asset: r.asset_name || ''
    }))
    .sort((a, b) => (a.date > b.date ? 1 : -1))

  if (dataPoints.length < 3) return renderSnapshotCard(rows)

  const maxVal = Math.max(...dataPoints.map(d => d.value))
  const minVal = Math.min(...dataPoints.map(d => d.value))
  const padding = 20, w = 600, h = 200
  const chartW = w - padding * 2, chartH = h - padding * 2

  const points = dataPoints.map((d, i) => {
    const x = padding + (i / (dataPoints.length - 1)) * chartW
    const y = padding + chartH - ((d.value - minVal) / (maxVal - minVal || 1)) * chartH
    return { x, y, ...d }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaPath = linePath + ` L${points[points.length - 1].x},${h - padding} L${points[0].x},${h - padding} Z`

  const first = dataPoints[0].value, last = dataPoints[dataPoints.length - 1].value
  const growth = first > 0 ? (((last - first) / first) * 100).toFixed(0) : '\u2014'
  const growthColor = growth !== '\u2014' && parseFloat(growth) >= 0 ? 'green' : 'red'

  // Task 40: CSV export of data points
  const csvHeader = 'Period,Revenue_USD_MM,Revenue_USD_B,Asset'
  const csvRows = dataPoints.map(d =>
    `"${String(d.date).replace(/"/g, '""')}",${d.valueMm != null ? d.valueMm : ''},${d.value.toFixed(3)},"${String(d.asset).replace(/"/g, '""')}"`
  )
  const csvString = [csvHeader, ...csvRows].join('\n')
  const csvFilename = `revenue-arc-${(deal && deal.deal_id) || 'export'}.csv`
  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(csvString)}`

  return `<div class="rev-card">
  <div class="rev-headline">Revenue Arc</div>
  <div class="rev-subtitle">Post-acquisition revenue trajectory${dataPoints[0].asset ? ` \u2014 ${esc(dataPoints[0].asset)}` : ''}</div>
  <div class="rev-chart-area">
    <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--green)" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="var(--green)" stop-opacity="0.02"/>
      </linearGradient></defs>
      <path d="${areaPath}" fill="url(#revGrad)"/>
      <path d="${linePath}" fill="none" stroke="var(--green)" stroke-width="2.5" stroke-linejoin="round"/>
      ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="var(--paper)" stroke="var(--green)" stroke-width="2"/>`).join('')}
      ${points.map(p => `<text x="${p.x}" y="${p.y - 10}" text-anchor="middle" font-size="10" fill="var(--ink-muted)" font-family="var(--mono)">${p.label}</text>`).join('')}
      ${points.map(p => `<text x="${p.x}" y="${h - 4}" text-anchor="middle" font-size="9" fill="var(--ink-faint)">${esc(p.date)}</text>`).join('')}
      <text x="4" y="12" font-size="10" fill="var(--ink-muted)" font-family="var(--mono)">Revenue (USD B)</text>
    </svg>
  </div>
  <div class="rev-stats">
    <div class="rev-stat"><div class="rev-stat-val green">$${maxVal.toFixed(1)}B</div><div class="rev-stat-label">Peak Revenue</div></div>
    <div class="rev-stat"><div class="rev-stat-val ${growthColor}">${growth}%</div><div class="rev-stat-label">Total Growth</div></div>
    <div class="rev-stat"><div class="rev-stat-val">${dataPoints.length}</div><div class="rev-stat-label">Data Points</div></div>
  </div>
  ${deal && deal.revenue_annotation ? `<div class="rev-annotation">${esc(deal.revenue_annotation)}</div>` : ''}
  <a class="rev-export" href="${csvHref}" download="${csvFilename}" title="Download revenue arc data as CSV">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    Download CSV
  </a>
  </div>`
}

function renderPipelineTracker(rows) {
  const assets = {}
  for (const r of rows) {
    const name = r.asset_name || 'Lead Asset'
    if (!assets[name]) assets[name] = []
    assets[name].push(r)
  }

  const stages = ['Phase I', 'Phase II', 'Phase III', 'Pivotal', 'Approved']
  const stageIndex = s => {
    const idx = stages.indexOf(s)
    return idx >= 0 ? idx : -1
  }

  const tracks = Object.entries(assets).map(([name, dataRows]) => {
    const maxStage = dataRows.reduce((best, r) => {
      const idx = stageIndex(r.status)
      return idx > best ? idx : best
    }, -1)
    const failed = dataRows.some(r => r.status === 'Failed' || r.status === 'Discontinued')

    const dots = stages.map((stage, i) => {
      const isFilled = i <= maxStage && !failed
      const isCurrent = i === maxStage
      const isFail = failed && i === maxStage
      let dotClass = 'pip-dot'
      if (isFail) dotClass += ' pip-fail'
      else if (isFilled) dotClass += ' pip-filled'
      if (isCurrent && !isFail) dotClass += ' pip-current'
      return `<div class="${dotClass}"><span class="pip-label">${stage}</span></div>`
    }).join('<div class="pip-line"></div>')

    return `<div class="pip-track">
      <div class="pip-name">${esc(name)}</div>
      <div class="pip-stages">${dots}</div>
    </div>`
  })

  return `<div class="rev-card">
    <div class="rev-headline">Pipeline Progression</div>
    <div class="rev-subtitle">Post-deal development status</div>
    ${tracks.join('')}
  </div>`
}

function renderMilestoneBar(rows) {
  const total = rows.reduce((sum, r) => sum + (r.value_usd_mm || 0), 0)

  const segments = rows.map(r => {
    const pct = total > 0 ? ((r.value_usd_mm || 0) / total * 100).toFixed(1) : 0
    return `<div class="mst-seg" style="width:${pct}%">
      <div class="mst-label">${esc(r.period_label || '')}</div>
      <div class="mst-val">${esc(arcCellLabel(r))}</div>
    </div>`
  })

  return `<div class="rev-card">
    <div class="rev-headline">Deal Value Breakdown</div>
    <div class="rev-subtitle">Milestone payments and commitments</div>
    <div class="mst-bar">${segments.join('')}</div>
    <div class="rev-stats">
      <div class="rev-stat"><div class="rev-stat-val">${formatValue(total)}</div><div class="rev-stat-label">Total Value</div></div>
      <div class="rev-stat"><div class="rev-stat-val">${rows.length}</div><div class="rev-stat-label">Components</div></div>
    </div>
  </div>`
}

function renderSnapshotCard(rows) {
  if (rows.length < 2) {
    const r = rows[0]
    return `<div class="rev-card">
      <div class="rev-headline">Deal Value Context</div>
      <div class="rev-subtitle">${esc(r.period_label || '')}</div>
      <div class="snap-single">
        <div class="snap-val">${esc(arcCellLabel(r))}</div>
        ${r.status ? `<div class="snap-status">${esc(r.status)}</div>` : ''}
      </div>
    </div>`
  }

  const before = rows.find(r => (r.period_label || '').toLowerCase().includes('deal') || r.sort_order === 1) || rows[0]
  const after = rows.find(r => (r.period_label || '').toLowerCase().includes('current') || r.sort_order === rows.length) || rows[rows.length - 1]

  const improved = (after.value_usd_mm || 0) > (before.value_usd_mm || 0)
  const borderColor = after.status === 'Failed' || after.status === 'Discontinued' ? 'red'
    : improved ? 'green' : 'amber'

  return `<div class="rev-card snap-card snap-${borderColor}">
    <div class="rev-headline">Deal Value Arc</div>
    <div class="snap-grid">
      <div class="snap-panel">
        <div class="snap-panel-label">${esc(before.period_label || 'At Deal Time')}</div>
        <div class="snap-val">${esc(arcCellLabel(before))}</div>
        ${before.status ? `<div class="snap-status">${esc(before.status)}</div>` : ''}
        ${before.asset_name ? `<div class="snap-asset">${esc(before.asset_name)}</div>` : ''}
      </div>
      <div class="snap-arrow">&rarr;</div>
      <div class="snap-panel">
        <div class="snap-panel-label">${esc(after.period_label || 'Current Status')}</div>
        <div class="snap-val">${esc(arcCellLabel(after))}</div>
        ${after.status ? `<div class="snap-status">${esc(after.status)}</div>` : ''}
        ${after.asset_name ? `<div class="snap-asset">${esc(after.asset_name)}</div>` : ''}
      </div>
    </div>
  </div>`
}


/* ---------- 3f. Disease Context (collapsible cards) ---------- */

/** Format patient/case count: 35730 → "35K", 176000 → "176K", 7500000 → "7.5M" */
function fmtPatients(n) {
  if (n == null || isNaN(n)) return '—'
  if (n >= 1000000) return `${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1)}M`
  if (n >= 1000) return `${Math.round(n / 1000)}K`
  return String(n)
}

/** Format market size in $M: 20100 → "$20.1B", 3200 → "$3.2B", 500 → "$500M" */
function fmtMarket(mm) {
  if (mm == null || isNaN(mm)) return '—'
  if (mm >= 1000) return `$${(mm / 1000).toFixed(1)}B`
  return `$${Math.round(mm)}M`
}

/**
 * Task 25: stat card schema validation. Rejects cells whose value is not a
 * recognizable numeric/percent/currency token (with a short whitelist of
 * placeholder labels like "N/A" and "<1%"). Prevents 500-word narrative
 * strings from leaking into tiny callout cards.
 */
function sanitizeStatValue(v) {
  if (v == null || v === '') return null
  const s = String(v).trim()
  if (s.length > 40) return null
  if (!/^[\d.,$%<>~\-\s/KMBT]+$/.test(s) && !['N/A', '<1%'].includes(s)) return null
  return s
}

export function renderDiseaseContext(indications, assets) {
  if (!indications || !indications.length) {
    return '<p style="color:var(--ink-muted);font-size:14px;padding:16px 0;">Disease context data not yet available for this deal.</p>'
  }

  // Group assets by indication_id
  const assetMap = {}
  for (const a of (assets || [])) {
    if (!assetMap[a.indication_id]) assetMap[a.indication_id] = []
    assetMap[a.indication_id].push(a)
  }

  const cards = indications.map((ind, i) => {
    const expanded = i === 0
    const indAssets = assetMap[ind.indication_id] || []

    // Header asset tags
    const assetTags = indAssets.map(a =>
      `<span class="at-tag ${esc(a.asset_status_class || '')}">${esc(a.asset_header_tag || a.asset_name || '')}</span>`
    ).join('')

    // Stats in header
    const patientsFormatted = fmtPatients(ind.us_patients_annual)
    const marketFormatted = fmtMarket(ind.market_size_usd_mm)
    const marketLabel = ind.market_size_label || 'US Market'

    // Task 20: detect empty right panel so we can collapse the grid
    const rightPanelText = (ind.second_column_text || '').trim()
    const hasRightPanel = rightPanelText.length > 0
    const gridCls = hasRightPanel ? 'dp-grid' : 'dp-grid dp-grid-single'
    const rightBlock = hasRightPanel
      ? `<div class="dp-block"><h4>${esc(ind.second_column_label || 'Competitive Landscape')}</h4><p>${esc(rightPanelText)}</p></div>`
      : ''

    // Task 25: push callout cards only when value + label both pass validation
    const mktCells = []
    const pushCell = (rawValue, label, source) => {
      const clean = sanitizeStatValue(rawValue)
      if (!clean) return
      if (!label || !String(label).trim()) return
      mktCells.push(`<div class="mkt-cell"><div class="mc-val">${esc(clean)}</div><div class="mc-label">${esc(label)}</div><div class="mc-src">${esc(source || '')}</div></div>`)
    }
    if (ind.us_patients_annual != null) {
      pushCell(fmtPatients(ind.us_patients_annual), 'New Cases/yr', ind.us_patients_source)
    }
    if (ind.prevalence_or_living_with) {
      pushCell(ind.prevalence_or_living_with, 'Prevalence', ind.prevalence_source)
    }
    if (ind.market_size_usd_mm != null) {
      pushCell(fmtMarket(ind.market_size_usd_mm), ind.market_size_label || 'US Market', ind.market_size_source)
    }
    if (ind.fourth_metric_value) {
      pushCell(ind.fourth_metric_value, ind.fourth_metric_label, ind.fourth_metric_source)
    }

    // Asset mini rows
    const assetRows = indAssets.map(a =>
      `<div class="am-row"><div class="am-name">${esc(a.asset_name || '')}</div><div class="am-moa">${esc(a.asset_moa || '')}</div><div class="am-status ${esc(a.asset_status_class || '')}">${esc(a.asset_status || '')}</div><div class="am-rev">${esc(a.asset_revenue_label || '')}</div></div>`
    ).join('')

    return `<div class="disease-card"><div class="disease-header" aria-expanded="${expanded ? 'true' : 'false'}" onclick="this.setAttribute('aria-expanded',this.getAttribute('aria-expanded')==='true'?'false':'true');this.nextElementSibling.classList.toggle('open')"><div class="disease-icon" style="background:#f3f4f6">${ind.indication_emoji || '💊'}</div><div class="disease-name-block"><div class="disease-name">${esc(ind.indication)}</div><div class="disease-assets">${assetTags}</div></div><div class="disease-stats"><div class="ds"><div class="ds-val">${patientsFormatted}</div><div class="ds-label">US Cases/yr</div></div><div class="ds"><div class="ds-val">${marketFormatted}</div><div class="ds-label">${esc(marketLabel)}</div></div></div><div class="dchev"><svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg></div></div>
    <div class="dpanel${expanded ? ' open' : ''}"><div class="dpanel-inner">
      <div class="${gridCls}"><div class="dp-block"><h4>Disease Overview</h4><p>${esc(ind.disease_overview || '')}</p></div>${rightBlock}</div>
      ${mktCells.length ? `<div class="mkt-row">${mktCells.join('')}</div>` : ''}
      ${indAssets.length ? `<div class="asset-mini"><div class="am-title">Assets in this indication</div>${assetRows}</div>` : ''}
    </div></div></div>`
  })

  return `<div class="section-heading">Disease & Market Context</div>${cards.join('')}`
}


/* ---------- 3g. Financials Grid ---------- */

export function renderFinancials(deal) {
  const evRev = deal.deal_ev_revenue_x != null ? `${deal.deal_ev_revenue_x.toFixed(1)}x` : '—'
  const evEbitda = deal.deal_ev_ebitda_x != null ? `${deal.deal_ev_ebitda_x.toFixed(1)}x` : '—'
  const ttc = deal.time_to_close_days != null ? `${deal.time_to_close_days} days` : '—'
  const equity = deal.equity_sought_pct != null ? `${deal.equity_sought_pct}%` : '—'
  const cashPct = deal.cash_portion_usd_mm != null ? formatValue(deal.cash_portion_usd_mm) : null
  const stockPct = deal.stock_portion_usd_mm != null ? formatValue(deal.stock_portion_usd_mm) : null
  let structure = deal.closing_structure || '—'
  if (cashPct && stockPct) structure = `${cashPct} cash + ${stockPct} stock`
  else if (cashPct) structure = `${cashPct} cash`

  const metrics = [
    { label: 'Deal Value', value: formatValue(deal.deal_value_usd_mm) },
    { label: 'Financing', value: deal.financing_type || '—' },
    { label: 'Close Date', value: deal.close_date ? formatDate(deal.close_date) : '—' },
    { label: 'EV / Revenue', value: evRev },
    { label: 'EV / EBITDA', value: evEbitda },
    { label: 'Time to Close', value: ttc },
    { label: 'Target LTM Revenue', value: deal.target_revenue_ltm_usd_mm != null ? formatValue(deal.target_revenue_ltm_usd_mm) : '—' },
    { label: 'Structure', value: structure },
    { label: 'Equity Sought', value: equity },
  ]

  const cells = metrics.map(m =>
    `<div class="fin-cell">
      <div class="fin-label">${esc(m.label)}</div>
      <div class="fin-val">${esc(m.value)}</div>
    </div>`
  )

  return `<div class="fin-grid">${cells.join('')}</div>`
}


/* ---------- 3h. Critic Reviews ---------- */

/**
 * Scrollable review cards with sentiment color-coding.
 * Filters to sources that have a sentiment value.
 */
export function renderCriticReviews(sources) {
  const reviews = (sources || []).filter(s => s.sentiment)
  if (!reviews.length) return '<p style="color:var(--ink-faint);font-size:13px">No analyst reviews available.</p>'

  const cards = reviews.map(r => {
    const cls = sentimentClass(r.sentiment)
    const badgeCls = cls === 'bull' ? 'b-bull' : cls === 'bear' ? 'b-bear' : 'b-neut'
    return `<a class="review ${cls}" href="${esc(r.url || '#')}" target="_blank">
      <div class="review-quote">"${esc(r.excerpt || r.headline || '')}"</div>
      <div class="review-foot">
        <div class="review-src"><strong>${esc(r.source_name || '')}</strong> · ${esc(formatDate(r.date_accessed || r.published_date))}<span class="badge ${badgeCls}">${sentimentLabel(r.sentiment)}</span></div>
        <span class="review-arrow">→</span>
      </div>
    </a>`
  })

  return `<div class="card-head">
    <span class="card-title">Critic Reviews</span>
    <span class="reviews-count">${reviews.length}</span>
  </div>
  <div class="reviews-container">${cards.join('')}</div>`
}


/* ---------- 3i. Key Assets (from disease_assets table) ---------- */

export function renderKeyAssets(allAssets) {
  if (!allAssets || !allAssets.length) return '<p style="color:var(--ink-faint);font-size:13px">No asset data available.</p>'

  const groups = { ok: [], pip: [], div: [] }
  for (const a of allAssets) {
    const cls = a.asset_status_class || 'pip'
    if (!groups[cls]) groups[cls] = []
    groups[cls].push(a)
  }

  const groupLabels = { ok: 'Approved', pip: 'Pipeline', div: 'Divested / Failed' }
  const rows = []

  for (const cls of ['ok', 'pip', 'div']) {
    const assets = groups[cls]
    if (!assets || !assets.length) continue
    rows.push(`<div class="am-group-label ${cls}">${groupLabels[cls]}</div>`)
    for (const a of assets) {
      rows.push(`<div class="am-row">
        <span class="am-name">${esc(a.asset_name || '')}</span>
        <span class="am-moa">${esc(a.asset_moa || '')}</span>
        <span class="am-status ${esc(a.asset_status_class || '')}">${esc(a.asset_status || '')}</span>
        <span class="am-rev">${esc(a.asset_revenue_label || '')}</span>
      </div>`)
    }
  }

  // Task 24: progressive disclosure — cap first render at 5 rows, rest behind toggle
  const CAP = 5
  const visible = rows.slice(0, CAP)
  const hidden = rows.slice(CAP)
  const body = accordion(visible, hidden)

  return `<div class="asset-mini">
    <div class="am-title">Key Assets</div>
    ${body}
  </div>`
}


/* ---------- 3j. Score Breakdown ---------- */

/**
 * Expandable bars for 4 dimensions + difficulty modifier.
 * Uses outcome data to derive dimension scores.
 */
export function renderScoreBreakdown(outcomes, deal) {
  if (!outcomes || !outcomes.length) return ''

  // Task 42: per-dimension methodology tooltip text. Surfaces on `title` hover
  // over the score label and populates the inline methodology help block.
  const baseDimensions = [
    { label: 'Strategic Fit', key: 'strategic_fit_score', icon: '🎯', baseWeight: 25,
      tooltip: 'Does the deal align with the buyer\'s stated strategy, TA focus, and portfolio gaps? Weighted higher for platform and licensing stages.' },
    { label: 'Financial Return', key: 'financial_return_score', icon: '📈', baseWeight: 35,
      tooltip: 'Post-deal revenue, margin contribution, and IRR vs. upfront + milestones paid. Weighted highest for launched-product deals.' },
    { label: 'Asset Performance', key: 'pipeline_outcome_score', icon: '🧬', baseWeight: 25,
      tooltip: 'Clinical readouts, approvals, label expansions, and pipeline progression of acquired assets. Weighted highest for preclinical deals.' },
    { label: 'Value Realization', key: 'integration_score', icon: '⚙️', baseWeight: 15,
      tooltip: 'Integration execution, talent retention, milestone achievement, and synergies captured vs. targeted.' },
  ]

  const weightProfiles = {
    preclinical: [30, 15, 40, 15],
    phase2_3:    [25, 25, 35, 15],
    launched:    [20, 40, 20, 20],
    platform:    [25, 35, 25, 15],
    licensing:   [25, 30, 30, 15],
  }
  const stage = deal?.lifecycle_stage || 'platform'
  const weights = weightProfiles[stage] || weightProfiles.platform

  const dimensions = baseDimensions.map((d, i) => ({
    ...d,
    weight: `${weights[i]}%`,
    weightNum: weights[i],
  }))

  const sorted = [...outcomes].sort((a, b) => {
    const order = { '15yr': 0, '10yr': 1, '5yr': 2 }
    return (order[a.window] ?? 3) - (order[b.window] ?? 3)
  })
  const latest = sorted.find(o => o.strategic_fit_score != null) || sorted[0] || {}

  const rows = dimensions.map(dim => {
    const score = latest[dim.key] != null ? latest[dim.key] : null
    const pct = score != null ? score : 50
    const tier = score != null ? (score >= 75 ? 'high' : score >= 50 ? 'mid' : 'low') : ''
    const display = score != null ? score : '\u2014'
    const expKey = dim.key.replace('_score', '_explanation')
    const explanation = latest[expKey] || ''

    // Task 22b: enforce a 3% minimum width so near-zero bars remain visible,
    // and embed the numeric value inside the fill so low scores are readable.
    const fillTier = score == null ? 'none' : tier
    const fillPct = score == null ? 100 : Math.max(pct, 3)
    // Task 42: tooltip combines methodology + weight + current score for a quick hover
    const tip = `${dim.label} (${dim.weight} weight): ${dim.tooltip || ''}${score != null ? ` Current score: ${display}/100.` : ' Score not yet calculated.'}`
    return `<div class="sc-row">
      <div class="sc-header" aria-expanded="false" onclick="this.setAttribute('aria-expanded',this.getAttribute('aria-expanded')==='true'?'false':'true');this.closest('.sc-row').querySelector('.sc-detail').classList.toggle('open')">
        <span class="sc-label" title="${esc(tip)}">${dim.icon} ${dim.label} <span style="font-size:11px;color:var(--ink-faint)">(${dim.weight})</span><span class="sc-info" aria-hidden="true" title="${esc(tip)}">?</span></span>
        <span class="sc-num">${display}</span>
        <div class="sc-chev"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></div>
      </div>
      <div class="sc-bar"><div class="sc-fill ${fillTier}" style="width:${fillPct}%"><span class="sc-fill-num">${display}</span></div></div>
      <div class="sc-detail">
        <div class="sc-detail-inner ${tier}">
          ${explanation ? esc(explanation) : (score != null ? `Score: <strong>${display}/100</strong>` : 'Score not yet calculated for this dimension.')}
        </div>
      </div>
    </div>`
  })

  const difficulty = latest.deal_difficulty_score != null ? latest.deal_difficulty_score : null
  const multiplier = difficulty != null ? (0.8 + difficulty * 0.004).toFixed(2) : null
  if (difficulty != null) {
    rows.push(`<div class="sc-method">Deal Difficulty: <strong>${difficulty}/100</strong> \u2014 multiplier \u00d7${multiplier}</div>`)
  }

  const stageLabels = { preclinical: 'Pre-clinical', phase2_3: 'Phase II/III', launched: 'Launched Product', platform: 'Platform', licensing: 'Licensing/Co-Dev' }
  if (stage && stageLabels[stage]) {
    rows.push(`<div class="sc-method" style="margin-top:4px;font-size:11px;color:var(--ink-faint)">Weights adjusted for: ${stageLabels[stage]}</div>`)
  }

  // Task 42: methodology link — hover any dimension label for the per-dimension tooltip
  rows.push('<div class="sc-method sc-method-tip" style="margin-top:6px;font-size:11px;">Hover any dimension label for methodology. Weights shift by lifecycle stage; the final outcome score multiplies by a deal-difficulty factor (0.8&ndash;1.2).</div>')

  return rows.join('')
}


/* ---------- 3j-bis. Corporate Lineage + Companion Deals (Tasks 41, 43) ---------- */

/** Shared mini-list renderer for sidebar cards that show 2-4 linked deals. */
function renderLineageList(deals, emptyMsg) {
  if (!deals || !deals.length) return `<div class="lin-empty">${emptyMsg}</div>`
  const preview = deals.slice(0, 4)
  const overflow = deals.slice(4)
  const row = d => {
    const val = formatValue(d.deal_value_usd_mm)
    const y = yearOf(d.announcement_date)
    const type = shortType(d.deal_type) || 'Deal'
    return `<a class="lin-row" href="deal.html?id=${encodeURIComponent(d.deal_id)}">
      <div class="lin-year">${esc(y || '')}</div>
      <div class="lin-body">
        <div class="lin-name">${esc(d.buyer_name || '')} / ${esc(d.target_name || '')}</div>
        <div class="lin-meta">${esc(type)} &middot; ${esc(val)}</div>
      </div>
    </a>`
  }
  const previewHtml = preview.map(row).join('')
  if (!overflow.length) return previewHtml
  const overflowHtml = overflow.map(row).join('')
  return `${previewHtml}
    <details class="lin-more">
      <summary>See full chain (${deals.length})</summary>
      ${overflowHtml}
    </details>`
}

/**
 * Task 41: Render the corporate lineage sidebar card. Shows predecessor/
 * successor deals (same buyer or target name).
 */
export function renderCorporateLineage(deals, currentDeal) {
  if (!deals || !deals.length) return ''
  // Partition: deals that involve the buyer vs. the target
  const buyer = currentDeal && currentDeal.buyer_name
  const target = currentDeal && currentDeal.target_name
  const buyerChain = deals.filter(d => d.buyer_name === buyer || d.target_name === buyer)
  const targetChain = deals.filter(d => (d.buyer_name === target || d.target_name === target) && !buyerChain.includes(d))

  const sections = []
  if (buyerChain.length) {
    sections.push(`<div class="lin-section">
      <div class="lin-section-label">${esc(buyer)}</div>
      ${renderLineageList(buyerChain, '')}
    </div>`)
  }
  if (targetChain.length) {
    sections.push(`<div class="lin-section">
      <div class="lin-section-label">${esc(target)}</div>
      ${renderLineageList(targetChain, '')}
    </div>`)
  }
  if (!sections.length) return ''
  return sections.join('')
}

/**
 * Task 43: Render the companion-deals ("Related Deals") sidebar card.
 * Same buyer + target pair, different deal_id (follow-ons, amendments, option exercises).
 */
export function renderCompanionDeals(deals, currentDeal) {
  if (!deals || !deals.length) return ''
  return `<div class="lin-section">
    <div class="lin-section-label" style="font-size:11px;color:var(--ink-faint);margin-bottom:6px;">Other deals between the same parties</div>
    ${renderLineageList(deals, '')}
  </div>`
}


/* ---------- 3k. Comparables Sidebar ---------- */

export function renderComparables(comparables, currentDealId) {
  if (!comparables || !comparables.length) return ''

  const items = comparables.map(deal => {
    const bg = bgClass(deal.deal_type)
    const criticScore = deal.critic_score != null ? Math.round(deal.critic_score) : null
    const outcomeScore = deal.outcome_score != null ? Math.round(deal.outcome_score) : null
    const val = formatValue(deal.deal_value_usd_mm)
    const cmpHref = currentDealId ? `compare.html?ids=${currentDealId},${deal.deal_id}` : null

    return `<div class="comp-wrap">
      <a class="comp" href="deal.html?id=${deal.deal_id}">
        <div class="comp-poster ${bg}"><span>${esc(deal.target_name || '')}</span></div>
        <div class="comp-body">
          <div class="comp-name">${esc(deal.buyer_name)} / ${esc(deal.target_name)}</div>
          <div class="comp-meta">${esc(val)} · ${esc(yearOf(deal.announcement_date))}</div>
        </div>
        <div class="comp-scores">
          ${criticScore != null
            ? `<div class="comp-sc ct"><span class="cs-label">CS</span>${criticScore}</div>`
            : `<div class="comp-sc lk"><span class="cs-label">CS</span>—</div>`}
          ${outcomeScore != null
            ? `<div class="comp-sc os"><span class="cs-label">OS</span>${outcomeScore}</div>`
            : `<div class="comp-sc lk"><span class="cs-label">OS</span>—</div>`}
        </div>
      </a>
      ${cmpHref ? `<a class="comp-compare-btn" href="${cmpHref}">Compare side-by-side &rarr;</a>` : ''}
    </div>`
  })

  return items.join('')
}


/* ==========================================================================
   4c. Multi-select comparison flow
   ========================================================================== */

const _selectedDealIds = new Set()

/** Initialize multi-select: injects checkbox overlays on all posters + floating Compare button. */
export function initMultiSelect() {
  // Inject a single floating compare button if not already present
  if (!document.getElementById('compare-fab')) {
    const fab = document.createElement('button')
    fab.id = 'compare-fab'
    fab.className = 'compare-fab'
    fab.style.display = 'none'
    fab.innerHTML = '<span class="cf-count">0</span><span class="cf-label">Compare</span><span class="cf-arrow">&rarr;</span>'
    fab.addEventListener('click', () => {
      if (_selectedDealIds.size >= 2) {
        const ids = Array.from(_selectedDealIds).slice(0, 5).join(',')
        window.location.href = `compare.html?ids=${ids}`
      }
    })
    document.body.appendChild(fab)
  }

  // Delegated click handler for poster select checkboxes
  document.addEventListener('click', (e) => {
    const cb = e.target.closest('.poster-select')
    if (!cb) return
    e.preventDefault()
    e.stopPropagation()
    const dealId = cb.dataset.dealId
    if (!dealId) return
    const checked = cb.classList.toggle('checked')
    if (checked) {
      if (_selectedDealIds.size >= 5) {
        cb.classList.remove('checked')
        updateFab()
        return
      }
      _selectedDealIds.add(dealId)
    } else {
      _selectedDealIds.delete(dealId)
    }
    updateFab()
  }, true) // capture phase so it fires before anchor navigation

  // Run once to inject checkboxes on already-rendered posters
  injectSelectorOnPosters()

  // Re-scan when the DOM changes (carousels, search results re-render)
  const mo = new MutationObserver(() => injectSelectorOnPosters())
  mo.observe(document.body, { childList: true, subtree: true })
}

function injectSelectorOnPosters() {
  document.querySelectorAll('a[href^="deal.html?id="]').forEach(anchor => {
    // Match feat-poster or c-poster (not mini / featured-info CTAs)
    const poster = anchor.querySelector('.feat-poster, .c-poster')
    if (!poster) return
    if (poster.querySelector('.poster-select')) return // already injected
    const dealId = new URL(anchor.href).searchParams.get('id')
    if (!dealId) return
    const cb = document.createElement('div')
    cb.className = 'poster-select' + (_selectedDealIds.has(dealId) ? ' checked' : '')
    cb.dataset.dealId = dealId
    cb.title = 'Select for comparison'
    cb.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>'
    poster.appendChild(cb)
  })
}

function updateFab() {
  const fab = document.getElementById('compare-fab')
  if (!fab) return
  const n = _selectedDealIds.size
  fab.querySelector('.cf-count').textContent = n
  if (n >= 2) {
    fab.style.display = ''
    fab.classList.add('active')
  } else {
    fab.style.display = 'none'
    fab.classList.remove('active')
  }
}


/* ---------- 3k2. Comparison Table (side-by-side multi-deal view) ---------- */

/**
 * Render a comparison table for 2-5 deals. Each deal gets a column.
 * Rows: buyer, target, type, value, date, status, CS, OS, 4 dimensions, TAs, lead molecules.
 */
export function renderComparison(deals) {
  if (!deals || deals.length < 2) {
    return '<p style="color:var(--ink-muted);text-align:center;padding:40px">Select at least 2 deals to compare.</p>'
  }
  if (deals.length > 5) {
    deals = deals.slice(0, 5)
  }

  // Helpers
  const score = (v) => (v == null ? '—' : Math.round(v))
  const scoreTierFor = (v) => (v == null ? '' : v >= 75 ? 'high' : v >= 50 ? 'mid' : 'low')
  const ta = (d) => parseTAs(d.therapeutic_areas).join(' · ') || '—'
  const moleculeList = (d) => {
    try {
      const m = d.lead_molecules ? JSON.parse(d.lead_molecules) : null
      return Array.isArray(m) && m.length ? m.join(', ') : (d.lead_molecules || '—')
    } catch { return d.lead_molecules || '—' }
  }

  // Column headers — each deal is a poster + name
  const headerCells = deals.map(d => `
    <th class="cmp-head">
      <a href="deal.html?id=${d.deal_id}" class="cmp-head-link">
        ${renderPoster(d, 'carousel')}
      </a>
    </th>`).join('')

  // Value row with poster at top (spans whole column header above)
  function row(label, cells, { strong = false, highlightHighest = false } = {}) {
    return `<tr class="cmp-row${strong ? ' cmp-strong' : ''}">
      <th class="cmp-label">${esc(label)}</th>
      ${cells.map(c => `<td class="cmp-val">${c}</td>`).join('')}
    </tr>`
  }

  const rows = [
    row('Deal Type', deals.map(d => esc(d.deal_type || '—'))),
    row('Announced', deals.map(d => formatDate(d.announcement_date))),
    row('Closed', deals.map(d => d.close_date ? formatDate(d.close_date) : '—')),
    row('Value', deals.map(d => `<strong>${formatValue(d.deal_value_usd_mm)}</strong>`), { strong: true }),
    row('Status', deals.map(d => esc(d.deal_status || '—'))),
    row('Therapeutic Areas', deals.map(ta)),
    row('Lead Molecules', deals.map(moleculeList)),

    // Score rows with color tier
    row('Critic Score', deals.map(d => {
      const s = score(d.critic_score); const t = scoreTierFor(d.critic_score)
      return `<span class="cmp-score ${t}">${s}</span>`
    }), { strong: true }),
    row('Outcome Score', deals.map(d => {
      const s = score(d.outcome_score); const t = scoreTierFor(d.outcome_score)
      return `<span class="cmp-score ${t}">${s}</span>`
    }), { strong: true }),

    row('Strategic Fit',     deals.map(d => score(d.strategic_fit_score))),
    row('Financial Return',  deals.map(d => score(d.financial_return_score))),
    row('Asset Performance', deals.map(d => score(d.pipeline_outcome_score))),
    row('Value Realization', deals.map(d => score(d.integration_score))),
    row('Deal Difficulty',   deals.map(d => score(d.deal_difficulty_score))),

    row('EV / Revenue', deals.map(d => d.deal_ev_revenue_x != null ? `${d.deal_ev_revenue_x.toFixed(1)}x` : '—')),
    row('EV / EBITDA',  deals.map(d => d.deal_ev_ebitda_x != null ? `${d.deal_ev_ebitda_x.toFixed(1)}x` : '—')),
    row('Equity Sought', deals.map(d => d.equity_sought_pct != null ? `${d.equity_sought_pct}%` : '—')),
    row('Financing', deals.map(d => esc(d.financing_type || '—'))),
  ]

  return `<table class="cmp-table">
    <thead><tr><th class="cmp-label"></th>${headerCells}</tr></thead>
    <tbody>${rows.join('')}</tbody>
  </table>`
}


/* ---------- 3l. Sources List ---------- */

/** Link health badge: green for 2xx, orange for 403/401 (still accessible to humans), red for 404/410 (dead). */
function linkHealthBadge(status) {
  if (status == null) return '' // never probed
  if (status >= 200 && status < 300) return '' // OK, no badge needed (keep UI clean)
  if (status === 404 || status === 410) return '<span class="src-health src-dead" title="Dead link (404)">⚠ Dead</span>'
  if (status === 403 || status === 401) return '<span class="src-health src-blocked" title="Source exists but blocks automated access">🔒</span>'
  if (status === -1) return '<span class="src-health src-error" title="Connection error">⚠</span>'
  if (status >= 500) return '<span class="src-health src-error" title="Server error">⚠</span>'
  return ''
}

/** Source-alignment badge: flags retrospective / pre-leak / near coverage.
 *  Primary (±90d of announcement) and unknown get NO badge to keep UI clean. */
function alignmentBadge(alignment) {
  if (!alignment || alignment === 'primary') return ''
  if (alignment === 'retrospective') return '<span class="src-align src-retro" title="Published >1 year after the deal was announced — commentary, not primary source">Retrospective</span>'
  if (alignment === 'near') return '<span class="src-align src-near" title="Published 3-12 months after announcement — follow-up coverage">Follow-up</span>'
  if (alignment === 'pre-leak') return '<span class="src-align src-preleak" title="Published >90 days before announcement — possible leak or rumor coverage">Pre-leak</span>'
  return ''
}

export function renderSources(sources) {
  if (!sources || !sources.length) return '<p style="color:var(--ink-faint);font-size:13px">No sources indexed.</p>'

  const SHOW_LIMIT = 5
  // Prefer listing healthy sources first so dead links don't dominate the visible fold
  const sorted = [...sources].sort((a, b) => {
    const sa = a.link_status
    const sb = b.link_status
    const ok = (s) => s != null && s >= 200 && s < 400
    if (ok(sa) && !ok(sb)) return -1
    if (!ok(sa) && ok(sb)) return 1
    return 0
  })
  const items = sorted.map((s, i) => {
    const hidden = i >= SHOW_LIMIT ? ' style="display:none" data-extra-source' : ''
    const healthBadge = linkHealthBadge(s.link_status)
    const alignBadge = alignmentBadge(s.source_alignment)
    const href = (s.link_status === 404 || s.link_status === 410) && s.url
      ? `https://web.archive.org/web/*/${encodeURIComponent(s.url)}` // offer Wayback fallback for dead links
      : (s.url || '#')
    // Show the actual publication date if we extracted it; fall back to date_accessed
    const dateStr = s.published_date
      ? formatDate(s.published_date)
      : formatDate(s.date_accessed)
    return `<div class="src-item"${hidden}>
      <div class="src-type">${esc(s.source_type || 'Article')}${healthBadge}${alignBadge}</div>
      <div class="src-headline"><a href="${esc(href)}" target="_blank">${esc(s.headline || s.source_name || 'Source')}</a></div>
      <div class="src-date">${esc(s.source_name || '')} · ${esc(dateStr)}</div>
    </div>`
  })

  let toggle = ''
  if (sources.length > SHOW_LIMIT) {
    toggle = `<button class="f-more" onclick="this.parentElement.querySelectorAll('[data-extra-source]').forEach(el=>el.style.display='');this.remove()">Show ${sources.length - SHOW_LIMIT} more →</button>`
  }

  return items.join('') + toggle
}


/* ==========================================================================
   4. INTERACTIVE FUNCTIONS
   ========================================================================== */

/* ---------- 4a. Carousel ---------- */

/**
 * Initialize arrow buttons + optional auto-scroll + snap scrolling on a carousel container.
 * @param {HTMLElement} container - The .carousel-wrap element
 * @param {Object} options - { autoScroll: false, interval: 5000 }
 */
export function initCarousel(container, options = {}) {
  const track = container.querySelector('.carousel')
  if (!track) return

  const leftBtn = container.querySelector('.arrow-btn:first-child') || container.querySelectorAll('.arrow-btn')[0]
  const rightBtn = container.querySelector('.arrow-btn:last-child') || container.querySelectorAll('.arrow-btn')[1]

  const scrollAmount = 220 // slightly more than one poster width + gap

  if (leftBtn) {
    leftBtn.addEventListener('click', () => {
      track.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
    })
  }
  if (rightBtn) {
    rightBtn.addEventListener('click', () => {
      track.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    })
  }

  // Auto-scroll
  if (options.autoScroll) {
    let interval = setInterval(() => {
      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 10) {
        track.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        track.scrollBy({ left: scrollAmount, behavior: 'smooth' })
      }
    }, options.interval || 5000)

    // Pause on hover
    container.addEventListener('mouseenter', () => clearInterval(interval))
    container.addEventListener('mouseleave', () => {
      interval = setInterval(() => {
        if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 10) {
          track.scrollTo({ left: 0, behavior: 'smooth' })
        } else {
          track.scrollBy({ left: scrollAmount, behavior: 'smooth' })
        }
      }, options.interval || 5000)
    })
  }
}


/* ---------- 4b. Search ---------- */

/**
 * Wire up debounced search + filter binding + pagination + sort.
 * @param {HTMLInputElement} inputEl - The search input
 * @param {HTMLElement} filtersEl - Container with filter chips
 * @param {HTMLElement} resultsEl - Container where results get rendered
 * @param {Object} opts - { sortSelectId, pageSize }
 */
export function initSearch(inputEl, filtersEl, resultsEl, opts = {}) {
  if (!inputEl || !resultsEl) return
  let debounceTimer = null
  let loadedCount = 0
  let totalCount = 0

  function readFilters() {
    const f = {}
    filtersEl?.querySelectorAll('select').forEach(sel => {
      if (sel.value) f[sel.name] = sel.value
    })
    return f
  }

  async function runSearch({ append = false } = {}) {
    const query = inputEl.value.trim()
    const filters = readFilters()
    const hasNonSortFilter = Object.keys(filters).filter(k => k !== 'sort').length > 0
    if (query.length < 2 && !hasNonSortFilter) {
      resultsEl.innerHTML = ''
      return
    }
    const offset = append ? loadedCount : 0
    if (!append) resultsEl.innerHTML = '<p class="search-status">Searching...</p>'
    try {
      const { deals, total } = await searchDeals(query, filters, { limit: 25, offset })
      if (!append) loadedCount = 0
      loadedCount += deals.length
      totalCount = total
      renderResults(deals, append)
    } catch (e) {
      resultsEl.innerHTML = '<p class="search-status error">Search is temporarily unavailable. Try again.</p>'
      console.error('searchDeals error', e)
    }
  }

  function renderResults(deals, append) {
    const gridHtml = deals.map(d => renderPoster(d, 'carousel')).join('')
    if (append) {
      resultsEl.querySelector('.grid')?.insertAdjacentHTML('beforeend', gridHtml)
    } else if (!deals.length) {
      resultsEl.innerHTML = '<p class="search-status">No deals found.</p>'
      return
    } else {
      resultsEl.innerHTML = `
        <p class="search-count">Showing ${loadedCount} of ${totalCount} results</p>
        <div class="grid">${gridHtml}</div>`
    }
    updateLoadMore()
  }

  function updateLoadMore() {
    resultsEl.querySelector('.load-more-btn')?.remove()
    if (loadedCount < totalCount) {
      const btn = document.createElement('button')
      btn.className = 'load-more-btn'
      btn.textContent = `Load more (${totalCount - loadedCount} remaining)`
      btn.onclick = () => runSearch({ append: true })
      resultsEl.appendChild(btn)
    }
    const countEl = resultsEl.querySelector('.search-count')
    if (countEl) countEl.textContent = `Showing ${loadedCount} of ${totalCount} results`
  }

  inputEl.addEventListener('input', () => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => runSearch({ append: false }), 350)
  })
  filtersEl?.addEventListener('change', () => runSearch({ append: false }))
}
