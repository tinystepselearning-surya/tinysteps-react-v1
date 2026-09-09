#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { R18_CANONICAL_TOPIC_OWNERSHIP } from '../src/lib/grammarWritingContentCanonicalOwnership.js';
import {
  R19_CANONICAL_TOPIC_OWNERSHIP,
  R19_GRAMMAR_WRITING_EXISTING_CANONICAL_TOPIC_OWNERSHIP,
  getR19CanonicalTopicOwnerPath,
} from '../src/lib/grammarWritingSemanticCanonicalOwnership.js';
import {
  GRAMMAR_WRITING_SEMANTIC_JOURNEY_REVISION,
  R19_GRAMMAR_WRITING_SEMANTIC_JOURNEYS,
  getGrammarWritingSemanticInternalLinksForPath,
} from '../src/lib/grammarWritingSemanticJourneyGraph.js';

const root = process.cwd();
const distMode = process.argv.includes('--dist');
const errors = [];
const warnings = [];
const add = (code, id, detail) => errors.push({ code, id, detail });

const expectedOwners = Object.freeze({
  'grammar-tenses-guide': '/blog/grammar-tenses',
  'subject-verb-agreement-guide': '/blog/grammar-subject-verb',
  'conjunctions-guide': '/blog/grammar-conjunctions',
  'creative-writing-guide': '/blog/grammar-creative-writing',
  'grammar-editing-guide': '/blog/grammar-editing-camp',
  'grammar-assessment-guide': '/blog/grammar-assessment',
});

if (R19_GRAMMAR_WRITING_EXISTING_CANONICAL_TOPIC_OWNERSHIP.length !== 6) add('owner-count', 'r19-owners', `Expected 6 additive established owners, found ${R19_GRAMMAR_WRITING_EXISTING_CANONICAL_TOPIC_OWNERSHIP.length}.`);
if (R19_CANONICAL_TOPIC_OWNERSHIP.length !== R18_CANONICAL_TOPIC_OWNERSHIP.length + 6) add('owner-view-size', 'r19-owners', 'R19 must be exactly R18 ownership plus 6 established grammar/writing owners.');
if (R19_GRAMMAR_WRITING_SEMANTIC_JOURNEYS.length !== 8) add('journey-count', 'r19-journeys', `Expected 8 focused journeys, found ${R19_GRAMMAR_WRITING_SEMANTIC_JOURNEYS.length}.`);

for (const [label, values] of [
  ['topic id', R19_CANONICAL_TOPIC_OWNERSHIP.map((entry) => entry.id)],
  ['query intent', R19_CANONICAL_TOPIC_OWNERSHIP.map((entry) => String(entry.queryIntent || '').trim().toLowerCase())],
]) {
  if (new Set(values).size !== values.length) add('duplicate-owner', label, `R19 canonical ownership contains duplicate ${label}.`);
}

for (const owner of R19_GRAMMAR_WRITING_EXISTING_CANONICAL_TOPIC_OWNERSHIP) {
  if (expectedOwners[owner.id] !== owner.ownerPath) add('owner-path-mismatch', owner.id, `Expected ${expectedOwners[owner.id]}, got ${owner.ownerPath}.`);
  if (owner.subject !== 'grammar-writing') add('owner-subject', owner.id, owner.subject);
  if (owner.hubPath !== '/resources/grammar') add('owner-hub', owner.id, owner.hubPath);
}

const sourceIds = R19_GRAMMAR_WRITING_SEMANTIC_JOURNEYS.map((entry) => entry.sourceTopicId);
if (new Set(sourceIds).size !== sourceIds.length) add('duplicate-source', 'r19-journeys', 'Journey source topic IDs must be unique.');
for (const journey of R19_GRAMMAR_WRITING_SEMANTIC_JOURNEYS) {
  if (!getR19CanonicalTopicOwnerPath(journey.sourceTopicId)) add('unknown-source', journey.sourceTopicId, 'Journey source must resolve through R19 canonical ownership.');
  if (!journey.links.length || journey.links.length > 4) add('journey-size', journey.sourceTopicId, `Journey has ${journey.links.length} links; expected 1-4.`);
  const targets = journey.links.map((link) => link.targetTopicId);
  if (new Set(targets).size !== targets.length) add('duplicate-target', journey.sourceTopicId, 'Journey contains duplicate semantic destinations.');
  const commercial = journey.links.filter((link) => ['assessment', 'programme'].includes(link.relation));
  if (commercial.length > 1) add('commercial-overload', journey.sourceTopicId, 'Journey may contain at most one assessment/programme destination.');
  for (const link of journey.links) if (!getR19CanonicalTopicOwnerPath(link.targetTopicId)) add('unknown-target', journey.sourceTopicId, link.targetTopicId);
}

const punctuationPath = '/blog/punctuation-and-capital-letters-for-kids';
const paragraphPath = '/blog/how-to-teach-paragraph-writing-to-kids';
const punctuationLinks = getGrammarWritingSemanticInternalLinksForPath(punctuationPath, { excludeRelations: ['assessment', 'programme'] });
const paragraphLinks = getGrammarWritingSemanticInternalLinksForPath(paragraphPath, { excludeRelations: ['assessment', 'programme'] });
for (const [pathname, links] of [[punctuationPath, punctuationLinks], [paragraphPath, paragraphLinks]]) {
  if (links.length !== 4) add('r18-guide-journey-size', pathname, `Expected 4 educational links, found ${links.length}.`);
  if (new Set(links.map((link) => link.to)).size !== links.length) add('resolved-duplicate', pathname, 'Resolved semantic destinations must be unique.');
}
if (!punctuationLinks.some((link) => link.to === '/blog/grammar-editing-camp')) add('punctuation-missing-editing', punctuationPath, 'Punctuation guide must connect to editing practice.');
if (!paragraphLinks.some((link) => link.to === '/blog/grammar-conjunctions')) add('paragraph-missing-conjunctions', paragraphPath, 'Paragraph guide must connect to conjunction guidance.');
if (!paragraphLinks.some((link) => link.to === '/blog/grammar-creative-writing')) add('paragraph-missing-composition', paragraphPath, 'Paragraph guide must connect to creative-writing scaffolds.');

