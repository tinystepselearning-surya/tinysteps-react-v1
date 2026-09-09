#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  R16_CANONICAL_TOPIC_OWNERSHIP,
  R16_READING_EXISTING_CANONICAL_TOPIC_OWNERSHIP,
  getR16CanonicalTopicOwnerPath,
} from '../src/lib/readingSemanticCanonicalOwnership.js';
import {
  READING_SEMANTIC_JOURNEY_REVISION,
  R16_READING_SEMANTIC_JOURNEYS,
  getReadingSemanticInternalLinksForPath,
} from '../src/lib/readingSemanticJourneyGraph.js';
import { R15_CANONICAL_TOPIC_OWNERSHIP } from '../src/lib/readingContentCanonicalOwnership.js';

const root = process.cwd();
const distMode = process.argv.includes('--dist');
const errors = [];
const warnings = [];
const add = (code, id, detail) => errors.push({ code, id, detail });

if (R16_READING_EXISTING_CANONICAL_TOPIC_OWNERSHIP.length !== 2) add('owner-count', 'r16-owners', `Expected 2 additive established owners, found ${R16_READING_EXISTING_CANONICAL_TOPIC_OWNERSHIP.length}.`);
if (R16_CANONICAL_TOPIC_OWNERSHIP.length !== R15_CANONICAL_TOPIC_OWNERSHIP.length + 2) add('owner-view-size', 'r16-owners', 'R16 must be exactly R15 ownership plus 2 established comprehension owners.');
if (R16_READING_SEMANTIC_JOURNEYS.length !== 6) add('journey-count', 'r16-journeys', `Expected 6 focused journeys, found ${R16_READING_SEMANTIC_JOURNEYS.length}.`);

for (const [label, values] of [
  ['topic id', R16_CANONICAL_TOPIC_OWNERSHIP.map((entry) => entry.id)],
  ['query intent', R16_CANONICAL_TOPIC_OWNERSHIP.map((entry) => String(entry.queryIntent || '').trim().toLowerCase())],
]) {
  if (new Set(values).size !== values.length) add('duplicate-owner', label, `R16 canonical ownership contains duplicate ${label}.`);
}

const sourceIds = R16_READING_SEMANTIC_JOURNEYS.map((entry) => entry.sourceTopicId);
if (new Set(sourceIds).size !== sourceIds.length) add('duplicate-source', 'r16-journeys', 'Journey source topic IDs must be unique.');
for (const journey of R16_READING_SEMANTIC_JOURNEYS) {
  if (!getR16CanonicalTopicOwnerPath(journey.sourceTopicId)) add('unknown-source', journey.sourceTopicId, 'Journey source must resolve through R16 canonical ownership.');
  if (!journey.links.length || journey.links.length > 4) add('journey-size', journey.sourceTopicId, `Journey has ${journey.links.length} links; expected 1-4.`);
  const targets = journey.links.map((link) => link.targetTopicId);
  if (new Set(targets).size !== targets.length) add('duplicate-target', journey.sourceTopicId, 'Journey contains duplicate semantic destinations.');
  const commercial = journey.links.filter((link) => ['assessment', 'programme'].includes(link.relation));
  if (commercial.length > 1) add('commercial-overload', journey.sourceTopicId, 'Journey may contain at most one commercial/conversion destination.');
  for (const link of journey.links) if (!getR16CanonicalTopicOwnerPath(link.targetTopicId)) add('unknown-target', journey.sourceTopicId, link.targetTopicId);
}

const expectedNewPaths = [
  '/blog/phonological-awareness-vs-phonemic-awareness-vs-phonics',
  '/blog/how-vocabulary-supports-reading-comprehension',
  '/blog/how-children-recognise-words-automatically-after-phonics',
];
for (const pathname of expectedNewPaths) {
  const links = getReadingSemanticInternalLinksForPath(pathname, { excludeRelations: ['assessment', 'programme'] });
  if (links.length < 3) add('thin-new-journey', pathname, `Expected at least 3 educational links, found ${links.length}.`);
}

const bridgePath = '/blog/phonics-comprehension';
const diagnosticPath = '/blog/why-child-reads-words-but-does-not-understand-story';
const bridgeLinks = getReadingSemanticInternalLinksForPath(bridgePath);
const diagnosticLinks = getReadingSemanticInternalLinksForPath(diagnosticPath);
if (!bridgeLinks.some((link) => link.to === '/blog/how-vocabulary-supports-reading-comprehension')) add('bridge-missing-vocabulary', bridgePath, 'Comprehension bridge must link to the R15 vocabulary owner.');
if (!diagnosticLinks.some((link) => link.to === bridgePath)) add('diagnostic-missing-bridge', diagnosticPath, 'Story diagnostic must link to the comprehension teaching bridge.');

