import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #53 CBSE phonics and NCF evidence quality refresh', () => {
  it('keeps Blog #53 focused on the official CBSE and NCF evidence question', () => {
    const post = bySlug.get('does-cbse-include-phonics-ncf-foundational-literacy');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Does CBSE Include Phonics? What the NCF Says About Foundational Literacy and Early Reading');
    expect(post?.category).toBe('Research');
    expect(post?.author).toBe('Tiny Steps Academic Team');
    expect(post?.modifiedDate).toBe('2026-09-01');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.excerpt.length).toBeLessThanOrEqual(200);
    expect(post?.audience).toBe('Schools & Research');
    expect(post?.discoveryCategory).toBe('Schools & Research');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('yes, within the broader foundational-literacy framework');
    expect(body).toContain('The strongest current CBSE evidence: the May 2025 language-instruction circular');
    expect(body).toContain('listening comprehension, oral fluency, vocabulary, phonemic awareness');
    expect(body).toContain('NCF-FS goes further: it explicitly defines decoding and names phonics in English');
    expect(body).toContain('specific letter combinations that represent sounds in English');
    expect(body).toContain('What “phonemic awareness” means here — and why it is not the same as phonics');
    expect(body).toContain('NCF does not say “teach the alphabet A to Z and phonics is complete”');
    expect(body).toContain('Does CBSE require blending and segmenting?');
    expect(body).toContain('The July 2025 CBSE update matters because learning outcomes are now more explicit and current');
    expect(body).toContain('The multilingual R1/R2 context changes how schools should interpret the English phonics question');
    expect(body).toContain('Does CBSE prescribe one exact English phonics scope and sequence?');
    expect(body).toContain('A school leader’s document-check: what the official evidence supports and what it does not');
    expect(body).toContain('We do **not** claim that Tiny Steps is CBSE-approved, CBSE-certified or NCERT-endorsed');
    expect(body).toContain('“CBSE aligned” is not the same as “CBSE endorsed.”');

    expect(body).toContain('/blog/cbse-phonics-curriculum-vs-systematic-phonics-programme');
    expect(body).toContain('/blog/phonics-scope-and-sequence-for-cbse-schools');
    expect(body).toContain('/blog/how-schools-can-assess-decoding-not-memorisation');
    expect(body).toContain('/blog/systematic-cumulative-phonics-explained-for-schools');
    expect(body).toContain('/blog/why-letter-sounds-are-not-enough-to-read');
    expect(body).toContain('/for-schools');
    expect(body).toContain('/phonics');
    expect(body).toContain('/curriculum');

    expect(body).not.toMatch(/CBSE[- ](?:approved|endorsed|certified) phonics programme/i);
    expect(body).not.toMatch(/Tiny Steps (?:is|are) (?:approved|endorsed|certified) by (?:CBSE|NCERT)/i);
    expect(body).not.toContain('CBSE has no phonics direction');
    expect(body).not.toContain('CBSE does not include phonics');
  });

  it('gives Blog #53 current primary evidence, answer-engine FAQs and indexable school authority status', () => {
    const post = bySlug.get('does-cbse-include-phonics-ncf-foundational-literacy');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(10);
    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /include phonics.*Foundational Stage/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /NCF actually use the word phonics/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /require phonemic awareness/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /exact phonics scope and sequence/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /whole CBSE foundational literacy curriculum/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /CBSE-approved or NCERT-endorsed/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('does-cbse-include-phonics-ncf-foundational-literacy')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('does-cbse-include-phonics-ncf-foundational-literacy')).toBe(true);
  });
});
