import fs from 'node:fs';
import path from 'node:path';
import { GRAMMAR_WRITING_SKILL_TAXONOMY } from '../src/lib/grammarWritingKnowledgeTaxonomy.js';
import { GRAMMAR_WRITING_TENSE_NODES } from '../src/lib/grammarWritingTenseArchitecture.js';
import { GRAMMAR_WRITING_WRITING_STAGES } from '../src/lib/grammarWritingWritingProgression.js';
import { getR19CanonicalTopicOwner } from '../src/lib/grammarWritingSemanticCanonicalOwnership.js';
import {
  GRAMMAR_WRITING_GR5_PRACTICE_KINDS,
  GRAMMAR_WRITING_PARENT_PROBLEM_PRINCIPLES,
  GRAMMAR_WRITING_PARENT_PROBLEM_REVISION,
  GRAMMAR_WRITING_PARENT_PROBLEMS,
} from '../src/lib/grammarWritingParentProblemArchitecture.js';

const root = process.cwd();
const errors = [];
const warnings = [];
const addError = (code, detail) => errors.push({ code, detail });
const addWarning = (code, detail) => warnings.push({ code, detail });

const expectedProblemIds = [
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
];
const expectedPracticeKinds = [
  'tense-comparison',
  'sentence-builder',
  'sentence-expansion',
  'error-correction',
  'punctuation-challenge',
  'editing-practice',
  'paragraph-organiser',
  'conjunction-practice',
  'tense-choice',
];

if (GRAMMAR_WRITING_PARENT_PROBLEMS.map((item) => item.id).join('|') !== expectedProblemIds.join('|')) addError('problem-order-drift', GRAMMAR_WRITING_PARENT_PROBLEMS.map((item) => item.id).join(','));
if (GRAMMAR_WRITING_GR5_PRACTICE_KINDS.join('|') !== expectedPracticeKinds.join('|')) addError('gr5-handoff-drift', GRAMMAR_WRITING_GR5_PRACTICE_KINDS.join(','));
if (GRAMMAR_WRITING_PARENT_PROBLEM_PRINCIPLES.length !== 7) addError('principle-count-drift', String(GRAMMAR_WRITING_PARENT_PROBLEM_PRINCIPLES.length));

const direct = GRAMMAR_WRITING_PARENT_PROBLEMS.filter((item) => item.coverageMode === 'direct-existing-owner');
const supported = GRAMMAR_WRITING_PARENT_PROBLEMS.filter((item) => item.coverageMode === 'supported-by-existing-owners');
if (direct.map((item) => item.id).join('|') !== 'knows-rules-but-does-not-use-them|incomplete-sentences|speaking-grammar-does-not-transfer-to-writing') addError('direct-owner-set-drift', direct.map((item) => item.id).join(','));
if (supported.length !== 7) addError('supported-owner-count-drift', String(supported.length));

const coveredSkills = new Set(GRAMMAR_WRITING_PARENT_PROBLEMS.flatMap((item) => item.gr1SkillIds));
for (const skill of GRAMMAR_WRITING_SKILL_TAXONOMY) if (!coveredSkills.has(skill.id)) addError('gr1-parent-problem-gap', skill.id);

const coveredTenses = new Set(GRAMMAR_WRITING_PARENT_PROBLEMS.flatMap((item) => item.gr2TenseIds));
for (const tense of GRAMMAR_WRITING_TENSE_NODES) if (!coveredTenses.has(tense.id)) addError('gr2-parent-problem-gap', tense.id);

const coveredWritingStages = new Set(GRAMMAR_WRITING_PARENT_PROBLEMS.flatMap((item) => item.gr3WritingStageIds));
for (const stage of GRAMMAR_WRITING_WRITING_STAGES) if (!coveredWritingStages.has(stage.id)) addError('gr3-parent-problem-gap', stage.id);

const coveredPracticeKinds = new Set(GRAMMAR_WRITING_PARENT_PROBLEMS.flatMap((item) => item.recommendedPracticeKinds));
for (const kind of GRAMMAR_WRITING_GR5_PRACTICE_KINDS) if (!coveredPracticeKinds.has(kind)) addError('gr5-use-case-gap', kind);

const publicTopicIds = new Set();
for (const item of GRAMMAR_WRITING_PARENT_PROBLEMS) {
  if (item.observableSignals.length < 3) addError('thin-observable-signals', item.id);
  if (item.diagnosticQuestions.length < 4) addError('thin-diagnostic-questions', item.id);
  if (item.likelyBreakdowns.length < 3) addError('thin-likely-breakdowns', item.id);
  if (item.interventionSequence.length < 4) addError('thin-intervention-sequence', item.id);
  if (item.progressSignals.length < 3) addError('thin-progress-signals', item.id);
  if (item.coverageRationale.length < 100) addError('thin-coverage-rationale', item.id);
  if (!item.publicAnchorTopicIds.includes(item.primaryPublicTopicId)) addError('primary-owner-not-anchor', item.id);
  for (const topicId of item.publicAnchorTopicIds) {
    publicTopicIds.add(topicId);
    if (!getR19CanonicalTopicOwner(topicId)) addError('unknown-public-topic-anchor', `${item.id}:${topicId}`);
  }
  const primary = getR19CanonicalTopicOwner(item.primaryPublicTopicId);
  if (!primary) addError('missing-primary-owner', `${item.id}:${item.primaryPublicTopicId}`);
  if (item.coverageMode === 'direct-existing-owner' && primary?.ownerRole !== 'diagnostic-owner') addError('direct-owner-not-diagnostic', `${item.id}:${item.primaryPublicTopicId}:${primary?.ownerRole}`);
}

