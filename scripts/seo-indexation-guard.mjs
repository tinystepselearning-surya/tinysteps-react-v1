#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, 'public');
const FIREBASE_JSON = path.join(ROOT, 'firebase.json');

// Canonical public pages whose accidental noindex/canonical/sitemap regression would
// directly hurt discovery or lead acquisition. This list intentionally includes the
// high-value URLs surfaced in the recent Search Console recovery review.
const REQUIRED_CANONICAL_URLS = [
  'https://tinystepslearning.com/phonics',
  'https://tinystepslearning.com/grammar',
  'https://tinystepslearning.com/speaking',
  'https://tinystepslearning.com/pricing',
  'https://tinystepslearning.com/courses',
  'https://tinystepslearning.com/curriculum',
  'https://tinystepslearning.com/faq',
  'https://tinystepslearning.com/book-demo',
  'https://tinystepslearning.com/phonics-fees-india',
  'https://tinystepslearning.com/online-english-classes-for-kids',
  'https://tinystepslearning.com/reading-classes-for-kids',
  'https://tinystepslearning.com/writing-classes-for-kids',
  'https://tinystepslearning.com/confidence-building-program-kids',
  'https://tinystepslearning.com/summer-camp-for-kids-india',
  'https://tinystepslearning.com/best-online-phonics-classes-for-kids-in-india',
  'https://tinystepslearning.com/free-reading-games-for-kids',
  'https://tinystepslearning.com/free-grammar-games-for-kids',
  'https://tinystepslearning.com/free-sentence-building-games-for-kids',
  'https://tinystepslearning.com/courses/phonics-foundation',
  'https://tinystepslearning.com/courses/phonics-brush-up',
  'https://tinystepslearning.com/courses/phonics-advanced',
  'https://tinystepslearning.com/courses/grammar',
  'https://tinystepslearning.com/courses/grammar-mastery',
  'https://tinystepslearning.com/courses/public-speaking-foundations',
  'https://tinystepslearning.com/courses/public-speaking-excellence',
  'https://tinystepslearning.com/parents/choosing-course',
  'https://tinystepslearning.com/parents/common-mistakes',
  'https://tinystepslearning.com/parents/scheduling',
  'https://tinystepslearning.com/parents/tracking-progress',
  'https://tinystepslearning.com/parents/phonics-mission',
  'https://tinystepslearning.com/for-schools',
];

const FORBIDDEN_SITEMAP_URLS = [
  'https://tinystepslearning.com/rss.xml',
  'https://tinystepslearning.com/blog/rss.xml',
  'https://tinystepslearning.com/feed.xml',
  'https://tinystepslearning.com/blog/feed.xml',
  'https://tinystepslearning.com/sitemap.xml',
  'https://tinystepslearning.com/sitemap-blog.xml',
  'https://tinystepslearning.com/sitemap-static.xml',
  'https://tinystepslearning.com/sitemap-courses.xml',
  'https://tinystepslearning.com/privacy-policy',
  'https://tinystepslearning.com/privacy',
  'https://tinystepslearning.com/terms',
  'https://tinystepslearning.com/terms/',
  'https://tinystepslearning.com/online-english-classes-for-kids-india',
  'https://tinystepslearning.com/signup',
  'https://tinystepslearning.com/courses/phonics-foundations',
  'https://tinystepslearning.com/courses/basic-grammar',
  'https://tinystepslearning.com/courses/advanced-grammar',
  'https://tinystepslearning.com/courses/basic-public-speaking',
  'https://tinystepslearning.com/courses/advanced-public-speaking',
];

const REQUIRED_REDIRECTS = [
  ['/terms', '/terms-and-conditions'],
  ['/terms/', '/terms-and-conditions'],
  ['/online-english-classes-for-kids-india', '/online-english-classes-for-kids'],
  ['/courses/phonics-foundations', '/courses/phonics-foundation'],
  ['/courses/basic-grammar', '/courses/grammar'],
  ['/courses/advanced-grammar', '/courses/grammar-mastery'],
  ['/courses/basic-public-speaking', '/courses/public-speaking-foundations'],
  ['/courses/advanced-public-speaking', '/courses/public-speaking-excellence'],
  ['/main/resources', '/blog'],
  ['/blog/week8.html', '/blog/week-8-grammar-tenses'],
];

let hasError = false;

function ok(message) {
  console.log(`OK: ${message}`);
}

function fail(message) {
  hasError = true;
  console.error(`ERROR: ${message}`);
}

function extractLocs(xml) {
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1].trim());
}

async function main() {
  const sitemapNames = [
    'sitemap-static.xml',
    'sitemap-blog.xml',
    'sitemap-courses.xml',
    'sitemap-parents.xml',
  ];

  const locList = [];
  const locs = new Set();
  for (const sitemapName of sitemapNames) {
    const xml = await fs.readFile(path.join(PUBLIC_DIR, sitemapName), 'utf8');
    for (const loc of extractLocs(xml)) {
      locList.push(loc);
      locs.add(loc);
    }
  }

  for (const url of REQUIRED_CANONICAL_URLS) {
    const count = locList.filter((loc) => loc === url).length;
    if (count === 0) fail(`Missing required canonical sitemap URL: ${url}`);
    else if (count !== 1) fail(`Canonical sitemap URL must appear exactly once: ${url} (found ${count})`);
    else ok(`Required canonical sitemap URL present exactly once: ${url}`);
  }

  for (const url of FORBIDDEN_SITEMAP_URLS) {
    if (locs.has(url)) fail(`Forbidden URL leaked into sitemap: ${url}`);
    else ok(`Forbidden URL absent from sitemap: ${url}`);
  }

  for (const url of locs) {
    try {
      const pathname = new URL(url).pathname;
      if (pathname.startsWith('/main/')) fail(`Legacy /main URL leaked into sitemap: ${url}`);
    } catch {
      fail(`Invalid sitemap URL: ${url}`);
    }
  }

  const firebase = JSON.parse(await fs.readFile(FIREBASE_JSON, 'utf8'));
  const redirects = firebase?.hosting?.redirects ?? [];

  for (const [source, destination] of REQUIRED_REDIRECTS) {
    const match = redirects.find((entry) => entry.source === source && entry.destination === destination && entry.type === 301);
    if (!match) fail(`Missing required redirect: ${source} -> ${destination}`);
    else ok(`Required redirect present: ${source} -> ${destination}`);
  }

  const redirectSources = new Set(
    redirects
      .filter((entry) => typeof entry.source === 'string')
      .map((entry) => `https://tinystepslearning.com${entry.source}`),
  );

  for (const url of locs) {
    if (redirectSources.has(url)) fail(`Redirect source should not appear in sitemap: ${url}`);
  }

  if (hasError) process.exit(1);
  console.log('SEO indexation guard passed.');
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
});
