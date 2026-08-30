import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('authoritative Blog #12 quality lock', () => {
  it('owns the school-versus-online child-fit decision without ranking delivery formats universally', () => {
    const post = bySlug.get('online-phonics-classes-vs-school');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Online Phonics Classes vs School: What Works for Which Child');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('Quick answer: online phonics is not automatically better than school phonics');
    expect(body).toContain('First separate three different decisions');
    expect(body).toContain('When school phonics may already be enough');
    expect(body).toContain('When targeted online phonics may add useful support');
    expect(body).toContain('School and online support should not become two competing phonics systems');
    expect(body).toContain('What good online phonics should still contain');
    expect(body).toContain('What school offers that supplemental online teaching should not pretend to replace');
    expect(body).toContain('When online may be a poor fit even if extra help is needed');
    expect(body).toContain('The Tiny Steps five-question school-versus-online check');
    expect(body).toContain('How to judge whether supplemental support is working');

    expect(body).toContain('/blog/how-kids-learn-blending');
    expect(body).toContain('/blog/how-to-improve-reading-fluency-in-children');
    expect(body).toContain('/blog/how-phonics-classes-help-kids-read');
    expect(body).toContain('/blog/how-to-choose-phonics-classes');
    expect(body).toContain('/blog/how-long-does-phonics-take');
    expect(body).toContain('/phonics');
    expect(body).toContain('/curriculum');

    expect(body).not.toMatch(/online phonics (?:is|classes are) (?:always )?better/i);
    expect(body).not.toMatch(/school phonics (?:is|classes are) (?:always )?better/i);
    expect(body).not.toMatch(/read fluently in \d+ (?:days|weeks|months)/i);
    expect(body).not.toMatch(/guaranteed? to read/i);
    expect(body).not.toContain('Book Free 35-Minute Demo');
    expect(body).not.toContain('Compare course pathways');
  });

  it('adds evidence, coordination boundaries and extractable parent decision FAQs', () => {
    const post = bySlug.get('online-phonics-classes-vs-school');
    expect(post).toBeDefined();

    const body = post?.body.map((block) => block.content).join('\n') || '';
    const evidence = getBlogEvidenceSummary(post!);

    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(5);
    expect(body).toContain('positive results across whole-class, small-group and one-to-one contexts');
    expect(body).toContain('linked to normal teaching');
    expect(body).toContain('direct teacher–child interaction');
    expect(body).toContain('Outside England, those documents are useful implementation references rather than rules');
    expect(body).toContain('not a diagnostic or standardized placement tool');
    expect(body).toContain('They do not establish that online phonics is universally superior to school teaching');
    expect(body).toContain('More beginner phonics may not be the right answer');
    expect(body).toContain('appropriate professional review');

    expect(post?.faq).toHaveLength(5);
    expect(post?.faq?.some((item) => /online phonics classes better than school phonics/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /school phonics is enough/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /extra online phonics help/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /same sequence as school/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /decode words but still struggles/i.test(item.question))).toBe(true);
  });
});
