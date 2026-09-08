#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  RESOURCE_CTA_POLICIES,
  RESOURCE_COMMERCIAL_READINESS,
  RESOURCE_ECOSYSTEM_REGISTRY,
  RESOURCE_PERFORMANCE_PRIORITY_PATHS,
  RESOURCE_SEARCH_INTENTS,
} from '../src/lib/resourcesArchitectureRegistry.js';
import {
  PUBLIC_ROUTE_MANIFEST,
  PUBLIC_REDIRECT_MANIFEST,
} from '../src/lib/publicRouteManifest.js';
import { ROUTE_SEO_REGISTRY } from '../src/lib/routeSeoRegistry.js';

const ROOT = process.cwd();
const SITE_ORIGIN = 'https://tinystepslearning.com';
const FIREBASE_PATH = path.join(ROOT, 'firebase.json');
const ROBOTS_PATH = path.join(ROOT, 'public', 'robots.txt');
const ROUTES_PATH = path.join(ROOT, 'src', 'app', 'routes.tsx');
const OUTPUT_DIR = path.join(ROOT, 'artifacts', 'seo', 'resources-r0');

const args = process.argv.slice(2);
const shouldWrite = args.includes('--write');
const strict = args.includes('--strict');
const argValue = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
};
const gscPath = argValue('--gsc');
const ga4Path = argValue('--ga4');

const expectedAiBots = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'PerplexityBot',
  'GPTBot',
  'Claude-SearchBot',
  'ClaudeBot',
];

const privatePrefixes = [
  '/admin/',
  '/surya/',
  '/teacher/',
  '/parent/',
  '/kids/',
  '/messages/',
  '/learning-partner/dashboard',
  '/dev/',
];

let failures = 0;
let warnings = 0;
const diagnostics = [];

function record(level, code, message, context = {}) {
  diagnostics.push({ level, code, message, ...context });
  if (level === 'error') failures += 1;
  if (level === 'warning') warnings += 1;
}

function normalizePathname(value) {
  if (!value) return '';
  try {
    const url = new URL(value, SITE_ORIGIN);
    return url.pathname.replace(/\/+$/, '') || '/';
  } catch {
    const raw = String(value).trim();
    if (!raw) return '';
    const prefixed = raw.startsWith('/') ? raw : `/${raw}`;
    return prefixed.replace(/\/+$/, '') || '/';
  }
}

function csvEscape(value) {
  const text = value == null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') field += char;
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  if (!rows.length) return [];
  const headers = rows[0].map((item) => item.trim());
  return rows.slice(1)
    .filter((values) => values.some((item) => item.trim()))
    .map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
}

function firstValue(row, candidates) {
  const entries = Object.entries(row);
  for (const candidate of candidates) {
    const match = entries.find(([key]) => key.trim().toLowerCase() === candidate.toLowerCase());
    if (match && String(match[1]).trim() !== '') return match[1];
  }
  return '';
}

function asNumber(value) {
  const normalized = String(value ?? '').replace(/[%,$]/g, '').trim();
  if (!normalized) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

async function loadPerformanceCsv(filePath, source) {
  if (!filePath) return new Map();
  const absolute = path.isAbsolute(filePath) ? filePath : path.join(ROOT, filePath);
  const text = await fs.readFile(absolute, 'utf8');
  const rows = parseCsv(text);
  const map = new Map();

  for (const row of rows) {
    const pathValue = firstValue(row, [
      'Page',
      'Top pages',
      'Landing page',
      'Landing page + query string',
      'pagePath',
      'Path',
      'URL',
    ]);
    const pathname = normalizePathname(pathValue);
    if (!pathname) continue;

    if (source === 'gsc') {
      map.set(pathname, {
        clicks: asNumber(firstValue(row, ['Clicks'])),
        impressions: asNumber(firstValue(row, ['Impressions'])),
        ctr: asNumber(firstValue(row, ['CTR', 'Url CTR'])),
        position: asNumber(firstValue(row, ['Position', 'Average position'])),
      });
    } else {
      map.set(pathname, {
        sessions: asNumber(firstValue(row, ['Sessions'])),
        users: asNumber(firstValue(row, ['Users', 'Total users', 'Active users'])),
        conversions: asNumber(firstValue(row, ['Conversions', 'Key events', 'Leads'])),
      });
    }
  }

  return map;
}

function parseRobotsGroups(text) {
  const groups = [];
  let current = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.split('#')[0].trim();
    if (!line) continue;
    const [rawKey, ...rest] = line.split(':');
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(':').trim();
    if (key === 'user-agent') {
      current = { agent: value, allow: [], disallow: [] };
      groups.push(current);
    } else if (current && key === 'allow') current.allow.push(value);
    else if (current && key === 'disallow') current.disallow.push(value);
  }
  return groups;
}

