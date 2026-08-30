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
});
