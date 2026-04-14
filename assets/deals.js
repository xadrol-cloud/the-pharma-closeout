/* ==========================================================================
   DEAL INTELLIGENCE — Shared JavaScript Module
   The Pharma Closeout · thepharmacloseout.com/deals

   All data functions query Supabase directly from the browser.
   All render functions return HTML strings using class names from deals.css.
   ========================================================================== */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabase = createClient(
  'https://nuqhlvlslwroupedduog.supabase.co',
  'sb_publishable_amtSGMKyQTDPPjkUHcoquw_uoSZfipS'
)


/* ==========================================================================
   1. UTILITY FUNCTIONS
   ========================================================================== */

const SELF_HOSTED_LOGOS = []

/**
 * Get logo URL for a company domain.
 * Checks SELF_HOSTED_LOGOS first, then falls back to gstatic favicon API.
 */
export function logoUrl(domain) {
  if (!domain) return null
  const hosted = SELF_HOSTED_LOGOS.find(l => domain.includes(l))
  if (hosted) return `/assets/logos/${hosted}.png`
  return `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`
}

/** Format deal value: 1000 → "$1.0B", 500 → "$500M", null → "—" */
export function formatValue(mm) {
  if (mm == null || isNaN(mm)) return '—'
  if (mm >= 1000) return `$${(mm / 1000).toFixed(1)}B`
  return `$${Math.round(mm)}M`
}

