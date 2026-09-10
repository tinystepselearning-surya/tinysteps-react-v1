import { GRAMMAR_WRITING_SKILL_TAXONOMY, getGrammarWritingSkill } from './grammarWritingKnowledgeTaxonomy.js';
import { GRAMMAR_WRITING_TENSE_NODES, getGrammarWritingTense } from './grammarWritingTenseArchitecture.js';
import { GRAMMAR_WRITING_WRITING_STAGES, getGrammarWritingWritingStage } from './grammarWritingWritingProgression.js';
import {
  GRAMMAR_WRITING_GR5_PRACTICE_KINDS,
  GRAMMAR_WRITING_PARENT_PROBLEMS,
  getGrammarWritingParentProblem,
} from './grammarWritingParentProblemArchitecture.js';
import { getR19CanonicalTopicOwner } from './grammarWritingSemanticCanonicalOwnership.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);
const unique = (values = []) => freezeList([...new Set(values)]);
const blueprint = (config) => freeze({
  ...config,
  requiredDataFields: freezeList(config.requiredDataFields),
  variationAxes: freezeList(config.variationAxes),
});

const problemsForKind = (kind) => GRAMMAR_WRITING_PARENT_PROBLEMS.filter((item) => item.recommendedPracticeKinds.includes(kind));
const unionFromProblems = (kind, field) => unique(problemsForKind(kind).flatMap((item) => item[field] ?? []));

const utility = (config) => {
  const kind = config.id;
  return freeze({
    ...config,
    targetParentProblemIds: unique(problemsForKind(kind).map((item) => item.id)),
    targetGr1SkillIds: unionFromProblems(kind, 'gr1SkillIds'),
    targetGr2TenseIds: unionFromProblems(kind, 'gr2TenseIds'),
    targetGr3WritingStageIds: unionFromProblems(kind, 'gr3WritingStageIds'),
    levels: freezeList(['guided', 'independent', 'transfer']),
    scaffoldSteps: freezeList(config.scaffoldSteps),
    successCriteria: freezeList(config.successCriteria),
    feedbackRules: freezeList(config.feedbackRules),
    publicAnchorTopicIds: freezeList(config.publicAnchorTopicIds),
    blueprints: freezeList(config.blueprints.map((item) => blueprint({ ...item, practiceKind: kind }))),
  });
};

export const GRAMMAR_WRITING_PRACTICE_REVISION = '2026-09-10-gr5';
export const GRAMMAR_WRITING_PRACTICE_LEVELS = freezeList(['guided', 'independent', 'transfer']);

/**
 * GR5 freezes reusable practice logic, not new public URLs. The utilities are
 * deliberately data-driven: a UI, worksheet exporter or teacher tool supplies
 * the lexical/content data while the utility defines the pedagogical contract,
 * progression, feedback and evaluation boundary.
 */
export const GRAMMAR_WRITING_PRACTICE_PRINCIPLES = freezeList([
  freeze({ id: 'diagnosis-drives-practice', statement: 'Select practice from the diagnosed bottleneck in GR4 rather than sending every learner through the same generic grammar game sequence.' }),
  freeze({ id: 'guided-independent-transfer', statement: 'Each utility must support guided practice, independent retrieval and a fresh transfer task so success is not confused with repeating the taught example.' }),
  freeze({ id: 'meaning-before-form-choice', statement: 'Tense, conjunction, sentence and punctuation choices should be made from intended meaning and structure before surface clue matching or symbol insertion.' }),
  freeze({ id: 'one-primary-target', statement: 'Keep one primary learning target visible within a practice cycle; mixed editing can follow only after individual checks are sufficiently secure.' }),
  freeze({ id: 'explain-before-next-item', statement: 'Where a child chooses or corrects an answer, useful feedback should require a brief reason or reread rather than only marking right or wrong.' }),
  freeze({ id: 'preserve-secure-core', statement: 'Sentence expansion and revision should preserve a secure core meaning while adding, combining, reordering or correcting only what improves communication.' }),
  freeze({ id: 'paragraphs-are-meaning-units', statement: 'Paragraph practice should train focus, relevance, order and cohesion rather than enforcing a universal five-sentence formula.' }),
  freeze({ id: 'practice-layer-not-publication-layer', statement: 'GR5 may reuse established public practice owners, but a utility or blueprint does not by itself create a new route, canonical owner or search intent.' }),
]);

