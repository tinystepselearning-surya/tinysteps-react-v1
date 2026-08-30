import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogHeroFamily } from '../../content/blog/shared/heroFamilies';
import { getParentAuthorityPillar } from '../../content/blog/shared/parentAuthorityPillars';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));
const slug = 'how-to-improve-reading-fluency-in-children';

describe('Blog #43 reading fluency quality refresh', () => {
  it('keeps Blog #43 as the fluency pillar and separates fluency from decoding, speed and comprehension', () => {
    const post = bySlug.get(slug);
    expect(post).toBeDefined();
    expect(post?.title).toBe('How to Improve Reading Fluency in Children: Accuracy, Phrasing and Meaning');
    expect(post?.category).toBe('Parent Tips');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.audience).toBe('Parent');
    expect(post?.discoveryCategory).toBe('Parent Guides');
    expect(getBlogHeroFamily(post!)).toBe('reading-fluency');

    const pillar = getParentAuthorityPillar(slug);
    expect(pillar?.role).toBe('fluency-pillar');
    expect(pillar?.changePolicy).toBe('evidence-harden');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('Accurate decoding → Easier word recognition → Meaningful phrasing → Comprehension → Fresh-text transfer');
    expect(body).toContain('The Tiny Steps five-stage reading-fluency check');
    expect(body).toContain('Stage 1 — Accurate decoding');
    expect(body).toContain('Stage 2 — Easier word recognition');
    expect(body).toContain('Stage 3 — Meaningful phrasing');
    expect(body).toContain('Stage 4 — Comprehension');
    expect(body).toContain('Stage 5 — Fresh-text transfer');
    expect(body).toContain('Should parents time reading?');
    expect(body).toContain('Six fluency profiles — and the next step for each');
    expect(body).toContain('A short home fluency routine: Read → Notice → Model → Reread → Mean → Transfer');
    expect(body).toContain('How fluency practice changes for older children');
    expect(body).toContain('timed readings can be overused');

    expect(body).toContain('/blog/why-child-knows-letter-sounds-but-cannot-read-words');
    expect(body).toContain('/blog/how-kids-learn-blending');
    expect(body).toContain('/blog/why-child-reads-words-but-does-not-understand-story');
    expect(body).toContain('/blog/child-reads-in-class-but-forgets-at-home');
    expect(body).toContain('/blog/how-phonics-grammar-and-communication-work-together');
    expect(body).toContain('/reading-classes-for-kids');
    expect(body).toContain('/phonics');
    expect(body).toContain('/curriculum');
    expect(body).toContain('/book-demo');

    expect(body).not.toContain('Research sources and what they support');
    expect(body).not.toContain('A five-part fluency framework for parents');
    expect(body).not.toContain('A stopwatch can be one assessment tool');
  });

  it('gives Blog #43 current fluency evidence, AEO FAQs and indexable authority status', () => {
    const post = bySlug.get(slug);
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(9);
    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /improve my child’s reading fluency at home/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /read faster to improve fluency/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /repeated reading improve reading fluency/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /difference between decoding and reading fluency/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /time my child’s reading at home/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /reads fluently but does not understand/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug(slug)).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap(slug)).toBe(true);
  });
});
