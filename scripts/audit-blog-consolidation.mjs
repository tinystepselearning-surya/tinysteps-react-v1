#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { RETIRED_BLOG_PATH_REDIRECTS } from './blog-consolidation-map.mjs';

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, 'src/content/blog/posts');
const SITEMAP = path.join(ROOT, 'public/sitemap-blog.xml');
const RSS_FILES = [
  path.join(ROOT, 'public/rss.xml'),
  path.join(ROOT, 'public/feed.xml'),
  path.join(ROOT, 'public/blog/rss.xml'),
  path.join(ROOT, 'public/blog/feed.xml'),
];
const NOT_FOUND = path.join(ROOT, 'functions/src/notFoundRoute.ts');
const FIREBASE_CONFIG = path.join(ROOT, 'firebase.json');
const INDEXING_POLICY = path.join(ROOT, 'src/lib/blogIndexingPolicy.js');
const VITE_CONFIG = ['vite.config.js', 'vite.config.ts', 'vite.config.jsx', 'vite.config.tsx']
  .map((name) => path.join(ROOT, name))
  .find((candidate) => fs.existsSync(candidate));
const DIST = path.join(ROOT, 'dist');
const CHECK_DIST = process.argv.includes('--dist');
const failures = [];

const AUTHORITY_CANONICAL_SLUGS = [
  'why-child-knows-letter-sounds-but-cannot-read-words',
  'can-child-improve-english-in-10-days',
  'child-gives-one-word-answers',
  'how-long-does-phonics-take',
  'how-to-choose-phonics-classes',
  'how-phonics-grammar-and-communication-work-together',
  'how-to-engage-kids-in-english-learning-at-home',
  'what-age-to-start-phonics',
];
const MIN_AUTHORITY_BODY_BLOCKS = 18;

const READING_CONFIDENCE_OWNER = 'how-phonics-builds-reading-confidence';
const READING_CONFIDENCE_RETIRED = 'how-tiny-steps-builds-reading-confidence';
const READING_CONFIDENCE_REQUIRED_SIGNALS = [
  'mirror the teacher’s correction language at home',
  'weekly teacher or parent progress notes',
  'explicit stage placement',
  'parent-visible method Tiny Steps aims to use',
  'temporary level adjustment and focused revision cycle',
];

const SPOKEN_ENGLISH_REDIRECT = {
  source: '/blog/spoken-english-classes-for-kids-confidence',
  destination: '/blog/child-understands-english-but-does-not-speak',
};

function walk(dir, predicate = () => true) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full, predicate));
    else if (predicate(full)) files.push(full);
  }
  return files;
}

function findPostBySlug(slug) {
  for (const file of walk(POSTS_DIR, (candidate) => candidate.endsWith('.ts'))) {
    const text = fs.readFileSync(file, 'utf8');
    if (text.includes(`slug: '${slug}'`) || text.includes(`slug: \"${slug}\"`)) {
      return { file, text };
    }
  }
  return null;
}

function hasSlug(slug) {
  return Boolean(findPostBySlug(slug));
}

const redirectText = fs.existsSync(NOT_FOUND) ? fs.readFileSync(NOT_FOUND, 'utf8') : '';
const viteText = VITE_CONFIG ? fs.readFileSync(VITE_CONFIG, 'utf8') : '';
const indexingPolicyText = fs.existsSync(INDEXING_POLICY) ? fs.readFileSync(INDEXING_POLICY, 'utf8') : '';
const firebase = fs.existsSync(FIREBASE_CONFIG) ? JSON.parse(fs.readFileSync(FIREBASE_CONFIG, 'utf8')) : null;

if (!viteText.includes('canonicalInternalBlogLinks')) {
  failures.push('canonical Vite config is missing the internal-blog-link rewrite plugin');
}

for (const [sourcePath, destinationPath] of Object.entries(RETIRED_BLOG_PATH_REDIRECTS)) {
  const sourceSlug = sourcePath.replace('/blog/', '');
  const destinationSlug = destinationPath.replace('/blog/', '');

  if (hasSlug(sourceSlug)) failures.push(`retired source post still exists: ${sourceSlug}`);
  if (!hasSlug(destinationSlug)) failures.push(`canonical destination post missing: ${destinationSlug}`);
  if (!redirectText.includes(`\"${sourcePath}\": \"${destinationPath}\"`)) {
    failures.push(`server 301 mapping missing: ${sourcePath} -> ${destinationPath}`);
  }

  if (fs.existsSync(SITEMAP)) {
    const sitemapText = fs.readFileSync(SITEMAP, 'utf8');
    if (sitemapText.includes(`https://tinystepslearning.com${sourcePath}`)) {
      failures.push(`retired URL leaked into sitemap-blog.xml: ${sourcePath}`);
    }
    if (!sitemapText.includes(`https://tinystepslearning.com${destinationPath}`)) {
      failures.push(`canonical destination missing from sitemap-blog.xml: ${destinationPath}`);
    }
  }

  for (const rssFile of RSS_FILES) {
    if (!fs.existsSync(rssFile)) continue;
    const text = fs.readFileSync(rssFile, 'utf8');
    if (text.includes(`https://tinystepslearning.com${sourcePath}`)) {
      failures.push(`${path.relative(ROOT, rssFile)} still contains retired URL ${sourcePath}`);
    }
  }
}

