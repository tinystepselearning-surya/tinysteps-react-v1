#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { BLOG_INTENT_CLUSTERS, UNRESOLVED_BLOG_INTENTS } from './blog-intent-clusters.mjs';
import { RETIRED_BLOG_SLUG_REDIRECTS } from './blog-consolidation-map.mjs';
import { shouldNoindexBlogSlug } from '../src/lib/blogIndexingPolicy.js';

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, 'src/content/blog/posts');
const FIREBASE_FILE = path.join(ROOT, 'firebase.json');
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

function pathForSlug(slug) {
  return `/blog/${slug}`;
}

function validateMetricValue(clusterId, slug, key, value) {
  if (!Number.isInteger(value) || value < 0) {
    failures.push(`${clusterId}: ${slug} has invalid GSC ${key}: ${value}`);
  }
}

const currentSlugs = new Set();
for (const file of walk(POSTS_DIR)) {
  const source = fs.readFileSync(file, 'utf8');
  const match = source.match(/\bslug\s*:\s*['\"`]([^'\"`]+)['\"`]/);
  if (match) currentSlugs.add(match[1]);
}

const firebase = JSON.parse(fs.readFileSync(FIREBASE_FILE, 'utf8'));
const hostingRedirects = new Map(
  (firebase.hosting?.redirects ?? [])
    .filter((redirect) => redirect?.source && redirect?.destination)
    .map((redirect) => [redirect.source, redirect]),
);

const membership = new Map();
const retiredMembership = new Map();
const mergeSourceMembership = new Map();
const allowedActions = new Set([
  'keep-distinct-owner',
  'protect-existing-consolidation',
  'protect-distinct-audience',
  'protect-gsc-visible-owner',
  'differentiate',
  'merge-planned',
  'protect-indexable-owner',
  'protect-hosting-consolidation',
]);

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

  if (!allowedActions.has(cluster.action)) {
    failures.push(`${cluster.id}: unsupported or unresolved action ${cluster.action}`);
  }

  if (cluster.requiresPerformanceValidation) {
    failures.push(`${cluster.id}: B2 final matrix must not retain an unresolved performance-validation gate`);
  }

  if (cluster.canonicalOwner && !cluster.slugs.includes(cluster.canonicalOwner)) {
    failures.push(`${cluster.id}: canonical owner is not part of its current slug set`);
  }

  if (cluster.action === 'differentiate' && cluster.canonicalOwner) {
    failures.push(`${cluster.id}: differentiated multi-owner intent must not force one canonical owner`);
  }

  if (
    ['keep-distinct-owner', 'protect-existing-consolidation', 'protect-distinct-audience', 'protect-gsc-visible-owner', 'merge-planned', 'protect-indexable-owner', 'protect-hosting-consolidation'].includes(cluster.action)
    && !cluster.canonicalOwner
  ) {
    failures.push(`${cluster.id}: ${cluster.action} must name a canonical/current owner`);
  }

  if (cluster.action === 'protect-existing-consolidation') {
    if (!Array.isArray(cluster.retiredSlugs) || cluster.retiredSlugs.length === 0) {
      failures.push(`${cluster.id}: protected consolidation must record at least one retired source slug`);
    }
  }

  if (cluster.action === 'merge-planned') {
    if (!Array.isArray(cluster.mergeSourceSlugs) || cluster.mergeSourceSlugs.length === 0) {
      failures.push(`${cluster.id}: planned merge must record at least one current merge-source slug`);
    }
    for (const slug of cluster.mergeSourceSlugs ?? []) {
      if (slug === cluster.canonicalOwner) {
        failures.push(`${cluster.id}: canonical owner cannot also be a merge source`);
      }
      if (!cluster.slugs.includes(slug)) {
        failures.push(`${cluster.id}: merge source is not part of cluster: ${slug}`);
      }
      if (!currentSlugs.has(slug)) {
        failures.push(`${cluster.id}: planned merge source is not a current blog post: ${slug}`);
      }
      if (Object.hasOwn(RETIRED_BLOG_SLUG_REDIRECTS, slug)) {
        failures.push(`${cluster.id}: planned merge source is already in retired consolidation map: ${slug}`);
      }
      if (!mergeSourceMembership.has(slug)) mergeSourceMembership.set(slug, []);
      mergeSourceMembership.get(slug).push(cluster.id);
    }
  }

  if (cluster.action === 'protect-indexable-owner') {
    if (shouldNoindexBlogSlug(cluster.canonicalOwner)) {
      failures.push(`${cluster.id}: evergreen canonical owner is unexpectedly noindex: ${cluster.canonicalOwner}`);
    }
    if (!Array.isArray(cluster.supportingNoindexSlugs) || cluster.supportingNoindexSlugs.length === 0) {
      failures.push(`${cluster.id}: supporting noindex relationship must name its weekly/supporting slug(s)`);
    }
    for (const slug of cluster.supportingNoindexSlugs ?? []) {
      if (!cluster.slugs.includes(slug)) {
        failures.push(`${cluster.id}: supporting noindex slug is not part of cluster: ${slug}`);
      }
      if (!shouldNoindexBlogSlug(slug)) {
        failures.push(`${cluster.id}: supporting slug is expected to be noindex by current policy: ${slug}`);
      }
    }
  }

  if (cluster.action === 'protect-hosting-consolidation') {
    if (!Array.isArray(cluster.hostingRedirectSourceSlugs) || cluster.hostingRedirectSourceSlugs.length === 0) {
      failures.push(`${cluster.id}: hosting consolidation must record at least one redirect source`);
    }
    for (const slug of cluster.hostingRedirectSourceSlugs ?? []) {
      const source = pathForSlug(slug);
      const expectedDestination = pathForSlug(cluster.canonicalOwner);
      const redirect = hostingRedirects.get(source);
      if (!redirect) {
        failures.push(`${cluster.id}: Firebase Hosting redirect missing for ${source}`);
      } else {
        if (redirect.destination !== expectedDestination) {
          failures.push(`${cluster.id}: ${source} redirects to ${redirect.destination}, expected ${expectedDestination}`);
        }
        if (redirect.type !== 301) {
          failures.push(`${cluster.id}: ${source} must use permanent 301, found ${redirect.type}`);
        }
      }
    }
  }

  if (cluster.action === 'protect-gsc-visible-owner') {
    if (cluster.audience !== 'Schools & Research') {
      failures.push(`${cluster.id}: GSC-protected institutional owner must remain Schools & Research`);
    }
    if (cluster.evidence?.source !== GSC_EVIDENCE_SOURCE) {
      failures.push(`${cluster.id}: GSC-protected owner must carry user-shared GSC evidence`);
    }
  }

  if (cluster.evidence) {
    if (cluster.evidence.source !== GSC_EVIDENCE_SOURCE) {
      failures.push(`${cluster.id}: unexpected GSC evidence source ${cluster.evidence.source}`);
    }
    if (cluster.evidence.period !== '3 months') {
      failures.push(`${cluster.id}: GSC evidence period must preserve the shared 3-month view`);
    }
    if (cluster.evidence.capturedAt !== '2026-08-28') {
      failures.push(`${cluster.id}: GSC evidence capture date must be 2026-08-28`);
    }
    if (cluster.evidence.metricsCaptured !== true) {
      failures.push(`${cluster.id}: final B2 evidence must explicitly record captured numeric metrics`);
    }
    if (!cluster.evidence.finding || !cluster.evidence.finding.trim()) {
      failures.push(`${cluster.id}: GSC evidence must include an interpretation`);
    }
    for (const [slug, metrics] of Object.entries(cluster.evidence.metricsBySlug ?? {})) {
      validateMetricValue(cluster.id, slug, 'clicks', metrics.clicks);
      validateMetricValue(cluster.id, slug, 'impressions', metrics.impressions);
    }
  }

  for (const slug of cluster.slugs) {
    if (!currentSlugs.has(slug)) failures.push(`${cluster.id}: current slug not found in blog registry: ${slug}`);
    if (!membership.has(slug)) membership.set(slug, []);
    membership.get(slug).push(cluster.id);
  }

  if (cluster.retiredSlugs?.length) {
    const expectedOwner = cluster.retiredRedirectOwner ?? cluster.canonicalOwner;
    if (!expectedOwner || !currentSlugs.has(expectedOwner)) {
      failures.push(`${cluster.id}: retired lineage must point to a current owner`);
    }
    for (const retiredSlug of cluster.retiredSlugs) {
      const redirectOwner = RETIRED_BLOG_SLUG_REDIRECTS[retiredSlug];
      if (!redirectOwner) {
        failures.push(`${cluster.id}: retired slug is not present in consolidation map: ${retiredSlug}`);
        continue;
      }
      if (redirectOwner !== expectedOwner) {
        failures.push(
          `${cluster.id}: retired slug ${retiredSlug} redirects to ${redirectOwner}, not expected owner ${expectedOwner}`,
        );
      }
      if (currentSlugs.has(retiredSlug)) {
        failures.push(`${cluster.id}: retired slug still exists as a current blog source: ${retiredSlug}`);
      }
      if (!retiredMembership.has(retiredSlug)) retiredMembership.set(retiredSlug, []);
      retiredMembership.get(retiredSlug).push(cluster.id);
    }
  }
}

for (const [slug, clusters] of membership) {
  if (clusters.length > 1) failures.push(`${slug} appears in multiple current intent clusters: ${clusters.join(', ')}`);
}
for (const [slug, clusters] of retiredMembership) {
  if (clusters.length > 1) failures.push(`${slug} appears in multiple retired-intent lineages: ${clusters.join(', ')}`);
}
for (const [slug, clusters] of mergeSourceMembership) {
  if (clusters.length > 1) failures.push(`${slug} appears in multiple planned merges: ${clusters.join(', ')}`);
}

for (const slug of REQUIRED_GSC_PROTECTED_INSTITUTIONAL_SLUGS) {
  const cluster = BLOG_INTENT_CLUSTERS.find((candidate) => candidate.slugs.includes(slug));
  if (!cluster) {
    failures.push(`GSC-visible institutional slug is missing from B2 ownership registry: ${slug}`);
    continue;
  }
  if (cluster.audience !== 'Schools & Research') {
    failures.push(`${slug}: institutional owner must remain Schools & Research`);
  }
  if (cluster.action !== 'protect-gsc-visible-owner') {
    failures.push(`${slug}: institutional owner must be protected from consolidation`);
  }
}

if (UNRESOLVED_BLOG_INTENTS.length > 0) {
  failures.push(
    `Final B2 matrix still contains unresolved intent(s): ${UNRESOLVED_BLOG_INTENTS.map((cluster) => cluster.id).join(', ')}`,
  );
}

const plannedMerges = BLOG_INTENT_CLUSTERS.filter((cluster) => cluster.action === 'merge-planned');
const existingConsolidations = BLOG_INTENT_CLUSTERS.filter(
  (cluster) => cluster.action === 'protect-existing-consolidation' || cluster.action === 'protect-hosting-consolidation',
);
const differentiated = BLOG_INTENT_CLUSTERS.filter(
  (cluster) => cluster.action === 'differentiate' || cluster.action === 'keep-distinct-owner',
);
const protectedInstitutional = BLOG_INTENT_CLUSTERS.filter((cluster) => cluster.action === 'protect-gsc-visible-owner');
const supportingNoindex = BLOG_INTENT_CLUSTERS.filter((cluster) => cluster.action === 'protect-indexable-owner');

if (plannedMerges.length > 0) {
  warnings.push(
    `${plannedMerges.length} ownership-final merge(s) are intentionally not executed in B2: ${plannedMerges.map((cluster) => cluster.id).join(', ')}. B3 must merge unique content before adding redirects.`,
  );
}

console.log(`[blog-b2] ${BLOG_INTENT_CLUSTERS.length} final intent clusters`);
console.log(`[blog-b2] ${UNRESOLVED_BLOG_INTENTS.length} unresolved ownership decisions`);
console.log(`[blog-b2] ${plannedMerges.length} planned merge(s) for B3 implementation`);
console.log(`[blog-b2] ${existingConsolidations.length} existing consolidation lineage(s) protected`);
console.log(`[blog-b2] ${differentiated.length} differentiated/multi-owner cluster(s) protected`);
console.log(`[blog-b2] ${protectedInstitutional.length} GSC-visible institutional owner(s) protected`);
console.log(`[blog-b2] ${supportingNoindex.length} evergreen + supporting-noindex relationship(s) validated`);
warnings.forEach((warning) => console.warn(`[blog-b2] WARN: ${warning}`));

if (failures.length) {
  failures.forEach((failure) => console.error(`[blog-b2] FAIL: ${failure}`));
  process.exit(1);
}

console.log('[blog-b2] PASS: final intent ownership, redirect lineage, GSC evidence and support-page policy are internally consistent.');
