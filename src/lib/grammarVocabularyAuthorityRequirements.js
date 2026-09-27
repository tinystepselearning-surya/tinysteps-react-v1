import { GRAMMAR_PROGRAMMATIC_PATHS } from './grammarProgrammaticRegistry.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);
const freezeObjectList = (values = []) => freezeList(values.map((value) => freeze({ ...value })));

export const GRAMMAR_VOCABULARY_AUTHORITY_REVISION = '2026-09-27-gv1';

export const GRAMMAR_VOCABULARY_SOURCE_BASIS = freeze({
  britishCouncilVocabularyA1A2: freeze({
    id: 'british-council-vocabulary-a1-a2',
    label: 'British Council LearnEnglish Vocabulary A1-A2',
    url: 'https://learnenglish.britishcouncil.org/free-resources/vocabulary/a1-a2',
    use: 'Benchmark everyday beginner vocabulary domains, context practice and learner-friendly lexical grouping.',
  }),
  britishCouncilVocabularyB1B2: freeze({
    id: 'british-council-vocabulary-b1-b2',
    label: 'British Council LearnEnglish Vocabulary B1-B2',
    url: 'https://learnenglish.britishcouncil.org/free-resources/vocabulary/b1-b2',
    use: 'Benchmark broader intermediate lexical domains and progression into more precise real-world vocabulary.',
  }),
  cambridgeGrammar: freeze({
    id: 'cambridge-grammar-reference',
    label: 'Cambridge Dictionary Grammar',
    url: 'https://dictionary.cambridge.org/grammar/british-grammar/',
    use: 'Benchmark reference-grammar breadth, usage distinctions, word classes, phrase structure, verb patterns and common usage problems.',
  }),
});

export const AUTHORITY_PAGE_REQUIRED_SECTIONS = freezeList([
  'direct-answer',
  'why-it-matters',
  'core-rules-or-meaning',
  'worked-examples',
  'common-mistakes-or-confusions',
  'tricky-cases-or-usage-notes',
  'guided-practice',
  'parent-teacher-note',
  'faqs',
  'references',
  'related-learning',
]);

export const AUTHORITY_PUBLICATION_GATES = freeze({
  minimumKnowledgeWords: 600,
  minimumAuthoritativeReferences: 2,
  minimumWorkedExamples: 3,
  minimumFaqs: 2,
  requireUniqueCanonicalPath: true,
  requireIndexableOnlyWhenComplete: true,
  requireAiCorpusInclusionOnlyWhenPublished: true,
  requireDescriptiveInternalAnchors: true,
  requirePracticeConnection: true,
  requireNoThinChildRoutes: true,
});

const grammarGap = (config) => freeze({
  layer: 'grammar-reference-extension',
  state: 'requirements-approved',
  publicationApproved: false,
  hubPath: '/resources/grammar',
  evidenceFamilyIds: freezeList(['cambridge-grammar-reference']),
  requiredSections: AUTHORITY_PAGE_REQUIRED_SECTIONS,
  ...config,
  relatedCoreIds: freezeList(config.relatedCoreIds || []),
  relatedReferenceIds: freezeList(config.relatedReferenceIds || []),
  childOutcomes: freezeList(config.childOutcomes || []),
  practiceTargets: freezeList(config.practiceTargets || []),
});

