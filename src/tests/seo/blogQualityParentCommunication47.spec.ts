import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #47 sight words vs phonics quality refresh', () => {
  it('makes Blog #47 the parent decision owner for phonics-first word reading with exception words taught alongside', () => {
    const post = bySlug.get('sight-words-or-phonics-first');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Should Children Memorize Sight Words or Learn Phonics First?');
    expect(post?.category).toBe('Parent Tips');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.audience).toBe('Parent');
    expect(post?.discoveryCategory).toBe('Phonics');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('Decode what you can → Notice the unusual part → Read it in context → Revisit until automatic');
    expect(body).toContain('First fix the terminology: sight words, high-frequency words and tricky words are not the same thing');
    expect(body).toContain('Sight word: a word the reader recognises automatically');
    expect(body).toContain('High-frequency word: a word that appears often in print');
    expect(body).toContain('Common exception or tricky word: a word that contains an unusual or not-yet-taught correspondence');
    expect(body).toContain('Why phonics should come first as the main strategy');
    expect(body).toContain('Why memorising large whole-word lists can create the wrong reading habit');
    expect(body).toContain('What to do with regular high-frequency words');
    expect(body).toContain('What to do with tricky or irregular words');
    expect(body).toContain('The Tiny Steps four-step word-learning check');
    expect(body).toContain('Step 1 — Decode what you can');
    expect(body).toContain('Step 2 — Notice the unusual part');
    expect(body).toContain('Step 3 — Read it in context');
    expect(body).toContain('Step 4 — Revisit until automatic');
    expect(body).toContain('A practical beginner sequence: phonics first, exception words alongside');
    expect(body).toContain('What if school sends home a sight-word list?');
    expect(body).toContain('How to tell whether a child is memorising or actually reading');
    expect(body).toContain('How sight-word learning connects to fluency');

    expect(body).toContain('/blog/why-child-knows-letter-sounds-but-cannot-read-words');
    expect(body).toContain('/blog/how-to-improve-reading-fluency-in-children');
    expect(body).toContain('/blog/why-child-reads-words-but-does-not-understand-story');
    expect(body).toContain('/blog/phonics-for-parents-guide');
    expect(body).toContain('/blog/how-kids-learn-blending');
    expect(body).toContain('/blog/digraphs-and-tricky-words');
    expect(body).toContain('/phonics');
    expect(body).toContain('/curriculum');
    expect(body).toContain('/book-demo');

    expect(body).not.toContain('Explore phonics pathway: /phonics');
    expect(body).not.toContain('Compare starting routes: /courses');
    expect(body).not.toContain('11. FAQ section with 5 parent questions');
    expect(body).not.toContain('memorize hundreds of sight words first');
  });

  it('gives Blog #47 evidence, terminology safeguards, answer-engine FAQs and indexable authority status', () => {
    const post = bySlug.get('sight-words-or-phonics-first');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(11);
    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /memorize sight words or learn phonics first/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /sight words the same as high-frequency words/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /teach tricky words without encouraging memorization/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /flashcards bad.*sight words/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /sight-word cards but not unfamiliar words/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /phonics classes include tricky or sight words/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('sight-words-or-phonics-first')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('sight-words-or-phonics-first')).toBe(true);
  });
});
