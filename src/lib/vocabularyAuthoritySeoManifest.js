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

if (VOCABULARY_AUTHORITY_ROUTE_MANIFEST.length !== 6) {
  throw new Error('GV4 must publish exactly six first-batch Vocabulary authority guides.');
}
if (new Set(VOCABULARY_AUTHORITY_PATHS).size !== VOCABULARY_AUTHORITY_PATHS.length) {
  throw new Error('GV4 Vocabulary authority paths must be unique.');
}
