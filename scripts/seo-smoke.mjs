#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, 'public');
const ROUTE_REGISTRY_PATH = path.join(ROOT, 'src', 'lib', 'routeSeoRegistry.js');

const REQUIRED_SITEMAPS = [
  'sitemap.xml',
  'sitemap-static.xml',
  'sitemap-blog.xml',
  'sitemap-courses.xml',
  'sitemap-parents.xml',
];

const REQUIRED_SUMMER_URLS = [
  'https://tinystepslearning.com/summer-camps/phonics-fast-track',
  'https://tinystepslearning.com/summer-camps/grammar-fast-track',
  'https://tinystepslearning.com/summer-camps/speaking-fast-track',
];

const LEGACY_URLS_ABSENT = [
  'https://tinystepslearning.com/phonics-classes-for-kids',
  'https://tinystepslearning.com/courses/phonics-foundations',
  'https://tinystepslearning.com/courses/basic-grammar',
  'https://tinystepslearning.com/courses/advanced-grammar',
  'https://tinystepslearning.com/courses/basic-public-speaking',
  'https://tinystepslearning.com/courses/advanced-public-speaking',
];

const REQUIRED_CORE_URLS = [
  'https://tinystepslearning.com/phonics',
  'https://tinystepslearning.com/grammar',
  'https://tinystepslearning.com/speaking',
  'https://tinystepslearning.com/blog',
  'https://tinystepslearning.com/pricing',
  'https://tinystepslearning.com/courses',
  'https://tinystepslearning.com/curriculum',
  'https://tinystepslearning.com/courses/phonics-foundation',
  'https://tinystepslearning.com/courses/grammar',
  'https://tinystepslearning.com/courses/grammar-mastery',
  'https://tinystepslearning.com/courses/public-speaking-foundations',
  'https://tinystepslearning.com/online-phonics-reading-classes',
  'https://tinystepslearning.com/english-grammar-writing-classes',
  'https://tinystepslearning.com/public-speaking-communication-kids',
  'https://tinystepslearning.com/spoken-english-classes-for-kids-online',
  'https://tinystepslearning.com/online-english-classes-for-kids',
];

const REQUIRED_SELF_CANONICAL_LONG_TAIL_PATHS = [
  '/online-phonics-reading-classes',
  '/english-grammar-writing-classes',
  '/public-speaking-communication-kids',
  '/spoken-english-classes-for-kids-online',
  '/online-english-classes-for-kids',
];

const PRIVATE_PATH_TOKENS = [
  '/parent',
  '/teacher',
  '/kids',
  '/messages',
  '/admin',
  '/login',
  '/dashboard',
  '/surya',
  '/main',
];

const REQUIRED_SUMMER_PATHS = [
  '/summer-camps/phonics-fast-track',
  '/summer-camps/grammar-fast-track',
  '/summer-camps/speaking-fast-track',
];

const ALLOWED_CANONICAL_MISSING_FROM_SITEMAP = new Set([
  '/sitemap',
  '/privacy-policy',
  '/terms-and-conditions',
  '/refund-guarantee',
  '/login',
  '/teacher/login',
  '/parent/login',
  '/learning-partner/login',
  '/surya/login',
  '/admin/login',
  '/unauthorized',
  '/surya',
  '/teacher',
  '/parent',
  '/kids',
  '/learning-partner/dashboard',
]);

let hasError = false;

function ok(message) {
  console.log(`OK: ${message}`);
}

function fail(message) {
  hasError = true;
  console.error(`ERROR: ${message}`);
}

function extractLocs(xml) {
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (m) => m[1].trim());
}

