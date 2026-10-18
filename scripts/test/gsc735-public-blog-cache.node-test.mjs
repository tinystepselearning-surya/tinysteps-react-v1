import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const hosting = JSON.parse(fs.readFileSync(new URL('../../firebase.json', import.meta.url), 'utf8')).hosting;

test('GSC #735 P1: canonical clean blog HTML must revalidate after deployments', () => {
  assert.equal(hosting.cleanUrls, true);
  const rules = hosting.headers.filter(rule => rule.regex === '^/blog/[a-z0-9-]+/?$');
  assert.equal(rules.length, 1, 'exactly one article-only cache policy expected');
  const re = new RegExp(rules[0].regex);
  for (const route of [
    '/blog/online-phonics-classes-vs-school',
    '/blog/why-child-knows-letter-sounds-but-cannot-read-words',
    '/blog/sight-words-or-phonics-first',
    '/blog/speaking-confidence-seeds',
  ]) assert.ok(re.test(route), route + ' must revalidate HTML');
  for (const route of [
    '/blog/rss.xml', '/blog/feed.xml', '/sitemap-blog.xml',
    '/courses', '/parent', '/surya', '/assets/index-abc123.js', '/blog/a/extra',
  ]) assert.equal(re.test(route), false, route + ' must not inherit article policy');
  const cache = rules[0].headers.find(h => h.key.toLowerCase() === 'cache-control')?.value || '';
  assert.match(cache, /(?:^|,)\s*no-cache(?:,|$)/i);
  assert.match(cache, /(?:^|,)\s*max-age=0(?:,|$)/i);
  assert.match(cache, /must-revalidate/i);
  const assets = hosting.headers.find(rule => rule.source === '/assets/**');
  assert.ok(assets?.headers.some(h => /immutable/i.test(h.value)), 'immutable hashed JS assets remain unchanged');
});
