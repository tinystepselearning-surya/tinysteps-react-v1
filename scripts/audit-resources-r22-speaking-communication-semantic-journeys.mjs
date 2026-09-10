#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { CANONICAL_TOPIC_OWNERSHIP } from '../src/lib/canonicalTopicOwnershipRegistry.js';
import { R21_CANONICAL_TOPIC_OWNERSHIP } from '../src/lib/speakingCommunicationContentCanonicalOwnership.js';
import {
  R22_CANONICAL_TOPIC_OWNERSHIP,
  R22_SPEAKING_COMMUNICATION_EXISTING_CANONICAL_TOPIC_OWNERSHIP,
  getR22CanonicalTopicOwnerPath,
} from '../src/lib/speakingCommunicationSemanticCanonicalOwnership.js';
import {
  SPEAKING_COMMUNICATION_SEMANTIC_JOURNEY_REVISION,
  R22_SPEAKING_COMMUNICATION_SEMANTIC_JOURNEYS,
  getSpeakingCommunicationSemanticInternalLinksForPath,
} from '../src/lib/speakingCommunicationSemanticJourneyGraph.js';
import { getSpeakingCommunicationContentAuditByAction } from '../src/lib/speakingCommunicationKnowledgeArchitecture.js';

const root = process.cwd();
const distMode = process.argv.includes('--dist');
const errors = [];
const warnings = [];
const add = (code, id, detail) => errors.push({ code, id, detail });

const expectedOwners = Object.freeze({
  'speech-structure-guide': '/blog/speaking-structure',
  'speaking-visual-aids-guide': '/blog/speaking-visual-aids',
  'speaking-debate-guide': '/blog/speaking-debate-starters',
  'speaking-video-feedback-guide': '/blog/speaking-video-feedback',
  'speaking-competition-preparation-guide': '/blog/speaking-competition-prep',
  'speaking-family-showcase-practice': '/blog/speaking-family-showcase',
  'story-card-speaking-bridge': '/blog/grammar-speaking-bridge',
});

if (R22_SPEAKING_COMMUNICATION_EXISTING_CANONICAL_TOPIC_OWNERSHIP.length !== 7) add('owner-count', 'r22-owners', `Expected 7 additive established owners, found ${R22_SPEAKING_COMMUNICATION_EXISTING_CANONICAL_TOPIC_OWNERSHIP.length}.`);
if (R22_CANONICAL_TOPIC_OWNERSHIP.length !== R21_CANONICAL_TOPIC_OWNERSHIP.length + 7) add('owner-view-size', 'r22-owners', 'R22 must be exactly R21 ownership plus 7 established speaking owners.');
if (R22_SPEAKING_COMMUNICATION_SEMANTIC_JOURNEYS.length !== 8) add('journey-count', 'r22-journeys', `Expected 8 focused journeys, found ${R22_SPEAKING_COMMUNICATION_SEMANTIC_JOURNEYS.length}.`);
const semanticEdges = R22_SPEAKING_COMMUNICATION_SEMANTIC_JOURNEYS.reduce((sum, journey) => sum + journey.links.length, 0);
if (semanticEdges !== 32) add('edge-count', 'r22-journeys', `Expected 32 focused semantic edges, found ${semanticEdges}.`);

for (const [label, values] of [
  ['topic id', R22_CANONICAL_TOPIC_OWNERSHIP.map((entry) => entry.id)],
  ['query intent', R22_CANONICAL_TOPIC_OWNERSHIP.map((entry) => String(entry.queryIntent || '').trim().toLowerCase())],
]) {
  if (new Set(values).size !== values.length) add('duplicate-owner', label, `R22 canonical ownership contains duplicate ${label}.`);
}

for (const owner of R22_SPEAKING_COMMUNICATION_EXISTING_CANONICAL_TOPIC_OWNERSHIP) {
  if (expectedOwners[owner.id] !== owner.ownerPath) add('owner-path-mismatch', owner.id, `Expected ${expectedOwners[owner.id]}, got ${owner.ownerPath}.`);
  if (owner.subject !== 'speaking-communication') add('owner-subject', owner.id, owner.subject);
  if (owner.hubPath !== '/resources/speaking') add('owner-hub', owner.id, owner.hubPath);
  if (!['informational', 'practice'].includes(owner.intent)) add('owner-intent', owner.id, owner.intent);
}

