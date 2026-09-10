import { GRAMMAR_WRITING_KNOWLEDGE_DOMAINS } from './grammarWritingKnowledgeArchitecture.js';
import {
  GRAMMAR_WRITING_TAXONOMY_REVISION,
  GRAMMAR_WRITING_SKILL_TAXONOMY,
} from './grammarWritingKnowledgeTaxonomy.js';
import {
  GRAMMAR_WRITING_TENSE_REVISION,
  GRAMMAR_WRITING_TENSE_NODES,
  GRAMMAR_WRITING_TENSE_COMPARISONS,
  GRAMMAR_WRITING_TENSE_ERROR_PATTERNS,
} from './grammarWritingTenseArchitecture.js';
import {
  GRAMMAR_WRITING_WRITING_REVISION,
  GRAMMAR_WRITING_WRITING_STAGES,
} from './grammarWritingWritingProgression.js';
import {
  GRAMMAR_WRITING_PARENT_PROBLEM_REVISION,
  GRAMMAR_WRITING_PARENT_PROBLEMS,
  GRAMMAR_WRITING_GR5_PRACTICE_KINDS,
} from './grammarWritingParentProblemArchitecture.js';
import {
  GRAMMAR_WRITING_PRACTICE_REVISION,
  GRAMMAR_WRITING_PRACTICE_UTILITIES,
  GRAMMAR_WRITING_PRACTICE_BLUEPRINTS,
} from './grammarWritingPracticeUtilities.js';
import {
  GRAMMAR_WRITING_GR6_SEMANTIC_REVISION,
  GRAMMAR_WRITING_GR6_SEMANTIC_NODES,
  GRAMMAR_WRITING_GR6_SEMANTIC_EDGES,
  GRAMMAR_WRITING_GR6_PUBLIC_OWNERS,
  GRAMMAR_WRITING_GR6_PUBLIC_JOURNEYS,
  getGrammarWritingGr6IncomingEdges,
  getGrammarWritingGr6OutgoingEdges,
} from './grammarWritingGr6SemanticGraph.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);

export const GRAMMAR_WRITING_GR7_CLOSURE_REVISION = '2026-09-10-gr7';
export const GRAMMAR_WRITING_GR7_STATUS = 'frozen';

export const GRAMMAR_WRITING_GR7_EXPECTED_REVISIONS = freeze({
  gr1: '2026-09-10-gr1',
  gr2: '2026-09-10-gr2',
  gr3: '2026-09-10-gr3',
  gr4: '2026-09-10-gr4',
  gr5: '2026-09-10-gr5',
  gr6: '2026-09-10-gr6',
  gr7: GRAMMAR_WRITING_GR7_CLOSURE_REVISION,
});

export const GRAMMAR_WRITING_GR7_FREEZE_CRITERIA = freezeList([
  freeze({ id: 'taxonomy-complete', label: 'Taxonomy complete', requirement: 'All nine R17 grammar/writing domains are represented by the 14-node GR1 skill taxonomy with explicit prerequisite and next-skill relationships.' }),
  freeze({ id: 'tense-system-complete', label: 'Tense system complete', requirement: 'GR2 owns one coherent tense architecture with nine tense/control nodes, five meaningful comparisons and sixteen child-error patterns instead of tense-per-page duplication.' }),
  freeze({ id: 'writing-progression-complete', label: 'Writing progression complete', requirement: 'GR3 connects word and sentence control through paragraph cohesion, parallel genre applications and editing/revision transfer.' }),
  freeze({ id: 'tier1-parent-problems-covered', label: 'Tier-1 parent problems covered', requirement: 'All ten agreed GR4 parent problems map to underlying skills, writing stages, diagnostics, existing public owners and usable practice handoffs.' }),
  freeze({ id: 'practice-layer-complete', label: 'Practice layer complete', requirement: 'GR5 provides nine reusable utilities with guided, independent and transfer modes, producing twenty-seven data-driven practice blueprints.' }),
  freeze({ id: 'semantic-graph-closed', label: 'Semantic graph closed', requirement: 'GR6 connects every GR1-GR5 entity and all existing grammar/writing public owners with no orphan semantic nodes.' }),
  freeze({ id: 'canonical-ownership-stable', label: 'Canonical ownership stable', requirement: 'The closure reuses the seventeen existing grammar/writing canonical owners and does not create a thin page, duplicate search intent or competing owner.' }),
  freeze({ id: 'technical-seo-ci-green', label: 'Technical SEO and CI green', requirement: 'GR7 is frozen only after cumulative tests, audits, canonical/shadowing checks, TypeScript, production build/prerender, rendered semantic checks and SEO smoke pass on the reconciled branch head.' }),
]);

