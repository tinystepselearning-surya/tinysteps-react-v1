#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { shouldIncludeBlogSlugInSitemap, shouldNoindexBlogSlug } from '../src/lib/blogIndexingPolicy.js';
import { getPublicBlogSlug } from '../src/lib/blogWeekRenames.js';
import { RETIRED_BLOG_SLUG_REDIRECTS } from './blog-consolidation-map.mjs';

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, 'src', 'content', 'blog', 'posts');
const DEFAULTS_FILE = path.join(ROOT, 'src', 'content', 'blog', 'shared', 'defaults.ts');
const SITEMAP_GENERATOR = path.join(ROOT, 'scripts', 'generate-sitemaps.js');
const COMMITTED_SITEMAP = path.join(ROOT, 'public', 'sitemap-blog.xml');
const OUTPUT_DIR = path.join(ROOT, 'artifacts', 'seo', 'blog-b0');
const SITE_ORIGIN = 'https://tinystepslearning.com';
const AUDIT_DATE = process.env.BLOG_AUDIT_DATE || new Date().toISOString().slice(0, 10);
const WRITE_OUTPUT = process.argv.includes('--write');
const STRICT = process.argv.includes('--strict');

function walk(dir, predicate = () => true) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full, predicate));
    else if (predicate(full)) files.push(full);
  }
  return files.sort();
}

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

function extractStringProperty(source, key) {
  const match = source.match(new RegExp(`\\b${key}\\s*:\\s*(['\"\\x60])([\\s\\S]*?)\\1`));
  return match ? match[2].replace(/\\n/g, ' ').trim() : null;
}

function extractObjectStringMap(source, constName) {
  const start = source.indexOf(`const ${constName}`);
  if (start < 0) return new Map();
  const open = source.indexOf('{', start);
  if (open < 0) return new Map();

  let depth = 0;
  let close = -1;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) {
        close = i;
        break;
      }
    }
  }
  if (close < 0) return new Map();

  const body = source.slice(open + 1, close);
  const map = new Map();
  const pair = /['\"]([^'\"]+)['\"]\s*:\s*['\"]([^'\"]+)['\"]/g;
  let match;
  while ((match = pair.exec(body))) map.set(match[1], match[2]);
  return map;
}