export const GRAMMAR_WRITING_PRACTICE_UTILITIES = freezeList([
  utility({
    id: 'tense-comparison',
    order: 1,
    label: 'Tense Comparison',
    responseMode: 'compare-and-choose',
    purpose: 'Contrast two tense meanings or forms in a small decision so the child learns why one choice fits the intended time relationship instead of memorising clue words.',
    scaffoldSteps: [
      'Establish the intended time or relationship in plain language.',
      'Compare only the two tense choices that are genuinely competing.',
      'Ask the child to explain the meaning difference before moving to a fresh context.',
    ],
    successCriteria: [
      'Chooses the tense because its meaning fits the context.',
      'Can explain the contrast without relying only on a clue word.',
      'Transfers the same distinction to new vocabulary or a short connected response.',
    ],
    feedbackRules: [
      'If meaning is wrong, re-establish the time relationship before correcting morphology.',
      'If meaning is right but form is wrong, preserve the decision and repair only the form.',
      'After correction, require one fresh contrast rather than repeating the same sentence pair.',
    ],
    primaryPublicTopicId: 'grammar-practice',
    publicAnchorTopicIds: ['grammar-practice', 'grammar-focused-practice-game', 'grammar-tenses-guide'],
    blueprints: [
      { id: 'tense-comparison-guided', level: 'guided', taskType: 'two-option-contrast', promptTemplate: 'Read the meaning: {{meaning}}\nCompare: {{optionA}} / {{optionB}}\nWhich sentence fits, and what changes in meaning?', requiredDataFields: ['meaning', 'optionA', 'optionB'], variationAxes: ['time-frame', 'verb', 'subject', 'context'], evaluationRule: 'Correct choice plus a meaning-based explanation.' },
      { id: 'tense-comparison-independent', level: 'independent', taskType: 'contrast-explanation', promptTemplate: 'Compare these two sentences:\n{{sentenceA}}\n{{sentenceB}}\nExplain the difference and choose the better sentence for: {{context}}', requiredDataFields: ['sentenceA', 'sentenceB', 'context'], variationAxes: ['tense-pair', 'topic', 'time-reference'], evaluationRule: 'Accurate contrast and context-appropriate selection.' },
      { id: 'tense-comparison-transfer', level: 'transfer', taskType: 'fresh-production', promptTemplate: 'Context: {{context}}\nCreate two sentences using {{tenseA}} and {{tenseB}} so the difference in meaning is clear.', requiredDataFields: ['context', 'tenseA', 'tenseB'], variationAxes: ['fresh-topic', 'speaker', 'time-relationship'], evaluationRule: 'Both forms are meaningful, distinguishable and contextually justified.' },
    ],
  }),
  utility({
    id: 'sentence-builder',
    order: 2,
    label: 'Sentence Builder',
    responseMode: 'construct',
    purpose: 'Build one complete meaningful sentence from idea units or structured data while preserving subject, verb, word order, agreement and a clear sentence boundary.',
    scaffoldSteps: [
      'Identify who or what the sentence is about and the core action or state.',
      'Build the complete oral sentence before adding optional detail.',
      'Write or arrange the sentence, then reread it as one complete idea.',
    ],
    successCriteria: [
      'Produces one complete idea with a stable sentence core.',
      'Uses workable word order and required grammar without an adult supplying the sentence.',
      'Can rebuild the pattern with different content rather than copying a memorised model.',
    ],
    feedbackRules: [
      'If the idea is incomplete, prompt for the missing meaning before rearranging words.',
      'If the oral sentence is correct but written order changes, compare spoken and written versions directly.',
      'Do not reward unnecessary length; complete and clear comes before expanded.',
    ],
    primaryPublicTopicId: 'sentence-building-practice',
    publicAnchorTopicIds: ['sentence-building-practice', 'grammar-focused-practice-game', 'sentence-formation'],
    blueprints: [
      { id: 'sentence-builder-guided', level: 'guided', taskType: 'arrange-units', promptTemplate: 'Build one complete sentence from these units: {{units}}\nMeaning to keep: {{meaning}}', requiredDataFields: ['units', 'meaning'], variationAxes: ['word-order', 'subject', 'verb', 'article', 'detail'], evaluationRule: 'One grammatical sentence that preserves the supplied meaning.' },
      { id: 'sentence-builder-independent', level: 'independent', taskType: 'prompted-construction', promptTemplate: 'Write one complete sentence about {{topic}} using {{requiredElement}}.', requiredDataFields: ['topic', 'requiredElement'], variationAxes: ['topic', 'required-grammar', 'sentence-purpose'], evaluationRule: 'Complete independent sentence with the required element used meaningfully.' },
      { id: 'sentence-builder-transfer', level: 'transfer', taskType: 'oral-to-written-transfer', promptTemplate: 'Say one complete sentence about {{freshTopic}}. Then write the same idea and compare the two versions.', requiredDataFields: ['freshTopic'], variationAxes: ['fresh-topic', 'oral-load', 'writing-load'], evaluationRule: 'Written sentence preserves the complete spoken idea with reduced prompting.' },
    ],
  }),
  utility({
    id: 'sentence-expansion',
    order: 3,
    label: 'Sentence Expansion',
    responseMode: 'expand',
    purpose: 'Add one useful layer of detail to a secure sentence—such as which one, where, when, how or why—without destabilising the core or padding it with decorative words.',
    scaffoldSteps: [
      'Confirm the base sentence is already complete.',
      'Choose one dimension of detail that would genuinely help the reader.',
      'Add the detail, reread, and decide whether the new information improves meaning.',
    ],
    successCriteria: [
      'Preserves the complete base sentence while adding relevant information.',
      'Uses more than one type of expansion across varied tasks.',
      'Can decide when no expansion is needed because the short sentence is already effective.',
    ],
    feedbackRules: [
      'Reject adjective accumulation that does not add useful information.',
      'If expansion breaks the core sentence, restore the core before trying a smaller addition.',
      'Ask what the reader learned from the addition before accepting it as an improvement.',
    ],
    primaryPublicTopicId: 'sentence-building-practice',
    publicAnchorTopicIds: ['sentence-building-practice', 'grammar-focused-practice-game', 'sentence-formation'],
    blueprints: [
      { id: 'sentence-expansion-guided', level: 'guided', taskType: 'single-dimension-expansion', promptTemplate: 'Base sentence: {{baseSentence}}\nAdd one useful {{detailType}} detail. Keep the original meaning clear.', requiredDataFields: ['baseSentence', 'detailType'], variationAxes: ['where', 'when', 'how', 'which-one', 'why'], evaluationRule: 'Base remains complete and the added detail contributes useful meaning.' },
      { id: 'sentence-expansion-independent', level: 'independent', taskType: 'choose-expansion', promptTemplate: 'Improve this sentence only if useful: {{baseSentence}}\nChoose the kind of detail yourself and explain what it adds.', requiredDataFields: ['baseSentence'], variationAxes: ['sentence-topic', 'detail-choice', 'no-change-option'], evaluationRule: 'Purposeful detail or justified decision to keep the original sentence.' },
      { id: 'sentence-expansion-transfer', level: 'transfer', taskType: 'fresh-sentence-development', promptTemplate: 'Write a clear sentence about {{freshTopic}}, then add exactly one useful layer of detail and explain why you chose it.', requiredDataFields: ['freshTopic'], variationAxes: ['fresh-topic', 'sentence-purpose', 'detail-dimension'], evaluationRule: 'Independent complete sentence plus one meaningful, controlled expansion.' },
    ],
  }),
  utility({
    id: 'error-correction',
    order: 4,
    label: 'Error Correction',
    responseMode: 'find-explain-fix',
    purpose: 'Detect and repair one known grammar or sentence problem by locating the error, explaining the issue, making the smallest accurate correction and rereading the whole sentence.',
    scaffoldSteps: [
      'Read for meaning before hunting for an error.',
      'Find the target problem without immediately supplying the corrected answer.',
      'Explain, fix, reread and then apply the same check to a fresh item.',
    ],
    successCriteria: [
      'Finds the target error with decreasing location cues.',
      'Explains the relevant rule or meaning rather than guessing a replacement.',
      'Makes the smallest accurate fix and transfers the check to a fresh sentence.',
    ],
    feedbackRules: [
      'Do not reveal the exact error location on independent or transfer items unless needed after a failed attempt.',
      'Separate detection failure from correction failure because they require different support.',
      'Preserve correct parts of the sentence instead of rewriting everything.',
    ],
    primaryPublicTopicId: 'grammar-focused-practice-game',
    publicAnchorTopicIds: ['grammar-focused-practice-game', 'grammar-practice', 'grammar-editing-guide'],
    blueprints: [
      { id: 'error-correction-guided', level: 'guided', taskType: 'targeted-repair', promptTemplate: 'Target: {{target}}\nSentence: {{sentence}}\nFind the problem, explain it, and make the smallest correction.', requiredDataFields: ['target', 'sentence'], variationAxes: ['error-type', 'sentence-length', 'cue-strength'], evaluationRule: 'Target error found, accurately explained and minimally repaired.' },
      { id: 'error-correction-independent', level: 'independent', taskType: 'uncued-repair', promptTemplate: 'Sentence: {{sentence}}\nSomething taught earlier may need fixing. Find it, explain why, correct it, and reread.', requiredDataFields: ['sentence'], variationAxes: ['grammar-target', 'error-position', 'distractors'], evaluationRule: 'Independent detection plus accurate explanation and correction.' },
      { id: 'error-correction-transfer', level: 'transfer', taskType: 'self-correction', promptTemplate: 'Review this fresh response: {{response}}\nFind one meaningful grammar or sentence improvement, justify it, and make the change.', requiredDataFields: ['response'], variationAxes: ['fresh-writing', 'target-not-named', 'multiple-possible-improvements'], evaluationRule: 'Selects a valid high-value improvement and justifies the correction.' },
    ],
  }),
  utility({
    id: 'punctuation-challenge',
    order: 5,
    label: 'Punctuation Challenge',
    responseMode: 'punctuate-and-explain',
    purpose: 'Use sentence boundaries and taught punctuation to show structure and meaning, progressing from one target mark to independent detection inside connected writing.',
    scaffoldSteps: [
      'Read or say the text for meaning and locate sentence boundaries first.',
      'Apply one taught punctuation function at a time.',
      'Reread the full sentence or passage and explain what the mark is doing.',
    ],
    successCriteria: [
      'Identifies sentence boundaries before adding surface marks.',
      'Uses the target punctuation for its function rather than by visual habit.',
      'Finds and repairs punctuation in fresh writing with reduced prompting.',
    ],
    feedbackRules: [
      'Prioritise sentence boundaries before less essential punctuation detail.',
      'If the mark is wrong, ask what structure or meaning the writer intended before naming the symbol.',
      'Mixed proofreading should follow secure single-target practice, not replace it.',
    ],
    primaryPublicTopicId: 'grammar-practice',
    publicAnchorTopicIds: ['grammar-practice', 'grammar-focused-practice-game', 'punctuation-capitalisation-guide'],
    blueprints: [
      { id: 'punctuation-challenge-guided', level: 'guided', taskType: 'single-mark', promptTemplate: 'Target punctuation: {{targetMark}}\nText: {{text}}\nAdd the mark where needed and explain its job.', requiredDataFields: ['targetMark', 'text'], variationAxes: ['mark', 'sentence-boundary', 'capitalisation', 'proper-noun'], evaluationRule: 'Correct placement plus accurate explanation of function.' },
      { id: 'punctuation-challenge-independent', level: 'independent', taskType: 'boundary-and-mark', promptTemplate: 'Punctuate this short text so the sentence structure is clear: {{text}}\nExplain your most important change.', requiredDataFields: ['text'], variationAxes: ['number-of-sentences', 'mark-mix', 'capitalisation'], evaluationRule: 'Readable sentence boundaries and appropriate taught punctuation.' },
      { id: 'punctuation-challenge-transfer', level: 'transfer', taskType: 'proofread-own-style', promptTemplate: 'Read this fresh paragraph aloud, then edit punctuation only where structure or meaning requires it: {{paragraph}}', requiredDataFields: ['paragraph'], variationAxes: ['fresh-topic', 'sentence-length', 'punctuation-density'], evaluationRule: 'Independent punctuation decisions that improve readability without overmarking.' },
    ],
  }),
  utility({
    id: 'editing-practice',
    order: 6,
    label: 'Editing Practice',
    responseMode: 'multi-pass-review',
    purpose: 'Develop independent rereading through staged revision and editing passes: meaning and organisation first, then sentence clarity, grammar or tense, punctuation and final transfer.',
    scaffoldSteps: [
      'Choose the purpose of the current pass before rereading.',
      'Find, explain and fix only the relevant class of problem.',
      'Reread the whole piece, then repeat the process later on fresh writing with fewer prompts.',
    ],
    successCriteria: [
      'Separates meaning-level revision from surface proofreading.',
      'Detects some familiar problems without an adult pointing to the exact location.',
      'Makes justified changes that preserve or improve the writer’s intended meaning.',
    ],
    feedbackRules: [
      'Do not overload the learner with every possible correction in one pass.',
      'Record whether the difficulty was detection, explanation or repair.',
      'A change is not automatically better because it is longer or more complex.',
    ],
    primaryPublicTopicId: 'grammar-focused-practice-game',
    publicAnchorTopicIds: ['grammar-focused-practice-game', 'grammar-practice', 'grammar-editing-guide'],
    blueprints: [
      { id: 'editing-practice-guided', level: 'guided', taskType: 'named-pass', promptTemplate: 'Editing pass: {{passFocus}}\nText: {{text}}\nFind one issue, explain it, fix it, and reread the whole sentence or paragraph.', requiredDataFields: ['passFocus', 'text'], variationAxes: ['meaning', 'sentence-clarity', 'tense', 'grammar', 'punctuation'], evaluationRule: 'One valid focus-aligned improvement with explanation and reread.' },
      { id: 'editing-practice-independent', level: 'independent', taskType: 'select-pass', promptTemplate: 'Text: {{text}}\nChoose the most useful editing or revision pass, make one improvement, and explain why you chose that pass.', requiredDataFields: ['text'], variationAxes: ['error-profile', 'text-length', 'genre'], evaluationRule: 'Selects an appropriate pass and makes a justified high-value improvement.' },
      { id: 'editing-practice-transfer', level: 'transfer', taskType: 'fresh-self-edit', promptTemplate: 'Review this fresh draft: {{draft}}\nRevise meaning/organisation first if needed, then make one surface edit. Explain both decisions.', requiredDataFields: ['draft'], variationAxes: ['fresh-draft', 'genre', 'mixed-errors'], evaluationRule: 'Independent staged review with meaning preserved and at least one accurate surface edit.' },
    ],
  }),
  utility({
    id: 'paragraph-organiser',
    order: 7,
    label: 'Paragraph Organiser',
    responseMode: 'focus-select-order-connect',
    purpose: 'Organise a paragraph as a meaning unit by identifying one focus, selecting relevant support, ordering ideas logically and checking how sentences connect before surface editing.',
    scaffoldSteps: [
      'State the paragraph focus in one short phrase.',
      'Choose relevant details and remove off-topic or repetitive material.',
      'Arrange the selected ideas, draft or reorder the paragraph, then check flow.',
    ],
    successCriteria: [
      'Maintains one clear paragraph focus.',
      'Selects and orders supporting ideas for meaning rather than sentence count.',
      'Improves cohesion through reference, sequence or purposeful connections.',
    ],
    feedbackRules: [
      'Do not require a universal five-sentence structure.',
      'Treat relevance and order as separate decisions before correcting grammar.',
      'Accept different logical orders when the child can justify how the reader will follow them.',
    ],
    primaryPublicTopicId: 'grammar-practice',
    publicAnchorTopicIds: ['grammar-practice', 'paragraph-writing-guide', 'grammar-editing-guide'],
    blueprints: [
      { id: 'paragraph-organiser-guided', level: 'guided', taskType: 'select-and-order', promptTemplate: 'Paragraph focus: {{focus}}\nIdeas: {{ideas}}\nRemove anything off-topic, then put the useful ideas in a sensible order.', requiredDataFields: ['focus', 'ideas'], variationAxes: ['topic', 'off-topic-distractor', 'sequence-type'], evaluationRule: 'Relevant idea selection plus a defensible logical order.' },
      { id: 'paragraph-organiser-independent', level: 'independent', taskType: 'infer-focus-and-reorder', promptTemplate: 'Sentences: {{sentences}}\nDecide the paragraph focus, remove or move anything that weakens it, and explain your order.', requiredDataFields: ['sentences'], variationAxes: ['focus-explicitness', 'redundancy', 'order'], evaluationRule: 'Coherent focus, relevance decisions and explained ordering.' },
      { id: 'paragraph-organiser-transfer', level: 'transfer', taskType: 'plan-fresh-paragraph', promptTemplate: 'Topic: {{freshTopic}}\nPlan one focused paragraph: state the focus, choose 2–4 relevant supports, order them, and explain how they will connect.', requiredDataFields: ['freshTopic'], variationAxes: ['fresh-topic', 'genre', 'support-type'], evaluationRule: 'Independent focused plan with relevant, logically ordered support; no fixed sentence count required.' },
    ],
  }),
  utility({
    id: 'conjunction-practice',
    order: 8,
    label: 'Conjunction Practice',
    responseMode: 'relationship-and-connect',
    purpose: 'Choose conjunctions and clause connections from the real relationship between ideas—addition, reason, result, contrast, time or condition—rather than inserting a connector mechanically.',
    scaffoldSteps: [
      'Read the two ideas separately and name their relationship.',
      'Choose whether they should be joined, kept separate or reordered.',
      'Select a conjunction or structure that accurately expresses the relationship and reread for clarity.',
    ],
    successCriteria: [
      'Identifies the intended relationship before choosing a connector.',
      'Uses more than one conjunction appropriately across varied meanings.',
      'Can decide that two separate sentences are clearer than forcing a conjunction.',
    ],
    feedbackRules: [
      'If the conjunction is wrong, return to the relationship between ideas rather than offering a synonym list.',
      'Do not reward sentence length when the connection creates a run-on or weakens clarity.',
      'Require fresh relationship decisions so the child does not memorise one connector per worksheet section.',
    ],
    primaryPublicTopicId: 'grammar-practice',
    publicAnchorTopicIds: ['grammar-practice', 'grammar-focused-practice-game', 'conjunctions-guide'],
    blueprints: [
      { id: 'conjunction-practice-guided', level: 'guided', taskType: 'relationship-choice', promptTemplate: 'Idea 1: {{ideaA}}\nIdea 2: {{ideaB}}\nRelationship: {{relationship}}\nChoose or write a connector that shows this meaning.', requiredDataFields: ['ideaA', 'ideaB', 'relationship'], variationAxes: ['addition', 'reason', 'result', 'contrast', 'time', 'condition'], evaluationRule: 'Connector accurately represents the supplied relationship.' },
      { id: 'conjunction-practice-independent', level: 'independent', taskType: 'infer-relationship', promptTemplate: 'Idea 1: {{ideaA}}\nIdea 2: {{ideaB}}\nDecide the relationship, then join them only if joining makes the meaning clearer.', requiredDataFields: ['ideaA', 'ideaB'], variationAxes: ['relationship', 'clause-order', 'keep-separate-option'], evaluationRule: 'Correctly identifies relationship and chooses a clear structure.' },
      { id: 'conjunction-practice-transfer', level: 'transfer', taskType: 'fresh-connected-writing', promptTemplate: 'Write two related ideas about {{freshTopic}}. Show their relationship with a suitable conjunction or explain why two sentences are clearer.', requiredDataFields: ['freshTopic'], variationAxes: ['fresh-topic', 'relationship-self-selected', 'sentence-combining'], evaluationRule: 'Independent meaningful connection without forced conjunction use.' },
    ],
  }),
  utility({
    id: 'tense-choice',
    order: 9,
    label: 'Tense Choice Practice',
    responseMode: 'meaning-to-form',
    purpose: 'Choose a tense or future form from the intended meaning, build the correct verb phrase and maintain the choice across connected language unless a purposeful time shift is required.',
    scaffoldSteps: [
      'Identify the intended time frame and whether the action is routine, ongoing, completed, earlier-past, connected-to-present, planned or predicted.',
      'Choose the tense/form and build the verb phrase.',
      'Use the choice in a fresh sentence or connected response and audit later verbs for consistency.',
    ],
    successCriteria: [
      'Selects tense from full meaning rather than a memorised keyword.',
      'Builds the selected form accurately enough to preserve the intended time relationship.',
      'Maintains or purposefully changes tense across a short connected response.',
    ],
    feedbackRules: [
      'Separate a meaning-choice error from a form-construction error.',
      'Remove or vary clue words as independence increases.',
      'In connected writing, ask whether each tense shift changes meaning intentionally before correcting it.',
    ],
    primaryPublicTopicId: 'grammar-practice',
    publicAnchorTopicIds: ['grammar-practice', 'grammar-focused-practice-game', 'grammar-tenses-guide'],
    blueprints: [
      { id: 'tense-choice-guided', level: 'guided', taskType: 'meaning-cued-choice', promptTemplate: 'Meaning: {{meaning}}\nSentence frame: {{sentenceFrame}}\nChoose the tense/form and complete the verb phrase. Explain why it fits.', requiredDataFields: ['meaning', 'sentenceFrame'], variationAxes: ['tense', 'verb', 'subject', 'time-reference'], evaluationRule: 'Meaning-appropriate tense/form plus accurate enough construction and explanation.' },
      { id: 'tense-choice-independent', level: 'independent', taskType: 'context-choice', promptTemplate: 'Context: {{context}}\nComplete or rewrite: {{sentence}}\nChoose the tense from the whole meaning, not one clue word.', requiredDataFields: ['context', 'sentence'], variationAxes: ['context', 'clue-word-presence', 'tense-contrast'], evaluationRule: 'Contextually justified tense with correct core form.' },
      { id: 'tense-choice-transfer', level: 'transfer', taskType: 'connected-time-control', promptTemplate: 'Write {{sentenceCount}} connected sentences about {{freshTopic}} in the intended time frame: {{timeFrame}}. Then audit every verb and justify any tense shift.', requiredDataFields: ['sentenceCount', 'freshTopic', 'timeFrame'], variationAxes: ['fresh-topic', 'paragraph-length', 'time-frame', 'purposeful-shift'], evaluationRule: 'Connected response maintains the intended time frame and justifies any shift.' },
    ],
  }),
]);

