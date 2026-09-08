#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  PHONICS_PROGRAMMATIC_PILOT_PAGES,
  PHONICS_PROGRAMMATIC_PILOT_PATHS,
} from '../src/lib/phonicsProgrammaticPilot.js';
import {
  PHONICS_RESOURCE_DISCOVERY_CLUSTERS,
  PHONICS_RESOURCE_DISCOVERY_EDGES,
  PHONICS_RESOURCE_HUB_PATH,
  getPhonicsResourceReachablePaths,
  getRelatedPhonicsResourcePages,
} from '../src/lib/phonicsResourceDiscoveryGraph.js';
import { PUBLIC_ROUTE_MANIFEST } from '../src/lib/publicRouteManifest.js';

const root = process.cwd();
const errors = [];
const checks = [];
const distMode = process.argv.includes('--dist');
const manifestByPath = new Map(PUBLIC_ROUTE_MANIFEST.map((entry) => [entry.path, entry]));
const expectedPaths = new Set([PHONICS_RESOURCE_HUB_PATH, ...PHONICS_PROGRAMMATIC_PILOT_PATHS]);

function pass(id, detail) {
  checks.push({ id, status: 'pass', detail });
}

function fail(id, detail) {
  errors.push({ id, detail });
  checks.push({ id, status: 'fail', detail });
}

function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function count(text, needle) {
  return text.split(needle).length - 1;
}

function renderedHtmlPath(routePath) {
  if (routePath === '/') return path.join(root, 'dist', 'index.html');
  return path.join(root, 'dist', ...routePath.slice(1).split('/'), 'index.html');
}

const clusteredPaths = PHONICS_RESOURCE_DISCOVERY_CLUSTERS.flatMap((cluster) => cluster.pages.map((page) => page.path));
if (clusteredPaths.length !== PHONICS_PROGRAMMATIC_PILOT_PATHS.length || new Set(clusteredPaths).size !== PHONICS_PROGRAMMATIC_PILOT_PATHS.length) {
  fail('cluster-membership', 'Every published phonics page must appear in exactly one discovery cluster.');
} else {
  pass('cluster-membership', `${clusteredPaths.length} published pages map one-to-one into ${PHONICS_RESOURCE_DISCOVERY_CLUSTERS.length} clusters.`);
}

for (const cluster of PHONICS_RESOURCE_DISCOVERY_CLUSTERS) {
  if (!cluster.pages.length) fail('empty-cluster', `${cluster.id} has no published pages.`);
  if (manifestByPath.has(`/resources/phonics/${cluster.id}`)) fail('thin-cluster-url', `${cluster.id} unexpectedly became a standalone public route.`);
}
if (!errors.some((error) => error.id === 'empty-cluster' || error.id === 'thin-cluster-url')) {
  pass('cluster-surface', 'Clusters remain crawlable in-page families; no thin category URLs were invented.');
}

const reachable = new Set(getPhonicsResourceReachablePaths());
const unreachable = [...expectedPaths].filter((routePath) => !reachable.has(routePath));
if (unreachable.length) fail('graph-reachability', `Unreachable paths from ${PHONICS_RESOURCE_HUB_PATH}: ${unreachable.join(', ')}`);
else pass('graph-reachability', `All ${expectedPaths.size} hub/detail resource paths are reachable from the phonics hub.`);

for (const page of PHONICS_PROGRAMMATIC_PILOT_PAGES) {
  const manifest = manifestByPath.get(page.path);
  if (!manifest || !manifest.indexable || !manifest.prerender || !manifest.sitemap || manifest.canonicalPath !== page.path) {
    fail('route-contract', `${page.path} must remain indexable, self-canonical, prerendered and sitemap eligible.`);
  }
  const related = getRelatedPhonicsResourcePages(page.path, 4);
  if (related.length < 4 || related.some((candidate) => candidate.path === page.path)) {
    fail('related-graph', `${page.path} does not have four safe related discovery targets.`);
  }
  if (!PHONICS_RESOURCE_DISCOVERY_EDGES.some((edge) => edge.from === PHONICS_RESOURCE_HUB_PATH && edge.to === page.path && edge.relation === 'hub-child')) {
    fail('hub-edge', `Missing hub-child edge for ${page.path}.`);
  }
  if (!PHONICS_RESOURCE_DISCOVERY_EDGES.some((edge) => edge.from === page.path && edge.to === PHONICS_RESOURCE_HUB_PATH && edge.relation === 'parent-hub')) {
    fail('parent-edge', `Missing parent-hub edge for ${page.path}.`);
  }
}
if (!errors.some((error) => ['route-contract', 'related-graph', 'hub-edge', 'parent-edge'].includes(error.id))) {
  pass('page-contracts', 'Every published page keeps route safety plus parent and related discovery edges.');
}

