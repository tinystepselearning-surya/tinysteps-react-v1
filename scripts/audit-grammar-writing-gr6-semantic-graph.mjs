#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { GRAMMAR_WRITING_SKILL_TAXONOMY } from '../src/lib/grammarWritingKnowledgeTaxonomy.js';
import {
  GRAMMAR_WRITING_TENSE_COMPARISONS,
  GRAMMAR_WRITING_TENSE_ERROR_PATTERNS,
  GRAMMAR_WRITING_TENSE_NODES,
} from '../src/lib/grammarWritingTenseArchitecture.js';
import { GRAMMAR_WRITING_WRITING_STAGES } from '../src/lib/grammarWritingWritingProgression.js';
import { GRAMMAR_WRITING_PARENT_PROBLEMS } from '../src/lib/grammarWritingParentProblemArchitecture.js';
import { GRAMMAR_WRITING_PRACTICE_UTILITIES } from '../src/lib/grammarWritingPracticeUtilities.js';
import { R19_GRAMMAR_WRITING_SEMANTIC_JOURNEYS, getGrammarWritingSemanticInternalLinksForPath } from '../src/lib/grammarWritingSemanticJourneyGraph.js';
import {
  GRAMMAR_WRITING_GR6_PRINCIPLES,
  GRAMMAR_WRITING_GR6_PUBLIC_COMPLETION_JOURNEYS,
  GRAMMAR_WRITING_GR6_PUBLIC_JOURNEYS,
  GRAMMAR_WRITING_GR6_PUBLIC_OWNERS,
  GRAMMAR_WRITING_GR6_RELATION_SEQUENCE,
  GRAMMAR_WRITING_GR6_SEMANTIC_EDGES,
  GRAMMAR_WRITING_GR6_SEMANTIC_NODES,
  GRAMMAR_WRITING_GR6_SEMANTIC_REVISION,
  getGrammarWritingGr6IncomingEdges,
  getGrammarWritingGr6OutgoingEdges,
  getGrammarWritingGr6PublicLinksForPath,
  getGrammarWritingGr6TenseJourney,
} from '../src/lib/grammarWritingGr6SemanticGraph.js';

const root = process.cwd();
const errors = [];
const warnings = [];
const addError = (code, detail) => errors.push({ code, detail });
const addWarning = (code, detail) => warnings.push({ code, detail });

const expectedNodeCounts = {
  skill: 14,
  tense: 9,
  comparison: 5,
  error: 16,
  'writing-stage': 10,
  'parent-problem': 10,
  practice: 9,
  'public-topic': 17,
};
const actualNodeCounts = Object.fromEntries(Object.keys(expectedNodeCounts).map((kind) => [kind, GRAMMAR_WRITING_GR6_SEMANTIC_NODES.filter((item) => item.kind === kind).length]));
for (const [kind, expected] of Object.entries(expectedNodeCounts)) if (actualNodeCounts[kind] !== expected) addError('node-count-drift', `${kind}:${actualNodeCounts[kind]} expected ${expected}`);
if (GRAMMAR_WRITING_GR6_SEMANTIC_NODES.length !== 90) addError('total-node-count', String(GRAMMAR_WRITING_GR6_SEMANTIC_NODES.length));
if (new Set(GRAMMAR_WRITING_GR6_SEMANTIC_NODES.map((item) => item.ref)).size !== GRAMMAR_WRITING_GR6_SEMANTIC_NODES.length) addError('duplicate-node-ref', 'semantic node refs must be unique');

for (const node of GRAMMAR_WRITING_GR6_SEMANTIC_NODES) {
  const degree = getGrammarWritingGr6OutgoingEdges(node.ref).length + getGrammarWritingGr6IncomingEdges(node.ref).length;
  if (!degree) addError('orphan-node', node.ref);
}

for (const relation of GRAMMAR_WRITING_GR6_RELATION_SEQUENCE) {
  if (!GRAMMAR_WRITING_GR6_SEMANTIC_EDGES.some((item) => item.relation === relation)) addError('missing-relation', relation);
}

