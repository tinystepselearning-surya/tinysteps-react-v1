import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('progressive blog quality refresh', () => {
  it('keeps Blog #1 as the practical SATPIN-at-home implementation owner', () => {
    const post = bySlug.get('phonics-satpin-launch');
    expect(post).toBeDefined();
    expect(post?.title).toBe('SATPIN at Home: A Parent Launch Plan for Early Blending and Reading');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('/blog/satpin-phonics-guide');
    expect(body).toContain('/blog/how-kids-learn-blending');
    expect(body).toContain('/blog/cvc-words-explained-for-parents');
    expect(body).toContain('/free-balloon-pop-phonics-game-for-kids?level=1');
    expect(body).toContain('/letter-tracing-with-sounds-game');
    expect(body).toContain('seven flexible practice sessions');
    expect(body).toContain('Tiny Steps readiness checkpoints');
    expect(body).toContain('Who this SATPIN plan is for');
    expect(body).toContain('not a diagnostic test');
    expect(body).toContain('When home practice is not enough');

    expect(body).not.toMatch(/\bWeek\s+[12]\b/i);
    expect(body).not.toContain('Tin can');
    expect(body).not.toContain('Tan pan');
    expect(body).not.toContain('Nap in pan');
    expect(body).not.toMatch(/research-backed/i);
  });

  it('gives Blog #1 a real evidence layer and answer-engine FAQ', () => {
    const post = bySlug.get('phonics-satpin-launch');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(4);
    expect(post?.faq).toHaveLength(5);
    expect(post?.faq?.some((item) => /How long should SATPIN take/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /cannot read words/i.test(item.question))).toBe(true);
  });

  it('makes Blog #2 a stage-matched summer reading maintenance owner', () => {
    const post = bySlug.get('prevent-summer-slide-reading');
    expect(post).toBeDefined();
    expect(post?.title).toBe('How to Prevent the Summer Slide in Reading (10-Minute Daily Plan)');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('Stage A — pre-reader or very early phonics learner');
    expect(body).toContain('Stage B — developing decoder');
    expect(body).toContain('Stage C — increasingly fluent reader');
    expect(body).toContain('Tiny Steps three-signal summer check');
    expect(body).toContain('When home practice is not enough');
    expect(body).toContain('/blog/how-to-improve-reading-fluency-in-children');
    expect(body).toContain('/blog/why-child-reads-words-but-does-not-understand-story');
    expect(body).toContain('/parents/reading-at-home');
    expect(body).toContain('/summer-camps');

    expect(body).not.toContain('Summer slide in reading is preventable');
    expect(body).not.toContain('usually enough to maintain or improve');
    expect(body).not.toContain('Tiny Steps CTA:');
  });

  it('gives Blog #2 evidence, answer-engine FAQs and indexable authority status', () => {
    const post = bySlug.get('prevent-summer-slide-reading');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(3);
    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /guaranteed/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /10 minutes/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /phonics practice/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('prevent-summer-slide-reading')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('prevent-summer-slide-reading')).toBe(true);
    expect(shouldNoindexBlogSlug('week-27-prevent-summer-slide-reading')).toBe(true);
    expect(shouldIncludeBlogSlugInSitemap('week-27-prevent-summer-slide-reading')).toBe(false);
  });

  it('makes Blog #3 an informal phonics assessment owner with a clear diagnostic boundary', () => {
    const post = bySlug.get('phonics-diagnostics');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Phonics Assessment Checklist for Parents Before a New School Term');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('This is an informal home check — not a diagnostic test');
    expect(body).toContain('The Tiny Steps five-part phonics check');
    expect(body).toContain('Fresh-word decoding');
    expect(body).toContain('Encoding: can the child hear the sounds and spell a simple word?');
    expect(body).toContain('Connected-text transfer');
    expect(body).toContain('Use teaching stage, not age, to choose what to check');
    expect(body).toContain('Secure, Developing, Priority');
    expect(body).toContain('not standardized scores, validated benchmarks');
    expect(body).toContain('/blog/phonics-comprehension');
    expect(body).toContain('When to ask for more support');
    expect(body).toContain('/blog/why-child-knows-letter-sounds-but-cannot-read-words');
    expect(body).toContain('/blog/how-kids-learn-blending');
    expect(body).toContain('/blog/cvc-words-explained-for-parents');
    expect(body).toContain('/book-demo');

    expect(body).not.toMatch(/\bWeek\s+22\b/i);
    expect(body).not.toContain('Green/Amber/Red');
    expect(body).not.toContain('choose two priorities for the next four weeks');
    expect(body).not.toContain('Fifteen to twenty minutes');
  });

  it('gives Blog #3 evidence, answer-engine FAQs and indexable authority status', () => {
    const post = bySlug.get('phonics-diagnostics');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(4);
    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /assess phonics at home/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /nonsense or pseudo-words/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /standardized phonics scores/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /dyslexia/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('phonics-diagnostics')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('phonics-diagnostics')).toBe(true);
    expect(shouldNoindexBlogSlug('week-22-phonics-diagnostics')).toBe(true);
    expect(shouldIncludeBlogSlugInSitemap('week-22-phonics-diagnostics')).toBe(false);
  });

  it('makes Blog #4 the parent multisyllabic decoding and chunking-practice owner', () => {
    const post = bySlug.get('phonics-multisyllabic');
    expect(post).toBeDefined();
    expect(post?.title).toBe('How to Help Kids Read Multisyllabic Words: Simple Chunking Practice');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('First check: is the child ready for multisyllabic word practice?');
    expect(body).toContain('Syllables and morphemes: two useful ways to see a big word');
    expect(body).toContain('The Tiny Steps five-step long-word routine');
    expect(body).toContain('Stage A — two-part words built mostly from secure patterns');
    expect(body).toContain('Stage B — add familiar endings and meaningful word parts');
    expect(body).toContain('Stage C — three or more syllables and more complex morphology');
    expect(body).toContain('The Tiny Steps four-signal progress check');
    expect(body).toContain('When to step back or ask for more support');
    expect(body).toContain('/blog/how-kids-learn-blending');
    expect(body).toContain('/blog/cvc-words-explained-for-parents');
    expect(body).toContain('/blog/long-vowel-sounds-for-kids');
    expect(body).toContain('/blog/how-phonics-improves-spelling');

    expect(body).not.toMatch(/\bWeek\s+19\b/i);
    expect(body).not.toContain('underline all vowels first');
    expect(body).not.toContain('12 minutes/day');
    expect(body).not.toContain('read race');
  });

  it('gives Blog #4 evidence, answer-engine FAQs and indexable authority status', () => {
    const post = bySlug.get('phonics-multisyllabic');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(4);
    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /multisyllabic word/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /underline every vowel/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /clapping syllables/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /one correct way to split/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('phonics-multisyllabic')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('phonics-multisyllabic')).toBe(true);
    expect(shouldNoindexBlogSlug('week-19-phonics-multisyllabic')).toBe(true);
    expect(shouldIncludeBlogSlugInSitemap('week-19-phonics-multisyllabic')).toBe(false);
  });
});