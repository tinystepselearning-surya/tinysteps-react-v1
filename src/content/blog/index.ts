import type { BlogPost, PhonicsSeoPost } from './types';
import { BLOG_PUBLICATION_DATES, BLOG_CATEGORY_OVERRIDES, DEFAULT_HERO_BY_CATEGORY } from './shared/defaults';
import { applyBlogEditorialCleanup } from './shared/editorialCleanup';
import { makePhonicsPost } from './shared/phonicsShared';
import { enrichWeekPost } from './shared/weeklyShared';

type PostModule = {
  default?: BlogPost | PhonicsSeoPost;
};

const postModules = import.meta.glob('./posts/**/*.ts', { eager: true }) as Record<string, PostModule>;

function isBlogPost(value: BlogPost | PhonicsSeoPost | undefined): value is BlogPost {
  return Boolean(value && 'body' in value && Array.isArray(value.body) && value.slug);
}

function isPhonicsSeoPost(value: BlogPost | PhonicsSeoPost | undefined): value is PhonicsSeoPost {
  return Boolean(value && 'focus' in value && 'quickAnswer' in value && value.slug);
}

function normalizePost(value: BlogPost | PhonicsSeoPost | undefined): BlogPost | null {
  if (isBlogPost(value)) return value;
  if (isPhonicsSeoPost(value)) return makePhonicsPost(value);
  return null;
}

const postsBySlug = new Map<string, BlogPost>();

for (const [path, module] of Object.entries(postModules).sort(([a], [b]) => a.localeCompare(b))) {
  const post = normalizePost(module.default);
  if (!post) continue;

  if (postsBySlug.has(post.slug) && import.meta.env.DEV) {
    console.warn(`[blog] Duplicate slug "${post.slug}" detected while loading ${path}. Keeping the first post.`);
    continue;
  }

  postsBySlug.set(post.slug, post);
}

const normalizedBlogPosts: BlogPost[] = Array.from(postsBySlug.values()).map((post) => {
  const enriched = applyBlogEditorialCleanup(enrichWeekPost(post));
  return {
    ...enriched,
    category: BLOG_CATEGORY_OVERRIDES[enriched.slug] ?? enriched.category,
    date: BLOG_PUBLICATION_DATES[enriched.slug] ?? enriched.date,
    hero: enriched.hero ?? DEFAULT_HERO_BY_CATEGORY[BLOG_CATEGORY_OVERRIDES[enriched.slug] ?? enriched.category],
  };
});

export const blogPosts: BlogPost[] = normalizedBlogPosts.sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
);

if (import.meta.env.DEV) {
  const excerptIssues = blogPosts
    .map((post) => ({
      slug: post.slug,
      length: post.excerpt.replace(/\s+/g, ' ').trim().length,
    }))
    .filter(({ length }) => length < 120 || length > 200);

  if (excerptIssues.length) {
    console.warn('[blog] Excerpts outside the 120–200 character SEO target:', excerptIssues);
  }
}
