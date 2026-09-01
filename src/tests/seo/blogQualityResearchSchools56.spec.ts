import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #56 phonics for parents quality refresh', () => {
  it('keeps Blog #56 focused on evidence-led parent support rather than duplicating the start-here phonics explainer', () => {
    const post = bySlug.get('phonics-for-parents-guide');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Phonics for Parents: What It Is, How It Works, and How to Support Reading at Home');
    expect(post?.category).toBe('Research');
    expect(post?.author).toBe('Tiny Steps Research Desk');
    expect(post?.modifiedDate).toBe('2026-09-01');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.excerpt.length).toBeLessThanOrEqual(200);
    expect(post?.audience).toBe('Parent');
    expect(post?.discoveryCategory).toBe('Phonics');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('home practice should reinforce the child’s taught reading system, not compete with it');
    expect(body).toContain('Blog 56 is the parent-support guide');
    expect(body).toContain('hear → map → blend → recognise → spell → read in text');
    expect(body).toContain('Phonemic awareness and phonics are connected, but they are not the same thing');
    expect(body).toContain('The Tiny Steps home-support loop: retrieve → read → spell → reread → transfer');
    expect(body).toContain('When your child gets stuck on a word: prompt the print, not the picture');
    expect(body).toContain('Decodable books and rich read-alouds serve different purposes');
    expect(body).toContain('Home reading should not become a nightly test');
    expect(body).toContain('A better way to correct a decoding error');
    expect(body).toContain('For multilingual families: keep the home language rich while teaching English print consistently');
    expect(body).toContain('How to tell whether phonics is transferring into real reading');
    expect(body).toContain('Common home-practice mistakes parents can avoid');
    expect(body).toContain('Questions parents can ask the school or phonics teacher');
    expect(body).toContain('There is no single evidence-based referral timeline');

    expect(body).toContain('/blog/what-is-phonics-for-kids');
    expect(body).toContain('/blog/what-age-to-start-phonics');
    expect(body).toContain('/blog/why-child-knows-letter-sounds-but-cannot-read-words');
    expect(body).toContain('/blog/how-kids-learn-blending');
    expect(body).toContain('/blog/phonics-activities-for-kids-at-home');
    expect(body).toContain('/blog/are-phonics-apps-enough-for-kids');
    expect(body).toContain('/blog/how-phonics-improves-spelling');
    expect(body).toContain('/blog/sight-words-or-phonics-first');
    expect(body).toContain('/blog/how-long-does-phonics-take');
    expect(body).toContain('/blog/how-to-improve-reading-fluency-in-children');
    expect(body).toContain('/blog/why-child-reads-words-but-does-not-understand-story');
    expect(body).toContain('/free-english-games-for-kids');
    expect(body).toContain('/parents/reading-at-home');
    expect(body).toContain('/reading-classes-for-kids');
    expect(body).toContain('/phonics');
    expect(body).toContain('/book-demo');

    expect(body).not.toContain('10-minute daily routine');
    expect(body).not.toContain('10 minutes a day');
    expect(body).not.toMatch(/(?:90|95|100)%\s+(?:accuracy|mastery|correct)/i);
    expect(body).not.toMatch(/all children (?:should|must) master/i);
  });

  it('gives Blog #56 research evidence, answer-engine FAQs and indexable parent authority status', () => {
    const post = bySlug.get('phonics-for-parents-guide');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(14);
    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /phonics in simple words for parents/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /support phonics at home without confusing/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /use the picture/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /decodable books.*only books/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /how long.*phonics practice.*home/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /extra help.*phonics/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('phonics-for-parents-guide')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('phonics-for-parents-guide')).toBe(true);
  });
});
