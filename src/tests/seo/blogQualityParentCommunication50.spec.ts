import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import { getBlogHeroFamily } from '../../content/blog/shared/heroFamilies';
import { getParentAuthorityPillar } from '../../content/blog/shared/parentAuthorityPillars';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #50 letter-sounds-to-decoding diagnostic quality refresh', () => {
  it('preserves Blog #50 as the diagnostic owner for children who know sounds but cannot blend and decode words independently', () => {
    const post = bySlug.get('why-child-knows-letter-sounds-but-cannot-read-words');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Why Does My Child Know Letter Sounds But Cannot Read Words?');
    expect(post?.category).toBe('Parent Tips');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.audience).toBe('Parent');
    expect(post?.discoveryCategory).toBe('Phonics');
    expect(getBlogHeroFamily(post!)).toBe('blending-early-reading');

    const pillar = getParentAuthorityPillar(post!.slug);
    expect(pillar?.role).toBe('diagnostic-owner');
    expect(pillar?.primaryIntent).toBe(
      'Child knows letter sounds but cannot blend and decode words independently',
    );
    expect(pillar?.changePolicy).toBe('evidence-harden');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('Sound recall → Oral blend → Printed blend → Fresh-word transfer → Connected-text transfer');
    expect(body).toContain('Stage 1 — Sound recall');
    expect(body).toContain('Stage 2 — Oral blend');
    expect(body).toContain('Stage 3 — Printed blend');
    expect(body).toContain('Stage 4 — Fresh-word transfer');
    expect(body).toContain('Stage 5 — Connected-text transfer');
    expect(body).toContain('Six common reasons a child knows sounds but still cannot read words');
    expect(body).toContain('Do not confuse this with the sight-word question');
    expect(body).toContain('A practical home routine: known sounds, easy words, one fresh transfer');
    expect(body).toContain('What progress should look like');
    expect(body).toContain('Older child, same decoding bottleneck: do not assume phonics is only for beginners');
    expect(body).toContain('fresh decodable examples');
    expect(body).toContain('practice resource');

    expect(body).toContain('/blog/child-knows-abc-but-cannot-read');
    expect(body).toContain('/blog/how-kids-learn-blending');
    expect(body).toContain('/blog/phonics-blending-activities');
    expect(body).toContain('/blog/how-to-improve-reading-fluency-in-children');
    expect(body).toContain('/blog/why-child-reads-words-but-does-not-understand-story');
    expect(body).toContain('/blog/sight-words-or-phonics-first');
    expect(body).toContain('/blog/child-reads-in-class-but-forgets-at-home');
    expect(body).toContain('/free-balloon-pop-phonics-game-for-kids');
    expect(body).toContain('/phonics');
    expect(body).toContain('/reading-classes-for-kids');
    expect(body).toContain('/curriculum');
    expect(body).toContain('/book-demo');

    expect(body).not.toContain('guess the whole word from its picture');
    expect(body).not.toContain('every child must complete');
    expect(body).not.toMatch(/(?:must|should|needs? to|has to)\s+(?:read|blend)\s+\d+\s+words/i);
    expect(body).not.toMatch(/(?:90|95|100)%\s+(?:accuracy|mastery|correct)/i);
  });

  it('gives Blog #50 evidence, parent-search FAQs and indexable diagnostic authority status', () => {
    const post = bySlug.get('why-child-knows-letter-sounds-but-cannot-read-words');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(12);
    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /know letter sounds but cannot read words/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /say s, a and t but not read sat/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /teach more letter sounds.*cannot blend/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /decoding or memorising words/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /use pictures to guess/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /get extra help.*knows sounds.*cannot read/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('why-child-knows-letter-sounds-but-cannot-read-words')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('why-child-knows-letter-sounds-but-cannot-read-words')).toBe(true);
  });
});
