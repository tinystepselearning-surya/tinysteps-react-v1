import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('authoritative Blog #33 quality lock', () => {
  it('owns the parent start-here definition of phonics and protects decoding from guessing shortcuts', () => {
    const post = bySlug.get('what-is-phonics-for-kids');
    expect(post).toBeDefined();
    expect(post?.title).toBe('What Is Phonics for Kids? A Parent Start-Here Guide');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-09-26');
    expect(post?.excerpt.length).toBeGreaterThanOrEqual(120);
    expect(post?.excerpt.length).toBeLessThanOrEqual(200);
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('Phonics is a way of teaching reading and spelling by making the relationship between spoken sounds and written letters or letter groups explicit.');
    expect(body).toContain('alphabetic principle');
    expect(body).toContain('grapheme–phoneme correspondence (GPC)');
    expect(body).toContain('encoding');
    expect(body).toContain('This is the start-here phonics guide');
    expect(body).toContain('Six terms make phonics much easier to understand');
    expect(body).toContain('Phonemic awareness and phonics are related, but they are not the same');
    expect(body).toContain('/blog/phonological-awareness-vs-phonemic-awareness-vs-phonics');
    expect(body).toContain('The Tiny Steps phonics learning chain');
    expect(body).toContain('**Hear** —');
    expect(body).toContain('**Map** —');
    expect(body).toContain('**Blend** —');
    expect(body).toContain('**Read** —');
    expect(body).toContain('**Spell** —');
    expect(body).toContain('**Transfer** —');
    expect(body).toContain('Rehearsed success is practice evidence; fresh-word and text use are stronger transfer evidence.');
    expect(body).toContain('What phonics is — and what it is not');
    expect(body).toContain('Phonics is not the same as learning the alphabet');
    expect(body).toContain('Phonics is not whole-word shape memorisation');
    expect(body).toContain('Phonics is not picture or context guessing');
    expect(body).toContain('print first for word identity; context next for meaning and confirmation');
    expect(body).toContain('What phonics does not teach by itself');

    expect(body).toContain('/blog/what-age-to-start-phonics');
    expect(body).toContain('/blog/phonics-rules-for-beginners');
    expect(body).toContain('/blog/phonics-for-parents-guide');
    expect(body).toContain('/blog/how-phonics-classes-help-kids-read');
    expect(body).toContain('/blog/phonics-comprehension');

    expect(body).not.toContain('Run a 10-minute start routine');
    expect(body).not.toMatch(/2-4 weeks|4-8 weeks|6-8 weeks/i);
    expect(body).not.toContain('After one week');
  });

  it('keeps the definition page distinct from the deeper parent-support guide', () => {
    const post = bySlug.get('what-is-phonics-for-kids');
    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('Where home support fits');
    expect(body).toContain('This article does not own the full home-practice method.');
    expect(body).toContain('/blog/phonics-for-parents-guide');
    expect(body).not.toContain('A flexible home routine for a child who is already learning phonics');
    expect(body).not.toContain('Where Tiny Steps free games fit — and where they do not');
    expect(body).not.toContain('Retrieve — review a small amount of already-taught sound–spelling knowledge.');
  });

  it('locks evidence, India relevance, targeted product transparency, FAQs and evergreen indexing', () => {
    const post = bySlug.get('what-is-phonics-for-kids');
    expect(post).toBeDefined();

    const body = post?.body.map((block) => block.content).join('\n') || '';
    const evidence = getBlogEvidenceSummary(post!);

    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(5);
    expect(body).toContain('The Tiny Steps six-part learning chain is an editorial explanation.');
    expect(body).toContain('NCERT — National Curriculum Framework for Foundational Stage 2022');
    expect(body).toContain('https://www.ncert.nic.in/pdf/NCF_for_Foundational_Stage_20_October_2022.pdf');
    expect(body).toContain('Education Endowment Foundation phonics review');
    expect(body).toContain('IES foundational-reading practice guide');
    expect(body).toContain('For targeted practice only');
    expect(body).toContain('/free-balloon-pop-phonics-game-for-kids');
    expect(body).toContain('/free-letter-tracing-game-for-kids');
    expect(body).toContain('/phonics');
    expect(body).toContain('/book-demo');

    expect(post?.faq).toHaveLength(7);
    expect(post?.faq?.some((item) => /phonics in simple words/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /same as learning the alphabet/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /phonemic awareness and phonics/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /sounding out every word forever/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /sight words separate/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /teach comprehension/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /phonics is working/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('what-is-phonics-for-kids')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('what-is-phonics-for-kids')).toBe(true);
  });
});
