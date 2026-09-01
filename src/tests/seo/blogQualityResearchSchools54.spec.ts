import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #54 decoding instead of word memorisation quality refresh', () => {
  it('keeps Blog #54 focused on fresh transfer and instructional decoding assessment', () => {
    const post = bySlug.get('how-schools-can-assess-decoding-not-memorisation');
    expect(post).toBeDefined();
    expect(post?.title).toBe('How Schools Can Assess Decoding Instead of Word Memorisation');
    expect(post?.category).toBe('Research');
    expect(post?.author).toBe('Tiny Steps Academic Team');
    expect(post?.modifiedDate).toBe('2026-09-01');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.excerpt.length).toBeLessThanOrEqual(200);
    expect(post?.audience).toBe('Schools & Research');
    expect(post?.discoveryCategory).toBe('Schools & Research');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('assess transfer to unfamiliar print');
    expect(body).toContain('Why familiar-word success can create a false picture of reading mastery');
    expect(body).toContain('What Indian foundational-literacy guidance gives schools to assess');
    expect(body).toContain('The Tiny Steps fresh-word transfer ladder');
    expect(body).toContain('Stage 1 — Can the child retrieve the sound–spelling knowledge being tested?');
    expect(body).toContain('Stage 2 — Can the child blend a fresh decodable real word?');
    expect(body).toContain('Stage 3 — Can the child decode a pseudo-word when the purpose is explained?');
    expect(body).toContain('Stage 4 — Can the child reverse the process for spelling?');
    expect(body).toContain('Stage 5 — Can the child retrieve the pattern when old and new learning are mixed?');
    expect(body).toContain('Stage 6 — Can the child use the knowledge in matched connected text?');
    expect(body).toContain('Do not use pictures or sentence context to rescue a decoding item');
    expect(body).toContain('Fresh real words versus pseudo-words: schools do not have to choose only one');
    expect(body).toContain('How to prevent the assessment itself from becoming memorised');
    expect(body).toContain('baseline → teach → fresh transfer → reteach → recheck');
    expect(body).toContain('Assessment fairness: multilingual children, accent and unfamiliar vocabulary');
    expect(body).toContain('do **not** apply automatically to CBSE schools');

    expect(body).toContain('/blog/does-cbse-include-phonics-ncf-foundational-literacy');
    expect(body).toContain('/blog/cbse-phonics-curriculum-vs-systematic-phonics-programme');
    expect(body).toContain('/blog/phonics-scope-and-sequence-for-cbse-schools');
    expect(body).toContain('/blog/systematic-cumulative-phonics-explained-for-schools');
    expect(body).toContain('/blog/why-letter-sounds-are-not-enough-to-read');
    expect(body).toContain('/for-schools');
    expect(body).toContain('/phonics');

    expect(body).not.toMatch(/CBSE (?:requires|mandates) pseudo-words/i);
    expect(body).not.toMatch(/(?:32|40)\s*(?:is|=)\s*(?:the )?(?:CBSE|Indian) phonics/i);
    expect(body).not.toMatch(/(?:90|95|100)%\s+(?:accuracy|mastery|correct)/i);
    expect(body).not.toContain('one universal mastery percentage');
  });

  it('gives Blog #54 source-backed evidence, answer-engine FAQs and indexable school authority status', () => {
    const post = bySlug.get('how-schools-can-assess-decoding-not-memorisation');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(10);
    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /decoding or memorising words/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /pseudo-words.*assess decoding/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /picture clues.*assessing phonics decoding/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /reading speed enough/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /fails a decoding checkpoint/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /best decoding assessment/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('how-schools-can-assess-decoding-not-memorisation')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('how-schools-can-assess-decoding-not-memorisation')).toBe(true);
  });
});
