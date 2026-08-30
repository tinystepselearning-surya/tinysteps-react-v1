import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('authoritative Blog #28 quality lock', () => {
  it('owns the practical tricky-word teaching routine without encouraging whole-word guessing', () => {
    const post = bySlug.get('phonics-tricky-words');
    expect(post).toBeDefined();
    expect(post?.title).toBe('How to Teach Tricky Words to Kids Without Encouraging Guessing');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.excerpt.length).toBeGreaterThanOrEqual(120);
    expect(post?.excerpt.length).toBeLessThanOrEqual(200);
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('Tricky words, high-frequency words and sight words are not the same thing');
    expect(body).toContain('Some tricky words are only temporarily tricky');
    expect(body).toContain('This guide owns the teaching routine — not the whole tricky-word topic');
    expect(body).toContain('/blog/digraphs-and-tricky-words');
    expect(body).toContain('The Tiny Steps six-step tricky-word routine');
    expect(body).toContain('1) Say — start with the spoken word');
    expect(body).toContain('2) Segment — notice the sounds in order');
    expect(body).toContain('3) Map — connect each sound to the spelling');
    expect(body).toContain('4) Mark — identify only the unexpected part');
    expect(body).toContain('5) Read and spell — practise in both directions');
    expect(body).toContain('6) Transfer — use the word somewhere new');
    expect(body).toContain('Worked example: teaching “said” without whole-word memorisation');
    expect(body).toContain('Choose words by teaching stage, not by a universal weekly list');
    expect(body).toContain('The Tiny Steps four-signal mastery check');
    expect(body).toContain('Mapping —');
    expect(body).toContain('Recognition —');
    expect(body).toContain('Spelling —');
    expect(body).toContain('Transfer —');

    expect(body).not.toMatch(/\bWeek\s+3\b/i);
    expect(body).not.toContain('Week 3 plan');
    expect(body).not.toContain('seven-day tricky-word plan');
    expect(body).not.toContain('2-minute rule');
    expect(body).not.toContain('learn ‘the’ as a whole word');
    expect(body).not.toContain("learn 'the' as a whole word");
    expect(body).not.toContain('Order suggestion:');
  });

  it('locks evidence, anti-guessing transfer, answer-engine FAQs and clean-URL authority status', () => {
    const post = bySlug.get('phonics-tricky-words');
    expect(post).toBeDefined();

    const body = post?.body.map((block) => block.content).join('\n') || '';
    const evidence = getBlogEvidenceSummary(post!);

    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(4);
    expect(body).toContain('Context can help confirm whether a decoded word makes sense; it should not become the main method for identifying the word.');
    expect(body).toContain('Use the child’s normal pronunciation. English accents vary');
    expect(body).toContain('There is no useful universal number for every child.');
    expect(body).toContain('These are Tiny Steps observational checkpoints, not standardized scores.');
    expect(body).toContain('/blog/phonics-rules-for-beginners');
    expect(body).toContain('/blog/how-phonics-improves-spelling');
    expect(body).toContain('/phonics');
    expect(body).toContain('/book-demo');

    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /What is a tricky word in phonics/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /memorise tricky words by sight/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /pictures or context to guess/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /How many tricky words/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /become decodable later/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /really learned a tricky word/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('phonics-tricky-words')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('phonics-tricky-words')).toBe(true);
    expect(shouldNoindexBlogSlug('week-3-phonics-tricky-words')).toBe(true);
    expect(shouldIncludeBlogSlugInSitemap('week-3-phonics-tricky-words')).toBe(false);
  });
});
