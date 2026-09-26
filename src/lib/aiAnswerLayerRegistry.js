import { PHONICS_READING_PROBLEMS } from './phonicsReadingProblemRegistry.js';
import { GRAMMAR_WRITING_PARENT_PROBLEMS } from './grammarWritingParentProblemArchitecture.js';
import { getR19CanonicalTopicOwner } from './grammarWritingSemanticCanonicalOwnership.js';
import {
  SPEAKING_COMMUNICATION_PARENT_PROBLEM_ROUTES,
} from './speakingCommunicationCompletionArchitecture.js';
import { PHONICS_PUBLISHED_RESOURCE_PAGES } from './phonicsPublicationRegistry.js';
import { GRAMMAR_PUBLISHED_RESOURCE_PAGES } from './grammarPublicationRegistry.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);
const item = (config) => freeze({
  ...config,
  supportingPaths: freezeList(config.supportingPaths),
  practicePaths: freezeList(config.practicePaths),
});

export const AI_ANSWER_LAYER_REVISION = '2026-09-27-r28-grammar-pseo';
export const AI_ANSWER_LAYER_MACHINE_JSON_PATH = '/ai-resource-index.json';
export const AI_ANSWER_LAYER_MACHINE_TEXT_PATH = '/ai-resource-index.txt';

export const AI_ANSWER_LAYER_DEFINITIONS = freezeList([
  freeze({
    id: 'layer-1-parent-problems',
    layer: 1,
    label: 'Parent problems',
    purpose: 'Match natural parent problem wording to one established answer owner, supporting explanation and a next practice path.',
  }),
  freeze({
    id: 'layer-2-learning-concepts',
    layer: 2,
    label: 'Learning concepts',
    purpose: 'Expose canonical educational explanations for phonics, reading, grammar, writing, speaking and communication concepts.',
  }),
  freeze({
    id: 'layer-3-practice-actions',
    layer: 3,
    label: 'Practice and next actions',
    purpose: 'Connect an understood problem or concept to focused practice without turning practice pages into competing informational owners.',
  }),
]);

const subjectHub = (subject) => ({
  'phonics-reading': '/resources/phonics',
  'grammar-writing': '/resources/grammar',
  'speaking-communication': '/resources/speaking',
}[subject] || '/resources');

const resolveGrammarOwnerPath = (topicId) =>
  getR19CanonicalTopicOwner(topicId)?.ownerPath || '/resources/grammar';

const resolveGrammarReferencePaths = (topicIds = []) =>
  [...new Set(topicIds.map(resolveGrammarOwnerPath).filter(Boolean))];

const PHONICS_PROBLEM_ITEMS = PHONICS_READING_PROBLEMS.map((problem) => item({
  id: `problem-phonics-${problem.id}`,
  layer: 1,
  subject: 'phonics-reading',
  query: problem.label,
  answer: problem.explanation,
  answerSource: 'frozen-parent-problem-registry',
  canonicalPath: problem.ownerPath || problem.nextStepPaths[0] || '/resources/phonics',
  ownershipState: problem.ownerState,
  hubPath: '/resources/phonics',
  supportingPaths: problem.nextStepPaths,
  practicePaths: problem.practicePaths,
}));

const GRAMMAR_PROBLEM_ITEMS = GRAMMAR_WRITING_PARENT_PROBLEMS.map((problem) => item({
  id: `problem-grammar-${problem.id}`,
  layer: 1,
  subject: 'grammar-writing',
  query: problem.label,
  answer: problem.likelyBreakdowns?.[0] || problem.firstTeachingMove || null,
  answerSource: 'frozen-parent-problem-registry',
  canonicalPath: resolveGrammarOwnerPath(problem.primaryPublicTopicId),
  ownershipState: problem.coverageMode,
  hubPath: '/resources/grammar',
  supportingPaths: resolveGrammarReferencePaths(problem.publicAnchorTopicIds),
  practicePaths: ['/free-grammar-games-for-kids', '/free-sentence-building-games-for-kids'],
}));

const SPEAKING_PROBLEM_ITEMS = SPEAKING_COMMUNICATION_PARENT_PROBLEM_ROUTES.map((problem) => item({
  id: `problem-speaking-${problem.id}`,
  layer: 1,
  subject: 'speaking-communication',
  query: problem.problem,
  answer: null,
  answerSource: 'canonical-owner-visible-answer',
  canonicalPath: problem.ownerPath,
  ownershipState: 'existing-owner',
  hubPath: '/resources/speaking',
  supportingPaths: [problem.supportingPath].filter(Boolean),
  practicePaths: [problem.practicePath].filter(Boolean),
}));

