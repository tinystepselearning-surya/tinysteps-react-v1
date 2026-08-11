export const INDEXABLE_WEEKLY_BLOG_SLUGS: Set<string>;
export const BLOG_CANONICAL_REDIRECTS: Readonly<Record<string, string>>;

export function getBlogCanonicalRedirect(slug: unknown): string | null;
export function isRedirectedBlogSlug(slug: unknown): boolean;
export function isWeeklyBlogSlug(slug: unknown): boolean;
export function shouldIncludeBlogSlugInSitemap(slug: unknown): boolean;
export function shouldNoindexBlogSlug(slug: unknown): boolean;
