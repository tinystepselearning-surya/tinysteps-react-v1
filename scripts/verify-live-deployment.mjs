#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PUBLIC_REDIRECT_MANIFEST } from '../src/lib/publicRouteManifest.js';

const STALE_CONTENT = ['3500+ learners', '9+ countries', '₹3,360', '₹6,440', '₹9,240'];
const PRIVATE_ROUTES = ['/parent', '/teacher', '/kids/games/english-excellence'];
const PUBLIC_GAME_INDEXABILITY_ROUTES = [
  '/free-letter-tracing-game-for-kids',
  '/free-sentence-building-games-for-kids',
  '/free-sentence-making-game-for-kids',
];
const GOOGLEBOT_SMARTPHONE_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

export function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith('--')) throw new Error(`Unexpected argument: ${key}`);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${key}`);
    parsed[key.slice(2)] = value;
    index += 1;
  }
  if (!parsed.origin) throw new Error('--origin is required');
  if (!parsed['expected-sha']) throw new Error('--expected-sha is required');
  if (!parsed.report) throw new Error('--report is required');
  return {
    origin: parsed.origin.replace(/\/+$/, ''),
    expectedSha: parsed['expected-sha'],
    report: parsed.report,
  };
}

const extract = (html, expression) => html.match(expression)?.[1]?.trim() || '';
const canonicalFrom = (html) => extract(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
  || extract(html, /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
const robotsFrom = (html) => extract(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i);
const titleFrom = (html) => extract(html, /<title[^>]*>([\s\S]*?)<\/title>/i).replace(/<[^>]+>/g, '');
const h1From = (html) => extract(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const xmlLocations = (xml) => [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map((match) => match[1].trim());
const metaValues = (html, name) => [...html.matchAll(new RegExp(`<meta\\b(?=[^>]*\\bname=["']${name}["'])[^>]*>`, 'gi'))]
  .map((match) => extract(match[0], /\bcontent=["']([^"']*)["']/i));
const canonicalValues = (html) => [...html.matchAll(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/gi)]
  .map((match) => extract(match[0], /\bhref=["']([^"']*)["']/i));

export async function verifyLiveDeployment({ origin, expectedSha, fetchImpl = fetch }) {
  const assertions = [];
  const record = (name, pass, detail) => assertions.push({ name, pass: Boolean(pass), detail });
  const request = (pathname, init = {}) => fetchImpl(`${origin}${pathname}`, {
    redirect: 'manual',
    headers: { 'user-agent': 'TinyStepsDeploymentVerifier/1.0' },
    ...init,
  });

  for (const redirect of PUBLIC_REDIRECT_MANIFEST) {
    const response = await request(redirect.source);
    const location = response.headers.get('location') || '';
    const resolved = location ? new URL(location, origin) : null;
    record(
      `redirect ${redirect.source}`,
      response.status === redirect.status && resolved?.pathname === redirect.destination,
      `HTTP ${response.status}; Location ${location || '(missing)'}`,
    );
  }

  const legalResponse = await request('/terms-and-conditions');
  const legalHtml = await legalResponse.text();
  record('legal page HTTP 200', legalResponse.status === 200, `HTTP ${legalResponse.status}`);
  record(
    'legal page self-canonical',
    canonicalFrom(legalHtml) === `${origin}/terms-and-conditions`,
    canonicalFrom(legalHtml) || '(missing)',
  );
  record('legal page title', /terms and conditions/i.test(titleFrom(legalHtml)), titleFrom(legalHtml));
  record('legal page H1', /terms and conditions/i.test(h1From(legalHtml)), h1From(legalHtml));
  for (const stale of STALE_CONTENT) {
    record(`legal stale-content guard: ${stale}`, !legalHtml.includes(stale), stale);
  }

  const sitemapIndexResponse = await request('/sitemap.xml');
  const sitemapIndex = await sitemapIndexResponse.text();
  const sitemapRefs = xmlLocations(sitemapIndex);
  const sitemapUrls = [];
  for (const sitemapUrl of sitemapRefs) {
    const response = await fetchImpl(sitemapUrl, { headers: { 'user-agent': 'TinyStepsDeploymentVerifier/1.0' } });
    sitemapUrls.push(...xmlLocations(await response.text()));
  }
  record('canonical sitemap index', sitemapIndexResponse.status === 200 && sitemapRefs.length > 0, `${sitemapRefs.length} child sitemap(s)`);

  const forbidden = [
    ...PUBLIC_REDIRECT_MANIFEST.map((entry) => entry.source),
    ...PRIVATE_ROUTES,
    '/rss.xml',
    '/feed.xml',
    '/sitemap.xml',
  ];
  for (const pathname of forbidden) {
    const variants = new Set([`${origin}${pathname}`, `${origin}${pathname.replace(/\/+$/, '')}`]);
    record(`sitemap exclusion ${pathname}`, !sitemapUrls.some((url) => variants.has(url)), pathname);
  }

  for (const absoluteUrl of sitemapUrls) {
    const expected = new URL(absoluteUrl);
    const response = await fetchImpl(absoluteUrl, { redirect: 'manual', headers: { 'user-agent': 'TinyStepsDeploymentVerifier/1.0' } });
    const html = await response.text();
    const canonical = canonicalFrom(html);
    const robots = `${robotsFrom(html)},${response.headers.get('x-robots-tag') || ''}`;
    record(
      `sitemap URL ${expected.pathname}`,
      response.status === 200
        && canonical === `${origin}${expected.pathname === '/' ? '/' : expected.pathname}`
        && !/noindex/i.test(robots)
        && Boolean(titleFrom(html))
        && Boolean(h1From(html)),
      `HTTP ${response.status}; canonical ${canonical || '(missing)'}; title ${titleFrom(html)}; H1 ${h1From(html)}`,
    );
  }

  for (const pathname of PUBLIC_GAME_INDEXABILITY_ROUTES) {
    const canonicalUrl = `${origin}${pathname}`;
    const verifyPublicGameResponse = async (label, response) => {
      const html = await response.text();
      const robotsValues = metaValues(html, 'robots');
      const googlebotValues = metaValues(html, 'googlebot');
      const canonicals = canonicalValues(html);
      const xRobotsTag = response.headers.get('x-robots-tag') || '';
      record(
        `${label} ${pathname}`,
        response.status === 200
          && robotsValues.length === 1
          && googlebotValues.length === 1
          && canonicals.length === 1
          && canonicals[0] === canonicalUrl
          && !/noindex|nofollow|noarchive/i.test(`${robotsValues.join(',')},${googlebotValues.join(',')},${xRobotsTag}`)
          && Boolean(titleFrom(html))
          && Boolean(extract(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i))
          && Boolean(h1From(html)),
        `HTTP ${response.status}; robots ${robotsValues.join(' | ') || '(missing)'}; googlebot ${googlebotValues.join(' | ') || '(missing)'}; canonical ${canonicals.join(' | ') || '(missing)'}; X-Robots-Tag ${xRobotsTag || '(absent)'}`,
      );
    };

    await verifyPublicGameResponse('public game raw HTML', await request(pathname));
    await verifyPublicGameResponse(
      'public game Googlebot smartphone',
      await request(pathname, { headers: { 'user-agent': GOOGLEBOT_SMARTPHONE_USER_AGENT } }),
    );
  }

  for (const pathname of PRIVATE_ROUTES) {
    const response = await request(pathname);
    const robots = response.headers.get('x-robots-tag') || '';
    record(`private SPA ${pathname}`, response.status === 200 && /noindex/i.test(robots), `HTTP ${response.status}; X-Robots-Tag ${robots || '(missing)'}`);
  }

  const unknownPath = `/__deployment-verification-404-${expectedSha.slice(0, 12)}`;
  const unknownResponse = await request(unknownPath);
  const unknownRobots = unknownResponse.headers.get('x-robots-tag') || '';
  record('genuine unknown-route 404', unknownResponse.status === 404 && /noindex/i.test(unknownRobots), `HTTP ${unknownResponse.status}; X-Robots-Tag ${unknownRobots || '(missing)'}`);

  const buildInfoResponse = await request('/build-info.json');
  let buildInfo = {};
  try {
    buildInfo = JSON.parse(await buildInfoResponse.text());
  } catch {
    // Assertion below reports malformed or missing JSON.
  }
  record('deployed build identity', buildInfoResponse.status === 200 && buildInfo.gitSha === expectedSha, `expected ${expectedSha}; live ${buildInfo.gitSha || '(missing)'}`);

  const homepageResponse = await request('/');
  const homepageHtml = await homepageResponse.text();
  record('homepage HTTP 200', homepageResponse.status === 200, `HTTP ${homepageResponse.status}`);
  for (const stale of STALE_CONTENT) {
    record(`homepage obsolete-offer guard: ${stale}`, !homepageHtml.includes(stale), stale);
  }

  const badCanonicals = sitemapUrls.filter((url) => {
    const parsed = new URL(url);
    return Boolean(parsed.search) || (parsed.pathname !== '/' && parsed.pathname.endsWith('/'));
  });
  record('canonical URL shape', badCanonicals.length === 0, badCanonicals.join(', ') || 'no query strings or trailing slashes');

  return {
    origin,
    expectedSha,
    checkedAt: new Date().toISOString(),
    sitemapUrlCount: sitemapUrls.length,
    assertions,
    passed: assertions.every((assertion) => assertion.pass),
  };
}

export function renderMarkdown(result) {
  const passed = result.assertions.filter((assertion) => assertion.pass).length;
  const lines = [
    '# Live deployment verification',
    '',
    `- Origin: ${result.origin}`,
    `- Expected SHA: \`${result.expectedSha}\``,
    `- Checked: ${result.checkedAt}`,
    `- Result: ${result.passed ? 'PASS' : 'FAIL'} (${passed}/${result.assertions.length})`,
    `- Sitemap URLs: ${result.sitemapUrlCount}`,
    '',
    '| Result | Assertion | Evidence |',
    '|---|---|---|',
    ...result.assertions.map(({ name, pass, detail }) => `| ${pass ? 'PASS' : 'FAIL'} | ${name.replaceAll('|', '\\|')} | ${String(detail).replaceAll('|', '\\|').replace(/\s+/g, ' ')} |`),
    '',
  ];
  return lines.join('\n');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await verifyLiveDeployment(options);
  fs.mkdirSync(path.dirname(path.resolve(options.report)), { recursive: true });
  fs.writeFileSync(options.report, renderMarkdown(result), 'utf8');
  console.log(`Live deployment verification ${result.passed ? 'passed' : 'failed'}; report: ${options.report}`);
  if (!result.passed) process.exitCode = 1;
}

const isEntry = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntry) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}
