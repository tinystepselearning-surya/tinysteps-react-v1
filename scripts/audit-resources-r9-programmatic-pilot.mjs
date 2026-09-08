#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  PHONICS_KNOWLEDGE_DATASET,
  getBrick9PilotCandidates,
} from '../src/content/phonicsKnowledge/index.js';
import {
  PHONICS_PROGRAMMATIC_PILOT_PAGES,
  PHONICS_PROGRAMMATIC_PILOT_PATHS,
} from '../src/lib/phonicsProgrammaticPilot.js';
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
const futureCandidates = PHONICS_KNOWLEDGE_DATASET.filter((concept) => concept.expansionState === 'future-wave-2');

if (PHONICS_PROGRAMMATIC_PILOT_PAGES.length < 12 || PHONICS_PROGRAMMATIC_PILOT_PAGES.length > 20) {
  fail('pilot-size', 'pilot', `Expected a controlled 12-20 page pilot, found ${PHONICS_PROGRAMMATIC_PILOT_PAGES.length}.`);
}
if (PHONICS_PROGRAMMATIC_PILOT_PAGES.length !== pilotCandidates.length) {
  fail('approval-set', 'pilot', 'R9 explicit approvals must match the reviewed R8 Wave 1 set for this pilot revision.');
}
for (const concept of pilotCandidates) if (!pilotIds.has(concept.id)) fail('missing-approval', concept.id, 'R8 Wave 1 candidate is not explicitly approved in R9.');

for (const key of ['conceptId', 'topicId', 'slug', 'path']) {
  const values = PHONICS_PROGRAMMATIC_PILOT_PAGES.map((page) => page[key]);
  if (new Set(values).size !== values.length) fail('duplicate-pilot-value', key, 'Pilot IDs, slugs, paths and owner IDs must be unique.');
}
const queryIntents = PHONICS_PROGRAMMATIC_PILOT_PAGES.map((page) => page.concept.searchIntent.trim().toLowerCase());
if (new Set(queryIntents).size !== queryIntents.length) fail('duplicate-intent', 'pilot', 'Each pilot page needs a distinct search intent.');

for (const page of PHONICS_PROGRAMMATIC_PILOT_PAGES) {
  const c = page.concept;
  if (c.expansionState !== 'pilot-wave-1' || c.publicationApproved !== false || c.publicationStatus !== 'dataset-only') {
    fail('r8-contract-drift', page.conceptId, 'R9 approval must not mutate the R8 dataset publication contract.');
  }
  if (page.publicationState !== 'approved-wave-1') fail('publication-state', page.conceptId, page.publicationState);
  if (page.path !== `/resources/phonics/${c.futureSlugCandidate}` || page.slug !== c.futureSlugCandidate) fail('path-contract', page.conceptId, page.path);
  if (!/^\/resources\/phonics\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(page.path)) fail('path-format', page.conceptId, page.path);
  if (/\b(classes|fees|pricing|price|book|assessment|best online|near me|resources hub)\b/i.test(`${c.searchIntent} ${c.parentQuestion}`)) fail('reserved-intent', page.conceptId, c.searchIntent);
  if (c.curriculumAlignment !== 'direct' || c.curriculumRefs.length < 1) fail('curriculum-depth', page.conceptId, 'Published pilot needs direct curriculum alignment.');
  if (c.exampleWords.length < 5 || c.teachingNotes.length < 2 || c.practiceIdeas.length < 2 || c.commonConfusions.length < 2 || c.distinctValueSignals.length < 3) fail('content-depth', page.conceptId, 'Published page lacks the minimum curated teaching depth.');
  if (!c.prerequisiteIds.length || !c.nextIds.length) fail('learning-graph', page.conceptId, 'Published page needs prerequisite and next-step context.');
  if (['satpin', 'blending', 'cvc'].some((term) => page.slug.includes(term))) fail('protected-owner', page.conceptId, 'Established SATPIN/blending/CVC intent cannot be republished by R9.');

  if (!routePaths.has(page.path)) fail('manifest', page.path, 'Pilot route missing from PUBLIC_ROUTE_MANIFEST.');
  if (redirectSources.has(page.path)) fail('redirect', page.path, 'Pilot pages must be direct 200 routes, not redirect sources.');
  const seo = ROUTE_SEO_REGISTRY[page.path];
  if (!seo || seo.canonicalPath !== page.path || !String(seo.title || '').trim() || !String(seo.description || '').trim() || /noindex/i.test(seo.robots || '')) fail('seo-registry', page.path, 'Pilot page must have self-canonical indexable SEO config.');
  const owner = ownersById.get(page.topicId);
  if (!owner || owner.ownerPath !== page.path || owner.subject !== 'phonics-reading' || owner.ownerRole !== 'skill-guide' || owner.intent !== 'informational' || owner.hubPath !== '/resources/phonics' || owner.queryIntent !== c.searchIntent) fail('canonical-owner', page.topicId, 'Pilot page must own exactly its approved granular informational intent.');
  const breadcrumb = getBreadcrumbTrail({ pathname: page.path, title: page.cardTitle });
  if (breadcrumb.length !== 4 || breadcrumb[0]?.path !== '/' || breadcrumb[1]?.path !== '/resources' || breadcrumb[2]?.path !== '/resources/phonics' || breadcrumb[3]?.path !== page.path) fail('breadcrumb', page.path, JSON.stringify(breadcrumb));
}

