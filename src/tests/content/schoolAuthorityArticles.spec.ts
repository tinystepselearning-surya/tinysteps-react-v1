import { describe, expect, it } from 'vitest';

import { blogPosts } from '../../content/blog';

const authoritySlugs = [
  'does-cbse-include-phonics-ncf-foundational-literacy',
  'cbse-phonics-curriculum-vs-systematic-phonics-programme',
  'phonics-scope-and-sequence-for-cbse-schools',
  'international-phonics-benchmarks-for-indian-schools',
  'why-letter-sounds-are-not-enough-to-read',
  'how-schools-can-assess-decoding-not-memorisation',
  'systematic-cumulative-phonics-explained-for-schools',
  'phonics-teacher-training-for-schools-implementation',
];

describe('school authority article SEO contracts', () => {
  it('publishes each authority article with unique metadata and a crawlable schools link', () => {
    const articles = authoritySlugs.map((slug) => blogPosts.find((post) => post.slug === slug));

    expect(articles.every(Boolean)).toBe(true);
    expect(new Set(articles.map((article) => article!.slug)).size).toBe(authoritySlugs.length);
    expect(new Set(articles.map((article) => article!.title)).size).toBe(authoritySlugs.length);

    for (const article of articles) {
      expect(article!.metaDescription?.trim()).toBeTruthy();
      expect(article!.body.some((block) => block.content.includes('](/for-schools)'))).toBe(true);
    }
  });
});