// The reading-confidence redirect is safe only after the branded article's
// genuinely useful practice details have been preserved in the canonical guide.
const readingConfidenceOwner = findPostBySlug(READING_CONFIDENCE_OWNER);
if (!readingConfidenceOwner) {
  failures.push(`reading-confidence canonical owner missing: ${READING_CONFIDENCE_OWNER}`);
} else {
  for (const signal of READING_CONFIDENCE_REQUIRED_SIGNALS) {
    if (!readingConfidenceOwner.text.includes(signal)) {
      failures.push(`reading-confidence merge lost required source material: ${signal}`);
    }
  }
}
if (hasSlug(READING_CONFIDENCE_RETIRED)) {
  failures.push(`reading-confidence duplicate still exists: ${READING_CONFIDENCE_RETIRED}`);
}
if (
  RETIRED_BLOG_PATH_REDIRECTS[`/blog/${READING_CONFIDENCE_RETIRED}`]
  !== `/blog/${READING_CONFIDENCE_OWNER}`
) {
  failures.push('reading-confidence retired URL is not mapped to the canonical owner');
}

// The speaking-confidence duplicate is already a real Firebase Hosting 301.
// It must not be modelled as a second noindex mechanism in blog page policy.
const spokenRedirect = (firebase?.hosting?.redirects ?? []).find(
  (redirect) => redirect.source === SPOKEN_ENGLISH_REDIRECT.source,
);
if (!spokenRedirect) {
  failures.push(`Firebase Hosting 301 missing: ${SPOKEN_ENGLISH_REDIRECT.source}`);
} else {
  if (spokenRedirect.destination !== SPOKEN_ENGLISH_REDIRECT.destination) {
    failures.push(
      `Firebase speaking redirect points to ${spokenRedirect.destination}, expected ${SPOKEN_ENGLISH_REDIRECT.destination}`,
    );
  }
  if (spokenRedirect.type !== 301) {
    failures.push(`Firebase speaking redirect must be 301, found ${spokenRedirect.type}`);
  }
}
if (indexingPolicyText.includes('spoken-english-classes-for-kids-confidence')) {
  failures.push('speaking redirect source leaked into page-level noindex policy; use the permanent Hosting redirect only');
}

// Protect the existing editorial standard: these canonical intent owners must
// remain full authority BlogPost articles rather than falling back to the old
// compact PhonicsSeoPost template.
for (const slug of AUTHORITY_CANONICAL_SLUGS) {
  const found = findPostBySlug(slug);
  if (!found) {
    failures.push(`authority canonical post missing: ${slug}`);
    continue;
  }
  const { file, text } = found;
  if (!text.includes('const post: BlogPost')) {
    failures.push(`${path.relative(ROOT, file)} must remain a full BlogPost authority article`);
  }
  if (!text.includes('readTime:') || !text.includes('body: [') || !text.includes('faq: [')) {
    failures.push(`${path.relative(ROOT, file)} is missing authority article structure (readTime/body/faq)`);
  }
  const bodyBlockCount = (text.match(/\{\s*type:\s*'[^']+'/g) || []).length;
  if (bodyBlockCount < MIN_AUTHORITY_BODY_BLOCKS) {
    failures.push(`${path.relative(ROOT, file)} is too thin after consolidation (${bodyBlockCount} content blocks; minimum ${MIN_AUTHORITY_BODY_BLOCKS})`);
  }
}

if (CHECK_DIST) {
  if (!fs.existsSync(DIST)) {
    failures.push('dist/ missing for rendered consolidation check');
  } else {
    const renderedFiles = walk(DIST, (file) => /\.(?:html|js)$/i.test(file));
    for (const file of renderedFiles) {
      const text = fs.readFileSync(file, 'utf8');
      for (const sourcePath of Object.keys(RETIRED_BLOG_PATH_REDIRECTS)) {
        if (text.includes(sourcePath)) {
          failures.push(`${path.relative(ROOT, file)} contains retired internal URL ${sourcePath}`);
        }
      }
    }
  }
}

if (failures.length) {
  console.error(`FAIL: blog consolidation audit (${failures.length} issue${failures.length === 1 ? '' : 's'})`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `PASS: blog consolidation (${Object.keys(RETIRED_BLOG_PATH_REDIRECTS).length} retired intents, ${AUTHORITY_CANONICAL_SLUGS.length} protected authority articles, reading-confidence source merged, speaking Hosting 301 protected, canonical sitemap/RSS ownership${CHECK_DIST ? ', rendered output clean' : ''})`,
);