export const GRAMMAR_REFERENCE_EXTENSION_REQUIREMENTS = freezeList([
  grammarGap({
    order: 1,
    id: 'determiners',
    label: 'Determiners for Kids',
    proposedPath: '/resources/grammar/determiners-for-kids',
    rationale: 'The current 38-step sequence teaches articles and quantifiers but does not provide one authority resource explaining determiners as the wider noun-reference system.',
    relatedCoreIds: ['articles-a-an', 'article-the', 'quantifiers', 'pronouns'],
    childOutcomes: ['choose this/that/these/those accurately', 'use possessive determiners', 'connect articles and quantifiers to noun reference'],
    practiceTargets: ['determiner choice in context', 'specific versus general reference', 'noun phrase editing'],
  }),
  grammarGap({
    order: 2,
    id: 'countable-uncountable-nouns',
    label: 'Countable & Uncountable Nouns',
    proposedPath: '/resources/grammar/countable-uncountable-nouns-for-kids',
    rationale: 'Countability currently appears inside quantifier teaching but lacks a dedicated owner for noun-number and quantity choices.',
    relatedCoreIds: ['nouns', 'singular-plural', 'quantifiers', 'articles-a-an'],
    childOutcomes: ['distinguish count and uncount meanings', 'choose much/many and a/an appropriately', 'avoid forced plural forms'],
    practiceTargets: ['noun sorting', 'quantifier choice', 'sentence correction'],
  }),
  grammarGap({
    order: 3,
    id: 'noun-phrases',
    label: 'Noun Phrases for Kids',
    proposedPath: '/resources/grammar/noun-phrases-for-kids',
    rationale: 'Tiny Steps teaches nouns, adjectives and determiners separately; a noun-phrase owner is needed to show how those elements combine around a head noun.',
    relatedCoreIds: ['nouns', 'adjectives', 'pronouns', 'quantifiers'],
    childOutcomes: ['identify the head noun', 'expand noun phrases without padding', 'connect determiners and adjectives to one noun'],
    practiceTargets: ['phrase building', 'head-noun identification', 'precise expansion'],
  }),
  grammarGap({
    order: 4,
    id: 'prepositional-phrases',
    label: 'Prepositional Phrases',
    proposedPath: '/resources/grammar/prepositional-phrases-for-kids',
    rationale: 'Prepositions are covered, but phrase-level structure and how prepositional phrases modify nouns or clauses need a dedicated reference owner.',
    relatedCoreIds: ['prepositions', 'adjectives', 'adverbs', 'clauses'],
    childOutcomes: ['identify preposition plus complement', 'use place/time phrases', 'attach phrases clearly'],
    practiceTargets: ['phrase spotting', 'sentence expansion', 'misattachment correction'],
  }),
  grammarGap({
    order: 5,
    id: 'phrasal-verbs-particles',
    label: 'Phrasal Verbs & Particles',
    proposedPath: '/resources/grammar/phrasal-verbs-for-kids',
    rationale: 'The current verb architecture does not own multi-word verb meaning or particle behaviour, a visible reference-grammar gap.',
    relatedCoreIds: ['verbs', 'prepositions', 'adverbs'],
    childOutcomes: ['recognise common phrasal verbs', 'separate literal prepositions from particles', 'use common multi-word verbs in context'],
    practiceTargets: ['meaning matching', 'particle choice', 'sentence use'],
  }),
  grammarGap({
    order: 6,
    id: 'verb-forms-irregular-verbs',
    label: 'Verb Forms & Irregular Verbs',
    proposedPath: '/resources/grammar/verb-forms-irregular-verbs-for-kids',
    rationale: 'Tense pages use irregular forms but there is no consolidated reference for base, past, participle and -ing forms or high-frequency irregular verbs.',
    relatedCoreIds: ['verbs', 'simple-past', 'present-perfect-vs-past', 'past-perfect'],
    childOutcomes: ['recognise core verb forms', 'learn high-frequency irregular patterns', 'choose participles accurately'],
    practiceTargets: ['form tables', 'irregular retrieval', 'tense repair'],
  }),
  grammarGap({
    order: 7,
    id: 'gerunds-infinitives-verb-patterns',
    label: 'Gerunds, Infinitives & Verb Patterns',
    proposedPath: '/resources/grammar/gerunds-infinitives-verb-patterns-for-kids',
    rationale: 'Verb-pattern choice is not currently represented as a public knowledge owner despite its importance in natural sentence formation.',
    relatedCoreIds: ['verbs', 'clauses', 'modal-verbs'],
    childOutcomes: ['recognise -ing and to-infinitive patterns', 'avoid form substitution errors', 'notice verb-dependent complements'],
    practiceTargets: ['pattern sorting', 'completion choices', 'sentence transformation'],
  }),
  grammarGap({
    order: 8,
    id: 'word-order-focus',
    label: 'Word Order in English',
    proposedPath: '/resources/grammar/word-order-for-kids',
    rationale: 'Sentence formation is an existing owner, but a reference extension is needed for adverb placement, question order, focus and common word-order errors.',
    relatedCoreIds: ['questions', 'adverbs', 'negatives-short-answers', 'clauses'],
    childOutcomes: ['maintain standard clause order', 'place frequency/time adverbs naturally', 'distinguish statement and question order'],
    practiceTargets: ['sentence reordering', 'error correction', 'focus comparison'],
  }),
  grammarGap({
    order: 9,
    id: 'word-formation',
    label: 'Word Formation: Prefixes, Suffixes & Word Families',
    proposedPath: '/resources/grammar/word-formation-prefixes-suffixes-for-kids',
    rationale: 'Word formation sits between grammar and vocabulary and is currently scattered across spelling, vocabulary and writing rather than owned as a connected language resource.',
    relatedCoreIds: ['nouns', 'verbs', 'adjectives', 'adverbs'],
    childOutcomes: ['build related words', 'recognise common prefixes and suffixes', 'notice word-class changes'],
    practiceTargets: ['word-family building', 'affix meaning', 'word-class transformation'],
  }),
  grammarGap({
    order: 10,
    id: 'grammar-collocations',
    label: 'Collocations for Kids',
    proposedPath: '/resources/grammar/collocations-for-kids',
    rationale: 'Tiny Steps has collocation practice, but no authority resource explaining why some word combinations are natural and others are merely grammatically possible.',
    relatedCoreIds: ['verbs', 'adjectives', 'adverbs'],
    childOutcomes: ['notice natural word partnerships', 'improve word choice', 'transfer collocations into speaking and writing'],
    practiceTargets: ['matching', 'natural-versus-unnatural choice', 'sentence production'],
  }),
  grammarGap({
    order: 11,
    id: 'easily-confused-words',
    label: 'Easily Confused English Words',
    proposedPath: '/resources/grammar/easily-confused-words-for-kids',
    rationale: 'Tiny Steps does not currently have a public authority cluster for high-frequency meaning and form confusions such as advice/advise, affect/effect or then/than.',
    relatedCoreIds: ['adverbs', 'prepositions'],
    relatedReferenceIds: ['word-formation'],
    childOutcomes: ['distinguish commonly confused forms', 'use sentence context to choose accurately', 'edit meaning-changing word errors'],
    practiceTargets: ['contrast pairs', 'context selection', 'error correction'],
  }),
  grammarGap({
    order: 12,
    id: 'common-grammar-mistakes',
    label: 'Common Grammar Mistakes for Kids',
    proposedPath: '/resources/grammar/common-grammar-mistakes-for-kids',
    rationale: 'Each authority page has local mistakes, but the library lacks a diagnostic hub that groups recurring errors by grammar system and routes children to the correct owner.',
    relatedCoreIds: ['subject-verb-agreement', 'articles-a-an', 'article-the', 'questions', 'fragments-runons'],
    childOutcomes: ['diagnose the type of error', 'understand why a form is incorrect', 'follow the correct learning path'],
    practiceTargets: ['diagnostic sorting', 'before-and-after editing', 'owner routing'],
  }),
]);

