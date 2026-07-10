#!/usr/bin/env node
/**
 * bump-assets-version.mjs
 *
 * Rewrites the `?v=<anything>` cache-busting suffix to `?v=<newVersion>` for
 * references to the four shared front-end assets:
 *   - assets/deals.js
 *   - assets/deals.css
 *   - assets/scoring.js
 *   - assets/format.js
 *
 * Scope:
 *   - Every root-level *.html file (does NOT recurse into deals/, which
 *     holds generated SEO pages and does not reference these assets).
 *   - The internal pins inside assets/deals.js itself (./format.js?v=...
 *     and ./scoring.js?v=...).
 *
 * Usage:
 *   node scripts/bump-assets-version.mjs 20260710a
 *
 * Exits with code 1 if no replacements were made anywhere (guards against
 * silent no-ops, e.g. a bad version string or a scope regression).
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const newVersion = process.argv[2]

if (!newVersion) {
  console.error('Usage: node scripts/bump-assets-version.mjs <newVersion>')
  console.error('Example: node scripts/bump-assets-version.mjs 20260710a')
  process.exit(1)
}

if (!/^[A-Za-z0-9._-]+$/.test(newVersion)) {
  console.error(`Refusing to use version "${newVersion}" — contains characters outside [A-Za-z0-9._-]`)
  process.exit(1)
}

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..')

// Asset basenames whose ?v= pins we own. Matched against both
// `assets/<name>?v=...` (HTML references) and `./<name>?v=...` (internal
// pins inside assets/deals.js). The leading `(?:assets/|\./)` prefix keeps
// this from matching unrelated files like assets/nav.js.
const ASSET_NAMES = ['deals\\.js', 'deals\\.css', 'scoring\\.js', 'format\\.js']
const ASSET_PATTERN = new RegExp(
  `((?:assets/|\\./)(?:${ASSET_NAMES.join('|')})\\?v=)[^"'\\s)]*`,
  'g'
)

/**
 * Rewrite matching ?v= pins in `content`. Returns { content, changedCount }
 * where changedCount only counts pins whose value actually differs from
 * newVersion (so re-running with the same version reports zero changes,
 * even though the pattern still "matches").
 */
function rewrite(content) {
  let changedCount = 0
  const updated = content.replace(ASSET_PATTERN, (match, prefix, offset) => {
    const oldValue = match.slice(prefix.length)
    if (oldValue === newVersion) return match
    changedCount += 1
    return `${prefix}${newVersion}`
  })
  return { content: updated, changedCount }
}

function processFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8')
  const { content, changedCount } = rewrite(original)
  if (changedCount > 0 && content !== original) {
    fs.writeFileSync(filePath, content, 'utf8')
  }
  return changedCount
}

// Root-level *.html files only (no recursion into deals/ or other subdirs).
const htmlFiles = fs
  .readdirSync(repoRoot, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
  .map((entry) => entry.name)
  .sort()

const targets = [...htmlFiles, path.join('assets', 'deals.js')]

let totalReplacements = 0
let filesChanged = 0

for (const relPath of targets) {
  const fullPath = path.join(repoRoot, relPath)
  if (!fs.existsSync(fullPath)) continue

  const count = processFile(fullPath)
  if (count > 0) {
    filesChanged += 1
    totalReplacements += count
    console.log(`${relPath}: ${count} replacement${count === 1 ? '' : 's'}`)
  }
}

console.log(`\nTotal: ${totalReplacements} replacement${totalReplacements === 1 ? '' : 's'} across ${filesChanged} file${filesChanged === 1 ? '' : 's'} -> ?v=${newVersion}`)

if (totalReplacements === 0) {
  console.error('No replacements made. Nothing changed on disk — aborting with exit code 1.')
  process.exit(1)
}