const sourceIds = R22_SPEAKING_COMMUNICATION_SEMANTIC_JOURNEYS.map((entry) => entry.sourceTopicId);
if (new Set(sourceIds).size !== sourceIds.length) add('duplicate-source', 'r22-journeys', 'Journey source topic IDs must be unique.');
for (const journey of R22_SPEAKING_COMMUNICATION_SEMANTIC_JOURNEYS) {
  if (!getR22CanonicalTopicOwnerPath(journey.sourceTopicId)) add('unknown-source', journey.sourceTopicId, 'Journey source must resolve through R22 canonical ownership.');
  if (journey.links.length !== 4) add('journey-size', journey.sourceTopicId, `Journey has ${journey.links.length} links; expected exactly 4 focused edges.`);
  const targets = journey.links.map((link) => link.targetTopicId);
  if (new Set(targets).size !== targets.length) add('duplicate-target', journey.sourceTopicId, 'Journey contains duplicate semantic destinations.');
  const commercial = journey.links.filter((link) => ['assessment', 'programme'].includes(link.relation));
  if (commercial.length > 1) add('commercial-overload', journey.sourceTopicId, 'Journey may contain at most one assessment/programme destination.');
  for (const link of journey.links) if (!getR22CanonicalTopicOwnerPath(link.targetTopicId)) add('unknown-target', journey.sourceTopicId, link.targetTopicId);
}

const educationalOptions = { excludeRelations: ['assessment', 'programme'] };
const expectedResolved = [
  ['/blog/conversation-skills-for-kids', [
    '/blog/child-gives-one-word-answers',
    '/blog/speaking-confidence-seeds',
    '/blog/speaking-debate-starters',
    '/blog/speaking-family-showcase',
  ]],
  ['/blog/how-to-teach-storytelling-to-kids', [
    '/blog/child-gives-one-word-answers',
    '/blog/speaking-structure',
    '/blog/grammar-speaking-bridge',
    '/blog/speaking-family-showcase',
  ]],
  ['/blog/speaking-structure', [
    '/blog/how-to-teach-storytelling-to-kids',
    '/blog/public-speaking-delivery-for-kids',
    '/blog/speaking-visual-aids',
    '/blog/speaking-video-feedback',
  ]],
  ['/blog/public-speaking-delivery-for-kids', [
    '/blog/speaking-structure',
    '/blog/speaking-confidence-seeds',
    '/blog/speaking-video-feedback',
    '/blog/speaking-competition-prep',
  ]],
];
for (const [pathname, expected] of expectedResolved) {
  const actual = getSpeakingCommunicationSemanticInternalLinksForPath(pathname, educationalOptions).map((link) => link.to);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) add('resolved-journey-mismatch', pathname, `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}.`);
}

const oneWord = getSpeakingCommunicationSemanticInternalLinksForPath('/blog/child-gives-one-word-answers', educationalOptions);
for (const target of ['/blog/conversation-skills-for-kids', '/blog/how-to-teach-storytelling-to-kids', '/blog/child-understands-english-but-does-not-speak']) {
  if (!oneWord.some((link) => link.to === target)) add('response-expansion-gap', '/blog/child-gives-one-word-answers', target);
}
const oneWordVisible = getSpeakingCommunicationSemanticInternalLinksForPath('/blog/child-gives-one-word-answers', { ...educationalOptions, limit: 4 }).map((link) => link.to);
if (JSON.stringify(oneWordVisible) !== JSON.stringify([
  '/blog/conversation-skills-for-kids',
  '/blog/how-to-teach-storytelling-to-kids',
  '/blog/child-understands-english-but-does-not-speak',
  '/free-speaking-games-for-kids',
])) add('r22-precedence', '/blog/child-gives-one-word-answers', `R22 focused journey must occupy the four visible slots; got ${JSON.stringify(oneWordVisible)}.`);

const expectedLegacyBlending = [
  ['prerequisite', '/blog/satpin-phonics-guide'],
  ['next', '/blog/cvc-words-explained-for-parents'],
  ['practice', '/blog/phonics-blending-activities'],
  ['diagnostic', '/blog/why-child-knows-letter-sounds-but-cannot-read-words'],
];
const actualLegacyBlending = getSpeakingCommunicationSemanticInternalLinksForPath('/blog/how-kids-learn-blending').map((link) => [link.relation, link.to]);
if (JSON.stringify(actualLegacyBlending) !== JSON.stringify(expectedLegacyBlending)) add('upstream-reading-regression', 'phonics-blending-progression', 'R22 must preserve unaffected Brick 6/R16 reading output exactly.');

const expectedPunctuation = [
  '/blog/how-to-improve-sentence-formation-in-kids',
  '/blog/grammar-nouns-to-paragraphs',
  '/blog/grammar-editing-camp',
  '/free-grammar-games-for-kids',
];
const actualPunctuation = getSpeakingCommunicationSemanticInternalLinksForPath('/blog/punctuation-and-capital-letters-for-kids', educationalOptions).map((link) => link.to);
if (JSON.stringify(actualPunctuation) !== JSON.stringify(expectedPunctuation)) add('upstream-grammar-regression', 'punctuation-capitalisation-guide', 'R22 must preserve unaffected R19 grammar output exactly.');

const nextGraph = new Map(R22_SPEAKING_COMMUNICATION_SEMANTIC_JOURNEYS.map((journey) => [journey.sourceTopicId, journey.links.filter((link) => link.relation === 'next').map((link) => link.targetTopicId)]));
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