const utilityById = new Map(GRAMMAR_WRITING_PRACTICE_UTILITIES.map((item) => [item.id, item]));
export const GRAMMAR_WRITING_PRACTICE_BLUEPRINTS = freezeList(GRAMMAR_WRITING_PRACTICE_UTILITIES.flatMap((item) => item.blueprints));
const blueprintById = new Map(GRAMMAR_WRITING_PRACTICE_BLUEPRINTS.map((item) => [item.id, item]));

export const getGrammarWritingPracticeUtility = (id) => utilityById.get(String(id || '')) ?? null;
export const getGrammarWritingPracticeBlueprint = (id) => blueprintById.get(String(id || '')) ?? null;
export const getGrammarWritingPracticeBlueprintsForUtility = (practiceKind) => freezeList(getGrammarWritingPracticeUtility(practiceKind)?.blueprints ?? []);
export const getGrammarWritingPracticeUtilitiesForParentProblem = (problemId) => freezeList(GRAMMAR_WRITING_PRACTICE_UTILITIES.filter((item) => item.targetParentProblemIds.includes(String(problemId || ''))));
export const getGrammarWritingPracticeUtilitiesForSkill = (skillId) => freezeList(GRAMMAR_WRITING_PRACTICE_UTILITIES.filter((item) => item.targetGr1SkillIds.includes(String(skillId || ''))));
export const getGrammarWritingPracticeUtilitiesForTense = (tenseId) => freezeList(GRAMMAR_WRITING_PRACTICE_UTILITIES.filter((item) => item.targetGr2TenseIds.includes(String(tenseId || ''))));
export const getGrammarWritingPracticeUtilitiesForWritingStage = (stageId) => freezeList(GRAMMAR_WRITING_PRACTICE_UTILITIES.filter((item) => item.targetGr3WritingStageIds.includes(String(stageId || ''))));

