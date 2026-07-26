#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { JSDOM } from 'jsdom';

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, 'dist');
const FIREBASE_JSON = path.join(ROOT, 'firebase.json');
const CANONICAL_ORIGIN = 'https://tinystepslearning.com';
const ROOT_SITEMAP_NAME = 'sitemap.xml';
const ALLOWED_CANONICAL_COURSE_DIRECTORIES = new Set([
  'phonics-foundation',
  'phonics-brush-up',
  'phonics-advanced',
  'grammar',
  'grammar-mastery',
  'public-speaking-foundations',
  'public-speaking-excellence',
]);

const BLOCKED_PAGE_PATHS = new Set([
  '/courses/phonics-foundations',
  '/courses/grammar-essentials',
  '/courses/basic-grammar',
  '/courses/advanced-grammar',
  '/courses/basic-public-speaking',
  '/courses/advanced-public-speaking',
  '/terms',
  '/online-english-classes-for-kids-india',
  '/rss.xml',
  '/feed.xml',
  '/sitemap.xml',
  '/main/book-demo',
  '/main/resources',
  '/main/courses/phonics',
  '/main/courses/grammar',
  '/main/courses/public-speaking',
  '/main/parents',
  '/blog/week1',
  '/blog/week2',
  '/blog/week4',
  '/blog/week5',
  '/blog/week8',
  '/blog/week8.html',
]);

const BLOCKED_RENDERED_ARTIFACT_PATHS = [
  '/courses/phonics-foundations',
  '/courses/grammar-essentials',
  '/courses/basic-grammar',
  '/courses/advanced-grammar',
  '/courses/basic-public-speaking',
  '/courses/advanced-public-speaking',
  '/terms',
  '/online-english-classes-for-kids-india',
  '/main/book-demo',
  '/main/resources',
  '/main/courses/phonics',
  '/main/courses/grammar',
  '/main/courses/public-speaking',
  '/main/parents',
  '/blog/week1',
  '/blog/week2',
  '/blog/week4',
  '/blog/week5',
  '/blog/week8',
  '/blog/week8.html',
];

const BLOCKED_PAGE_PREFIXES = [
  '/main/',
  '/signup',
  '/login',
  '/admin',
  '/teacher',
  '/parent-dashboard',
];

const REQUIRED_CHILD_SITEMAPS = new Set([
  '/sitemap-static.xml',
  '/sitemap-blog.xml',
  '/sitemap-courses.xml',
  '/sitemap-parents.xml',
]);

const summary = {
  sitemapFilesParsed: 0,
  sitemapRefsChecked: 0,
  sitemapUrlsChecked: 0,
  htmlFilesChecked: 0,
  htmlExistenceFailures: 0,
  canonicalFailures: 0,
  noindexFailures: 0,
  metadataFailures: 0,
  blockedAliasFailures: 0,
  courseDirectoryFailures: 0,
};

let hasError = false;

function normalizePathname(pathname) {
  if (!pathname || pathname === '/') return '/';
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

function normalizeUrl(url) {
  const parsed = new URL(url, CANONICAL_ORIGIN);
  const pathname = normalizePathname(parsed.pathname);
  return pathname === '/' ? `${CANONICAL_ORIGIN}/` : `${CANONICAL_ORIGIN}${pathname}`;
}

function fail(category, message) {
  hasError = true;
  summary[category] += 1;
  console.error(`ERROR: ${message}`);
}

function extractLocs(xml) {
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1].trim());
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function distHtmlPathForPathname(pathname) {
  const normalized = normalizePathname(pathname);
  if (normalized === '/') return path.join(DIST_DIR, 'index.html');
  return path.join(DIST_DIR, normalized.replace(/^\/+/, ''), 'index.html');
}

function distCandidatesForPathname(pathname) {
  const normalized = normalizePathname(pathname);
  if (normalized === '/') return [path.join(DIST_DIR, 'index.html')];
  const relativePath = normalized.replace(/^\/+/, '');
  if (path.extname(relativePath)) {
    return [path.join(DIST_DIR, relativePath)];
  }
  return [
    path.join(DIST_DIR, relativePath),
    path.join(DIST_DIR, relativePath, 'index.html'),
  ];
}

