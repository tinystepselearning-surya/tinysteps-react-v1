import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('authoritative Blog #30 quality lock', () => {
  it('owns practical r-controlled vowel activities while preserving Blog #18 as the explanation and sequence owner', () => {
    const post = bySlug.get('phonics-r-controlled');
    expect(post).toBeDefined();
    expect(post?.title).toBe('R-Controlled Vowel Practice for Kids: ar, er, ir, or and ur');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.excerpt.length).toBeGreaterThanOrEqual(120);
    expect(post?.excerpt.length).toBeLessThanOrEqual(200);
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('This article owns practice — Blog #18 owns the pattern explanation and sequence');
    expect(body).toContain('/blog/r-controlled-vowels-explained');
    expect(body).toContain('practical activities for practising r-controlled spellings that the child has already been taught');
    expect(body).toContain('The Tiny Steps six-part r-controlled practice loop');
    expect(body).toContain('**Choose** —');
    expect(body).toContain('**Hear** —');
    expect(body).toContain('**Notice** —');
    expect(body).toContain('**Decode** —');
    expect(body).toContain('**Encode** —');
    expect(body).toContain('**Transfer** —');
    expect(body).toContain('Activity 1 — Hear, find and read the target pattern');
    expect(body).toContain('Activity 2 — Pattern sort with a reading requirement');
    expect(body).toContain('Activity 4 — Read, cover, spell, check');
    expect(body).toContain('Activity 5 — er, ir and ur spelling sort after the patterns are taught');
    expect(body).toContain('Activity 6 — Fresh-word transfer check');
    expect(body).toContain('Activity 7 — Sentence transfer after accurate word reading');
    expect(body).toContain('Memorised-list success is practice evidence; fresh-word decoding is stronger transfer evidence.');

    expect(body).not.toMatch(/\bWeek\s+5\b/i);
    expect(body).not.toContain('7 days, 10–12 min/day');
    expect(body).not.toContain('3‑wins rule');
    expect(body).not.toContain('three correct reads');
    expect(body).not.toContain('read 5 R‑controlled words correctly');
    expect(body).not.toContain('read 6–8 R‑controlled words correctly');
    expect(body).not.toContain('Week 6');
    expect(body).not.toContain('later the same day, next day, and after two days');
  });

  it('locks accent boundaries, spelling transfer, evidence, FAQs and clean-URL authority status', () => {
    const post = bySlug.get('phonics-r-controlled');
    expect(post).toBeDefined();

    const body = post?.body.map((block) => block.content).join('\n') || '';
    const evidence = getBlogEvidenceSummary(post!);

    expect(body).toContain('use the pronunciation model from the child’s school or phonics programme and do not mark a normal accent difference as a reading error');
    expect(body).toContain('Do not tell the child they should always be able to decide er, ir or ur from the sound alone');
    expect(body).toContain('words such as **word, work, world** should not be used as straightforward early examples of ordinary **or**');
    expect(body).toContain('There is no universal research-defined number of r-controlled words, minutes, days, review intervals or percentage score');
    expect(body).toContain('These are Tiny Steps observational signals, not standardized cut-offs or diagnostic criteria.');
    expect(body).toContain('This article is educational guidance for practice, not a diagnostic assessment.');

    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(5);
    expect(body).toContain('/blog/phonics-long-vowels');
    expect(body).toContain('/blog/how-phonics-improves-spelling');
    expect(body).toContain('/phonics');
    expect(body).toContain('/book-demo');

    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /best activities for practising r-controlled vowels/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /ar, or, er, ir and ur all at once/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /confuse er, ir and ur in spelling/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /bossy-R actions and gestures/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /How many r-controlled words/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /move to another r-controlled pattern/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('phonics-r-controlled')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('phonics-r-controlled')).toBe(true);
    expect(shouldNoindexBlogSlug('week-5-phonics-r-controlled')).toBe(true);
    expect(shouldIncludeBlogSlugInSitemap('week-5-phonics-r-controlled')).toBe(false);
  });
});
