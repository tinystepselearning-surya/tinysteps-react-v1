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
    id: 'action-words',
    cardTitle: 'Action Words for Kids',
    path: '/resources/vocabulary/action-words-for-kids',
    title: 'Action Words for Kids: Stronger Verbs for Speaking & Writing | Tiny Steps',
    description: 'Build a richer bank of action words for movement, school, home and communication, then choose precise verbs that fit meaning and context.',
  }),
  freeze({
    id: 'feelings-emotions',
    cardTitle: 'Feelings & Emotions Vocabulary',
    path: '/resources/vocabulary/feelings-emotions-for-kids',
    title: 'Feelings and Emotions Vocabulary for Kids | Tiny Steps',
    description: 'Help children move beyond happy, sad and angry by learning precise emotion words, intensity, context and natural sentence use.',
  }),
  freeze({
    id: 'describing-words',
    cardTitle: 'Describing Words for Kids',
    path: '/resources/vocabulary/describing-words-for-kids',
    title: 'Describing Words for Kids: Precise Adjectives & Details | Tiny Steps',
    description: 'Help children choose useful describing words for size, shape, colour, texture, quality and personality without overloading sentences.',
  }),
  freeze({
    id: 'school-vocabulary',
    cardTitle: 'School Vocabulary for Kids',
    path: '/resources/vocabulary/school-vocabulary-for-kids',
    title: 'School Vocabulary for Kids: Classroom Words & Learning Language | Tiny Steps',
    description: 'Teach useful school vocabulary for classroom objects, instructions, learning actions, subjects and everyday school communication.',
  }),
  freeze({
    id: 'home-family-routines',
    cardTitle: 'Home, Family & Daily Routine Vocabulary',
    path: '/resources/vocabulary/home-family-daily-routine-vocabulary',
    title: 'Home, Family and Daily Routine Vocabulary for Kids | Tiny Steps',
    description: 'Build useful vocabulary for family, rooms, household actions, daily routines and time-of-day so children can describe everyday home life clearly.',
  }),
  freeze({
    id: 'food-clothes-body',
    cardTitle: 'Food, Clothes & Body Vocabulary',
    path: '/resources/vocabulary/food-clothes-body-vocabulary-for-kids',
    title: 'Food, Clothes and Body Vocabulary for Kids | Tiny Steps',
    description: 'Teach practical words for food, drinks, clothes, body parts and basic everyday health so children can describe needs, choices and routines.',
  }),
  freeze({
    id: 'nature-weather-places-transport',
    cardTitle: 'Nature, Weather, Places & Transport Vocabulary',
    path: '/resources/vocabulary/nature-weather-places-transport-for-kids',
    title: 'Nature, Weather, Places and Transport Vocabulary for Kids | Tiny Steps',
    description: 'Build vocabulary for weather, nature, neighbourhood places, transport and travel through categories, scenes, context and real-life speaking.',
  }),
  freeze({
    id: 'synonyms-antonyms',
    cardTitle: 'Synonyms & Antonyms for Kids',
    path: '/resources/vocabulary/synonyms-antonyms-for-kids',
    title: 'Synonyms and Antonyms for Kids: Meaning, Contrast & Word Choice | Tiny Steps',
    description: 'Teach similar and opposite meanings without treating every synonym as interchangeable, using context and shades of meaning.',
  }),
  freeze({
    id: 'multiple-meaning-confused-words',
    cardTitle: 'Multiple-Meaning & Easily Confused Words',
    path: '/resources/vocabulary/multiple-meaning-confused-words-for-kids',
    title: 'Multiple-Meaning and Easily Confused Words for Kids | Tiny Steps',
    description: 'Help children use context to choose the right meaning and distinguish words that look, sound or seem similar but work differently.',
  }),
  freeze({
    id: 'word-families-prefixes-suffixes',
    cardTitle: 'Word Families, Prefixes & Suffixes',
    path: '/resources/vocabulary/word-families-prefixes-suffixes-for-kids',
    title: 'Word Families, Prefixes and Suffixes for Kids | Tiny Steps',
    description: 'Build vocabulary through base words, prefixes, suffixes and related word families while connecting changes in form to changes in meaning.',
  }),
  freeze({
    id: 'context-clues',
    cardTitle: 'Context Clues for Kids',
    path: '/resources/vocabulary/context-clues-for-kids',
    title: 'Context Clues for Kids: Work Out Unknown Word Meanings | Tiny Steps',
    description: 'Teach children how to reread, notice clues, infer a possible meaning and check whether it makes sense in the sentence or passage.',
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
    description: 'Explore 16 child-friendly vocabulary guides covering everyday words, actions, descriptions, word relationships, context, natural English, speaking and writing transfer.',
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

if (VOCABULARY_AUTHORITY_ROUTE_MANIFEST.length !== 16) {
  throw new Error('GV5B must expose the complete frozen sixteen-guide Vocabulary authority architecture.');
}
if (new Set(VOCABULARY_AUTHORITY_PATHS).size !== VOCABULARY_AUTHORITY_PATHS.length) {
  throw new Error('Published Vocabulary authority paths must be unique.');
}
