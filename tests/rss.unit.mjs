import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRssItems } from '../scripts/lib/rss.mjs';

const FIXTURE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Channel Title Should Not Appear</title>
    <link>https://example.com/channel-link-should-not-appear</link>
    <item>
      <title><![CDATA[Episode One: The Big Launch]]></title>
      <pubDate>Mon, 14 Jul 2026 09:00:00 GMT</pubDate>
      <guid>guid-001</guid>
      <link>https://example.com/episodes/1</link>
      <description><![CDATA[<p>This is <b>episode one</b>'s description.</p>]]></description>
    </item>
    <item>
      <title>Episode Two: R&amp;D Update</title>
      <pubDate>Tue, 15 Jul 2026 09:00:00 GMT</pubDate>
      <guid>guid-002</guid>
      <link>https://example.com/episodes/2</link>
      <description>Plain description with an &amp; ampersand.</description>
    </item>
  </channel>
</rss>`;

test('parseRssItems returns exactly 2 items from a 2-item fixture', () => {
  const items = parseRssItems(FIXTURE_XML);
  assert.equal(items.length, 2);
});

test('parseRssItems decodes CDATA title correctly', () => {
  const items = parseRssItems(FIXTURE_XML);
  assert.equal(items[0].title, 'Episode One: The Big Launch');
});

test('parseRssItems decodes basic entities in title correctly', () => {
  const items = parseRssItems(FIXTURE_XML);
  assert.equal(items[1].title, 'Episode Two: R&D Update');
});

test('parseRssItems produces a valid ISO date string from pubDate', () => {
  const items = parseRssItems(FIXTURE_XML);
  assert.match(items[0].date, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(items[0].date, new Date('Mon, 14 Jul 2026 09:00:00 GMT').toISOString());
  assert.match(items[1].date, /^\d{4}-\d{2}-\d{2}T/);
});

test('parseRssItems captures guid and link per item', () => {
  const items = parseRssItems(FIXTURE_XML);
  assert.equal(items[0].guid, 'guid-001');
  assert.equal(items[0].link, 'https://example.com/episodes/1');
  assert.equal(items[1].guid, 'guid-002');
  assert.equal(items[1].link, 'https://example.com/episodes/2');
});

test('parseRssItems decodes CDATA description and strips HTML tags', () => {
  const items = parseRssItems(FIXTURE_XML);
  assert.equal(items[0].description, "This is episode one's description.");
});

test('parseRssItems decodes entities in plain description', () => {
  const items = parseRssItems(FIXTURE_XML);
  assert.equal(items[1].description, 'Plain description with an & ampersand.');
});

test('parseRssItems does not return channel-level title/link as an item', () => {
  const items = parseRssItems(FIXTURE_XML);
  const titles = items.map((i) => i.title);
  const links = items.map((i) => i.link);
  assert.ok(!titles.includes('Channel Title Should Not Appear'));
  assert.ok(!links.includes('https://example.com/channel-link-should-not-appear'));
});

test('parseRssItems returns empty array for XML with no items', () => {
  const items = parseRssItems('<rss><channel><title>Empty</title></channel></rss>');
  assert.deepEqual(items, []);
});

test('parseRssItems returns empty string date for unparseable pubDate', () => {
  const xml = `<rss><channel><item>
    <title>No Date Episode</title>
    <pubDate>not-a-real-date</pubDate>
    <guid>guid-003</guid>
    <link>https://example.com/episodes/3</link>
    <description>desc</description>
  </item></channel></rss>`;
  const items = parseRssItems(xml);
  assert.equal(items[0].date, '');
});
