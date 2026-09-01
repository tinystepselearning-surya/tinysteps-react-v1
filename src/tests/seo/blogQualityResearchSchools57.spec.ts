import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #57 CBSE phonics scope and sequence quality refresh', () => {
  it('keeps Blog #57 focused on a coherent school progression from sound awareness to independent transfer', () => {
    const post = bySlug.get('phonics-scope-and-sequence-for-cbse-schools');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Phonics Scope and Sequence for CBSE Schools: From Sounds to Independent Reading');
    expect(post?.category).toBe('Research');
    expect(post?.author).toBe('Tiny Steps Academic Team');
    expect(post?.modifiedDate).toBe('2026-09-01');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.excerpt.length).toBeLessThanOrEqual(200);
    expect(post?.audience).toBe('Schools & Research');
    expect(post?.discoveryCategory).toBe('Schools & Research');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('there is no single mandatory commercial-style “CBSE grapheme order”');
    expect(body).toContain('Blog 57 owns the progression question');
    expect(body).toContain('Hear → Map → Blend → Spell → Extend → Analyse → Read Fluently → Transfer');
    expect(body).toContain('Stage 1 — Oral language and phonological awareness');
    expect(body).toContain('Stage 2 — Introduce a useful first set of sound–spelling correspondences');
    expect(body).toContain('Stage 3 — Start blending and segmenting');
    expect(body).toContain('Stage 4 — Expand into common consonant digraphs');
    expect(body).toContain('Stage 5 — Teach long-vowel spellings');
    expect(body).toContain('Stage 6 — Add r-controlled vowels');
    expect(body).toContain('Stage 7 — Connect phonics with spelling conventions, morphology and meaningful word parts');
    expect(body).toContain('Stage 8 — Teach multisyllabic word reading deliberately');
    expect(body).toContain('Stage 9 — Match independent reading material to what children can actually decode');
    expect(body).toContain('Stage 10 — Build fluency');
    expect(body).toContain('Stage 11 — Assess fresh transfer');
    expect(body).toContain('Stage 12 — Use gap analysis to reteach prerequisites');
    expect(body).toContain('A school scope should contain more than a grapheme list');
    expect(body).toContain('protect prerequisites');
    expect(body).toContain('make cumulative review visible in the timetable');
    expect(body).toContain('do not confuse grade placement with reading placement');
    expect(body).toContain('separate the core progression from pacing');
    expect(body).toContain('keep oral language and comprehension alongside phonics throughout');
    expect(body).toContain('How the CBSE R1/R2 framework affects English phonics sequencing');
    expect(body).toContain('SATPIN is not mandated by CBSE or NCF');
    expect(body).toContain('There is **no universal evidence-based 90%, 95% or 100% mastery rule**');
    expect(body).toContain('Tiny Steps does **not** claim that its internal lesson order is the official CBSE or NCERT phonics sequence');

    expect(body).toContain('/blog/does-cbse-include-phonics-ncf-foundational-literacy');
    expect(body).toContain('/blog/cbse-phonics-curriculum-vs-systematic-phonics-programme');
    expect(body).toContain('/blog/international-phonics-benchmarks-for-indian-schools');
    expect(body).toContain('/blog/how-schools-can-assess-decoding-not-memorisation');
    expect(body).toContain('/blog/systematic-cumulative-phonics-explained-for-schools');
    expect(body).toContain('/for-schools');
    expect(body).toContain('/phonics');

    expect(body).not.toMatch(/CBSE (?:requires|mandates) SATPIN/i);
    expect(body).not.toMatch(/official CBSE phonics sequence is/i);
    expect(body).not.toMatch(/CBSE (?:requires|mandates) (?:90|95|100)%/i);
  });

  it('gives Blog #57 source-backed evidence, answer-engine FAQs and indexable school authority status', () => {
    const post = bySlug.get('phonics-scope-and-sequence-for-cbse-schools');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(12);
    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /phonics scope and sequence.*CBSE school/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /CBSE prescribe one exact phonics sequence/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /SATPIN.*CBSE schools/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /all letter sounds before blending/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /multisyllabic words.*phonics sequence/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /ready to move.*next phonics stage/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('phonics-scope-and-sequence-for-cbse-schools')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('phonics-scope-and-sequence-for-cbse-schools')).toBe(true);
  });
});
