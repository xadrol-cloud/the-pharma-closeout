import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTranscript } from '../scripts/lib/transcript.mjs';

const SAMPLE = `### [COLD OPEN]

ALEX: Welcome back to the show.

MAYA: Glad to be here.

---

### [WEEK IN REVIEW — DEAL LANDSCAPE]

ALEX: Big week for M&A.

MARCUS: Yeah, three deals closed.

---

### [THE WEEK AHEAD]

ALEX: Looking forward to next week.

---

### EPISODE METADATA (For Podcast Hosting Upload)
**Title:** Some Title
**Slug:** some-slug
`;

test('parses 3 segments with correct titles including em-dash and no-em-dash rules', () => {
  const result = parseTranscript(SAMPLE);
  assert.equal(result.segments.length, 3);
  assert.equal(result.segments[0].title, 'Cold Open');
  assert.equal(result.segments[1].title, 'Deal Landscape');
  assert.equal(result.segments[2].title, 'The Week Ahead');
});

test('tags MARCUS as guest and ALEX/MAYA as host', () => {
  const result = parseTranscript(SAMPLE);
  const weekInReview = result.segments[1];
  const alexTurn = weekInReview.turns.find((t) => t.speaker === 'ALEX');
  const marcusTurn = weekInReview.turns.find((t) => t.speaker === 'MARCUS');
  assert.equal(alexTurn.role, 'host');
  assert.equal(marcusTurn.role, 'guest');

  const coldOpen = result.segments[0];
  const mayaTurn = coldOpen.turns.find((t) => t.speaker === 'MAYA');
  assert.equal(mayaTurn.role, 'host');
});

test('em-dash and typographic apostrophe in turn text survive into output', () => {
  const raw = `### [COLD OPEN]

ALEX: It’s a big week — huge, really.
`;
  const result = parseTranscript(raw);
  assert.equal(result.segments[0].turns[0].text, 'It’s a big week — huge, really.');
});

test('wrapped continuation lines are appended to the previous turn', () => {
  const raw = `### [COLD OPEN]

ALEX: This is a long line
that wraps onto the next line
and even a third line.

MAYA: Short reply.
`;
  const result = parseTranscript(raw);
  const turns = result.segments[0].turns;
  assert.equal(turns.length, 2);
  assert.equal(
    turns[0].text,
    'This is a long line that wraps onto the next line and even a third line.'
  );
  assert.equal(turns[1].text, 'Short reply.');
});

test('EPISODE METADATA block never appears in stringified output', () => {
  const result = parseTranscript(SAMPLE);
  const json = JSON.stringify(result);
  assert.equal(json.includes('EPISODE METADATA'), false);
  assert.equal(json.includes('some-slug'), false);
  assert.equal(json.includes('Some Title'), false);
});

test('front-matter block does not leak into segments/turns', () => {
  const raw = `---
slug: my-episode-slug
title: My Episode
---

### [COLD OPEN]

ALEX: Hello there.
`;
  const result = parseTranscript(raw);
  assert.equal(result.segments.length, 1);
  assert.equal(result.segments[0].title, 'Cold Open');
  const json = JSON.stringify(result);
  assert.equal(json.includes('slug:'), false);
  assert.equal(json.includes('my-episode-slug'), false);
});

test('empty or whitespace input returns zero segments and never throws', () => {
  assert.deepEqual(parseTranscript(''), { segments: [] });
  assert.deepEqual(parseTranscript('   \n\n  '), { segments: [] });
});

test('drops --- rules and blank lines, does not create empty turns', () => {
  const result = parseTranscript(SAMPLE);
  for (const segment of result.segments) {
    for (const turn of segment.turns) {
      assert.notEqual(turn.text.trim(), '');
      assert.notEqual(turn.speaker, '---');
    }
  }
});

test('small words are lowercased in titles except the first word', () => {
  const raw = `### [THE KING OF THE HILL AND OF THE VALLEY]

ALEX: Test.
`;
  const result = parseTranscript(raw);
  assert.equal(result.segments[0].title, 'The King of the Hill and of the Valley');
});