const vocabularyStage = (config) => freeze({
  ...config,
  topicIds: freezeList(config.topicIds),
});

export const VOCABULARY_KNOWLEDGE_STAGES = freezeList([
  vocabularyStage({
    id: 'everyday-foundations',
    order: 1,
    label: 'Everyday Foundations',
    purpose: 'Build high-frequency child-relevant vocabulary for everyday comprehension and communication before asking children to manipulate lexical relationships.',
    topicIds: ['everyday-vocabulary', 'action-words', 'feelings-emotions', 'describing-words', 'school-vocabulary', 'home-family-routines', 'food-clothes-body', 'nature-weather-places-transport'],
  }),
  vocabularyStage({
    id: 'word-relationships',
    order: 2,
    label: 'Word Relationships',
    purpose: 'Build semantic flexibility by comparing meanings, opposites, multiple meanings and commonly confused words.',
    topicIds: ['synonyms-antonyms', 'multiple-meaning-confused-words'],
  }),
  vocabularyStage({
    id: 'word-building',
    order: 3,
    label: 'Building New Words',
    purpose: 'Connect vocabulary growth to morphology so children can infer and generate related words through roots, prefixes and suffixes.',
    topicIds: ['word-families-prefixes-suffixes'],
  }),
  vocabularyStage({
    id: 'vocabulary-in-context',
    order: 4,
    label: 'Vocabulary in Context',
    purpose: 'Move from knowing isolated meanings to inferring, selecting and using words inside sentences, stories and explanations.',
    topicIds: ['context-clues'],
  }),
  vocabularyStage({
    id: 'natural-english',
    order: 5,
    label: 'Natural English',
    purpose: 'Teach common word partnerships and multi-word expressions so children produce language that is natural as well as grammatically possible.',
    topicIds: ['vocabulary-collocations', 'phrasal-verbs-expressions'],
  }),
  vocabularyStage({
    id: 'transfer-speaking-writing',
    order: 6,
    label: 'Vocabulary for Speaking & Writing',
    purpose: 'Transfer vocabulary into richer spoken answers and more precise written expression, including school and academic language.',
    topicIds: ['vocabulary-for-writing', 'vocabulary-for-speaking'],
  }),
]);

