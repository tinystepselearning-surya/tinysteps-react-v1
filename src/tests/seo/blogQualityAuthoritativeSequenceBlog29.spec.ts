import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('authoritative Blog #29 quality lock', () => {
  it('owns practical long-vowel activities without replacing the pattern-order authority page', () => {
    const post = bySlug.get('phonics-long-vowels');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Long Vowel Practice for Kids: Simple Activities for Common Patterns');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.excerpt.length).toBeGreaterThanOrEqual(120);
    expect(post?.excerpt.length).toBeLessThanOrEqual(200);
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('[Long Vowel Sounds for Kids](/blog/long-vowel-sounds-for-kids), owns the broader explanation');
    expect(body).toContain('practical activities for practising a pattern the child has already been taught');
    expect(body).toContain('The Tiny Steps six-part long-vowel practice loop');
    expect(body).toContain('**Choose** —');
    expect(body).toContain('**Notice** —');
    expect(body).toContain('**Decode** —');
    expect(body).toContain('**Contrast** —');
    expect(body).toContain('**Encode** —');
    expect(body).toContain('**Transfer** —');
    expect(body).toContain('Activity 1 — Short-vowel vs VCe contrast pairs');
    expect(body).toContain('Activity 2 — Pattern sort with a real reading requirement');
    expect(body).toContain('Activity 4 — Read, cover, spell, check');
    expect(body).toContain('Activity 5 — One-pattern fresh-word check');
    expect(body).toContain('Activity 6 — Sentence transfer after accurate word reading');
    expect(body).toContain('Transfer is the stronger evidence.');

    expect(body).not.toMatch(/\bWeek\s+4\b/i);
    expect(body).not.toContain('7 days, 12 minutes/day');
    expect(body).not.toContain('3-wins rule');
    expect(body).not.toContain('Vowel Team Race');
    expect(body).not.toContain('80% accuracy');
    expect(body).not.toContain('Week 5 focuses');
    expect(body).not.toContain('reads 6–8 minimal pairs');
  });

  it('locks evidence, transfer checks, answer-engine FAQs and clean-URL authority status', () => {
    const post = bySlug.get('phonics-long-vowels');
    expect(post).toBeDefined();

    const body = post?.body.map((block) => block.content).join('\n') || '';
    const evidence = getBlogEvidenceSummary(post!);

    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(5);
    expect(body).toContain('There is no universal research-defined number of words, minutes, days or percentage score');
    expect(body).toContain('These are Tiny Steps observational signals, not standardized cut-offs.');
    expect(body).toContain('This article is educational guidance for practice, not a diagnostic assessment.');
    expect(body).toContain('/blog/how-phonics-improves-spelling');
    expect(body).toContain('/blog/r-controlled-vowels-explained');
    expect(body).toContain('/phonics');
    expect(body).toContain('/book-demo');

    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /best way to practise long vowels/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /magic e before vowel teams/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /How many long-vowel words/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /read long-vowel words correctly but spell/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /practice be timed/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /move to another long-vowel pattern/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('phonics-long-vowels')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('phonics-long-vowels')).toBe(true);
    expect(shouldNoindexBlogSlug('week-4-phonics-long-vowels')).toBe(true);
    expect(shouldIncludeBlogSlugInSitemap('week-4-phonics-long-vowels')).toBe(false);
  });
});