for (const tense of GRAMMAR_WRITING_TENSE_NODES) {
  const journey = getGrammarWritingGr6TenseJourney(tense.id);
  if (!journey) {
    addError('missing-tense-journey', tense.id);
    continue;
  }
  if (!journey.prerequisiteRefs.length) addError('tense-prerequisite-gap', tense.id);
  if (journey.comparisonRefs.join('|') !== tense.comparisonIds.map((id) => `comparison:${id}`).join('|')) addError('tense-comparison-drift', tense.id);
  if (journey.commonErrorRefs.join('|') !== tense.commonErrorIds.map((id) => `error:${id}`).join('|')) addError('tense-error-drift', tense.id);
  if (!journey.writingApplicationRefs.length) addError('tense-writing-gap', tense.id);
  if (!journey.practiceRefs.length) addError('tense-practice-gap', tense.id);
  if (!journey.nextConceptRefs.length) addError('tense-next-gap', tense.id);
}

for (const skill of GRAMMAR_WRITING_SKILL_TAXONOMY) {
  const source = `skill:${skill.id}`;
  if (!getGrammarWritingGr6OutgoingEdges(source, 'writing-application').length) addError('skill-writing-gap', skill.id);
  if (!getGrammarWritingGr6OutgoingEdges(source, 'practice').length) addError('skill-practice-gap', skill.id);
}
for (const item of GRAMMAR_WRITING_TENSE_COMPARISONS) if (!getGrammarWritingGr6IncomingEdges(`comparison:${item.id}`, 'comparison').length) addError('comparison-orphan', item.id);
for (const item of GRAMMAR_WRITING_TENSE_ERROR_PATTERNS) if (!getGrammarWritingGr6IncomingEdges(`error:${item.id}`, 'common-error').length) addError('error-orphan', item.id);
for (const item of GRAMMAR_WRITING_WRITING_STAGES) if (!getGrammarWritingGr6IncomingEdges(`writing-stage:${item.id}`, 'writing-application').length && item.id !== 'word-choice-idea-units') addWarning('writing-stage-low-application-inbound', item.id);
for (const item of GRAMMAR_WRITING_PARENT_PROBLEMS) if (!getGrammarWritingGr6OutgoingEdges(`parent-problem:${item.id}`, 'practice').length) addError('parent-problem-practice-gap', item.id);
for (const item of GRAMMAR_WRITING_PRACTICE_UTILITIES) if (!getGrammarWritingGr6IncomingEdges(`practice:${item.id}`, 'practice').length) addError('practice-orphan', item.id);

if (R19_GRAMMAR_WRITING_SEMANTIC_JOURNEYS.length !== 8) addError('r19-journey-regression', String(R19_GRAMMAR_WRITING_SEMANTIC_JOURNEYS.length));
if (GRAMMAR_WRITING_GR6_PUBLIC_COMPLETION_JOURNEYS.length !== 9) addError('completion-journey-count', String(GRAMMAR_WRITING_GR6_PUBLIC_COMPLETION_JOURNEYS.length));
if (GRAMMAR_WRITING_GR6_PUBLIC_OWNERS.length !== 17) addError('public-owner-count', String(GRAMMAR_WRITING_GR6_PUBLIC_OWNERS.length));
if (GRAMMAR_WRITING_GR6_PUBLIC_JOURNEYS.length !== 17) addError('public-journey-count', String(GRAMMAR_WRITING_GR6_PUBLIC_JOURNEYS.length));

const ownerIds = new Set(GRAMMAR_WRITING_GR6_PUBLIC_OWNERS.map((item) => item.id));
for (const owner of GRAMMAR_WRITING_GR6_PUBLIC_OWNERS) {
  const nodeRef = `public-topic:${owner.id}`;
  if (!getGrammarWritingGr6OutgoingEdges(nodeRef).length) addError('public-owner-outgoing-orphan', owner.id);
  if (!getGrammarWritingGr6IncomingEdges(nodeRef).length) addError('public-owner-incoming-orphan', owner.id);
}
for (const journey of GRAMMAR_WRITING_GR6_PUBLIC_JOURNEYS) {
  if (!ownerIds.has(journey.sourceTopicId)) addError('unknown-public-source', journey.sourceTopicId);
  if (!journey.links.length || journey.links.length > 4) addError('public-journey-size', `${journey.sourceTopicId}:${journey.links.length}`);
  if (new Set(journey.links.map((item) => item.targetTopicId)).size !== journey.links.length) addError('public-journey-duplicate-target', journey.sourceTopicId);
  for (const link of journey.links) if (!ownerIds.has(link.targetTopicId)) addError('public-target-outside-grammar', `${journey.sourceTopicId}:${link.targetTopicId}`);
}

