const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);

export const GRAMMAR_REFERENCE_EXTENSION_ROUTE_MANIFEST = freezeList([
  freeze({
    path: '/resources/grammar/determiners-for-kids',
    title: 'Determiners for Kids: Articles, This, My, Some & More | Tiny Steps',
    description: 'Teach determiners as the words that help identify, count or limit nouns, including articles, demonstratives, possessives, numbers and quantifiers.',
  }),
  freeze({
    path: '/resources/grammar/countable-uncountable-nouns-for-kids',
    title: 'Countable and Uncountable Nouns for Kids | Tiny Steps',
    description: 'Help children distinguish countable and uncountable nouns and choose a/an, some, any, much, many, few and little accurately.',
  }),
  freeze({
    path: '/resources/grammar/noun-phrases-for-kids',
    title: 'Noun Phrases for Kids: Head Nouns, Determiners & Modifiers | Tiny Steps',
    description: 'Teach noun phrases by finding the head noun and showing how determiners, adjectives and other words add precise information around it.',
  }),
  freeze({
    path: '/resources/grammar/verb-forms-irregular-verbs-for-kids',
    title: 'Verb Forms and Irregular Verbs for Kids | Tiny Steps',
    description: 'Teach base, past, past participle, -ing and third-person verb forms, with high-frequency irregular verbs and tense-linked practice.',
  }),
  freeze({
    path: '/resources/grammar/word-order-for-kids',
    title: 'Word Order in English for Kids: Clear Sentence Patterns | Tiny Steps',
    description: 'Teach children how subject, verb, object and adverb placement shape clear English statements, questions and focused sentences.',
  }),
  freeze({
    path: '/resources/grammar/common-grammar-mistakes-for-kids',
    title: 'Common Grammar Mistakes for Kids: Find, Explain & Fix Errors | Tiny Steps',
    description: 'Use a diagnostic guide to identify common child grammar errors in agreement, articles, countability, tense, questions, word order and sentence boundaries.',
  }),
]);

export const GRAMMAR_REFERENCE_EXTENSION_PATHS = freezeList(
  GRAMMAR_REFERENCE_EXTENSION_ROUTE_MANIFEST.map((entry) => entry.path),
);

export const GRAMMAR_REFERENCE_EXTENSION_RESOURCE_SEO = freeze(
  Object.fromEntries(GRAMMAR_REFERENCE_EXTENSION_ROUTE_MANIFEST.map((entry) => [
    entry.path,
    freeze({
      title: entry.title,
      description: entry.description,
      canonicalPath: entry.path,
      ogType: 'article',
    }),
  ])),
);

if (GRAMMAR_REFERENCE_EXTENSION_ROUTE_MANIFEST.length !== 6) {
  throw new Error('GV3 Grammar reference-extension manifest must contain exactly six first-batch pages.');
}
if (new Set(GRAMMAR_REFERENCE_EXTENSION_PATHS).size !== GRAMMAR_REFERENCE_EXTENSION_PATHS.length) {
  throw new Error('GV3 Grammar reference-extension paths must be unique.');
}