function getManifestRoute(pathname) {
  return PUBLIC_ROUTE_MANIFEST.find((item) => item.path === pathname) || null;
}

function isDynamicBlogPath(pathname) {
  return pathname.startsWith('/blog/');
}

async function main() {
  const firebase = JSON.parse(await fs.readFile(FIREBASE_PATH, 'utf8'));
  const robotsText = await fs.readFile(ROBOTS_PATH, 'utf8');
  const routesSource = await fs.readFile(ROUTES_PATH, 'utf8');
  const robotsGroups = parseRobotsGroups(robotsText);
  const firebaseRedirects = firebase?.hosting?.redirects || [];

  const registryPaths = new Set();
  for (const item of RESOURCE_ECOSYSTEM_REGISTRY) {
    if (registryPaths.has(item.path)) record('error', 'duplicate-registry-path', `Duplicate R0 registry path: ${item.path}`);
    registryPaths.add(item.path);

    if (!RESOURCE_SEARCH_INTENTS.includes(item.primaryIntent)) {
      record('error', 'invalid-search-intent', `Unsupported search intent for ${item.path}: ${item.primaryIntent}`);
    }
    if (!RESOURCE_CTA_POLICIES.includes(item.ctaPolicy)) {
      record('error', 'invalid-cta-policy', `Unsupported CTA policy for ${item.path}: ${item.ctaPolicy}`);
    }
    if (!RESOURCE_COMMERCIAL_READINESS.includes(item.commercialReadiness)) {
      record('error', 'invalid-commercial-readiness', `Unsupported commercial readiness for ${item.path}: ${item.commercialReadiness}`);
    }

    if (item.currentState === 'route') {
      const manifest = getManifestRoute(item.path);
      if (!manifest) record('error', 'route-not-in-manifest', `Protected route is missing from PUBLIC_ROUTE_MANIFEST: ${item.path}`);
      const seo = ROUTE_SEO_REGISTRY[item.path];
      if (!seo) record('error', 'route-not-in-seo-registry', `Protected route is missing from ROUTE_SEO_REGISTRY: ${item.path}`);
      else if ((seo.canonicalPath || item.path) !== item.path) {
        record('error', 'unexpected-canonical', `Protected route is not self-canonical: ${item.path}`, { canonical: seo.canonicalPath });
      }
    }

    if (item.currentState === 'blog-route' && !isDynamicBlogPath(item.path)) {
      record('error', 'invalid-blog-route', `Blog route does not use /blog/*: ${item.path}`);
    }

    if (item.currentState === 'planned') {
      if (getManifestRoute(item.path)) record('error', 'planned-route-already-live', `Planned Resources route already exists in manifest: ${item.path}`);
      const sitemapNeedle = `${SITE_ORIGIN}${item.path}`;
      const publicFiles = await fs.readdir(path.join(ROOT, 'public'));
      for (const name of publicFiles.filter((value) => /^sitemap.*\.xml$/i.test(value))) {
        const xml = await fs.readFile(path.join(ROOT, 'public', name), 'utf8');
        if (xml.includes(`<loc>${sitemapNeedle}</loc>`)) {
          record('error', 'planned-route-in-sitemap', `Planned Resources route already appears in ${name}: ${item.path}`);
        }
      }
    }
  }

  const resources = RESOURCE_ECOSYSTEM_REGISTRY.find((item) => item.path === '/resources');
  if (!resources || resources.currentState !== 'route') {
    record('error', 'resources-current-state', '/resources must be recorded as an independent route after Brick 2.');
  } else {
    const directFirebaseRedirect = firebaseRedirects.find((item) => item.source === '/resources' || item.source === '/resources/');
    if (directFirebaseRedirect) {
      record('error', 'resources-stale-firebase-redirect', `Firebase still redirects ${directFirebaseRedirect.source} to ${directFirebaseRedirect.destination}.`);
    }

    const routeRedirectPattern = /path:\s*['"]resources['"][\s\S]{0,180}Navigate\s+to=['"]\/blog['"]/m;
    if (routeRedirectPattern.test(routesSource)) {
      record('error', 'resources-stale-react-redirect', 'React still redirects /resources to /blog after Brick 2.');
    }

    const routePagePattern = /path:\s*['"]resources['"][\s\S]{0,180}<ResourcesPage\s*\/>/m;
    if (!routePagePattern.test(routesSource)) {
      record('error', 'resources-react-page-missing', 'Could not confirm that React renders ResourcesPage at /resources.');
    }

    if (PUBLIC_REDIRECT_MANIFEST.some((item) => item.source === '/resources' || item.source === '/resources/')) {
      record('error', 'resources-public-redirect-manifest-stale', '/resources must not remain in PUBLIC_REDIRECT_MANIFEST after Brick 2.');
    }

    const mainResourcesRedirect = firebaseRedirects.find((item) => item.source === '/main/resources');
    if (!mainResourcesRedirect || mainResourcesRedirect.destination !== '/resources' || mainResourcesRedirect.type !== 301) {
      record('error', 'main-resources-legacy-target', 'Legacy /main/resources must permanently redirect to the new /resources gateway.');
    }
  }

  const wildcard = robotsGroups.find((group) => group.agent === '*');
  if (!wildcard) record('error', 'robots-wildcard-missing', 'robots.txt has no User-agent: * group.');
  else {
    if (!wildcard.allow.includes('/')) record('error', 'robots-public-allow-missing', 'robots.txt wildcard group does not explicitly Allow: /.');
    for (const prefix of privatePrefixes) {
      if (!wildcard.disallow.includes(prefix)) record('warning', 'robots-private-prefix-missing', `Wildcard robots group does not explicitly disallow ${prefix}`);
    }
  }

  for (const bot of expectedAiBots) {
    const group = robotsGroups.find((item) => item.agent.toLowerCase() === bot.toLowerCase());
    if (!group) record('warning', 'ai-bot-group-missing', `No explicit robots group found for ${bot}; wildcard policy may still apply.`, { bot });
    else if (!group.allow.includes('/')) record('error', 'ai-bot-public-allow-missing', `${bot} does not explicitly allow public crawling.`, { bot });
  }

  for (const item of RESOURCE_ECOSYSTEM_REGISTRY.filter((entry) => entry.protection === 'protected')) {
    if (privatePrefixes.some((prefix) => item.path.startsWith(prefix))) {
      record('error', 'protected-public-path-blocked', `Protected public URL falls under a private robots prefix: ${item.path}`);
    }
  }

  const gsc = await loadPerformanceCsv(gscPath, 'gsc');
  const ga4 = await loadPerformanceCsv(ga4Path, 'ga4');
  const performance = RESOURCE_PERFORMANCE_PRIORITY_PATHS.map((pathname) => ({
    path: pathname,
    gsc: gsc.get(pathname) || null,
    ga4: ga4.get(pathname) || null,
    status: gsc.has(pathname) || ga4.has(pathname) ? 'available' : 'missing',
  }));

  const missingPerformance = performance.filter((row) => row.status === 'missing').map((row) => row.path);
  if (!gscPath) {
    record('warning', 'gsc-baseline-not-imported', 'No GSC page-performance CSV was provided. Run with --gsc <export.csv> to freeze the pre-change performance baseline.');
  }
  if (!ga4Path) {
    record('warning', 'ga4-baseline-not-imported', 'No GA4 landing-page CSV was provided. Run with --ga4 <export.csv> when available.');
  }

  const reportRows = RESOURCE_ECOSYSTEM_REGISTRY.map((item) => {
    const manifest = getManifestRoute(item.path);
    const seo = ROUTE_SEO_REGISTRY[item.path];
    const firebaseRedirect = firebaseRedirects.find((redirect) => redirect.source === item.path);
    const perf = performance.find((row) => row.path === item.path);
    return {
      ...item,
      technical: {
        manifest: manifest
          ? { indexable: manifest.indexable, prerender: manifest.prerender, sitemap: manifest.sitemap, canonicalPath: manifest.canonicalPath }
          : null,
        seo: seo
          ? { title: seo.title || null, description: seo.description || null, canonicalPath: seo.canonicalPath || item.path, robots: seo.robots || null }
          : null,
        firebaseRedirect: firebaseRedirect || null,
      },
      performance: perf || null,
    };
  });

  const summary = {
    generatedAt: new Date().toISOString(),
    productionBehaviorChangedByR0: false,
    registryEntries: RESOURCE_ECOSYSTEM_REGISTRY.length,
    protectedEntries: RESOURCE_ECOSYSTEM_REGISTRY.filter((item) => item.protection === 'protected').length,
    plannedEntries: RESOURCE_ECOSYSTEM_REGISTRY.filter((item) => item.protection === 'planned').length,
    opportunityEntries: RESOURCE_ECOSYSTEM_REGISTRY.filter((item) => item.protection === 'opportunity').length,
    performancePriorityPaths: RESOURCE_PERFORMANCE_PRIORITY_PATHS.length,
    performanceRowsAvailable: performance.filter((row) => row.status === 'available').length,
    performanceRowsMissing: missingPerformance.length,
    errors: failures,
    warnings,
  };

  const report = { summary, diagnostics, performance, registry: reportRows };

  if (shouldWrite) {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.writeFile(path.join(OUTPUT_DIR, 'resources-r0-baseline.json'), `${JSON.stringify(report, null, 2)}\n`);

    const headers = [
      'path', 'currentState', 'pageFamily', 'audience', 'subject', 'currentPurpose',
      'primaryIntent', 'primaryQueryOwner', 'commercialReadiness', 'ctaPolicy',
      'primaryDestination', 'protection', 'futureResourceNode', 'indexable', 'prerender',
      'sitemap', 'canonicalPath', 'seoTitle', 'gscClicks', 'gscImpressions', 'gscCtr',
      'gscPosition', 'ga4Sessions', 'ga4Users', 'ga4Conversions', 'performanceStatus',
    ];
    const csvRows = reportRows.map((row) => {
      const g = row.performance?.gsc || {};
      const a = row.performance?.ga4 || {};
      return [
        row.path, row.currentState, row.pageFamily, row.audience, row.subject,
        row.currentPurpose, row.primaryIntent, row.primaryQueryOwner,
        row.commercialReadiness, row.ctaPolicy, row.primaryDestination,
        row.protection, row.futureResourceNode,
        row.technical.manifest?.indexable ?? '', row.technical.manifest?.prerender ?? '',
        row.technical.manifest?.sitemap ?? '', row.technical.seo?.canonicalPath ?? '',
        row.technical.seo?.title ?? '', g.clicks ?? '', g.impressions ?? '', g.ctr ?? '',
        g.position ?? '', a.sessions ?? '', a.users ?? '', a.conversions ?? '',
        row.performance?.status || '',
      ].map(csvEscape).join(',');
    });
    await fs.writeFile(path.join(OUTPUT_DIR, 'resources-r0-baseline.csv'), `${headers.join(',')}\n${csvRows.join('\n')}\n`);
  }

  console.log('\nTiny Steps Resources R0 Safety Baseline');
  console.log('=======================================');
  console.log(`Registry entries: ${summary.registryEntries}`);
  console.log(`Protected: ${summary.protectedEntries} | Planned: ${summary.plannedEntries} | Opportunity: ${summary.opportunityEntries}`);
  console.log(`Performance rows available: ${summary.performanceRowsAvailable}/${summary.performancePriorityPaths}`);
  console.log(`Errors: ${summary.errors} | Warnings: ${summary.warnings}`);

  for (const item of diagnostics) {
    const prefix = item.level === 'error' ? 'ERROR' : item.level === 'warning' ? 'WARN' : 'INFO';
    console.log(`${prefix}: [${item.code}] ${item.message}`);
  }

  if (shouldWrite) console.log(`Wrote ${path.relative(ROOT, OUTPUT_DIR)}/resources-r0-baseline.{json,csv}`);

  if (failures > 0 || (strict && missingPerformance.length > 0)) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
