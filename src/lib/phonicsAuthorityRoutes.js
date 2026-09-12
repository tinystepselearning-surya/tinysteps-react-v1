export const PHONICS_AUTHORITY_SLUGS = Object.freeze([
  'benefits-of-phonics-for-kids',
  'child-knows-abc-but-cannot-read',
  'cvc-words-explained-for-parents',
  'digraphs-and-tricky-words',
  'how-kids-learn-blending',
  'how-long-does-phonics-take',
  'how-phonics-builds-reading-confidence',
  'how-phonics-classes-help-kids-read',
  'how-phonics-improves-spelling',
  'long-vowel-sounds-for-kids',
  'online-phonics-classes-vs-school',
  'online-phonics-games',
  'phonics-activities-for-kids-at-home',
  'phonics-blending-activities',
  'phonics-games-for-letter-sounds',
  'phonics-rules-for-beginners',
  'r-controlled-vowels-explained',
  'satpin-phonics-guide',
  'science-of-phonics-learning',
  'synthetic-phonics-vs-traditional-reading',
  'phonics-satpin-launch',
  'phonics-summer-plan',
  'phonics-multisyllabic',
  'phonics-blending-club',
  'phonics-diagnostics',
  'prevent-summer-slide-reading',
  'phonics-tricky-words',
  'phonics-long-vowels',
  'phonics-r-controlled',
  'phonics-comprehension',
  'what-age-to-start-phonics',
  'what-is-phonics-for-kids',
  'why-parents-choose-online-phonics',
]);

export const PHONICS_AUTHORITY_ROUTES = Object.freeze(
  PHONICS_AUTHORITY_SLUGS.map((slug) => `/blog/${slug}`),
);

// Backward-compatible export names retained because older build/audit code still
// imports them. The recovery consolidation reduced the live set from 34 to 33.
export const PHONICS_34_AUTHORITY_SLUGS = PHONICS_AUTHORITY_SLUGS;
export const PHONICS_34_AUTHORITY_ROUTES = PHONICS_AUTHORITY_ROUTES;
