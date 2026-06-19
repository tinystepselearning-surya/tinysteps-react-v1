import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROUTE_SEO_REGISTRY } from '../src/lib/routeSeoRegistry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const SITE_TITLE = 'Tiny Steps Learning';
const SITE_DESCRIPTION =
  'Premium online English learning for children, with structured phonics, grammar, reading, sentence formation, and public speaking programs.';
const SITE_URL = 'https://tinystepslearning.com';

const REQUIRED_URLS = [
  'https://tinystepslearning.com/',
  'https://tinystepslearning.com/phonics',
  'https://tinystepslearning.com/grammar',
  'https://tinystepslearning.com/speaking',
  'https://tinystepslearning.com/courses',
  'https://tinystepslearning.com/curriculum',
  'https://tinystepslearning.com/pricing',
  'https://tinystepslearning.com/why-tiny-steps',
  'https://tinystepslearning.com/contact',
  'https://tinystepslearning.com/blog',
  'https://tinystepslearning.com/blog/best-phonics-classes-for-kids',
  'https://tinystepslearning.com/blog/best-online-phonics-classes-for-kids',
  'https://tinystepslearning.com/blog/how-to-choose-phonics-classes',
  'https://tinystepslearning.com/blog/child-knows-abc-but-cannot-read',
  'https://tinystepslearning.com/best-online-phonics-classes-for-kids-in-india',
  'https://tinystepslearning.com/online-english-classes-for-kids-india',
  'https://tinystepslearning.com/reading-classes-for-kids',
  'https://tinystepslearning.com/writing-classes-for-kids',
];

const EXCLUDED_BLOG_SLUGS = new Set([
  'spoken-english-classes-for-kids-confidence',
]);

const BLOG_SLUG_PATH = path.join(ROOT_DIR, 'src/content/blog/posts');
const BLOG_DEFAULTS_PATH = path.join(ROOT_DIR, 'src/content/blog/shared/defaults.ts');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const PUBLIC_BLOG_DIR = path.join(PUBLIC_DIR, 'blog');

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function normalizeText(value) {
  return String(value || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function fromSingleQuotedJs(value) {
  return value
    .replace(/\\\\/g, '\\')
    .replace(/\\'/g, "'")
    .replace(/\\n/g, ' ')
    .replace(/\\r/g, ' ')
    .replace(/\\t/g, ' ');
}

function toCanonicalAbsoluteUrl(inputPath) {
  const url = inputPath.startsWith('http://') || inputPath.startsWith('https://')
    ? new URL(inputPath)
    : new URL(inputPath === '/' ? '/' : inputPath.replace(/\/+$/, ''), SITE_URL);

  if (url.pathname !== '/' && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
  }

  if (url.origin !== SITE_URL) {
    return `${SITE_URL}${url.pathname === '/' ? '/' : url.pathname}`;
  }

  return `${SITE_URL}${url.pathname === '/' ? '/' : url.pathname}`;
}

function toRoutePath(absoluteUrl) {
  const url = new URL(absoluteUrl);
  return url.pathname === '/' ? '/' : url.pathname.replace(/\/+$/, '');
}

function parsePublicationDateMap(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const map = new Map();
  const matcher = /'([^']+)':\s*'(\d{4}-\d{2}-\d{2})'/g;
  let match = matcher.exec(content);
  while (match) {
    map.set(match[1], match[2]);
    match = matcher.exec(content);
  }
  return map;
}

function walkFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath));
      continue;
    }
    if (entry.isFile() && fullPath.endsWith('.ts')) {
      results.push(fullPath);
    }
  }
  return results;
}

function extractSingleQuotedField(content, fieldName) {
  const regex = new RegExp(`${fieldName}:\\s*'((?:\\\\'|\\\\\\\\|[^'])*)'`, 's');
  const match = regex.exec(content);
  return match ? normalizeText(fromSingleQuotedJs(match[1])) : '';
}

function parseBlogItemsFromSource() {
  const publicationDates = parsePublicationDateMap(BLOG_DEFAULTS_PATH);
  const itemsByUrl = new Map();
  const todayIso = new Date().toISOString().slice(0, 10);
  const postFiles = walkFiles(BLOG_SLUG_PATH);

  for (const postFile of postFiles) {
    const content = fs.readFileSync(postFile, 'utf8');
    const slug = extractSingleQuotedField(content, 'slug');
    const title = extractSingleQuotedField(content, 'title');

    if (!slug || !title) continue;
    if (EXCLUDED_BLOG_SLUGS.has(slug)) continue;

    const dateFromPost = extractSingleQuotedField(content, 'date');
    const date = dateFromPost || publicationDates.get(slug) || '';
    if (date && date > todayIso) continue;

    const excerpt = extractSingleQuotedField(content, 'excerpt');
    const metaDescription = extractSingleQuotedField(content, 'metaDescription');
    const quickAnswer = extractSingleQuotedField(content, 'quickAnswer');
    const description = metaDescription || excerpt || quickAnswer || SITE_DESCRIPTION;

    const url = toCanonicalAbsoluteUrl(`/blog/${slug}`);
    itemsByUrl.set(url, {
      title,
      description,
      link: url,
      pubDate: date ? new Date(`${date}T00:00:00Z`).toUTCString() : undefined,
      sortDate: date || '1970-01-01',
    });
  }

  return [...itemsByUrl.values()].sort((a, b) => b.sortDate.localeCompare(a.sortDate));
}

