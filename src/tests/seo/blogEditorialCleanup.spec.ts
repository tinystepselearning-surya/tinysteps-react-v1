import { describe, expect, it } from 'vitest';
import { applyBlogEditorialCleanup, cleanBlogBlock, cleanBlogTitle } from '../../content/blog/shared/editorialCleanup';

describe('blog editorial cleanup', () => {
  it('removes Week N from primary titles while preserving the useful topic', () => {
    expect(cleanBlogTitle('Week 10: Subject-Verb Agreement Rescue Plan')).toBe('Subject-Verb Agreement Rescue Plan');
    expect(cleanBlogTitle('How to Improve Reading Fluency in Children')).toBe('How to Improve Reading Fluency in Children');
  });

  it('replaces exposed template headings with reader-facing copy', () => {
    expect(cleanBlogBlock({ type: 'h2', content: 'FAQ section with 5 parent questions' }).content)
      .toBe('Frequently Asked Questions');
  });

  it('removes raw internal route syntax from visible copy', () => {
    expect(cleanBlogBlock({ type: 'li', content: 'Explore grammar support: /grammar' }).content)
      .toBe('Explore grammar support.');
    expect(cleanBlogBlock({ type: 'li', content: '/?book=1' }).content)
      .toContain('Book a free Tiny Steps assessment');
  });

  it('does not mutate the source object', () => {
    const post = {
      slug: 'week-10-grammar-subject-verb',
      title: 'Week 10: Subject-Verb Agreement Rescue Plan',
      category: 'Grammar' as const,
      author: 'Priya',
      date: '2026-01-29',
      readTime: '9 min',
      excerpt: 'Example excerpt',
      body: [{ type: 'h2' as const, content: 'FAQ section with 5 parent questions' }],
    };
    const cleaned = applyBlogEditorialCleanup(post);
    expect(cleaned.title).toBe('Subject-Verb Agreement Rescue Plan');
    expect(post.title).toContain('Week 10');
  });
});
