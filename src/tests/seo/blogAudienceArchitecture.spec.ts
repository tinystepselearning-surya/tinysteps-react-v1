import { describe, expect, it } from 'vitest';
import {
  getBlogAudience,
  getBlogDiscoveryCategory,
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

  it('uses an explicit reviewed institutional set', () => {
    expect(SCHOOL_RESEARCH_SLUGS.size).toBe(8);
    expect(SCHOOL_RESEARCH_SLUGS.has('phonics-for-parents-guide')).toBe(false);
    expect(SCHOOL_RESEARCH_SLUGS.has('science-of-phonics-learning')).toBe(false);
  });
});
