import { GRAMMAR_WRITING_SKILL_TAXONOMY, getGrammarWritingSkill } from './grammarWritingKnowledgeTaxonomy.js';
import { GRAMMAR_WRITING_TENSE_NODES, getGrammarWritingTense } from './grammarWritingTenseArchitecture.js';
import { getR19CanonicalTopicOwner } from './grammarWritingSemanticCanonicalOwnership.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);
const freezeAnchors = (values = []) => freezeList(values.map((item) => freeze({ ...item })));
const writingStage = (config) => freeze({
  ...config,
  requiredGr1SkillIds: freezeList(config.requiredGr1SkillIds),
  supportingGr2TenseIds: freezeList(config.supportingGr2TenseIds),
  prerequisiteStageIds: freezeList(config.prerequisiteStageIds),
  nextStageIds: freezeList(config.nextStageIds),
  masterySignals: freezeList(config.masterySignals),
  commonBreakdowns: freezeList(config.commonBreakdowns),
  teachingMoves: freezeList(config.teachingMoves),
  publicAnchorTopicIds: freezeList(config.publicAnchorTopicIds),
  curriculumAnchors: freezeAnchors(config.curriculumAnchors),
});

export const GRAMMAR_WRITING_WRITING_REVISION = '2026-09-10-gr3';
export const GRAMMAR_WRITING_WRITING_ROOT_ID = 'word-choice-idea-units';
export const GRAMMAR_WRITING_WRITING_TERMINAL_ID = 'editing-revision-transfer';

/**
 * GR3 turns the broad GR1 writing nodes into an explicit development graph.
 * Order is a navigation/progression aid, not a claim that every child must pass
 * through every genre in one rigid sequence. Once cohesive paragraph control is
 * secure, description, narrative and explanation/opinion are parallel writing
 * applications. Editing/revision can follow any of those genre branches.
 */
export const GRAMMAR_WRITING_WRITING_PRINCIPLES = freezeList([
  freeze({ id: 'meaning-before-length', statement: 'A longer response is not automatically better writing; secure the intended meaning and complete idea before adding more words or sentences.' }),
  freeze({ id: 'oral-rehearsal-before-load', statement: 'When planning or transcription load is high, let the child rehearse the idea or sentence orally before asking writing to carry every demand at once.' }),
  freeze({ id: 'expand-one-useful-layer', statement: 'Expand a secure sentence with one meaningful detail at a time so added complexity improves precision without destabilising the sentence core.' }),
  freeze({ id: 'connect-for-relationship', statement: 'Connect sentences and clauses only when the relationship between ideas is real; conjunctions and transitions should express meaning rather than decorate writing.' }),
  freeze({ id: 'paragraph-function-not-count', statement: 'Teach a paragraph as related sentences working around one focus, not as a compulsory fixed number of sentences or a universal five-sentence formula.' }),
  freeze({ id: 'genres-branch-after-cohesion', statement: 'Description, narrative, explanation and opinion are different purposes that branch from secure paragraph control; one genre is not a mandatory prerequisite for another.' }),
  freeze({ id: 'revise-before-surface-polish', statement: 'Revision first checks meaning, relevance, order and clarity; editing and proofreading then improve grammar, tense, punctuation, spelling and presentation.' }),
  freeze({ id: 'fresh-transfer-is-mastery', statement: 'Writing control is stronger when the child can reuse the same planning, sentence, paragraph or editing strategy on a fresh topic with reduced prompting.' }),
]);

