export const INDEXABLE_WEEKLY_BLOG_SLUGS = new Set([
  'week-1-phonics-satpin-launch',
  'week-7-grammar-nouns-to-paragraphs',
  'week-12-speaking-confidence-seeds',
]);

/**
 * Content that remains available to users but should not compete as an
 * independent search result. Keep this policy shared by article robots and
 * sitemap generation so we never create an "indexable page but sitemap-excluded"
 * split-brain state.
 *
 * `spoken-english-classes-for-kids-confidence` substantially overlaps the
 * stronger parent problem route `child-understands-english-but-does-not-speak`.
 * B3 uses reversible noindex rather than an evidence-free redirect. A later
 * performance-backed consolidation can still 301 it if that is the right call.
 */
export const NOINDEX_BLOG_SLUGS = new Set([
  'spoken-english-classes-for-kids-confidence',
]);

export function isWeeklyBlogSlug(slug) {
  return typeof slug === 'string' && /^week-\d+/i.test(slug.trim());
}

export function shouldIncludeBlogSlugInSitemap(slug) {
  if (!slug) return false;
  const normalized = String(slug).trim();
  if (NOINDEX_BLOG_SLUGS.has(normalized)) return false;
  if (!isWeeklyBlogSlug(normalized)) return true;
  return INDEXABLE_WEEKLY_BLOG_SLUGS.has(normalized);
}

export function shouldNoindexBlogSlug(slug) {
  if (!slug) return false;
  const normalized = String(slug).trim();
  if (NOINDEX_BLOG_SLUGS.has(normalized)) return true;
  return isWeeklyBlogSlug(normalized) && !INDEXABLE_WEEKLY_BLOG_SLUGS.has(normalized);
}
