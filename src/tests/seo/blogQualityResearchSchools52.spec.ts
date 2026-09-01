import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #52 CBSE curriculum vs systematic phonics programme quality refresh', () => {
  it('keeps Blog #52 focused on curriculum alignment versus implementation architecture', () => {
    const post = bySlug.get('cbse-phonics-curriculum-vs-systematic-phonics-programme');
    expect(post).toBeDefined();
    expect(post?.title).toBe('CBSE Phonics Curriculum vs a Systematic Phonics Programme: What Schools Need to Know');
    expect(post?.category).toBe('Research');
    expect(post?.author).toBe('Tiny Steps Academic Team');
    expect(post?.modifiedDate).toBe('2026-09-01');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.excerpt.length).toBeLessThanOrEqual(200);
    expect(post?.audience).toBe('Schools & Research');
    expect(post?.discoveryCategory).toBe('Schools & Research');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('curriculum expectations versus implementation system');
    expect(body).toContain('What CBSE and NCF currently require schools to pay attention to');
    expect(body).toContain('What a complete systematic phonics programme should add');
    expect(body).toContain('A six-part comparison school leaders can use');
    expect(body).toContain('Why a textbook is not automatically the same thing as a phonics programme');
    expect(body).toContain('The multilingual CBSE context changes implementation');
    expect(body).toContain('Red flags when a provider says “CBSE aligned phonics”');
    expect(body).toContain('A practical due-diligence checklist before a school buys or builds a phonics programme');
    expect(body).toContain('We do **not** claim CBSE or NCERT endorsement');
    expect(body).toContain('International sources above are used as comparative evidence on systematic phonics implementation');

    expect(body).toContain('/blog/does-cbse-include-phonics-ncf-foundational-literacy');
    expect(body).toContain('/blog/phonics-scope-and-sequence-for-cbse-schools');
    expect(body).toContain('/blog/international-phonics-benchmarks-for-indian-schools');
    expect(body).toContain('/blog/systematic-cumulative-phonics-explained-for-schools');
    expect(body).toContain('/blog/phonics-teacher-training-for-schools-implementation');
    expect(body).toContain('/blog/how-schools-can-assess-decoding-not-memorisation');
    expect(body).toContain('/blog/why-letter-sounds-are-not-enough-to-read');
    expect(body).toContain('/for-schools');
    expect(body).toContain('/phonics');

    expect(body).not.toMatch(/CBSE[- ](?:approved|endorsed|certified) phonics/i);
    expect(body).not.toMatch(/Tiny Steps (?:is|are) (?:approved|endorsed|certified) by (?:CBSE|NCERT)/i);
    expect(body).not.toContain('CBSE has no phonics direction');
  });

  it('gives Blog #52 current official evidence, answer-engine FAQs and indexable school authority status', () => {
    const post = bySlug.get('cbse-phonics-curriculum-vs-systematic-phonics-programme');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(10);
    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /separate phonics curriculum/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /CBSE school use a systematic phonics programme/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /difference between NCF phonics expectations and a phonics programme/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /letter sounds enough/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /textbook replace/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /evaluate a phonics programme/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('cbse-phonics-curriculum-vs-systematic-phonics-programme')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('cbse-phonics-curriculum-vs-systematic-phonics-programme')).toBe(true);
  });
});
