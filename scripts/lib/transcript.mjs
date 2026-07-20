const HOST_SPEAKERS = new Set(['ALEX', 'MAYA']);
const SMALL_WORDS = new Set(['and', 'the', 'of', 'in']);
const METADATA_MARKER = '### EPISODE METADATA';
const SPEAKER_LINE_RE = /^([A-Z][A-Z0-9]*):\s*(.*)$/;
const SEGMENT_HEADER_RE = /^###\s*\[(.+)\]\s*$/;

/**
 * Title-case a segment title, lowercasing small words except the first word.
 * @param {string} text
 * @returns {string}
 */
function titleCase(text) {
  const words = text.trim().split(/\s+/);
  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && SMALL_WORDS.has(lower)) {
        return lower;
      }
      // Preserve first letter capitalized, rest lowercased.
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

/**
 * Derive a display title from a raw `[SEGMENT HEADER]` bracket contents string.
 * If it contains a spaced em-dash, keep only the text after the LAST one.
 * @param {string} bracketContents
 * @returns {string}
 */
function deriveTitle(bracketContents) {
  const emDashParts = bracketContents.split(' — ');
  const relevant = emDashParts[emDashParts.length - 1];
  return titleCase(relevant);
}

/**
 * Parse a raw podcast episode script (Markdown) into a structured transcript.
 * @param {string} raw
 * @returns {{ segments: Array<{ title: string, turns: Array<{ speaker: string, role: string, text: string }> }> }}
 */
export function parseTranscript(raw) {
  if (!raw || typeof raw !== 'string' || raw.trim() === '') {
    return { segments: [] };
  }

  // Truncate everything at the episode metadata marker so it never leaks.
  const metadataIndex = raw.indexOf(METADATA_MARKER);
  const body = metadataIndex === -1 ? raw : raw.slice(0, metadataIndex);

  const lines = body.split(/\r\n|\r|\n/);

  const segments = [];
  let currentSegment = null;
  let currentTurn = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '') {
      continue;
    }

    if (trimmed === '---') {
      continue;
    }

    const headerMatch = trimmed.match(SEGMENT_HEADER_RE);
    if (headerMatch) {
      currentSegment = { title: deriveTitle(headerMatch[1]), turns: [] };
      segments.push(currentSegment);
      currentTurn = null;
      continue;
    }

    // Lines before any segment header (e.g. stray front-matter remnants) are ignored.
    if (!currentSegment) {
      continue;
    }

    const speakerMatch = trimmed.match(SPEAKER_LINE_RE);
    if (speakerMatch) {
      const speaker = speakerMatch[1];
      const text = speakerMatch[2];
      currentTurn = {
        speaker,
        role: HOST_SPEAKERS.has(speaker) ? 'host' : 'guest',
        text,
      };
      currentSegment.turns.push(currentTurn);
      continue;
    }

    // A non-empty line without a SPEAKER: prefix following a turn is a wrapped continuation.
    if (currentTurn) {
      currentTurn.text = `${currentTurn.text} ${trimmed}`;
    }
  }

  return { segments };
}