export const AI_ANSWER_LAYER_1_PARENT_PROBLEMS = freezeList([
  ...PHONICS_PROBLEM_ITEMS,
  ...GRAMMAR_PROBLEM_ITEMS,
  ...SPEAKING_PROBLEM_ITEMS,
]);

const CURATED_CONCEPTS = [
  {
    id: 'concept-what-is-phonics',
    subject: 'phonics-reading',
    query: 'What is phonics for kids?',
    canonicalPath: '/blog/what-is-phonics-for-kids',
    supportingPaths: ['/blog/phonics-for-parents-guide', '/resources/phonics'],
  },
  {
    id: 'concept-phonics-start-age',
    subject: 'phonics-reading',
    query: 'What age should a child start phonics?',
    canonicalPath: '/blog/what-age-to-start-phonics',
    supportingPaths: ['/blog/what-is-phonics-for-kids', '/resources/phonics'],
  },
  {
    id: 'concept-phonics-at-home',
    subject: 'phonics-reading',
    query: 'How can parents support phonics at home?',
    canonicalPath: '/blog/phonics-for-parents-guide',
    supportingPaths: ['/resources/phonics', '/free-letter-sound-games-for-kids'],
  },
  {
    id: 'concept-satpin',
    subject: 'phonics-reading',
    query: 'What is SATPIN phonics and why is it used?',
    canonicalPath: '/blog/satpin-phonics-guide',
    supportingPaths: ['/blog/how-kids-learn-blending', '/resources/phonics'],
  },
  {
    id: 'concept-blending',
    subject: 'phonics-reading',
    query: 'How do children learn to blend sounds into words?',
    canonicalPath: '/blog/how-kids-learn-blending',
    supportingPaths: ['/blog/cvc-words-explained-for-parents', '/free-word-building-games-for-kids'],
  },
  {
    id: 'concept-cvc',
    subject: 'phonics-reading',
    query: 'What are CVC words and why do children learn them?',
    canonicalPath: '/blog/cvc-words-explained-for-parents',
    supportingPaths: ['/blog/how-kids-learn-blending', '/resources/phonics'],
  },
  {
    id: 'concept-phonological-awareness',
    subject: 'phonics-reading',
    query: 'What is the difference between phonological awareness, phonemic awareness and phonics?',
    canonicalPath: '/blog/phonological-awareness-vs-phonemic-awareness-vs-phonics',
    supportingPaths: ['/blog/what-is-phonics-for-kids', '/resources/phonics'],
  },
  {
    id: 'concept-automatic-word-recognition',
    subject: 'phonics-reading',
    query: 'How do children begin to recognise words automatically after phonics?',
    canonicalPath: '/blog/how-children-recognise-words-automatically-after-phonics',
    supportingPaths: ['/blog/how-to-improve-reading-fluency-in-children', '/resources/phonics'],
  },
  {
    id: 'concept-vocabulary-comprehension',
    subject: 'phonics-reading',
    query: 'How does vocabulary support reading comprehension?',
    canonicalPath: '/blog/how-vocabulary-supports-reading-comprehension',
    supportingPaths: ['/blog/why-child-reads-words-but-does-not-understand-story', '/resources/phonics'],
  },
  {
    id: 'concept-grammar-progression',
    subject: 'grammar-writing',
    query: 'How should grammar progress from words and sentences into writing?',
    canonicalPath: '/blog/grammar-nouns-to-paragraphs',
    supportingPaths: ['/resources/grammar', '/blog/how-to-teach-paragraph-writing-to-kids'],
  },
  {
    id: 'concept-sentence-formation',
    subject: 'grammar-writing',
    query: 'How can children improve sentence formation?',
    canonicalPath: '/blog/how-to-improve-sentence-formation-in-kids',
    supportingPaths: ['/resources/grammar', '/free-sentence-building-games-for-kids'],
  },
  {
    id: 'concept-grammar-transfer',
    subject: 'grammar-writing',
    query: 'Why does a child know grammar rules but still make mistakes?',
    canonicalPath: '/blog/child-knows-grammar-but-makes-mistakes',
    supportingPaths: ['/resources/grammar', '/blog/grammar-assessment'],
  },
  {
    id: 'concept-tenses',
    subject: 'grammar-writing',
    query: 'How should children learn English tenses?',
    canonicalPath: '/blog/grammar-tenses',
    supportingPaths: ['/resources/grammar', '/blog/grammar-subject-verb'],
  },
  {
    id: 'concept-subject-verb-agreement',
    subject: 'grammar-writing',
    query: 'What is subject-verb agreement for kids?',
    canonicalPath: '/blog/grammar-subject-verb',
    supportingPaths: ['/resources/grammar', '/blog/grammar-tenses'],
  },
  {
    id: 'concept-conjunctions',
    subject: 'grammar-writing',
    query: 'How do conjunctions help children build stronger sentences?',
    canonicalPath: '/blog/grammar-conjunctions',
    supportingPaths: ['/blog/how-to-improve-sentence-formation-in-kids', '/resources/grammar'],
  },
  {
    id: 'concept-punctuation-capitals',
    subject: 'grammar-writing',
    query: 'How should children learn punctuation and capital letters?',
    canonicalPath: '/blog/punctuation-and-capital-letters-for-kids',
    supportingPaths: ['/resources/grammar', '/blog/grammar-editing-camp'],
  },
  {
    id: 'concept-paragraph-writing',
    subject: 'grammar-writing',
    query: 'How do you teach paragraph writing to kids?',
    canonicalPath: '/blog/how-to-teach-paragraph-writing-to-kids',
    supportingPaths: ['/resources/grammar', '/blog/grammar-nouns-to-paragraphs'],
  },
  {
    id: 'concept-creative-writing',
    subject: 'grammar-writing',
    query: 'How can children build creative writing skills?',
    canonicalPath: '/blog/grammar-creative-writing',
    supportingPaths: ['/blog/how-to-teach-paragraph-writing-to-kids', '/resources/grammar'],
  },
  {
    id: 'concept-conversation-skills',
    subject: 'speaking-communication',
    query: 'How can children build better conversation skills?',
    canonicalPath: '/blog/conversation-skills-for-kids',
    supportingPaths: ['/resources/speaking', '/blog/child-gives-one-word-answers'],
  },
  {
    id: 'concept-storytelling',
    subject: 'speaking-communication',
    query: 'How do you teach storytelling to kids?',
    canonicalPath: '/blog/how-to-teach-storytelling-to-kids',
    supportingPaths: ['/resources/speaking', '/blog/grammar-speaking-bridge'],
  },
  {
    id: 'concept-speaking-confidence',
    subject: 'speaking-communication',
    query: 'How does speaking confidence develop in children?',
    canonicalPath: '/blog/speaking-confidence-seeds',
    supportingPaths: ['/resources/speaking', '/blog/child-understands-english-but-does-not-speak'],
  },
  {
    id: 'concept-speech-structure',
    subject: 'speaking-communication',
    query: 'How can children organise a speech or presentation?',
    canonicalPath: '/blog/speaking-structure',
    supportingPaths: ['/resources/speaking', '/blog/public-speaking-delivery-for-kids'],
  },
  {
    id: 'concept-public-speaking-delivery',
    subject: 'speaking-communication',
    query: 'How can kids improve public-speaking delivery?',
    canonicalPath: '/blog/public-speaking-delivery-for-kids',
    supportingPaths: ['/blog/speaking-video-feedback', '/resources/speaking'],
  },
  {
    id: 'concept-discussion-reasoning',
    subject: 'speaking-communication',
    query: 'How can children learn to express and support opinions?',
    canonicalPath: '/blog/speaking-debate-starters',
    supportingPaths: ['/resources/speaking', '/free-speaking-games-for-kids'],
  },
  {
    id: 'concept-visual-aids',
    subject: 'speaking-communication',
    query: 'How should children use visual aids in a presentation?',
    canonicalPath: '/blog/speaking-visual-aids',
    supportingPaths: ['/blog/public-speaking-delivery-for-kids', '/resources/speaking'],
  },
  {
    id: 'concept-video-feedback',
    subject: 'speaking-communication',
    query: 'How can video feedback help children practise speaking?',
    canonicalPath: '/blog/speaking-video-feedback',
    supportingPaths: ['/blog/public-speaking-delivery-for-kids', '/resources/speaking'],
  },
  {
    id: 'concept-speaking-competition-prep',
    subject: 'speaking-communication',
    query: 'How should a child prepare for a speaking competition?',
    canonicalPath: '/blog/speaking-competition-prep',
    supportingPaths: ['/blog/speaking-video-feedback', '/resources/speaking'],
  },
];

