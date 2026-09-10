import { GRAMMAR_WRITING_SKILL_TAXONOMY, getGrammarWritingSkill } from './grammarWritingKnowledgeTaxonomy.js';
import { GRAMMAR_WRITING_TENSE_NODES, getGrammarWritingTense } from './grammarWritingTenseArchitecture.js';
import { GRAMMAR_WRITING_WRITING_STAGES, getGrammarWritingWritingStage } from './grammarWritingWritingProgression.js';
import { getR19CanonicalTopicOwner } from './grammarWritingSemanticCanonicalOwnership.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);
const problem = (config) => freeze({
  ...config,
  observableSignals: freezeList(config.observableSignals),
  diagnosticQuestions: freezeList(config.diagnosticQuestions),
  likelyBreakdowns: freezeList(config.likelyBreakdowns),
  gr1SkillIds: freezeList(config.gr1SkillIds),
  gr2TenseIds: freezeList(config.gr2TenseIds),
  gr3WritingStageIds: freezeList(config.gr3WritingStageIds),
  relatedProblemIds: freezeList(config.relatedProblemIds),
  interventionSequence: freezeList(config.interventionSequence),
  progressSignals: freezeList(config.progressSignals),
  recommendedPracticeKinds: freezeList(config.recommendedPracticeKinds),
  publicAnchorTopicIds: freezeList(config.publicAnchorTopicIds),
});

export const GRAMMAR_WRITING_PARENT_PROBLEM_REVISION = '2026-09-10-gr4';

/**
 * GR4 is a diagnostic routing layer, not a publication plan. Parent wording is
 * translated into the GR1 skill taxonomy, GR2 tense architecture and GR3
 * writing progression. Existing public owners are reused wherever they already
 * answer the need; supported problems do not automatically justify new URLs.
 */
export const GRAMMAR_WRITING_PARENT_PROBLEM_PRINCIPLES = freezeList([
  freeze({ id: 'observe-before-label', statement: 'Start from what the parent and child can actually observe in fresh speaking or writing before assigning a grammar label or reteaching an entire topic.' }),
  freeze({ id: 'find-first-break', statement: 'Locate the first point where performance becomes unstable—rule recall, controlled choice, sentence generation, connected writing or independent editing—and practise from that point.' }),
  freeze({ id: 'separate-knowledge-from-transfer', statement: 'A child who can explain or select a rule but cannot retrieve it in fresh language has a transfer problem, not necessarily a missing-definition problem.' }),
  freeze({ id: 'separate-length-from-quality', statement: 'Short writing is not automatically weak; diagnose whether the child lacks a complete idea, useful detail, connection, organisation or simply has nothing more relevant to add.' }),
  freeze({ id: 'one-primary-bottleneck', statement: 'Choose one primary bottleneck for the next teaching cycle instead of correcting sentence structure, tense, vocabulary, punctuation and organisation simultaneously.' }),
  freeze({ id: 'fresh-task-confirms-progress', statement: 'Progress is stronger when the child uses the repaired skill on a fresh topic or passage with less prompting rather than only correcting the practised example.' }),
  freeze({ id: 'reuse-existing-owners', statement: 'A parent problem may be served by an existing diagnostic, skill or writing owner; GR4 does not create a new page merely because the parent uses different wording.' }),
]);

/**
 * Stable handoff vocabulary for GR5. GR4 may recommend these practice kinds but
 * does not implement the utilities themselves.
 */