const historicalGrammarProgression = getGrammarWritingSemanticInternalLinksForPath('/blog/grammar-nouns-to-paragraphs').map((link) => [link.relation, link.to]);
const expectedHistoricalGrammarProgression = [
  ['next', '/blog/how-to-improve-sentence-formation-in-kids'],
  ['practice', '/free-grammar-games-for-kids'],
  ['programme', '/grammar'],
];
if (JSON.stringify(historicalGrammarProgression) !== JSON.stringify(expectedHistoricalGrammarProgression)) addError('historical-r19-output-changed', JSON.stringify(historicalGrammarProgression));

const subjectHubLinks = getGrammarWritingGr6PublicLinksForPath('/resources/grammar', { excludeRelations: ['programme'] });
for (const expected of ['/blog/grammar-nouns-to-paragraphs', '/blog/how-to-improve-sentence-formation-in-kids', '/free-grammar-games-for-kids']) {
  if (!subjectHubLinks.some((item) => item.to === expected)) addError('subject-hub-semantic-gap', expected);
}

const source = fs.readFileSync(path.join(root, 'src/lib/grammarWritingGr6SemanticGraph.js'), 'utf8');
for (const forbidden of ['proposedPath:', 'publicationApproved:', 'queryIntent:', 'canonicalOwner:', 'createRoute:', "ownerPath: '/"]) if (source.includes(forbidden)) addError('publishing-field-leak', forbidden);

for (const id of ['one-canonical-node-per-layer', 'comparison-only-when-meaningful', 'error-to-diagnosis-to-practice', 'writing-is-application', 'no-orphan-nodes-or-owners']) {
  if (!GRAMMAR_WRITING_GR6_PRINCIPLES.some((item) => item.id === id)) addError('missing-principle', id);
}

const result = {
  summary: {
    revision: GRAMMAR_WRITING_GR6_SEMANTIC_REVISION,
    semanticNodes: GRAMMAR_WRITING_GR6_SEMANTIC_NODES.length,
    semanticEdges: GRAMMAR_WRITING_GR6_SEMANTIC_EDGES.length,
    relationTypes: GRAMMAR_WRITING_GR6_RELATION_SEQUENCE.length,
    gr1Skills: GRAMMAR_WRITING_SKILL_TAXONOMY.length,
    gr2Tenses: GRAMMAR_WRITING_TENSE_NODES.length,
    gr2Comparisons: GRAMMAR_WRITING_TENSE_COMPARISONS.length,
    gr2Errors: GRAMMAR_WRITING_TENSE_ERROR_PATTERNS.length,
    gr3WritingStages: GRAMMAR_WRITING_WRITING_STAGES.length,
    gr4ParentProblems: GRAMMAR_WRITING_PARENT_PROBLEMS.length,
    gr5PracticeUtilities: GRAMMAR_WRITING_PRACTICE_UTILITIES.length,
    grammarWritingPublicOwners: GRAMMAR_WRITING_GR6_PUBLIC_OWNERS.length,
    publicJourneys: GRAMMAR_WRITING_GR6_PUBLIC_JOURNEYS.length,
    publicCompletionJourneys: GRAMMAR_WRITING_GR6_PUBLIC_COMPLETION_JOURNEYS.length,
  },
  errors,
  warnings,
};

if (process.argv.includes('--report')) {
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/grammar-writing-gr6-semantic-graph.json'), `${JSON.stringify(result, null, 2)}\n`);
}
console.log(JSON.stringify(result, null, 2));
if (errors.length) {
  console.error(`FAIL: GR6 semantic graph audit found ${errors.length} error(s).`);
  process.exit(1);
}
if (warnings.length) console.warn(`WARN: GR6 semantic graph audit found ${warnings.length} warning(s).`);
console.log(`PASS: GR6 connects ${result.summary.semanticNodes} semantic nodes and all ${result.summary.grammarWritingPublicOwners} grammar/writing public owners without changing R19 historical output.`);
