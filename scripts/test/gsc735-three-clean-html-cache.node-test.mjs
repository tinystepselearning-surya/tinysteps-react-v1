import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const hosting = JSON.parse(fs.readFileSync(new URL('../../firebase.json', import.meta.url), 'utf8')).hosting;
const exact = ['courses', 'free-word-building-game-for-kids', 'summer-camp-for-kids-india'];
const expectedRegex = '^/(?:courses|free-word-building-game-for-kids|summer-camp-for-kids-india)/?$';

test('GSC #735: only the three remaining stale clean URLs gain HTML revalidation', () => {
  assert.equal(hosting.cleanUrls, true);
  const matches = hosting.headers.filter(rule => rule.regex === expectedRegex);
  assert.equal(matches.length, 1, 'exactly one narrow rule');
  const regex = new RegExp(matches[0].regex);
  for (const slug of exact) {
    assert.ok(regex.test('/' + slug), slug);
    assert.ok(regex.test('/' + slug + '/'), slug + '/');
  }
  for (const url of [
    '/', '/index.html', '/blog/rss.xml', '/blog/online-english-classes-for-kids-india',
    '/resources/grammar', '/courses/grammar', '/courses/advanced-grammar',
    '/free-word-building-games-for-kids', '/summer-camps',
    '/parent', '/teacher', '/surya', '/login',
    '/sitemap.xml', '/assets/BlogPostPage-hash.js', '/service-worker.js',
  ]) assert.equal(regex.test(url), false, 'unexpected cache rule: ' + url);
  const cache = matches[0].headers.find(h => h.key.toLowerCase() === 'cache-control')?.value || '';
  assert.match(cache, /(?:^|,)\s*no-cache(?:,|$)/i);
  assert.match(cache, /(?:^|,)\s*max-age=0(?:,|$)/i);
  assert.match(cache, /must-revalidate/i);
});

test('GSC #735: do not regress assets, blog, resource, XML and protected route policies', () => {
  const pick = (name, by = 'source') => hosting.headers.find(rule => rule[by] === name);
  assert.match(pick('/assets/**')?.headers.find(h => h.key === 'Cache-Control')?.value || '', /immutable/);
  assert.match(pick('/resources{,/**}')?.headers.find(h => h.key === 'Cache-Control')?.value || '', /no-cache/);
  assert.match(pick('^/blog/[a-z0-9-]+/?$', 'regex')?.headers.find(h => h.key === 'Cache-Control')?.value || '', /no-cache/);
  assert.match(pick('/blog/rss.xml')?.headers.find(h => h.key === 'X-Robots-Tag')?.value || '', /noindex/);
  for (const p of ['/parent', '/teacher', '/surya/**']) {
    assert.match(pick(p)?.headers.find(h => h.key === 'X-Robots-Tag')?.value || '', /noindex/);
  }
});