/** Format ISO date string: "2019-01-03" → "Jan 3, 2019" */
export function formatDate(isoDate) {
  if (!isoDate) return '—'
  const d = new Date(isoDate + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

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
function logoHtml(domain, name, cssPrefix) {
  const url = logoUrl(domain)
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

/** Search deals by text query + optional filters */
export async function searchDeals(query, filters = {}) {
  let q = supabase.from('deals_enriched').select('*')
  if (query) {
    q = q.or(`buyer_name.ilike.%${query}%,target_name.ilike.%${query}%,therapeutic_areas.ilike.%${query}%,lead_molecules.ilike.%${query}%,indications.ilike.%${query}%`)
  }
  if (filters.deal_type) q = q.eq('deal_type', filters.deal_type)
  if (filters.era) q = q.eq('era_tag', filters.era)
  if (filters.min_value) q = q.gte('deal_value_usd_mm', filters.min_value)
  if (filters.max_value) q = q.lte('deal_value_usd_mm', filters.max_value)
  q = q.order('announcement_date', { ascending: false }).limit(50)
  const { data } = await q
  return data || []
}

/** Fetch disease indications for a deal (ordered by US patients desc) */
export async function fetchDiseaseIndications(dealId) {
  const { data } = await supabase
    .from('disease_indications')
    .select('*')
    .eq('deal_id', dealId)
    .order('us_patients_annual', { ascending: false, nullsLast: true });
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
  const ta = tas[0] || ''
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
          <div class="fp-logo">${logoHtml(deal.buyer_domain, deal.buyer_name, 'fp')}</div>
          <span class="fp-times">&times;</span>
          <div class="fp-logo">${logoHtml(deal.target_domain, deal.target_name, 'fp')}</div>
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
          <div class="c-logo">${logoHtml(deal.buyer_domain, deal.buyer_name, 'c')}</div>
          <span class="c-times">&times;</span>
          <div class="c-logo">${logoHtml(deal.target_domain, deal.target_name, 'c')}</div>
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
 */
export function renderScorePill(type, score, subtitle = '') {
  const cls = type === 'critic' ? 'fs-critic' : 'fs-outcome'
  const label = type === 'critic' ? 'Critic Score' : 'Outcome Score'
  const display = score != null ? score : '—'

  return `<div class="feat-score ${cls}">
  <span class="feat-score-num">${display}</span>
  <div class="feat-score-label">
    <span class="feat-score-type">${label}</span>
    ${subtitle ? `<span class="feat-score-desc">${esc(subtitle)}</span>` : ''}
  </div>
</div>`
}


/* ---------- 3d. Timeline ---------- */

/**
 * Vertical timeline from deal outcomes array.
 * Colored dots: green/amber/red based on verdict.
 */
export function renderTimeline(outcomes) {
  if (!outcomes || !outcomes.length) return '<p style="color:var(--ink-faint);font-size:13px">No outcome data available yet.</p>'

  const items = outcomes.map(o => {
    const color = verdictColor(o.verdict)
    const facts = (o.facts || []).slice(0, 3)
    return `<div class="tl-item">
      <div class="tl-dot ${color}"></div>
      <div class="tl-date">${esc(o.window || '')}</div>
      <div class="tl-title">${esc(o.headline || o.window || 'Update')}</div>
      <div class="tl-body">${esc(o.summary || '')}${facts.length ? '<br>' + facts.map(f => `• ${esc(f.fact_text || '')}`).join('<br>') : ''}</div>
      ${o.source_url ? `<div class="tl-src"><a href="${esc(o.source_url)}" target="_blank">Source →</a></div>` : ''}
    </div>`
  })

  return `<div class="tl">${items.join('')}</div>`
}


/* ---------- 3e. Revenue Arc (SVG area chart) ---------- */

/**
 * SVG area chart from outcome_facts revenue data.
 * Parses "$X.XB revenue" from fact_text. Min 3 data points to render.
 */
export function renderRevenueArc(outcomes) {
  // Extract revenue data points from facts
  const dataPoints = []
  for (const o of (outcomes || [])) {
    for (const f of (o.facts || [])) {
      const text = f.fact_text || ''
      const match = text.match(/\$([\d.]+)([BM])\s*(?:revenue|rev|sales)/i)
      if (match) {
        let val = parseFloat(match[1])
        if (match[2].toUpperCase() === 'M') val = val / 1000
        dataPoints.push({ date: f.date || o.window || '', value: val, label: `$${match[1]}${match[2]}` })
      }
    }
  }

  if (dataPoints.length < 3) {
    return `<div class="rev-card">
      <div class="rev-headline">Revenue Arc</div>
      <div class="rev-subtitle">Insufficient data — requires 3+ revenue data points</div>
    </div>`
  }

  // Sort by date
  dataPoints.sort((a, b) => (a.date > b.date ? 1 : -1))

  const maxVal = Math.max(...dataPoints.map(d => d.value))
  const minVal = Math.min(...dataPoints.map(d => d.value))
  const padding = 20
  const w = 600
  const h = 200
  const chartW = w - padding * 2
  const chartH = h - padding * 2

  // Build path
  const points = dataPoints.map((d, i) => {
    const x = padding + (i / (dataPoints.length - 1)) * chartW
    const y = padding + chartH - ((d.value - minVal) / (maxVal - minVal || 1)) * chartH
    return { x, y, ...d }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaPath = linePath + ` L${points[points.length - 1].x},${h - padding} L${points[0].x},${h - padding} Z`

  // Stats
  const first = dataPoints[0].value
  const last = dataPoints[dataPoints.length - 1].value
  const peak = maxVal
  const growth = first > 0 ? (((last - first) / first) * 100).toFixed(0) : '—'
  const growthColor = growth !== '—' && parseFloat(growth) >= 0 ? 'green' : 'red'

  return `<div class="rev-card">
  <div class="rev-headline">Revenue Arc</div>
  <div class="rev-subtitle">Post-acquisition revenue trajectory</div>
  <div class="rev-chart-area">
    <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--green)" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="var(--green)" stop-opacity="0.02"/>
        </linearGradient>
      </defs>
      <path d="${areaPath}" fill="url(#revGrad)"/>
      <path d="${linePath}" fill="none" stroke="var(--green)" stroke-width="2.5" stroke-linejoin="round"/>
      ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="var(--paper)" stroke="var(--green)" stroke-width="2"/>`).join('')}
      ${points.map(p => `<text x="${p.x}" y="${p.y - 10}" text-anchor="middle" font-size="10" fill="var(--ink-muted)" font-family="var(--mono)">${p.label}</text>`).join('')}
    </svg>
  </div>
  <div class="rev-stats">
    <div class="rev-stat"><div class="rev-stat-val green">$${peak.toFixed(1)}B</div><div class="rev-stat-label">Peak Revenue</div></div>
    <div class="rev-stat"><div class="rev-stat-val ${growthColor}">${growth}%</div><div class="rev-stat-label">Total Growth</div></div>
    <div class="rev-stat"><div class="rev-stat-val">${dataPoints.length}</div><div class="rev-stat-label">Data Points</div></div>
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

    // Market row cells
    const mktCells = []
    if (ind.us_patients_annual != null) {
      mktCells.push(`<div class="mkt-cell"><div class="mc-val">${esc(fmtPatients(ind.us_patients_annual))}</div><div class="mc-label">New Cases/yr</div><div class="mc-src">${esc(ind.us_patients_source || '')}</div></div>`)
    }
    if (ind.prevalence_or_living_with) {
      mktCells.push(`<div class="mkt-cell"><div class="mc-val">${esc(ind.prevalence_or_living_with)}</div><div class="mc-label">Prevalence</div><div class="mc-src">${esc(ind.prevalence_source || '')}</div></div>`)
    }
    if (ind.market_size_usd_mm != null) {
      mktCells.push(`<div class="mkt-cell"><div class="mc-val">${esc(fmtMarket(ind.market_size_usd_mm))}</div><div class="mc-label">${esc(ind.market_size_label || 'US Market')}</div><div class="mc-src">${esc(ind.market_size_source || '')}</div></div>`)
    }
    if (ind.fourth_metric_value) {
      mktCells.push(`<div class="mkt-cell"><div class="mc-val">${esc(ind.fourth_metric_value)}</div><div class="mc-label">${esc(ind.fourth_metric_label || '')}</div><div class="mc-src">${esc(ind.fourth_metric_source || '')}</div></div>`)
    }

    // Asset mini rows
    const assetRows = indAssets.map(a =>
      `<div class="am-row"><div class="am-name">${esc(a.asset_name || '')}</div><div class="am-moa">${esc(a.asset_moa || '')}</div><div class="am-status ${esc(a.asset_status_class || '')}">${esc(a.asset_status || '')}</div><div class="am-rev">${esc(a.asset_revenue_label || '')}</div></div>`
    ).join('')

    return `<div class="disease-card"><div class="disease-header" aria-expanded="${expanded ? 'true' : 'false'}" onclick="this.setAttribute('aria-expanded',this.getAttribute('aria-expanded')==='true'?'false':'true');this.nextElementSibling.classList.toggle('open')"><div class="disease-icon" style="background:#f3f4f6">${ind.indication_emoji || '💊'}</div><div class="disease-name-block"><div class="disease-name">${esc(ind.indication)}</div><div class="disease-assets">${assetTags}</div></div><div class="disease-stats"><div class="ds"><div class="ds-val">${patientsFormatted}</div><div class="ds-label">US Cases/yr</div></div><div class="ds"><div class="ds-val">${marketFormatted}</div><div class="ds-label">${esc(marketLabel)}</div></div></div><div class="dchev"><svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg></div></div>
    <div class="dpanel${expanded ? ' open' : ''}"><div class="dpanel-inner">
      <div class="dp-grid"><div class="dp-block"><h4>Disease Overview</h4><p>${esc(ind.disease_overview || '')}</p></div><div class="dp-block"><h4>${esc(ind.second_column_label || 'Competitive Landscape')}</h4><p>${esc(ind.second_column_text || '')}</p></div></div>
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


/* ---------- 3i. Key Assets (molecule table) ---------- */

export function renderKeyAssets(deal) {
  const molecules = parseTAs(deal.lead_molecules)
  const moas = parseTAs(deal.mechanisms_of_action)

  if (!molecules.length) return '<p style="color:var(--ink-faint);font-size:13px">No molecule data available.</p>'

  const rows = molecules.map((mol, i) => {
    const moa = moas[i] || moas[0] || '—'
    return `<div class="am-row">
      <span class="am-name">${esc(mol)}</span>
      <span class="am-moa">${esc(moa)}</span>
    </div>`
  })

  return `<div class="asset-mini">
    <div class="am-title">Key Assets</div>
    ${rows.join('')}
  </div>`
}


/* ---------- 3j. Score Breakdown ---------- */

/**
 * Expandable bars for 4 dimensions + difficulty modifier.
 * Uses outcome data to derive dimension scores.
 */
export function renderScoreBreakdown(outcomes) {
  if (!outcomes || !outcomes.length) return ''

  // Derive dimension scores from outcomes — use actual DB column names
  const dimensions = [
    { label: 'Strategic Fit', key: 'strategic_fit_score', icon: '🎯', weight: '25%' },
    { label: 'Financial Return', key: 'financial_return_score', icon: '📈', weight: '35%' },
    { label: 'Pipeline Outcome', key: 'pipeline_outcome_score', icon: '🧬', weight: '25%' },
    { label: 'Integration', key: 'integration_score', icon: '⚙️', weight: '15%' },
  ]

  // Use the latest completed outcome (prefer 15yr > 10yr > 5yr)
  const sorted = [...outcomes].sort((a, b) => {
    const order = { '15yr': 0, '10yr': 1, '5yr': 2 }
    return (order[a.window] ?? 3) - (order[b.window] ?? 3)
  })
  const latest = sorted.find(o => o.strategic_fit_score != null) || sorted[0] || {}

  const rows = dimensions.map(dim => {
    const score = latest[dim.key] != null ? latest[dim.key] : null
    const pct = score != null ? score : 50  // 0-100 scale maps directly to %
    const tier = score != null ? (score >= 75 ? 'high' : score >= 50 ? 'mid' : 'low') : ''
    const display = score != null ? score : '—'

    return `<div class="sc-row">
      <div class="sc-header" aria-expanded="false" onclick="this.setAttribute('aria-expanded',this.getAttribute('aria-expanded')==='true'?'false':'true');this.closest('.sc-row').querySelector('.sc-detail').classList.toggle('open')">
        <span class="sc-label">${dim.icon} ${dim.label} <span style="font-size:11px;color:var(--ink-faint)">(${dim.weight})</span></span>
        <span class="sc-num">${display}</span>
        <div class="sc-chev"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></div>
      </div>
      <div class="sc-bar"><div class="sc-fill ${tier}" style="width:${pct}%"></div></div>
      <div class="sc-detail">
        <div class="sc-detail-inner ${tier}">
          ${score != null ? `Score: <strong>${display}/100</strong>` : 'Score not yet calculated for this dimension.'}
        </div>
      </div>
    </div>`
  })

  // Deal difficulty modifier
  const difficulty = latest.deal_difficulty_score != null ? latest.deal_difficulty_score : null
  const multiplier = difficulty != null ? (0.8 + difficulty * 0.004).toFixed(2) : null
  if (difficulty != null) {
    rows.push(`<div class="sc-method">Deal Difficulty: <strong>${difficulty}/100</strong> — multiplier ×${multiplier}</div>`)
  }

  return rows.join('')
}


/* ---------- 3k. Comparables Sidebar ---------- */

export function renderComparables(comparables) {
  if (!comparables || !comparables.length) return ''

  const items = comparables.map(deal => {
    const bg = bgClass(deal.deal_type)
    const criticScore = deal.critic_score != null ? Math.round(deal.critic_score) : null
    const outcomeScore = deal.outcome_score != null ? Math.round(deal.outcome_score) : null
    const val = formatValue(deal.deal_value_usd_mm)

    return `<a class="comp" href="deal.html?id=${deal.deal_id}">
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
    </a>`
  })

  return items.join('')
}


/* ---------- 3l. Sources List ---------- */

export function renderSources(sources) {
  if (!sources || !sources.length) return '<p style="color:var(--ink-faint);font-size:13px">No sources indexed.</p>'

  const SHOW_LIMIT = 5
  const items = sources.map((s, i) => {
    const hidden = i >= SHOW_LIMIT ? ' style="display:none" data-extra-source' : ''
    return `<div class="src-item"${hidden}>
      <div class="src-type">${esc(s.source_type || 'Article')}</div>
      <div class="src-headline"><a href="${esc(s.url || '#')}" target="_blank">${esc(s.headline || s.source_name || 'Source')}</a></div>
      <div class="src-date">${esc(s.source_name || '')} · ${esc(formatDate(s.date_accessed || s.published_date))}</div>
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
 * Wire up debounced search + filter binding.
 * @param {HTMLInputElement} inputEl - The search input
 * @param {HTMLElement} filtersEl - Container with filter chips
 * @param {HTMLElement} resultsEl - Container where results get rendered
 */
export function initSearch(inputEl, filtersEl, resultsEl) {
  if (!inputEl || !resultsEl) return

  let debounceTimer = null
  const filters = {}

  // Collect filter state from chips
  function readFilters() {
    if (!filtersEl) return
    filtersEl.querySelectorAll('select').forEach(sel => {
      if (sel.value) filters[sel.name] = sel.value
      else delete filters[sel.name]
    })
  }

  async function runSearch() {
    readFilters()
    const query = inputEl.value.trim()
    if (!query && !Object.keys(filters).length) {
      resultsEl.innerHTML = ''
      return
    }
    resultsEl.innerHTML = '<p style="color:var(--ink-faint);font-size:13px;text-align:center;padding:40px 0">Searching...</p>'
    const deals = await searchDeals(query, filters)
    if (!deals.length) {
      resultsEl.innerHTML = '<p style="color:var(--ink-faint);font-size:13px;text-align:center;padding:40px 0">No deals found.</p>'
      return
    }
    resultsEl.innerHTML = `<div class="grid">${deals.map(d => renderPoster(d, 'carousel')).join('')}</div>`
  }

  inputEl.addEventListener('input', () => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(runSearch, 350)
  })

  if (filtersEl) {
    filtersEl.addEventListener('change', runSearch)
  }
}
