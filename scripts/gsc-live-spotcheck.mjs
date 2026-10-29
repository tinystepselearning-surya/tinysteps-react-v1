#!/usr/bin/env node
/** Read-only source-HTML / deployed-HTML check for GSC exclusion candidates. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ORIGIN = 'https://tinystepslearning.com';
export const TARGETS = [
  '/why-tiny-steps',
  '/free-phonics-games-for-kids',
  '/free-reading-fluency-game-for-kids',
  '/resources',
  '/english-grammar-writing-classes',
  '/phonics/age-3',
  '/phonics/age-4',
  '/phonics/age-5',
  '/phonics/age-6',
  '/courses/grammar-mastery',
  '/courses/phonics-advanced',
];
export const CONTROLS = ['/phonics', '/grammar', '/free-reading-games-for-kids'];

const getAttr = (tag, attr) => {
  const match = tag.match(new RegExp(`\b${attr}\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))`, 'i'));
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? '';
};
const matches = (html, tag) => [...html.matchAll(new RegExp(`<${tag}\b[^>]*>`, 'gi'))].map((m) => m[0]);
const stripHtml = (html) => html
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<(script|style|svg|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&(?:nbsp|amp|quot|#39|lt|gt);/gi, ' ')
  .replace(/\s+/g, ' ').trim();

/** Does not simulate Googlebot. Checks HTTP and initial HTML only, not JS hydration. */
export function evaluateRoute({ route, html, status = 200, contentType = 'text/html', robotsHeader = '', location = '' }) {
  const reasons = [];
  if (status !== 200) reasons.push(`unexpected_http_${status}`);
  if (location || status >= 300 && status < 400) reasons.push('unexpected_redirect');
  if (!/text\/html/i.test(contentType)) reasons.push('non_html_content_type');
  const canonicals = matches(html, 'link')
    .filter((tag) => /^canonical$/i.test(getAttr(tag, 'rel')))
    .map((tag) => getAttr(tag, 'href'));
  if (canonicals.length !== 1 || canonicals[0] !== `${ORIGIN}${route}`)
    reasons.push('missing_duplicate_or_wrong_canonical');
  const robotsMeta = matches(html, 'meta')
    .filter((tag) => /^(robots|googlebot)$/i.test(getAttr(tag, 'name')))
    .map((tag) => getAttr(tag, 'content'));
  if (robotsMeta.some((value) => /(?:^|[\s,])(?:noindex|none)(?:$|[\s,])/i.test(value)))
    reasons.push('meta_noindex');
  if (/(?:^|[\s,])(?:noindex|none)(?:$|[\s,])/i.test(robotsHeader)) reasons.push('http_noindex');
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] || '';
  const headings = [...body.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)]
    .map((match) => stripHtml(match[1]));
  if (!headings.length || headings.every((h) => !h)) reasons.push('missing_h1');
  if (headings.some((h) => /^(?:404|page not found|something went wrong|unexpected application error)/i.test(h)))
    reasons.push('error_page_h1');
  const contentLength = stripHtml(body).length;
  if (contentLength < 250) reasons.push('thin_initial_html');
  return { route, status, contentType, location, canonical: canonicals, robotsMeta,
    robotsHeader, h1: headings, visibleCharacters: contentLength, pass: reasons.length === 0, reasons };
}

export async function inspectLive(route, fetchImpl = fetch) {
  try {
    const response = await fetchImpl(ORIGIN + route, {
      redirect: 'manual', signal: AbortSignal.timeout(20000),
      headers: { 'User-Agent': 'TinySteps-GSC-Spotcheck/1.0 (read-only operator diagnostic)' },
    });
    const html = await response.text();
    return evaluateRoute({ route, html, status: response.status,
      contentType: response.headers.get('content-type') || '',
      robotsHeader: response.headers.get('x-robots-tag') || '',
      location: response.headers.get('location') || '' });
  } catch (error) {
    return { route, pass: false, reasons: ['network_or_timeout'], error: String(error.message).slice(0, 160) };
  }
}
export async function inspectDist(route, root) {
  const file = path.join(root, 'dist', route.slice(1), 'index.html');
  try {
    return evaluateRoute({ route, html: await fs.readFile(file, 'utf8') });
  } catch (error) {
    return { route, pass: false, reasons: ['missing_dist_prerender'], error: String(error.message).slice(0, 160) };
  }
}
async function main() {
  const args = process.argv.slice(2);
  if (args.some((a) => !['--live','--dist','--include-controls'].includes(a)) ||
    Number(args.includes('--live')) + Number(args.includes('--dist')) !== 1)
    throw Error('Choose exactly one of --live or --dist; optional --include-controls');
  const live = args.includes('--live');
  const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
  const targets = [...TARGETS, ...(args.includes('--include-controls') ? CONTROLS : [])];
  const rows = [];
  for (const route of targets) {
    const row = live ? await inspectLive(route) : await inspectDist(route, root);
    rows.push(row);
    console.log(`${row.pass ? 'PASS' : 'REVIEW'} ${route} ${row.reasons.join(',') || 'initial HTML OK'} ${row.status ?? ''}`);
  }
  const output = path.join(root, 'artifacts', `gsc-${live ? 'live' : 'dist'}-spotcheck.json`);
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, JSON.stringify({ generatedAt: new Date().toISOString(),
    mode: live ? 'live_http_initial_html' : 'local_dist_initial_html', rows }, null, 2) + '\n');
  console.log(`Saved: ${output}; ${rows.filter((r) => !r.pass).length}/${rows.length} need review`);
  if (rows.some((r) => !r.pass)) process.exitCode = 1;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  main().catch((e) => { console.error(e.message); process.exitCode = 1; });
