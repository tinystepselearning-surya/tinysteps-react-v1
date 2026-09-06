#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import {
  GSC_CRAWLED_NOT_INDEXED_AUDIT_DATE,
  GSC_CRAWLED_NOT_INDEXED_URLS,
  GSC_INDEX_TARGETS,
} from './gsc-crawled-not-indexed-manifest.mjs';
import { rewriteLegacyWeekBlogPaths } from '../src/lib/blogWeekRenames.js';

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, 'dist');
const PUBLIC_DIR = path.join(ROOT, 'public');
const ARTIFACTS_DIR = path.join(ROOT, 'artifacts');
const SITE_ORIGIN = 'https://tinystepslearning.com';
const QUALITY_REPORT_PATH = path.join(ARTIFACTS_DIR, 'gsc-content-quality-report.json');

const MANUAL_REQUEST_PRIORITY = [
  {
    path: '/book-demo',
    reason: 'Lead-critical assessment and enquiry page.',
  },
  {
    path: '/courses/phonics-advanced',
    reason: 'Lead-critical canonical phonics course page.',
  },
  {
    path: '/courses/grammar-mastery',
    reason: 'Lead-critical canonical grammar/writing course page.',
  },
  {
    path: '/writing-classes-for-kids',
    reason: 'Distinct commercial writing-support intent.',
  },
  {
    path: '/blog/online-english-classes-for-kids-india',
    reason: 'India-specific informational/commercial acquisition intent.',
  },
  {
    path: '/parents/choosing-course',
    reason: 'High-intent parent decision page.',
  },
  {
    path: '/parents/getting-started',
    reason: 'Assessment and onboarding decision support.',
  },
  {
    path: '/parents/tracking-progress',
    reason: 'Parent progress-measurement and next-step decision intent.',
  },
  {
    path: '/parents/speech-confidence',
    reason: 'Distinct speaking-confidence parent intent.',
  },
  {
    path: '/faq',
    reason: 'Broad parent decision/support hub with strong internal navigation.',
  },
];

let failureCount = 0;

function fail(message) {
  failureCount += 1;
  console.error(`ERROR: ${message}`);
}

function ok(message) {
  console.log(`OK: ${message}`);
}

function normalizeWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizePathname(value) {
  if (!value) return null;
  try {
    const url = new URL(String(value).trim(), SITE_ORIGIN);
    if (url.origin !== SITE_ORIGIN) return null;
    const pathname = url.pathname.replace(/\/{2,}/g, '/');
    return pathname !== '/' ? pathname.replace(/\/+$/, '') : '/';
  } catch {
    return null;
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findRenderedHtml(routePath) {
  if (routePath === '/') {
    const candidate = path.join(DIST_DIR, 'index.html');
    return (await fileExists(candidate)) ? candidate : null;
  }

  const relative = routePath.replace(/^\/+/, '');
  const candidates = [
    path.join(DIST_DIR, relative, 'index.html'),
    path.join(DIST_DIR, `${relative}.html`),
  ];

  for (const candidate of candidates) {
    if (await fileExists(candidate)) return candidate;
  }
  return null;
}

function extractLocs(xml) {
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/gi), (match) => match[1].trim());
}

async function loadCanonicalSitemapPaths() {
  const names = (await fs.readdir(PUBLIC_DIR))
    .filter((name) => /^sitemap-(?:static|blog|courses|parents)\.xml$/i.test(name))
    .sort();

  const paths = new Set();
  for (const name of names) {
    const xml = await fs.readFile(path.join(PUBLIC_DIR, name), 'utf8');
    for (const loc of extractLocs(xml)) {
      const normalized = normalizePathname(loc);
      if (normalized) paths.add(normalized);
    }
  }
  return paths;
}

async function loadRedirectSources() {
  const firebase = JSON.parse(await fs.readFile(path.join(ROOT, 'firebase.json'), 'utf8'));
  const redirects = firebase?.hosting?.redirects ?? [];
  return new Set(
    redirects
      .map((entry) => normalizePathname(entry?.source))
      .filter(Boolean),
  );
}

function robotsAllowsIndexing(document) {
  const robots = Array.from(document.querySelectorAll('meta[name="robots"]'))
    .map((node) => normalizeWhitespace(node.getAttribute('content')))
    .filter(Boolean)
    .join(', ');
  return {
    robots,
    indexable: !/(?:^|[,\s])noindex(?:[,\s]|$)/i.test(robots),
  };
}

function getCanonical(document) {
  return Array.from(document.querySelectorAll('link[rel="canonical"]'))
    .map((node) => normalizeWhitespace(node.getAttribute('href')))
    .filter(Boolean);
}

