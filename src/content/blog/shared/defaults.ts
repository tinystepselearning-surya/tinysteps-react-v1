import type { BlogPost } from '../types';

const BLOG_PUBLICATION_DATES: Record<string, string> = {
  'week-1-phonics-satpin-launch': '2026-04-03',
  'satpin-phonics-guide': '2025-11-06',
  'what-age-to-start-phonics': '2025-11-08',
  'what-is-phonics-for-kids': '2025-11-10',
  'phonics-rules-for-beginners': '2025-11-12',
  'week-2-phonics-blending-club': '2025-11-14',
  'phonics-blending-activities': '2025-11-16',
  'how-kids-learn-blending': '2025-11-18',
  'cvc-words-explained-for-parents': '2025-11-20',
  'phonics-games-for-letter-sounds': '2025-11-22',
  'phonics-activities-for-kids-at-home': '2025-11-24',
  'best-phonics-classes-for-kids': '2025-11-26',
  'how-phonics-classes-help-kids-read': '2025-11-28',
  'child-knows-abc-but-cannot-read': '2025-11-29',
  'benefits-of-phonics-for-kids': '2025-11-30',
  'best-online-phonics-classes-for-kids': '2025-12-02',
  'how-to-choose-phonics-classes': '2025-12-04',
  'online-phonics-classes-vs-school': '2025-12-06',
  'synthetic-phonics-vs-traditional-reading': '2025-12-08',
  'why-parents-choose-online-phonics': '2025-12-10',
  'online-phonics-games': '2025-12-12',
  'how-long-does-phonics-take': '2025-12-14',
  'how-phonics-builds-reading-confidence': '2025-12-16',
  'how-tiny-steps-builds-reading-confidence': '2025-12-18',
  'how-phonics-improves-spelling': '2025-12-20',
  'science-of-phonics-learning': '2025-12-22',
  'week-3-phonics-tricky-words': '2025-12-24',
  'digraphs-and-tricky-words': '2025-12-27',
  'week-4-phonics-long-vowels': '2025-12-29',
  'long-vowel-sounds-for-kids': '2025-12-31',
  'week-5-phonics-r-controlled': '2026-01-03',
  'r-controlled-vowels-explained': '2026-01-05',
  'week-6-phonics-comprehension': '2026-01-08',
  'online-english-classes-for-kids-india': '2026-01-10',
  'week-7-grammar-nouns-to-paragraphs': '2026-04-03',
  'week-8-grammar-tenses': '2026-01-20',
  'week-9-grammar-conjunctions': '2026-01-25',
  'week-10-grammar-subject-verb': '2026-01-29',
  'week-11-grammar-creative-writing': '2026-02-03',
  'week-12-speaking-confidence-seeds': '2026-04-04',
  'week-13-speaking-structure': '2026-02-11',
  'week-14-speaking-visual-aids': '2026-02-14',
  'week-15-speaking-debate-starters': '2026-02-18',
  'week-16-phonics-summer-plan': '2026-02-21',
  'week-17-grammar-assessment': '2026-02-24',
  'week-18-speaking-video-feedback': '2026-02-27',
  'week-19-phonics-multisyllabic': '2026-03-01',
  'week-20-grammar-editing-camp': '2026-03-04',
  'week-21-speaking-competition-prep': '2026-03-07',
  'week-22-phonics-diagnostics': '2026-03-10',
  'week-23-grammar-speaking-bridge': '2026-03-12',
  'week-24-speaking-family-showcase': '2026-03-14',
  'week-25-back-to-school-plan': '2026-03-16',
  'week-26-screen-smart-summer-routine': '2026-03-23',
  'week-27-prevent-summer-slide-reading': '2026-03-30'
};

const DEFAULT_HERO_BY_CATEGORY: Record<BlogPost['category'], string> = {
  Phonics: '/blog/hero-phonics.jpg',
  Grammar: '/blog/hero-grammar.jpg',
  'Public Speaking': '/blog/hero-speaking.jpg',
  'Parent Tips': '/blog/hero-parent-tips.jpg',
  Research: '/blog/hero-research.jpg'
};

const BLOG_CATEGORY_OVERRIDES: Partial<Record<string, BlogPost['category']>> = {
  'science-of-phonics-learning': 'Research'
};

export { BLOG_PUBLICATION_DATES, DEFAULT_HERO_BY_CATEGORY, BLOG_CATEGORY_OVERRIDES };
