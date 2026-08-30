import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('authoritative Blog #34 quality lock', () => {
  it('owns why families consider live online phonics without claiming delivery format is the teaching method', () => {
    const post = bySlug.get('why-parents-choose-online-phonics');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Why Parents Choose Online Phonics Classes for Kids');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.excerpt.length).toBeGreaterThanOrEqual(120);
    expect(post?.excerpt.length).toBeLessThanOrEqual(200);
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('online is a delivery format, not a teaching method');
    expect(body).toContain('This article owns the “why online?” question');
    expect(body).toContain('The Tiny Steps five-part online-fit filter');
    expect(body).toContain('1. Need');
    expect(body).toContain('2. Access');
    expect(body).toContain('3. Interaction');
    expect(body).toContain('4. Teaching');
    expect(body).toContain('5. Transfer');
    expect(body).toContain('Lesson success is teaching evidence; independent fresh-word and text use are stronger transfer evidence.');
    expect(body).toContain('Online phonics should not become passive screen time');
    expect(body).toContain('When online phonics may be a poor fit');
    expect(body).toContain('What online phonics cannot replace');

    expect(body).toContain('/blog/online-phonics-classes-vs-school');
    expect(body).toContain('/blog/how-to-choose-phonics-classes');
    expect(body).toContain('/blog/how-phonics-classes-help-kids-read');
    expect(body).toContain('/blog/online-phonics-games');
    expect(body).toContain('/blog/how-long-does-phonics-take');

    expect(body).not.toMatch(/online phonics is (?:always|automatically|inherently) better/i);
    expect(body).not.toMatch(/read fluently (?:in|within) \d+/i);
    expect(body).not.toMatch(/progress.*next few weeks/i);
  });

  it('locks evidence, Tiny Steps transparency, FAQs and evergreen indexing', () => {
    const post = bySlug.get('why-parents-choose-online-phonics');
    expect(post).toBeDefined();

    const body = post?.body.map((block) => block.content).join('\n') || '';
    const evidence = getBlogEvidenceSummary(post!);

    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(5);
    expect(body).toContain('None of these sources proves that online delivery is inherently superior to school or in-person teaching.');
    expect(body).toContain('Tiny Steps uses live online teaching as the delivery channel for an assessment-led phonics pathway.');
    expect(body).toContain('The demo is for placement and fit; it is not a promise that every child should enrol.');
    expect(body).toContain('/phonics');
    expect(body).toContain('/curriculum');
    expect(body).toContain('/book-demo');

    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /why do parents choose online phonics/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /better than school phonics/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /knows letters but cannot read/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /look for in a live online phonics lesson/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /poor fit/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /online phonics is working/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('why-parents-choose-online-phonics')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('why-parents-choose-online-phonics')).toBe(true);
  });
});
