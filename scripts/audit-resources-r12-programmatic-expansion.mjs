#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { PHONICS_KNOWLEDGE_DATASET } from '../src/content/phonicsKnowledge/index.js';
import { PHONICS_PROGRAMMATIC_PILOT_PAGES } from '../src/lib/phonicsProgrammaticPilot.js';
import { PHONICS_PUBLISHED_RESOURCE_PAGES, PHONICS_PUBLISHED_RESOURCE_PATHS, PHONICS_WAVE_2_PAGES } from '../src/lib/phonicsPublicationRegistry.js';
import { PHONICS_EDITORIAL_REVIEW_RECORDS, PHONICS_PUBLISHED_EDITORIAL_REVIEW_RECORDS, PHONICS_WAVE_2_EDITORIAL_REVIEW_RECORDS } from '../src/lib/phonicsEditorialReviewRegistry.js';
import { PHONICS_WAVE_2_CANONICAL_TOPIC_OWNERSHIP, R12_CANONICAL_TOPIC_OWNERSHIP } from '../src/lib/phonicsWave2CanonicalOwnership.js';
import { CANONICAL_TOPIC_OWNERSHIP } from '../src/lib/canonicalTopicOwnershipRegistry.js';
import { PHONICS_RESOURCE_DISCOVERY_CLUSTERS, getPhonicsResourceReachablePaths, getRelatedPhonicsResourcePages } from '../src/lib/phonicsResourceDiscoveryGraph.js';
import { PUBLIC_ROUTE_MANIFEST } from '../src/lib/publicRouteManifest.js';
import { ROUTE_SEO_REGISTRY } from '../src/lib/routeSeoRegistry.js';

const root = process.cwd();
const distMode = process.argv.includes('--dist');
const errors = [];
const fail = (code, id, detail) => errors.push({ code, id, detail });
const routeByPath = new Map(PUBLIC_ROUTE_MANIFEST.map((entry) => [entry.path, entry]));

if (PHONICS_PROGRAMMATIC_PILOT_PAGES.length !== 16) fail('seed-count', 'pilot', `Expected 16, found ${PHONICS_PROGRAMMATIC_PILOT_PAGES.length}`);
if (PHONICS_WAVE_2_PAGES.length !== 15) fail('wave2-count', 'wave2', `Expected 15, found ${PHONICS_WAVE_2_PAGES.length}`);
if (PHONICS_PUBLISHED_RESOURCE_PAGES.length !== 31) fail('published-count', 'all', `Expected 31, found ${PHONICS_PUBLISHED_RESOURCE_PAGES.length}`);

const futureIds = new Set(PHONICS_KNOWLEDGE_DATASET.filter((concept) => concept.expansionState === 'future-wave-2').map((concept) => concept.id));
const supportingIds = new Set(PHONICS_KNOWLEDGE_DATASET.filter((concept) => concept.expansionState === 'supporting-only').map((concept) => concept.id));
for (const page of PHONICS_WAVE_2_PAGES) {
  if (!futureIds.has(page.conceptId)) fail('scope', page.conceptId, 'Wave 2 page is not a Brick 8 future-wave-2 concept.');
  if (supportingIds.has(page.conceptId)) fail('supporting-only-publication', page.conceptId, page.path);
  if (page.concept.canonicalOwnerTopicId) fail('existing-owner-publication', page.conceptId, page.concept.canonicalOwnerTopicId);
}
if (new Set(PHONICS_WAVE_2_PAGES.map((page) => page.conceptId)).size !== futureIds.size) fail('future-wave-coverage', 'wave2', 'Every future-wave-2 concept must be explicitly represented exactly once.');

for (const key of ['conceptId', 'topicId', 'slug', 'path']) {
  const values = PHONICS_PUBLISHED_RESOURCE_PAGES.map((page) => page[key]);
  if (new Set(values).size !== values.length) fail('duplicate-publication', key, 'Published identifiers must be unique.');
}
const queryIntents = PHONICS_PUBLISHED_RESOURCE_PAGES.map((page) => page.concept.searchIntent.trim().toLowerCase());
if (new Set(queryIntents).size !== queryIntents.length) fail('duplicate-query-intent', 'published', 'Published resource query intents must be unique.');

for (const page of PHONICS_PUBLISHED_RESOURCE_PAGES) {
  const route = routeByPath.get(page.path);
  if (!route?.indexable || !route?.prerender || !route?.sitemap || route.canonicalPath !== page.path) fail('route-contract', page.path, 'Published resource must be indexable, prerendered, sitemap eligible and self-canonical.');
  const seo = ROUTE_SEO_REGISTRY[page.path];
  if (!seo || seo.canonicalPath !== page.path || seo.title !== page.seoTitle || seo.description !== page.seoDescription || /noindex/i.test(seo.robots || '')) fail('seo-contract', page.path, 'Published resource SEO registry drift.');
  if (getRelatedPhonicsResourcePages(page.path, 4).length !== 4) fail('related-graph', page.path, 'Published resource needs four related resource targets.');
}

