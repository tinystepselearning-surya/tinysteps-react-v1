import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('authoritative Blog #10 quality lock', () => {
  it('owns the parent phonics-class comparison framework without becoming a generic sales page', () => {
    const post = bySlug.get('how-to-choose-phonics-classes');
    expect(post).toBeDefined();
    expect(post?.title).toBe('How to Choose a Phonics Class: The Complete Parent Comparison Framework');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('Quick answer: compare four things before choosing a phonics class');
    expect(body).toContain('fit → teaching quality → proof of transfer → practical clarity');
    expect(body).toContain('Gate 1 — Fit: does the class start from the child’s actual reading stage?');
    expect(body).toContain('Gate 2 — Teaching quality: what should happen inside the lessons?');
    expect(body).toContain('Gate 3 — Proof: can the provider show transfer rather than activity completion?');
    expect(body).toContain('Gate 4 — Practical clarity: understand what you are actually buying');
    expect(body).toContain('The Tiny Steps 16-point parent comparison scorecard');
    expect(body).toContain('Questions to ask during a trial or assessment');
    expect(body).toContain('Red flags that deserve caution');
    expect(body).toContain('How to validate the choice after enrolment');

    expect(body).toContain('/blog/child-knows-abc-but-cannot-read');
    expect(body).toContain('/blog/how-kids-learn-blending');
    expect(body).toContain('/blog/how-phonics-improves-spelling');
    expect(body).toContain('/blog/how-phonics-classes-help-kids-read');
    expect(body).toContain('/blog/how-long-does-phonics-take');
    expect(body).toContain('/blog/online-phonics-classes-vs-school');
    expect(body).toContain('/phonics');
    expect(body).toContain('/curriculum');
    expect(body).toContain('/pricing');
    expect(body).toContain('/book-demo');

    expect(body).not.toMatch(/read fluently in \d+ (?:days|weeks|months)/i);
    expect(body).not.toMatch(/guaranteed? to read/i);
    expect(body).not.toContain('The delivery mode matters less than instructional quality');
    expect(body).not.toContain('Jolly Phonics is one programme');
    expect(body).not.toContain('regular free 35-minute 1:1 demo assessment class');
  });

  it('adds evidence, fair provider boundaries and extractable decision FAQs', () => {
    const post = bySlug.get('how-to-choose-phonics-classes');
    expect(post).toBeDefined();

    const body = post?.body.map((block) => block.content).join('\n') || '';
    const evidence = getBlogEvidenceSummary(post!);

    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(5);
    expect(body).toContain('not a standardized rating instrument');
    expect(body).toContain('not standardized provider accreditation tools');
    expect(body).toContain('Tiny Steps should be judged by the same framework');
    expect(body).toContain('Do not infer teaching quality from class size alone');
    expect(body).toContain('Pricing should be compared on the same basis');
    expect(body).toContain('Phonics alone is not a complete answer');

    expect(post?.faq).toHaveLength(5);
    expect(post?.faq?.some((item) => /what should I look for in a phonics class/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /1:1 phonics better than a group/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /class is actually working/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /worksheets and phonics apps enough/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /biggest red flag/i.test(item.question))).toBe(true);
  });
});