async function readQualityReport() {
  if (!(await fileExists(QUALITY_REPORT_PATH))) {
    fail('Brick 5 quality report is missing. Run scripts/gsc-content-quality-guard.mjs before Brick 6.');
    return null;
  }

  const report = JSON.parse(await fs.readFile(QUALITY_REPORT_PATH, 'utf8'));
  if (report.canonicalQualityTargets !== 23) {
    fail(`Brick 5 report must certify 23 canonical targets; found ${report.canonicalQualityTargets}.`);
  }
  if ((report.nearDuplicatePairs ?? []).length !== 0) {
    fail(`Brick 5 report still contains ${report.nearDuplicatePairs.length} near-duplicate pair(s).`);
  }
  if ((report.unexpectedHistoricalNonIndexLinkCount ?? 0) !== 0) {
    fail(`Brick 5 report still contains ${report.unexpectedHistoricalNonIndexLinkCount} unexpected historical non-index link(s).`);
  }
  return report;
}

function canonicalIndexTargets() {
  return [...new Set(GSC_INDEX_TARGETS.map((target) => rewriteLegacyWeekBlogPaths(target)))];
}

function buildDoNotSubmitRows() {
  return GSC_CRAWLED_NOT_INDEXED_URLS
    .filter((row) => row.action !== 'index')
    .map((row) => {
      const historicalPath = row.path;
      let currentPath = historicalPath;
      if (row.action === 'noindex-archive' && historicalPath.startsWith('/blog/')) {
        currentPath = rewriteLegacyWeekBlogPaths(historicalPath);
      } else if (row.action === 'redirect' && row.target) {
        currentPath = row.target;
      }

      return {
        historicalPath,
        historicalUrl: `${SITE_ORIGIN}${historicalPath}`,
        action: row.action,
        currentPath,
        target: row.target ?? null,
        reason: row.note,
      };
    });
}

async function writeTextFile(name, headerLines, rows) {
  const filePath = path.join(ARTIFACTS_DIR, name);
  const content = [...headerLines, '', ...rows, ''].join('\n');
  await fs.writeFile(filePath, content, 'utf8');
  return path.relative(ROOT, filePath);
}

