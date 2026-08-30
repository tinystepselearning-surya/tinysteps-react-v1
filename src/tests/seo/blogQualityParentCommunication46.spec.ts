import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #46 online English classes buyer-guide quality refresh', () => {
  it('makes Blog #46 the parent decision guide for online English classes in India without turning age or class size into a quality score', () => {
    const post = bySlug.get('online-english-classes-for-kids-india');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Online English Classes for Kids in India: A Parent Decision Guide (Ages 3–12)');
    expect(post?.category).toBe('Parent Tips');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.audience).toBe('Parent');
    expect(post?.discoveryCategory).toBe('Parent Guides');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('Need → Match → Interaction → Feedback → Transfer → Fit');
    expect(body).toContain('Step 1 — Need: what can your child not yet do independently?');
    expect(body).toContain('Step 2 — Match: use age as a guide, not automatic placement');
    expect(body).toContain('Ages 3–5: communication, language and early literacy foundations');
    expect(body).toContain('Ages 5–7: oral language, phonics, early reading and sentence writing');
    expect(body).toContain('Ages 7–9: fluency, comprehension, sentence control and broader expression');
    expect(body).toContain('Ages 9–12: reading for meaning, organised writing and independent communication');
    expect(body).toContain('Step 3 — Interaction: what will the child actually do during the live class?');
    expect(body).toContain('1:1 or group online English classes: which is better?');
    expect(body).toContain('Teaching quality and the type of interaction enabled by the format matter more than the label alone');
    expect(body).toContain('Step 4 — Feedback: how does the teacher respond when the child gets something wrong?');
    expect(body).toContain('Step 5 — Transfer: how will progress be demonstrated?');
    expect(body).toContain('What a useful trial or assessment class should reveal');
    expect(body).toContain('Step 6 — Fit: can your family realistically sustain the programme?');
    expect(body).toContain('A parent comparison checklist before paying');
    expect(body).toContain('Red flags when comparing online English programmes');

    expect(body).toContain('/blog/why-child-knows-letter-sounds-but-cannot-read-words');
    expect(body).toContain('/blog/how-to-improve-reading-fluency-in-children');
    expect(body).toContain('/blog/why-child-reads-words-but-does-not-understand-story');
    expect(body).toContain('/blog/how-to-improve-sentence-formation-in-kids');
    expect(body).toContain('/blog/child-knows-grammar-but-makes-mistakes');
    expect(body).toContain('/blog/child-understands-english-but-does-not-speak');
    expect(body).toContain('/blog/child-gives-one-word-answers');
    expect(body).toContain('/phonics');
    expect(body).toContain('/reading-classes-for-kids');
    expect(body).toContain('/grammar');
    expect(body).toContain('/speaking');
    expect(body).toContain('/curriculum');
    expect(body).toContain('/parents/choosing-course');
    expect(body).toContain('/parents/tracking-progress');
    expect(body).toContain('/pricing');
    expect(body).toContain('/book-demo');

    expect(body).not.toContain('One-to-one classes are better');
    expect(body).not.toContain('group classes are better');
    expect(body).not.toContain('age determines the child’s level');
    expect(body).not.toContain('guaranteed fluency');
  });

  it('gives Blog #46 evidence, buyer-intent FAQs and indexable decision-guide authority status', () => {
    const post = bySlug.get('online-english-classes-for-kids-india');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(13);
    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /look for in online English classes for kids in India/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /3- to 5-year-old/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /one-to-one.*better than group/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /start with phonics, grammar, reading or speaking/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /class is actually working/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /trial class tell parents/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('online-english-classes-for-kids-india')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('online-english-classes-for-kids-india')).toBe(true);
  });
});