const clustered = PHONICS_RESOURCE_DISCOVERY_CLUSTERS.flatMap((cluster) => cluster.pages.map((page) => page.path));
if (clustered.length !== 31 || new Set(clustered).size !== 31) fail('cluster-coverage', 'graph', 'Every published resource must appear in exactly one discovery cluster.');
const reachable = new Set(getPhonicsResourceReachablePaths());
for (const pathValue of PHONICS_PUBLISHED_RESOURCE_PATHS) if (!reachable.has(pathValue)) fail('unreachable', pathValue, 'Resource is not reachable from the phonics hub.');

if (PHONICS_EDITORIAL_REVIEW_RECORDS.length !== 16) fail('legacy-review-ledger', 'R9.1', 'Historical R9.1 ledger must stay exactly 16.');
if (PHONICS_WAVE_2_EDITORIAL_REVIEW_RECORDS.length !== 15 || PHONICS_PUBLISHED_EDITORIAL_REVIEW_RECORDS.length !== 31) fail('review-ledger', 'R12', 'R12 requires 15 Wave 2 and 31 total review records.');
for (const record of PHONICS_WAVE_2_EDITORIAL_REVIEW_RECORDS) {
  if (record.editorialReviewStatus !== 'pending' || record.reviewedAt !== null || record.reviewedRevision !== null) fail('false-human-review', record.conceptId, 'Wave 2 remains pending until an actual human review occurs.');
}

if (PHONICS_WAVE_2_CANONICAL_TOPIC_OWNERSHIP.length !== 15 || R12_CANONICAL_TOPIC_OWNERSHIP.length !== CANONICAL_TOPIC_OWNERSHIP.length + 15) fail('ownership-count', 'R12', 'Wave 2 needs one additive owner per page.');
for (const page of PHONICS_WAVE_2_PAGES) {
  const owner = PHONICS_WAVE_2_CANONICAL_TOPIC_OWNERSHIP.find((entry) => entry.id === page.topicId);
  if (!owner || owner.ownerPath !== page.path || owner.ownerRole !== 'skill-guide' || owner.intent !== 'informational' || owner.hubPath !== '/resources/phonics' || owner.queryIntent !== page.concept.searchIntent) fail('wave2-owner', page.topicId, page.path);
}

if (distMode) {
  const sitemapCandidates = [path.join(root, 'public', 'sitemap-static.xml'), path.join(root, 'dist', 'sitemap-static.xml')];
  const sitemapFile = sitemapCandidates.find((candidate) => fs.existsSync(candidate));
  if (!sitemapFile) fail('sitemap-missing', 'sitemap-static.xml', 'Generated sitemap missing.');
  const sitemap = sitemapFile ? fs.readFileSync(sitemapFile, 'utf8') : '';
  for (const page of PHONICS_PUBLISHED_RESOURCE_PAGES) {
    const canonical = `https://tinystepslearning.com${page.path}`;
    if (!sitemap.includes(`<loc>${canonical}</loc>`)) fail('sitemap-entry', page.path, canonical);
    const htmlPath = path.join(root, 'dist', ...page.path.slice(1).split('/'), 'index.html');
    if (!fs.existsSync(htmlPath)) { fail('prerender', page.path, htmlPath); continue; }
    const html = fs.readFileSync(htmlPath, 'utf8');
    if (!html.includes(canonical) || !html.includes(page.seoTitle) || !html.includes(page.concept.parentQuestion) || !html.includes('Quick answer')) fail('rendered-content', page.path, 'Rendered resource is missing canonical SEO or unique educational value.');
    if (page.publicationWave === 'expansion-wave-2' && (html.includes('Reviewed for phonics accuracy by') || html.includes('"reviewedBy"'))) fail('pending-review-claim', page.path, 'Pending Wave 2 page must not expose a human-review claim or reviewedBy schema.');
  }
}

const report = {
  brick: 'R12',
  revision: '2026-09-09-r12',
  pilotPages: PHONICS_PROGRAMMATIC_PILOT_PAGES.length,
  wave2Pages: PHONICS_WAVE_2_PAGES.length,
  publishedPages: PHONICS_PUBLISHED_RESOURCE_PAGES.length,
  reviewRecords: PHONICS_PUBLISHED_EDITORIAL_REVIEW_RECORDS.length,
  wave2ReviewStatus: 'pending',
  clusters: PHONICS_RESOURCE_DISCOVERY_CLUSTERS.length,
  distMode,
  errors,
};
console.log(JSON.stringify(report, null, 2));
if (process.argv.includes('--report')) {
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/resources-r12-programmatic-expansion.json'), `${JSON.stringify(report, null, 2)}\n`);
}
if (errors.length) process.exitCode = 1;
else console.log('PASS: Brick 12 publishes a governed 31-page phonics resource library: frozen 16-page seed + explicit 15-page Wave 2.');