export const GRAMMAR_WRITING_GR5_PRACTICE_KINDS = freezeList([
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

export const GRAMMAR_WRITING_PARENT_PROBLEMS = freezeList([
  problem({
    id: 'knows-rules-but-does-not-use-them',
    order: 1,
    label: 'Knows Grammar Rules but Does Not Use Them',
    problemClass: 'grammar-transfer',
    parentObservation: 'The child can explain a grammar rule or complete a familiar exercise, but the same rule disappears during spontaneous speaking or fresh independent writing.',
    observableSignals: [
      'Answers rule-definition or multiple-choice questions correctly but makes the same error in a new sentence.',
      'Uses the target accurately immediately after prompting, then loses it when attention moves to meaning or ideas.',
      'Needs the adult to name the rule before noticing an error in personal writing.',
    ],
    diagnosticQuestions: [
      'Can the child explain or recognise the rule without help?',
      'Can the child use it in one cued fresh sentence?',
      'Does accuracy survive in connected speaking or writing when the rule is not named?',
      'Can the child find and repair the same pattern during independent rereading?',
    ],
    likelyBreakdowns: [
      'Rule knowledge is declarative but retrieval is not automatic during language production.',
      'Practice has stayed at recognition or controlled-choice level for too long.',
      'Writing or speaking load consumes attention that was previously available for the grammar target.',
    ],
    firstTeachingMove: 'Keep the known rule brief, then move immediately from recognition to one fresh spoken sentence, one fresh written sentence and a later independent retrieval attempt.',
    gr1SkillIds: ['sentence-foundations', 'subject-verb-agreement', 'tenses', 'punctuation', 'editing-revision'],
    gr2TenseIds: ['tense-consistency-transfer'],
    gr3WritingStageIds: ['complete-sentence', 'connected-sentences', 'editing-revision-transfer'],
    relatedProblemIds: ['speaking-grammar-does-not-transfer-to-writing', 'mixes-tenses', 'weak-editing'],
    interventionSequence: [
      'Confirm the rule is genuinely known with one short recognition or explanation check.',
      'Require fresh production with the target but without copying a model.',
      'Delay the cue and revisit the target inside connected language.',
      'Finish with self-detection and repair in the child’s own or a fresh piece of writing.',
    ],
    progressSignals: [
      'Uses the target correctly in a new sentence without the rule being named first.',
      'Maintains the target more often while also thinking about content.',
      'Begins to notice and repair the error independently during rereading.',
    ],
    recommendedPracticeKinds: ['error-correction', 'editing-practice', 'sentence-builder'],
    coverageMode: 'direct-existing-owner',
    primaryPublicTopicId: 'grammar-transfer-mistakes',
    publicAnchorTopicIds: ['grammar-transfer-mistakes', 'grammar-assessment-guide'],
    coverageRationale: 'The existing grammar-transfer diagnostic explicitly owns the rule-recall versus spontaneous-use problem and already distinguishes controlled knowledge from fresh speaking/writing transfer.',
  }),
  problem({
    id: 'mixes-tenses',
    order: 2,
    label: 'Mixes Tenses',
    problemClass: 'tense-control',
    parentObservation: 'The child changes tense unintentionally within a sentence, retell or paragraph, or chooses a tense from a memorised clue word without maintaining the intended time meaning.',
    observableSignals: [
      'Starts a past retell accurately, then switches to present forms without a meaning reason.',
      'Uses a familiar tense whenever a clue word appears even when the wider context requires another choice.',
      'Can form isolated tense examples but loses time consistency across several connected sentences.',
    ],
    diagnosticQuestions: [
      'Can the child identify the intended time frame before choosing a verb form?',
      'Is the difficulty the form itself, the meaning contrast between two tenses, or maintaining a chosen time frame?',
      'Does the child rely on clue-word matching rather than sentence meaning?',
      'Can the child explain whether a tense shift is purposeful or accidental?',
    ],
    likelyBreakdowns: [
      'Individual forms are partly known but semantic contrasts between tense systems are unstable.',
      'The child has learned tense as keyword matching rather than a time-and-meaning decision.',
      'Connected-language load causes accidental tense drift even when isolated forms are secure.',
    ],
    firstTeachingMove: 'Identify the intended time meaning first, isolate the smallest relevant tense contrast, then return quickly to a short connected retell or paragraph where the child must maintain that choice.',
    gr1SkillIds: ['verbs', 'subject-verb-agreement', 'tenses', 'editing-revision'],
    gr2TenseIds: ['simple-present', 'simple-past', 'simple-future-will', 'present-continuous', 'past-continuous', 'future-forms', 'present-perfect', 'past-perfect', 'tense-consistency-transfer'],
    gr3WritingStageIds: ['connected-sentences', 'focused-paragraph', 'cohesive-paragraph', 'narrative-writing', 'explanation-opinion-writing', 'editing-revision-transfer'],
    relatedProblemIds: ['knows-rules-but-does-not-use-them', 'weak-editing', 'speaking-grammar-does-not-transfer-to-writing'],
    interventionSequence: [
      'State the intended time meaning without naming every possible tense.',
      'Compare only the two forms or meanings that are actually competing.',
      'Use a short oral retell or sentence pair to stabilise the choice.',
      'Write connected language and audit each verb for consistency or purposeful shift.',
    ],
    progressSignals: [
      'Chooses tense from meaning rather than from one memorised clue word.',
      'Maintains a chosen time frame across a short paragraph or retell.',
      'Can identify and justify a purposeful tense shift when one is needed.',
    ],
    recommendedPracticeKinds: ['tense-comparison', 'tense-choice', 'editing-practice'],
    coverageMode: 'supported-by-existing-owners',
    primaryPublicTopicId: 'grammar-tenses-guide',
    publicAnchorTopicIds: ['grammar-tenses-guide', 'grammar-transfer-mistakes', 'grammar-editing-guide'],
    coverageRationale: 'The established tense guide owns tense meaning and comparison while the grammar-transfer and editing owners cover connected-language drift; a separate near-duplicate “child mixes tenses” page is not required by GR4.',
  }),
  problem({
    id: 'incomplete-sentences',
    order: 3,
    label: 'Writes Incomplete Sentences',
    problemClass: 'sentence-formation',
    parentObservation: 'The child has relevant words or ideas but frequently writes fragments, loses essential sentence parts, or produces word order that leaves the reader unsure of the complete message.',
    observableSignals: [
      'Writes a phrase or dependent idea where the task requires a complete sentence.',
      'Omits who or what the sentence is about, the action/state, or another essential part of the intended message.',
      'Can repeat a correct model but cannot build a fresh sentence independently.',
    ],
    diagnosticQuestions: [
      'Can the child say one complete sentence about the idea before writing?',
      'Is the intended idea complete orally but lost during transcription?',
      'Can the child identify what the reader still needs in an incomplete example?',
      'Does sentence structure remain stable when the topic changes?',
    ],
    likelyBreakdowns: [
      'The idea itself is not yet organised into one complete message.',
      'Core word order or subject–verb structure is unstable.',
      'The oral sentence is stronger than the written version because transcription load disrupts the structure.',
    ],
    firstTeachingMove: 'Reduce the task to one familiar idea, rehearse a complete oral sentence, then preserve that same core while writing before adding any extra detail.',
    gr1SkillIds: ['sentence-foundations', 'nouns-pronouns', 'verbs', 'articles-determiners', 'subject-verb-agreement', 'punctuation'],
    gr2TenseIds: ['simple-present'],
    gr3WritingStageIds: ['word-choice-idea-units', 'complete-sentence'],
    relatedProblemIds: ['very-short-sentences', 'speaking-grammar-does-not-transfer-to-writing'],
    interventionSequence: [
      'Ask the child to say one complete idea on a familiar topic.',
      'Use a minimal cue such as who, what happened or tell me the whole idea if the sentence is incomplete.',
      'Write the same sentence and compare it with the spoken version.',
      'Change the prompt and repeat with less support to test fresh sentence generation.',
    ],
    progressSignals: [
      'Produces a complete sentence without an adult finishing it.',
      'Keeps essential words and order when transferring the sentence into writing.',
      'Builds another complete sentence on a fresh topic with reduced prompting.',
    ],
    recommendedPracticeKinds: ['sentence-builder', 'error-correction'],
    coverageMode: 'direct-existing-owner',
    primaryPublicTopicId: 'sentence-formation',
    publicAnchorTopicIds: ['sentence-formation', 'grammar-progression'],
    coverageRationale: 'The existing sentence-formation diagnostic already owns the oral sentence → core structure → expansion → writing transfer pathway and explicitly distinguishes fragments from later writing problems.',
  }),
  problem({
    id: 'very-short-sentences',
    order: 4,
    label: 'Writes Very Short Sentences',
    problemClass: 'sentence-development',
    parentObservation: 'The child can usually produce complete sentences, but writing remains bare and underdeveloped because useful detail, explanation or connection is rarely added independently.',
    observableSignals: [
      'Writes several correct but minimal sentences even when the task invites useful detail.',
      'Adds detail only after repeated adult questions such as where, when, how or why.',
      'Makes sentences longer by adding random adjectives rather than information that improves the message.',
    ],
    diagnosticQuestions: [
      'Is the short sentence already complete and appropriate for the task?',
      'Can the child add one relevant detail without breaking the sentence core?',
      'Does the child know several ways to add information—place, time, manner, reason or specific description?',
      'Can two related short sentences be connected when that improves meaning?',
    ],
    likelyBreakdowns: [
      'The child has sentence completeness but not independent sentence expansion.',
      'Detail generation is weak or overly dependent on adult prompting.',
      'The learner equates “better sentence” with “more adjectives” instead of more useful meaning.',
    ],
    firstTeachingMove: 'Keep the complete sentence, choose one meaningful expansion dimension, and ask what new information the reader gains before adding any second layer.',
    gr1SkillIds: ['sentence-foundations', 'adjectives-adverbs', 'articles-determiners', 'prepositions', 'conjunctions'],
    gr2TenseIds: [],
    gr3WritingStageIds: ['complete-sentence', 'expanded-sentence', 'connected-sentences'],
    relatedProblemIds: ['incomplete-sentences', 'repetitive-sentence-beginnings', 'limited-descriptive-vocabulary'],
    interventionSequence: [
      'Confirm the base sentence is complete before trying to improve it.',
      'Add one useful where, when, how, which-one or why detail.',
      'Compare the expanded sentence with the original and keep only information that improves meaning.',
      'Apply the same expansion decision to a fresh sentence without supplying the detail.',
    ],
    progressSignals: [
      'Adds one relevant detail independently when the task needs it.',
      'Uses different kinds of expansion rather than one repeated formula.',
      'Can also decide when a short sentence is already effective and should remain short.',
    ],
    recommendedPracticeKinds: ['sentence-expansion', 'sentence-builder', 'conjunction-practice'],
    coverageMode: 'supported-by-existing-owners',
    primaryPublicTopicId: 'sentence-formation',
    publicAnchorTopicIds: ['sentence-formation', 'grammar-progression', 'conjunctions-guide'],
    coverageRationale: 'Sentence formation already owns expansion from a secure core, while the grammar roadmap and conjunction guide support later development; GR4 does not split “short sentences” into a competing diagnostic URL.',
  }),
  problem({
    id: 'repetitive-sentence-beginnings',
    order: 5,
    label: 'Repeats the Same Sentence Beginnings',
    problemClass: 'sentence-variety-cohesion',
    parentObservation: 'The child’s sentences are often individually correct, but several sentences begin in the same way or follow the same pattern, making paragraphs sound mechanical or list-like.',
    observableSignals: [
      'Several consecutive sentences begin with the same noun, pronoun or “I”.',
      'Uses first/then/next or and at the start of nearly every sentence regardless of relationship.',
      'Changes sentence openings only when given a replacement starter by an adult.',
    ],
    diagnosticQuestions: [
      'Is repetition actually reducing clarity or is the repeated subject necessary?',
      'Can pronouns or reference be used without making the reader unsure who is meant?',
      'Can the child combine two related ideas instead of merely swapping the first word?',
      'Can sentence order or clause structure create variety without adding unnecessary complexity?',
    ],
    likelyBreakdowns: [
      'The learner relies on one safe sentence template while planning content.',
      'Cohesion tools such as reference, conjunctions and sentence combining are available only with prompts.',
      'The child has been taught decorative sentence starters instead of meaningful relationships between ideas.',
    ],
    firstTeachingMove: 'Take a short paragraph, identify where repetition is genuinely distracting, then improve only those places through reference, combining, reordering or a different sentence structure that preserves meaning.',
    gr1SkillIds: ['nouns-pronouns', 'conjunctions', 'clauses-sentence-combining', 'paragraph-writing'],
    gr2TenseIds: [],
    gr3WritingStageIds: ['connected-sentences', 'cohesive-paragraph', 'descriptive-writing', 'narrative-writing'],
    relatedProblemIds: ['very-short-sentences', 'limited-descriptive-vocabulary', 'cannot-organise-paragraphs'],
    interventionSequence: [
      'Mark repeated openings in a short authentic paragraph without changing them yet.',
      'Decide which repetitions are acceptable and which make the writing mechanical.',
      'Revise selected sentences using reference, sentence combining, reordering or meaningful clause variation.',
      'Write a fresh paragraph and check variety without using a compulsory list of sentence starters.',
    ],
    progressSignals: [
      'Uses more than one workable sentence pattern across a paragraph without forced complexity.',
      'Varies reference and sentence structure while keeping subjects clear.',
      'Can explain why a revised opening improves flow rather than simply being different.',
    ],
    recommendedPracticeKinds: ['sentence-builder', 'conjunction-practice', 'editing-practice'],
    coverageMode: 'supported-by-existing-owners',
    primaryPublicTopicId: 'paragraph-writing-guide',
    publicAnchorTopicIds: ['paragraph-writing-guide', 'conjunctions-guide', 'creative-writing-guide'],
    coverageRationale: 'Existing paragraph, conjunction and creative-writing owners already teach cohesion and sentence variety. A separate sentence-starter page would risk encouraging formulaic variation and intent fragmentation.',
  }),
  problem({
    id: 'limited-descriptive-vocabulary',
    order: 6,
    label: 'Uses Limited Descriptive Vocabulary',
    problemClass: 'word-choice-description',
    parentObservation: 'The child relies heavily on vague words such as nice, good, big or went and struggles to select precise nouns, verbs or details that help a reader picture or understand the subject.',
    observableSignals: [
      'Repeats the same general adjectives across unrelated topics.',
      'Adds many describing words but the reader still learns little specific information.',
      'Can recognise richer vocabulary in reading but cannot retrieve appropriate words during independent writing.',
    ],
    diagnosticQuestions: [
      'Is the real problem vocabulary knowledge, retrieval under writing load, or knowing which detail matters?',
      'Can the child choose a more precise noun or verb before adding adjectives?',
      'Does the chosen detail help the reader understand the person, place, object or event?',
      'Can the child reuse a descriptive strategy on a new topic without copying the same word bank?',
    ],
    likelyBreakdowns: [
      'Expressive retrieval is weaker than recognition vocabulary.',
      'Description has been taught as adjective accumulation rather than purposeful detail selection.',
      'The child lacks a strategy for observing and selecting details before drafting.',
    ],
    firstTeachingMove: 'Start with one concrete subject, choose the detail the reader most needs, and improve the noun or verb before adding extra modifiers; then reuse the decision on a different subject.',
    gr1SkillIds: ['nouns-pronouns', 'verbs', 'adjectives-adverbs', 'prepositions', 'descriptive-narrative-writing'],
    gr2TenseIds: ['simple-present', 'present-continuous'],
    gr3WritingStageIds: ['word-choice-idea-units', 'expanded-sentence', 'descriptive-writing'],
    relatedProblemIds: ['very-short-sentences', 'repetitive-sentence-beginnings'],
    interventionSequence: [
      'Observe one familiar subject and select only the most useful details.',
      'Improve precision through a noun or verb choice before adding modifiers.',
      'Build one expanded sentence that communicates the chosen detail clearly.',
      'Change the subject and repeat without reusing the original word bank as a script.',
    ],
    progressSignals: [
      'Chooses more precise content words without being given a synonym list each time.',
      'Adds fewer but more relevant descriptive details.',
      'Transfers descriptive decision-making to a new person, place, object or scene.',
    ],
    recommendedPracticeKinds: ['sentence-expansion', 'sentence-builder'],
    coverageMode: 'supported-by-existing-owners',
    primaryPublicTopicId: 'creative-writing-guide',
    publicAnchorTopicIds: ['creative-writing-guide', 'paragraph-writing-guide', 'grammar-progression'],
    coverageRationale: 'The creative-writing and writing-progression owners already teach purposeful detail and precise word choice; GR4 keeps vocabulary support inside authentic writing rather than creating thin synonym-style pages.',
  }),
  problem({
    id: 'cannot-organise-paragraphs',
    order: 7,
    label: 'Cannot Organise Paragraphs',
    problemClass: 'paragraph-organisation',
    parentObservation: 'The child can write individual sentences but struggles to keep them around one main idea, choose relevant details, order them logically or make the paragraph flow as one unit.',
    observableSignals: [
      'Writes several grammatical sentences that do not belong to the same main idea.',
      'Includes off-topic details or repeats the same point to reach a sentence count.',
      'Has relevant ideas but presents them in an order that is difficult for another reader to follow.',
    ],
    diagnosticQuestions: [
      'Can the child state the paragraph focus in one short phrase before drafting?',
      'Can the child distinguish a useful supporting detail from an unrelated detail?',
      'Can the child put three relevant ideas into an order and explain the choice?',
      'After drafting, can the child identify how one sentence connects to the next?',
    ],
    likelyBreakdowns: [
      'The child begins drafting before choosing a clear focus.',
      'Selection and ordering of details are weaker than sentence-level grammar.',
      'The learner treats a paragraph as a fixed number of sentences rather than a coherent unit of meaning.',
    ],
    firstTeachingMove: 'Use one narrow topic and the sequence FOCUS → PLAN → SAY → WRITE → CONNECT → REREAD, separating idea selection and order from sentence-level correction.',
    gr1SkillIds: ['conjunctions', 'tenses', 'clauses-sentence-combining', 'punctuation', 'paragraph-writing'],
    gr2TenseIds: ['tense-consistency-transfer'],
    gr3WritingStageIds: ['connected-sentences', 'focused-paragraph', 'cohesive-paragraph', 'explanation-opinion-writing'],
    relatedProblemIds: ['repetitive-sentence-beginnings', 'weak-editing', 'mixes-tenses'],
    interventionSequence: [
      'Narrow the topic to one clear paragraph focus.',
      'Brainstorm several details and deliberately remove weak or off-topic options.',
      'Arrange the selected details before writing full sentences.',
      'Draft, connect and reread for relevance and flow before surface editing.',
    ],
    progressSignals: [
      'States and maintains one paragraph focus with fewer off-topic sentences.',
      'Selects and orders supporting details with less adult direction.',
      'Improves flow through reference, order or purposeful connection rather than a fixed transition formula.',
    ],
    recommendedPracticeKinds: ['paragraph-organiser', 'conjunction-practice', 'editing-practice'],
    coverageMode: 'supported-by-existing-owners',
    primaryPublicTopicId: 'paragraph-writing-guide',
    publicAnchorTopicIds: ['paragraph-writing-guide', 'conjunctions-guide', 'grammar-editing-guide'],
    coverageRationale: 'The paragraph-writing owner explicitly covers focus, relevant details, order, cohesion and rereading, so the parent problem is already substantively covered without a second paragraph-organisation owner.',
  }),
  problem({
    id: 'poor-punctuation',
    order: 8,
    label: 'Poor Punctuation',
    problemClass: 'writing-conventions',
    parentObservation: 'The child omits or misuses capitals and punctuation, especially when moving from isolated sentences into longer or more connected writing.',
    observableSignals: [
      'Sentence boundaries disappear in a short passage even though the child can add a full stop to an isolated example.',
      'Capital letters are inconsistent at sentence starts or in familiar proper nouns.',
      'Commas, apostrophes or other taught punctuation are inserted mechanically without showing the intended structure or meaning.',
    ],
    diagnosticQuestions: [
      'Can the child hear or identify where one complete sentence ends before adding punctuation?',
      'Is the punctuation mark itself unknown, or does the child lose it only under writing load?',
      'Can the child explain what the mark is doing in the sentence?',
      'Can the child find the same punctuation issue during a later reread without being shown the location?',
    ],
    likelyBreakdowns: [
      'Sentence-boundary understanding is weaker than memorised punctuation rules.',
      'The child knows a mark in isolation but does not retrieve it while composing.',
      'Punctuation has been practised as symbol insertion without linking it to sentence structure and meaning.',
    ],
    firstTeachingMove: 'Begin with sentence boundaries and meaning, then practise one punctuation target at a time inside real sentences before asking for mixed proofreading across a paragraph.',
    gr1SkillIds: ['sentence-foundations', 'clauses-sentence-combining', 'punctuation', 'editing-revision'],
    gr2TenseIds: [],
    gr3WritingStageIds: ['complete-sentence', 'connected-sentences', 'focused-paragraph', 'editing-revision-transfer'],
    relatedProblemIds: ['incomplete-sentences', 'weak-editing'],
    interventionSequence: [
      'Read the sentence or passage for meaning and locate sentence boundaries first.',
      'Work on one known punctuation function rather than a mixed error hunt.',
      'Repair the mark and reread the whole sentence to confirm structure and meaning.',
      'Return later with a fresh passage where the child must detect the target independently.',
    ],
    progressSignals: [
      'Marks sentence boundaries more consistently during original writing.',
      'Can explain the function of a taught punctuation mark in context.',
      'Finds and repairs punctuation errors during independent rereading with fewer prompts.',
    ],
    recommendedPracticeKinds: ['punctuation-challenge', 'error-correction', 'editing-practice'],
    coverageMode: 'supported-by-existing-owners',
    primaryPublicTopicId: 'punctuation-capitalisation-guide',
    publicAnchorTopicIds: ['punctuation-capitalisation-guide', 'grammar-editing-guide', 'sentence-formation'],
    coverageRationale: 'The punctuation/capitalisation guide owns the skill and the editing guide owns find-and-fix practice. GR4 routes the parent complaint to those owners instead of creating punctuation-mark micro-pages.',
  }),
  problem({
    id: 'weak-editing',
    order: 9,
    label: 'Weak Editing and Revision',
    problemClass: 'editing-independence',
    parentObservation: 'The child finishes a draft and either does not reread it, checks only spelling, or can correct errors only when an adult identifies exactly what and where to fix.',
    observableSignals: [
      'Says the work is finished immediately after drafting without rereading for meaning or accuracy.',
      'Can fix a named error but rarely detects the same error independently.',
      'Changes words randomly to make writing sound “better” while leaving organisation, tense or clarity problems untouched.',
    ],
    diagnosticQuestions: [
      'Can the child separate revision of meaning and organisation from surface editing?',
      'Can the child find one target error without being told its exact location?',
      'Can the child explain why a proposed change improves meaning or accuracy?',
      'Does the same self-check transfer to the child’s own fresh writing?',
    ],
    likelyBreakdowns: [
      'Editing has been experienced mainly as teacher correction rather than a child-controlled process.',
      'The checklist contains too many targets for working memory to manage at once.',
      'Error detection is weaker than error correction: the child can repair a problem once it is pointed out.',
    ],
    firstTeachingMove: 'Use one editing pass with one target and the cycle FIND → EXPLAIN → FIX → REREAD → TRANSFER before gradually mixing previously secured checks.',
    gr1SkillIds: ['subject-verb-agreement', 'tenses', 'punctuation', 'paragraph-writing', 'editing-revision'],
    gr2TenseIds: ['tense-consistency-transfer'],
    gr3WritingStageIds: ['focused-paragraph', 'cohesive-paragraph', 'editing-revision-transfer'],
    relatedProblemIds: ['knows-rules-but-does-not-use-them', 'mixes-tenses', 'poor-punctuation', 'cannot-organise-paragraphs'],
    interventionSequence: [
      'Choose one editing target the child has already been taught.',
      'Ask the child to find the possible problem before offering a correction.',
      'Require a short explanation, make the smallest accurate fix and reread the whole sentence.',
      'Use the same editing question later on a fresh sentence or the child’s own draft.',
    ],
    progressSignals: [
      'Rereads writing without being reminded every time.',
      'Finds some familiar errors independently before an adult marks them.',
      'Makes purposeful revisions for meaning as well as surface corrections for grammar or punctuation.',
    ],
    recommendedPracticeKinds: ['editing-practice', 'error-correction', 'punctuation-challenge', 'tense-choice'],
    coverageMode: 'supported-by-existing-owners',
    primaryPublicTopicId: 'grammar-editing-guide',
    publicAnchorTopicIds: ['grammar-editing-guide', 'grammar-assessment-guide', 'grammar-transfer-mistakes'],
    coverageRationale: 'The existing editing owner already separates revising, editing and proofreading and teaches find → explain → fix → reread → transfer; GR4 therefore treats the problem as substantively covered.',
  }),
  problem({
    id: 'speaking-grammar-does-not-transfer-to-writing',
    order: 10,
    label: 'Speaking Grammar Does Not Transfer to Writing',
    problemClass: 'oral-written-transfer',
    parentObservation: 'The child can say a sentence accurately or use the target grammar in conversation, but omits words, changes structure, loses tense or drops conventions when writing the same or a similar idea.',
    observableSignals: [
      'Says a complete accurate sentence, then writes a fragment or changes the word order.',
      'Uses the correct tense orally but switches or simplifies the verb form during writing.',
      'Writing accuracy drops sharply when spelling, handwriting, planning and punctuation are added at the same time.',
    ],
    diagnosticQuestions: [
      'Can the child say the exact intended sentence clearly before writing?',
      'Which part changes between the spoken and written versions—words, order, tense, agreement or punctuation?',
      'Does reducing transcription load improve preservation of the oral sentence?',
      'Can the child transfer the same oral-to-written strategy to a fresh sentence rather than only copy one model?',
    ],
    likelyBreakdowns: [
      'The grammar is available orally but writing load disrupts retrieval and sentence maintenance.',
      'The child begins writing before stabilising the intended sentence or idea.',
      'Practice has not explicitly bridged successful oral production into independent written production.',
    ],
    firstTeachingMove: 'Use SAY → HOLD → WRITE → READ BACK → COMPARE on one short sentence, preserving the successful oral model while identifying exactly what changes during writing.',
    gr1SkillIds: ['sentence-foundations', 'nouns-pronouns', 'verbs', 'subject-verb-agreement', 'tenses', 'punctuation', 'editing-revision'],
    gr2TenseIds: ['simple-present', 'simple-past', 'tense-consistency-transfer'],
    gr3WritingStageIds: ['complete-sentence', 'expanded-sentence', 'connected-sentences', 'editing-revision-transfer'],
    relatedProblemIds: ['knows-rules-but-does-not-use-them', 'incomplete-sentences', 'mixes-tenses'],
    interventionSequence: [
      'Elicit one clear oral sentence before writing begins.',
      'Write the same sentence with unnecessary planning demands reduced.',
      'Read the written version aloud and compare it directly with the intended sentence.',
      'Change the topic and repeat until the bridge works with less oral and adult support.',
    ],
    progressSignals: [
      'Preserves more essential words and structure when moving from speech to writing.',
      'Maintains oral tense/agreement choices more reliably in the written version.',
      'Uses the oral-rehearsal bridge on a new writing task without needing a supplied model sentence.',
    ],
    recommendedPracticeKinds: ['sentence-builder', 'error-correction', 'editing-practice'],
    coverageMode: 'direct-existing-owner',
    primaryPublicTopicId: 'grammar-transfer-mistakes',
    publicAnchorTopicIds: ['grammar-transfer-mistakes', 'sentence-formation', 'grammar-editing-guide'],
    coverageRationale: 'The grammar-transfer diagnostic explicitly distinguishes a child who speaks accurately but loses the pattern while writing, while sentence formation provides the oral → core → writing-transfer scaffold.',
  }),
]);

const problemById = new Map(GRAMMAR_WRITING_PARENT_PROBLEMS.map((item) => [item.id, item]));
const practiceKinds = new Set(GRAMMAR_WRITING_GR5_PRACTICE_KINDS);

export const GRAMMAR_WRITING_PARENT_PROBLEM_SKILL_EDGES = freezeList(
  GRAMMAR_WRITING_PARENT_PROBLEMS.flatMap((item) => item.gr1SkillIds.map((skillId) => freeze({ problemId: item.id, relation: 'depends-on-skill', skillId }))),
);
export const GRAMMAR_WRITING_PARENT_PROBLEM_TENSE_EDGES = freezeList(
  GRAMMAR_WRITING_PARENT_PROBLEMS.flatMap((item) => item.gr2TenseIds.map((tenseId) => freeze({ problemId: item.id, relation: 'depends-on-tense-control', tenseId }))),
);
export const GRAMMAR_WRITING_PARENT_PROBLEM_WRITING_EDGES = freezeList(
  GRAMMAR_WRITING_PARENT_PROBLEMS.flatMap((item) => item.gr3WritingStageIds.map((writingStageId) => freeze({ problemId: item.id, relation: 'appears-in-writing-stage', writingStageId }))),
);

export const getGrammarWritingParentProblem = (id) => problemById.get(String(id || '')) ?? null;
export const getGrammarWritingParentProblemsForSkill = (skillId) => freezeList(
  GRAMMAR_WRITING_PARENT_PROBLEMS.filter((item) => item.gr1SkillIds.includes(String(skillId || ''))),
);
export const getGrammarWritingParentProblemsForTense = (tenseId) => freezeList(
  GRAMMAR_WRITING_PARENT_PROBLEMS.filter((item) => item.gr2TenseIds.includes(String(tenseId || ''))),
);
export const getGrammarWritingParentProblemsForWritingStage = (stageId) => freezeList(
  GRAMMAR_WRITING_PARENT_PROBLEMS.filter((item) => item.gr3WritingStageIds.includes(String(stageId || ''))),
);
export const getGrammarWritingParentProblemsForPracticeKind = (practiceKind) => freezeList(
  GRAMMAR_WRITING_PARENT_PROBLEMS.filter((item) => item.recommendedPracticeKinds.includes(String(practiceKind || ''))),
);
export const getGrammarWritingParentProblemsByCoverageMode = (coverageMode) => freezeList(
  GRAMMAR_WRITING_PARENT_PROBLEMS.filter((item) => item.coverageMode === String(coverageMode || '')),
);

if (problemById.size !== 10) throw new Error('GR4 must contain exactly 10 stable Tier-1 grammar/writing parent problems.');
if (GRAMMAR_WRITING_PARENT_PROBLEMS.map((item) => item.order).join(',') !== '1,2,3,4,5,6,7,8,9,10') throw new Error('GR4 parent-problem order must remain stable from 1 through 10.');
if (new Set(GRAMMAR_WRITING_GR5_PRACTICE_KINDS).size !== 9) throw new Error('GR4 GR5 practice handoff vocabulary contains duplicates or missing kinds.');

for (const item of GRAMMAR_WRITING_PARENT_PROBLEMS) {
  if (!item.parentObservation || item.parentObservation.length < 110) throw new Error(`GR4 parent observation is too thin: ${item.id}.`);
  if (item.observableSignals.length < 3 || item.diagnosticQuestions.length < 4 || item.likelyBreakdowns.length < 3) throw new Error(`GR4 diagnostic evidence is incomplete: ${item.id}.`);
  if (!item.firstTeachingMove || item.firstTeachingMove.length < 100 || item.interventionSequence.length < 4 || item.progressSignals.length < 3) throw new Error(`GR4 intervention model is incomplete: ${item.id}.`);
  if (!['direct-existing-owner', 'supported-by-existing-owners'].includes(item.coverageMode)) throw new Error(`GR4 coverage mode is invalid: ${item.id}.`);
  if (!item.coverageRationale || item.coverageRationale.length < 100) throw new Error(`GR4 coverage rationale is too thin: ${item.id}.`);
  if (!item.gr1SkillIds.length || !item.gr3WritingStageIds.length || !item.recommendedPracticeKinds.length || !item.publicAnchorTopicIds.length) throw new Error(`GR4 architecture links are incomplete: ${item.id}.`);
  if (!item.publicAnchorTopicIds.includes(item.primaryPublicTopicId)) throw new Error(`GR4 primary public owner must also be an anchor: ${item.id}.`);
  for (const skillId of item.gr1SkillIds) if (!getGrammarWritingSkill(skillId)) throw new Error(`GR4 references unknown GR1 skill: ${item.id} -> ${skillId}.`);
  for (const tenseId of item.gr2TenseIds) if (!getGrammarWritingTense(tenseId)) throw new Error(`GR4 references unknown GR2 tense: ${item.id} -> ${tenseId}.`);
  for (const stageId of item.gr3WritingStageIds) if (!getGrammarWritingWritingStage(stageId)) throw new Error(`GR4 references unknown GR3 writing stage: ${item.id} -> ${stageId}.`);
  for (const relatedId of item.relatedProblemIds) if (!problemById.has(relatedId) || relatedId === item.id) throw new Error(`GR4 related-problem reference is invalid: ${item.id} -> ${relatedId}.`);
  for (const practiceKind of item.recommendedPracticeKinds) if (!practiceKinds.has(practiceKind)) throw new Error(`GR4 references unknown GR5 practice kind: ${item.id} -> ${practiceKind}.`);
  for (const topicId of item.publicAnchorTopicIds) if (!getR19CanonicalTopicOwner(topicId)) throw new Error(`GR4 references unknown canonical topic owner: ${item.id} -> ${topicId}.`);
  if (!getR19CanonicalTopicOwner(item.primaryPublicTopicId)) throw new Error(`GR4 primary canonical topic owner is missing: ${item.id}.`);
}

for (const skill of GRAMMAR_WRITING_SKILL_TAXONOMY) {
  if (!GRAMMAR_WRITING_PARENT_PROBLEMS.some((item) => item.gr1SkillIds.includes(skill.id))) throw new Error(`GR4 leaves a GR1 skill disconnected from parent problems: ${skill.id}.`);
}
for (const tense of GRAMMAR_WRITING_TENSE_NODES) {
  if (!GRAMMAR_WRITING_PARENT_PROBLEMS.some((item) => item.gr2TenseIds.includes(tense.id))) throw new Error(`GR4 leaves a GR2 tense disconnected from parent-problem diagnosis: ${tense.id}.`);
}
for (const stage of GRAMMAR_WRITING_WRITING_STAGES) {
  if (!GRAMMAR_WRITING_PARENT_PROBLEMS.some((item) => item.gr3WritingStageIds.includes(stage.id))) throw new Error(`GR4 leaves a GR3 writing stage disconnected from parent-problem diagnosis: ${stage.id}.`);
}
for (const practiceKind of GRAMMAR_WRITING_GR5_PRACTICE_KINDS) {
  if (!GRAMMAR_WRITING_PARENT_PROBLEMS.some((item) => item.recommendedPracticeKinds.includes(practiceKind))) throw new Error(`GR4 leaves a planned GR5 practice kind without a parent-problem use case: ${practiceKind}.`);
}
