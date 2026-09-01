import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #58 phonics teacher training implementation quality refresh', () => {
  it('keeps Blog #58 focused on teacher capability beyond one-off workshop attendance', () => {
    const post = bySlug.get('phonics-teacher-training-for-schools-implementation');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Phonics Teacher Training for Schools: Why a Workshop Alone Is Not Implementation');
    expect(post?.category).toBe('Research');
    expect(post?.author).toBe('Tiny Steps Academic Team');
    expect(post?.modifiedDate).toBe('2026-09-01');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.excerpt.length).toBeLessThanOrEqual(200);
    expect(post?.audience).toBe('Schools & Research');
    expect(post?.discoveryCategory).toBe('Schools & Research');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('a phonics workshop can start implementation, but it cannot prove implementation');
    expect(body).toContain('Blog 58 owns the teacher-capability and implementation question');
    expect(body).toContain('Why the evidence points beyond one-off training');
    expect(body).toContain('The Indian context also treats teacher capacity building as part of foundational-literacy implementation');
    expect(body).toContain('What an initial phonics workshop can do well');
    expect(body).toContain('What workshop attendance cannot tell a school');
    expect(body).toContain('Train → Model → Rehearse → Teach → Observe → Coach → Assess → Reteach → Sustain');
    expect(body).toContain('Seven capabilities phonics teachers need beyond knowing the terminology');
    expect(body).toContain('Prepare → Launch → Stabilise → Sustain');
    expect(body).toContain('A practical phonics observation rubric for academic leaders');
    expect(body).toContain('Fidelity does not mean robotic teaching');
    expect(body).toContain('Assessment review should shape teacher support');
    expect(body).toContain('There is no universal evidence-based number of coaching visits');
    expect(body).toContain('Staff turnover is an implementation test schools should plan for before it happens');
    expect(body).toContain('Red flags when a phonics provider sells “teacher training” as the entire implementation plan');
    expect(body).toContain('Questions school leaders should ask before approving phonics teacher training');
    expect(body).toContain('We do **not** claim CBSE or NCERT endorsement');

    expect(body).toContain('/blog/international-phonics-benchmarks-for-indian-schools');
    expect(body).toContain('/blog/phonics-scope-and-sequence-for-cbse-schools');
    expect(body).toContain('/blog/how-schools-can-assess-decoding-not-memorisation');
    expect(body).toContain('/blog/systematic-cumulative-phonics-explained-for-schools');
    expect(body).toContain('/blog/does-cbse-include-phonics-ncf-foundational-literacy');
    expect(body).toContain('/for-schools');
    expect(body).toContain('/phonics');

    expect(body).not.toMatch(/CBSE (?:requires|mandates) (?:monthly|weekly|quarterly) phonics coaching/i);
    expect(body).not.toMatch(/Tiny Steps .*CBSE[- ](?:approved|certified) phonics training/i);
    expect(body).not.toMatch(/Tiny Steps (?:is|are) (?:approved|endorsed|certified) by (?:CBSE|NCERT)/i);
  });

  it('gives Blog #58 implementation evidence, answer-engine FAQs and indexable school authority status', () => {
    const post = bySlug.get('phonics-teacher-training-for-schools-implementation');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(14);
    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /one phonics workshop enough/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /phonics teacher training.*include/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /how often.*coaching or observation/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /existing CBSE school teachers.*systematic phonics programme/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /difference between phonics teacher training and phonics implementation/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /tell whether phonics training is working/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('phonics-teacher-training-for-schools-implementation')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('phonics-teacher-training-for-schools-implementation')).toBe(true);
  });
});
