#!/usr/bin/env node
// Read-only Google URL Inspection API. Never submits sitemaps or indexing requests.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const GSC_PROPERTY = 'sc-domain:tinystepslearning.com';
export const ENDPOINT = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect';

export function normalizeInspection(url, result, inspectedAt) {
  const data = result?.inspectionResult?.indexStatusResult || {};
  const state = data.coverageState || '';
  const verdict = data.verdict || 'VERDICT_UNSPECIFIED';
  const indexed = verdict === 'PASS'; // Google's indexed-version verdict, not live-test eligibility.
  const fetchFailure = ['SOFT_404','NOT_FOUND','SERVER_ERROR','ACCESS_DENIED','ACCESS_FORBIDDEN',
    'BLOCKED_ROBOTS_TXT','REDIRECT_ERROR','BLOCKED_4XX'].includes(data.pageFetchState);
  const actualState = indexed ? 'indexed'
    : fetchFailure || /soft\\s*404/i.test(state) ? 'crawl_error'
    : /unknown to Google/i.test(state) ? 'unknown_to_google'
    : /discovered\s*[-–]\s*currently not indexed/i.test(state) ? 'discovered_not_indexed'
    : /crawled\s*[-–]\s*currently not indexed/i.test(state) ? 'crawled_not_indexed'
    : verdict === 'FAIL' || verdict === 'NEUTRAL' ? 'excluded_other' : 'unknown';
  return {
    url, inspected_at: inspectedAt, actual_state: actualState,
    google_verdict: verdict, coverage_state: state, last_crawl: data.lastCrawlTime || '',
    page_fetch_state: data.pageFetchState || '', robots_txt_state: data.robotsTxtState || '',
    indexing_state: data.indexingState || '', google_canonical: data.googleCanonical || '',
    user_canonical: data.userCanonical || '', crawled_as: data.crawledAs || '',
    google_reported_sitemaps: data.sitemap || [], google_reported_referrers: data.referringUrls || [],
    inspection_link: result?.inspectionResult?.inspectionResultLink || '',
  };
}
export function classifyMismatch(row, inspection) {
  if (row.intended_state !== 'index') return 'not_requested';
  if (!inspection) return 'not_inspected';
  if (inspection.actual_state === 'indexed') {
    return inspection.google_canonical && inspection.google_canonical !== row.canonical_url
      ? 'google_canonical_differs' : 'indexed';
  }
  if (inspection.indexing_state === 'BLOCKED_BY_META_TAG' || inspection.indexing_state === 'BLOCKED_BY_HTTP_HEADER')
    return 'unexpected_noindex';
  if (inspection.robots_txt_state === 'DISALLOWED') return 'unexpected_robots_block';
  return inspection.actual_state;
}
export function selectTargets(registry, prior = [], { offset = 0, limit = 40 } = {}) {
  const priorByUrl = new Set(prior.filter((v) => v.actual_state !== 'api_error').map((v) => v.url));
  const eligible = registry.filter((r) => r.intended_state === 'index'
    && !r.problems.includes('nonindex_url_in_sitemap'));
  return eligible.slice(offset).filter((r) => !priorByUrl.has(r.url)).slice(0, limit);
}
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export async function inspectOne(url, token, { fetchImpl = fetch, siteUrl = GSC_PROPERTY } = {}) {
  const response = await fetchImpl(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inspectionUrl: url, siteUrl, languageCode: 'en-US' }),
    signal: AbortSignal.timeout(25000),
  });
  const raw = await response.text();
  if (!response.ok) {
    let message = raw;
    try { message = JSON.parse(raw)?.error?.message || raw; } catch { /* unchanged */ }
    throw Object.assign(new Error(`Google Inspection API HTTP ${response.status}: ${String(message).slice(0, 400)}`),
      { status: response.status });
  }
  return JSON.parse(raw);
}
function readArgs(args) {
  const opts = { limit: 40, offset: 0, delayMs: 1100, dryRun: false };
  for (const arg of args) {
    if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--all') opts.limit = 2000;
    else if (/^--(?:limit|offset|delay-ms)=\d+$/.test(arg)) {
      const [key, value] = arg.slice(2).split('=');
      opts[key === 'delay-ms' ? 'delayMs' : key] = Number(value);
    } else throw new Error('Unknown option: ' + arg);
  }
  if (opts.limit < 1 || opts.limit > 2000 || opts.offset < 0 || opts.delayMs < 100) throw new Error('Unsafe CLI limits');
  return opts;
}
async function main() {
  const opts = readArgs(process.argv.slice(2));
  const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
  const source = JSON.parse(fs.readFileSync(path.join(root, 'docs/seo/gsc-inspection/URL_REGISTRY.json'), 'utf8'));
  if (source.property !== GSC_PROPERTY) throw new Error('Unexpected Search Console property');
  const outDir = path.join(root, 'artifacts');
  const output = path.join(outDir, 'gsc-url-inspection-results.json');
  fs.mkdirSync(outDir, { recursive: true });
  const previous = fs.existsSync(output) ? JSON.parse(fs.readFileSync(output, 'utf8')).results || [] : [];
  const selected = selectTargets(source.rows, previous, opts);
  console.log(`Property ${GSC_PROPERTY}; intended index URLs ${source.rows.filter((r) => r.intended_state === 'index').length}; batch ${selected.length}; dry-run ${opts.dryRun}`);
  if (opts.dryRun) {
    for (const row of selected) console.log(row.url);
    return;
  }
  const token = process.env.GSC_ACCESS_TOKEN?.trim();
  if (!token) throw new Error('GSC_ACCESS_TOKEN missing. Authorize with readonly OAuth; never commit or paste tokens into chat.');
  const results = [...previous];
  const existing = new Set(results.map((r) => r.url));
  let failures = 0;
  for (const row of selected) {
    try {
      const raw = await inspectOne(row.url, token);
      const inspection = normalizeInspection(row.url, raw, new Date().toISOString());
      results.push({ ...inspection, mismatch: classifyMismatch(row, inspection) });
      existing.add(row.url);
      console.log(row.pathname + ' => ' + inspection.actual_state + ' (' + inspection.coverage_state + ')');
    } catch (error) {
      failures += 1;
      console.error(row.pathname + ': ' + String(error.message).slice(0, 300));
      if ([401, 403, 429].includes(error.status)) break; // Don't burn quotas or continue unauthorized.
      results.push({ url: row.url, inspected_at: new Date().toISOString(), actual_state: 'api_error',
        error: String(error.message).slice(0, 300), mismatch: 'unverified' });
    }
    fs.writeFileSync(output, JSON.stringify({
      property: GSC_PROPERTY, sourceRegistryGeneratedAt: source.generatedAt,
      updatedAt: new Date().toISOString(), results,
    }, null, 2) + '\n');
    await wait(opts.delayMs);
  }
  console.log(`Saved ${results.length} observed results to ${output} (${failures} API errors). No website or indexing submissions changed.`);
  if (failures) process.exitCode = 1;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