const CURATED_CONCEPT_ITEMS = CURATED_CONCEPTS.map((concept) => item({
  ...concept,
  layer: 2,
  answer: null,
  answerSource: 'canonical-owner-visible-answer',
  ownershipState: 'existing-owner',
  hubPath: subjectHub(concept.subject),
  practicePaths: [],
}));

const GOVERNED_PHONICS_CONCEPT_ITEMS = PHONICS_PUBLISHED_RESOURCE_PAGES.map((page) => item({
  id: `concept-governed-phonics-${page.conceptId}`,
  layer: 2,
  subject: 'phonics-reading',
  query: page.concept.parentQuestion || page.cardTitle,
  answer: page.concept.quickAnswer,
  answerSource: 'governed-phonics-dataset',
  canonicalPath: page.path,
  ownershipState: page.publicationState,
  hubPath: '/resources/phonics',
  supportingPaths: page.concept.supportingPaths || [],
  practicePaths: page.concept.practicePaths || [],
}));

const GOVERNED_GRAMMAR_CONCEPT_ITEMS = GRAMMAR_PUBLISHED_RESOURCE_PAGES.map((page) => item({
  id: `concept-governed-grammar-${page.id}`,
  layer: 2,
  subject: 'grammar-writing',
  query: page.parentQuestion || page.cardTitle,
  answer: page.quickAnswer,
  answerSource: 'governed-grammar-dataset',
  canonicalPath: page.path,
  ownershipState: page.publicationState,
  hubPath: '/resources/grammar',
  supportingPaths: page.relatedPaths || [],
  practicePaths: page.practicePaths || [],
}));

