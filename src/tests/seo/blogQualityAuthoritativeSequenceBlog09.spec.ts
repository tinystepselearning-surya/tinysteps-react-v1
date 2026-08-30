import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('authoritative Blog #9 quality lock', () => {
  it('owns the parent encoding roadmap without fixed spelling timelines or generic class-shopping copy', () => {
    const post = bySlug.get('how-phonics-improves-spelling');
    expect(post).toBeDefined();
    expect(post?.title).toBe('How Phonics Improves Spelling: A Parent Encoding Roadmap');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('Quick answer: phonics supports spelling by teaching children how to turn sounds into print');
    expect(body).toContain('Why a child can read a word but still misspell it');
    expect(body).toContain('The Tiny Steps six-step encoding roadmap');
    expect(body).toContain('Step 2 — Segment the word into phonemes');
    expect(body).toContain('Step 4 — Choose among alternative spellings when the child knows them');
    expect(body).toContain('A spelling error map: what different mistakes can tell you');
    expect(body).toContain('The spelling is phonically plausible but not conventional');
    expect(body).toContain('Phonically plausible does not mean “ignore the error”');
    expect(body).toContain('Where dictation helps—and where copying still has a limited role');
    expect(body).toContain('When spelling needs more than phonics');

    expect(body).toContain('/blog/digraphs-and-tricky-words');
    expect(body).toContain('/blog/phonics-tricky-words');
    expect(body).toContain('/blog/how-phonics-classes-help-kids-read');
    expect(body).toContain('/blog/phonics-rules-for-beginners');
    expect(body).toContain('/phonics');
    expect(body).toContain('/curriculum');

    expect(body).not.toMatch(/weeks 1-3 improve taught-word accuracy/i);
    expect(body).not.toMatch(/weeks 4-6/i);
    expect(body).not.toMatch(/weeks 6-10/i);
    expect(body).not.toMatch(/6-8 weeks of consistent encoding practice/i);
    expect(body).not.toMatch(/5-6 focused words/i);
    expect(body).not.toContain('Choose classes that diagnose spelling error types');
    expect(body).not.toContain('For most children, yes. Dictation');
  });

  it('adds evidence, spelling-system boundaries and extractable encoding FAQs', () => {
    const post = bySlug.get('how-phonics-improves-spelling');
    expect(post).toBeDefined();

    const body = post?.body.map((block) => block.content).join('\n') || '';
    const evidence = getBlogEvidenceSummary(post!);

    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(5);
    expect(body).toContain('editorial teaching guidance, not a standardized spelling assessment or research protocol');
    expect(body).toContain('does not prescribe a research-defined daily word count or mastery timeline');
    expect(body).toContain('cannot diagnose dyslexia, dysgraphia or another condition');
    expect(body).toContain('morphology, roots, suffixes, homophones, word origins and word-specific conventions');

    expect(post?.faq).toHaveLength(5);
    expect(post?.faq?.some((item) => /read a word but still spell it incorrectly/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /what does encoding mean/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /phonically plausible spelling/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /dictation better than copying/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /move beyond basic phonics/i.test(item.question))).toBe(true);
  });
});