export const GRAMMAR_WRITING_WRITING_STAGES = freezeList([
  writingStage({
    id: 'word-choice-idea-units',
    order: 1,
    label: 'Word Choice & Idea Units',
    stageKind: 'foundation',
    outputUnit: 'purposeful words and short idea-bearing phrases',
    purpose: 'Select naming, action and describing words that match the intended idea so later sentence construction starts from useful meaning rather than isolated grammar labels.',
    requiredGr1SkillIds: ['nouns-pronouns', 'verbs', 'adjectives-adverbs'],
    supportingGr2TenseIds: [],
    prerequisiteMode: 'all',
    prerequisiteStageIds: [],
    nextStageIds: ['complete-sentence'],
    masterySignals: [
      'Chooses a relevant noun or pronoun for who or what the idea is about.',
      'Chooses an action or state verb that matches the intended message.',
      'Adds a describing word only when it contributes useful meaning.',
    ],
    commonBreakdowns: [
      'Lists unrelated vocabulary without a clear idea to communicate.',
      'Uses vague or copied words because retrieval is weak under production load.',
      'Adds decorative adjectives without improving the intended meaning.',
    ],
    teachingMoves: [
      'Start from a familiar picture, event or topic and identify the key person, thing, action and detail.',
      'Contrast two possible words and ask which one communicates the intended meaning more precisely.',
      'Move quickly from selected words into an oral sentence so vocabulary does not remain an isolated labelling task.',
    ],
    transferCheck: 'Give a fresh picture or familiar topic and check whether the child can independently select useful content words that support a new idea rather than reproduce the practised vocabulary set.',
    publicAnchorTopicIds: ['grammar-progression'],
    curriculumAnchors: [
      { courseSlug: 'basic-grammar', lessonNumber: 1, lessonTitle: 'Nouns' },
      { courseSlug: 'basic-grammar', lessonNumber: 3, lessonTitle: 'Verbs' },
      { courseSlug: 'basic-grammar', lessonNumber: 4, lessonTitle: 'Adjectives' },
    ],
  }),
  writingStage({
    id: 'complete-sentence',
    order: 2,
    label: 'Complete Sentence',
    stageKind: 'sentence',
    outputUnit: 'one complete understandable sentence',
    purpose: 'Turn an intended idea into one complete sentence with a stable core, workable word order, an appropriate verb form and a visible sentence boundary.',
    requiredGr1SkillIds: ['sentence-foundations', 'nouns-pronouns', 'verbs', 'subject-verb-agreement', 'punctuation'],
    supportingGr2TenseIds: ['simple-present'],
    prerequisiteMode: 'all',
    prerequisiteStageIds: ['word-choice-idea-units'],
    nextStageIds: ['expanded-sentence'],
    masterySignals: [
      'Expresses one complete idea without an adult finishing the sentence.',
      'Keeps the main subject/action-or-state relationship understandable.',
      'Can say and then write a simple sentence without losing essential words or order.',
    ],
    commonBreakdowns: [
      'Produces a fragment because the thought is unfinished or a core element is missing.',
      'Word order becomes difficult to follow even though the relevant vocabulary is known.',
      'Can repeat a model sentence but cannot generate a fresh sentence independently.',
    ],
    teachingMoves: [
      'Rehearse one complete sentence orally before increasing writing load.',
      'Use small prompts such as who, what happened or tell me the whole idea instead of supplying the sentence.',
      'Compare a complete sentence with a fragment and ask what the reader still needs to understand.',
    ],
    transferCheck: 'Change the picture, event or question and check whether the child can create another complete sentence with less scaffolding, then preserve the same core meaning when moving from speech to writing.',
    publicAnchorTopicIds: ['sentence-formation'],
    curriculumAnchors: [
      { courseSlug: 'basic-grammar', lessonNumber: 16, lessonTitle: 'Simple Sentences' },
      { courseSlug: 'basic-grammar', lessonNumber: 17, lessonTitle: 'Sentence Formation' },
      { courseSlug: 'advanced-grammar', lessonNumber: 1, lessonTitle: 'Subject, Verb & Object' },
    ],
  }),
  writingStage({
    id: 'expanded-sentence',
    order: 3,
    label: 'Expanded Sentence',
    stageKind: 'sentence',
    outputUnit: 'one complete sentence with purposeful detail',
    purpose: 'Add useful detail about which one, what kind, where, when, how or why while preserving the original sentence core and avoiding length for its own sake.',
    requiredGr1SkillIds: ['sentence-foundations', 'adjectives-adverbs', 'articles-determiners', 'prepositions'],
    supportingGr2TenseIds: [],
    prerequisiteMode: 'all',
    prerequisiteStageIds: ['complete-sentence'],
    nextStageIds: ['connected-sentences'],
    masterySignals: [
      'Adds one relevant detail without breaking the sentence structure.',
      'Chooses where, when, how, which-one or why detail according to meaning.',
      'Can decide when an extra word or phrase does not improve the sentence.',
    ],
    commonBreakdowns: [
      'The sentence core becomes unstable when several details are requested at once.',
      'Adds strings of adjectives or adverbs that make the sentence longer but not clearer.',
      'Repeats the same expansion pattern regardless of the intended meaning.',
    ],
    teachingMoves: [
      'Begin with a short secure sentence and add only one meaningful layer at a time.',
      'Ask what new information the reader gains from the added word or phrase.',
      'Compare two expansions and choose the one that communicates the intended scene or idea more precisely.',
    ],
    transferCheck: 'Give a fresh complete sentence and ask the child to choose one useful dimension of detail independently; success means the expansion improves meaning while the original sentence remains grammatically and semantically intact.',
    publicAnchorTopicIds: ['sentence-formation', 'grammar-progression'],
    curriculumAnchors: [
      { courseSlug: 'basic-grammar', lessonNumber: 23, lessonTitle: 'Expanding Sentences' },
      { courseSlug: 'advanced-grammar', lessonNumber: 6, lessonTitle: 'Expanding a Basic Sentence' },
    ],
  }),
  writingStage({
    id: 'connected-sentences',
    order: 4,
    label: 'Connected Sentences',
    stageKind: 'sentence-connection',
    outputUnit: 'two or more related sentences or clauses with an explicit relationship',
    purpose: 'Connect related ideas through conjunctions, clause structure, reference and time meaning so writing begins to flow beyond isolated sentence production without becoming a run-on.',
    requiredGr1SkillIds: ['conjunctions', 'clauses-sentence-combining', 'tenses', 'punctuation'],
    supportingGr2TenseIds: ['simple-present', 'simple-past', 'simple-future-will'],
    prerequisiteMode: 'all',
    prerequisiteStageIds: ['expanded-sentence'],
    nextStageIds: ['focused-paragraph'],
    masterySignals: [
      'Explains whether two ideas show addition, contrast, reason, result, sequence or another clear relationship.',
      'Chooses a conjunction or sentence boundary that preserves meaning and avoids a run-on.',
      'Maintains an appropriate time frame across a short connected response.',
    ],
    commonBreakdowns: [
      'Joins every sentence with and even when another relationship is intended.',
      'Creates a run-on by connecting too many ideas without workable clause or punctuation control.',
      'Changes tense accidentally when moving from one sentence to the next.',
    ],
    teachingMoves: [
      'Place two related simple sentences side by side and identify the relationship before selecting a connector.',
      'Compare joining the ideas with keeping them as two sentences and discuss which version is clearer.',
      'Use short oral combinations before writing, then reread the full connected response for meaning and tense.',
    ],
    transferCheck: 'Give two or three fresh related ideas and check whether the child can decide independently how they should be connected, including when two separate sentences are clearer than one longer combined sentence.',
    publicAnchorTopicIds: ['conjunctions-guide', 'sentence-formation'],
    curriculumAnchors: [
      { courseSlug: 'basic-grammar', lessonNumber: 19, lessonTitle: 'Conjunctions — Part 1' },
      { courseSlug: 'basic-grammar', lessonNumber: 20, lessonTitle: 'Conjunctions — Part 2' },
      { courseSlug: 'advanced-grammar', lessonNumber: 19, lessonTitle: 'Compound Sentences' },
      { courseSlug: 'advanced-grammar', lessonNumber: 27, lessonTitle: 'Sentence Combining & Sentence Variety' },
    ],
  }),
  writingStage({
    id: 'focused-paragraph',
    order: 5,
    label: 'Focused Paragraph',
    stageKind: 'paragraph',
    outputUnit: 'several related sentences around one clear focus',
    purpose: 'Move from connected sentences to one paragraph by selecting a main focus, choosing relevant supporting details and arranging them in an order another reader can follow.',
    requiredGr1SkillIds: ['paragraph-writing', 'clauses-sentence-combining', 'punctuation', 'tenses'],
    supportingGr2TenseIds: ['tense-consistency-transfer'],
    prerequisiteMode: 'all',
    prerequisiteStageIds: ['connected-sentences'],
    nextStageIds: ['cohesive-paragraph'],
    masterySignals: [
      'Can state what the paragraph is mainly about before or after writing it.',
      'Chooses details that support the focus and removes an off-topic sentence.',
      'Places sentences in a sensible order without relying on a fixed sentence count.',
    ],
    commonBreakdowns: [
      'Writes individually correct sentences that do not belong to one larger idea.',
      'Adds unrelated details simply to reach a required number of sentences.',
      'Has a useful main idea but gives too little supporting information for the reader.',
    ],
    teachingMoves: [
      'Use FOCUS → PLAN → SAY → WRITE so the paragraph purpose is established before full drafting.',
      'Brainstorm more details than needed, then deliberately choose the strongest relevant details.',
      'Use a remove-the-off-topic-sentence activity to make relevance visible before independent paragraph writing.',
    ],
    transferCheck: 'Give a new paragraph topic and check whether the child can identify one focus, select relevant details and create a short coherent draft without depending on a memorised five-sentence template.',
    publicAnchorTopicIds: ['paragraph-writing-guide'],
    curriculumAnchors: [
      { courseSlug: 'basic-grammar', lessonNumber: 34, lessonTitle: 'Paragraph Writing' },
      { courseSlug: 'advanced-grammar', lessonNumber: 31, lessonTitle: 'Building a Powerful Paragraph' },
    ],
  }),
  writingStage({
    id: 'cohesive-paragraph',
    order: 6,
    label: 'Cohesive Paragraph',
    stageKind: 'paragraph',
    outputUnit: 'a paragraph whose sentences visibly belong and flow together',
    purpose: 'Strengthen paragraph flow through clear reference, repeated or related key ideas, purposeful connectives, logical sequence and controlled tense so the reader can follow relationships across sentences.',
    requiredGr1SkillIds: ['paragraph-writing', 'conjunctions', 'nouns-pronouns', 'tenses', 'punctuation'],
    supportingGr2TenseIds: ['tense-consistency-transfer'],
    prerequisiteMode: 'all',
    prerequisiteStageIds: ['focused-paragraph'],
    nextStageIds: ['descriptive-writing', 'narrative-writing', 'explanation-opinion-writing'],
    masterySignals: [
      'Uses pronouns or repeated key ideas without making reference unclear.',
      'Uses transitions or conjunctions only where they clarify a real relationship.',
      'Maintains a logical focus and time frame across the paragraph with fewer abrupt jumps.',
    ],
    commonBreakdowns: [
      'Each sentence is relevant but the paragraph still reads like a disconnected list.',
      'Overuses first, next, then and finally even when the paragraph is not a sequence.',
      'Pronouns, tense or topic references become unclear across sentence boundaries.',
    ],
    teachingMoves: [
      'Underline the words that help one sentence connect to the next and discuss what relationship each one signals.',
      'Reorder a paragraph and compare which sequence makes the intended meaning easiest to follow.',
      'Remove forced transitions and test whether reference, key ideas or sentence order already provide enough cohesion.',
    ],
    transferCheck: 'Give a fresh paragraph draft with relevant but weakly connected sentences and check whether the child can improve flow through reference, order or purposeful connection rather than adding the same transition word everywhere.',
    publicAnchorTopicIds: ['paragraph-writing-guide', 'conjunctions-guide'],
    curriculumAnchors: [
      { courseSlug: 'advanced-grammar', lessonNumber: 32, lessonTitle: 'Cohesion & Paragraph Flow' },
    ],
  }),
  writingStage({
    id: 'descriptive-writing',
    order: 7,
    label: 'Descriptive Writing',
    stageKind: 'genre',
    outputUnit: 'a focused description using selected details',
    purpose: 'Use precise nouns, verbs, modifiers, spatial or temporal detail and selective sensory information to help a reader picture or understand a person, place, object, scene or experience.',
    requiredGr1SkillIds: ['descriptive-narrative-writing', 'adjectives-adverbs', 'paragraph-writing', 'punctuation'],
    supportingGr2TenseIds: ['simple-present', 'present-continuous'],
    prerequisiteMode: 'all',
    prerequisiteStageIds: ['cohesive-paragraph'],
    nextStageIds: ['editing-revision-transfer'],
    masterySignals: [
      'Chooses details because they help the reader understand the subject, not because a checklist demands them.',
      'Uses precise verbs and nouns as well as adjectives to build a clearer picture.',
      'Keeps the description organised around a stable focus rather than listing unrelated features.',
    ],
    commonBreakdowns: [
      'Relies on many generic adjectives such as nice, good or beautiful without specific information.',
      'Uses a five-senses checklist mechanically even when some details are irrelevant.',
      'Jumps between unrelated features so the reader cannot see the organising focus.',
    ],
    teachingMoves: [
      'Choose one or two details that matter most to the reader instead of filling every sensory category.',
      'Replace a vague verb or noun only when a more precise choice changes the reader’s understanding.',
      'Organise description by a useful focus such as location, feature, movement or impression rather than a fixed formula.',
    ],
    transferCheck: 'Change the person, place, object or scene and check whether the child can independently choose a small set of relevant precise details and organise them into a coherent description without copying the practised wording.',
    publicAnchorTopicIds: ['creative-writing-guide', 'paragraph-writing-guide'],
    curriculumAnchors: [
      { courseSlug: 'basic-grammar', lessonNumber: 33, lessonTitle: 'Picture Description' },
      { courseSlug: 'advanced-grammar', lessonNumber: 34, lessonTitle: 'Description & Explanation' },
    ],
  }),
  writingStage({
    id: 'narrative-writing',
    order: 8,
    label: 'Narrative Writing',
    stageKind: 'genre',
    outputUnit: 'an organised event sequence or short story',
    purpose: 'Develop a sequence of events around a character, situation or problem using paragraph control, purposeful detail and deliberate tense choices so the reader can follow what changes and why.',
    requiredGr1SkillIds: ['descriptive-narrative-writing', 'tenses', 'paragraph-writing', 'clauses-sentence-combining', 'punctuation'],
    supportingGr2TenseIds: ['simple-past', 'past-continuous', 'past-perfect', 'tense-consistency-transfer'],
    prerequisiteMode: 'all',
    prerequisiteStageIds: ['cohesive-paragraph'],
    nextStageIds: ['editing-revision-transfer'],
    masterySignals: [
      'Establishes a clear event sequence that another reader can follow.',
      'Uses description, action or reaction to develop important moments instead of listing events only.',
      'Maintains a workable narrative time frame and shifts tense only when the meaning requires it.',
    ],
    commonBreakdowns: [
      'Produces a list of events with little relationship, development or clear ending.',
      'Changes tense accidentally while moving through the story.',
      'Adds dialogue or description because of a checklist rather than because it moves or clarifies the story.',
    ],
    teachingMoves: [
      'Rehearse the beginning, central problem or change, response and ending orally before drafting.',
      'Use ACTION → DETAIL → REACTION to develop one important moment without padding every sentence.',
      'Audit the time frame after drafting and distinguish purposeful flashback or earlier-past meaning from accidental tense drift.',
    ],
    transferCheck: 'Give a fresh story seed and check whether the child can plan and draft a short event sequence with a clear change or problem, readable paragraph flow and controlled tense without reproducing the previous story structure word for word.',
    publicAnchorTopicIds: ['creative-writing-guide', 'paragraph-writing-guide', 'grammar-tenses-guide'],
    curriculumAnchors: [
      { courseSlug: 'advanced-grammar', lessonNumber: 33, lessonTitle: 'Narrative Speaking & Writing' },
    ],
  }),
  writingStage({
    id: 'explanation-opinion-writing',
    order: 9,
    label: 'Explanation & Opinion Writing',
    stageKind: 'genre',
    outputUnit: 'an organised explanation or supported opinion',
    purpose: 'Explain how or why something happens, or state an opinion and support it with relevant reasons, examples or evidence, while maintaining paragraph focus and clear relationships between ideas.',
    requiredGr1SkillIds: ['paragraph-writing', 'conjunctions', 'clauses-sentence-combining', 'tenses', 'articles-determiners'],
    supportingGr2TenseIds: ['simple-present', 'simple-future-will', 'future-forms', 'present-perfect', 'tense-consistency-transfer'],
    prerequisiteMode: 'all',
    prerequisiteStageIds: ['cohesive-paragraph'],
    nextStageIds: ['editing-revision-transfer'],
    masterySignals: [
      'Keeps the explanation or opinion centred on one clear purpose or claim.',
      'Uses reasons, examples, sequence or cause-and-result relationships that genuinely support the main idea.',
      'Chooses tense and connectors according to meaning rather than using one memorised response frame for every topic.',
    ],
    commonBreakdowns: [
      'States an opinion repeatedly without adding a reason, example or evidence.',
      'Lists facts without showing how they answer the explanation question.',
      'Uses because, so, first or therefore mechanically even when the logical relationship is weak or inaccurate.',
    ],
    teachingMoves: [
      'Ask what the reader needs to understand or believe before selecting supporting details.',
      'Map claim or focus → reason → example/evidence, or cause → process → result, according to the writing purpose.',
      'Compare two connectors or tense choices and discuss which one represents the intended relationship more accurately.',
    ],
    transferCheck: 'Give a new explanation or opinion prompt and check whether the child can organise a clear focus with relevant support, choose logical connections and sustain appropriate tense without depending on a fully supplied sentence frame.',
    publicAnchorTopicIds: ['paragraph-writing-guide', 'grammar-progression', 'writing-classes'],
    curriculumAnchors: [
      { courseSlug: 'advanced-grammar', lessonNumber: 34, lessonTitle: 'Description & Explanation' },
      { courseSlug: 'advanced-grammar', lessonNumber: 35, lessonTitle: 'Opinion, Reason & Evidence' },
    ],
  }),
  writingStage({
    id: 'editing-revision-transfer',
    order: 10,
    label: 'Editing, Revision & Independent Transfer',
    stageKind: 'transfer',
    outputUnit: 'a revised and edited piece that preserves the writer’s intended meaning',
    purpose: 'Review fresh writing in stages: improve meaning, relevance, order and clarity first, then repair grammar, tense, reference and punctuation, and finally apply the same self-checking process with less adult prompting.',
    requiredGr1SkillIds: ['editing-revision', 'subject-verb-agreement', 'tenses', 'punctuation', 'paragraph-writing', 'descriptive-narrative-writing'],
    supportingGr2TenseIds: ['tense-consistency-transfer'],
    prerequisiteMode: 'any',
    prerequisiteStageIds: ['descriptive-writing', 'narrative-writing', 'explanation-opinion-writing'],
    nextStageIds: [],
    masterySignals: [
      'Separates meaning-level revision from surface editing instead of correcting everything simultaneously.',
      'Can find and repair at least some grammar, tense, punctuation or clarity problems without being told exactly where each error is.',
      'Makes purposeful improvements on a fresh piece of writing and can explain why the change helps the reader.',
    ],
    commonBreakdowns: [
      'Treats editing as spelling correction only and leaves meaning or organisation problems untouched.',
      'Can correct an error when the target is named but misses the same problem during independent rereading.',
      'Over-edits ordinary wording or adds complexity that makes the original meaning less clear.',
    ],
    teachingMoves: [
      'Use separate passes for meaning/organisation, sentence clarity, tense/grammar and punctuation rather than one overloaded checklist.',
      'Move from FIND → EXPLAIN → FIX → REREAD → TRANSFER so the child understands the repair instead of guessing.',
      'Fade prompts across fresh writing samples until the child can select the relevant editing question independently.',
    ],
    transferCheck: 'Use a fresh paragraph or short composition and check whether the child can independently reread, identify a meaningful improvement, make a justified revision or edit, and preserve the intended message with reduced teacher direction.',
    publicAnchorTopicIds: ['grammar-editing-guide', 'grammar-assessment-guide', 'grammar-transfer-mistakes'],
    curriculumAnchors: [
      { courseSlug: 'basic-grammar', lessonNumber: 35, lessonTitle: 'Overall Revision — 1' },
      { courseSlug: 'basic-grammar', lessonNumber: 36, lessonTitle: 'Overall Revision — 2' },
      { courseSlug: 'advanced-grammar', lessonNumber: 28, lessonTitle: 'Sentence Repair: Fragments, Run-ons & Awkward Sentences' },
      { courseSlug: 'advanced-grammar', lessonNumber: 36, lessonTitle: 'Final Grammar, Speaking & Writing Mastery Showcase' },
    ],
  }),
]);