function isNoIndexRoute(config) {
  if (!config) return false;
  return /noindex/i.test(config.robots || '');
}

function fallbackTitleFromPath(routePath) {
  if (routePath === '/') return SITE_TITLE;
  const cleaned = routePath.replace(/^\//, '').split('/').pop() || '';
  return cleaned
    .split('-')
    .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1)}` : part))
    .join(' ');
}

function buildItemForUrl(absoluteUrl, blogItemMap) {
  const routePath = toRoutePath(absoluteUrl);

  if (routePath.startsWith('/blog/') && blogItemMap.has(absoluteUrl)) {
    return blogItemMap.get(absoluteUrl);
  }

  const routeMeta = ROUTE_SEO_REGISTRY[routePath];
  return {
    title: normalizeText(routeMeta?.title || fallbackTitleFromPath(routePath)),
    description: normalizeText(routeMeta?.description || SITE_DESCRIPTION),
    link: absoluteUrl,
    pubDate: undefined,
  };
}

function mergeUniqueItems(items) {
  const map = new Map();
  for (const item of items) {
    if (!item || !item.link) continue;
    if (map.has(item.link)) continue;
    map.set(item.link, {
      title: normalizeText(item.title || SITE_TITLE),
      description: normalizeText(item.description || SITE_DESCRIPTION),
      link: toCanonicalAbsoluteUrl(item.link),
      pubDate: item.pubDate,
    });
  }
  return [...map.values()];
}

function buildRssXml({ title, description, feedPath, items }) {
  const feedLink = toCanonicalAbsoluteUrl(feedPath);
  const lastBuildDate = new Date().toUTCString();
  const itemXml = items
    .map((item) => {
      const parts = [
        '    <item>',
        `      <title>${escapeXml(item.title)}</title>`,
        `      <link>${escapeXml(item.link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(item.link)}</guid>`,
        `      <description>${escapeXml(item.description)}</description>`,
      ];
      if (item.pubDate) parts.push(`      <pubDate>${escapeXml(item.pubDate)}</pubDate>`);
      parts.push('    </item>');
      return parts.join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(title)}</title>`,
    `    <description>${escapeXml(description)}</description>`,
    `    <link>${escapeXml(SITE_URL)}</link>`,
    `    <atom:link href="${escapeXml(feedLink)}" rel="self" type="application/rss+xml" />`,
    '    <language>en-us</language>',
    `    <lastBuildDate>${escapeXml(lastBuildDate)}</lastBuildDate>`,
    itemXml,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}

function writeFile(targetPath, content) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, content, 'utf8');
}

function main() {
  const blogItems = parseBlogItemsFromSource();
  const blogItemMap = new Map(blogItems.map((item) => [item.link, item]));
  const requiredItems = REQUIRED_URLS.map((url) => buildItemForUrl(url, blogItemMap));

  const publicRouteItems = Object.entries(ROUTE_SEO_REGISTRY)
    .filter(([, config]) => !isNoIndexRoute(config))
    .map(([routePath, config]) => {
      const canonicalPath = config?.canonicalPath || routePath;
      return {
        title: normalizeText(config?.title || fallbackTitleFromPath(canonicalPath)),
        description: normalizeText(config?.description || SITE_DESCRIPTION),
        link: toCanonicalAbsoluteUrl(canonicalPath),
      };
    });

  const siteFeedItems = mergeUniqueItems([...requiredItems, ...publicRouteItems, ...blogItems]);
  const blogFeedItems = mergeUniqueItems([
    buildItemForUrl('https://tinystepslearning.com/blog', blogItemMap),
    ...blogItems,
    ...requiredItems.filter((item) => item.link.startsWith('https://tinystepslearning.com/blog/')),
  ]);

  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.mkdirSync(PUBLIC_BLOG_DIR, { recursive: true });

  const siteRssXml = buildRssXml({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    feedPath: '/rss.xml',
    items: siteFeedItems,
  });
  const siteFeedXml = buildRssXml({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    feedPath: '/feed.xml',
    items: siteFeedItems,
  });
  const blogRssXml = buildRssXml({
    title: `${SITE_TITLE} Blog`,
    description: 'Latest Tiny Steps Learning blog posts on phonics, grammar, reading, and speaking.',
    feedPath: '/blog/rss.xml',
    items: blogFeedItems,
  });
  const blogFeedXml = buildRssXml({
    title: `${SITE_TITLE} Blog`,
    description: 'Latest Tiny Steps Learning blog posts on phonics, grammar, reading, and speaking.',
    feedPath: '/blog/feed.xml',
    items: blogFeedItems,
  });

  writeFile(path.join(PUBLIC_DIR, 'rss.xml'), siteRssXml);
  writeFile(path.join(PUBLIC_DIR, 'feed.xml'), siteFeedXml);
  writeFile(path.join(PUBLIC_BLOG_DIR, 'rss.xml'), blogRssXml);
  writeFile(path.join(PUBLIC_BLOG_DIR, 'feed.xml'), blogFeedXml);

  console.log('Generated RSS feeds:');
  console.log('- public/rss.xml');
  console.log('- public/feed.xml');
  console.log('- public/blog/rss.xml');
  console.log('- public/blog/feed.xml');
}

main();