const legacyBlending = getReadingSemanticInternalLinksForPath('/blog/how-kids-learn-blending').map((link) => [link.relation, link.to]);
const expectedLegacyBlending = [
  ['prerequisite', '/blog/satpin-phonics-guide'],
  ['next', '/blog/cvc-words-explained-for-parents'],
  ['practice', '/blog/phonics-blending-activities'],
  ['diagnostic', '/blog/why-child-knows-letter-sounds-but-cannot-read-words'],
];
if (JSON.stringify(legacyBlending) !== JSON.stringify(expectedLegacyBlending)) add('legacy-r6-regression', 'phonics-blending-progression', 'R16 must preserve the unaffected Brick 6 blending journey exactly.');

const nextGraph = new Map(R16_READING_SEMANTIC_JOURNEYS.map((journey) => [journey.sourceTopicId, journey.links.filter((link) => link.relation === 'next').map((link) => link.targetTopicId)]));
const visiting = new Set();
const visited = new Set();
function visit(id) {
  if (visiting.has(id)) return false;
  if (visited.has(id)) return true;
  visiting.add(id);
  for (const target of nextGraph.get(id) || []) if (!visit(target)) return false;
  visiting.delete(id);
  visited.add(id);
  return true;
}
for (const id of nextGraph.keys()) if (!visit(id)) add('next-cycle', id, 'Directed next-step relationships must remain acyclic.');

const pathwayFile = path.join(root, 'src/components/blog/BlogSemanticPathway.tsx');
const pathwaySource = fs.readFileSync(pathwayFile, 'utf8');
if (!pathwaySource.includes('getReadingSemanticInternalLinksForPath')) add('runtime-adapter-missing', 'BlogSemanticPathway', 'Blog pathway must use the R16 additive adapter.');
if (pathwaySource.includes("from '../../lib/semanticInternalLinkRegistry.js'")) add('legacy-direct-import', 'BlogSemanticPathway', 'Runtime must not bypass the R16 adapter with a direct Brick 6 import.');
if (!pathwaySource.includes("excludeRelations: ['assessment', 'programme']")) add('commercial-ui-boundary', 'BlogSemanticPathway', 'Educational pathway must continue excluding assessment/programme links.');

function distHtmlPath(pathname) {
  const clean = pathname.replace(/^\/+|\/+$/g, '');
  return path.join(root, 'dist', clean, 'index.html');
}

if (distMode) {
  const renderedExpectations = [
    [expectedNewPaths[0], ['/blog/what-is-phonics-for-kids', '/blog/how-kids-learn-blending', '/free-letter-sound-games-for-kids']],
    [expectedNewPaths[1], ['/blog/phonics-comprehension', diagnosticPath]],
    [expectedNewPaths[2], ['/blog/cvc-words-explained-for-parents', '/blog/how-to-improve-reading-fluency-in-children']],
    [bridgePath, ['/blog/how-vocabulary-supports-reading-comprehension', diagnosticPath]],
    [diagnosticPath, ['/blog/how-vocabulary-supports-reading-comprehension', bridgePath]],
  ];
  for (const [pathname, hrefs] of renderedExpectations) {
    const file = distHtmlPath(pathname);
    if (!fs.existsSync(file)) {
      add('missing-rendered-page', pathname, path.relative(root, file));
      continue;
    }
    const html = fs.readFileSync(file, 'utf8');
    if (!html.includes('data-semantic-internal-links="true"')) add('missing-rendered-journey', pathname, 'Rendered article must contain the semantic pathway.');
    for (const href of hrefs) if (!html.includes(`href="${href}"`)) add('missing-rendered-link', pathname, href);
    if (html.includes('href="/book-demo"') && pathname === diagnosticPath) warnings.push(`${pathname} contains /book-demo elsewhere on the page; R16 semantic pathway still excludes commercial relations by component contract.`);
  }
}

const summary = {
  revision: READING_SEMANTIC_JOURNEY_REVISION,
  additiveExistingOwners: R16_READING_EXISTING_CANONICAL_TOPIC_OWNERSHIP.length,
  canonicalOwners: R16_CANONICAL_TOPIC_OWNERSHIP.length,
  readingJourneys: R16_READING_SEMANTIC_JOURNEYS.length,
  semanticEdges: R16_READING_SEMANTIC_JOURNEYS.reduce((sum, journey) => sum + journey.links.length, 0),
  dist: distMode,
};
const result = { summary, errors, warnings };
console.log(JSON.stringify(result, null, 2));
if (process.argv.includes('--report')) {
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/resources-r16-reading-semantic-journeys.json'), `${JSON.stringify(result, null, 2)}\n`);
}
if (errors.length) process.exitCode = 1;
else console.log(`PASS: R16 adds ${summary.readingJourneys} focused reading journeys and ${summary.additiveExistingOwners} missing comprehension owners without changing the historical Brick 6 graph.`);
