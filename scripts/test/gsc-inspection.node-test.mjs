import test from 'node:test';
import { reconcile, reportCsv } from '../gsc-reconcile-results.mjs';
import assert from 'node:assert/strict';
import { assembleRegistry, sitemapLocs, toCsv } from '../gsc-url-registry.mjs';
import { normalizeInspection, classifyMismatch, selectTargets, inspectOne, ENDPOINT } from '../gsc-inspect-registry.mjs';

test('sitemap XML parser ignores sitemap-index loc entries', () => {
  assert.deepEqual(sitemapLocs('<sitemapindex><sitemap><loc>https://tinystepslearning.com/sitemap-blog.xml</loc></sitemap></sitemapindex>'), []);
  assert.deepEqual(sitemapLocs('<urlset><url><loc>https://tinystepslearning.com/phonics</loc></url></urlset>'), ['https://tinystepslearning.com/phonics']);
});

test('registry deduplicates intended indexes and separates redirects/noindex', () => {
  const rows = assembleRegistry({
    sitemaps: [{ url: 'https://tinystepslearning.com/phonics', file: 'sitemap-static.xml' }],
    published: [{ path: '/phonics', intent: 'index' }, { path: '/privacy-policy', intent: 'noindex' },
      { path: '/resources/phonics/ck-rule-phonics', intent: 'index' }],
    redirects: [{ source: '/old-phonics', destination: '/phonics' }],
    noindex: ['/login'],
  });
  assert.equal(rows.length, 5);
  assert.equal(rows.find((r) => r.pathname === '/phonics').problems.length, 0);
  assert.equal(rows.find((r) => r.pathname === '/old-phonics').intended_state, 'redirect');
  assert.equal(rows.find((r) => r.pathname === '/login').intended_state, 'noindex');
  assert.deepEqual(rows.find((r) => r.pathname === '/resources/phonics/ck-rule-phonics').problems, ['indexable_missing_from_sitemap']);
  assert.match(toCsv(rows), /sitemap-static.xml/);
});

test('registry flags sitemap URLs that should redirect and rejects foreign URLs', () => {
  const rows = assembleRegistry({
    sitemaps: [{ url: 'https://tinystepslearning.com/old', file: 'sitemap-blog.xml' }],
    redirects: [{ source: '/old', destination: '/new' }],
  });
  assert.deepEqual(rows[0].problems, ['nonindex_url_in_sitemap']);
  assert.throws(() => assembleRegistry({ sitemaps: [{ url: 'https://evil.example.com/hack', file: 'x' }] }));
});

test('GSC response uses indexed-version verdict and retains canonical disagreements', () => {
  const a = normalizeInspection('https://tinystepslearning.com/phonics', {
    inspectionResult: { indexStatusResult: { verdict: 'PASS', coverageState: 'Submitted and indexed',
      googleCanonical: 'https://tinystepslearning.com/grammar' } },
  }, '2026-10-29T00:00:00Z');
  assert.equal(a.actual_state, 'indexed');
  assert.equal(classifyMismatch({ intended_state: 'index', canonical_url: 'https://tinystepslearning.com/phonics' }, a), 'google_canonical_differs');
});
test('Soft 404 is not confused with current live-test eligibility', () => {
  const a = normalizeInspection('https://tinystepslearning.com/phonics', {
    inspectionResult: { indexStatusResult: { verdict: 'NEUTRAL', pageFetchState: 'SOFT_404', coverageState: 'Soft 404' } },
  }, '2026-10-29T00:00:00Z');
  assert.equal(a.actual_state, 'crawl_error');
  assert.equal(classifyMismatch({ intended_state: 'index' }, a), 'crawl_error');
});
test('index-only targets honor prior observations and bounded limits', () => {
  const rows = [
    { url: 'https://tinystepslearning.com/a', intended_state: 'index', problems: [] },
    { url: 'https://tinystepslearning.com/b', intended_state: 'noindex', problems: [] },
    { url: 'https://tinystepslearning.com/c', intended_state: 'index', problems: [] },
  ];
  assert.deepEqual(selectTargets(rows, [{ url: rows[0].url }], { limit: 10 }).map((x) => x.url), [rows[2].url]);
});
test('inspection endpoint is read-only and sends the correct domain property', async () => {
  let captured;
  const result = await inspectOne('https://tinystepslearning.com/phonics', 'test-token', { fetchImpl: async (url, init) => {
    captured = { url, init }; return { ok: true, text: async () => '{"inspectionResult":{"indexStatusResult":{"verdict":"PASS"}}}' };
  } });
  assert.equal(captured.url, ENDPOINT);
  assert.equal(captured.init.method, 'POST');
  assert.deepEqual(JSON.parse(captured.init.body), {
    inspectionUrl: 'https://tinystepslearning.com/phonics', siteUrl: 'sc-domain:tinystepslearning.com', languageCode: 'en-US',
  });
  assert.equal(result.inspectionResult.indexStatusResult.verdict, 'PASS');
});

test('reconciliation distinguishes missing observations and actual Google exclusions', () => {
  const rows = [{ url: 'https://tinystepslearning.com/one', category:'site', intended_state:'index',
    in_sitemap:true, problems: [] }, { url:'https://tinystepslearning.com/two', category:'site',
    intended_state:'index', in_sitemap:true, problems: [] }];
  const seen = [{ url:rows[0].url, actual_state:'crawled_not_indexed', inspected_at:'2026-10-29T10:00:00Z',
    coverage_state:'Crawled - currently not indexed' }];
  const result = reconcile(rows, seen);
  assert.equal(result[0].action, 'review_google_index_selection');
  assert.equal(result[1].google_status, 'not_inspected');
  assert.match(reportCsv(result), /crawled_not_indexed/);
});

test('reconciliation counts transient API errors as explicit retries and latest verdict wins', () => {
  const row = { url:'https://tinystepslearning.com/phonics', category:'site', intended_state:'index',
    in_sitemap:true, problems:[], canonical_url:'https://tinystepslearning.com/phonics' };
  const first = reconcile([row], [{ url:row.url, inspected_at:'2026-10-29T10:00:00Z', actual_state:'api_error' }]);
  assert.equal(first[0].google_status, 'api_error');
  assert.equal(first[0].action, 'retry_api_inspection');
  const latest = reconcile([row], [
    { url:row.url, inspected_at:'2026-10-29T10:00:00Z', actual_state:'api_error' },
    { url:row.url, inspected_at:'2026-10-29T10:05:00Z', actual_state:'indexed' },
  ]);
  assert.equal(latest[0].google_status, 'indexed');
  assert.equal(latest[0].action, 'none');
});