async function main() {
  if (GSC_INDEX_TARGETS.length !== 23) {
    fail(`Expected 23 historical GSC index targets; found ${GSC_INDEX_TARGETS.length}.`);
  }

  const canonicalTargets = canonicalIndexTargets();
  if (canonicalTargets.length !== 23) {
    fail(`Expected 23 unique canonical GSC index targets; found ${canonicalTargets.length}.`);
  }

  const priorityPaths = new Set(MANUAL_REQUEST_PRIORITY.map((entry) => entry.path));
  if (priorityPaths.size !== MANUAL_REQUEST_PRIORITY.length) {
    fail('Manual request priority list contains duplicate paths.');
  }
  for (const priority of MANUAL_REQUEST_PRIORITY) {
    if (!canonicalTargets.includes(priority.path)) {
      fail(`Manual request priority is not one of the 23 canonical GSC targets: ${priority.path}`);
    }
  }

  const qualityReport = await readQualityReport();
  const sitemapPaths = await loadCanonicalSitemapPaths();
  const redirectSources = await loadRedirectSources();

  const readiness = [];
  for (const routePath of canonicalTargets) {
    const htmlPath = await findRenderedHtml(routePath);
    if (!htmlPath) {
      fail(`${routePath} has no rendered HTML for final revalidation.`);
      readiness.push({ path: routePath, ready: false, failures: ['missing-rendered-html'] });
      continue;
    }

    const html = await fs.readFile(htmlPath, 'utf8');
    const dom = new JSDOM(html, { url: `${SITE_ORIGIN}${routePath}` });
    const { document } = dom.window;
    const canonicalHrefs = getCanonical(document);
    const expectedCanonical = `${SITE_ORIGIN}${routePath}`;
    const robots = robotsAllowsIndexing(document);
    const failures = [];

    if (!sitemapPaths.has(routePath)) failures.push('missing-from-canonical-sitemap');
    if (redirectSources.has(routePath)) failures.push('canonical-target-is-a-redirect-source');
    if (canonicalHrefs.length !== 1 || canonicalHrefs[0] !== expectedCanonical) {
      failures.push('self-canonical-mismatch');
    }
    if (!robots.indexable) failures.push('renders-noindex');

    const qualityTarget = qualityReport?.targets?.find((target) => target.path === routePath);
    if (!qualityTarget) failures.push('missing-from-brick-5-quality-report');

    if (failures.length > 0) {
      for (const issue of failures) fail(`${routePath}: ${issue}`);
    }

    const priority = MANUAL_REQUEST_PRIORITY.find((entry) => entry.path === routePath) ?? null;
    readiness.push({
      path: routePath,
      url: `${SITE_ORIGIN}${routePath}`,
      ready: failures.length === 0,
      failures,
      canonical: canonicalHrefs[0] ?? null,
      robots: robots.robots,
      inCanonicalSitemap: sitemapPaths.has(routePath),
      quality: qualityTarget
        ? {
            wordCount: qualityTarget.wordCount,
            sectionHeadingCount: qualityTarget.sectionHeadingCount,
            internalLinkCount: qualityTarget.internalLinkCount,
          }
        : null,
      disposition: priority ? 'request-indexing-now' : 'wait-for-google-recrawl',
      priorityReason: priority?.reason ?? 'Ready and discoverable; allow sitemap recrawl before using manual requests.',
      gscIndexedState: 'unknown-until-url-inspection',
      liveInspectionRequired: true,
    });
  }

  const requestNow = readiness.filter((row) => row.ready && row.disposition === 'request-indexing-now');
  const waitForRecrawl = readiness.filter((row) => row.ready && row.disposition === 'wait-for-google-recrawl');
  const blocked = readiness.filter((row) => !row.ready);
  const doNotSubmit = buildDoNotSubmitRows();

  if (requestNow.length !== MANUAL_REQUEST_PRIORITY.length) {
    fail(`Expected ${MANUAL_REQUEST_PRIORITY.length} manual request-ready URLs; found ${requestNow.length}.`);
  }
  if (requestNow.length + waitForRecrawl.length + blocked.length !== 23) {
    fail('Brick 6 readiness classification does not account for all 23 canonical targets.');
  }
  if (doNotSubmit.length !== GSC_CRAWLED_NOT_INDEXED_URLS.length - GSC_INDEX_TARGETS.length) {
    fail(`Expected ${GSC_CRAWLED_NOT_INDEXED_URLS.length - GSC_INDEX_TARGETS.length} historical do-not-submit rows; found ${doNotSubmit.length}.`);
  }

  await fs.mkdir(ARTIFACTS_DIR, { recursive: true });

  const report = {
    generatedAt: new Date().toISOString(),
    historicalSnapshotDate: GSC_CRAWLED_NOT_INDEXED_AUDIT_DATE,
    policy: {
      manualRequestMethod: 'Google Search Console URL Inspection: inspect URL, Test live URL, then Request indexing.',
      multiUrlMethod: 'Canonical XML sitemaps remain the discovery/recrawl mechanism for the broader ready set.',
      indexingApiUsed: false,
      indexingApiReason: 'Google Indexing API is not used for ordinary Tiny Steps content pages.',
      note: 'Passing Brick 6 proves site-side readiness. It does not prove Google has indexed the URL; current Google state must be checked in URL Inspection.',
    },
    counts: {
      historicalRows: GSC_CRAWLED_NOT_INDEXED_URLS.length,
      canonicalIndexTargets: canonicalTargets.length,
      requestIndexingNow: requestNow.length,
      waitForGoogleRecrawl: waitForRecrawl.length,
      blockedFromSubmission: blocked.length,
      historicalDoNotSubmit: doNotSubmit.length,
    },
    requestIndexingNow: requestNow,
    waitForGoogleRecrawl: waitForRecrawl,
    blockedFromSubmission: blocked,
    doNotSubmitHistoricalUrls: doNotSubmit,
  };

  const reportPath = path.join(ARTIFACTS_DIR, 'gsc-revalidation-submission-report.json');
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  const requestFile = await writeTextFile(
    'gsc-request-indexing-now.txt',
    [
      '# Tiny Steps — Brick 6 manual Request Indexing priority batch',
      '# Site-side readiness is certified. Before each request, use URL Inspection > Test live URL.',
      '# Request indexing one URL at a time. This file does not call the Google Indexing API.',
    ],
    requestNow.map((row, index) => `${index + 1}. ${row.url} — ${row.priorityReason}`),
  );

  const waitFile = await writeTextFile(
    'gsc-wait-for-google-recrawl.txt',
    [
      '# Tiny Steps — Brick 6 ready URLs to leave to sitemap recrawl initially',
      '# These pages passed the same site-side readiness checks as the priority batch.',
      '# Inspect later if GSC still reports Crawled/Discovered - currently not indexed after the recovery window.',
    ],
    waitForRecrawl.map((row) => row.url),
  );

  const doNotSubmitFile = await writeTextFile(
    'gsc-do-not-submit.txt',
    [
      '# Tiny Steps — historical GSC URLs that must not be manually submitted for indexing',
      '# Includes redirects, intentional noindex archives, XML/RSS discovery resources, and normalization aliases.',
    ],
    doNotSubmit.map((row) => `${row.historicalUrl} | ${row.action} | ${row.reason}`),
  );

  console.log(`[gsc-revalidation] historicalRows=${GSC_CRAWLED_NOT_INDEXED_URLS.length}`);
  console.log(`[gsc-revalidation] canonicalTargets=${canonicalTargets.length}`);
  console.log(`[gsc-revalidation] requestNow=${requestNow.length}`);
  console.log(`[gsc-revalidation] waitForRecrawl=${waitForRecrawl.length}`);
  console.log(`[gsc-revalidation] blocked=${blocked.length}`);
  console.log(`[gsc-revalidation] doNotSubmit=${doNotSubmit.length}`);
  console.log(`[gsc-revalidation] report=${path.relative(ROOT, reportPath)}`);
  console.log(`[gsc-revalidation] requestFile=${requestFile}`);
  console.log(`[gsc-revalidation] waitFile=${waitFile}`);
  console.log(`[gsc-revalidation] doNotSubmitFile=${doNotSubmitFile}`);

  if (failureCount > 0) process.exit(1);
  ok('Brick 6 GSC revalidation and submission plan passed');
}

main().catch((error) => {
  console.error(`ERROR: ${error.stack || error.message}`);
  process.exit(1);
});