export function renderGrammarWritingPracticePrompt(blueprintId, data = {}) {
  const item = getGrammarWritingPracticeBlueprint(blueprintId);
  if (!item) throw new Error(`Unknown GR5 practice blueprint: ${blueprintId}.`);
  const missing = item.requiredDataFields.filter((field) => data[field] === undefined || data[field] === null || String(data[field]).trim() === '');
  if (missing.length) throw new Error(`GR5 practice blueprint ${blueprintId} is missing data fields: ${missing.join(', ')}.`);
  const prompt = item.promptTemplate.replace(/\{\{([a-zA-Z0-9_-]+)\}\}/g, (_, key) => String(data[key]));
  if (/\{\{[^}]+\}\}/.test(prompt)) throw new Error(`GR5 practice blueprint ${blueprintId} contains unresolved prompt tokens.`);
  return prompt;
}

export function buildGrammarWritingPracticeTask(practiceKind, level, data = {}) {
  const item = getGrammarWritingPracticeUtility(practiceKind);
  if (!item) throw new Error(`Unknown GR5 practice utility: ${practiceKind}.`);
  if (!GRAMMAR_WRITING_PRACTICE_LEVELS.includes(level)) throw new Error(`Unknown GR5 practice level: ${level}.`);
  const taskBlueprint = item.blueprints.find((entry) => entry.level === level);
  if (!taskBlueprint) throw new Error(`GR5 practice utility ${practiceKind} has no ${level} blueprint.`);
  return freeze({
    practiceKind: item.id,
    utilityLabel: item.label,
    level,
    taskType: taskBlueprint.taskType,
    prompt: renderGrammarWritingPracticePrompt(taskBlueprint.id, data),
    evaluationRule: taskBlueprint.evaluationRule,
    successCriteria: item.successCriteria,
    feedbackRules: item.feedbackRules,
  });
}

