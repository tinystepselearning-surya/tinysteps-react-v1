import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRoute, inspectLive, TARGETS } from '../gsc-live-spotcheck.mjs';
const route = '/why-tiny-steps';
const html = (main = 'Relevant parent information. '.repeat(25), extraHead = '') =>
  `<!doctype html><html><head><title>Why Tiny Steps</title><link rel="canonical" href="https://tinystepslearning.com${route}">${extraHead}</head><body><main><h1>Why Parents Choose Tiny Steps</h1><p>${main}</p></main></body></html>`;

test('target set includes priority Soft 404 pages and four age pilots', () => {
  for (const target of ['/why-tiny-steps', '/free-phonics-games-for-kids', '/free-reading-fluency-game-for-kids',
    '/resources', '/english-grammar-writing-classes', '/phonics/age-3', '/phonics/age-4', '/phonics/age-5', '/phonics/age-6'])
    assert.ok(TARGETS.includes(target));
});
test('valid HTML passes the initial HTML contract', () => {
  assert.equal(evaluateRoute({ route, html: html() }).pass, true);
});
test('wrong canonical and noindex in meta or response header are flagged', () => {
  const wrong = evaluateRoute({ route, html: html().replace(`href="https://tinystepslearning.com${route}"`, 'href="https://tinystepslearning.com/phonics"') });
  assert.ok(wrong.reasons.includes('missing_duplicate_or_wrong_canonical'));
  assert.ok(evaluateRoute({ route, html: html(undefined, '<meta name="robots" content="noindex,follow">') }).reasons.includes('meta_noindex'));
  assert.ok(evaluateRoute({ route, html: html(), robotsHeader: 'noindex, follow' }).reasons.includes('http_noindex'));
});
test('detects empty app shell and misleading not-found page', () => {
  assert.ok(evaluateRoute({ route, html: html('') }).reasons.includes('thin_initial_html'));
  assert.ok(evaluateRoute({ route, html: html('404 page not found '.repeat(28)).replace('Why Parents Choose Tiny Steps</h1>', 'Page not found</h1>') }).reasons.includes('error_page_h1'));
});
test('flags HTTP errors and redirects rather than treating HTML shell as success', () => {
  const row = evaluateRoute({ route, html: html(), status: 302, location: '/phonics' });
  assert.ok(row.reasons.includes('unexpected_http_302'));
  assert.ok(row.reasons.includes('unexpected_redirect'));
});
test('network request remains read-only and does not follow redirects', async () => {
  let init;
  const result = await inspectLive(route, async (_url, config) => {
    init = config;
    return {status:200, headers:{get:(name)=>name === 'content-type' ? 'text/html' : null}, text:async ()=>html()};
  });
  assert.equal(init.redirect, 'manual');
  assert.equal(init.method, undefined);
  assert.equal(result.pass, true);
});
