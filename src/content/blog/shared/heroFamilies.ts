import type { BlogPost } from '../types';
import { getPublicBlogSlug } from '../../../lib/blogWeekRenames.js';

export type BlogHeroFamily =
  | 'listening-for-sounds'
  | 'sound-meets-letter'
  | 'blending-into-a-word'
  | 'cracking-the-printed-code'
  | 'breaking-down-longer-words'
  | 'from-speech-to-spelling'
  | 'reading-for-meaning'
  | 'fluent-independent-reading'
  | 'finding-the-reading-gap'
  | 'learning-live-online'
  | 'digital-practice-with-purpose'
  | 'english-practice-at-home'
  | 'building-better-sentences'
  | 'planning-and-writing-ideas'
  | 'editing-and-improving-writing'
  | 'finding-your-speaking-voice'
  | 'conversation-and-storytelling'
  | 'presenting-with-confidence'
  | 'ready-for-the-classroom'
  | 'teacher-training-in-action'
  | 'planning-a-school-reading-programme';

type HeroFamilyPost = Pick<BlogPost, 'slug' | 'hero'>;

// Every current public blog article is assigned explicitly.
// New articles intentionally fall back to their stored hero until they are editorially reviewed.
export const BLOG_HERO_FAMILY_BY_SLUG: Readonly<Record<string, BlogHeroFamily>> = Object.freeze({
  // 1. Listening for Sounds
  'phonological-awareness-vs-phonemic-awareness-vs-phonics': 'listening-for-sounds',

  // 2. Sound Meets Letter
  'benefits-of-phonics-for-kids': 'sound-meets-letter',
  'phonics-games-for-letter-sounds': 'sound-meets-letter',
  'phonics-rules-for-beginners': 'sound-meets-letter',
  'phonics-satpin-launch': 'sound-meets-letter',
  'satpin-phonics-guide': 'sound-meets-letter',
  'synthetic-phonics-vs-traditional-reading': 'sound-meets-letter',
  'what-is-phonics-for-kids': 'sound-meets-letter',
  'what-age-to-start-phonics': 'sound-meets-letter',
  'phonics-for-parents-guide': 'sound-meets-letter',
  'how-phonics-classes-help-kids-read': 'sound-meets-letter',

  // 3. Blending Into a Word
  'phonics-blending-club': 'blending-into-a-word',
  'cvc-words-explained-for-parents': 'blending-into-a-word',
  'how-kids-learn-blending': 'blending-into-a-word',
  'phonics-blending-activities': 'blending-into-a-word',
  'why-child-knows-letter-sounds-but-cannot-read-words': 'blending-into-a-word',

  // 4. Cracking the Printed Code
  'digraphs-and-tricky-words': 'cracking-the-printed-code',
  'phonics-tricky-words': 'cracking-the-printed-code',
  'phonics-long-vowels': 'cracking-the-printed-code',
  'long-vowel-sounds-for-kids': 'cracking-the-printed-code',
  'science-of-phonics-learning': 'cracking-the-printed-code',
  'phonics-r-controlled': 'cracking-the-printed-code',
  'r-controlled-vowels-explained': 'cracking-the-printed-code',
  'sight-words-or-phonics-first': 'cracking-the-printed-code',

  // 5. Breaking Down Longer Words
  'phonics-multisyllabic': 'breaking-down-longer-words',

  // 6. From Speech to Spelling
  'how-phonics-improves-spelling': 'from-speech-to-spelling',

  // 7. Reading for Meaning
  'phonics-comprehension': 'reading-for-meaning',
  'why-child-reads-words-but-does-not-understand-story': 'reading-for-meaning',
  'how-vocabulary-supports-reading-comprehension': 'reading-for-meaning',

  // 8. Fluent Independent Reading
  'how-long-does-phonics-take': 'fluent-independent-reading',
  'how-phonics-builds-reading-confidence': 'fluent-independent-reading',
  'how-to-improve-reading-fluency-in-children': 'fluent-independent-reading',
  'how-children-recognise-words-automatically-after-phonics': 'fluent-independent-reading',

  // 9. Finding the Reading Gap
  'child-knows-abc-but-cannot-read': 'finding-the-reading-gap',
  'phonics-diagnostics': 'finding-the-reading-gap',
  'child-reads-in-class-but-forgets-at-home': 'finding-the-reading-gap',

  // 10. Learning Live Online
  'online-phonics-classes-vs-school': 'learning-live-online',
  'why-parents-choose-online-phonics': 'learning-live-online',
  'online-english-classes-for-kids-india': 'learning-live-online',

  // 11. Digital Practice With Purpose
  'online-phonics-games': 'digital-practice-with-purpose',
  'are-phonics-apps-enough-for-kids': 'digital-practice-with-purpose',
  'screen-smart-summer-routine-for-kids': 'digital-practice-with-purpose',

  // 12. English Practice at Home
  'prevent-summer-slide-reading': 'english-practice-at-home',
  'phonics-activities-for-kids-at-home': 'english-practice-at-home',
  'phonics-summer-plan': 'english-practice-at-home',
  'can-child-improve-english-in-10-days': 'english-practice-at-home',
  'how-phonics-grammar-and-communication-work-together': 'english-practice-at-home',
  'how-to-engage-kids-in-english-learning-at-home': 'english-practice-at-home',

  // 13. Building Better Sentences
  'grammar-conjunctions': 'building-better-sentences',
  'grammar-tenses': 'building-better-sentences',
  'grammar-nouns-to-paragraphs': 'building-better-sentences',
  'grammar-subject-verb': 'building-better-sentences',
  'how-to-improve-sentence-formation-in-kids': 'building-better-sentences',

  // 14. Planning and Writing Ideas
  'grammar-creative-writing': 'planning-and-writing-ideas',
  'how-to-teach-paragraph-writing-to-kids': 'planning-and-writing-ideas',

  // 15. Editing and Improving Writing
  'grammar-assessment': 'editing-and-improving-writing',
  'grammar-editing-camp': 'editing-and-improving-writing',
  'punctuation-and-capital-letters-for-kids': 'editing-and-improving-writing',
  'child-knows-grammar-but-makes-mistakes': 'editing-and-improving-writing',

  // 16. Finding Your Speaking Voice
  'child-gives-one-word-answers': 'finding-your-speaking-voice',
  'child-understands-english-but-does-not-speak': 'finding-your-speaking-voice',
  'speaking-confidence-seeds': 'finding-your-speaking-voice',

  // 17. Conversation and Storytelling
  'grammar-speaking-bridge': 'conversation-and-storytelling',
  'conversation-skills-for-kids': 'conversation-and-storytelling',
  'how-to-teach-storytelling-to-kids': 'conversation-and-storytelling',

  // 18. Presenting With Confidence
  'speaking-debate-starters': 'presenting-with-confidence',
  'speaking-visual-aids': 'presenting-with-confidence',
  'speaking-structure': 'presenting-with-confidence',
  'speaking-video-feedback': 'presenting-with-confidence',
  'speaking-family-showcase': 'presenting-with-confidence',
  'speaking-competition-prep': 'presenting-with-confidence',
  'public-speaking-delivery-for-kids': 'presenting-with-confidence',

  // 19. Ready for the Classroom
  'back-to-school-english-confidence-plan': 'ready-for-the-classroom',
  'june-school-reopening-english-readiness-plan': 'ready-for-the-classroom',

  // 20. Teacher Training in Action
  'phonics-teacher-training-for-schools-implementation': 'teacher-training-in-action',

  // 21. Planning a School Reading Programme
  'cbse-phonics-curriculum-vs-systematic-phonics-programme': 'planning-a-school-reading-programme',
  'does-cbse-include-phonics-ncf-foundational-literacy': 'planning-a-school-reading-programme',
  'how-schools-can-assess-decoding-not-memorisation': 'planning-a-school-reading-programme',
  'international-phonics-benchmarks-for-indian-schools': 'planning-a-school-reading-programme',
  'phonics-scope-and-sequence-for-cbse-schools': 'planning-a-school-reading-programme',
  'systematic-cumulative-phonics-explained-for-schools': 'planning-a-school-reading-programme',
  'why-letter-sounds-are-not-enough-to-read': 'planning-a-school-reading-programme',
});

export const BLOG_HERO_FAMILY_ASSET_DIRECTORY = '/blog/hero-families';

export const AVAILABLE_BLOG_HERO_FAMILY_ASSETS: ReadonlySet<BlogHeroFamily> = new Set([
  'listening-for-sounds',
  'sound-meets-letter',
  'blending-into-a-word',
  'cracking-the-printed-code',
  'breaking-down-longer-words',
  'from-speech-to-spelling',
  'reading-for-meaning',
  'fluent-independent-reading',
  'finding-the-reading-gap',
  'learning-live-online',
  'digital-practice-with-purpose',
  'english-practice-at-home',
  'building-better-sentences',
  'planning-and-writing-ideas',
  'editing-and-improving-writing',
  'finding-your-speaking-voice',
  'conversation-and-storytelling',
  'presenting-with-confidence',
  'ready-for-the-classroom',
  'teacher-training-in-action',
  'planning-a-school-reading-programme',
]);

export function getBlogHeroFamily(post: HeroFamilyPost): BlogHeroFamily | undefined {
  const publicSlug = getPublicBlogSlug(post.slug);
  return BLOG_HERO_FAMILY_BY_SLUG[publicSlug];
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
