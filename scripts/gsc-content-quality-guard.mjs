#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import {
  GSC_CRAWLED_NOT_INDEXED_URLS,
  GSC_INDEX_TARGETS,
} from './gsc-crawled-not-indexed-manifest.mjs';
import {
  rewriteLegacyWeekBlogPaths,
} from '../src/lib/blogWeekRenames.js';
import {
  shouldNoindexBlogSlug,
} from '../src/lib/blogIndexingPolicy.js';

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, 'dist');
const ARTIFACTS_DIR = path.join(ROOT, 'artifacts');
const SITE_ORIGIN = 'https://tinystepslearning.com';

// Brick 5 is deliberately conservative: it protects the genuine historical
// GSC index targets from becoming thin, duplicated, or internally dependent on
// URLs that are intentionally outside the index. It does not rename routes or
// invent new consolidation decisions.
const TARGET_PATHS = [...new Set(
  GSC_INDEX_TARGETS.map((target) => rewriteLegacyWeekBlogPaths(target)),
)];

const MIN_WORDS = 180;
const MIN_SECTION_HEADINGS = 2;
const MIN_INTERNAL_LINKS = 2;
const NEAR_DUPLICATE_THRESHOLD = 0.90;

let hasError = false;

function fail(message) {
  hasError = true;
  console.error(`ERROR: ${message}`);
}

function ok(message) {
  console.log(`OK: ${message}`);
}

function normalizeWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeComparable(value) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function normalizePathname(value) {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  if (/^(?:mailto|tel|javascript|data):/i.test(trimmed)) return null;

  try {
    const url = new URL(trimmed.replace(/&amp;/g, '&'), SITE_ORIGIN);
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
    const rootFile = path.join(DIST_DIR, 'index.html');
    return (await fileExists(rootFile)) ? rootFile : null;
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

function getRobots(document) {
  return Array.from(document.querySelectorAll('meta[name="robots"]'))
    .map((node) => normalizeWhitespace(node.getAttribute('content')))
    .filter(Boolean)
    .join(', ');
}

function getCanonicalHrefs(document) {
  return Array.from(document.querySelectorAll('link[rel="canonical"]'))
    .map((node) => normalizeWhitespace(node.getAttribute('href')))
    .filter(Boolean);
}

function getMainText(document) {
  const source = document.querySelector('main') || document.body;
  if (!source) return '';
  const clone = source.cloneNode(true);
  for (const node of clone.querySelectorAll('script, style, noscript, svg, nav, footer')) {
    node.remove();
  }
  return normalizeWhitespace(clone.textContent);
}

function countWords(text) {
  return text.match(/[\p{L}\p{N}]+(?:['’.-][\p{L}\p{N}]+)*/gu)?.length || 0;
}

function makeShingles(text, width = 5) {
  const words = normalizeComparable(text).split(' ').filter(Boolean);
  const shingles = new Set();
  for (let index = 0; index <= words.length - width; index += 1) {
    shingles.add(words.slice(index, index + width).join(' '));
  }
  return shingles;
}

function jaccard(left, right) {
  if (!left.size || !right.size) return 0;
  let intersection = 0;
  for (const value of left) {
    if (right.has(value)) intersection += 1;
  }
  return intersection / (left.size + right.size - intersection);
}

function getHistoricalNonIndexPaths() {
  const paths = new Set();

  for (const row of GSC_CRAWLED_NOT_INDEXED_URLS) {
    if (row.action === 'index') continue;

    // `/blog/` and `/courses/` are historical trailing-slash duplicates of
    // the indexable `/blog` and `/courses` canonicals. URL normalization strips
    // the slash, so counting them here would falsely label every link to those
    // canonical hubs as a link to a non-index URL.
    if (row.action === 'redirect' && row.normalization === 'trailingSlash') continue;

    const historical = normalizePathname(row.path);
    if (historical) paths.add(historical);

    if (row.action === 'noindex-archive' && row.path.startsWith('/blog/')) {
      const canonicalPath = rewriteLegacyWeekBlogPaths(row.path);
      const slug = canonicalPath.slice('/blog/'.length);
      if (shouldNoindexBlogSlug(slug)) {
        const normalized = normalizePathname(canonicalPath);
        if (normalized) paths.add(normalized);
      }
    }
  }

  return paths;
}

function registerUnique(map, value, routePath, label) {
  const normalized = normalizeComparable(value);
  if (!normalized) return;
  const previous = map.get(normalized);
  if (previous && previous !== routePath) {
    fail(`${routePath} duplicates ${label} used by ${previous}: ${value}`);
  } else {
    map.set(normalized, routePath);
  }
}

async function main() {
  const historicalNonIndexPaths = getHistoricalNonIndexPaths();
  const titleOwners = new Map();
  const descriptionOwners = new Map();
  const h1Owners = new Map();
  const reports = [];

  for (const routePath of TARGET_PATHS) {
    const htmlPath = await findRenderedHtml(routePath);
    if (!htmlPath) {
      fail(`${routePath} is missing rendered HTML`);
      reports.push({ path: routePath, missingRenderedHtml: true });
      continue;
    }

    const html = await fs.readFile(htmlPath, 'utf8');
    const dom = new JSDOM(html, { url: `${SITE_ORIGIN}${routePath}` });
    const { document } = dom.window;

    const title = normalizeWhitespace(document.querySelector('title')?.textContent);
    const description = normalizeWhitespace(document.querySelector('meta[name="description"]')?.getAttribute('content'));
    const h1s = Array.from(document.querySelectorAll('h1')).map((node) => normalizeWhitespace(node.textContent)).filter(Boolean);
    const headings = Array.from(document.querySelectorAll('main h2, main h3')).map((node) => normalizeWhitespace(node.textContent)).filter(Boolean);
    const canonicalHrefs = getCanonicalHrefs(document);
    const robots = getRobots(document);
    const mainText = getMainText(document);
    const wordCount = countWords(mainText);

    const internalLinks = new Set();
    const nonIndexLinks = new Set();
    for (const anchor of document.querySelectorAll('a[href]')) {
      const linkedPath = normalizePathname(anchor.getAttribute('href'));
      if (!linkedPath || linkedPath === routePath) continue;
      internalLinks.add(linkedPath);
      if (historicalNonIndexPaths.has(linkedPath)) nonIndexLinks.add(linkedPath);
    }

    const expectedCanonical = `${SITE_ORIGIN}${routePath === '/' ? '/' : routePath}`;
    if (canonicalHrefs.length !== 1 || canonicalHrefs[0] !== expectedCanonical) {
      fail(`${routePath} must render exactly one self-canonical (${expectedCanonical}); found ${canonicalHrefs.join(', ') || 'none'}`);
    }
    if (/(?:^|[,\s])noindex(?:[,\s]|$)/i.test(robots)) {
      fail(`${routePath} renders noindex (${robots})`);
    }
    if (!title || title.length < 20) {
      fail(`${routePath} has a missing or weak title (${title.length} chars)`);
    }
    if (!description || description.length < 50) {
      fail(`${routePath} has a missing or weak meta description (${description.length} chars)`);
    }
    if (h1s.length !== 1 || h1s[0].length < 10) {
      fail(`${routePath} must have exactly one meaningful H1; found ${h1s.length}`);
    }
    if (wordCount < MIN_WORDS) {
      fail(`${routePath} has only ${wordCount} rendered main-content words; expected at least ${MIN_WORDS}`);
    }
    if (headings.length < MIN_SECTION_HEADINGS) {
      fail(`${routePath} has only ${headings.length} rendered H2/H3 section headings; expected at least ${MIN_SECTION_HEADINGS}`);
    }
    if (internalLinks.size < MIN_INTERNAL_LINKS) {
      fail(`${routePath} has only ${internalLinks.size} unique crawlable internal links; expected at least ${MIN_INTERNAL_LINKS}`);
    }

    registerUnique(titleOwners, title, routePath, 'title');
    registerUnique(descriptionOwners, description, routePath, 'meta description');
    if (h1s.length === 1) registerUnique(h1Owners, h1s[0], routePath, 'H1');

    reports.push({
      path: routePath,
      renderedHtml: path.relative(ROOT, htmlPath),
      title,
      description,
      h1: h1s[0] || '',
      h1Count: h1s.length,
      sectionHeadingCount: headings.length,
      wordCount,
      internalLinkCount: internalLinks.size,
      linksToHistoricalNonIndexUrls: [...nonIndexLinks].sort(),
      shingles: makeShingles(mainText),
    });

    ok(`${routePath}: ${wordCount} words, ${headings.length} sections, ${internalLinks.size} internal links`);
  }

  const nearDuplicatePairs = [];
  for (let leftIndex = 0; leftIndex < reports.length; leftIndex += 1) {
    const left = reports[leftIndex];
    if (!left.shingles || left.shingles.size < 50) continue;

    for (let rightIndex = leftIndex + 1; rightIndex < reports.length; rightIndex += 1) {
      const right = reports[rightIndex];
      if (!right.shingles || right.shingles.size < 50) continue;

      const similarity = jaccard(left.shingles, right.shingles);
      if (similarity >= NEAR_DUPLICATE_THRESHOLD) {
        nearDuplicatePairs.push({
          left: left.path,
          right: right.path,
          similarity: Number(similarity.toFixed(4)),
        });
        fail(`${left.path} and ${right.path} are near-duplicate rendered pages (Jaccard ${similarity.toFixed(3)})`);
      }
    }
  }

  const serializableReports = reports.map(({ shingles, ...report }) => report);
  const historicalNonIndexLinkCount = serializableReports.reduce(
    (total, report) => total + (report.linksToHistoricalNonIndexUrls?.length || 0),
    0,
  );

  await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
  await fs.writeFile(
    path.join(ARTIFACTS_DIR, 'gsc-content-quality-report.json'),
    `${JSON.stringify({
      generatedAt: new Date().toISOString(),
      historicalIndexTargets: GSC_INDEX_TARGETS.length,
      canonicalQualityTargets: TARGET_PATHS.length,
      thresholds: {
        minWords: MIN_WORDS,
        minSectionHeadings: MIN_SECTION_HEADINGS,
        minInternalLinks: MIN_INTERNAL_LINKS,
        nearDuplicateJaccard: NEAR_DUPLICATE_THRESHOLD,
      },
      nearDuplicatePairs,
      historicalNonIndexLinkCount,
      targets: serializableReports,
    }, null, 2)}\n`,
    'utf8',
  );

  console.log(`[gsc-content-quality] historicalTargets=${GSC_INDEX_TARGETS.length}`);
  console.log(`[gsc-content-quality] canonicalTargets=${TARGET_PATHS.length}`);
  console.log(`[gsc-content-quality] nearDuplicatePairs=${nearDuplicatePairs.length}`);
  console.log(`[gsc-content-quality] linksToHistoricalNonIndexUrls=${historicalNonIndexLinkCount}`);
  console.log('[gsc-content-quality] report=artifacts/gsc-content-quality-report.json');

  if (hasError) process.exit(1);
  console.log('GSC content quality and consolidation guard passed.');
}

main().catch((error) => {
  console.error(`ERROR: ${error.stack || error.message}`);
  process.exit(1);
});
