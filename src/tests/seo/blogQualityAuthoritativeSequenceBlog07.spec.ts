import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('authoritative Blog #7 quality lock', () => {
  it('owns reading-confidence behaviour without promising that phonics directly creates confidence', () => {
    const post = bySlug.get('how-phonics-builds-reading-confidence');
    expect(post).toBeDefined();
    expect(post?.title).toBe('How Phonics Builds Reading Confidence: What Changes First at Home');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('phonics can support reading confidence, but confidence is not a phonics skill');
    expect(body).toContain('Reading competence and reading confidence are related—but they are not the same thing');
    expect(body).toContain('What may change first at home? Five useful confidence signals');
    expect(body).toContain('1. Starting — does the child begin with less avoidance?');
    expect(body).toContain('2. Strategy use — does the child know what to try when a word is unfamiliar?');
    expect(body).toContain('3. Retry — can the child recover after an error?');
    expect(body).toContain('4. Independence — is adult rescue decreasing?');
    expect(body).toContain('5. Transfer — does the behaviour hold on a fresh word or short text?');
    expect(body).toContain('What parents should not use as proof of confidence');
    expect(body).toContain('Read-aloud joy and independent decoding should both stay in the child’s reading life');

    expect(body).toContain('/blog/benefits-of-phonics-for-kids');
    expect(body).toContain('/blog/how-kids-learn-blending');
    expect(body).toContain('/blog/how-long-does-phonics-take');
    expect(body).toContain('/blog/how-phonics-classes-help-kids-read');
    expect(body).toContain('/blog/how-to-choose-phonics-classes');
    expect(body).toContain('/blog/how-to-improve-reading-fluency-in-children');
    expect(body).toContain('/phonics');

    expect(body).not.toMatch(/85\s*[-–]\s*90%/i);
    expect(body).not.toMatch(/daily 10-minute confidence loop/i);
    expect(body).not.toMatch(/confidence rises when children/i);
    expect(body).not.toContain('Book Free 35-Minute Demo');
    expect(body).not.toContain('Aim for 10 minutes a day, 5–6 days a week');
  });

  it('adds evidence, causal boundaries, non-diagnostic language and five extractable FAQs', () => {
    const post = bySlug.get('how-phonics-builds-reading-confidence');
    expect(post).toBeDefined();

    const body = post?.body.map((block) => block.content).join('\n') || '';
    const evidence = getBlogEvidenceSummary(post!);

    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(4);
    expect(body).toContain('does not directly “teach confidence”');
    expect(body).toContain('not a standardized confidence scale or diagnostic test');
    expect(body).toContain('it does not diagnose dyslexia, anxiety or another condition');
    expect(body).toContain('not a standardized psychological confidence scale');
    expect(body).toContain('no universal research-defined home session length');

    expect(post?.faq).toHaveLength(5);
    expect(post?.faq?.some((item) => /make my child a more confident reader/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /what changes first/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /read accurately but still lacks confidence/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /praise every correct word/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /when should I get extra help/i.test(item.question))).toBe(true);
  });
});
