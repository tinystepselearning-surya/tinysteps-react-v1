const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);

export const GRAMMAR_REFERENCE_EXTENSION_ROUTE_MANIFEST = freezeList([
  freeze({
    id: 'determiners',
    cardTitle: 'Determiners for Kids',
    relatedPaths: freezeList(['/resources/grammar/a-an-articles-for-kids', '/resources/grammar/the-article-for-kids', '/resources/grammar/quantifiers-for-kids', '/resources/grammar/countable-uncountable-nouns-for-kids']),
    path: '/resources/grammar/determiners-for-kids',
    title: 'Determiners for Kids: Articles, This, My, Some & More | Tiny Steps',
    description: 'Teach determiners as the words that help identify, count or limit nouns, including articles, demonstratives, possessives, numbers and quantifiers.',
  }),
  freeze({
    id: 'countable-uncountable-nouns',
    cardTitle: 'Countable & Uncountable Nouns',
    relatedPaths: freezeList(['/resources/grammar/nouns-for-kids', '/resources/grammar/singular-and-plural-nouns', '/resources/grammar/quantifiers-for-kids', '/resources/grammar/determiners-for-kids']),
    path: '/resources/grammar/countable-uncountable-nouns-for-kids',
    title: 'Countable and Uncountable Nouns for Kids | Tiny Steps',
    description: 'Help children distinguish countable and uncountable nouns and choose a/an, some, any, much, many, few and little accurately.',
  }),
  freeze({
    id: 'noun-phrases',
    cardTitle: 'Noun Phrases for Kids',
    relatedPaths: freezeList(['/resources/grammar/nouns-for-kids', '/resources/grammar/adjectives-for-kids', '/resources/grammar/determiners-for-kids', '/blog/grammar-subject-verb']),
    path: '/resources/grammar/noun-phrases-for-kids',
    title: 'Noun Phrases for Kids: Head Nouns, Determiners & Modifiers | Tiny Steps',
    description: 'Teach noun phrases by finding the head noun and showing how determiners, adjectives and other words add precise information around it.',
  }),
  freeze({
    id: 'verb-forms-irregular-verbs',
    cardTitle: 'Verb Forms & Irregular Verbs',
    relatedPaths: freezeList(['/resources/grammar/verbs-for-kids', '/resources/grammar/simple-past-tense-for-kids', '/resources/grammar/present-perfect-vs-simple-past-for-kids', '/resources/grammar/active-and-passive-voice-for-kids']),
    path: '/resources/grammar/verb-forms-irregular-verbs-for-kids',
    title: 'Verb Forms and Irregular Verbs for Kids | Tiny Steps',
    description: 'Teach base, past, past participle, -ing and third-person verb forms, with high-frequency irregular verbs and tense-linked practice.',
  }),
  freeze({
    id: 'word-order-focus',
    cardTitle: 'Word Order in English',
    relatedPaths: freezeList(['/blog/how-to-improve-sentence-formation-in-kids', '/resources/grammar/forming-questions-in-english-for-kids', '/resources/grammar/adverbs-for-kids', '/resources/grammar/noun-phrases-for-kids']),
    path: '/resources/grammar/word-order-for-kids',
    title: 'Word Order in English for Kids: Clear Sentence Patterns | Tiny Steps',
    description: 'Teach children how subject, verb, object and adverb placement shape clear English statements, questions and focused sentences.',
  }),
  freeze({
    id: 'common-grammar-mistakes',
    cardTitle: 'Common Grammar Mistakes for Kids',
    relatedPaths: freezeList(['/blog/grammar-subject-verb', '/resources/grammar/countable-uncountable-nouns-for-kids', '/resources/grammar/forming-questions-in-english-for-kids', '/resources/grammar/sentence-fragments-and-run-ons-for-kids']),
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
