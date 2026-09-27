const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);

export const VOCABULARY_HUB_PATH = '/resources/vocabulary';

export const VOCABULARY_AUTHORITY_ROUTE_MANIFEST = freezeList([
  freeze({
    id: 'everyday-vocabulary',
    cardTitle: 'Everyday Vocabulary for Kids',
    path: '/resources/vocabulary/everyday-vocabulary-for-kids',
    title: 'Everyday Vocabulary for Kids: Useful Words for Daily Life | Tiny Steps',
    description: 'Build useful everyday vocabulary through familiar objects, routines, people and places, then practise meaning, context and independent use.',
  }),
  freeze({
    id: 'feelings-emotions',
    cardTitle: 'Feelings & Emotions Vocabulary',
    path: '/resources/vocabulary/feelings-emotions-for-kids',
    title: 'Feelings and Emotions Vocabulary for Kids | Tiny Steps',
    description: 'Help children move beyond happy, sad and angry by learning precise emotion words, intensity, context and natural sentence use.',
  }),
  freeze({
    id: 'school-vocabulary',
    cardTitle: 'School Vocabulary for Kids',
    path: '/resources/vocabulary/school-vocabulary-for-kids',
    title: 'School Vocabulary for Kids: Classroom Words & Learning Language | Tiny Steps',
    description: 'Teach useful school vocabulary for classroom objects, instructions, learning actions, subjects and everyday school communication.',
  }),
  freeze({
    id: 'synonyms-antonyms',
    cardTitle: 'Synonyms & Antonyms for Kids',
    path: '/resources/vocabulary/synonyms-antonyms-for-kids',
    title: 'Synonyms and Antonyms for Kids: Meaning, Contrast & Word Choice | Tiny Steps',
    description: 'Teach similar and opposite meanings without treating every synonym as interchangeable, using context and shades of meaning.',
  }),
  freeze({
    id: 'context-clues',
    cardTitle: 'Context Clues for Kids',
    path: '/resources/vocabulary/context-clues-for-kids',
    title: 'Context Clues for Kids: Work Out Unknown Word Meanings | Tiny Steps',
    description: 'Teach children how to reread, notice clues, infer a possible meaning and check whether it makes sense in the sentence or passage.',
  }),
  freeze({
    id: 'word-families-prefixes-suffixes',
    cardTitle: 'Word Families, Prefixes & Suffixes',
    path: '/resources/vocabulary/word-families-prefixes-suffixes-for-kids',
    title: 'Word Families, Prefixes and Suffixes for Kids | Tiny Steps',
    description: 'Build vocabulary through base words, prefixes, suffixes and related word families while connecting changes in form to changes in meaning.',
  }),
  freeze({
    id: 'vocabulary-collocations',
    cardTitle: 'Collocations for Kids',
    path: '/resources/vocabulary/collocations-for-kids',
    title: 'Collocations for Kids: Natural Word Partnerships | Tiny Steps',
    description: 'Help children notice and use natural English word partnerships such as make a mistake, heavy rain and deeply interested through meaning, context and repeated use.',
  }),
  freeze({
    id: 'phrasal-verbs-expressions',
    cardTitle: 'Phrasal Verbs & Common Expressions',
    path: '/resources/vocabulary/phrasal-verbs-common-expressions-for-kids',
    title: 'Phrasal Verbs and Common Expressions for Kids | Tiny Steps',
    description: 'Teach useful phrasal verbs and everyday expressions through context, meaning, word order and child-relevant speaking situations.',
  }),
  freeze({
    id: 'vocabulary-for-writing',
    cardTitle: 'Vocabulary for Better Writing',
    path: '/resources/vocabulary/vocabulary-for-better-writing',
    title: 'Vocabulary for Better Writing: Precise Word Choice for Kids | Tiny Steps',
    description: 'Help children replace vague or repeated wording with precise, natural vocabulary that improves descriptions, explanations, stories and school answers.',
  }),
  freeze({
    id: 'vocabulary-for-speaking',
    cardTitle: 'Vocabulary for Speaking & Conversation',
    path: '/resources/vocabulary/vocabulary-for-speaking-conversation',
    title: 'Vocabulary for Speaking and Conversation for Kids | Tiny Steps',
    description: 'Build retrievable vocabulary for fuller answers, conversation, explanation, storytelling and confident everyday speaking without memorised scripts.',
  }),
]);

export const VOCABULARY_AUTHORITY_PATHS = freezeList(
  VOCABULARY_AUTHORITY_ROUTE_MANIFEST.map((entry) => entry.path),
);

export const VOCABULARY_RESOURCE_SEO = freeze({
  [VOCABULARY_HUB_PATH]: freeze({
    title: 'Vocabulary Resources for Kids: Meaning, Context & Word Building | Tiny Steps',
    description: 'Explore child-friendly vocabulary resources for everyday words, emotions, school language, synonyms, antonyms, context clues, prefixes, suffixes and word families.',
    canonicalPath: VOCABULARY_HUB_PATH,
    ogType: 'website',
  }),
  ...Object.fromEntries(VOCABULARY_AUTHORITY_ROUTE_MANIFEST.map((entry) => [
    entry.path,
    freeze({
      title: entry.title,
      description: entry.description,
      canonicalPath: entry.path,
      ogType: 'article',
    }),
  ])),
});

if (VOCABULARY_AUTHORITY_ROUTE_MANIFEST.length !== 10) {
  throw new Error('GV5 must expose exactly ten published Vocabulary authority guides: six GV4 guides plus four natural-English/transfer guides.');
}
if (new Set(VOCABULARY_AUTHORITY_PATHS).size !== VOCABULARY_AUTHORITY_PATHS.length) {
  throw new Error('Published Vocabulary authority paths must be unique.');
}
