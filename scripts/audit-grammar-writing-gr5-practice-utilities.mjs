import fs from 'node:fs';
import path from 'node:path';
import { GRAMMAR_WRITING_SKILL_TAXONOMY } from '../src/lib/grammarWritingKnowledgeTaxonomy.js';
import { GRAMMAR_WRITING_TENSE_NODES } from '../src/lib/grammarWritingTenseArchitecture.js';
import { GRAMMAR_WRITING_WRITING_STAGES } from '../src/lib/grammarWritingWritingProgression.js';
import {
  GRAMMAR_WRITING_GR5_PRACTICE_KINDS,
  GRAMMAR_WRITING_PARENT_PROBLEMS,
} from '../src/lib/grammarWritingParentProblemArchitecture.js';
import { getR19CanonicalTopicOwner } from '../src/lib/grammarWritingSemanticCanonicalOwnership.js';
import {
  GRAMMAR_WRITING_PRACTICE_BLUEPRINTS,
  GRAMMAR_WRITING_PRACTICE_LEVELS,
  GRAMMAR_WRITING_PRACTICE_PRINCIPLES,
  GRAMMAR_WRITING_PRACTICE_REVISION,
  GRAMMAR_WRITING_PRACTICE_UTILITIES,
  getGrammarWritingPracticeUtilitiesForParentProblem,
} from '../src/lib/grammarWritingPracticeUtilities.js';

const root = process.cwd();
const errors = [];
const warnings = [];
const addError = (code, detail) => errors.push({ code, detail });
const addWarning = (code, detail) => warnings.push({ code, detail });
const sameSet = (left, right) => left.length === right.length && left.every((value) => right.includes(value));

if (GRAMMAR_WRITING_PRACTICE_UTILITIES.map((item) => item.id).join('|') !== GRAMMAR_WRITING_GR5_PRACTICE_KINDS.join('|')) addError('gr4-handoff-drift', GRAMMAR_WRITING_PRACTICE_UTILITIES.map((item) => item.id).join(','));
if (GRAMMAR_WRITING_PRACTICE_UTILITIES.length !== 9) addError('utility-count-drift', String(GRAMMAR_WRITING_PRACTICE_UTILITIES.length));
if (GRAMMAR_WRITING_PRACTICE_BLUEPRINTS.length !== 27) addError('blueprint-count-drift', String(GRAMMAR_WRITING_PRACTICE_BLUEPRINTS.length));
if (GRAMMAR_WRITING_PRACTICE_PRINCIPLES.length !== 8) addError('principle-count-drift', String(GRAMMAR_WRITING_PRACTICE_PRINCIPLES.length));
if (GRAMMAR_WRITING_PRACTICE_LEVELS.join('|') !== 'guided|independent|transfer') addError('level-order-drift', GRAMMAR_WRITING_PRACTICE_LEVELS.join(','));

const connectedProblems = new Set();
const connectedSkills = new Set();
const connectedTenses = new Set();
const connectedStages = new Set();
const publicTopicIds = new Set();

for (const item of GRAMMAR_WRITING_PRACTICE_UTILITIES) {
  for (const id of item.targetParentProblemIds) connectedProblems.add(id);
  for (const id of item.targetGr1SkillIds) connectedSkills.add(id);
  for (const id of item.targetGr2TenseIds) connectedTenses.add(id);
  for (const id of item.targetGr3WritingStageIds) connectedStages.add(id);
  for (const id of item.publicAnchorTopicIds) publicTopicIds.add(id);

  if (item.blueprints.length !== 3) addError('blueprint-depth', `${item.id}:${item.blueprints.length}`);
  if (item.blueprints.map((entry) => entry.level).join('|') !== 'guided|independent|transfer') addError('blueprint-level-order', item.id);
  if (item.scaffoldSteps.length < 3 || item.successCriteria.length < 3 || item.feedbackRules.length < 3) addError('thin-utility-contract', item.id);
  const primary = getR19CanonicalTopicOwner(item.primaryPublicTopicId);
  if (!primary || primary.intent !== 'practice') addError('invalid-primary-practice-owner', `${item.id}:${item.primaryPublicTopicId}`);
  for (const topicId of item.publicAnchorTopicIds) if (!getR19CanonicalTopicOwner(topicId)) addError('unknown-public-topic', `${item.id}:${topicId}`);
}

