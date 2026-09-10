#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { getR19CanonicalTopicOwnerPath } from '../src/lib/grammarWritingSemanticCanonicalOwnership.js';
import { getGrammarWritingSkill } from '../src/lib/grammarWritingKnowledgeTaxonomy.js';
import {
  GRAMMAR_WRITING_TENSE_COMPARISONS,
  GRAMMAR_WRITING_TENSE_ERROR_PATTERNS,
  GRAMMAR_WRITING_TENSE_NODES,
  GRAMMAR_WRITING_TENSE_PARENT_SKILL_ID,
  GRAMMAR_WRITING_TENSE_REVISION,
  GRAMMAR_WRITING_TENSE_TEACHING_PRINCIPLES,
  getGrammarWritingTense,
} from '../src/lib/grammarWritingTenseArchitecture.js';

const root = process.cwd();
const errors = [];
const warnings = [];
const add = (code, id, detail) => errors.push({ code, id, detail });

const expectedTenseIds = [
  'simple-present',
  'simple-past',
  'simple-future-will',
  'present-continuous',
  'past-continuous',
  'future-forms',
  'present-perfect',
  'past-perfect',
  'tense-consistency-transfer',
];
const expectedComparisonIds = [
  'simple-present-vs-present-continuous',
  'simple-past-vs-past-continuous',
  'future-forms-choice',
  'present-perfect-vs-simple-past',
  'past-perfect-vs-simple-past',
];

if (getGrammarWritingSkill(GRAMMAR_WRITING_TENSE_PARENT_SKILL_ID)?.label !== 'Tenses') add('gr1-parent', 'tenses', 'GR2 must refine the existing GR1 Tenses node.');
if (JSON.stringify(GRAMMAR_WRITING_TENSE_NODES.map((item) => item.id)) !== JSON.stringify(expectedTenseIds)) add('tense-order', 'gr2', 'The nine GR2 tense/control IDs must remain stable and ordered.');
if (JSON.stringify(GRAMMAR_WRITING_TENSE_COMPARISONS.map((item) => item.id)) !== JSON.stringify(expectedComparisonIds)) add('comparison-order', 'gr2', 'The five high-value comparison IDs must remain stable and ordered.');
if (GRAMMAR_WRITING_TENSE_TEACHING_PRINCIPLES.length !== 6) add('principle-count', 'gr2', `Expected 6 teaching principles, found ${GRAMMAR_WRITING_TENSE_TEACHING_PRINCIPLES.length}.`);
if (GRAMMAR_WRITING_TENSE_ERROR_PATTERNS.length !== 16) add('error-count', 'gr2', `Expected 16 diagnostic error patterns, found ${GRAMMAR_WRITING_TENSE_ERROR_PATTERNS.length}.`);

const principleText = GRAMMAR_WRITING_TENSE_TEACHING_PRINCIPLES.map((item) => item.statement).join(' ');
if (!principleText.includes('not mechanical rules')) add('clue-word-boundary', 'gr2', 'Time clues must remain hints rather than mechanical selection rules.');
if (!principleText.includes('more than one construction')) add('future-system-boundary', 'gr2', 'Future time must remain a multi-construction system.');
if (!principleText.includes('connected speaking and writing')) add('transfer-boundary', 'gr2', 'Connected-language transfer must remain part of tense mastery.');

const forbiddenFields = ['path', 'ownerPath', 'proposedPath', 'canonicalTopicId', 'queryIntent', 'publicationApproved'];
for (const record of [...GRAMMAR_WRITING_TENSE_NODES, ...GRAMMAR_WRITING_TENSE_COMPARISONS, ...GRAMMAR_WRITING_TENSE_ERROR_PATTERNS]) {
  for (const field of forbiddenFields) if (Object.prototype.hasOwnProperty.call(record, field)) add('publication-boundary', record.id, `GR2 architecture must not define ${field}.`);
}

for (const tense of GRAMMAR_WRITING_TENSE_NODES) {
  if (!tense.childFriendlyMeaning || tense.childFriendlyMeaning.length < 80) add('thin-meaning', tense.id, 'Child-friendly meaning is too thin.');
  if (!tense.meaningUses.length) add('missing-uses', tense.id, 'Tense needs meaning/use cases.');
  if (!tense.examples.length) add('missing-examples', tense.id, 'Tense needs contextual examples.');
  if (!tense.teachingBoundary) add('missing-boundary', tense.id, 'Tense needs a teaching boundary.');
  if (!tense.writingApplications.length) add('missing-writing-application', tense.id, 'Tense must connect to writing application.');
  if (!tense.curriculumAnchors.length) add('missing-curriculum-anchor', tense.id, 'Tense must connect to the published Grammar curriculum.');
}

