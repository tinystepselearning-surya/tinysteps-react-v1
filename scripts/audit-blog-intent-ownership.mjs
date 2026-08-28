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

const GSC_EVIDENCE_SOURCE = 'user-shared-gsc-2026-08-28';
const REQUIRED_GSC_PROTECTED_INSTITUTIONAL_SLUGS = Object.freeze([
  'does-cbse-include-phonics-ncf-foundational-literacy',
  'phonics-scope-and-sequence-for-cbse-schools',
  'international-phonics-benchmarks-for-indian-schools',
  'phonics-teacher-training-for-schools-implementation',
]);

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
const retiredMembership = new Map();

for (const cluster of BLOG_INTENT_CLUSTERS) {
  if (
    !cluster.id ||
    !cluster.audience ||
    !cluster.queryIntent ||
    !cluster.action ||
    !Array.isArray(cluster.slugs) ||
    cluster.slugs.length === 0
  ) {
    failures.push(`Malformed cluster: ${cluster.id || '<missing id>'}`);
    continue;
  }

  if (cluster.provisionalCanonical && !cluster.slugs.includes(cluster.provisionalCanonical)) {
    failures.push(`${cluster.id}: provisional canonical is not part of its current slug set`);
  }

  if (cluster.action === 'merge-review') {
    if (!cluster.requiresPerformanceValidation) {
      failures.push(`${cluster.id}: merge-review must require performance validation`);
    }
    if (cluster.provisionalCanonical) {
      failures.push(
        `${cluster.id}: unresolved merge-review must not name a provisional canonical before page/query evidence selects a winner`,
      );
    }
  }

  if (cluster.action === 'protect-existing-consolidation') {
    if (!cluster.provisionalCanonical) {
      failures.push(`${cluster.id}: protected consolidation must name its current owner`);
    }
    if (!Array.isArray(cluster.retiredSlugs) || cluster.retiredSlugs.length === 0) {
      failures.push(`${cluster.id}: protected consolidation must record at least one retired source slug`);
    }
  }

  if (cluster.action === 'protect-gsc-visible-owner') {
    if (!cluster.evidence?.observedInGsc || cluster.evidence?.source !== GSC_EVIDENCE_SOURCE) {
      failures.push(`${cluster.id}: GSC-visible owner must carry the user-shared GSC evidence marker`);
    }
    if (!cluster.provisionalCanonical || !cluster.slugs.includes(cluster.provisionalCanonical)) {
      failures.push(`${cluster.id}: GSC-visible owner must name its protected current URL`);
    }
  }

  if (cluster.evidence?.observedInGsc) {
    if (cluster.evidence.source !== GSC_EVIDENCE_SOURCE) {
      failures.push(`${cluster.id}: unexpected GSC evidence source ${cluster.evidence.source}`);
    }
    if (typeof cluster.evidence.metricsCaptured !== 'boolean') {
      failures.push(`${cluster.id}: GSC evidence must explicitly state whether numeric metrics were captured`);
    }
    if (!cluster.evidence.finding || !cluster.evidence.finding.trim()) {
      failures.push(`${cluster.id}: GSC evidence must include a qualitative finding`);
    }
  }

  for (const slug of cluster.slugs) {
    if (!currentSlugs.has(slug)) failures.push(`${cluster.id}: current slug not found in blog registry: ${slug}`);
    if (!membership.has(slug)) membership.set(slug, []);
    membership.get(slug).push(cluster.id);
  }

  for (const retiredSlug of cluster.retiredSlugs ?? []) {
    const redirectOwner = RETIRED_BLOG_SLUG_REDIRECTS[retiredSlug];
    if (!redirectOwner) {
      failures.push(`${cluster.id}: retired slug is not present in consolidation map: ${retiredSlug}`);
      continue;
    }
    if (redirectOwner !== cluster.provisionalCanonical) {
      failures.push(
        `${cluster.id}: retired slug ${retiredSlug} redirects to ${redirectOwner}, not protected owner ${cluster.provisionalCanonical}`,
      );
    }
    if (!retiredMembership.has(retiredSlug)) retiredMembership.set(retiredSlug, []);
    retiredMembership.get(retiredSlug).push(cluster.id);
  }
}

for (const [slug, clusters] of membership) {
  if (clusters.length > 1) {
    failures.push(`${slug} appears in multiple current intent clusters: ${clusters.join(', ')}`);
  }
}

for (const [slug, clusters] of retiredMembership) {
  if (clusters.length > 1) {
    failures.push(`${slug} appears in multiple retired-intent lineages: ${clusters.join(', ')}`);
  }
}

for (const slug of REQUIRED_GSC_PROTECTED_INSTITUTIONAL_SLUGS) {
  const cluster = BLOG_INTENT_CLUSTERS.find((candidate) => candidate.slugs.includes(slug));
  if (!cluster) {
    failures.push(`GSC-visible institutional slug is missing from B2 ownership registry: ${slug}`);
    continue;
  }
  if (cluster.audience !== 'Schools & Research') {
    failures.push(`${slug}: GSC-visible institutional owner must remain Schools & Research`);
  }
  if (cluster.action !== 'protect-gsc-visible-owner') {
    failures.push(`${slug}: GSC-visible institutional owner must be protected from consolidation`);
  }
}

const highRisk = BLOG_INTENT_CLUSTERS.filter((cluster) => cluster.risk === 'high');
const unresolvedHighRisk = highRisk.filter((cluster) => cluster.requiresPerformanceValidation);
const gscVisible = BLOG_INTENT_CLUSTERS.filter((cluster) => cluster.evidence?.observedInGsc);
const gscWithoutRetainedMetrics = gscVisible.filter((cluster) => !cluster.evidence.metricsCaptured);

if (unresolvedHighRisk.length) {
  warnings.push(
    `${unresolvedHighRisk.length} high-risk cluster(s) still require URL/query performance evidence before B3 destructive actions: ${unresolvedHighRisk.map((cluster) => cluster.id).join(', ')}`,
  );
}

if (gscWithoutRetainedMetrics.length) {
  warnings.push(
    `${gscWithoutRetainedMetrics.length} cluster(s) use qualitative user-shared GSC visibility evidence only; no numeric metrics are claimed or used to select a new winner.`,
  );
}

console.log(`[blog-b2] ${BLOG_INTENT_CLUSTERS.length} reviewed intent clusters`);
console.log(`[blog-b2] ${highRisk.length} high-risk clusters; ${unresolvedHighRisk.length} awaiting performance validation`);
console.log(`[blog-b2] ${gscVisible.length} cluster(s) protected by user-shared GSC visibility evidence`);
warnings.forEach((warning) => console.warn(`[blog-b2] WARN: ${warning}`));

if (failures.length) {
  failures.forEach((failure) => console.error(`[blog-b2] FAIL: ${failure}`));
  process.exit(1);
}

console.log('[blog-b2] PASS: intent ownership, redirect lineage and GSC protection rules are internally consistent.');
