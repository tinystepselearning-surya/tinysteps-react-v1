const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);

export const VOCABULARY_AUTHORITY_REVISION = '2026-09-27-gv4';

export const VOCABULARY_HUB_SEO = freeze({
  title: 'Vocabulary Resources for Kids | Tiny Steps Learning',
  description: 'Build vocabulary through meaning, context, word relationships, word families and real use in reading, speaking and writing. Includes free practice links.',
  canonicalPath: '/resources/vocabulary',
  ogType: 'website',
});

export const VOCABULARY_AUTHORITY_ROUTE_MANIFEST = freezeList([
  freeze({
    order: 1,
    id: 'everyday-vocabulary',
    stageId: 'everyday-foundations',
    path: '/resources/vocabulary/everyday-vocabulary-for-kids',
    slug: 'everyday-vocabulary-for-kids',
    cardTitle: 'Everyday Vocabulary for Kids',
    title: 'Everyday Vocabulary for Kids: Meaning, Context & Use | Tiny Steps',
    description: 'Build useful everyday vocabulary for children through clear meanings, real-life contexts, example sentences and active practice.',
    relatedPaths: freezeList(['/free-games/word-meaning-flashcards', '/reading-classes-for-kids', '/resources/vocabulary/school-vocabulary-for-kids']),
  }),
  freeze({
    order: 2,
    id: 'feelings-emotions',
    stageId: 'everyday-foundations',
    path: '/resources/vocabulary/feelings-emotions-for-kids',
    slug: 'feelings-emotions-for-kids',
    cardTitle: 'Feelings & Emotions Vocabulary',
    title: 'Feelings and Emotions Vocabulary for Kids | Tiny Steps',
    description: 'Teach children precise emotion words, shades of meaning and useful sentence patterns for talking and writing about feelings.',
    relatedPaths: freezeList(['/spoken-english-classes-for-kids-online', '/writing-classes-for-kids', '/free-games/word-meaning-flashcards']),
  }),
  freeze({
    order: 3,
    id: 'school-vocabulary',
    stageId: 'everyday-foundations',
    path: '/resources/vocabulary/school-vocabulary-for-kids',
    slug: 'school-vocabulary-for-kids',
    cardTitle: 'School Vocabulary for Kids',
    title: 'School Vocabulary for Kids: Classroom Words & Instructions | Tiny Steps',
    description: 'Learn classroom objects, people, instructions and learning-action vocabulary children need to understand and talk about school.',
    relatedPaths: freezeList(['/free-games/word-meaning-flashcards', '/spoken-english-classes-for-kids-online', '/resources/vocabulary/everyday-vocabulary-for-kids']),
  }),
  freeze({
    order: 4,
    id: 'synonyms-antonyms',
    stageId: 'word-relationships',
    path: '/resources/vocabulary/synonyms-antonyms-for-kids',
    slug: 'synonyms-antonyms-for-kids',
    cardTitle: 'Synonyms & Antonyms for Kids',
    title: 'Synonyms and Antonyms for Kids: Meaning & Word Choice | Tiny Steps',
    description: 'Help children compare similar and opposite meanings, notice shades of meaning and choose the best word for a sentence.',
    relatedPaths: freezeList(['/free-games/word-meaning-flashcards', '/writing-classes-for-kids', '/resources/vocabulary/feelings-emotions-for-kids']),
  }),
  freeze({
    order: 5,
    id: 'context-clues',
    stageId: 'vocabulary-in-context',
    path: '/resources/vocabulary/context-clues-for-kids',
    slug: 'context-clues-for-kids',
    cardTitle: 'Context Clues for Kids',
    title: 'Context Clues for Kids: Work Out Word Meaning | Tiny Steps',
    description: 'Teach children to infer unfamiliar word meanings from definitions, examples, contrast and surrounding sentence evidence.',
    relatedPaths: freezeList(['/reading-classes-for-kids', '/free-games/word-meaning-flashcards', '/blog/how-vocabulary-supports-reading-comprehension']),
  }),
  freeze({
    order: 6,
    id: 'word-families-prefixes-suffixes',
    stageId: 'word-building',
    path: '/resources/vocabulary/word-families-prefixes-suffixes-for-kids',
    slug: 'word-families-prefixes-suffixes-for-kids',
    cardTitle: 'Word Families, Prefixes & Suffixes',
    title: 'Word Families, Prefixes and Suffixes for Kids | Tiny Steps',
    description: 'Build vocabulary by connecting base words, prefixes, suffixes and related word forms while protecting meaning and word class.',
    relatedPaths: freezeList(['/resources/grammar/nouns-for-kids', '/resources/grammar/verbs-for-kids', '/resources/grammar/adjectives-for-kids', '/free-spelling-game-for-kids']),
  }),
]);

export const VOCABULARY_AUTHORITY_PATHS = freezeList(
  VOCABULARY_AUTHORITY_ROUTE_MANIFEST.map((entry) => entry.path),
);

export const VOCABULARY_AUTHORITY_RESOURCE_SEO = freeze({
  '/resources/vocabulary': VOCABULARY_HUB_SEO,
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
  throw new Error('GV4 must publish exactly six first-batch Vocabulary authority pages.');
}
if (new Set(VOCABULARY_AUTHORITY_PATHS).size !== VOCABULARY_AUTHORITY_PATHS.length) {
  throw new Error('GV4 Vocabulary authority paths must be unique.');
}
