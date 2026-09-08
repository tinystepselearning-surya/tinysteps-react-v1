#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { getBrick9PilotCandidates } from '../src/content/phonicsKnowledge/index.js';
import { PHONICS_PROGRAMMATIC_PILOT_PAGES, PHONICS_PROGRAMMATIC_PILOT_PATHS } from '../src/lib/phonicsProgrammaticPilot.js';
import { PHONICS_WAVE_2_PAGES } from '../src/lib/phonicsWave2Publication.js';
import { CANONICAL_TOPIC_OWNERSHIP } from '../src/lib/canonicalTopicOwnershipRegistry.js';
import { PUBLIC_REDIRECT_MANIFEST, PUBLIC_ROUTE_MANIFEST } from '../src/lib/publicRouteManifest.js';
import { ROUTE_SEO_REGISTRY } from '../src/lib/routeSeoRegistry.js';
import { getBreadcrumbTrail } from '../src/lib/breadcrumbAeoGeoRegistry.js';

const root = process.cwd();
const distMode = process.argv.includes('--dist');
const errors = [];
const warnings = [];
const fail = (code, id, detail) => errors.push({ code, id, detail });
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const routePaths = new Set(PUBLIC_ROUTE_MANIFEST.map((entry) => entry.path));
const redirectSources = new Set(PUBLIC_REDIRECT_MANIFEST.map((entry) => entry.source));
const ownersById = new Map(CANONICAL_TOPIC_OWNERSHIP.map((entry) => [entry.id, entry]));
const pilotCandidates = getBrick9PilotCandidates();
const pilotIds = new Set(PHONICS_PROGRAMMATIC_PILOT_PAGES.map((page) => page.conceptId));

if (PHONICS_PROGRAMMATIC_PILOT_PAGES.length !== 16 || PHONICS_PROGRAMMATIC_PILOT_PAGES.length !== pilotCandidates.length) fail('pilot-size', 'pilot', 'Frozen R9 pilot must remain exactly 16 explicitly reviewed Wave 1 concepts.');
for (const concept of pilotCandidates) if (!pilotIds.has(concept.id)) fail('missing-approval', concept.id, 'R8 Wave 1 candidate is missing from frozen R9 pilot.');
for (const key of ['conceptId', 'topicId', 'slug', 'path']) {
  const values = PHONICS_PROGRAMMATIC_PILOT_PAGES.map((page) => page[key]);
  if (new Set(values).size !== values.length) fail('duplicate-pilot-value', key, 'Frozen pilot IDs/slugs/paths/topic IDs must remain unique.');
}

for (const page of PHONICS_PROGRAMMATIC_PILOT_PAGES) {
  const c = page.concept;
  if (c.expansionState !== 'pilot-wave-1' || c.publicationApproved !== false || c.publicationStatus !== 'dataset-only') fail('r8-contract-drift', page.conceptId, 'R9 approval must not mutate Brick 8.');
  if (page.publicationState !== 'approved-wave-1') fail('publication-state', page.conceptId, page.publicationState);
  if (page.path !== `/resources/phonics/${c.futureSlugCandidate}`) fail('path-contract', page.conceptId, page.path);
  if (!routePaths.has(page.path)) fail('manifest', page.path, 'Frozen pilot route missing from public manifest.');
  if (redirectSources.has(page.path)) fail('redirect', page.path, 'Pilot page cannot be a redirect source.');
  const seo = ROUTE_SEO_REGISTRY[page.path];
  if (!seo || seo.canonicalPath !== page.path || /noindex/i.test(seo.robots || '')) fail('seo-registry', page.path, 'Pilot SEO contract must remain self-canonical/indexable.');
  const owner = ownersById.get(page.topicId);
  if (!owner || owner.ownerPath !== page.path || owner.ownerRole !== 'skill-guide' || owner.queryIntent !== c.searchIntent) fail('canonical-owner', page.topicId, 'Frozen R9 canonical owner drifted.');
  const breadcrumb = getBreadcrumbTrail({ pathname: page.path, title: page.cardTitle });
  if (breadcrumb.length !== 4 || breadcrumb[2]?.path !== '/resources/phonics' || breadcrumb[3]?.path !== page.path) fail('breadcrumb', page.path, JSON.stringify(breadcrumb));
}