const vocabularyTopic = (config) => freeze({
  layer: 'vocabulary-authority',
  state: 'requirements-approved',
  publicationApproved: false,
  hubPath: '/resources/vocabulary',
  evidenceFamilyIds: freezeList([
    'british-council-vocabulary-a1-a2',
    'british-council-vocabulary-b1-b2',
  ]),
  requiredSections: AUTHORITY_PAGE_REQUIRED_SECTIONS,
  ...config,
  semanticDomains: freezeList(config.semanticDomains || []),
  childOutcomes: freezeList(config.childOutcomes || []),
  practiceModes: freezeList(config.practiceModes || []),
  crossLinks: freezeList(config.crossLinks || []),
});

export const VOCABULARY_AUTHORITY_REQUIREMENTS = freezeList([
  vocabularyTopic({
    order: 1,
    id: 'everyday-vocabulary',
    stageId: 'everyday-foundations',
    label: 'Everyday Vocabulary for Kids',
    proposedPath: '/resources/vocabulary/everyday-vocabulary-for-kids',
    semanticDomains: ['people', 'places', 'objects', 'daily life'],
    childOutcomes: ['understand high-frequency everyday words', 'use words in short meaningful sentences'],
    practiceModes: ['meaning match', 'picture/context choice', 'sentence completion'],
    crossLinks: ['/free-games/word-meaning-flashcards', '/reading-classes-for-kids'],
  }),
  vocabularyTopic({
    order: 2,
    id: 'action-words',
    stageId: 'everyday-foundations',
    label: 'Action Words for Kids',
    proposedPath: '/resources/vocabulary/action-words-for-kids',
    semanticDomains: ['movement', 'school actions', 'home actions', 'communication actions'],
    childOutcomes: ['choose more precise action words', 'connect vocabulary to verbs without turning the page into a grammar duplicate'],
    practiceModes: ['action matching', 'stronger-word choice', 'sentence use'],
    crossLinks: ['/resources/grammar/verbs-for-kids', '/free-games/word-meaning-flashcards'],
  }),
  vocabularyTopic({
    order: 3,
    id: 'feelings-emotions',
    stageId: 'everyday-foundations',
    label: 'Feelings & Emotions Vocabulary',
    proposedPath: '/resources/vocabulary/feelings-emotions-for-kids',
    semanticDomains: ['basic emotions', 'intensity', 'social feelings'],
    childOutcomes: ['name feelings precisely', 'distinguish nearby emotion words', 'use emotion vocabulary in speaking and stories'],
    practiceModes: ['scenario matching', 'intensity scales', 'speaking prompts'],
    crossLinks: ['/spoken-english-classes-for-kids-online', '/writing-classes-for-kids'],
  }),
  vocabularyTopic({
    order: 4,
    id: 'describing-words',
    stageId: 'everyday-foundations',
    label: 'Describing Words for Kids',
    proposedPath: '/resources/vocabulary/describing-words-for-kids',
    semanticDomains: ['size', 'shape', 'colour', 'quality', 'texture', 'personality'],
    childOutcomes: ['replace vague words', 'choose description for purpose', 'build precise noun descriptions'],
    practiceModes: ['best-word choice', 'description matching', 'sentence expansion'],
    crossLinks: ['/resources/grammar/adjectives-for-kids', '/writing-classes-for-kids'],
  }),
  vocabularyTopic({
    order: 5,
    id: 'school-vocabulary',
    stageId: 'everyday-foundations',
    label: 'School Vocabulary for Kids',
    proposedPath: '/resources/vocabulary/school-vocabulary-for-kids',
    semanticDomains: ['classroom objects', 'instructions', 'school people', 'learning actions'],
    childOutcomes: ['understand classroom language', 'respond to common instructions', 'talk about school tasks'],
    practiceModes: ['label and use', 'instruction matching', 'school-situation dialogue'],
    crossLinks: ['/spoken-english-classes-for-kids-online', '/free-games/word-meaning-flashcards'],
  }),
  vocabularyTopic({
    order: 6,
    id: 'home-family-routines',
    stageId: 'everyday-foundations',
    label: 'Home, Family & Daily Routine Vocabulary',
    proposedPath: '/resources/vocabulary/home-family-daily-routine-vocabulary',
    semanticDomains: ['family', 'rooms', 'household actions', 'daily routines', 'time-of-day'],
    childOutcomes: ['describe home life', 'sequence routines', 'use family and household words naturally'],
    practiceModes: ['routine sequencing', 'room/object match', 'speaking prompts'],
    crossLinks: ['/spoken-english-classes-for-kids-online'],
  }),
  vocabularyTopic({
    order: 7,
    id: 'food-clothes-body',
    stageId: 'everyday-foundations',
    label: 'Food, Clothes & Body Vocabulary',
    proposedPath: '/resources/vocabulary/food-clothes-body-vocabulary-for-kids',
    semanticDomains: ['food and drink', 'clothes', 'body parts', 'basic health'],
    childOutcomes: ['name common items', 'describe needs and preferences', 'understand everyday instructions'],
    practiceModes: ['category sort', 'description match', 'conversation choice'],
    crossLinks: ['/spoken-english-classes-for-kids-online'],
  }),
  vocabularyTopic({
    order: 8,
    id: 'nature-weather-places-transport',
    stageId: 'everyday-foundations',
    label: 'Nature, Weather, Places & Transport Vocabulary',
    proposedPath: '/resources/vocabulary/nature-weather-places-transport-for-kids',
    semanticDomains: ['weather', 'nature', 'town and places', 'transport', 'travel'],
    childOutcomes: ['describe surroundings', 'talk about travel and weather', 'understand common place/transport vocabulary'],
    practiceModes: ['semantic sorting', 'scene description', 'route/travel prompts'],
    crossLinks: ['/reading-classes-for-kids', '/spoken-english-classes-for-kids-online'],
  }),
  vocabularyTopic({
    order: 9,
    id: 'synonyms-antonyms',
    stageId: 'word-relationships',
    label: 'Synonyms & Antonyms for Kids',
    proposedPath: '/resources/vocabulary/synonyms-antonyms-for-kids',
    semanticDomains: ['similar meaning', 'opposites', 'shades of meaning'],
    childOutcomes: ['compare word meanings', 'avoid false synonyms', 'choose more precise alternatives'],
    practiceModes: ['synonym match', 'antonym match', 'best-fit context'],
    crossLinks: ['/free-games/word-meaning-flashcards', '/writing-classes-for-kids'],
  }),
  vocabularyTopic({
    order: 10,
    id: 'multiple-meaning-confused-words',
    stageId: 'word-relationships',
    label: 'Multiple-Meaning & Easily Confused Words',
    proposedPath: '/resources/vocabulary/multiple-meaning-confused-words-for-kids',
    semanticDomains: ['polysemy', 'homophones', 'near-confusions', 'context meaning'],
    childOutcomes: ['select meaning from context', 'distinguish similar forms', 'notice meaning-changing word errors'],
    practiceModes: ['context clues', 'contrast pairs', 'sentence correction'],
    crossLinks: ['/resources/grammar/easily-confused-words-for-kids', '/free-games/word-meaning-flashcards'],
  }),
  vocabularyTopic({
    order: 11,
    id: 'word-families-prefixes-suffixes',
    stageId: 'word-building',
    label: 'Word Families, Prefixes & Suffixes',
    proposedPath: '/resources/vocabulary/word-families-prefixes-suffixes-for-kids',
    semanticDomains: ['base words', 'prefix meaning', 'suffix meaning', 'word-class families'],
    childOutcomes: ['infer unfamiliar words', 'build related words', 'connect morphology to meaning and spelling'],
    practiceModes: ['word-family trees', 'affix matching', 'word creation'],
    crossLinks: ['/resources/grammar/word-formation-prefixes-suffixes-for-kids', '/free-spelling-game-for-kids'],
  }),
  vocabularyTopic({
    order: 12,
    id: 'context-clues',
    stageId: 'vocabulary-in-context',
    label: 'Context Clues for Kids',
    proposedPath: '/resources/vocabulary/context-clues-for-kids',
    semanticDomains: ['definition clues', 'example clues', 'contrast clues', 'inference'],
    childOutcomes: ['infer likely meaning', 'verify meaning against sentence context', 'avoid guessing from one word alone'],
    practiceModes: ['sentence inference', 'short-passage inference', 'evidence explanation'],
    crossLinks: ['/reading-classes-for-kids', '/free-games/word-meaning-flashcards'],
  }),
  vocabularyTopic({
    order: 13,
    id: 'vocabulary-collocations',
    stageId: 'natural-english',
    label: 'Collocations for Kids',
    proposedPath: '/resources/vocabulary/collocations-for-kids',
    semanticDomains: ['verb+noun', 'adjective+noun', 'adverb+adjective', 'common school/everyday combinations'],
    childOutcomes: ['notice natural combinations', 'replace unnatural combinations', 'use collocations in speech and writing'],
    practiceModes: ['pair matching', 'naturalness choice', 'production prompts'],
    crossLinks: ['/resources/grammar/collocations-for-kids', '/spoken-english-classes-for-kids-online'],
  }),
  vocabularyTopic({
    order: 14,
    id: 'phrasal-verbs-expressions',
    stageId: 'natural-english',
    label: 'Phrasal Verbs & Common Expressions',
    proposedPath: '/resources/vocabulary/phrasal-verbs-common-expressions-for-kids',
    semanticDomains: ['high-frequency phrasal verbs', 'common expressions', 'meaning in context'],
    childOutcomes: ['understand frequent multi-word expressions', 'avoid literal-only interpretation', 'use selected expressions naturally'],
    practiceModes: ['meaning match', 'dialogue choice', 'context production'],
    crossLinks: ['/resources/grammar/phrasal-verbs-for-kids', '/spoken-english-classes-for-kids-online'],
  }),
  vocabularyTopic({
    order: 15,
    id: 'vocabulary-for-writing',
    stageId: 'transfer-speaking-writing',
    label: 'Vocabulary for Better Writing',
    proposedPath: '/resources/vocabulary/vocabulary-for-writing-kids',
    semanticDomains: ['precise verbs', 'descriptive vocabulary', 'sequence', 'cause/effect', 'opinion and evidence'],
    childOutcomes: ['replace vague words', 'choose vocabulary for text purpose', 'revise repetition and weak word choice'],
    practiceModes: ['sentence revision', 'paragraph upgrade', 'word-choice explanation'],
    crossLinks: ['/writing-classes-for-kids', '/resources/grammar/word-order-for-kids'],
  }),
  vocabularyTopic({
    order: 16,
    id: 'vocabulary-for-speaking',
    stageId: 'transfer-speaking-writing',
    label: 'Vocabulary for Speaking & Conversation',
    proposedPath: '/resources/vocabulary/vocabulary-for-speaking-kids',
    semanticDomains: ['conversation', 'opinions', 'storytelling', 'school discussion', 'presentation language'],
    childOutcomes: ['give fuller spoken answers', 'choose topic-appropriate vocabulary', 'use new words spontaneously'],
    practiceModes: ['guided response', 'story retell', 'conversation prompt', 'presentation prompt'],
    crossLinks: ['/spoken-english-classes-for-kids-online', '/speaking'],
  }),
]);

