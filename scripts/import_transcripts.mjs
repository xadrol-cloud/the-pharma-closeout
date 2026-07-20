#!/usr/bin/env node
// Import podcast episode transcripts from the engine archive (pce-work/02_Episodes)
// into this site repo's content store (content/episodes/), with YAML front-matter,
// so the site build can render episode pages.
//
// Usage:
//   node scripts/import_transcripts.mjs            # last 3 dated folders only
//   node scripts/import_transcripts.mjs --all       # every dated folder
//   node scripts/import_transcripts.mjs --src <path> [--all]
//
// Node built-ins only. No deps.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const DEFAULT_SRC = 'C:\\Users\\xadro\\pce-work\\02_Episodes';
const OUT_DIR = path.join(REPO_ROOT, 'content', 'episodes');
const DATED_FOLDER_RE = /^\d{4}-\d{2}-\d{2}$/;
const METADATA_MARKER = '### EPISODE METADATA';

/**
 * Parse CLI args: --all, --src <path>
 */
function parseArgs(argv) {
  const args = { all: false, src: DEFAULT_SRC };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--all') {
      args.all = true;
    } else if (arg === '--src') {
      const next = argv[i + 1];
      if (next) {
        args.src = next;
        i++;
      }
    }
  }
  return args;
}

/**
 * Extract the clean Title and Description from the EPISODE METADATA block.
 * Falls back to first non-header non-empty line, or the date, for title.
 */
function extractMetadata(scriptRaw, date) {
  let title = null;
  let description = '';

  const metadataIndex = scriptRaw.indexOf(METADATA_MARKER);
  const metadataBlock = metadataIndex === -1 ? '' : scriptRaw.slice(metadataIndex);

  const titleMatch = metadataBlock.match(/^\*\*Title:\*\*\s*(.+)$/m);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }

  const descMatch = metadataBlock.match(/^\*\*Description:\*\*\s*(.+)$/m);
  if (descMatch) {
    description = descMatch[1].trim();
  }

  if (!title) {
    // Fall back to the first non-empty line that isn't a `### [...]` header.
    const lines = scriptRaw.split(/\r\n|\r|\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '') continue;
      if (/^###\s*\[.*\]\s*$/.test(trimmed)) continue;
      title = trimmed;
      break;
    }
  }

  if (!title) {
    title = date;
  }

  return { title, description };
}

/**
 * Compute a URL slug from a clean title + date.
 * Strips a leading "Prefix |" style segment, removes punctuation, lowercases,
 * collapses whitespace to hyphens, keeps first 8 words.
 */
function computeSlug(title, date) {
  let working = title;

  // Strip a leading "Week in Review |" / "Daily Roundup |" style prefix
  // (any text before a pipe character).
  const pipeIndex = working.indexOf('|');
  if (pipeIndex !== -1) {
    working = working.slice(pipeIndex + 1);
  }

  const lower = working.toLowerCase();
  // Remove punctuation (colons, commas, periods, apostrophes, dashes, etc.),
  // keep letters/digits/whitespace.
  const stripped = lower.replace(/[^\p{L}\p{N}\s]/gu, '');
  const collapsed = stripped.trim().replace(/\s+/g, ' ');
  const words = collapsed.split(' ').filter(Boolean).slice(0, 8);
  const slugPart = words.join('-');

  return `${date}-${slugPart}`;
}

/**
 * Read the existing slug from a target file's front-matter, if present.
 */
function readExistingSlug(targetPath) {
  if (!fs.existsSync(targetPath)) return null;
  const existing = fs.readFileSync(targetPath, 'utf8');
  const fmMatch = existing.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) return null;
  const slugMatch = fmMatch[1].match(/^slug:\s*(.+)$/m);
  if (!slugMatch) return null;
  let value = slugMatch[1].trim();
  // Unwrap a double-quoted YAML scalar (as written by this script) back to raw text.
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  return value;
}

/**
 * Escape a value for safe single-line YAML scalar embedding.
 * Uses double-quoted style with minimal escaping.
 */
function yamlScalar(value) {
  const str = String(value ?? '');
  const escaped = str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}

function main() {
  const { all, src } = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(src)) {
    console.log(`[import_transcripts] Notice: engine source path does not exist: ${src}. Skipping import; build will use already-committed content.`);
    process.exit(0);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  let datedFolders = entries
    .filter((e) => e.isDirectory() && DATED_FOLDER_RE.test(e.name))
    .map((e) => e.name)
    .sort();

  if (!all) {
    datedFolders = datedFolders.slice(-3);
  }

  let imported = 0;
  let withStories = 0;

  for (const date of datedFolders) {
    const folderPath = path.join(src, date);
    const filesInFolder = fs.readdirSync(folderPath, { withFileTypes: true });

    // Find Episode_Script_*.md, excluding *_STUDIO.txt / any non-.md variants.
    const scriptFile = filesInFolder
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .find((name) => /^Episode_Script_.*\.md$/.test(name));

    if (!scriptFile) {
      continue; // No transcript in this folder — skip.
    }

    const scriptPath = path.join(folderPath, scriptFile);
    const scriptRaw = fs.readFileSync(scriptPath, 'utf8');

    const { title, description } = extractMetadata(scriptRaw, date);

    const targetPath = path.join(OUT_DIR, `${date}.md`);
    const existingSlug = readExistingSlug(targetPath);
    const slug = existingSlug || computeSlug(title, date);

    const frontMatter = [
      '---',
      `slug: ${yamlScalar(slug)}`,
      `date: ${yamlScalar(date)}`,
      `title: ${yamlScalar(title)}`,
      `description: ${yamlScalar(description)}`,
      '---',
      '',
    ].join('\n');

    const outContent = frontMatter + scriptRaw;
    fs.writeFileSync(targetPath, outContent, 'utf8');
    imported++;

    // Copy story_index.json if present.
    const storyIndexPath = path.join(folderPath, 'story_index.json');
    if (fs.existsSync(storyIndexPath)) {
      const storyRaw = fs.readFileSync(storyIndexPath, 'utf8');
      const storyTargetPath = path.join(OUT_DIR, `${date}.stories.json`);
      fs.writeFileSync(storyTargetPath, storyRaw, 'utf8');
      withStories++;
    }

    console.log(`[import_transcripts] Imported ${date} -> slug: ${slug}`);
  }

  console.log(`[import_transcripts] Done. Imported ${imported} episode(s), ${withStories} with story_index.json.`);
}

main();
