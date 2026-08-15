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
const VITE_CONFIG = path.join(ROOT, 'vite.config.ts');
const DIST = path.join(ROOT, 'dist');
const CHECK_DIST = process.argv.includes('--dist');
const failures = [];

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

function hasSlug(slug) {
  return walk(POSTS_DIR, (file) => file.endsWith('.ts')).some((file) => {
    const text = fs.readFileSync(file, 'utf8');
    return text.includes(`slug: '${slug}'`) || text.includes(`slug: \"${slug}\"`);
  });
}

const redirectText = fs.existsSync(NOT_FOUND) ? fs.readFileSync(NOT_FOUND, 'utf8') : '';
const viteText = fs.existsSync(VITE_CONFIG) ? fs.readFileSync(VITE_CONFIG, 'utf8') : '';
if (!viteText.includes('canonicalInternalBlogLinks')) {
  failures.push('vite.config.ts is missing the canonical internal-blog-link rewrite plugin');
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
  `PASS: blog consolidation (${Object.keys(RETIRED_BLOG_PATH_REDIRECTS).length} retired intents, canonical sitemap/RSS ownership${CHECK_DIST ? ', rendered output clean' : ''})`,
);