function isBlockedPagePath(pathname) {
  if (BLOCKED_PAGE_PATHS.has(pathname)) return true;
  if (pathname.endsWith('.xml')) return true;
  return BLOCKED_PAGE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

async function readDistSitemapFiles() {
  const entries = await fs.readdir(DIST_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && /^sitemap.*\.xml$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

async function collectSitemapPageUrls() {
  const sitemapFiles = await readDistSitemapFiles();
  const pageUrls = new Set();
  const childSitemapsFromIndex = new Set();

  if (!sitemapFiles.includes(ROOT_SITEMAP_NAME)) {
    throw new Error(`Missing required dist/${ROOT_SITEMAP_NAME}`);
  }

  for (const sitemapName of sitemapFiles) {
    const fullPath = path.join(DIST_DIR, sitemapName);
    const xml = await fs.readFile(fullPath, 'utf8');
    const locs = extractLocs(xml);
    summary.sitemapFilesParsed += 1;

    if (/<sitemapindex\b/i.test(xml)) {
      for (const loc of locs) {
        summary.sitemapRefsChecked += 1;
        const normalized = normalizeUrl(loc);
        const pathname = new URL(normalized).pathname;

        if (pathname === '/sitemap.xml') {
          fail('blockedAliasFailures', `Root sitemap self-reference is not allowed: ${normalized}`);
          continue;
        }

        if (!pathname.endsWith('.xml')) {
          fail('blockedAliasFailures', `Sitemap index should only reference XML sitemap files: ${normalized}`);
          continue;
        }

        const expectedLocalPath = path.join(DIST_DIR, pathname.replace(/^\/+/, ''));
        if (!(await fileExists(expectedLocalPath))) {
          fail('htmlExistenceFailures', `Referenced sitemap file missing from dist: ${pathname}`);
          continue;
        }

        childSitemapsFromIndex.add(pathname);
      }
      continue;
    }

    if (!/<urlset\b/i.test(xml)) {
      fail('metadataFailures', `Unsupported sitemap XML format in dist/${sitemapName}`);
      continue;
    }

    for (const loc of locs) {
      const normalized = normalizeUrl(loc);
      pageUrls.add(normalized);
    }
  }

  for (const requiredPath of REQUIRED_CHILD_SITEMAPS) {
    if (!childSitemapsFromIndex.has(requiredPath)) {
      fail('blockedAliasFailures', `Root sitemap is missing required child sitemap reference: ${requiredPath}`);
    }
  }

  for (const sitemapName of sitemapFiles) {
    if (sitemapName === ROOT_SITEMAP_NAME) continue;
    const sitemapPath = `/${sitemapName}`;
    if (!childSitemapsFromIndex.has(sitemapPath)) {
      fail('blockedAliasFailures', `Generated sitemap file is not referenced by dist/${ROOT_SITEMAP_NAME}: ${sitemapPath}`);
    }
  }

  return [...pageUrls].sort();
}

async function checkCourseDirectories() {
  const coursesDir = path.join(DIST_DIR, 'courses');
  const entries = await fs.readdir(coursesDir, { withFileTypes: true });
  const actualDirectories = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();

  for (const directoryName of actualDirectories) {
    if (!ALLOWED_CANONICAL_COURSE_DIRECTORIES.has(directoryName)) {
      fail('courseDirectoryFailures', `Non-canonical course directory found in dist/courses: ${directoryName}`);
    }
  }
}

async function checkBlockedAliasArtifacts() {
  for (const blockedPath of BLOCKED_RENDERED_ARTIFACT_PATHS) {
    for (const candidatePath of distCandidatesForPathname(blockedPath)) {
      if (await fileExists(candidatePath)) {
        fail(
          'blockedAliasFailures',
          `Blocked alias path should not exist in dist output: ${blockedPath} (${path.relative(ROOT, candidatePath)})`,
        );
      }
    }
  }
}

function getSingleCanonicalHref(document) {
  const canonicalTags = [...document.querySelectorAll('link[rel="canonical"]')];
  if (canonicalTags.length !== 1) return { href: null, count: canonicalTags.length };
  return {
    href: canonicalTags[0].getAttribute('href')?.trim() ?? '',
    count: 1,
  };
}

function getMetaContent(document, selector) {
  return document.querySelector(selector)?.getAttribute('content')?.trim() ?? '';
}

function getRobotsMetaContents(document) {
  return ['meta[name="robots"]', 'meta[name="googlebot"]', 'meta[name="bingbot"]']
    .map((selector) => getMetaContent(document, selector))
    .filter(Boolean);
}

function h1TextList(document) {
  return [...document.querySelectorAll('h1')]
    .map((node) => node.textContent?.replace(/\s+/g, ' ').trim() ?? '')
    .filter(Boolean);
}

async function checkRenderedHtml(url) {
  summary.sitemapUrlsChecked += 1;

  const parsed = new URL(url);
  const pathname = normalizePathname(parsed.pathname);

  if (isBlockedPagePath(pathname)) {
    fail('blockedAliasFailures', `Blocked or non-index target URL leaked into sitemap page URLs: ${url}`);
  }

  const htmlPath = distHtmlPathForPathname(pathname);
  if (!(await fileExists(htmlPath))) {
    fail('htmlExistenceFailures', `Missing rendered HTML for sitemap URL ${url}: ${path.relative(ROOT, htmlPath)}`);
    return;
  }

  summary.htmlFilesChecked += 1;

  const html = await fs.readFile(htmlPath, 'utf8');
  const dom = new JSDOM(html);
  const { document } = dom.window;
  const expectedCanonicalUrl = normalizeUrl(url);

  const { href: canonicalHref, count: canonicalCount } = getSingleCanonicalHref(document);
  if (canonicalCount !== 1) {
    fail('canonicalFailures', `Expected exactly one canonical tag for ${url}, found ${canonicalCount}`);
  } else if (!canonicalHref) {
    fail('canonicalFailures', `Canonical href is empty for ${url}`);
  } else if (normalizeUrl(canonicalHref) !== expectedCanonicalUrl) {
    fail(
      'canonicalFailures',
      `Canonical href mismatch for ${url}: expected ${expectedCanonicalUrl}, found ${canonicalHref}`,
    );
  }

  for (const robotsContent of getRobotsMetaContents(document)) {
    if (/\bnoindex\b/i.test(robotsContent)) {
      fail('noindexFailures', `Rendered HTML contains noindex for ${url}: ${robotsContent}`);
    }
  }

  const title = document.querySelector('title')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  if (!title) {
    fail('metadataFailures', `Missing or empty <title> for ${url}`);
  }

  const metaDescription = getMetaContent(document, 'meta[name="description"]');
  if (!metaDescription) {
    fail('metadataFailures', `Missing or empty meta description for ${url}`);
  }

  const h1s = h1TextList(document);
  if (h1s.length !== 1) {
    fail('metadataFailures', `Expected exactly one non-empty H1 for ${url}, found ${h1s.length}`);
  }
}

async function main() {
  const firebase = JSON.parse(await fs.readFile(FIREBASE_JSON, 'utf8'));
  const redirectSources = new Set(
    (firebase?.hosting?.redirects ?? [])
      .filter((entry) => typeof entry.source === 'string')
      .map((entry) => entry.source),
  );

  const sitemapUrls = await collectSitemapPageUrls();
  await checkCourseDirectories();
  await checkBlockedAliasArtifacts();

  for (const url of sitemapUrls) {
    const pathname = normalizePathname(new URL(url).pathname);
    if (redirectSources.has(pathname)) {
      fail('blockedAliasFailures', `Redirect source leaked into sitemap page URLs: ${url}`);
    }
    await checkRenderedHtml(url);
  }

  console.log('\nSEO rendered HTML check summary:');
  console.log(`- Sitemap files parsed: ${summary.sitemapFilesParsed}`);
  console.log(`- Sitemap index refs checked: ${summary.sitemapRefsChecked}`);
  console.log(`- Sitemap URLs checked: ${summary.sitemapUrlsChecked}`);
  console.log(`- HTML files checked: ${summary.htmlFilesChecked}`);
  console.log(`- HTML existence failures: ${summary.htmlExistenceFailures}`);
  console.log(`- Canonical failures: ${summary.canonicalFailures}`);
  console.log(`- Noindex failures: ${summary.noindexFailures}`);
  console.log(`- Metadata failures: ${summary.metadataFailures}`);
  console.log(`- Blocked alias failures: ${summary.blockedAliasFailures}`);
  console.log(`- Course directory failures: ${summary.courseDirectoryFailures}`);

  if (hasError) process.exit(1);
  console.log('SEO rendered HTML check passed.');
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
});