if (GRAMMAR_WRITING_PRACTICE_UTILITIES.map((item) => item.id).join('|') !== GRAMMAR_WRITING_GR5_PRACTICE_KINDS.join('|')) throw new Error('GR5 practice utility order must exactly match the GR4 handoff vocabulary.');
if (utilityById.size !== 9 || blueprintById.size !== 27) throw new Error('GR5 contains duplicate or missing utility/blueprint IDs.');

for (const item of GRAMMAR_WRITING_PRACTICE_UTILITIES) {
  if (!item.purpose || item.purpose.length < 100) throw new Error(`GR5 practice utility purpose is too thin: ${item.id}.`);
  if (item.levels.join('|') !== GRAMMAR_WRITING_PRACTICE_LEVELS.join('|')) throw new Error(`GR5 levels drifted: ${item.id}.`);
  if (item.blueprints.map((entry) => entry.level).join('|') !== GRAMMAR_WRITING_PRACTICE_LEVELS.join('|')) throw new Error(`GR5 needs one guided, independent and transfer blueprint: ${item.id}.`);
  if (item.scaffoldSteps.length < 3 || item.successCriteria.length < 3 || item.feedbackRules.length < 3) throw new Error(`GR5 practice utility contract is incomplete: ${item.id}.`);
  if (!item.targetParentProblemIds.length || !item.targetGr1SkillIds.length || !item.targetGr3WritingStageIds.length) throw new Error(`GR5 utility is disconnected from GR4/GR1/GR3: ${item.id}.`);
  for (const problemId of item.targetParentProblemIds) {
    const parentProblem = getGrammarWritingParentProblem(problemId);
    if (!parentProblem?.recommendedPracticeKinds.includes(item.id)) throw new Error(`GR5/GR4 practice relation is not reciprocal: ${item.id} -> ${problemId}.`);
  }
  for (const skillId of item.targetGr1SkillIds) if (!getGrammarWritingSkill(skillId)) throw new Error(`GR5 references unknown GR1 skill: ${item.id} -> ${skillId}.`);
  for (const tenseId of item.targetGr2TenseIds) if (!getGrammarWritingTense(tenseId)) throw new Error(`GR5 references unknown GR2 tense: ${item.id} -> ${tenseId}.`);
  for (const stageId of item.targetGr3WritingStageIds) if (!getGrammarWritingWritingStage(stageId)) throw new Error(`GR5 references unknown GR3 writing stage: ${item.id} -> ${stageId}.`);
  const primaryOwner = getR19CanonicalTopicOwner(item.primaryPublicTopicId);
  if (!primaryOwner || primaryOwner.intent !== 'practice') throw new Error(`GR5 primary public anchor must be an existing practice owner: ${item.id} -> ${item.primaryPublicTopicId}.`);
  for (const topicId of item.publicAnchorTopicIds) if (!getR19CanonicalTopicOwner(topicId)) throw new Error(`GR5 references unknown public topic owner: ${item.id} -> ${topicId}.`);
  for (const taskBlueprint of item.blueprints) {
    if (taskBlueprint.practiceKind !== item.id || taskBlueprint.requiredDataFields.length < 1 || taskBlueprint.variationAxes.length < 3 || !taskBlueprint.evaluationRule) throw new Error(`GR5 blueprint is incomplete: ${taskBlueprint.id}.`);
    for (const field of taskBlueprint.requiredDataFields) if (!taskBlueprint.promptTemplate.includes(`{{${field}}}`)) throw new Error(`GR5 blueprint prompt is missing required token: ${taskBlueprint.id} -> ${field}.`);
  }
}

