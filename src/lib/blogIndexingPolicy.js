import { LEGACY_WEEK_PUBLIC_SLUGS } from './blogWeekRenames.js';

export const INDEXABLE_WEEKLY_BLOG_SLUGS = new Set([
  'week-1-phonics-satpin-launch',
  'phonics-satpin-launch',
  'week-7-grammar-nouns-to-paragraphs',
  'grammar-nouns-to-paragraphs',
  'week-12-speaking-confidence-seeds',
  'speaking-confidence-seeds',
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

export function shouldIncludeBlogSlugInSitemap(slug) {
  if (!slug) return false;
  if (!isWeeklyBlogSlug(slug)) return true;
  return INDEXABLE_WEEKLY_BLOG_SLUGS.has(String(slug).trim());
}

export function shouldNoindexBlogSlug(slug) {
  if (!slug) return false;
  return isWeeklyBlogSlug(slug) && !INDEXABLE_WEEKLY_BLOG_SLUGS.has(String(slug).trim());
}
