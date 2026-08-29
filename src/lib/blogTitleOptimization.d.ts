export const BLOG_TITLE_OPTIMIZATIONS: Readonly<Record<string, string>>;

export function getOptimizedBlogTitle(slug: string, fallbackTitle?: string): string;

export function applyBlogTitleOptimization<T extends { slug?: string; title?: string }>(post: T): T;
