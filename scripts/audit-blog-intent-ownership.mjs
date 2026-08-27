#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { BLOG_INTENT_CLUSTERS } from './blog-intent-clusters.mjs';
import { RETIRED_BLOG_SLUG_REDIRECTS } from './blog-consolidation-map.mjs';

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, 'src/content/blog/posts');
const failures = [];
const warnings = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : entry.isFile() && entry.name.endsWith('.ts') ? [full] : [];
  });
}

const currentSlugs = new Set();
for (const file of walk(POSTS_DIR)) {
  const source = fs.readFileSync(file, 'utf8');
  const match = source.match(/\bslug\s*:\s*['\"`]([^'\"`]+)['\"`]/);
  if (match) currentSlugs.add(match[1]);
}

const membership = new Map();
for (const cluster of BLOG_INTENT_CLUSTERS) {
  if (!cluster.id || !cluster.queryIntent || !cluster.action || !Array.isArray(cluster.slugs) || cluster.slugs.length === 0) {
    failures.push(`Malformed cluster: ${cluster.id || '<missing id>'}`);
    continue;
  }

  if (cluster.provisionalCanonical && !cluster.slugs.includes(cluster.provisionalCanonical)) {
    failures.push(`${cluster.id}: provisional canonical is not part of its slug set`);
  }

  if (cluster.action === 'merge-review' && !cluster.requiresPerformanceValidation) {
    failures.push(`${cluster.id}: merge-review must require performance validation`);
  }

  for (const slug of cluster.slugs) {
    const exists = currentSlugs.has(slug);
    const retired = Object.hasOwn(RETIRED_BLOG_SLUG_REDIRECTS, slug);
    if (!exists && !retired) failures.push(`${cluster.id}: unknown slug ${slug}`);
    if (!membership.has(slug)) membership.set(slug, []);
    membership.get(slug).push(cluster.id);
  }
}

for (const [slug, clusters] of membership) {
  if (clusters.length > 1) {
    // Cross-audience ownership can be deliberate, but current registry intentionally
    // keeps each reviewed slug in one cluster to make merge decisions unambiguous.
    failures.push(`${slug} appears in multiple intent clusters: ${clusters.join(', ')}`);
  }
}

const highRisk = BLOG_INTENT_CLUSTERS.filter((cluster) => cluster.risk === 'high');
const unresolvedHighRisk = highRisk.filter((cluster) => cluster.requiresPerformanceValidation);
if (unresolvedHighRisk.length) {
  warnings.push(
    `${unresolvedHighRisk.length} high-risk cluster(s) require GSC/analytics evidence before B3 redirects: ${unresolvedHighRisk.map((cluster) => cluster.id).join(', ')}`,
  );
}

console.log(`[blog-b2] ${BLOG_INTENT_CLUSTERS.length} reviewed intent clusters`);
console.log(`[blog-b2] ${highRisk.length} high-risk clusters; ${unresolvedHighRisk.length} awaiting performance validation`);
warnings.forEach((warning) => console.warn(`[blog-b2] WARN: ${warning}`));

if (failures.length) {
  failures.forEach((failure) => console.error(`[blog-b2] FAIL: ${failure}`));
  process.exit(1);
}

console.log('[blog-b2] PASS: intent ownership registry is internally consistent.');