for (const comparison of GRAMMAR_WRITING_TENSE_COMPARISONS) {
  if (comparison.tenseIds.length < 2) add('thin-comparison', comparison.id, 'Comparison must connect at least two tense nodes.');
  if (!comparison.decisionQuestion || !comparison.distinction || !comparison.contrastExamples.length) add('incomplete-comparison', comparison.id, 'Comparison needs decision question, distinction and examples.');
}

const requiredErrorCategories = ['form', 'meaning', 'morphology', 'consistency', 'strategy', 'transfer'];
const actualErrorCategories = new Set(GRAMMAR_WRITING_TENSE_ERROR_PATTERNS.map((item) => item.category));
for (const category of requiredErrorCategories) if (!actualErrorCategories.has(category)) add('missing-error-category', category, 'GR2 diagnostic layer is incomplete.');
for (const item of GRAMMAR_WRITING_TENSE_ERROR_PATTERNS) {
  if (!item.incorrectExample || !item.correction || !item.diagnosis || !item.teachingResponse) add('incomplete-error-record', item.id, 'Error pattern must contain example, correction, diagnosis and teaching response.');
}

if (getR19CanonicalTopicOwnerPath('grammar-tenses-guide') !== '/blog/grammar-tenses') add('canonical-owner-drift', 'grammar-tenses-guide', 'Existing public tense owner must remain /blog/grammar-tenses.');

const publicGuidePath = path.join(root, 'src/content/blog/posts/grammar/week-8-grammar-tenses.ts');
if (!fs.existsSync(publicGuidePath)) add('missing-public-guide', 'grammar-tenses-guide', 'Existing tense guide source is missing.');
else {
  const publicGuide = fs.readFileSync(publicGuidePath, 'utf8');
  for (const marker of [
    'Simple present tense for kids',
    'Simple past tense for kids',
    'Future time for kids: will and going to',
    'Time words are clues, not mechanical rules',
    'HEAR → NOTICE → CHOOSE → SAY → WRITE → TRANSFER',
  ]) if (!publicGuide.includes(marker)) add('public-guide-boundary-drift', 'grammar-tenses-guide', `Missing established marker: ${marker}`);
}

const future = getGrammarWritingTense('future-forms');
if (!future?.formPatterns.includes('am/is/are going to + base verb') || !future?.formPatterns.includes('present continuous for a planned arrangement')) add('future-form-depth', 'future-forms', 'Future architecture must cover going to and present-continuous arrangements.');
if (!getGrammarWritingTense('present-perfect')?.teachingBoundary.includes('finished past time')) add('present-perfect-boundary', 'present-perfect', 'Present perfect must be explicitly distinguished from finished simple-past time.');
if (!getGrammarWritingTense('past-perfect')?.childFriendlyMeaning.includes('earlier than another past reference point')) add('past-perfect-boundary', 'past-perfect', 'Past perfect must preserve earlier-past event sequencing.');
if (!getGrammarWritingTense('tense-consistency-transfer')?.commonErrorIds.includes('controlled-practice-transfer-gap')) add('transfer-gap', 'tense-consistency-transfer', 'Controlled-practice to independent-transfer failure must remain explicit.');

const architectureSource = fs.readFileSync(path.join(root, 'src/lib/grammarWritingTenseArchitecture.js'), 'utf8');
if (architectureSource.includes("'/blog/")) add('architecture-url-leak', 'gr2', 'GR2 runtime architecture must not publish or own blog URLs.');

const summary = {
  revision: GRAMMAR_WRITING_TENSE_REVISION,
  parentSkill: GRAMMAR_WRITING_TENSE_PARENT_SKILL_ID,
  tenseNodes: GRAMMAR_WRITING_TENSE_NODES.length,
  comparisons: GRAMMAR_WRITING_TENSE_COMPARISONS.length,
  errorPatterns: GRAMMAR_WRITING_TENSE_ERROR_PATTERNS.length,
  teachingPrinciples: GRAMMAR_WRITING_TENSE_TEACHING_PRINCIPLES.length,
  canonicalPublicOwner: getR19CanonicalTopicOwnerPath('grammar-tenses-guide'),
};
const result = { summary, errors, warnings };
console.log(JSON.stringify(result, null, 2));
if (process.argv.includes('--report')) {
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/grammar-writing-gr2-tenses.json'), `${JSON.stringify(result, null, 2)}\n`);
}
if (errors.length) process.exitCode = 1;
else console.log(`PASS: GR2 expands the GR1 tense node into ${summary.tenseNodes} tense/control nodes, ${summary.comparisons} comparisons and ${summary.errorPatterns} diagnostic error patterns without creating new public owners.`);
