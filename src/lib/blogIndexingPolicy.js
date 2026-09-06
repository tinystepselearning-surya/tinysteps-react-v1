import { LEGACY_WEEK_PUBLIC_SLUGS } from './blogWeekRenames.js';

/**
 * Historical weekly source slugs that were explicitly approved as indexable.
 * Keep this exported compatibility contract limited to the original week-* IDs;
 * Node-based SEO infrastructure tests and older audit scripts depend on it.
 */
export const INDEXABLE_WEEKLY_BLOG_SLUGS = new Set([
  'week-1-phonics-satpin-launch',
  'week-7-grammar-nouns-to-paragraphs',
  'week-12-speaking-confidence-seeds',
]);

/**
 * Clean public replacements for the same three historically approved authority articles.
 * These are intentionally separate from INDEXABLE_WEEKLY_BLOG_SLUGS so the
 * historical infrastructure contract stays stable during the URL migration.
 */
const INDEXABLE_RENAMED_WEEKLY_PUBLIC_SLUGS = new Set([
  'phonics-satpin-launch',
  'grammar-nouns-to-paragraphs',
  'speaking-confidence-seeds',
]);

/**
 * Former roadmap/support articles that have completed the human-first quality
 * audit and now own a distinct indexable search intent. Keep the historical
 * week-* source URL as a redirect alias; only the cleaned public slug is promoted.
 */
const QUALITY_PROMOTED_PUBLIC_SLUGS = new Set([
  'prevent-summer-slide-reading',
  'phonics-blending-club',
  'phonics-comprehension',
  'phonics-diagnostics',
  'phonics-long-vowels',
  'phonics-multisyllabic',
  'phonics-r-controlled',
  'phonics-summer-plan',
  'phonics-tricky-words',
  'back-to-school-english-confidence-plan',
  'screen-smart-summer-routine-for-kids',
  'grammar-tenses',
  'grammar-conjunctions',
  'grammar-subject-verb',
  'grammar-creative-writing',
  'grammar-assessment',
  'grammar-editing-camp',
  'grammar-speaking-bridge',
  'speaking-structure',
  'speaking-visual-aids',
  'speaking-debate-starters',
  'speaking-video-feedback',
]);

const RENAMED_WEEKLY_PUBLIC_SLUGS = new Set(LEGACY_WEEK_PUBLIC_SLUGS);

export function isWeeklyBlogSlug(slug) {
  if (typeof slug !== 'string') return false;
  const normalized = slug.trim();
  // Keep the historical pattern as a future-proof guardrail for any new
  // editorial week source, while explicitly recognizing the cleaned public
  // slugs created by the 2026 URL migration.
  return /^week-\d+/i.test(normalized) || RENAMED_WEEKLY_PUBLIC_SLUGS.has(normalized);
}

function isIndexableRoadmapAuthoritySlug(slug) {
  const normalized = String(slug).trim();
  return (
    INDEXABLE_WEEKLY_BLOG_SLUGS.has(normalized)
    || INDEXABLE_RENAMED_WEEKLY_PUBLIC_SLUGS.has(normalized)
    || QUALITY_PROMOTED_PUBLIC_SLUGS.has(normalized)
  );
}

export function shouldIncludeBlogSlugInSitemap(slug) {
  if (!slug) return false;
  if (!isWeeklyBlogSlug(slug)) return true;
  return isIndexableRoadmapAuthoritySlug(slug);
}

export function shouldNoindexBlogSlug(slug) {
  if (!slug) return false;
  return isWeeklyBlogSlug(slug) && !isIndexableRoadmapAuthoritySlug(slug);
}
