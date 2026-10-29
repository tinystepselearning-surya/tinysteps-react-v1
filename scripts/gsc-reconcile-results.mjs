#!/usr/bin/env node
// Operator report: joins the full intended URL register with observed Google index verdicts.
// Never infers indexing from missing traffic or uses stale GSC classifications as live tests.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyMismatch } from './gsc-inspect-registry.mjs';

export function reconcile(registry, observed) {
  const latest = new Map();
  for (const item of observed) {
    const prior = latest.get(item.url);
    if (!prior || String(item.inspected_at || '') >= String(prior.inspected_at || '')) latest.set(item.url, item);
  }
  return registry.map((row) => {
    const google = latest.get(row.url);
    const mismatch = google ? classifyMismatch(row, google) : 'not_inspected';
    let action = 'none';
    if (row.problems?.length) action = 'reconcile_source_and_sitemap';
    else if (row.intended_state === 'index') {
      if (mismatch === 'unexpected_noindex' || mismatch === 'unexpected_robots_block') action = 'verify_live_directives';
      else if (mismatch === 'crawl_error') action = 'verify_live_render_and_http';
      else if (mismatch === 'google_canonical_differs') action = 'inspect_selected_canonical';
      else if (mismatch === 'discovered_not_indexed') action = 'review_discovery_and_crawl_history';
      else if (mismatch === 'crawled_not_indexed') action = 'review_google_index_selection';
      else if (mismatch === 'excluded_other') action = 'inspect_google_exclusion_reason';
      else if (mismatch === 'unknown' || mismatch === 'unverified') action = 'retry_or_inspect_manually';
    }
    return {
      url: row.url, category: row.category, intended_state: row.intended_state,
      in_sitemap: row.in_sitemap, source_problems: row.problems.join(';'),
      google_status: google?.actual_state || 'not_inspected',
      google_coverage_state: google?.coverage_state || '',
      last_crawl: google?.last_crawl || '',
      google_canonical: google?.google_canonical || '',
      inspected_at: google?.inspected_at || '',
      mismatch, action, inspection_link: google?.inspection_link || '',
    };
  });
}
export function reportCsv(rows) {
  const headers = ['url','category','intended_state','in_sitemap','source_problems','google_status',
    'google_coverage_state','last_crawl','google_canonical','inspected_at','mismatch','action','inspection_link'];
  const cell = (value) => {
    const s = String(value ?? '');
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return headers.join(',') + '\n' + rows.map((r) => headers.map((h) => cell(r[h])).join(',')).join('\n') + '\n';
}
function main() {
  const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
  const source = JSON.parse(fs.readFileSync(path.join(root,'docs/seo/gsc-inspection/URL_REGISTRY.json'),'utf8'));
  const outputDir = path.join(root,'artifacts');
  fs.mkdirSync(outputDir,{recursive:true});
  const resultPath = path.join(outputDir,'gsc-url-inspection-results.json');
  const data = fs.existsSync(resultPath) ? JSON.parse(fs.readFileSync(resultPath,'utf8')) : { results: [] };
  if (data.property && data.property !== source.property) throw new Error('Inspection property mismatch');
  const rows = reconcile(source.rows,data.results || []);
  fs.writeFileSync(path.join(outputDir,'gsc-indexing-reconciliation.csv'),reportCsv(rows));
  const indexRows = rows.filter((r) => r.intended_state === 'index');
  const inspected = indexRows.filter((r) => r.google_status !== 'not_inspected');
  const indexed = inspected.filter((r) => r.google_status === 'indexed');
  const unresolved = indexRows.filter((r) => r.action !== 'none');
  const summary = [
    '# Tiny Steps — GSC URL inspection reconciliation',
    '',
    'Generated ' + new Date().toISOString(),
    '',
    '- Repository-known unique routes: **' + rows.length + '**',
    '- Intended index routes: **' + indexRows.length + '**',
    '- Observed index-intended routes: **' + inspected.length + '**',
    '- Google indexed among actually observed routes: **' + indexed.length + '**',
    '- Routes with a source mismatch or inspection follow-up: **' + unresolved.length + '**',
    '',
    '**Unobserved routes are NOT classified as indexed or unindexed.** Google results are stored index data, not live URL tests.',
    '',
    '| Follow-up | Count |',
    '|---|---:|',
    ...[...new Set(unresolved.map((r) => r.action))].sort().map((key) =>
      '| ' + key.replaceAll('|','\\|') + ' | ' + unresolved.filter((r) => r.action === key).length + ' |'),
    '',
    'Full row-level evidence: `artifacts/gsc-indexing-reconciliation.csv` (local, ignored).',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(outputDir,'gsc-indexing-reconciliation.md'),summary);
  console.log(summary);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
