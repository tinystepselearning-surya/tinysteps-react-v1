#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  GRAMMAR_WRITING_GR7_CLOSURE_REVISION,
  GRAMMAR_WRITING_GR7_STATUS,
  GRAMMAR_WRITING_GR7_EXPECTED_REVISIONS,
  GRAMMAR_WRITING_GR7_COUNTS,
  GRAMMAR_WRITING_GR7_FREEZE_CRITERIA,
  GRAMMAR_WRITING_GR7_FROZEN_PARENT_PROBLEM_IDS,
  GRAMMAR_WRITING_GR7_FROZEN_PRACTICE_KINDS,
  GRAMMAR_WRITING_GR7_PUBLICATION_POLICY,
  getGrammarWritingGr7ClosureSnapshot,
} from '../src/lib/grammarWritingGr7Closure.js';
import { GRAMMAR_WRITING_PARENT_PROBLEMS } from '../src/lib/grammarWritingParentProblemArchitecture.js';
import { GRAMMAR_WRITING_PRACTICE_UTILITIES } from '../src/lib/grammarWritingPracticeUtilities.js';
import {
  GRAMMAR_WRITING_GR6_PUBLIC_OWNERS,
  GRAMMAR_WRITING_GR6_PUBLIC_JOURNEYS,
  GRAMMAR_WRITING_GR6_SEMANTIC_NODES,
  getGrammarWritingGr6IncomingEdges,
  getGrammarWritingGr6OutgoingEdges,
} from '../src/lib/grammarWritingGr6SemanticGraph.js';

const root = process.cwd();
const errors = [];
const warnings = [];
const addError = (code, detail) => errors.push({ code, detail });
const addWarning = (code, detail) => warnings.push({ code, detail });

const expectedCounts = {
  r17Domains: 9,
  gr1Skills: 14,
  gr2Tenses: 9,
  gr2Comparisons: 5,
  gr2ErrorPatterns: 16,
  gr3WritingStages: 10,
  gr4ParentProblems: 10,
  gr5PracticeUtilities: 9,
  gr5PracticeBlueprints: 27,
  gr6SemanticNodes: 90,
  publicOwners: 17,
  publicJourneys: 17,
};

if (GRAMMAR_WRITING_GR7_CLOSURE_REVISION !== '2026-09-10-gr7') addError('revision-drift', GRAMMAR_WRITING_GR7_CLOSURE_REVISION);
if (GRAMMAR_WRITING_GR7_STATUS !== 'frozen') addError('status-not-frozen', GRAMMAR_WRITING_GR7_STATUS);
if (GRAMMAR_WRITING_GR7_FREEZE_CRITERIA.length !== 8) addError('freeze-criteria-count', String(GRAMMAR_WRITING_GR7_FREEZE_CRITERIA.length));
for (const [key, expected] of Object.entries(expectedCounts)) {
  if (GRAMMAR_WRITING_GR7_COUNTS[key] !== expected) addError('count-drift', `${key}: expected ${expected}, got ${GRAMMAR_WRITING_GR7_COUNTS[key]}`);
}
if (GRAMMAR_WRITING_GR7_COUNTS.gr6SemanticEdges < GRAMMAR_WRITING_GR7_COUNTS.gr6SemanticNodes) addError('semantic-graph-sparse', `${GRAMMAR_WRITING_GR7_COUNTS.gr6SemanticEdges} edges for ${GRAMMAR_WRITING_GR7_COUNTS.gr6SemanticNodes} nodes`);

if (Object.keys(GRAMMAR_WRITING_GR7_EXPECTED_REVISIONS).join('|') !== 'gr1|gr2|gr3|gr4|gr5|gr6|gr7') addError('revision-chain-shape', Object.keys(GRAMMAR_WRITING_GR7_EXPECTED_REVISIONS).join(','));
if (GRAMMAR_WRITING_PARENT_PROBLEMS.map((item) => item.id).join('|') !== GRAMMAR_WRITING_GR7_FROZEN_PARENT_PROBLEM_IDS.join('|')) addError('parent-problem-scope-drift', GRAMMAR_WRITING_PARENT_PROBLEMS.map((item) => item.id).join(','));
if (GRAMMAR_WRITING_PRACTICE_UTILITIES.map((item) => item.id).join('|') !== GRAMMAR_WRITING_GR7_FROZEN_PRACTICE_KINDS.join('|')) addError('practice-scope-drift', GRAMMAR_WRITING_PRACTICE_UTILITIES.map((item) => item.id).join(','));

for (const problem of GRAMMAR_WRITING_PARENT_PROBLEMS) {
  if (!problem.gr1SkillIds.length || !problem.gr3WritingStageIds.length || !problem.recommendedPracticeKinds.length || !problem.publicAnchorTopicIds.length) addError('parent-problem-not-closed', problem.id);
}
for (const utility of GRAMMAR_WRITING_PRACTICE_UTILITIES) {
  if (!utility.targetParentProblemIds.length || utility.blueprints.length !== 3) addError('practice-not-closed', utility.id);
}
for (const node of GRAMMAR_WRITING_GR6_SEMANTIC_NODES) {
  const degree = getGrammarWritingGr6IncomingEdges(node.ref).length + getGrammarWritingGr6OutgoingEdges(node.ref).length;
  if (!degree) addError('orphan-semantic-node', node.ref);
}
for (const owner of GRAMMAR_WRITING_GR6_PUBLIC_OWNERS) {
  const ref = `public-topic:${String(owner.id)}`;
  if (!getGrammarWritingGr6IncomingEdges(ref).length) addError('public-owner-no-inbound', String(owner.id));
  if (!getGrammarWritingGr6OutgoingEdges(ref).length) addError('public-owner-no-outbound', String(owner.id));
}
if (GRAMMAR_WRITING_GR6_PUBLIC_JOURNEYS.length !== GRAMMAR_WRITING_GR6_PUBLIC_OWNERS.length) addError('public-journey-owner-gap', `${GRAMMAR_WRITING_GR6_PUBLIC_JOURNEYS.length}/${GRAMMAR_WRITING_GR6_PUBLIC_OWNERS.length}`);