const expectedLegacyBlending = [
  ['prerequisite', '/blog/satpin-phonics-guide'],
  ['next', '/blog/cvc-words-explained-for-parents'],
  ['practice', '/blog/phonics-blending-activities'],
  ['diagnostic', '/blog/why-child-knows-letter-sounds-but-cannot-read-words'],
];
const actualLegacyBlending = getGrammarWritingSemanticInternalLinksForPath('/blog/how-kids-learn-blending').map((link) => [link.relation, link.to]);
if (JSON.stringify(actualLegacyBlending) !== JSON.stringify(expectedLegacyBlending)) add('upstream-reading-regression', 'phonics-blending-progression', 'R19 must preserve unaffected Brick 6/R16 reading output exactly.');

const expectedGrammarProgression = [
  ['next', '/blog/how-to-improve-sentence-formation-in-kids'],
  ['practice', '/free-grammar-games-for-kids'],
  ['programme', '/grammar'],
];
const actualGrammarProgression = getGrammarWritingSemanticInternalLinksForPath('/blog/grammar-nouns-to-paragraphs').map((link) => [link.relation, link.to]);
if (JSON.stringify(actualGrammarProgression) !== JSON.stringify(expectedGrammarProgression)) add('legacy-grammar-regression', 'grammar-progression', 'R19 must preserve the historical Brick 6 grammar-progression journey exactly.');

const nextGraph = new Map(R19_GRAMMAR_WRITING_SEMANTIC_JOURNEYS.map((journey) => [journey.sourceTopicId, journey.links.filter((link) => link.relation === 'next').map((link) => link.targetTopicId)]));
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
if (!pathwaySource.includes('getGrammarWritingSemanticInternalLinksForPath')) add('runtime-adapter-missing', 'BlogSemanticPathway', 'Blog pathway must use the R19 additive adapter.');
if (pathwaySource.includes("from '../../lib/semanticInternalLinkRegistry.js'")) add('legacy-direct-import', 'BlogSemanticPathway', 'Runtime must not bypass the additive adapters with a direct Brick 6 import.');
if (pathwaySource.includes("from '../../lib/readingSemanticJourneyGraph.js'")) add('r16-direct-import', 'BlogSemanticPathway', 'Runtime should compose R16 through the R19 adapter rather than bypassing R19.');
if (!pathwaySource.includes("excludeRelations: ['assessment', 'programme']")) add('commercial-ui-boundary', 'BlogSemanticPathway', 'Educational pathway must exclude assessment/programme links.');

function distHtmlPath(pathname) {
  const clean = pathname.replace(/^\/+|\/+$/g, '');
  return path.join(root, 'dist', clean, 'index.html');
}

if (distMode) {
  const renderedExpectations = [
    [punctuationPath, ['/blog/how-to-improve-sentence-formation-in-kids', '/blog/grammar-nouns-to-paragraphs', '/blog/grammar-editing-camp']],
    [paragraphPath, ['/blog/how-to-improve-sentence-formation-in-kids', '/blog/grammar-conjunctions', '/blog/grammar-creative-writing']],
    ['/blog/grammar-tenses', ['/blog/grammar-subject-verb', '/blog/child-knows-grammar-but-makes-mistakes']],
    ['/blog/grammar-conjunctions', ['/blog/how-to-improve-sentence-formation-in-kids', paragraphPath]],
    ['/blog/grammar-editing-camp', ['/blog/child-knows-grammar-but-makes-mistakes', punctuationPath]],
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
  }

  const assessmentFile = distHtmlPath('/blog/grammar-assessment');
  if (fs.existsSync(assessmentFile)) {
    const html = fs.readFileSync(assessmentFile, 'utf8');
    if (!html.includes('data-semantic-internal-links="true"')) add('missing-rendered-journey', '/blog/grammar-assessment', 'Rendered assessment guide must contain the educational semantic pathway.');
    if (!html.includes('href="/blog/child-knows-grammar-but-makes-mistakes"')) add('missing-rendered-link', '/blog/grammar-assessment', '/blog/child-knows-grammar-but-makes-mistakes');
  } else add('missing-rendered-page', '/blog/grammar-assessment', path.relative(root, assessmentFile));
}

const summary = {
  revision: GRAMMAR_WRITING_SEMANTIC_JOURNEY_REVISION,
  additiveExistingOwners: R19_GRAMMAR_WRITING_EXISTING_CANONICAL_TOPIC_OWNERSHIP.length,
  canonicalOwners: R19_CANONICAL_TOPIC_OWNERSHIP.length,
  grammarWritingJourneys: R19_GRAMMAR_WRITING_SEMANTIC_JOURNEYS.length,
  semanticEdges: R19_GRAMMAR_WRITING_SEMANTIC_JOURNEYS.reduce((sum, journey) => sum + journey.links.length, 0),
  dist: distMode,
};
const result = { summary, errors, warnings };
console.log(JSON.stringify(result, null, 2));
if (process.argv.includes('--report')) {
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/resources-r19-grammar-writing-semantic-journeys.json'), `${JSON.stringify(result, null, 2)}\n`);
}
if (errors.length) process.exitCode = 1;
else console.log(`PASS: R19 adds ${summary.grammarWritingJourneys} focused grammar/writing journeys and ${summary.additiveExistingOwners} established topic owners while preserving upstream semantic graphs.`);
