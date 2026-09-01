import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #55 international phonics benchmarks for Indian schools quality refresh', () => {
  it('keeps Blog #55 focused on programme-completeness benchmarking without importing foreign requirements', () => {
    const post = bySlug.get('international-phonics-benchmarks-for-indian-schools');
    expect(post).toBeDefined();
    expect(post?.title).toBe('International Phonics Benchmarks for Indian Schools: What to Include in a Complete Programme');
    expect(post?.category).toBe('Research');
    expect(post?.author).toBe('Tiny Steps Academic Team');
    expect(post?.modifiedDate).toBe('2026-09-01');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.excerpt.length).toBeLessThanOrEqual(200);
    expect(post?.audience).toBe('Schools & Research');
    expect(post?.discoveryCategory).toBe('Schools & Research');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('programme completeness — not import another country’s curriculum');
    expect(body).toContain('Benchmarking is comparison; certification is a formal external status');
    expect(body).toContain('Start with the Indian benchmark before looking overseas');
    expect(body).toContain('What international evidence converges on — despite different national systems');
    expect(body).toContain('The 12-part international benchmark audit for an Indian school phonics programme');
    expect(body).toContain('Benchmark 1 — Alignment to Indian foundational-literacy outcomes');
    expect(body).toContain('Benchmark 2 — A documented scope and incremental sequence');
    expect(body).toContain('Benchmark 3 — Phonological and phonemic awareness connected to print');
    expect(body).toContain('Benchmark 4 — Explicit blending for decoding, not picture-led guessing');
    expect(body).toContain('Benchmark 5 — Segmenting and spelling taught as the reverse application');
    expect(body).toContain('Benchmark 6 — Cumulative practice that keeps earlier knowledge alive');
    expect(body).toContain('Benchmark 7 — Reading material matched to taught phonics knowledge');
    expect(body).toContain('Benchmark 8 — Tricky or exception words explained, not treated as unlimited sight-word memory');
    expect(body).toContain('Benchmark 9 — Word-level phonics connected to fluent, meaningful reading');
    expect(body).toContain('Benchmark 10 — Assessment that tests transfer and changes teaching');
    expect(body).toContain('Benchmark 11 — A defined response for children who are not keeping pace');
    expect(body).toContain('Benchmark 12 — Teacher training, implementation fidelity and ongoing academic support');
    expect(body).toContain('Documented → Observable → Assessed → Supported');
    expect(body).toContain('What should not be copied from international systems');
    expect(body).toContain('The multilingual Indian context is not a footnote to programme benchmarking');
    expect(body).toContain('A procurement red-flag checklist for school leaders');
    expect(body).toContain('Questions to ask a provider before calling the programme complete');
    expect(body).toContain('do **not** automatically apply to Indian or CBSE schools');

    expect(body).toContain('/blog/cbse-phonics-curriculum-vs-systematic-phonics-programme');
    expect(body).toContain('/blog/does-cbse-include-phonics-ncf-foundational-literacy');
    expect(body).toContain('/blog/how-schools-can-assess-decoding-not-memorisation');
    expect(body).toContain('/blog/phonics-scope-and-sequence-for-cbse-schools');
    expect(body).toContain('/blog/phonics-teacher-training-for-schools-implementation');
    expect(body).toContain('/blog/systematic-cumulative-phonics-explained-for-schools');
    expect(body).toContain('/for-schools');
    expect(body).toContain('/phonics');

    expect(body).not.toMatch(/Tiny Steps (?:is|are) (?:validated|approved|endorsed|certified) by/i);
    expect(body).not.toMatch(/CBSE (?:requires|mandates) (?:UK|DfE|EEF|IES|Australian)/i);
    expect(body).not.toMatch(/(?:UK|England) phonics (?:pass mark|threshold).*(?:CBSE|India)/i);
  });

  it('gives Blog #55 broad benchmark evidence, answer-engine FAQs and indexable school authority status', () => {
    const post = bySlug.get('international-phonics-benchmarks-for-indian-schools');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(14);
    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /international phonics benchmarks.*Indian schools/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /copy a UK.*phonics programme exactly/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /decodable books necessary/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /teacher training.*complete phonics programme/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /international benchmarking.*internationally certified/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /tell whether a phonics programme is complete/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('international-phonics-benchmarks-for-indian-schools')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('international-phonics-benchmarks-for-indian-schools')).toBe(true);
  });
});