export const AI_ANSWER_LAYER_2_LEARNING_CONCEPTS = freezeList([
  ...CURATED_CONCEPT_ITEMS,
  ...GOVERNED_PHONICS_CONCEPT_ITEMS,
  ...GOVERNED_GRAMMAR_CONCEPT_ITEMS,
]);

const PRACTICE_ACTIONS = [
  {
    id: 'practice-letter-sounds',
    subject: 'phonics-reading',
    query: 'Practise letter sounds',
    answer: 'Use short sound-recognition practice, then connect that knowledge to blending rather than keeping letter sounds isolated.',
    canonicalPath: '/free-letter-sound-games-for-kids',
    supportingPaths: ['/resources/phonics'],
  },
  {
    id: 'practice-word-building',
    subject: 'phonics-reading',
    query: 'Practise blending and word building',
    answer: 'Use controlled word-building practice with already-taught sound-letter patterns so the child practises blending, segmenting and transfer.',
    canonicalPath: '/free-word-building-games-for-kids',
    supportingPaths: ['/blog/how-kids-learn-blending', '/resources/phonics'],
  },
  {
    id: 'practice-reading',
    subject: 'phonics-reading',
    query: 'Practise reading accuracy and fluency',
    answer: 'Use reading practice after decoding is accurate enough; fluency work should improve ease and phrasing without replacing accurate word reading.',
    canonicalPath: '/free-reading-games-for-kids',
    supportingPaths: ['/blog/how-to-improve-reading-fluency-in-children', '/resources/phonics'],
  },
  {
    id: 'practice-tracing-sounds',
    subject: 'phonics-reading',
    query: 'Practise letter tracing with sounds',
    answer: 'Sound-supported tracing can reinforce letter-form and sound links, but it should feed into sound retrieval and later blending.',
    canonicalPath: '/letter-tracing-with-sounds-game',
    supportingPaths: ['/free-letter-sound-games-for-kids', '/resources/phonics'],
  },
  {
    id: 'practice-spelling',
    subject: 'phonics-reading',
    query: 'Practise spelling and segmenting',
    answer: 'Spelling practice should separate hearing the phonemes in a spoken word from choosing the correct spelling pattern.',
    canonicalPath: '/free-spelling-game-for-kids',
    supportingPaths: ['/free-word-building-games-for-kids', '/resources/phonics'],
  },
  {
    id: 'practice-reading-fluency',
    subject: 'phonics-reading',
    query: 'Practise reading fluency',
    answer: 'Fluency practice is most useful after decoding accuracy is secure; the goal is accurate, increasingly automatic and meaningful reading rather than speed alone.',
    canonicalPath: '/free-reading-fluency-game-for-kids',
    supportingPaths: ['/blog/how-to-improve-reading-fluency-in-children', '/resources/phonics'],
  },
  {
    id: 'practice-grammar',
    subject: 'grammar-writing',
    query: 'Practise grammar choices and correction',
    answer: 'Use short grammar practice after a concept is understood, then require the same skill in fresh sentences so practice transfers beyond recognition tasks.',
    canonicalPath: '/free-grammar-games-for-kids',
    supportingPaths: ['/resources/grammar', '/blog/child-knows-grammar-but-makes-mistakes'],
  },
  {
    id: 'practice-sentence-building',
    subject: 'grammar-writing',
    query: 'Practise sentence building and expansion',
    answer: 'Sentence practice should move from complete core meaning into useful detail and connection, not reward length for its own sake.',
    canonicalPath: '/free-sentence-building-games-for-kids',
    supportingPaths: ['/blog/how-to-improve-sentence-formation-in-kids', '/resources/grammar'],
  },
  {
    id: 'practice-grammar-focused',
    subject: 'grammar-writing',
    query: 'Use focused grammar repetition',
    answer: 'Use focused repetition when the child understands the rule but needs retrieval, correction and transfer practice rather than another long explanation.',
    canonicalPath: '/free-grammar-practice-game-for-kids',
    supportingPaths: ['/resources/grammar', '/blog/grammar-editing-camp'],
  },
  {
    id: 'practice-speaking',
    subject: 'speaking-communication',
    query: 'Practise fuller spoken responses',
    answer: 'Use speaking activities that require the child to retrieve words, build a meaningful response and add relevant detail with gradually less prompting.',
    canonicalPath: '/free-speaking-games-for-kids',
    supportingPaths: ['/blog/conversation-skills-for-kids', '/resources/speaking'],
  },
  {
    id: 'practice-speaking-focused',
    subject: 'speaking-communication',
    query: 'Use short repeatable speaking practice',
    answer: 'Use focused speaking practice for active expression and response-building, then vary the topic so the child must transfer the skill.',
    canonicalPath: '/free-speaking-practice-game-for-kids',
    supportingPaths: ['/resources/speaking', '/blog/child-gives-one-word-answers'],
  },
];

