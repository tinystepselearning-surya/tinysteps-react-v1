import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('authoritative Blog #26 quality lock', () => {
  it('owns the pre-term parent phonics check without pretending to be a diagnostic or standardized benchmark', () => {
    const post = bySlug.get('phonics-diagnostics');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Phonics Assessment Checklist for Parents Before a New School Term');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('Quick answer: what should a parent check before the new term?');
    expect(body).toContain('This is an informal home check — not a diagnostic test');
    expect(body).toContain('Before you start: choose the child’s teaching scope');
    expect(body).toContain('The Tiny Steps five-part phonics check');
    expect(body).toContain('1. Sound-letter recall');
    expect(body).toContain('2. Oral blending and segmenting');
    expect(body).toContain('3. Fresh-word decoding');
    expect(body).toContain('4. Encoding');
    expect(body).toContain('5. Connected-text transfer');
    expect(body).toContain('Use teaching stage, not age, to choose what to check');
    expect(body).toContain('A simple recording system: Secure, Developing, Priority');
    expect(body).toContain('Tiny Steps editorial observation labels');
    expect(body).toContain('not standardized scores, validated benchmarks, grade expectations or diagnostic categories');
    expect(body).toContain('How to keep the check fair');
    expect(body).toContain('What common error patterns can tell you');
    expect(body).toContain('What to do with the result before the new term');
    expect(body).toContain('When to ask for more support');

    expect(body).toContain('/blog/why-child-knows-letter-sounds-but-cannot-read-words');
    expect(body).toContain('/blog/how-kids-learn-blending');
    expect(body).toContain('/blog/cvc-words-explained-for-parents');
    expect(body).toContain('/blog/child-knows-abc-but-cannot-read');
    expect(body).toContain('/blog/phonics-comprehension');
    expect(body).toContain('/phonics');
    expect(body).toContain('/book-demo');

    expect(body).not.toMatch(/\bWeek\s+22\b/i);
    expect(body).not.toContain('Fifteen to twenty minutes');
    expect(body).not.toContain('Green/Amber/Red');
    expect(body).not.toContain('choose two priorities for the next four weeks');
    expect(body).not.toMatch(/guaranteed? to (?:read|improve|master)/i);
  });

  it('locks evidence, transfer, comprehension boundaries, FAQs and clean-URL authority status', () => {
    const post = bySlug.get('phonics-diagnostics');
    expect(post).toBeDefined();

    const body = post?.body.map((block) => block.content).join('\n') || '';
    const evidence = getBlogEvidenceSummary(post!);

    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(4);
    expect(body).toContain('there is no required home-assessment duration');
    expect(body).toContain('pretend words');
    expect(body).toContain('do not compare a home pseudo-word score with a school screening threshold');
    expect(body).toContain('treat that as a separate context check rather than proof of phonics mastery or a comprehension diagnosis');
    expect(body).toContain('If word reading is accurate but meaning repeatedly breaks down, phonics may no longer be the main bottleneck.');
    expect(body).toContain('This checklist cannot identify a medical, developmental or learning diagnosis.');

    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /assess phonics at home/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /test every phonics sound/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /nonsense or pseudo-words/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /cannot read a fresh word/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /standardized phonics scores/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /dyslexia/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('phonics-diagnostics')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('phonics-diagnostics')).toBe(true);
    expect(shouldNoindexBlogSlug('week-22-phonics-diagnostics')).toBe(true);
    expect(shouldIncludeBlogSlugInSitemap('week-22-phonics-diagnostics')).toBe(false);
  });
});