const stageById = new Map(GRAMMAR_WRITING_WRITING_STAGES.map((item) => [item.id, item]));

export const GRAMMAR_WRITING_WRITING_NEXT_EDGES = freezeList(
  GRAMMAR_WRITING_WRITING_STAGES.flatMap((source) =>
    source.nextStageIds.map((targetStageId) => freeze({ sourceStageId: source.id, relation: 'next', targetStageId })),
  ),
);

export const GRAMMAR_WRITING_WRITING_CURRICULUM_ANCHORS = freezeList(
  GRAMMAR_WRITING_WRITING_STAGES.flatMap((item) => item.curriculumAnchors.map((anchor) => freeze({ stageId: item.id, ...anchor }))),
);

export const getGrammarWritingWritingStage = (id) => stageById.get(String(id || '')) ?? null;
export const getGrammarWritingWritingPrerequisites = (id) => freezeList(
  (getGrammarWritingWritingStage(id)?.prerequisiteStageIds ?? []).map((stageId) => getGrammarWritingWritingStage(stageId)).filter(Boolean),
);
export const getGrammarWritingNextWritingStages = (id) => freezeList(
  (getGrammarWritingWritingStage(id)?.nextStageIds ?? []).map((stageId) => getGrammarWritingWritingStage(stageId)).filter(Boolean),
);
export const getGrammarWritingWritingStagesForSkill = (skillId) => freezeList(
  GRAMMAR_WRITING_WRITING_STAGES.filter((item) => item.requiredGr1SkillIds.includes(String(skillId || ''))),
);
export const getGrammarWritingWritingStagesForTense = (tenseId) => freezeList(
  GRAMMAR_WRITING_WRITING_STAGES.filter((item) => item.supportingGr2TenseIds.includes(String(tenseId || ''))),
);
export const getGrammarWritingWritingStagesForPublicTopic = (topicId) => freezeList(
  GRAMMAR_WRITING_WRITING_STAGES.filter((item) => item.publicAnchorTopicIds.includes(String(topicId || ''))),
);