for (const parentProblem of GRAMMAR_WRITING_PARENT_PROBLEMS) {
  for (const kind of parentProblem.recommendedPracticeKinds) {
    if (!getGrammarWritingPracticeUtility(kind)?.targetParentProblemIds.includes(parentProblem.id)) throw new Error(`GR4 recommendation has no GR5 backlink: ${parentProblem.id} -> ${kind}.`);
  }
}
for (const skill of GRAMMAR_WRITING_SKILL_TAXONOMY) if (!GRAMMAR_WRITING_PRACTICE_UTILITIES.some((item) => item.targetGr1SkillIds.includes(skill.id))) throw new Error(`GR5 leaves GR1 skill without practice: ${skill.id}.`);
for (const tense of GRAMMAR_WRITING_TENSE_NODES) if (!GRAMMAR_WRITING_PRACTICE_UTILITIES.some((item) => item.targetGr2TenseIds.includes(tense.id))) throw new Error(`GR5 leaves GR2 tense without practice: ${tense.id}.`);
for (const stage of GRAMMAR_WRITING_WRITING_STAGES) if (!GRAMMAR_WRITING_PRACTICE_UTILITIES.some((item) => item.targetGr3WritingStageIds.includes(stage.id))) throw new Error(`GR5 leaves GR3 writing stage without practice: ${stage.id}.`);