function extractCanonicalPaths(registryText) {
  return Array.from(
    registryText.matchAll(/canonicalPath\s*:\s*['"]([^'"]+)['"]/g),
    (m) => m[1].trim(),
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractRouteEntry(registryText, routePath) {
  const routePattern = new RegExp(`['"]${escapeRegExp(routePath)}['"]\\s*:\\s*\\{([\\s\\S]*?)\\n\\s*\\},`, 'm');
  return registryText.match(routePattern)?.[1] ?? null;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const sitemapXmlByName = new Map();

  for (const sitemapName of REQUIRED_SITEMAPS) {
    const fullPath = path.join(PUBLIC_DIR, sitemapName);
    if (!(await fileExists(fullPath))) {
      fail(`Missing required sitemap file: public/${sitemapName}`);
      continue;
    }
    ok(`Found required sitemap file: public/${sitemapName}`);
    sitemapXmlByName.set(sitemapName, await fs.readFile(fullPath, 'utf8'));
  }

  const allSitemapXml = [...sitemapXmlByName.values()].join('\n');
  const allLocList = extractLocs(allSitemapXml);
  const allLocs = new Set(allLocList);

  for (const url of REQUIRED_SUMMER_URLS) {
    if (!allLocs.has(url)) fail(`Missing required summer URL in sitemap XML: ${url}`);
    else ok(`Required summer URL present: ${url}`);
  }

  for (const url of LEGACY_URLS_ABSENT) {
    if (allLocs.has(url)) fail(`Legacy duplicate URL still present in sitemap XML: ${url}`);
    else ok(`Legacy duplicate URL absent: ${url}`);
  }

  for (const url of REQUIRED_CORE_URLS) {
    if (!allLocs.has(url)) fail(`Missing canonical core URL in sitemap XML: ${url}`);
    else ok(`Canonical core URL present: ${url}`);
  }

  for (const url of REQUIRED_CORE_URLS) {
    const count = allLocList.filter((loc) => loc === url).length;
    if (count !== 1) fail(`Canonical URL must appear exactly once across sitemap XML: ${url} (found ${count})`);
    else ok(`Canonical URL appears exactly once across sitemap XML: ${url}`);
  }

  for (const token of PRIVATE_PATH_TOKENS) {
    const leaked = [...allLocs].find((url) => {
      try {
        const pathname = new URL(url).pathname;
        return pathname === token || pathname.startsWith(`${token}/`);
      } catch {
        return false;
      }
    });
    if (leaked) fail(`Private/app route leaked into sitemap XML: ${leaked}`);
    else ok(`Private/app token absent from sitemap URLs: ${token}`);
  }

  const registryText = await fs.readFile(ROUTE_REGISTRY_PATH, 'utf8');
  const canonicalPaths = [...new Set(extractCanonicalPaths(registryText))];
  const missingCanonicalPaths = canonicalPaths.filter(
    (routePath) => !allLocs.has(`https://tinystepslearning.com${routePath}`),
  );

  const unexpectedMissingCanonicalPaths = missingCanonicalPaths.filter(
    (routePath) => !ALLOWED_CANONICAL_MISSING_FROM_SITEMAP.has(routePath),
  );

  if (unexpectedMissingCanonicalPaths.length > 0) {
    for (const routePath of unexpectedMissingCanonicalPaths) {
      fail(`Public canonicalPath missing from sitemap XML: ${routePath}`);
    }
  } else {
    ok(
      `Canonical sitemap coverage check passed (${missingCanonicalPaths.length} intentional exception${
        missingCanonicalPaths.length === 1 ? '' : 's'
      })`,
    );
  }

  for (const routePath of missingCanonicalPaths) {
    if (ALLOWED_CANONICAL_MISSING_FROM_SITEMAP.has(routePath)) {
      ok(`Allowed canonicalPath missing from sitemap XML: ${routePath}`);
    }
  }

  for (const routePath of REQUIRED_SUMMER_PATHS) {
    const entryPattern = new RegExp(`['"]${routePath}['"]\\s*:\\s*\\{`, 'm');
    const canonicalPattern = new RegExp(`canonicalPath\\s*:\\s*['"]${routePath}['"]`, 'm');
    if (!entryPattern.test(registryText)) {
      fail(`Missing route SEO registry entry: ${routePath}`);
      continue;
    }
    if (!canonicalPattern.test(registryText)) {
      fail(`Missing self-canonical canonicalPath in route SEO registry: ${routePath}`);
      continue;
    }
    ok(`Route SEO registry has self-canonical entry: ${routePath}`);
  }

  for (const routePath of REQUIRED_SELF_CANONICAL_LONG_TAIL_PATHS) {
    const entry = extractRouteEntry(registryText, routePath);
    if (!entry) {
      fail(`Missing route SEO registry entry: ${routePath}`);
      continue;
    }
    if (!new RegExp(`canonicalPath\\s*:\\s*['"]${escapeRegExp(routePath)}['"]`, 'm').test(entry)) {
      fail(`Long-tail lead page is not self-canonical in route SEO registry: ${routePath}`);
      continue;
    }
    if (/robots\s*:\s*['"][^'"]*noindex/i.test(entry)) {
      fail(`Long-tail lead page must not be noindexed in route SEO registry: ${routePath}`);
      continue;
    }
    ok(`Long-tail lead page is self-canonical and indexable in route SEO registry: ${routePath}`);
  }

  if (/spoken english/i.test(registryText)) {
    fail('Route SEO registry contains forbidden phrase: spoken English');
  } else {
    ok('Route SEO registry does not contain forbidden phrase: spoken English');
  }

  if (hasError) process.exit(1);
  console.log('SEO smoke guard passed.');
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
});
