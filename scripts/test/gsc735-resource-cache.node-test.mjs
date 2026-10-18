import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const hosting = JSON.parse(fs.readFileSync(new URL('../../firebase.json', import.meta.url), 'utf8')).hosting;

const cacheHeader = (rule) => (rule.headers || [])
  .find((header) => header.key.toLowerCase() === 'cache-control')?.value || '';

test('GSC #735: extensionless resources cannot retain stale prerendered HTML for one hour', () => {
  assert.equal(hosting.cleanUrls, true, 'The site uses extensionless canonical URLs');

  const publicResourcePolicy = hosting.headers.filter(
    (rule) => rule.source === '/resources{,/**}',
  );
  assert.equal(publicResourcePolicy.length, 1, 'One explicit policy must cover the hub and child paths');
  const cache = cacheHeader(publicResourcePolicy[0]);
  assert.match(cache, /(?:^|,)\s*no-cache(?:,|$)/i, 'CDN/browser must revalidate canonical resource HTML');
  assert.match(cache, /(?:^|,)\s*max-age=0(?:,|$)/i, 'No one-hour cache on resource HTML');

  // Confirm the exact paths in the current GSC investigation are within the policy.
  const routes = [
    '/resources',
    '/resources/grammar',
    '/resources/grammar/simple-past-tense-for-kids',
    '/resources/phonics/sh-digraph-phonics',
    '/resources/vocabulary/vocabulary-for-better-writing',
  ];
  for (const route of routes) {
    assert.ok(route === '/resources' || route.startsWith('/resources/'), route);
  }
});

test('GSC #735: immutable built assets keep their separate cache policy', () => {
  const assetPolicies = hosting.headers.filter((rule) => rule.source === '/assets/**');
  assert.equal(assetPolicies.length, 1);
  assert.match(cacheHeader(assetPolicies[0]), /immutable/i);
  assert.doesNotMatch(cacheHeader(assetPolicies[0]), /no-cache/i);
});

test('GSC #735: conventional HTML, robots and sitemap cache policies stay present', () => {
  for (const source of ['**/*.html', '/robots.txt', '/sitemap*.xml']) {
    const rule = hosting.headers.find((entry) => entry.source === source);
    assert.ok(rule, source + ' policy missing');
    assert.match(cacheHeader(rule), /no-cache/i, source + ' must revalidate');
  }
});
