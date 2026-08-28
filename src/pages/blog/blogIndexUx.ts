import type { BlogPost } from '../../content/blog/types';

export const BLOG_TOPIC_OPTIONS = [
  'All',
  'Phonics',
  'Grammar',
  'Public Speaking',
  'English Communication',
  'Parent Tips',
  'Research',
] as const;

export type BlogTopic = (typeof BLOG_TOPIC_OPTIONS)[number];

export type BlogIndexItem = Pick<
  BlogPost,
  'slug' | 'title' | 'category' | 'author' | 'date' | 'readTime' | 'hero' | 'excerpt'
> &
  Partial<Pick<BlogPost, 'metaDescription' | 'body' | 'faq'>>;

export const GSC_AUTHORITY_SLUGS = Object.freeze([
  'satpin-phonics-guide',
  'phonics-for-parents-guide',
  'why-child-knows-letter-sounds-but-cannot-read-words',
  'child-gives-one-word-answers',
]);

export const PARENT_GOAL_ROUTES = Object.freeze([
  {
    id: 'abc-cannot-read',
    eyebrow: 'Reading is stuck',
    title: 'My child knows ABC but cannot read words',
    helper: 'Check whether the gap is letter sounds, blending, or decoding.',
    to: '/blog/child-knows-abc-but-cannot-read',
  },
  {
    id: 'sounds-cannot-blend',
    eyebrow: 'Sounds are known',
    title: 'My child knows letter sounds but still cannot blend',
    helper: 'Move from isolated sounds to smooth blending and unfamiliar-word reading.',
    to: '/blog/why-child-knows-letter-sounds-but-cannot-read-words',
  },
  {
    id: 'start-phonics',
    eyebrow: 'Starting phonics',
    title: 'What is the right age to begin?',
    helper: 'Use readiness signs instead of relying on a birthday alone.',
    to: '/blog/what-age-to-start-phonics',
  },
  {
    id: 'grammar-writing',
    eyebrow: 'Grammar & writing',
    title: 'Help my child build clearer sentences',
    helper: 'Find practical sentence-formation and grammar-application support.',
    to: '/blog/how-to-improve-sentence-formation-in-kids',
  },
  {
    id: 'speaking-confidence',
    eyebrow: 'Speaking confidence',
    title: 'My child understands English but does not speak',
    helper: 'Understand hesitation and build low-pressure speaking confidence.',
    to: '/blog/child-understands-english-but-does-not-speak',
  },
]);

const normalize = (value: unknown): string => String(value ?? '').replace(/\s+/g, ' ').trim().toLowerCase();

export function buildBlogSearchText(post: BlogIndexItem): string {
  const body = Array.isArray(post.body) ? post.body.map((block) => block.content).join(' ') : '';
  const faq = Array.isArray(post.faq)
    ? post.faq.map((item) => `${item.question} ${item.answer}`).join(' ')
    : '';

  return normalize(
    `${post.title} ${post.excerpt} ${post.category} ${post.author} ${post.metaDescription ?? ''} ${body} ${faq}`,
  );
}

export function isPublishedBlogPost(post: BlogIndexItem, todayIso: string): boolean {
  if (!post.date) return true;
  return String(post.date) <= todayIso;
}

export function filterBlogIndexPosts(
  posts: readonly BlogIndexItem[],
  topic: BlogTopic,
  query: string,
): BlogIndexItem[] {
  const normalizedQuery = normalize(query);

  return posts.filter((post) => {
    if (topic !== 'All' && post.category !== topic) return false;
    if (!normalizedQuery) return true;
    return buildBlogSearchText(post).includes(normalizedQuery);
  });
}

export function sortBlogIndexPostsNewest(posts: readonly BlogIndexItem[]): BlogIndexItem[] {
  return [...posts].sort((a, b) => {
    const byDate = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (byDate !== 0) return byDate;
    return a.title.localeCompare(b.title);
  });
}

export function getBlogTopicCounts(posts: readonly BlogIndexItem[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const post of posts) {
    counts.set(post.category, (counts.get(post.category) ?? 0) + 1);
  }
  return counts;
}

export function getAuthorityPosts(posts: readonly BlogIndexItem[], limit = 4): BlogIndexItem[] {
  const bySlug = new Map(posts.map((post) => [post.slug, post]));
  const curated = GSC_AUTHORITY_SLUGS.map((slug) => bySlug.get(slug)).filter(
    (post): post is BlogIndexItem => Boolean(post),
  );

  if (curated.length >= limit) return curated.slice(0, limit);

  const used = new Set(curated.map((post) => post.slug));
  const fallback = sortBlogIndexPostsNewest(posts).filter((post) => !used.has(post.slug));
  return [...curated, ...fallback].slice(0, limit);
}

export function getPublishedCountLabel(count: number): string {
  return `${count} published article${count === 1 ? '' : 's'}`;
}