export const VOCABULARY_HUB_REQUIREMENT = freeze({
  state: 'requirements-approved',
  publicationApproved: false,
  proposedPath: '/resources/vocabulary',
  label: 'Vocabulary Resources',
  role: 'canonical-vocabulary-learning-hub',
  requiredStageIds: freezeList(VOCABULARY_KNOWLEDGE_STAGES.map((stage) => stage.id)),
  practicePath: '/free-games/word-meaning-flashcards',
  programmeConnections: freezeList(['/reading-classes-for-kids', '/spoken-english-classes-for-kids-online', '/writing-classes-for-kids']),
});

export const GRAMMAR_VOCABULARY_CROSS_DOMAIN_REQUIREMENTS = freeze({
  grammarCoreBoundary: 'The existing 38-step Grammar sequence remains the learning progression owner. Reference-extension pages may deepen concepts but must not silently renumber or replace that sequence.',
  vocabularyBoundary: 'Vocabulary becomes its own canonical knowledge hub. Existing Vocabulary Adventure remains a practice surface rather than the canonical knowledge owner.',
  wordFormationBoundary: 'Word formation is intentionally cross-domain: Grammar owns structural word-class/morphology explanation; Vocabulary owns meaning growth and usable word families.',
  collocationBoundary: 'Grammar may explain collocation as a language-pattern concept; Vocabulary owns lexical acquisition and applied word partnerships.',
  phrasalVerbBoundary: 'Grammar owns particle and multi-word-verb structure; Vocabulary owns high-frequency meaning, recall and contextual use.',
  readingBoundary: 'Vocabulary resources may support comprehension but must not claim phonics decoding or Reading programme ownership.',
  speakingWritingBoundary: 'Vocabulary transfer pages support Speaking and Writing without becoming commercial programme owners.',
});

