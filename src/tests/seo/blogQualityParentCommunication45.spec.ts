import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #45 school reopening English readiness quality refresh', () => {
  it('makes Blog #45 the parent checklist owner for reading, writing and speaking readiness before school restarts', () => {
    const post = bySlug.get('june-school-reopening-english-readiness-plan');
    expect(post).toBeDefined();
    expect(post?.title).toBe('School Reopening English Readiness Checklist for Kids: Reading, Writing and Speaking');
    expect(post?.category).toBe('Parent Tips');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.audience).toBe('Parent');
    expect(post?.discoveryCategory).toBe('Parent Guides');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('Check → Compare → Warm up → Transfer → Prioritise');
    expect(body).toContain('Reading readiness checklist: accuracy, flow and meaning');
    expect(body).toContain('Writing readiness checklist: idea, sentence, transcription and transfer');
    expect(body).toContain('Speaking readiness checklist: understand, respond, expand and participate');
    expect(body).toContain('Use three readiness labels instead of a pass/fail score');
    expect(body).toContain('Ready to use');
    expect(body).toContain('Needs a warm-up');
    expect(body).toContain('Needs closer review');
    expect(body).toContain('A practical school-reopening check you can do at home');
    expect(body).toContain('Do not use the school reopening checklist as a holiday exam');
    expect(body).toContain('For multilingual children, check the learning task without judging overall language ability from English alone');
    expect(body).toContain('This article owns the **reopening checklist**, not every underlying diagnosis');

    expect(body).toContain('/blog/why-child-knows-letter-sounds-but-cannot-read-words');
    expect(body).toContain('/blog/how-to-improve-reading-fluency-in-children');
    expect(body).toContain('/blog/why-child-reads-words-but-does-not-understand-story');
    expect(body).toContain('/blog/how-to-improve-sentence-formation-in-kids');
    expect(body).toContain('/blog/child-knows-grammar-but-makes-mistakes');
    expect(body).toContain('/blog/child-understands-english-but-does-not-speak');
    expect(body).toContain('/blog/child-gives-one-word-answers');
    expect(body).toContain('/blog/how-to-engage-kids-in-english-learning-at-home');
    expect(body).toContain('/blog/how-phonics-grammar-and-communication-work-together');
    expect(body).toContain('/phonics');
    expect(body).toContain('/reading-classes-for-kids');
    expect(body).toContain('/grammar');
    expect(body).toContain('/speaking');
    expect(body).toContain('/curriculum');
    expect(body).toContain('/book-demo');

    expect(body).not.toContain('14-Day English Refreshment Plan');
    expect(body).not.toContain('10-14 days of focused revision is enough');
    expect(body).not.toContain('Start a 2-week refreshment route: /courses');
    expect(body).not.toContain('June Readiness Support');
    expect(body).not.toContain('8. FAQ section with 5 parent questions');
  });

  it('gives Blog #45 evidence, realistic readiness FAQs and indexable parent-guide status', () => {
    const post = bySlug.get('june-school-reopening-english-readiness-plan');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(12);
    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /English readiness before school reopens/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /how many days.*revise/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /revise all phonics and grammar/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /reading is ready for school/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /what writing.*practise/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /understands English but is quiet/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('june-school-reopening-english-readiness-plan')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('june-school-reopening-english-readiness-plan')).toBe(true);
  });
});
