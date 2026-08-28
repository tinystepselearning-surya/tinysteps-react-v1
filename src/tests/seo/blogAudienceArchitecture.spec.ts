import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import {
  getBlogAudience,
  getBlogDiscoveryCategory,
  hasReviewedResearchAudience,
  PARENT_RESEARCH_SLUGS,
  SCHOOL_RESEARCH_SLUGS,
} from '../../content/blog/shared/audience';

describe('blog audience architecture', () => {
  it('keeps institutional research out of the default parent lane', () => {
    expect(
      getBlogAudience({
        slug: 'does-cbse-include-phonics-ncf-foundational-literacy',
        category: 'Research',
      }),
    ).toBe('Schools & Research');
  });

  it('keeps parent-facing research discoverable as parent phonics help', () => {
    const post = { slug: 'phonics-for-parents-guide', category: 'Research' as const };
    expect(getBlogAudience(post)).toBe('Parent');
    expect(getBlogDiscoveryCategory(post)).toBe('Phonics');
  });

  it('combines speaking and communication for discovery without rewriting source categories', () => {
    expect(
      getBlogDiscoveryCategory({ slug: 'speaking-example', category: 'Public Speaking' }),
    ).toBe('Speaking & Communication');
    expect(
      getBlogDiscoveryCategory({ slug: 'communication-example', category: 'English Communication' }),
    ).toBe('Speaking & Communication');
  });

  it('requires every normalized Research article to have explicit reviewed audience ownership', () => {
    const researchPosts = blogPosts.filter((post) => post.category === 'Research');
    const unreviewed = researchPosts.filter((post) => !hasReviewedResearchAudience(post));

    expect(unreviewed.map((post) => post.slug)).toEqual([]);
    expect(new Set(researchPosts.map((post) => post.slug))).toEqual(
      new Set([...SCHOOL_RESEARCH_SLUGS, ...PARENT_RESEARCH_SLUGS]),
    );
  });

  it('keeps every reviewed institutional slug attached to a real registry article', () => {
    const registrySlugs = new Set(blogPosts.map((post) => post.slug));
    const missing = [...SCHOOL_RESEARCH_SLUGS].filter((slug) => !registrySlugs.has(slug));

    expect(missing).toEqual([]);
    expect(SCHOOL_RESEARCH_SLUGS.size).toBe(8);
    expect(PARENT_RESEARCH_SLUGS.size).toBe(2);
  });

  it('enriches every normalized article with the expected audience and discovery category', () => {
    for (const post of blogPosts) {
      expect(post.audience, post.slug).toBe(getBlogAudience(post));
      expect(post.discoveryCategory, post.slug).toBe(getBlogDiscoveryCategory(post));
    }
  });

  it('keeps the current discovery lanes internally coherent', () => {
    const schoolPosts = blogPosts.filter((post) => post.audience === 'Schools & Research');
    const parentPosts = blogPosts.filter((post) => post.audience === 'Parent');
    const discoveryCategories = new Set(blogPosts.map((post) => post.discoveryCategory));

    expect(schoolPosts).toHaveLength(SCHOOL_RESEARCH_SLUGS.size);
    expect(parentPosts.length + schoolPosts.length).toBe(blogPosts.length);
    expect(discoveryCategories).toEqual(
      new Set([
        'Phonics',
        'Grammar',
        'Speaking & Communication',
        'Parent Guides',
        'Schools & Research',
      ]),
    );
  });
});
