#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  APPLICATION_ROUTE_INTENT_MANIFEST,
  DYNAMIC_PUBLIC_ROUTE_INTENT_MANIFEST,
  PUBLIC_REDIRECT_MANIFEST,
  PUBLIC_ROUTE_MANIFEST,
} from '../src/lib/publicRouteManifest.js';
import { ROUTE_SEO_REGISTRY } from '../src/lib/routeSeoRegistry.js';

const root = process.cwd();
const origin = 'https://tinystepslearning.com';
const firebase = JSON.parse(fs.readFileSync(path.join(root, 'firebase.json'), 'utf8')).hosting;
const firebaseRedirects = firebase.redirects || [];
const sitemapXml = fs.readdirSync(path.join(root, 'public'))
  .filter((name) => /^sitemap.*\.xml$/.test(name))
  .map((name) => fs.readFileSync(path.join(root, 'public', name), 'utf8'))
  .join('\n');
const sitemapLocations = new Set(
  [...sitemapXml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map((match) => match[1].trim()),
);

const htmlFor = (route) => {
  const target = route === '/'
    ? path.join(root, 'dist', 'index.html')
    : path.join(root, 'dist', route.slice(1), 'index.html');
  return fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
};
const extract = (html, regex) => html.match(regex)?.[1]?.trim() || '';
const canonicalFrom = (html) => extract(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
const robotsFrom = (html) => extract(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i);
const textFrom = (html, regex) => extract(html, regex)
  .replace(/<[^>]+>/g, ' ')
  .replace(/&(?:amp|quot|#39|nbsp);/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const rows = [];
for (const entry of PUBLIC_ROUTE_MANIFEST) {
  const html = htmlFor(entry.path);
  const canonical = canonicalFrom(html);
  const robots = robotsFrom(html);
  const seo = ROUTE_SEO_REGISTRY[entry.path];
  const sitemapActual = sitemapLocations.has(`${origin}${entry.path === '/' ? '/' : entry.path}`);
  const reasons = [];
  if (entry.prerender && !html) reasons.push('missing prerendered HTML');
  if (html && canonical !== `${origin}${entry.canonicalPath === '/' ? '/' : entry.canonicalPath}`) reasons.push(`canonical is ${canonical || 'missing'}`);
  if (entry.sitemap !== sitemapActual) reasons.push(`sitemap expected ${entry.sitemap}, actual ${sitemapActual}`);
  if (!seo) reasons.push('missing SEO registry entry');
  if (entry.indexable && /noindex/i.test(robots)) reasons.push('rendered robots is noindex');
  if (!entry.indexable && html && !/noindex/i.test(robots)) reasons.push('rendered robots is not noindex');
  rows.push({
    route: entry.path,
    intendedState: entry.intent,
    httpExpectation: 200,
    canonicalExpectation: `${origin}${entry.canonicalPath === '/' ? '/' : entry.canonicalPath}`,
    sitemapExpectation: entry.sitemap,
    prerenderExpectation: entry.prerender,
    robotsExpectation: entry.robots,
    actualLocalBuild: { html: Boolean(html), canonical, robots, sitemap: sitemapActual },
    pass: reasons.length === 0,
    reason: reasons.join('; ') || 'matches manifest',
  });
}

for (const redirect of PUBLIC_REDIRECT_MANIFEST) {
  const match = firebaseRedirects.find((candidate) => candidate.source === redirect.source);
  const pass = match?.destination === redirect.destination && match?.type === redirect.status;
  const redirectInSitemap = sitemapLocations.has(`${origin}${redirect.source}`);
  rows.push({
    route: redirect.source,
    intendedState: 'redirect',
    httpExpectation: redirect.status,
    canonicalExpectation: `${origin}${redirect.destination}`,
    sitemapExpectation: false,
    prerenderExpectation: false,
    robotsExpectation: 'redirect source excluded',
    actualLocalBuild: { firebaseRedirect: match || null, sitemap: redirectInSitemap },
    pass: pass && !redirectInSitemap,
    reason: pass ? 'Firebase redirect matches manifest' : 'Firebase redirect mismatch',
  });
}

const classifiedRoutes = new Set(rows.map((row) => row.route));
const dynamicPatterns = DYNAMIC_PUBLIC_ROUTE_INTENT_MANIFEST.map((entry) => ({
  ...entry,
  prefix: entry.path.replace(/\*\*$/, ''),
}));
const sitemapRoutes = [...sitemapLocations]
  .map((location) => {
    try {
      const url = new URL(location);
      return url.origin === origin && !/\.xml$/i.test(url.pathname) ? url.pathname : null;
    } catch {
      return null;
    }
  })
  .filter(Boolean);

for (const routePath of [...new Set(sitemapRoutes)].filter((routePath) => !classifiedRoutes.has(routePath))) {
  const dynamicIntent = dynamicPatterns.find((entry) => routePath.startsWith(entry.prefix));
  const html = htmlFor(routePath);
  const canonical = canonicalFrom(html);
  const robots = robotsFrom(html);
  const title = textFrom(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const h1 = textFrom(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const visibleText = textFrom(html, /<body[^>]*>([\s\S]*?)<\/body>/i);
  const reasons = [];
  if (!dynamicIntent) reasons.push('sitemap route has no dynamic manifest intent');
  if (!html) reasons.push('missing prerendered HTML');
  if (canonical !== `${origin}${routePath}`) reasons.push(`canonical is ${canonical || 'missing'}`);
  if (/noindex/i.test(robots)) reasons.push('rendered robots is noindex');
  if (title.length < 10) reasons.push('missing or non-meaningful title');
  if (h1.length < 5) reasons.push('missing or non-meaningful H1');
  if (!visibleText || /(?:page not found|404 not found|does not exist)/i.test(h1)) reasons.push('loading shell or soft-404 language');
  rows.push({
    route: routePath,
    intendedState: dynamicIntent?.intent || 'unclassified',
    httpExpectation: 200,
    canonicalExpectation: `${origin}${routePath}`,
    sitemapExpectation: true,
    prerenderExpectation: true,
    robotsExpectation: dynamicIntent?.robots || 'unclassified',
    actualLocalBuild: {
      html: Boolean(html),
      canonical,
      robots,
      sitemap: true,
      title,
      h1,
      loadingShell: !visibleText,
      soft404: /(?:page not found|404 not found|does not exist)/i.test(h1),
      redirectChain: false,
    },
    pass: reasons.length === 0,
    reason: reasons.join('; ') || `matches dynamic manifest intent ${dynamicIntent.path}`,
  });
}

for (const entry of APPLICATION_ROUTE_INTENT_MANIFEST) {
  rows.push({
    route: entry.path,
    intendedState: entry.intent,
    httpExpectation: entry.intent === 'genuine-404' ? 404 : 200,
    canonicalExpectation: null,
    sitemapExpectation: false,
    prerenderExpectation: false,
    robotsExpectation: entry.robots,
    actualLocalBuild: { validatedBy: 'firebase headers/rewrites and route-integrity guard' },
    pass: true,
    reason: 'classified; deployment behavior is verified by verify-live-deployment.mjs',
  });
}

const report = {
  generatedAt: new Date().toISOString(),
  totals: {
    routes: rows.length,
    passed: rows.filter((row) => row.pass).length,
    failed: rows.filter((row) => !row.pass).length,
  },
  routes: rows,
};
const artifacts = path.join(root, 'artifacts');
fs.mkdirSync(artifacts, { recursive: true });
fs.writeFileSync(path.join(artifacts, 'route-indexability-report.json'), `${JSON.stringify(report, null, 2)}\n`);
const markdown = [
  '# Route indexability report',
  '',
  `Generated: ${report.generatedAt}`,
  '',
  `Result: ${report.totals.failed === 0 ? 'PASS' : 'FAIL'} — ${report.totals.passed}/${report.totals.routes} classifications match.`,
  '',
  '| Route | Intent | HTTP | Sitemap | Prerender | Result | Reason |',
  '|---|---|---:|---:|---:|---|---|',
  ...rows.map((row) => `| ${row.route.replaceAll('|', '\\|')} | ${row.intendedState} | ${row.httpExpectation} | ${row.sitemapExpectation} | ${row.prerenderExpectation} | ${row.pass ? 'PASS' : 'FAIL'} | ${row.reason.replaceAll('|', '\\|')} |`),
  '',
  'Future GSC exports can be joined on `route`: intended `noindex`, `redirect`, `private-spa`, or `genuine-404` rows are expected exclusions; missing `index` rows are unexpected exclusions; indexed non-`index` rows are unexpected indexing.',
  '',
].join('\n');
fs.writeFileSync(path.join(artifacts, 'route-indexability-report.md'), markdown);
console.log(`Route indexability report: ${report.totals.passed}/${report.totals.routes} passed.`);
if (report.totals.failed) process.exitCode = 1;
