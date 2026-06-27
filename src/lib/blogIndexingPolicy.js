export const INDEXABLE_WEEKLY_BLOG_SLUGS = new Set([
  'week-1-phonics-satpin-launch',
  'week-7-grammar-nouns-to-paragraphs',
  'week-12-speaking-confidence-seeds',
]);

export function isWeeklyBlogSlug(slug) {
  return typeof slug === 'string' && /^week-\d+/i.test(slug.trim());
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
