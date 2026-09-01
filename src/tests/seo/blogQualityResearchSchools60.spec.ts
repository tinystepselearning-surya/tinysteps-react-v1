import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #60 letter sounds are not enough for reading quality refresh', () => {
  it('keeps Blog #60 focused on the instructional bridge from sound recall to independent reading', () => {
    const post = bySlug.get('why-letter-sounds-are-not-enough-to-read');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Why Letter Sounds Alone Are Not Enough for Reading: What Schools Should Teach Next');
    expect(post?.category).toBe('Research');
    expect(post?.author).toBe('Tiny Steps Academic Team');
    expect(post?.modifiedDate).toBe('2026-09-01');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.excerpt.length).toBeLessThanOrEqual(200);
    expect(post?.audience).toBe('Schools & Research');
    expect(post?.discoveryCategory).toBe('Schools & Research');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('knowing letter sounds is prerequisite knowledge, not evidence that a child can read');
    expect(body).toContain('Blog 60 owns the “what comes after letter sounds?” question');
    expect(body).toContain('What the NCF evidence actually says beyond alphabet sounds');
    expect(body).toContain('Current CBSE guidance also places letter recognition inside a larger literacy pathway');
    expect(body).toContain('Retrieve → Combine → Expand → Spell → Mix → Read → Transfer → Become Fluent');
    expect(body).toContain('1. Retrieve — make letter–sound knowledge usable inside words');
    expect(body).toContain('2. Combine — explicitly teach blending through complete printed words');
    expect(body).toContain('3. Expand — teach graphemes beyond one letter representing one sound');
    expect(body).toContain('4. Spell — reverse the process through segmenting and encoding');
    expect(body).toContain('5. Mix — make practice cumulative instead of teaching one isolated pattern at a time forever');
    expect(body).toContain('6. Read — move from word lists into matched connected text');
    expect(body).toContain('7. Transfer — check fresh words so memorisation cannot hide the gap');
    expect(body).toContain('8. Become fluent — accurate decoding must increasingly become efficient enough to support meaning');
    expect(body).toContain('Five false signals that can make a school think reading is stronger than it is');
    expect(body).toContain('What a school should teach next when children know sounds but cannot blend');
    expect(body).toContain('What to teach after children can blend simple CVC words');
    expect(body).toContain('Why spelling belongs immediately after letter-sound knowledge');
    expect(body).toContain('Why “more phonics rules” is sometimes the wrong response');
    expect(body).toContain('A school-leader observation check: are children learning sounds, or learning to read with sounds?');
    expect(body).toContain('The multilingual CBSE context: decoding and language comprehension are both necessary');
    expect(body).toContain('That is the shift from **knowing sounds** to **using the alphabetic system for reading**');
    expect(body).toContain('We do **not** claim that Tiny Steps is approved, certified or endorsed by CBSE or NCERT');

    expect(body).toContain('/blog/phonics-scope-and-sequence-for-cbse-schools');
    expect(body).toContain('/blog/how-schools-can-assess-decoding-not-memorisation');
    expect(body).toContain('/blog/systematic-cumulative-phonics-explained-for-schools');
    expect(body).toContain('/blog/does-cbse-include-phonics-ncf-foundational-literacy');
    expect(body).toContain('/blog/international-phonics-benchmarks-for-indian-schools');
    expect(body).toContain('/blog/phonics-teacher-training-for-schools-implementation');
    expect(body).toContain('/for-schools');
    expect(body).toContain('/phonics');

    expect(body).not.toMatch(/CBSE (?:requires|mandates) (?:all )?26 letter sounds before blending/i);
    expect(body).not.toMatch(/official CBSE phonics sequence is/i);
    expect(body).not.toMatch(/Tiny Steps (?:is|are) (?:approved|endorsed|certified) by (?:CBSE|NCERT)/i);
  });

  it('gives Blog #60 official evidence, answer-engine FAQs and indexable school authority status', () => {
    const post = bySlug.get('why-letter-sounds-are-not-enough-to-read');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(16);
    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /letter sounds alone not enough/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /what should schools teach after.*letter sounds/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /all 26 letter sounds before.*blending/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /say the sounds.*still not read/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /letter-sound knowledge.*transferring into reading/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /CBSE or NCF expect more than alphabet-sound/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('why-letter-sounds-are-not-enough-to-read')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('why-letter-sounds-are-not-enough-to-read')).toBe(true);
  });
});
