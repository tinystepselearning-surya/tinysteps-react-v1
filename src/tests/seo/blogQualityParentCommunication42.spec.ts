import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #42 home English engagement quality refresh', () => {
  it('makes Blog #42 the parent owner for engaging home English practice without replacing skill-specific diagnostics', () => {
    const post = bySlug.get('how-to-engage-kids-in-english-learning-at-home');
    expect(post).toBeDefined();
    expect(post?.title).toBe('How to Keep Kids Engaged in English Practice at Home: Phonics, Grammar and Speaking');
    expect(post?.category).toBe('Parent Tips');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.audience).toBe('Parent');
    expect(post?.discoveryCategory).toBe('Parent Guides');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('Match → Focus → Choose → Practise → Transfer → Stop');
    expect(body).toContain('The Tiny Steps home-practice loop: Match → Focus → Choose → Practise → Transfer → Stop');
    expect(body).toContain('First separate “not engaged” from “the task is mismatched”');
    expect(body).toContain('A short repeatable routine — without turning the clock into the goal');
    expect(body).toContain('Phonics practice: keep the game connected to decoding');
    expect(body).toContain('Grammar practice: make one structure useful');
    expect(body).toContain('Speaking practice: make the child the communicator, not the performer');
    expect(body).toContain('Track engagement and learning as two separate signals');
    expect(body).toContain('When home practice should hand the problem back to the teacher');
    expect(body).toContain('practice resources');

    expect(body).toContain('/blog/how-phonics-grammar-and-communication-work-together');
    expect(body).toContain('/blog/why-child-knows-letter-sounds-but-cannot-read-words');
    expect(body).toContain('/blog/how-kids-learn-blending');
    expect(body).toContain('/blog/child-knows-grammar-but-makes-mistakes');
    expect(body).toContain('/blog/how-to-improve-sentence-formation-in-kids');
    expect(body).toContain('/blog/child-gives-one-word-answers');
    expect(body).toContain('/blog/child-understands-english-but-does-not-speak');
    expect(body).toContain('/blog/how-to-improve-reading-fluency-in-children');
    expect(body).toContain('/blog/why-child-reads-words-but-does-not-understand-story');
    expect(body).toContain('/free-english-games-for-kids');
    expect(body).toContain('/free-balloon-pop-phonics-game-for-kids');
    expect(body).toContain('/letter-tracing-with-sounds-game');
    expect(body).toContain('/phonics');
    expect(body).toContain('/reading-classes-for-kids');
    expect(body).toContain('/grammar');
    expect(body).toContain('/speaking');
    expect(body).toContain('/curriculum');
    expect(body).toContain('/book-demo');

    expect(body).not.toContain('Tiny Steps resources and pathways');
    expect(body).not.toContain('Families can use /free-english-games-for-kids');
    expect(body).not.toContain('How to Engage Kids in Phonics, Grammar and Communication Practice at Home');
  });

  it('gives Blog #42 evidence, answer-engine FAQs and indexable parent-guide authority status', () => {
    const post = bySlug.get('how-to-engage-kids-in-english-learning-at-home');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(10);
    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /keep my child engaged in English practice at home/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /how long should English practice at home/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /phonics practice fun/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /grammar activities.*at home/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /practise speaking English at home/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /refuses English practice every day/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('how-to-engage-kids-in-english-learning-at-home')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('how-to-engage-kids-in-english-learning-at-home')).toBe(true);
  });
});