const canonicalById = new Map(CANONICAL_TOPIC_OWNERSHIP.map((entry) => [entry.id, entry]));
for (const [id, expected] of [
  ['speaking-subject-discovery', ['/resources/speaking', 'informational']],
  ['live-public-speaking-classes', ['/speaking', 'high-commercial']],
  ['spoken-english-classes', ['/spoken-english-classes-for-kids-online', 'commercial']],
]) {
  const owner = canonicalById.get(id);
  if (!owner || owner.ownerPath !== expected[0] || owner.intent !== expected[1]) add('commercial-owner-drift', id, JSON.stringify(owner));
}
const legacy = getSpeakingCommunicationContentAuditByAction('consolidate')[0];
if (!legacy || legacy.path !== '/blog/spoken-english-classes-for-kids-confidence' || legacy.consolidationTarget !== '/blog/speaking-confidence-seeds' || legacy.implementationState !== 'hold' || legacy.urlChangeAuthorized || legacy.publicationApproved) add('legacy-hold', 'legacy-hidden-confidence-article', 'R22 must not redirect, delete or transfer the held legacy confidence URL.');

const pathwayFile = path.join(root, 'src/components/blog/BlogSemanticPathway.tsx');
const pathwaySource = fs.readFileSync(pathwayFile, 'utf8');
if (!pathwaySource.includes('getSpeakingCommunicationSemanticInternalLinksForPath')) add('runtime-adapter-missing', 'BlogSemanticPathway', 'Blog pathway must use the R22 additive adapter.');
if (pathwaySource.includes("from '../../lib/grammarWritingSemanticJourneyGraph.js'")) add('r19-direct-import', 'BlogSemanticPathway', 'Runtime should compose R19 through the R22 adapter rather than bypassing R22.');
if (pathwaySource.includes("from '../../lib/readingSemanticJourneyGraph.js'")) add('r16-direct-import', 'BlogSemanticPathway', 'Runtime should compose R16 through the downstream adapters.');
if (pathwaySource.includes("from '../../lib/semanticInternalLinkRegistry.js'")) add('legacy-direct-import', 'BlogSemanticPathway', 'Runtime must not bypass the additive adapters with a direct Brick 6 import.');
if (!pathwaySource.includes("excludeRelations: ['assessment', 'programme']")) add('commercial-ui-boundary', 'BlogSemanticPathway', 'Educational pathway must exclude assessment/programme links.');

function distHtmlPath(pathname) {
  const clean = pathname.replace(/^\/+|\/+$/g, '');
  return path.join(root, 'dist', clean, 'index.html');
}

if (distMode) {
  const renderedExpectations = [
    ['/blog/conversation-skills-for-kids', ['/blog/child-gives-one-word-answers', '/blog/speaking-debate-starters', '/blog/speaking-family-showcase']],
    ['/blog/child-gives-one-word-answers', ['/blog/conversation-skills-for-kids', '/blog/how-to-teach-storytelling-to-kids', '/blog/child-understands-english-but-does-not-speak']],
    ['/blog/how-to-teach-storytelling-to-kids', ['/blog/speaking-structure', '/blog/grammar-speaking-bridge', '/blog/speaking-family-showcase']],
    ['/blog/speaking-structure', ['/blog/how-to-teach-storytelling-to-kids', '/blog/public-speaking-delivery-for-kids', '/blog/speaking-video-feedback']],
    ['/blog/public-speaking-delivery-for-kids', ['/blog/speaking-structure', '/blog/speaking-confidence-seeds', '/blog/speaking-video-feedback']],
    ['/blog/speaking-debate-starters', ['/blog/conversation-skills-for-kids', '/blog/speaking-video-feedback']],
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
}

const summary = {
  revision: SPEAKING_COMMUNICATION_SEMANTIC_JOURNEY_REVISION,
  additiveExistingOwners: R22_SPEAKING_COMMUNICATION_EXISTING_CANONICAL_TOPIC_OWNERSHIP.length,
  canonicalOwners: R22_CANONICAL_TOPIC_OWNERSHIP.length,
  speakingJourneys: R22_SPEAKING_COMMUNICATION_SEMANTIC_JOURNEYS.length,
  semanticEdges,
  dist: distMode,
};
const result = { summary, errors, warnings };
console.log(JSON.stringify(result, null, 2));
if (process.argv.includes('--report')) {
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/resources-r22-speaking-communication-semantic-journeys.json'), `${JSON.stringify(result, null, 2)}\n`);
}
if (errors.length) process.exitCode = 1;
else console.log(`PASS: R22 adds ${summary.speakingJourneys} focused speaking/communication journeys, ${summary.semanticEdges} semantic edges and ${summary.additiveExistingOwners} established owner IDs while preserving upstream graphs and commercial ownership.`);
