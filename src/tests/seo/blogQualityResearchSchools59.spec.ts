import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #59 systematic and cumulative phonics implementation quality refresh', () => {
  it('keeps Blog #59 focused on whole-school systematic and cumulative implementation', () => {
    const post = bySlug.get('systematic-cumulative-phonics-explained-for-schools');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Systematic and Cumulative Phonics: A School Leader’s Guide to Implementation');
    expect(post?.category).toBe('Research');
    expect(post?.author).toBe('Tiny Steps Academic Team');
    expect(post?.modifiedDate).toBe('2026-09-01');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.excerpt.length).toBeLessThanOrEqual(200);
    expect(post?.audience).toBe('Schools & Research');
    expect(post?.discoveryCategory).toBe('Schools & Research');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('systematic tells you the route; cumulative makes sure earlier learning stays usable');
    expect(body).toContain('Blog 59 owns the implementation-system question');
    expect(body).toContain('What “systematic” should mean beyond a marketing label');
    expect(body).toContain('What “cumulative” should look like in actual lessons');
    expect(body).toContain('Define → Sequence → Teach → Retrieve → Apply → Check → Reteach → Sustain');
    expect(body).toContain('Why systematic and cumulative are not synonyms');
    expect(body).toContain('What current Indian guidance supports — and what it does not prescribe');
    expect(body).toContain('Why the programme sequence must connect to the lesson architecture');
    expect(body).toContain('One-pattern worksheets are useful for teaching — but weak evidence of cumulative mastery');
    expect(body).toContain('Cumulative reading material has to match the taught code');
    expect(body).toContain('Reading and spelling should accumulate together');
    expect(body).toContain('Assessment should follow the progression and feed directly into reteaching');
    expect(body).toContain('Intervention should repair the same system rather than create a competing one');
    expect(body).toContain('Systematic does not mean every child must move at the same speed');
    expect(body).toContain('Cumulative does not mean endless repetition of easy material');
    expect(body).toContain('Programme fidelity matters — but fidelity is not robotic teaching');
    expect(body).toContain('Teacher training is one implementation component, not the whole system');
    expect(body).toContain('The multilingual CBSE context makes coherence more important, not less important');
    expect(body).toContain('A school leader’s systematic-and-cumulative implementation audit');
    expect(body).toContain('Red flags: a programme may not be genuinely systematic and cumulative if…');
    expect(body).toContain('Explore, Prepare, Deliver and Sustain');
    expect(body).toContain('We do **not** claim that our internal sequence is the official CBSE or NCERT phonics sequence');

    expect(body).toContain('/blog/phonics-scope-and-sequence-for-cbse-schools');
    expect(body).toContain('/blog/international-phonics-benchmarks-for-indian-schools');
    expect(body).toContain('/blog/phonics-teacher-training-for-schools-implementation');
    expect(body).toContain('/blog/does-cbse-include-phonics-ncf-foundational-literacy');
    expect(body).toContain('/blog/cbse-phonics-curriculum-vs-systematic-phonics-programme');
    expect(body).toContain('/blog/how-schools-can-assess-decoding-not-memorisation');
    expect(body).toContain('/for-schools');
    expect(body).toContain('/phonics');

    expect(body).not.toMatch(/CBSE (?:requires|mandates) (?:one )?(?:systematic|synthetic|cumulative) phonics programme/i);
    expect(body).not.toMatch(/Tiny Steps (?:is|are) (?:approved|endorsed|certified) by (?:CBSE|NCERT|DfE|EEF)/i);
    expect(body).not.toMatch(/official CBSE phonics sequence is/i);
  });

  it('gives Blog #59 current implementation evidence, answer-engine FAQs and indexable authority status', () => {
    const post = bySlug.get('systematic-cumulative-phonics-explained-for-schools');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(14);
    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /systematic phonics in simple terms/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /cumulative phonics mean/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /difference between systematic and cumulative phonics/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /really cumulative/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /every child.*same pace/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /CBSE prescribe one systematic and cumulative phonics programme/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('systematic-cumulative-phonics-explained-for-schools')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('systematic-cumulative-phonics-explained-for-schools')).toBe(true);
  });
});