const ownerIds = GRAMMAR_WRITING_GR6_PUBLIC_OWNERS.map((item) => item.id);
const ownerPaths = GRAMMAR_WRITING_GR6_PUBLIC_OWNERS.map((item) => item.ownerPath);
const ownerIntents = GRAMMAR_WRITING_GR6_PUBLIC_OWNERS.map((item) => String(item.queryIntent || '').trim().toLowerCase());
if (new Set(ownerIds).size !== ownerIds.length) addError('duplicate-public-owner-id', ownerIds.join(','));
if (new Set(ownerPaths).size !== ownerPaths.length) addError('duplicate-public-owner-path', ownerPaths.join(','));
if (new Set(ownerIntents).size !== ownerIntents.length) addError('duplicate-public-owner-intent', ownerIntents.join(','));

if (GRAMMAR_WRITING_GR7_PUBLICATION_POLICY.informationalExpansion !== 'frozen') addError('information-expansion-not-frozen', GRAMMAR_WRITING_GR7_PUBLICATION_POLICY.informationalExpansion);
if (GRAMMAR_WRITING_GR7_PUBLICATION_POLICY.thinMicroPages !== 'hold') addError('thin-page-policy-drift', GRAMMAR_WRITING_GR7_PUBLICATION_POLICY.thinMicroPages);
if (GRAMMAR_WRITING_GR7_PUBLICATION_POLICY.duplicateIntentPages !== 'hold') addError('duplicate-intent-policy-drift', GRAMMAR_WRITING_GR7_PUBLICATION_POLICY.duplicateIntentPages);

const gr7Source = fs.readFileSync(path.join(root, 'src/lib/grammarWritingGr7Closure.js'), 'utf8');
for (const forbidden of ['proposedPath:', 'createRoute:', 'publicationApproved:', "ownerPath: '/", 'sitemapPath:']) {
  if (gr7Source.includes(forbidden)) addError('publication-layer-leak', forbidden);
}

const workflowPath = path.join(root, '.github/workflows/gr7-grammar-writing-closure.yml');
if (!fs.existsSync(workflowPath)) addError('closure-workflow-missing', '.github/workflows/gr7-grammar-writing-closure.yml');
else {
  const workflow = fs.readFileSync(workflowPath, 'utf8');
  const requiredFragments = [
    'grammarWritingGr7Closure.spec.ts',
    'audit-grammar-writing-gr1-taxonomy.mjs --report',
    'audit-grammar-writing-gr2-tenses.mjs --report',
    'audit-grammar-writing-gr3-writing-progression.mjs --report',
    'audit-grammar-writing-gr4-parent-problems.mjs --report',
    'audit-grammar-writing-gr5-practice-utilities.mjs --report',
    'audit-grammar-writing-gr6-semantic-graph.mjs --report',
    'audit-grammar-writing-gr7-closure.mjs --report',
    'audit-canonical-topic-ownership.mjs',
    'check-shadowing.mjs',
    'npm run typecheck',
    'npm run build',
    'audit-resources-r19-grammar-writing-semantic-journeys.mjs --dist --report',
    'npm run seo:smoke',
  ];
  for (const fragment of requiredFragments) if (!workflow.includes(fragment)) addError('closure-workflow-gap', fragment);
}

const snapshot = getGrammarWritingGr7ClosureSnapshot();
if (snapshot.status !== 'frozen' || snapshot.publicOwnerIds.length !== 17 || snapshot.criteria.length !== 8) addError('closure-snapshot-drift', JSON.stringify({ status: snapshot.status, owners: snapshot.publicOwnerIds.length, criteria: snapshot.criteria.length }));
if (GRAMMAR_WRITING_GR7_COUNTS.gr6SemanticEdges < 200) addWarning('semantic-edge-breadth', `GR6 graph has ${GRAMMAR_WRITING_GR7_COUNTS.gr6SemanticEdges} edges; review only if future architecture shrinks materially.`);

const report = {
  summary: {
    revision: GRAMMAR_WRITING_GR7_CLOSURE_REVISION,
    status: GRAMMAR_WRITING_GR7_STATUS,
    freezeCriteria: GRAMMAR_WRITING_GR7_FREEZE_CRITERIA.length,
    ...GRAMMAR_WRITING_GR7_COUNTS,
    parentProblemsFrozen: GRAMMAR_WRITING_GR7_FROZEN_PARENT_PROBLEM_IDS.length,
    practiceKindsFrozen: GRAMMAR_WRITING_GR7_FROZEN_PRACTICE_KINDS.length,
    informationalExpansion: GRAMMAR_WRITING_GR7_PUBLICATION_POLICY.informationalExpansion,
  },
  errors,
  warnings,
};

if (process.argv.includes('--report')) {
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/grammar-writing-gr7-closure.json'), `${JSON.stringify(report, null, 2)}\n`);
}

console.log(JSON.stringify(report, null, 2));
if (errors.length) {
  console.error(`FAIL: GR7 closure audit found ${errors.length} error(s).`);
  process.exit(1);
}
if (warnings.length) console.warn(`WARN: GR7 closure audit found ${warnings.length} warning(s).`);
console.log('PASS: GR7 freezes the completed Grammar & Writing knowledge/practice/semantic architecture with canonical ownership and technical validation delegated to the cumulative closure workflow.');