function canReach(startId, targetId) {
  const seen = new Set();
  const queue = [startId];
  while (queue.length) {
    const currentId = queue.shift();
    if (currentId === targetId) return true;
    if (seen.has(currentId)) continue;
    seen.add(currentId);
    for (const nextId of stageById.get(currentId)?.nextStageIds ?? []) queue.push(nextId);
  }
  return false;
}

if (stageById.size !== GRAMMAR_WRITING_WRITING_STAGES.length) throw new Error('GR3 contains duplicate writing-stage IDs.');
if (GRAMMAR_WRITING_WRITING_STAGES.map((item) => item.order).join(',') !== '1,2,3,4,5,6,7,8,9,10') throw new Error('GR3 writing-stage order must remain stable from 1 through 10.');

for (const item of GRAMMAR_WRITING_WRITING_STAGES) {
  if (!item.purpose || item.purpose.length < 100 || !item.outputUnit || !item.transferCheck || item.transferCheck.length < 120) throw new Error(`GR3 writing stage is too thin: ${item.id}.`);
  if (!['all', 'any'].includes(item.prerequisiteMode)) throw new Error(`GR3 writing stage has an invalid prerequisite mode: ${item.id}.`);
  if (item.id !== GRAMMAR_WRITING_WRITING_ROOT_ID && !item.prerequisiteStageIds.length) throw new Error(`GR3 writing stage needs a predecessor: ${item.id}.`);
  if (item.id !== GRAMMAR_WRITING_WRITING_TERMINAL_ID && !item.nextStageIds.length) throw new Error(`GR3 writing stage needs a next stage: ${item.id}.`);
  if (item.masterySignals.length < 3 || item.commonBreakdowns.length < 3 || item.teachingMoves.length < 3) throw new Error(`GR3 writing stage needs complete mastery, breakdown and teaching signals: ${item.id}.`);
  if (!item.requiredGr1SkillIds.length || !item.curriculumAnchors.length || !item.publicAnchorTopicIds.length) throw new Error(`GR3 writing stage needs GR1, curriculum and public architecture anchors: ${item.id}.`);
  for (const skillId of item.requiredGr1SkillIds) if (!getGrammarWritingSkill(skillId)) throw new Error(`GR3 writing stage references an unknown GR1 skill: ${item.id} -> ${skillId}.`);
  for (const tenseId of item.supportingGr2TenseIds) if (!getGrammarWritingTense(tenseId)) throw new Error(`GR3 writing stage references an unknown GR2 tense: ${item.id} -> ${tenseId}.`);
  for (const topicId of item.publicAnchorTopicIds) if (!getR19CanonicalTopicOwner(topicId)) throw new Error(`GR3 writing stage references an unknown public topic owner: ${item.id} -> ${topicId}.`);
  for (const prerequisiteId of item.prerequisiteStageIds) {
    if (!stageById.has(prerequisiteId) || !stageById.get(prerequisiteId).nextStageIds.includes(item.id)) throw new Error(`GR3 prerequisite edge is not reciprocal: ${prerequisiteId} -> ${item.id}.`);
  }
  for (const nextId of item.nextStageIds) {
    if (!stageById.has(nextId) || !stageById.get(nextId).prerequisiteStageIds.includes(item.id)) throw new Error(`GR3 next-stage edge is not reciprocal: ${item.id} -> ${nextId}.`);
  }
}

