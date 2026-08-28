import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogHeroFamily } from '../../content/blog/shared/heroFamilies';
import { resolveBlogAuthor } from '../../content/blog/shared/editorialTrust';

const repoRoot = process.cwd();
const readRepoFile = (relativePath: string) =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const B6_AUTHORITY_SLUGS = [
  'satpin-phonics-guide',
  'phonics-for-parents-guide',
  'why-child-knows-letter-sounds-but-cannot-read-words',
  'child-knows-abc-but-cannot-read',
  'how-kids-learn-blending',
  'phonics-blending-activities',
  'how-to-improve-reading-fluency-in-children',
] as const;

const B8_ENRICHED_SLUGS = [
  'satpin-phonics-guide',
  'phonics-for-parents-guide',
  'how-to-improve-sentence-formation-in-kids',
  'child-knows-grammar-but-makes-mistakes',
  'child-understands-english-but-does-not-speak',
  'child-gives-one-word-answers',
] as const;

describe('B8 first-party knowledge guardrails', () => {
  it('keeps the post-B3 inventory stable and does not restore the retired reading-confidence URL', () => {
    expect(blogPosts).toHaveLength(76);

    const slugs = new Set(blogPosts.map((post) => post.slug));
    expect(slugs.has('how-tiny-steps-builds-reading-confidence')).toBe(false);

    for (const slug of B6_AUTHORITY_SLUGS) {
      expect(slugs.has(slug), `${slug} should remain in the live registry`).toBe(true);
    }
  });

  it('preserves the protected B6 intent distinctions as separate live articles', () => {
    const slugs = new Set(blogPosts.map((post) => post.slug));

    expect(slugs.has('child-knows-abc-but-cannot-read')).toBe(true);
    expect(slugs.has('why-child-knows-letter-sounds-but-cannot-read-words')).toBe(true);
    expect(slugs.has('how-kids-learn-blending')).toBe(true);
    expect(slugs.has('phonics-blending-activities')).toBe(true);
  });

  it('preserves the hero-family ownership for B6 authority pages', () => {
    const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

    expect(getBlogHeroFamily(bySlug.get('satpin-phonics-guide')!)).toBe('satpin-letter-sounds');
    expect(getBlogHeroFamily(bySlug.get('child-knows-abc-but-cannot-read')!)).toBe('blending-early-reading');
    expect(getBlogHeroFamily(bySlug.get('why-child-knows-letter-sounds-but-cannot-read-words')!)).toBe('blending-early-reading');
    expect(getBlogHeroFamily(bySlug.get('how-kids-learn-blending')!)).toBe('blending-early-reading');
    expect(getBlogHeroFamily(bySlug.get('phonics-blending-activities')!)).toBe('blending-early-reading');
    expect(getBlogHeroFamily(bySlug.get('how-to-improve-reading-fluency-in-children')!)).toBe('reading-fluency');
  });

  it('keeps B7 authorship responsibility stable on the six B8-enriched posts', () => {
    const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

    for (const slug of B8_ENRICHED_SLUGS) {
      const post = bySlug.get(slug);
      expect(post, `${slug} should remain in the registry`).toBeTruthy();
      const author = resolveBlogAuthor(post!.author, post!.category);
      expect(['founder', 'academic-team', 'research-desk']).toContain(author.key);
      expect(author.profilePath).toBe('/team');
    }

    expect(resolveBlogAuthor(bySlug.get('phonics-for-parents-guide')!.author, 'Research').key).toBe(
      'research-desk',
    );
  });

  it('does not introduce B8 URL, indexing, sitemap, RSS or hero-architecture changes', () => {
    const audit = readRepoFile('docs/seo/blog-bricks/B08_FIRST_PARTY_KNOWLEDGE_AUDIT.md');
    const heroFamilies = readRepoFile('src/content/blog/shared/heroFamilies.ts');

    expect(audit).toContain('Live blog records audited: **76**');
    expect(heroFamilies).toContain("'satpin-phonics-guide': 'satpin-letter-sounds'");
    expect(heroFamilies).toContain("'phonics-blending-activities': 'blending-early-reading'");
    expect(heroFamilies).toContain("'how-to-improve-reading-fluency-in-children': 'reading-fluency'");

    for (const slug of B8_ENRICHED_SLUGS) {
      const post = blogPosts.find((item) => item.slug === slug)!;
      expect(post.slug).toBe(slug);
    }
  });
});
