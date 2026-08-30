import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('parent tips and English communication blog quality refresh', () => {
  it('makes Blog #35 the parent decision owner for phonics apps versus live teacher support', () => {
    const post = bySlug.get('are-phonics-apps-enough-for-kids');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Are Phonics Apps Enough, or Does a Child Still Need a Teacher?');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.audience).toBe('Parent');
    expect(post?.discoveryCategory).toBe('Parent Guides');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('teach → observe → adapt → practise');
    expect(body).toContain('App score versus reading transfer: use the fresh-example test');
    expect(body).toContain('When app-only phonics practice may be reasonable');
    expect(body).toContain('When live teacher support becomes more useful');
    expect(body).toContain('A practical hybrid model: teacher for direction, app for repetition, real reading for transfer');
    expect(body).toContain('We treat these as **practice resources**');
    expect(body).toContain('/blog/how-kids-learn-blending');
    expect(body).toContain('/blog/why-child-knows-letter-sounds-but-cannot-read-words');
    expect(body).toContain('/blog/how-to-choose-phonics-classes');
    expect(body).toContain('/free-balloon-pop-phonics-game-for-kids');
    expect(body).toContain('/letter-tracing-with-sounds-game');
    expect(body).toContain('/phonics');
    expect(body).toContain('/curriculum');

    expect(body).not.toContain('10. FAQ section with 5 parent questions');
    expect(body).not.toContain('Explore phonics pathway: /phonics');
    expect(body).not.toContain('Compare starting routes: /courses');
  });

  it('gives Blog #35 evidence, answer-engine FAQs and indexable authority status', () => {
    const post = bySlug.get('are-phonics-apps-enough-for-kids');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(6);
    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /enough to teach a child to read/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /replace a phonics teacher/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /high scores/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /both a phonics app and a teacher/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('are-phonics-apps-enough-for-kids')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('are-phonics-apps-enough-for-kids')).toBe(true);
  });

  it('makes Blog #36 the realistic parent expectation owner for short English programmes', () => {
    const post = bySlug.get('can-child-improve-english-in-10-days');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Can a Child Really Improve English in 10 Days? What Parents Should Expect');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.audience).toBe('Parent');
    expect(post?.discoveryCategory).toBe('Parent Guides');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('narrow target → active practice → fresh-task transfer → next-step plan');
    expect(body).toContain('The Tiny Steps four-level progress ladder: exposure, supported use, independent transfer, retention');
    expect(body).toContain('The three progress signals parents should track during a short course');
    expect(body).toContain('A practical 10-day English reset — not a 10-day fluency promise');
    expect(body).toContain('Parent scorecard for any 7-day, 10-day or 15-day English programme');
    expect(body).toContain('Red flags in “fast English” marketing');
    expect(body).toContain('How to create a fair before-and-after comparison');
    expect(body).toContain('/blog/child-gives-one-word-answers');
    expect(body).toContain('/blog/child-knows-grammar-but-makes-mistakes');
    expect(body).toContain('/blog/how-to-improve-reading-fluency-in-children');
    expect(body).toContain('/blog/how-phonics-grammar-and-communication-work-together');
    expect(body).toContain('/phonics');
    expect(body).toContain('/grammar');
    expect(body).toContain('/speaking');
    expect(body).toContain('/reading-classes-for-kids');
    expect(body).toContain('/curriculum');
    expect(body).toContain('/book-demo');

    expect(body).not.toContain('mastering English in 10 days');
    expect(body).not.toContain('Tiny Steps approach');
    expect(body).not.toContain('Families can explore /phonics');
  });

  it('gives Blog #36 evidence, answer-engine FAQs and indexable authority status', () => {
    const post = bySlug.get('can-child-improve-english-in-10-days');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(6);
    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /really improve English in 10 days/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /fluent in English in 10 days/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /realistic progress/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /measure progress/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /after a 10-day English programme/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('can-child-improve-english-in-10-days')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('can-child-improve-english-in-10-days')).toBe(true);
  });

  it('makes Blog #37 the protected response-expansion owner for children who answer too briefly', () => {
    const post = bySlug.get('child-gives-one-word-answers');
    expect(post).toBeDefined();
    expect(post?.title).toBe('My Child Gives Only One-Word Answers — How Can I Help Them Speak in Full Sentences?');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.audience).toBe('Parent');
    expect(post?.discoveryCategory).toBe('Speaking & Communication');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('complete sentence → useful detail → reason / example / sequence');
    expect(body).toContain('The Tiny Steps six-question cause map for one-word answers');
    expect(body).toContain('Step 1 — complete sentence');
    expect(body).toContain('Step 2 — one useful detail');
    expect(body).toContain('Step 3 — connected thinking');
    expect(body).toContain('Use the smallest prompt that works — then fade it');
    expect(body).toContain('For multilingual children: compare languages before drawing conclusions');
    expect(body).toContain('How to measure progress without counting words alone');
    expect(body).toContain('Natural conversation includes short answers');
    expect(body).toContain('multilingualism is not a communication disorder');
    expect(body).toContain('/blog/child-understands-english-but-does-not-speak');
    expect(body).toContain('/blog/speaking-confidence-seeds');
    expect(body).toContain('/blog/how-to-improve-sentence-formation-in-kids');
    expect(body).toContain('/blog/child-knows-grammar-but-makes-mistakes');
    expect(body).toContain('/blog/how-phonics-grammar-and-communication-work-together');
    expect(body).toContain('/speaking');
    expect(body).toContain('/grammar');
    expect(body).toContain('/curriculum');
    expect(body).toContain('/book-demo');

    expect(body).not.toContain('/blog/week-12-speaking-confidence-seeds');
    expect(body).not.toContain('/blog/week-13-speaking-structure');
    expect(body).not.toContain('10-minute daily speaking routine');
  });

  it('gives Blog #37 evidence, multilingual safeguards, answer-engine FAQs and indexable authority status', () => {
    const post = bySlug.get('child-gives-one-word-answers');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(8);
    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /answer every question with one word/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /full sentence every time/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /turn a one-word answer/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /sentence starters/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /home language/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /seek extra help/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('child-gives-one-word-answers')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('child-gives-one-word-answers')).toBe(true);
  });
});