const gridSource = read('src/components/resources/PhonicsPilotGuideGrid.tsx');
for (const token of ['PHONICS_RESOURCE_DISCOVERY_CLUSTERS', 'Browse phonics guide families', 'data-resource-discovery-cluster', 'data-resource-discovery-path']) {
  if (!gridSource.includes(token)) fail('hub-source', `Hub grid is missing ${token}.`);
}
if (!errors.some((error) => error.id === 'hub-source')) pass('hub-source', 'Hub source renders the data-driven cluster navigation and direct guide links.');

const detailSource = read('src/pages/PhonicsKnowledgePage.tsx');
for (const token of ['getRelatedPhonicsResourcePages', 'getPhonicsResourceDiscoveryClusterForPath', 'data-resource-related-guides', 'data-resource-related-path', 'Explore related phonics patterns']) {
  if (!detailSource.includes(token)) fail('detail-source', `Detail-page source is missing ${token}.`);
}
if (!errors.some((error) => error.id === 'detail-source')) pass('detail-source', 'Reusable detail page renders the related-guide graph for users and crawlers.');

if (distMode) {
  const sitemapPath = path.join(root, 'public', 'sitemap-static.xml');
  if (fs.existsSync(sitemapPath)) {
    const sitemap = fs.readFileSync(sitemapPath, 'utf8');
    for (const routePath of expectedPaths) {
      const url = `https://tinystepslearning.com${routePath}`;
      if (count(sitemap, `<loc>${url}</loc>`) !== 1) fail('sitemap-coverage', `${url} must appear exactly once in generated sitemap-static.xml.`);
    }
    if (!errors.some((error) => error.id === 'sitemap-coverage')) pass('sitemap-coverage', `Generated sitemap contains the hub and all ${PHONICS_PROGRAMMATIC_PILOT_PATHS.length} published detail pages exactly once.`);
  } else {
    fail('sitemap-missing', 'Generated public/sitemap-static.xml is missing after build.');
  }

  const hubFile = renderedHtmlPath(PHONICS_RESOURCE_HUB_PATH);
  if (!fs.existsSync(hubFile)) {
    fail('rendered-hub', `${hubFile} is missing.`);
  } else {
    const hubHtml = fs.readFileSync(hubFile, 'utf8');
    for (const cluster of PHONICS_RESOURCE_DISCOVERY_CLUSTERS) {
      if (!hubHtml.includes(`id="${cluster.anchorId}"`)) fail('rendered-cluster-anchor', `Rendered hub is missing #${cluster.anchorId}.`);
    }
    for (const page of PHONICS_PROGRAMMATIC_PILOT_PAGES) {
      if (!hubHtml.includes(`href="${page.path}"`)) fail('rendered-hub-link', `Rendered hub is missing a direct link to ${page.path}.`);
    }
  }

  for (const page of PHONICS_PROGRAMMATIC_PILOT_PAGES) {
    const file = renderedHtmlPath(page.path);
    if (!fs.existsSync(file)) {
      fail('rendered-detail', `Rendered detail file missing for ${page.path}.`);
      continue;
    }
    const html = fs.readFileSync(file, 'utf8');
    if (!html.includes(`href="${PHONICS_RESOURCE_HUB_PATH}"`)) fail('rendered-parent-link', `${page.path} does not link back to the phonics hub.`);
    for (const related of getRelatedPhonicsResourcePages(page.path, 4)) {
      if (!html.includes(`href="${related.path}"`)) fail('rendered-related-link', `${page.path} is missing rendered related-guide link to ${related.path}.`);
    }
  }
  if (!errors.some((error) => error.id.startsWith('rendered-'))) pass('rendered-discovery', 'Rendered hub/detail HTML preserves direct hub, parent and related-guide discovery paths.');
}

const report = {
  brick: 'R10',
  revision: '2026-09-09-r10',
  publishedPages: PHONICS_PROGRAMMATIC_PILOT_PATHS.length,
  clusters: PHONICS_RESOURCE_DISCOVERY_CLUSTERS.length,
  edges: PHONICS_RESOURCE_DISCOVERY_EDGES.length,
  distMode,
  checks,
  errors,
};

console.log(JSON.stringify(report, null, 2));
if (process.argv.includes('--report')) {
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts', 'resources-r10-discovery-infrastructure.json'), `${JSON.stringify(report, null, 2)}\n`);
}

if (errors.length) process.exitCode = 1;
else console.log(`PASS: Brick 10 discovery graph covers ${PHONICS_PROGRAMMATIC_PILOT_PATHS.length} published phonics pages and is ready to expand with the publication registry.`);
