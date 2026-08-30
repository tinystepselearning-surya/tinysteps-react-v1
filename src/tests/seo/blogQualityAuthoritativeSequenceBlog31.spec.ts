import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('authoritative Blog #31 quality lock', () => {
  it('owns the practical bridge from accurate decoding into meaning without turning context into a word-guessing strategy', () => {
    const post = bySlug.get('phonics-comprehension');
    expect(post).toBeDefined();
    expect(post?.title).toBe('From Decoding to Comprehension: How to Help Kids Understand What They Read');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.excerpt.length).toBeGreaterThanOrEqual(120);
    expect(post?.excerpt.length).toBeLessThanOrEqual(200);
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('decoding identifies the printed words; comprehension builds a coherent meaning from those words and the language they express');
    expect(body).toContain('This guide owns the bridge from accurate decoding into meaning');
    expect(body).toContain('/blog/how-to-improve-reading-fluency-in-children');
    expect(body).toContain('/blog/why-child-reads-words-but-does-not-understand-story');
    expect(body).toContain('Start with the bottleneck, not with a worksheet');
    expect(body).toContain('Bottleneck 1 — the child is still misreading important words');
    expect(body).toContain('Bottleneck 2 — the words are accurate but reading is very effortful');
    expect(body).toContain('Bottleneck 3 — one word or phrase blocks the meaning');
    expect(body).toContain('Bottleneck 4 — each sentence makes sense, but the child loses the bigger idea');
    expect(body).toContain('Bottleneck 5 — the child can recall facts but struggles with inference');

    expect(body).toContain('The Tiny Steps six-part decoding-to-comprehension bridge');
    expect(body).toContain('**Decode** —');
    expect(body).toContain('**Phrase** —');
    expect(body).toContain('**Clarify** —');
    expect(body).toContain('**Connect** —');
    expect(body).toContain('**Retell** —');
    expect(body).toContain('**Check** —');
    expect(body).toContain('Familiar-passage success is practice evidence; understanding a fresh, appropriately matched passage is stronger transfer evidence.');
    expect(body).toContain('print first for word identity; context next for meaning and confirmation');

    expect(body).not.toMatch(/\bWeek\s+6\b/i);
    expect(body).not.toContain('7 days, 10 minutes/day');
    expect(body).not.toContain('3‑question habit');
    expect(body).not.toContain('1 word/day');
    expect(body).not.toContain('1‑minute micro‑check');
    expect(body).not.toContain('Week 7');
    expect(body).not.toContain('sticker');
  });

  it('locks evidence, comprehension-transfer boundaries, FAQs and clean-URL authority status', () => {
    const post = bySlug.get('phonics-comprehension');
    expect(post).toBeDefined();

    const body = post?.body.map((block) => block.content).join('\n') || '';
    const evidence = getBlogEvidenceSummary(post!);

    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(5);
    expect(body).toContain('There is no useful universal number. One well-chosen prompt can reveal more than a page of questions.');
    expect(body).toContain('Reading comprehension is not the same thing as producing written answers to comprehension questions.');
    expect(body).toContain('These are Tiny Steps observational signals, not standardized comprehension scores, grade-level cut-offs or diagnostic criteria.');
    expect(body).toContain('If the child understands a story when an adult reads it aloud but not when reading it independently');
    expect(body).toContain('This comparison is an observation, not a diagnosis.');
    expect(body).toContain('/blog/phonics-multisyllabic');
    expect(body).toContain('/phonics');
    expect(body).toContain('/book-demo');

    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /read the words but not understand the sentence/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /comprehension questions after every page/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /pictures and context help reading comprehension/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /understands when I read aloud/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /comprehension practice is transferring/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /extra help for reading comprehension/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('phonics-comprehension')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('phonics-comprehension')).toBe(true);
    expect(shouldNoindexBlogSlug('week-6-phonics-comprehension')).toBe(true);
    expect(shouldIncludeBlogSlugInSitemap('week-6-phonics-comprehension')).toBe(false);
  });
});
