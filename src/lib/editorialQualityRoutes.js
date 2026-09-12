import { PHONICS_AUTHORITY_SLUGS } from './phonicsAuthorityRoutes.js';

/**
 * Parent communication / English support quality programme.
 * These are public authority slugs after any legacy week-* URL migration.
 */
export const PARENT_COMMUNICATION_17_AUTHORITY_SLUGS = Object.freeze([
  'are-phonics-apps-enough-for-kids',
  'can-child-improve-english-in-10-days',
  'child-gives-one-word-answers',
  'child-knows-grammar-but-makes-mistakes',
  'child-reads-in-class-but-forgets-at-home',
  'child-understands-english-but-does-not-speak',
  'how-phonics-grammar-and-communication-work-together',
  'how-to-engage-kids-in-english-learning-at-home',
  'how-to-improve-reading-fluency-in-children',
  'how-to-improve-sentence-formation-in-kids',
  'june-school-reopening-english-readiness-plan',
  'online-english-classes-for-kids-india',
  'sight-words-or-phonics-first',
  'back-to-school-english-confidence-plan',
  'screen-smart-summer-routine-for-kids',
  'why-child-knows-letter-sounds-but-cannot-read-words',
  'why-child-reads-words-but-does-not-understand-story',
]);

export const PARENT_COMMUNICATION_17_AUTHORITY_ROUTES = Object.freeze(
  PARENT_COMMUNICATION_17_AUTHORITY_SLUGS.map((slug) => `/blog/${slug}`),
);

/**
 * Current quality-reviewed Tiny Steps editorial authorities after recovery
 * consolidation: 33 phonics authorities + 17 parent communication authorities.
 * The retired phonics class-selection blog now resolves to the dedicated
 * commercial comparison owner instead of remaining a second editorial owner.
 */
export const QUALITY_AUTHORITY_SLUGS = Object.freeze([
  ...PHONICS_AUTHORITY_SLUGS,
  ...PARENT_COMMUNICATION_17_AUTHORITY_SLUGS,
]);

export const QUALITY_AUTHORITY_ROUTES = Object.freeze(
  QUALITY_AUTHORITY_SLUGS.map((slug) => `/blog/${slug}`),
);
