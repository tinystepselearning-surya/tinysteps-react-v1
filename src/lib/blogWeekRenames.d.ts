export type LegacyWeekBlogRename = {
  slug: string;
  title: string;
};

export const LEGACY_WEEK_BLOG_RENAMES: Readonly<Record<string, LegacyWeekBlogRename>>;
export const LEGACY_WEEK_SOURCE_SLUGS: readonly string[];
export const LEGACY_WEEK_PUBLIC_SLUGS: readonly string[];
export const LEGACY_WEEK_BLOG_PATH_REDIRECTS: Readonly<Record<string, string>>;

export function getPublicBlogSlug(slug: string): string;
export function getPublicBlogTitle(slug: string, fallbackTitle?: string): string;
export function getLegacyWeekSourceSlug(publicSlug: string): string | null;
export function rewriteLegacyWeekBlogPaths(value: string): string;
