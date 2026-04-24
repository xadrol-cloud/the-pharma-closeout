/* ==========================================================================
   FORMAT HELPERS — Centralized number & date formatting
   The Pharma Closeout · thepharmacloseout.com/deals

   Separated from deals.js so individual pages can import just what they need,
   and to enforce a single source of truth for currency/date rendering.
   ========================================================================== */

/**
 * Format a USD-millions value with a "B" suffix for multi-billion ranges.
 *   500      -> "$500M"
 *   1000     -> "$1.0B"
 *   9900     -> "$9.9B"
 *   10000    -> "$10B"   (drops decimal above $10B)
 *   null/NaN -> "—"
 */
export function formatValue(mm) {
  if (mm == null || isNaN(mm)) return '—'
  const abs = Math.abs(mm)
  if (abs >= 1000) {
    const b = (mm / 1000).toFixed(abs >= 10000 ? 0 : 1)
    return `$${b}B`
  }
  return `$${Math.round(mm)}M`
}

/**
 * Format an ISO date string ("2019-01-03") into "Jan 3, 2019".
 * Returns "—" when the input is empty/null.
 */
export function formatDate(isoDate) {
  if (!isoDate) return '—'
  const d = new Date(isoDate + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
