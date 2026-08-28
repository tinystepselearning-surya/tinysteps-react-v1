import type { BlogPost } from '../types';

export type BlogHeroFamily =
  | 'satpin-letter-sounds'
  | 'blending-early-reading'
  | 'reading-fluency'
  | 'parent-home-practice'
  | 'grammar-sentence-building'
  | 'speaking-communication'
  | 'school-readiness-routines'
  | 'schools-research'
  | 'teacher-classroom-support'
  | 'general-phonics';

type HeroFamilyPost = Pick<BlogPost, 'slug' | 'hero' | 'audience' | 'discoveryCategory'>;

export const BLOG_HERO_FAMILY_BY_SLUG: Readonly<Record<string, BlogHeroFamily>> = Object.freeze({
  // SATPIN and first-sound sequence
  'satpin-phonics-guide': 'satpin-letter-sounds',
  'week-1-phonics-satpin-launch': 'satpin-letter-sounds',

  // Blending and first-word decoding
  'why-child-knows-letter-sounds-but-cannot-read-words': 'blending-early-reading',
  'child-knows-abc-but-cannot-read': 'blending-early-reading',
  'cvc-words-explained-for-parents': 'blending-early-reading',
  'how-kids-learn-blending': 'blending-early-reading',
  'phonics-blending-activities': 'blending-early-reading',
  'week-2-phonics-blending-club': 'blending-early-reading',

  // Connected-text fluency
  'how-to-improve-reading-fluency-in-children': 'reading-fluency',

  // Parent-led practice and home routines
  'child-reads-in-class-but-forgets-at-home': 'parent-home-practice',
  'how-to-engage-kids-in-english-learning-at-home': 'parent-home-practice',
  'phonics-activities-for-kids-at-home': 'parent-home-practice',
  'phonics-for-parents-guide': 'parent-home-practice',
  'phonics-games-for-letter-sounds': 'parent-home-practice',
  'week-16-phonics-summer-plan': 'parent-home-practice',
  'week-26-screen-smart-summer-routine': 'parent-home-practice',
  'week-27-prevent-summer-slide-reading': 'parent-home-practice',

  // Grammar, writing, and sentence construction
  'how-to-improve-sentence-formation-in-kids': 'grammar-sentence-building',
  'child-knows-grammar-but-makes-mistakes': 'grammar-sentence-building',
  'week-7-grammar-nouns-to-paragraphs': 'grammar-sentence-building',
  'week-8-grammar-tenses': 'grammar-sentence-building',
  'week-9-grammar-conjunctions': 'grammar-sentence-building',
  'week-10-grammar-subject-verb': 'grammar-sentence-building',
  'week-17-grammar-assessment': 'grammar-sentence-building',
  'week-20-grammar-editing-camp': 'grammar-sentence-building',
  'week-23-grammar-speaking-bridge': 'grammar-sentence-building',

  // Speaking, listening, presentations, and communication confidence
  'child-understands-english-but-does-not-speak': 'speaking-communication',
  'child-gives-one-word-answers': 'speaking-communication',
  'spoken-english-classes-for-kids-confidence': 'speaking-communication',
  'week-12-speaking-confidence-seeds': 'speaking-communication',
  'week-13-speaking-structure': 'speaking-communication',
  'week-14-speaking-visual-aids': 'speaking-communication',
  'week-15-speaking-debate-starters': 'speaking-communication',
  'week-18-speaking-video-feedback': 'speaking-communication',
  'week-21-speaking-competition-prep': 'speaking-communication',
  'week-24-speaking-family-showcase': 'speaking-communication',

  // School transitions and readiness routines
  'june-school-reopening-english-readiness-plan': 'school-readiness-routines',
  'week-25-back-to-school-plan': 'school-readiness-routines',
  'what-age-to-start-phonics': 'school-readiness-routines',

  // Classroom implementation and teacher enablement
  'how-schools-can-assess-decoding-not-memorisation': 'teacher-classroom-support',
  'phonics-teacher-training-for-schools-implementation': 'teacher-classroom-support',

  // Broad phonics without a stronger family match
  'benefits-of-phonics-for-kids': 'general-phonics',
  'digraphs-and-tricky-words': 'general-phonics',
  'how-long-does-phonics-take': 'general-phonics',
  'how-phonics-builds-reading-confidence': 'general-phonics',
  'how-phonics-classes-help-kids-read': 'general-phonics',
  'how-phonics-improves-spelling': 'general-phonics',
  'long-vowel-sounds-for-kids': 'general-phonics',
  'online-phonics-games': 'general-phonics',
  'phonics-rules-for-beginners': 'general-phonics',
  'r-controlled-vowels-explained': 'general-phonics',
  'science-of-phonics-learning': 'general-phonics',
  'sight-words-or-phonics-first': 'general-phonics',
  'synthetic-phonics-vs-traditional-reading': 'general-phonics',
  'week-3-phonics-tricky-words': 'general-phonics',
  'week-4-phonics-long-vowels': 'general-phonics',
  'week-5-phonics-r-controlled': 'general-phonics',
  'week-19-phonics-multisyllabic': 'general-phonics',
  'what-is-phonics-for-kids': 'general-phonics',
});

export const BLOG_HERO_FAMILY_ASSET_DIRECTORY = '/blog/hero-families';

// Add a family here only after its production WebP exists in public/blog/hero-families/.
// Keeping this registry explicit prevents browsers from requesting planned-but-missing assets.
export const AVAILABLE_BLOG_HERO_FAMILY_ASSETS: ReadonlySet<BlogHeroFamily> = new Set([
  'satpin-letter-sounds',
  'blending-early-reading',
  'reading-fluency',
  'parent-home-practice',
  'grammar-sentence-building',
  'speaking-communication',
  'school-readiness-routines',
  'schools-research',
  'teacher-classroom-support',
  'general-phonics',
]);

export function getBlogHeroFamily(post: HeroFamilyPost): BlogHeroFamily | undefined {
  const explicitFamily = BLOG_HERO_FAMILY_BY_SLUG[post.slug];
  if (explicitFamily) return explicitFamily;

  if (post.audience === 'Schools & Research' || post.discoveryCategory === 'Schools & Research') {
    return 'schools-research';
  }

  return undefined;
}

export function getBlogHeroFamilyAssetPath(family: BlogHeroFamily): string {
  return `${BLOG_HERO_FAMILY_ASSET_DIRECTORY}/${family}.webp`;
}

export function resolveBlogHero(post: HeroFamilyPost): string | undefined {
  const family = getBlogHeroFamily(post);
  if (family && AVAILABLE_BLOG_HERO_FAMILY_ASSETS.has(family)) {
    return getBlogHeroFamilyAssetPath(family);
  }

  return post.hero;
}
