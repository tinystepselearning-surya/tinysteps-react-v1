import assert from 'node:assert/strict';
import { test } from 'node:test';
import { b2IndexExclusionFlags } from '../lib/tssa7-b2-index-directives.mjs';

test('allows ordinary index/follow metadata for both crawlers', () => {
  assert.deepEqual(b2IndexExclusionFlags({
    robotsValues: ['index, follow'],
    googlebotValues: ['index'],
    bingbotValues: ['index, max-snippet:-1'],
  }), []);
});

test('flags Bing-only exclusion even with generic index,follow', () => {
  assert.deepEqual(b2IndexExclusionFlags({
    robotsValues: ['index, follow'],
    bingbotValues: ['noindex, follow'],
  }), ['bingbot-index-exclusion']);
});

test('flags Google-only exclusion and none aliases', () => {
  assert.deepEqual(b2IndexExclusionFlags({
    googlebotValues: ['none'], bingbotValues: ['index, follow'],
  }), ['googlebot-index-exclusion']);
  assert.deepEqual(b2IndexExclusionFlags({ robotsValues: ['none'] }), ['served-noindex']);
});

test('flags scoped or unscoped X-Robots-Tag restrictions conservatively', () => {
  assert.deepEqual(b2IndexExclusionFlags({ xRobots: 'bingbot: noindex' }),
    ['x-robots-index-exclusion']);
  assert.deepEqual(b2IndexExclusionFlags({ xRobots: 'googlebot: none, noarchive' }),
    ['x-robots-index-exclusion']);
  assert.deepEqual(b2IndexExclusionFlags({ xRobots: 'noindex, nofollow' }),
    ['x-robots-index-exclusion']);
});

test('does not confuse index, noarchive or words containing noindex with an exclusion', () => {
  assert.deepEqual(b2IndexExclusionFlags({
    robotsValues: ['index, noarchive'],
    googlebotValues: ['max-image-preview:large'],
    xRobots: 'notnoindex, noindexing=false',
  }), []);
});

test('returns all independently observed noindex signals instead of dropping Bing evidence', () => {
  assert.deepEqual(b2IndexExclusionFlags({
    xRobots: 'none',
    robotsValues: ['noindex'],
    googlebotValues: ['none'],
    bingbotValues: ['noindex'],
  }), [
    'x-robots-index-exclusion',
    'served-noindex',
    'googlebot-index-exclusion',
    'bingbot-index-exclusion',
  ]);
});

test('live pilot passes the captured Bingbot values into the exclusion gate and CSV', async () => {
  const { readFileSync } = await import('node:fs');
  const script = readFileSync('scripts/tssa7-b2-live-indexability-pilot.mjs', 'utf8');
  assert.match(script, /meta\[name="bingbot"\]/);
  assert.match(script, /bingbotValues:o\.bingbotValues/);
  assert.match(script, /'googlebotValues','bingbotValues','xRobots'/);
  assert.match(script, /\.\.\.b2IndexExclusionFlags/);
});

test('previously flagged clean-URL HTML has explicit no-cache source policy; assets stay immutable', async () => {
  const { readFileSync } = await import('node:fs');
  const hosting = JSON.parse(readFileSync('firebase.json', 'utf8')).hosting;
  const rules = hosting.headers || [];
  const urls = ['/courses', '/free-word-building-game-for-kids', '/summer-camp-for-kids-india'];
  for (const url of urls) {
    const policy = rules.find(rule => rule.regex && new RegExp(rule.regex).test(url));
    assert.ok(policy, 'missing clean-URL HTML cache rule for ' + url);
    const cache = policy.headers?.find(x => x.key.toLowerCase() === 'cache-control')?.value || '';
    assert.match(cache, /no-cache/);
    assert.match(cache, /max-age=0/);
  }
  const assets = rules.find(rule => rule.source === '/assets/**');
  assert.match(
    assets?.headers?.find(x => x.key.toLowerCase() === 'cache-control')?.value || '',
    /immutable/,
  );
});