export const GRAMMAR_WRITING_GR7_COUNTS = freeze({
  r17Domains: GRAMMAR_WRITING_KNOWLEDGE_DOMAINS.length,
  gr1Skills: GRAMMAR_WRITING_SKILL_TAXONOMY.length,
  gr2Tenses: GRAMMAR_WRITING_TENSE_NODES.length,
  gr2Comparisons: GRAMMAR_WRITING_TENSE_COMPARISONS.length,
  gr2ErrorPatterns: GRAMMAR_WRITING_TENSE_ERROR_PATTERNS.length,
  gr3WritingStages: GRAMMAR_WRITING_WRITING_STAGES.length,
  gr4ParentProblems: GRAMMAR_WRITING_PARENT_PROBLEMS.length,
  gr5PracticeUtilities: GRAMMAR_WRITING_PRACTICE_UTILITIES.length,
  gr5PracticeBlueprints: GRAMMAR_WRITING_PRACTICE_BLUEPRINTS.length,
  gr6SemanticNodes: GRAMMAR_WRITING_GR6_SEMANTIC_NODES.length,
  gr6SemanticEdges: GRAMMAR_WRITING_GR6_SEMANTIC_EDGES.length,
  publicOwners: GRAMMAR_WRITING_GR6_PUBLIC_OWNERS.length,
  publicJourneys: GRAMMAR_WRITING_GR6_PUBLIC_JOURNEYS.length,
});

export const GRAMMAR_WRITING_GR7_FROZEN_PARENT_PROBLEM_IDS = freezeList([
  'knows-rules-but-does-not-use-them',
  'mixes-tenses',
  'incomplete-sentences',
  'very-short-sentences',
  'repetitive-sentence-beginnings',
  'limited-descriptive-vocabulary',
  'cannot-organise-paragraphs',
  'poor-punctuation',
  'weak-editing',
  'speaking-grammar-does-not-transfer-to-writing',
]);

export const GRAMMAR_WRITING_GR7_FROZEN_PRACTICE_KINDS = freezeList([
  'tense-comparison',
  'sentence-builder',
  'sentence-expansion',
  'error-correction',
  'punctuation-challenge',
  'editing-practice',
  'paragraph-organiser',
  'conjunction-practice',
  'tense-choice',
]);

export const GRAMMAR_WRITING_GR7_PUBLICATION_POLICY = freeze({
  informationalExpansion: 'frozen',
  thinMicroPages: 'hold',
  duplicateIntentPages: 'hold',
  newCanonicalOwners: 'evidence-required',
  practicePublication: 'separate-execution-decision',
  commercialSeoExpansion: 'separate-project',
  rule: 'Future grammar/writing expansion must start from a demonstrated user, curriculum or search-intent gap; it must not be justified only by the existence of an internal taxonomy node, error pattern or practice blueprint.',
});

export function getGrammarWritingGr7ClosureSnapshot() {
  return freeze({
    revision: GRAMMAR_WRITING_GR7_CLOSURE_REVISION,
    status: GRAMMAR_WRITING_GR7_STATUS,
    counts: GRAMMAR_WRITING_GR7_COUNTS,
    criteria: GRAMMAR_WRITING_GR7_FREEZE_CRITERIA,
    parentProblemIds: GRAMMAR_WRITING_GR7_FROZEN_PARENT_PROBLEM_IDS,
    practiceKinds: GRAMMAR_WRITING_GR7_FROZEN_PRACTICE_KINDS,
    publicOwnerIds: freezeList(GRAMMAR_WRITING_GR6_PUBLIC_OWNERS.map((item) => item.id)),
    publicationPolicy: GRAMMAR_WRITING_GR7_PUBLICATION_POLICY,
  });
}

