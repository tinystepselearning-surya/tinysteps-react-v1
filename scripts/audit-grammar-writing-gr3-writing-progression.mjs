import fs from 'node:fs';
import path from 'node:path';
import {
  GRAMMAR_WRITING_WRITING_CURRICULUM_ANCHORS,
  GRAMMAR_WRITING_WRITING_NEXT_EDGES,
  GRAMMAR_WRITING_WRITING_PRINCIPLES,
  GRAMMAR_WRITING_WRITING_REVISION,
  GRAMMAR_WRITING_WRITING_STAGES,
  getGrammarWritingWritingStage,
} from '../src/lib/grammarWritingWritingProgression.js';
import { GRAMMAR_WRITING_SKILL_TAXONOMY } from '../src/lib/grammarWritingKnowledgeTaxonomy.js';
import { GRAMMAR_WRITING_TENSE_NODES } from '../src/lib/grammarWritingTenseArchitecture.js';
import { getR19CanonicalTopicOwner } from '../src/lib/grammarWritingSemanticCanonicalOwnership.js';

const root = process.cwd();
const errors = [];
const warnings = [];
const addError = (code, detail) => errors.push({ code, detail });
const addWarning = (code, detail) => warnings.push({ code, detail });

const expectedStageIds = [
  'word-choice-idea-units',
  'complete-sentence',
  'expanded-sentence',
  'connected-sentences',
  'focused-paragraph',
  'cohesive-paragraph',
  'descriptive-writing',
  'narrative-writing',
  'explanation-opinion-writing',
  'editing-revision-transfer',
];

if (GRAMMAR_WRITING_WRITING_STAGES.map((item) => item.id).join('|') !== expectedStageIds.join('|')) addError('stage-order-drift', GRAMMAR_WRITING_WRITING_STAGES.map((item) => item.id).join(','));
if (GRAMMAR_WRITING_WRITING_NEXT_EDGES.length !== 11) addError('edge-count-drift', String(GRAMMAR_WRITING_WRITING_NEXT_EDGES.length));
if (GRAMMAR_WRITING_WRITING_PRINCIPLES.length !== 8) addError('principle-count-drift', String(GRAMMAR_WRITING_WRITING_PRINCIPLES.length));

const genreStages = GRAMMAR_WRITING_WRITING_STAGES.filter((item) => item.stageKind === 'genre');
if (genreStages.map((item) => item.id).join('|') !== 'descriptive-writing|narrative-writing|explanation-opinion-writing') addError('genre-branch-drift', genreStages.map((item) => item.id).join(','));
if (getGrammarWritingWritingStage('editing-revision-transfer')?.prerequisiteMode !== 'any') addError('editing-entry-mode-drift', String(getGrammarWritingWritingStage('editing-revision-transfer')?.prerequisiteMode));

const coveredSkills = new Set(GRAMMAR_WRITING_WRITING_STAGES.flatMap((item) => item.requiredGr1SkillIds));
for (const skill of GRAMMAR_WRITING_SKILL_TAXONOMY) if (!coveredSkills.has(skill.id)) addError('gr1-writing-application-gap', skill.id);

const coveredTenses = new Set(GRAMMAR_WRITING_WRITING_STAGES.flatMap((item) => item.supportingGr2TenseIds));
for (const tense of GRAMMAR_WRITING_TENSE_NODES) if (!coveredTenses.has(tense.id)) addError('gr2-writing-application-gap', tense.id);

const publicTopicIds = new Set();
for (const stage of GRAMMAR_WRITING_WRITING_STAGES) {
  for (const topicId of stage.publicAnchorTopicIds) {
    publicTopicIds.add(topicId);
    if (!getR19CanonicalTopicOwner(topicId)) addError('unknown-public-topic-anchor', `${stage.id}:${topicId}`);
  }
}

const coursesSource = fs.readFileSync(path.join(root, 'src/content/courses.ts'), 'utf8');
for (const anchor of GRAMMAR_WRITING_WRITING_CURRICULUM_ANCHORS) {
  if (!coursesSource.includes(`'${anchor.lessonTitle}'`)) addError('curriculum-anchor-title-missing', `${anchor.courseSlug}:${anchor.lessonNumber}:${anchor.lessonTitle}`);
}

const architectureSource = fs.readFileSync(path.join(root, 'src/lib/grammarWritingWritingProgression.js'), 'utf8');
for (const forbidden of ['proposedPath:', 'ownerPath:', "'/blog/", 'publicationApproved:']) {
  if (architectureSource.includes(forbidden)) addError('publishing-field-leak', forbidden);
}

if (!GRAMMAR_WRITING_WRITING_PRINCIPLES.some((item) => item.id === 'paragraph-function-not-count')) addError('missing-paragraph-boundary', 'paragraph-function-not-count');
if (!GRAMMAR_WRITING_WRITING_PRINCIPLES.some((item) => item.id === 'genres-branch-after-cohesion')) addError('missing-genre-boundary', 'genres-branch-after-cohesion');
if (!GRAMMAR_WRITING_WRITING_PRINCIPLES.some((item) => item.id === 'revise-before-surface-polish')) addError('missing-revision-boundary', 'revise-before-surface-polish');

for (const stage of GRAMMAR_WRITING_WRITING_STAGES) {
  if (stage.transferCheck.length < 120) addError('thin-transfer-check', stage.id);
  if (stage.masterySignals.length !== 3) addError('mastery-signal-count', `${stage.id}:${stage.masterySignals.length}`);
  if (stage.commonBreakdowns.length !== 3) addError('breakdown-count', `${stage.id}:${stage.commonBreakdowns.length}`);
  if (stage.teachingMoves.length !== 3) addError('teaching-move-count', `${stage.id}:${stage.teachingMoves.length}`);
}

if (GRAMMAR_WRITING_WRITING_CURRICULUM_ANCHORS.length < 20) addWarning('curriculum-anchor-depth', `Only ${GRAMMAR_WRITING_WRITING_CURRICULUM_ANCHORS.length} anchors declared.`);

const report = {
  summary: {
    revision: GRAMMAR_WRITING_WRITING_REVISION,
    writingStages: GRAMMAR_WRITING_WRITING_STAGES.length,
    progressionEdges: GRAMMAR_WRITING_WRITING_NEXT_EDGES.length,
    genreBranches: genreStages.length,
    principles: GRAMMAR_WRITING_WRITING_PRINCIPLES.length,
    gr1SkillsConnected: coveredSkills.size,
    gr2TensesConnected: coveredTenses.size,
    curriculumAnchors: GRAMMAR_WRITING_WRITING_CURRICULUM_ANCHORS.length,
    publicTopicAnchors: publicTopicIds.size,
    root: 'word-choice-idea-units',
    terminal: 'editing-revision-transfer',
  },
  errors,
  warnings,
};

if (process.argv.includes('--report')) {
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/grammar-writing-gr3-writing-progression.json'), `${JSON.stringify(report, null, 2)}\n`);
}

console.log(JSON.stringify(report, null, 2));
if (errors.length) {
  console.error(`FAIL: GR3 writing progression audit found ${errors.length} error(s).`);
  process.exit(1);
}
if (warnings.length) console.warn(`WARN: GR3 writing progression audit found ${warnings.length} warning(s).`);
console.log(`PASS: GR3 connects ${GRAMMAR_WRITING_WRITING_STAGES.length} writing stages through ${GRAMMAR_WRITING_WRITING_NEXT_EDGES.length} progression edges, ${genreStages.length} parallel genre branches, all ${coveredSkills.size} GR1 skills and all ${coveredTenses.size} GR2 tense/control nodes.`);