const grammarPaths = new Set(GRAMMAR_PROGRAMMATIC_PATHS);
const requirementPaths = new Set();
const requirementIds = new Set();

for (const item of [...GRAMMAR_REFERENCE_EXTENSION_REQUIREMENTS, ...VOCABULARY_AUTHORITY_REQUIREMENTS]) {
  if (requirementIds.has(item.id)) throw new Error(`GV1 duplicate authority requirement id: ${item.id}`);
  requirementIds.add(item.id);
  if (!item.proposedPath.startsWith('/resources/')) throw new Error(`GV1 authority path must live under /resources: ${item.id}`);
  if (requirementPaths.has(item.proposedPath)) throw new Error(`GV1 duplicate proposed authority path: ${item.proposedPath}`);
  requirementPaths.add(item.proposedPath);
  if (item.publicationApproved) throw new Error(`GV1 is requirements-only and cannot pre-approve publication: ${item.id}`);
}
for (const item of GRAMMAR_REFERENCE_EXTENSION_REQUIREMENTS) {
  if (grammarPaths.has(item.proposedPath)) throw new Error(`GV1 grammar reference path collides with the existing 38-step publication: ${item.proposedPath}`);
}
for (const stage of VOCABULARY_KNOWLEDGE_STAGES) {
  for (const topicId of stage.topicIds) {
    const topic = VOCABULARY_AUTHORITY_REQUIREMENTS.find((item) => item.id === topicId);
    if (!topic) throw new Error(`GV1 vocabulary stage references unknown topic: ${stage.id} -> ${topicId}`);
    if (topic.stageId !== stage.id) throw new Error(`GV1 vocabulary topic stage mismatch: ${topic.id}`);
  }
}
if (new Set(VOCABULARY_KNOWLEDGE_STAGES.flatMap((stage) => stage.topicIds)).size !== VOCABULARY_AUTHORITY_REQUIREMENTS.length) {
  throw new Error('GV1 every vocabulary authority topic must belong to exactly one stage.');
}