const incomplete = GRAMMAR_WRITING_PARENT_PROBLEMS.find((item) => item.id === 'incomplete-sentences');
const short = GRAMMAR_WRITING_PARENT_PROBLEMS.find((item) => item.id === 'very-short-sentences');
if (!incomplete?.parentObservation.includes('fragments')) addError('incomplete-boundary-missing', 'incomplete-sentences must explicitly own fragment/incomplete output.');
if (!short?.parentObservation.includes('complete sentences')) addError('short-sentence-boundary-missing', 'very-short-sentences must start from complete output.');

const ruleTransfer = GRAMMAR_WRITING_PARENT_PROBLEMS.find((item) => item.id === 'knows-rules-but-does-not-use-them');
const oralWriting = GRAMMAR_WRITING_PARENT_PROBLEMS.find((item) => item.id === 'speaking-grammar-does-not-transfer-to-writing');
if (ruleTransfer?.problemClass !== 'grammar-transfer') addError('rule-transfer-boundary-drift', String(ruleTransfer?.problemClass));
if (oralWriting?.problemClass !== 'oral-written-transfer') addError('oral-writing-boundary-drift', String(oralWriting?.problemClass));
if (!oralWriting?.firstTeachingMove.includes('SAY → HOLD → WRITE → READ BACK → COMPARE')) addError('oral-writing-bridge-missing', 'SAY → HOLD → WRITE → READ BACK → COMPARE');

const architectureSource = fs.readFileSync(path.join(root, 'src/lib/grammarWritingParentProblemArchitecture.js'), 'utf8');
for (const forbidden of ['proposedPath:', 'ownerPath:', "'/blog/", 'publicationApproved:']) {
  if (architectureSource.includes(forbidden)) addError('publishing-field-leak', forbidden);
}

if (!GRAMMAR_WRITING_PARENT_PROBLEM_PRINCIPLES.some((item) => item.id === 'reuse-existing-owners')) addError('anti-cannibalisation-principle-missing', 'reuse-existing-owners');
if (!GRAMMAR_WRITING_PARENT_PROBLEM_PRINCIPLES.some((item) => item.id === 'separate-knowledge-from-transfer')) addError('transfer-boundary-principle-missing', 'separate-knowledge-from-transfer');
if (!GRAMMAR_WRITING_PARENT_PROBLEM_PRINCIPLES.some((item) => item.id === 'separate-length-from-quality')) addError('length-quality-principle-missing', 'separate-length-from-quality');

if (publicTopicIds.size < 8) addWarning('public-owner-depth', `Only ${publicTopicIds.size} distinct existing canonical topics support GR4.`);

const report = {
  summary: {
    revision: GRAMMAR_WRITING_PARENT_PROBLEM_REVISION,
    parentProblems: GRAMMAR_WRITING_PARENT_PROBLEMS.length,
    directExistingOwners: direct.length,
    supportedByExistingOwners: supported.length,
    principles: GRAMMAR_WRITING_PARENT_PROBLEM_PRINCIPLES.length,
    gr1SkillsConnected: coveredSkills.size,
    gr2TensesConnected: coveredTenses.size,
    gr3WritingStagesConnected: coveredWritingStages.size,
    gr5PracticeKindsPrepared: coveredPracticeKinds.size,
    existingPublicTopicAnchors: publicTopicIds.size,
  },
  errors,
  warnings,
};

if (process.argv.includes('--report')) {
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/grammar-writing-gr4-parent-problems.json'), `${JSON.stringify(report, null, 2)}\n`);
}

console.log(JSON.stringify(report, null, 2));
if (errors.length) {
  console.error(`FAIL: GR4 parent-problem architecture audit found ${errors.length} error(s).`);
  process.exit(1);
}
if (warnings.length) console.warn(`WARN: GR4 parent-problem architecture audit found ${warnings.length} warning(s).`);
console.log(`PASS: GR4 maps ${GRAMMAR_WRITING_PARENT_PROBLEMS.length} Tier-1 parent problems across all ${coveredSkills.size} GR1 skills, ${coveredTenses.size} GR2 tense/control nodes, ${coveredWritingStages.size} GR3 writing stages and ${coveredPracticeKinds.size} planned GR5 practice kinds without creating new public owners.`);
