import { LEGACY_WEEK_PUBLIC_SLUGS, LEGACY_WEEK_SOURCE_SLUGS } from './blogWeekRenames.js';

export const INDEXABLE_WEEKLY_BLOG_SLUGS = new Set([
  'week-1-phonics-satpin-launch',
  'phonics-satpin-launch',
  'week-7-grammar-nouns-to-paragraphs',
  'grammar-nouns-to-paragraphs',
  'week-12-speaking-confidence-seeds',
  'speaking-confidence-seeds',
]);

const LEGACY_WEEKLY_BLOG_SLUGS = new Set([
  ...LEGACY_WEEK_SOURCE_SLUGS,
  ...LEGACY_WEEK_PUBLIC_SLUGS,
]);

export function isWeeklyBlogSlug(slug) {
  return typeof slug === 'string' && LEGACY_WEEKLY_BLOG_SLUGS.has(slug.trim());
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
