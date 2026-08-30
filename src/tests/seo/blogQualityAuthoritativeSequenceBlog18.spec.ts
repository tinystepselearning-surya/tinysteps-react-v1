import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('authoritative Blog #18 quality lock', () => {
  it('owns r-controlled vowel pattern groups, accent-aware confusions and practice order without imposing a universal sequence', () => {
    const post = bySlug.get('r-controlled-vowels-explained');
    expect(post).toBeDefined();
    expect(post?.title).toBe('R-Controlled Vowels Explained: Pattern Groups, Confusions, and Practice Order');
    expect(post?.author).toBe('Priya');
    expect(post?.date).toBe('2026-01-05');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('R-controlled vowels (also called **vowel-r patterns** or a **vowel-r syllable pattern**)');
    expect(body).toContain('hear the word → notice the vowel-r spelling → read it → spell it → contrast it → transfer it to a fresh word or text');
    expect(body).toContain('Accent matters more here than many parent phonics charts admit');
    expect(body).toContain('**rhotic** accents');
    expect(body).toContain('**non-rhotic** accents');
    expect(body).toContain('The five core spelling patterns parents usually meet');
    expect(body).toContain('AR — as in car, farm and dark');
    expect(body).toContain('OR — as in fork, corn and storm');
    expect(body).toContain('ER, IR and UR — a reading group that creates a spelling choice');
    expect(body).toContain('There is **no single research-defined order** requiring every child to learn ar first');
    expect(body).toContain('ar → or → er/ir/ur');
    expect(body).toContain('reading may be easier than spelling');
    expect(body).toContain('Five common r-controlled confusions and what they may mean');
    expect(body).toContain('The Tiny Steps “move ahead or review?” check for r-controlled vowels');

    expect(body).toContain('/blog/phonics-rules-for-beginners');
    expect(body).toContain('/blog/how-phonics-improves-spelling');
    expect(body).toContain('/blog/phonics-r-controlled');
    expect(body).toContain('/blog/long-vowel-sounds-for-kids');

    expect(body).not.toMatch(/keep practice focused on that group for several short sessions/i);
    expect(body).not.toMatch(/run a fixed loop/i);
    expect(body).not.toMatch(/must (?:always )?(?:start|begin) with ar/i);
    expect(body).not.toMatch(/can already read 30[–-]50 CVC words/i);
    expect(body).not.toMatch(/one family per week/i);
    expect(body).not.toMatch(/all (?:English )?accents? (?:pronounce|say).*er.*ir.*ur.*same/i);
    expect(body).not.toMatch(/(?:must|should|need(?:s)? to|has to|require(?:s|d)?|reach|achieve)[^.\n]{0,80}\b(?:90|95|100)%\s+(?:accuracy|mastery|correct)/i);
  });

  it('adds evidence, accent and diagnosis safeguards, practice-owner boundaries and five extractable FAQs', () => {
    const post = bySlug.get('r-controlled-vowels-explained');
    expect(post).toBeDefined();

    const body = post?.body.map((block) => block.content).join('\n') || '';
    const evidence = getBlogEvidenceSummary(post!);

    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(6);
    expect(body).toContain('accent-sensitive adaptation is legitimate');
    expect(body).toContain('Pronunciation differences caused by accent are not reading disorders');
    expect(body).toContain('is also not, by itself, evidence of dyslexia or another condition');
    expect(body).toContain('This article is educational guidance and cannot diagnose');
    expect(body).toContain('Blog #30, [R-Controlled Vowel Practice for Kids](/blog/phonics-r-controlled), is the practical activity owner');
    expect(body).toContain('The cited evidence supports explicit and systematic sound–spelling instruction');
    expect(body).toContain('does **not** establish one universal first r-controlled family');

    expect(post?.faq).toHaveLength(5);
    expect(post?.faq?.some((item) => /What are r-controlled vowels/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /Why are er, ir and ur confusing/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /Which r-controlled vowel should a child learn first/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /read r-controlled words but still misspell/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /all English accents pronounce r-controlled vowels the same way/i.test(item.question))).toBe(true);
  });
});