export const AI_ANSWER_LAYER_3_PRACTICE_ACTIONS = freezeList(
  PRACTICE_ACTIONS.map((practice) => item({
    ...practice,
    layer: 3,
    answerSource: 'practice-architecture-summary',
    ownershipState: 'existing-practice-owner',
    hubPath: subjectHub(practice.subject),
    practicePaths: [practice.canonicalPath],
  })),
);

export const AI_ANSWER_LAYERS = freeze({
  1: AI_ANSWER_LAYER_1_PARENT_PROBLEMS,
  2: AI_ANSWER_LAYER_2_LEARNING_CONCEPTS,
  3: AI_ANSWER_LAYER_3_PRACTICE_ACTIONS,
});

export const AI_ANSWER_LAYER_ALL_ITEMS = freezeList([
  ...AI_ANSWER_LAYER_1_PARENT_PROBLEMS,
  ...AI_ANSWER_LAYER_2_LEARNING_CONCEPTS,
  ...AI_ANSWER_LAYER_3_PRACTICE_ACTIONS,
]);

export function getAiAnswerLayerItems(layer) {
  return AI_ANSWER_LAYERS[Number(layer)] || freezeList([]);
}

export function getAiAnswerLayerItemsForSubject(subject) {
  return freezeList(AI_ANSWER_LAYER_ALL_ITEMS.filter((entry) => entry.subject === subject));
}

export function getAiAnswerLayerSubjectItems(layer, subject) {
  return freezeList(getAiAnswerLayerItems(layer).filter((entry) => entry.subject === subject));
}

const ids = AI_ANSWER_LAYER_ALL_ITEMS.map((entry) => entry.id);
if (new Set(ids).size !== ids.length) throw new Error('AI answer-layer registry contains duplicate IDs.');
if (AI_ANSWER_LAYER_1_PARENT_PROBLEMS.length !== 28) {
  throw new Error(`AI Layer 1 must reconcile the frozen 28 parent-problem routes; found ${AI_ANSWER_LAYER_1_PARENT_PROBLEMS.length}.`);
}
if (PHONICS_PUBLISHED_RESOURCE_PAGES.length !== 31) {
  throw new Error('AI Layer 2 must preserve the governed 31-page phonics publication set.');
}
for (const entry of AI_ANSWER_LAYER_ALL_ITEMS) {
  if (![1, 2, 3].includes(entry.layer)) throw new Error(`Unsupported AI answer layer: ${entry.id}`);
  if (!entry.canonicalPath?.startsWith('/')) throw new Error(`AI answer item is missing a canonical path: ${entry.id}`);
  if (!entry.query?.trim()) throw new Error(`AI answer item is missing a query: ${entry.id}`);
  if (!entry.hubPath?.startsWith('/resources/')) throw new Error(`AI answer item is missing a Resources subject hub: ${entry.id}`);
}
