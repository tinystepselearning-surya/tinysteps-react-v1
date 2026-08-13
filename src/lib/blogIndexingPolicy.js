export const INDEXABLE_WEEKLY_BLOG_SLUGS = new Set([
  'week-1-phonics-satpin-launch',
  'week-7-grammar-nouns-to-paragraphs',
  'week-12-speaking-confidence-seeds',
]);

// High-confidence canonical consolidations only. These pairs were selected after
// reviewing the current source content and existing SEO/AEO/GEO architecture.
// We deliberately do not collapse broader static/long-tail pages merely because
// their slugs look similar; existing self-canonical pages and proven topic lanes
// remain untouched unless there is clear duplicate intent and a stronger target.
export const BLOG_CANONICAL_REDIRECTS = Object.freeze({
  'child-reads-words-but-does-not-understand-story':
    'why-child-reads-words-but-does-not-understand-story',
  'how-long-does-phonics-take':
    'how-long-does-it-take-child-to-learn-phonics',
  'june-school-readiness-english-revision-plan':
    'june-school-reopening-english-readiness-plan',
  'why-child-answers-only-in-one-word':
    'child-gives-one-word-answers',
});

export function getBlogCanonicalRedirect(slug) {
  if (!slug) return null;
  return BLOG_CANONICAL_REDIRECTS[String(slug).trim()] || null;
}

export function isRedirectedBlogSlug(slug) {
  return Boolean(getBlogCanonicalRedirect(slug));
}

export function isWeeklyBlogSlug(slug) {
  return typeof slug === 'string' && /^week-\d+/i.test(slug.trim());
}

export function shouldIncludeBlogSlugInSitemap(slug) {
  if (!slug) return false;
  if (isRedirectedBlogSlug(slug)) return false;
  if (!isWeeklyBlogSlug(slug)) return true;
  return INDEXABLE_WEEKLY_BLOG_SLUGS.has(String(slug).trim());
}

export function shouldNoindexBlogSlug(slug) {
  if (!slug) return false;
  if (isRedirectedBlogSlug(slug)) return false;
  return isWeeklyBlogSlug(slug) && !INDEXABLE_WEEKLY_BLOG_SLUGS.has(String(slug).trim());
}