for (const page of PHONICS_WAVE_2_PAGES) if (pilotIds.has(page.conceptId)) fail('wave2-mutated-pilot', page.conceptId, 'R12 must stay additive; Wave 2 cannot enter PHONICS_PROGRAMMATIC_PILOT_PAGES.');

const routeSource = read('src/app/routes.tsx');
const pageSource = read('src/pages/PhonicsKnowledgePage.tsx');
const gridSource = read('src/components/resources/PhonicsPilotGuideGrid.tsx');
if (!routeSource.includes("{ path: 'resources/phonics/:slug', element: <PhonicsKnowledgePage /> },")) fail('react-route', 'routes.tsx', 'Missing controlled dynamic phonics resource route.');
if (!pageSource.includes('getPhonicsProgrammaticPilotPageBySlug') || !pageSource.includes('getPublishedPhonicsResourcePageBySlug') || !pageSource.includes('<NotFoundPage />')) fail('page-resolution', 'PhonicsKnowledgePage.tsx', 'Renderer must preserve the historical resolver and add the governed R12 registry.');
if (!pageSource.includes('ts-answer-title') || !pageSource.includes('ts-answer-summary') || !pageSource.includes('DefinedTerm') || !pageSource.includes('WebPage')) fail('aeo-schema', 'PhonicsKnowledgePage.tsx', 'Visible answer and conservative schema are required.');
if (pageSource.includes("'FAQPage'") || pageSource.includes("'HowTo'")) fail('fabricated-schema', 'PhonicsKnowledgePage.tsx', 'Do not manufacture FAQ/HowTo schema.');
if (!gridSource.includes('PHONICS_PUBLISHED_RESOURCE_PAGES')) fail('hub-discovery', 'PhonicsPilotGuideGrid.tsx', 'R12 hub must render the additive publication registry.');

if (distMode) {
  const sitemapPaths = [path.join(root, 'public', 'sitemap-static.xml'), path.join(root, 'dist', 'sitemap-static.xml')];
  const sitemapPath = sitemapPaths.find((candidate) => fs.existsSync(candidate));
  const sitemap = sitemapPath ? fs.readFileSync(sitemapPath, 'utf8') : '';
  if (!sitemapPath) fail('dist-sitemap', 'sitemap-static.xml', 'Build sitemap is missing.');
  for (const page of PHONICS_PROGRAMMATIC_PILOT_PAGES) {
    const htmlPath = path.join(root, 'dist', ...page.path.slice(1).split('/'), 'index.html');
    if (!fs.existsSync(htmlPath)) { fail('prerender', page.path, htmlPath); continue; }
    const html = fs.readFileSync(htmlPath, 'utf8');
    const canonical = `https://tinystepslearning.com${page.path}`;
    if (!html.includes(canonical)) fail('rendered-canonical', page.path, canonical);
    if (!html.includes(page.concept.parentQuestion) || !html.includes('Quick answer')) fail('rendered-value', page.path, 'Unique pilot value missing from prerender.');
    if (!sitemap.includes(`<loc>${canonical}</loc>`)) fail('sitemap-entry', page.path, canonical);
  }
}

const summary = { approvedPages: PHONICS_PROGRAMMATIC_PILOT_PAGES.length, approvedPaths: PHONICS_PROGRAMMATIC_PILOT_PATHS, additiveWave2Pages: PHONICS_WAVE_2_PAGES.length, errors: errors.length, warnings: warnings.length };
console.log(JSON.stringify({ summary, errors, warnings }, null, 2));
if (process.argv.includes('--report')) { fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true }); fs.writeFileSync(path.join(root, 'artifacts/resources-r9-programmatic-pilot.json'), JSON.stringify({ summary, errors, warnings }, null, 2) + '\n'); }
if (errors.length) process.exitCode = 1;
else console.log(`PASS: frozen R9 pilot remains ${PHONICS_PROGRAMMATIC_PILOT_PAGES.length} pages while R12 adds ${PHONICS_WAVE_2_PAGES.length} pages without rewriting history.`);