function extractStringSet(source, constName) {
  const match = source.match(new RegExp(`const\\s+${constName}\\s*=\\s*new\\s+Set\\s*\\(\\s*\\[([\\s\\S]*?)\\]\\s*\\)`));
  if (!match) return new Set();
  return new Set(Array.from(match[1].matchAll(/['\"]([^'\"]+)['\"]/g), (item) => item[1]));
}

function extractContentStrings(source) {
  const values = [];
  const pattern = /\bcontent\s*:\s*(['\"`])([\s\S]*?)\1/g;
  let match;
  while ((match = pattern.exec(source))) values.push(match[2]);
  return values;
}

function countWords(values) {
  return values
    .join(' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function extractLinks(source) {
  const raw = Array.from(source.matchAll(/(?:https?:\/\/[^\s'\"`)>]+|\/(?:blog|parents|phonics|grammar|speaking|book-demo|courses|curriculum|for-schools)(?:\/[^\s'\"`)>]*)?)/g), (m) => m[0]);
  return uniqueSorted(raw);
}

function inferAudience(post) {
  const haystack = `${post.title || ''} ${post.excerpt || ''} ${post.category || ''}`.toLowerCase();
  const schoolSignal = /(cbse|ncf|school leaders?|schools? can|teacher training|classroom implementation|school programme)/.test(haystack);
  const parentSignal = /(parent|my child|your child|at home|kids?)/.test(haystack);
  if (schoolSignal && parentSignal) return 'mixed';
  if (schoolSignal) return 'school_or_educator';
  if (post.category === 'Research' && !parentSignal) return 'school_or_educator';
  return 'parent';
}

function inferIntentCluster(post) {
  const text = `${post.slug} ${post.title}`.toLowerCase();
  const rules = [
    ['letter-sounds-cannot-read', /(cannot-read|cannot read|letter-sounds.*read|abc.*read)/],
    ['phonics-start-age', /(age.*phonics|start-phonics)/],
    ['phonics-blending', /blend/],
    ['reading-fluency', /fluency/],
    ['reading-confidence', /reading-confidence/],
    ['phonics-class-selection', /(choose-phonics|online-phonics-classes|best-phonics-classes)/],
    ['phonics-vs-sight-words', /(sight-words|traditional-reading|science-of-phonics)/],
    ['one-word-answers', /(one-word|one word)/],
    ['sentence-formation', /(sentence-formation|sentence formation)/],
    ['english-speaking-confidence', /(understands-english|spoken-english|speaking-confidence)/],
    ['long-vowels', /long-vowel/],
    ['r-controlled-vowels', /r-controlled/],
    ['school-phonics-research', /(cbse|ncf|schools|teacher-training|systematic-cumulative)/],
  ];
  return rules.find(([, pattern]) => pattern.test(text))?.[0] || 'review-required';
}

function toCsv(rows) {
  if (!rows.length) return '';
  const columns = [
    'slug', 'url', 'title', 'category', 'audience', 'date', 'author', 'readTime',
    'wordCountApprox', 'bodyBlocks', 'faqCount', 'hasHero', 'hasMetaDescription',
    'weekly', 'pageNoindex', 'indexableByPageRobots', 'expectedInSitemap',
    'presentInCommittedSitemap', 'retiredSource', 'sitemapPolicyMismatch',
    'intentClusterHint', 'templateArtifacts', 'sourcePath',
  ];
  const escape = (value) => {
    const text = Array.isArray(value) ? value.join(' | ') : String(value ?? '');
    return /[\n,\"]/.test(text) ? `\"${text.replace(/\"/g, '\"\"')}\"` : text;
  };
  return [columns.join(','), ...rows.map((row) => columns.map((column) => escape(row[column])).join(','))].join('\n') + '\n';
}

const defaultsSource = read(DEFAULTS_FILE);
const publicationDates = extractObjectStringMap(defaultsSource, 'BLOG_PUBLICATION_DATES');
const categoryOverrides = extractObjectStringMap(defaultsSource, 'BLOG_CATEGORY_OVERRIDES');
const sitemapGeneratorSource = read(SITEMAP_GENERATOR);
const explicitlyExcludedFromSitemap = extractStringSet(sitemapGeneratorSource, 'EXCLUDED_BLOG_SLUGS');
const committedSitemapSource = read(COMMITTED_SITEMAP);
const committedSitemapSlugs = new Set(
  Array.from(committedSitemapSource.matchAll(/<loc>https:\/\/tinystepslearning\.com\/blog\/([^<]+)<\/loc>/g), (m) => m[1]),
);

const files = walk(POSTS_DIR, (file) => file.endsWith('.ts'));
const rows = files.map((file) => {
  const source = read(file);
  const sourceSlug = extractStringProperty(source, 'slug');
  if (!sourceSlug) return null;
  const slug = getPublicBlogSlug(sourceSlug);

  const sourceCategory = extractStringProperty(source, 'category');
  const sourceDate = extractStringProperty(source, 'date');
  const effectiveDate = publicationDates.get(sourceSlug) || publicationDates.get(slug) || sourceDate;
  const effectiveCategory = categoryOverrides.get(sourceSlug) || categoryOverrides.get(slug) || sourceCategory;
  const title = extractStringProperty(source, 'title');
  const excerpt = extractStringProperty(source, 'excerpt');
  const author = extractStringProperty(source, 'author');
  const readTime = extractStringProperty(source, 'readTime');
  const hero = extractStringProperty(source, 'hero');
  const metaDescription = extractStringProperty(source, 'metaDescription');
  const contentStrings = extractContentStrings(source);
  const bodyBlocks = (source.match(/\{\s*type\s*:\s*['\"](?:h2|h3|p|li)['\"]/g) || []).length;
  const faqCount = (source.match(/\bquestion\s*:\s*['\"`]/g) || []).length;
  const weekly = /^week-\d+/i.test(sourceSlug);
  const pageNoindex = shouldNoindexBlogSlug(slug);
  const retiredSource = Object.hasOwn(RETIRED_BLOG_SLUG_REDIRECTS, sourceSlug)
    || Object.hasOwn(RETIRED_BLOG_SLUG_REDIRECTS, slug);
  const published = !effectiveDate || effectiveDate <= AUDIT_DATE;
  const indexableByPageRobots = published && !pageNoindex && !retiredSource;
  const expectedInSitemap = published
    && !retiredSource
    && !explicitlyExcludedFromSitemap.has(slug)
    && shouldIncludeBlogSlugInSitemap(slug);
  const presentInCommittedSitemap = committedSitemapSlugs.has(slug);
  const links = extractLinks(source);
  const artifacts = [
    /FAQ section with \d+ parent questions/i.test(source) ? 'template-faq-heading' : null,
    /\/\?book=1/.test(source) ? 'raw-book-query-path' : null,
    /Explore\s+[^'\"`]+:\s*\/(?:grammar|phonics|speaking|parents|courses)/i.test(source) ? 'raw-route-copy' : null,
  ].filter(Boolean);

  const base = {
    slug,
    url: `${SITE_ORIGIN}/blog/${slug}`,
    title,
    category: effectiveCategory,
    date: effectiveDate,
    author,
    readTime,
    excerpt,
  };

  return {
    ...base,
    sourceSlug,
    sourceCategory,
    sourceDate,
    audience: inferAudience(base),
    intentClusterHint: inferIntentCluster(base),
    wordCountApprox: countWords(contentStrings),
    bodyBlocks,
    faqCount,
    hasHero: Boolean(hero),
    hero,
    hasMetaDescription: Boolean(metaDescription),
    metaDescription,
    internalLinks: links.filter((link) => link.startsWith('/')),
    externalReferences: links.filter((link) => link.startsWith('http')),
    weekly,
    pageNoindex,
    published,
    indexableByPageRobots,
    explicitlyExcludedFromSitemap: explicitlyExcludedFromSitemap.has(slug),
    expectedInSitemap,
    presentInCommittedSitemap,
    retiredSource,
    sitemapPolicyMismatch: indexableByPageRobots !== expectedInSitemap,
    templateArtifacts: artifacts,
    sourcePath: path.relative(ROOT, file),
    sourceSizeBytes: fs.statSync(file).size,
  };
}).filter(Boolean).sort((a, b) => a.slug.localeCompare(b.slug));

const slugCounts = new Map();
for (const row of rows) slugCounts.set(row.slug, (slugCounts.get(row.slug) || 0) + 1);
const duplicateSlugs = [...slugCounts.entries()].filter(([, count]) => count > 1).map(([slug, count]) => ({ slug, count }));
const expectedSitemapSlugs = new Set(rows.filter((row) => row.expectedInSitemap).map((row) => row.slug));
const missingExpectedFromCommittedSitemap = [...expectedSitemapSlugs].filter((slug) => !committedSitemapSlugs.has(slug)).sort();
const unexpectedCommittedSitemapSlugs = [...committedSitemapSlugs].filter((slug) => !expectedSitemapSlugs.has(slug)).sort();
const retiredSlugsInCommittedSitemap = unexpectedCommittedSitemapSlugs.filter((slug) => Object.hasOwn(RETIRED_BLOG_SLUG_REDIRECTS, slug));

function countBy(key) {
  return Object.fromEntries(
    [...rows.reduce((map, row) => map.set(row[key] ?? 'unknown', (map.get(row[key] ?? 'unknown') || 0) + 1), new Map()).entries()]
      .sort(([a], [b]) => String(a).localeCompare(String(b))),
  );
}

const summary = {
  auditDate: AUDIT_DATE,
  sourcePostFiles: files.length,
  routedPostSlugs: rows.length,
  duplicateSlugs: duplicateSlugs.length,
  publishedPosts: rows.filter((row) => row.published).length,
  weeklyPosts: rows.filter((row) => row.weekly).length,
  pageNoindexPosts: rows.filter((row) => row.pageNoindex).length,
  indexableByPageRobots: rows.filter((row) => row.indexableByPageRobots).length,
  expectedGeneratedSitemapPosts: rows.filter((row) => row.expectedInSitemap).length,
  pageIndexableButSitemapExcluded: rows.filter((row) => row.sitemapPolicyMismatch && row.indexableByPageRobots).map((row) => row.slug),
  retiredRedirectSources: Object.keys(RETIRED_BLOG_SLUG_REDIRECTS).length,
  committedSitemapBlogUrls: committedSitemapSlugs.size,
  missingExpectedFromCommittedSitemap,
  unexpectedCommittedSitemapSlugs,
  retiredSlugsInCommittedSitemap,
  categoryCounts: countBy('category'),
  audienceCounts: countBy('audience'),
  templateArtifactPosts: rows.filter((row) => row.templateArtifacts.length > 0).map((row) => ({ slug: row.slug, artifacts: row.templateArtifacts })),
};

const result = {
  generatedAt: new Date().toISOString(),
  methodology: {
    sourceRegistry: 'src/content/blog/posts/**/*.ts loaded by src/content/blog/index.ts via import.meta.glob',
    indexingPolicy: 'src/lib/blogIndexingPolicy.js',
    sitemapPolicy: 'scripts/generate-sitemaps.js',
    retiredRedirectPolicy: 'scripts/blog-consolidation-map.mjs',
    note: 'Search Console/GA4 metrics are intentionally not inferred. Enrich this inventory with exported performance data before destructive SEO decisions.',
  },
  summary,
  posts: rows,
};

console.log('[blog-b0] baseline inventory');
console.log(JSON.stringify(summary, null, 2));

if (WRITE_OUTPUT) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'blog-inventory.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'blog-inventory.csv'), toCsv(rows), 'utf8');
  console.log(`[blog-b0] wrote ${path.relative(ROOT, OUTPUT_DIR)}/blog-inventory.{json,csv}`);
}

const structuralFailures = [];
if (rows.length === 0) structuralFailures.push('No blog posts were discovered.');
if (duplicateSlugs.length > 0) structuralFailures.push(`Duplicate slugs: ${duplicateSlugs.map((item) => item.slug).join(', ')}`);
const retiredSourceFiles = rows.filter((row) => row.retiredSource).map((row) => row.sourceSlug);
if (retiredSourceFiles.length > 0) structuralFailures.push(`Retired redirect sources still exist as posts: ${retiredSourceFiles.join(', ')}`);

if (STRICT && structuralFailures.length > 0) {
  structuralFailures.forEach((failure) => console.error(`[blog-b0] FAIL: ${failure}`));
  process.exit(1);
}

if (structuralFailures.length > 0) {
  structuralFailures.forEach((failure) => console.warn(`[blog-b0] WARN: ${failure}`));
} else {
  console.log('[blog-b0] PASS: registry structure is internally consistent.');
}