if (getGrammarWritingWritingStage(GRAMMAR_WRITING_WRITING_ROOT_ID)?.prerequisiteStageIds.length) throw new Error('GR3 writing root must not have predecessors.');
if (getGrammarWritingWritingStage(GRAMMAR_WRITING_WRITING_TERMINAL_ID)?.nextStageIds.length) throw new Error('GR3 writing terminal must not have next stages.');
if (getGrammarWritingWritingStage(GRAMMAR_WRITING_WRITING_TERMINAL_ID)?.prerequisiteMode !== 'any') throw new Error('GR3 editing/revision must be reachable after any genre branch, not require mastery of every genre first.');

for (const item of GRAMMAR_WRITING_WRITING_STAGES) {
  if (!canReach(GRAMMAR_WRITING_WRITING_ROOT_ID, item.id)) throw new Error(`GR3 writing stage is unreachable from the root: ${item.id}.`);
  if (!canReach(item.id, GRAMMAR_WRITING_WRITING_TERMINAL_ID)) throw new Error(`GR3 writing stage cannot reach editing/revision: ${item.id}.`);
}

for (const skill of GRAMMAR_WRITING_SKILL_TAXONOMY) {
  if (!GRAMMAR_WRITING_WRITING_STAGES.some((item) => item.requiredGr1SkillIds.includes(skill.id))) throw new Error(`GR3 leaves a GR1 skill disconnected from writing application: ${skill.id}.`);
}
for (const tense of GRAMMAR_WRITING_TENSE_NODES) {
  if (!GRAMMAR_WRITING_WRITING_STAGES.some((item) => item.supportingGr2TenseIds.includes(tense.id))) throw new Error(`GR3 leaves a GR2 tense disconnected from writing application: ${tense.id}.`);
}
