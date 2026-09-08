#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { PHONICS_PUBLISHED_RESOURCE_PAGES, PHONICS_PUBLISHED_RESOURCE_PATHS } from '../src/lib/phonicsPublicationRegistry.js';
import { PHONICS_RESOURCE_DISCOVERY_CLUSTERS, PHONICS_RESOURCE_DISCOVERY_EDGES, PHONICS_RESOURCE_HUB_PATH, getPhonicsResourceReachablePaths, getRelatedPhonicsResourcePages } from '../src/lib/phonicsResourceDiscoveryGraph.js';
import { PUBLIC_ROUTE_MANIFEST } from '../src/lib/publicRouteManifest.js';

const root = process.cwd();
const distMode = process.argv.includes('--dist');
const errors = [];
const fail = (code, detail) => errors.push({ code, detail });
const manifestByPath = new Map(PUBLIC_ROUTE_MANIFEST.map((entry) => [entry.path, entry]));
const clustered = PHONICS_RESOURCE_DISCOVERY_CLUSTERS.flatMap((cluster) => cluster.pages.map((page) => page.path));
if (clustered.length !== PHONICS_PUBLISHED_RESOURCE_PATHS.length || new Set(clustered).size !== PHONICS_PUBLISHED_RESOURCE_PATHS.length) fail('cluster-membership', 'Published pages must map one-to-one into discovery clusters.');
const reachable = new Set(getPhonicsResourceReachablePaths());
for (const page of PHONICS_PUBLISHED_RESOURCE_PAGES) {
  if (!reachable.has(page.path)) fail('reachability', page.path);
  const manifest = manifestByPath.get(page.path);
  if (!manifest?.indexable || !manifest?.prerender || !manifest?.sitemap || manifest.canonicalPath !== page.path) fail('route-contract', page.path);
  if (getRelatedPhonicsResourcePages(page.path, 4).length !== 4) fail('related-graph', page.path);
  if (!PHONICS_RESOURCE_DISCOVERY_EDGES.some((edge) => edge.from === PHONICS_RESOURCE_HUB_PATH && edge.to === page.path)) fail('hub-edge', page.path);
  if (!PHONICS_RESOURCE_DISCOVERY_EDGES.some((edge) => edge.from === page.path && edge.to === PHONICS_RESOURCE_HUB_PATH)) fail('parent-edge', page.path);
}
if (distMode) {
  const sitemapPath = path.join(root, 'public', 'sitemap-static.xml');
  if (!fs.existsSync(sitemapPath)) fail('sitemap-missing', sitemapPath);
  else {
    const sitemap = fs.readFileSync(sitemapPath, 'utf8');
    for (const routePath of PHONICS_PUBLISHED_RESOURCE_PATHS) if (!sitemap.includes(`<loc>https://tinystepslearning.com${routePath}</loc>`)) fail('sitemap-coverage', routePath);
  }
  const hubPath = path.join(root, 'dist', 'resources', 'phonics', 'index.html');
  if (!fs.existsSync(hubPath)) fail('rendered-hub', hubPath);
  else {
    const html = fs.readFileSync(hubPath, 'utf8');
    for (const page of PHONICS_PUBLISHED_RESOURCE_PAGES) if (!html.includes(`href="${page.path}"`)) fail('rendered-hub-link', page.path);
  }
  for (const page of PHONICS_PUBLISHED_RESOURCE_PAGES) {
    const file = path.join(root, 'dist', ...page.path.slice(1).split('/'), 'index.html');
    if (!fs.existsSync(file)) fail('rendered-detail', page.path);
  }
}
const report = { brick: 'R10/R12', publishedPages: PHONICS_PUBLISHED_RESOURCE_PAGES.length, clusters: PHONICS_RESOURCE_DISCOVERY_CLUSTERS.length, edges: PHONICS_RESOURCE_DISCOVERY_EDGES.length, distMode, errors };
console.log(JSON.stringify(report, null, 2));
if (process.argv.includes('--report')) { fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true }); fs.writeFileSync(path.join(root, 'artifacts/resources-r10-discovery-infrastructure.json'), `${JSON.stringify(report, null, 2)}\n`); }
if (errors.length) process.exitCode = 1;
else console.log(`PASS: discovery graph covers all ${PHONICS_PUBLISHED_RESOURCE_PAGES.length} published phonics pages.`);