for (const future of futureCandidates) {
  if (pilotIds.has(future.id)) fail('future-wave-published', future.id, 'Wave 2 cannot enter the Brick 9 pilot.');
  if (future.futureSlugCandidate && routePaths.has(`/resources/phonics/${future.futureSlugCandidate}`)) fail('future-wave-route', future.id, future.futureSlugCandidate);
}

const routeSource = read('src/app/routes.tsx');
const pageSource = read('src/pages/PhonicsKnowledgePage.tsx');
const hubSource = read('src/pages/SubjectResourcesPage.tsx');
const gridSource = read('src/components/resources/PhonicsPilotGuideGrid.tsx');
if (!routeSource.includes("{ path: 'resources/phonics/:slug', element: <PhonicsKnowledgePage /> },")) fail('react-route', 'routes.tsx', 'Missing controlled dynamic phonics resource route.');
if (!pageSource.includes('getPhonicsProgrammaticPilotPageBySlug') || !pageSource.includes('<NotFoundPage />')) fail('page-resolution', 'PhonicsKnowledgePage.tsx', 'Page must resolve only approved slugs and return genuine not-found UI for others.');
if (!pageSource.includes('ts-answer-title') || !pageSource.includes('ts-answer-summary') || !pageSource.includes('DefinedTerm') || !pageSource.includes('WebPage')) fail('aeo-schema', 'PhonicsKnowledgePage.tsx', 'Visible answer and conservative WebPage/DefinedTerm schema are required.');
if (pageSource.includes("'FAQPage'") || pageSource.includes('"FAQPage"') || pageSource.includes("'HowTo'") || pageSource.includes('"HowTo"')) fail('fabricated-schema', 'PhonicsKnowledgePage.tsx', 'R9 must not manufacture FAQ/HowTo schema.');
if (!hubSource.includes('PhonicsPilotGuideGrid') || !gridSource.includes('PHONICS_PROGRAMMATIC_PILOT_PAGES')) fail('hub-discovery', 'SubjectResourcesPage.tsx', 'Phonics hub must visibly expose the approved pilot set.');
for (const page of PHONICS_PROGRAMMATIC_PILOT_PAGES) if (!gridSource.includes('PHONICS_PROGRAMMATIC_PILOT_PAGES')) break;

if (distMode) {
  const sitemapPath = path.join(root, 'dist', 'sitemap-static.xml');
  if (!fs.existsSync(sitemapPath)) fail('dist-sitemap', 'dist/sitemap-static.xml', 'Build sitemap is missing.');
  const sitemap = fs.existsSync(sitemapPath) ? fs.readFileSync(sitemapPath, 'utf8') : '';
  for (const page of PHONICS_PROGRAMMATIC_PILOT_PAGES) {
    const htmlPath = path.join(root, 'dist', ...page.path.slice(1).split('/'), 'index.html');
    if (!fs.existsSync(htmlPath)) {
      fail('prerender', page.path, htmlPath);
      continue;
    }
    const html = fs.readFileSync(htmlPath, 'utf8');
    const canonical = `${'https://tinystepslearning.com'}${page.path}`;
    if (!html.includes(canonical)) fail('rendered-canonical', page.path, canonical);
    if (!html.includes(page.seoTitle)) fail('rendered-title', page.path, page.seoTitle);
    if (!html.includes(page.seoDescription)) fail('rendered-description', page.path, page.seoDescription);
    if (!html.includes(page.concept.parentQuestion) || !html.includes('Quick answer')) fail('rendered-value', page.path, 'Visible unique question/answer content missing from prerender.');
    if (/noindex/i.test((html.match(/<meta[^>]+name=["']robots["'][^>]*>/i) || [''])[0])) fail('rendered-indexability', page.path, 'Rendered page is noindex.');
    if (!sitemap.includes(`<loc>${canonical}</loc>`)) fail('sitemap-entry', page.path, canonical);
  }
  for (const future of futureCandidates) {
    if (!future.futureSlugCandidate) continue;
    const futurePath = `/resources/phonics/${future.futureSlugCandidate}`;
    if (sitemap.includes(futurePath) || fs.existsSync(path.join(root, 'dist', ...futurePath.slice(1).split('/'), 'index.html'))) fail('future-output', future.id, futurePath);
  }
}

const summary = {
  approvedPages: PHONICS_PROGRAMMATIC_PILOT_PAGES.length,
  approvedPaths: PHONICS_PROGRAMMATIC_PILOT_PATHS,
  futureWaveHeldBack: futureCandidates.length,
  errors: errors.length,
  warnings: warnings.length,
};
console.log(JSON.stringify({ summary, errors, warnings }, null, 2));
if (process.argv.includes('--report')) {
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/resources-r9-programmatic-pilot.json'), JSON.stringify({ summary, errors, warnings }, null, 2) + '\n');
}
if (errors.length) process.exitCode = 1;
else console.log(`PASS: Brick 9 controlled pilot has ${PHONICS_PROGRAMMATIC_PILOT_PAGES.length} approved pages, explicit owners, safe routes and ${futureCandidates.length} Wave 2 concepts held back.`);