const actualRevisions = {
  gr1: GRAMMAR_WRITING_TAXONOMY_REVISION,
  gr2: GRAMMAR_WRITING_TENSE_REVISION,
  gr3: GRAMMAR_WRITING_WRITING_REVISION,
  gr4: GRAMMAR_WRITING_PARENT_PROBLEM_REVISION,
  gr5: GRAMMAR_WRITING_PRACTICE_REVISION,
  gr6: GRAMMAR_WRITING_GR6_SEMANTIC_REVISION,
  gr7: GRAMMAR_WRITING_GR7_CLOSURE_REVISION,
};
for (const [brick, expected] of Object.entries(GRAMMAR_WRITING_GR7_EXPECTED_REVISIONS)) {
  if (actualRevisions[brick] !== expected) throw new Error(`GR7 cannot freeze with revision drift: ${brick} expected ${expected}, got ${actualRevisions[brick]}.`);
}

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
for (const [key, expected] of Object.entries(expectedCounts)) {
  if (GRAMMAR_WRITING_GR7_COUNTS[key] !== expected) throw new Error(`GR7 closure count drift: ${key} expected ${expected}, got ${GRAMMAR_WRITING_GR7_COUNTS[key]}.`);
}
if (GRAMMAR_WRITING_GR7_COUNTS.gr6SemanticEdges < GRAMMAR_WRITING_GR7_COUNTS.gr6SemanticNodes) throw new Error('GR7 semantic graph is unexpectedly sparse.');

const representedDomains = new Set(GRAMMAR_WRITING_SKILL_TAXONOMY.map((item) => item.primaryDomainId));
for (const domain of GRAMMAR_WRITING_KNOWLEDGE_DOMAINS) {
  if (!representedDomains.has(domain.id)) throw new Error(`GR7 leaves an R17 domain outside GR1: ${domain.id}.`);
}

if (GRAMMAR_WRITING_PARENT_PROBLEMS.map((item) => item.id).join('|') !== GRAMMAR_WRITING_GR7_FROZEN_PARENT_PROBLEM_IDS.join('|')) throw new Error('GR7 parent-problem scope drifted from the frozen ten Tier-1 problems.');
if (GRAMMAR_WRITING_GR5_PRACTICE_KINDS.join('|') !== GRAMMAR_WRITING_GR7_FROZEN_PRACTICE_KINDS.join('|')) throw new Error('GR7 practice vocabulary drifted from the GR4→GR5 handoff.');
if (GRAMMAR_WRITING_PRACTICE_UTILITIES.map((item) => item.id).join('|') !== GRAMMAR_WRITING_GR7_FROZEN_PRACTICE_KINDS.join('|')) throw new Error('GR7 practice implementation drifted from the frozen utility vocabulary.');

for (const problem of GRAMMAR_WRITING_PARENT_PROBLEMS) {
  if (!problem.gr1SkillIds.length || !problem.gr3WritingStageIds.length || !problem.recommendedPracticeKinds.length || !problem.publicAnchorTopicIds.length) throw new Error(`GR7 parent problem is not closed across diagnosis/practice/public ownership: ${problem.id}.`);
}
for (const utility of GRAMMAR_WRITING_PRACTICE_UTILITIES) {
  if (!utility.targetParentProblemIds.length || utility.blueprints.length !== 3) throw new Error(`GR7 practice utility is not closed across parent diagnosis and three-level practice: ${utility.id}.`);
}
for (const node of GRAMMAR_WRITING_GR6_SEMANTIC_NODES) {
  const degree = getGrammarWritingGr6IncomingEdges(node.ref).length + getGrammarWritingGr6OutgoingEdges(node.ref).length;
  if (!degree) throw new Error(`GR7 cannot freeze an orphan semantic node: ${node.ref}.`);
}

const ownerIds = GRAMMAR_WRITING_GR6_PUBLIC_OWNERS.map((item) => item.id);
const ownerPaths = GRAMMAR_WRITING_GR6_PUBLIC_OWNERS.map((item) => item.ownerPath);
if (new Set(ownerIds).size !== ownerIds.length) throw new Error('GR7 grammar/writing public owner IDs must remain unique.');
if (new Set(ownerPaths).size !== ownerPaths.length) throw new Error('GR7 grammar/writing public owner paths must remain unique.');
if (GRAMMAR_WRITING_GR7_FREEZE_CRITERIA.length !== 8) throw new Error('GR7 closure must preserve all eight freeze criteria.');
if (GRAMMAR_WRITING_GR7_STATUS !== 'frozen') throw new Error('GR7 closure status must be frozen.');