for (const problem of GRAMMAR_WRITING_PARENT_PROBLEMS) {
  const actual = getGrammarWritingPracticeUtilitiesForParentProblem(problem.id).map((item) => item.id);
  if (!sameSet(actual, problem.recommendedPracticeKinds)) addError('gr4-reciprocity', `${problem.id}:${actual.join(',')}`);
}
for (const skill of GRAMMAR_WRITING_SKILL_TAXONOMY) if (!connectedSkills.has(skill.id)) addError('gr1-practice-gap', skill.id);
for (const tense of GRAMMAR_WRITING_TENSE_NODES) if (!connectedTenses.has(tense.id)) addError('gr2-practice-gap', tense.id);
for (const stage of GRAMMAR_WRITING_WRITING_STAGES) if (!connectedStages.has(stage.id)) addError('gr3-practice-gap', stage.id);
for (const problem of GRAMMAR_WRITING_PARENT_PROBLEMS) if (!connectedProblems.has(problem.id)) addError('gr4-practice-gap', problem.id);

const source = fs.readFileSync(path.join(root, 'src/lib/grammarWritingPracticeUtilities.js'), 'utf8');
for (const forbidden of ['proposedPath:', 'ownerPath:', 'publicPath:', 'route:', 'publicationApproved:', "'/free-"]) if (source.includes(forbidden)) addError('publishing-field-leak', forbidden);

for (const id of ['diagnosis-drives-practice', 'guided-independent-transfer', 'meaning-before-form-choice', 'paragraphs-are-meaning-units', 'practice-layer-not-publication-layer']) {
  if (!GRAMMAR_WRITING_PRACTICE_PRINCIPLES.some((item) => item.id === id)) addError('missing-practice-principle', id);
}

for (const blueprint of GRAMMAR_WRITING_PRACTICE_BLUEPRINTS) {
  if (blueprint.requiredDataFields.length < 1) addError('blueprint-no-data', blueprint.id);
  if (blueprint.variationAxes.length < 3) addError('blueprint-low-variation', blueprint.id);
  if (!blueprint.evaluationRule || blueprint.evaluationRule.length < 25) addError('blueprint-thin-evaluation', blueprint.id);
  for (const field of blueprint.requiredDataFields) if (!blueprint.promptTemplate.includes(`{{${field}}}`)) addError('blueprint-token-missing', `${blueprint.id}:${field}`);
}

if (publicTopicIds.size < 6) addWarning('public-anchor-breadth', `Only ${publicTopicIds.size} existing public topic anchors are used.`);

const report = {
  summary: {
    revision: GRAMMAR_WRITING_PRACTICE_REVISION,
    utilities: GRAMMAR_WRITING_PRACTICE_UTILITIES.length,
    blueprints: GRAMMAR_WRITING_PRACTICE_BLUEPRINTS.length,
    levels: GRAMMAR_WRITING_PRACTICE_LEVELS.length,
    principles: GRAMMAR_WRITING_PRACTICE_PRINCIPLES.length,
    gr1SkillsConnected: connectedSkills.size,
    gr2TensesConnected: connectedTenses.size,
    gr3WritingStagesConnected: connectedStages.size,
    gr4ParentProblemsConnected: connectedProblems.size,
    publicTopicAnchors: publicTopicIds.size,
  },
  errors,
  warnings,
};

if (process.argv.includes('--report')) {
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/grammar-writing-gr5-practice-utilities.json'), `${JSON.stringify(report, null, 2)}\n`);
}

console.log(JSON.stringify(report, null, 2));
if (errors.length) {
  console.error(`FAIL: GR5 practice utility audit found ${errors.length} error(s).`);
  process.exit(1);
}
if (warnings.length) console.warn(`WARN: GR5 practice utility audit found ${warnings.length} warning(s).`);
console.log(`PASS: GR5 freezes ${GRAMMAR_WRITING_PRACTICE_UTILITIES.length} reusable utilities with ${GRAMMAR_WRITING_PRACTICE_BLUEPRINTS.length} guided/independent/transfer blueprints covering all GR1–GR4 architecture layers.`);
