import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));
const repoRoot = process.cwd();

const AFFIRMATIVE_ONE_FAMILY_PER_WEEK_CLAIMS = [
  /\b(?:teach|practise|practice|study|cover|complete) one family per week\b/i,
  /\b(?:must|should|need(?:s)? to|has to|required to)\b[^.!?\n]{0,80}\bone family per week\b/i,
  /\bone family per week\b[^.!?\n]{0,60}\b(?:is|remains)\b[^.!?\n]{0,40}\b(?:required|mandatory|best|ideal|correct)\b/i,
];

function isExplicitlyRejectedWeeklyClaim(value: string, claimStart: number, claim: string) {
  const prefix = value.slice(Math.max(0, claimStart - 120), claimStart);

  return (
    /\b(?:do|does|did) not\s+$/i.test(prefix) ||
    /\b(?:no evidence|no research (?:rule|requirement))\b[^.!?\n]{0,100}$/i.test(prefix) ||
    /\b(?:is|are) not\b/i.test(claim)
  );
}

function containsAffirmativeOneFamilyPerWeekClaim(value: string) {
  return AFFIRMATIVE_ONE_FAMILY_PER_WEEK_CLAIMS.some((pattern) => {
    const matches = value.matchAll(new RegExp(pattern.source, `${pattern.flags}g`));
    return Array.from(matches).some(
      (match) => !isExplicitlyRejectedWeeklyClaim(value, match.index, match[0]),
    );
  });
}

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
    expect(containsAffirmativeOneFamilyPerWeekClaim(body)).toBe(false);
    expect(body).not.toMatch(/all (?:English )?accents? (?:pronounce|say).*er.*ir.*ur.*same/i);
    expect(body).not.toMatch(/(?:must|should|need(?:s)? to|has to|require(?:s|d)?|reach|achieve)[^.\n]{0,80}\b(?:90|95|100)%\s+(?:accuracy|mastery|correct)/i);
  });

  it('rejects affirmative one-family-per-week rules while allowing explicit evidence limitations', () => {
    const unsupportedClaims = [
      'Teach one family per week.',
      'Every child should cover one family per week.',
      'One family per week is the required sequence.',
    ];
    const evidenceLimitations = [
      'Do not use a fixed rule such as “one family per week”.',
      'Do not teach one family per week.',
      'There is no research requirement to teach one family per week.',
      'One family per week is not a mandatory timetable.',
    ];

    for (const claim of unsupportedClaims) {
      expect(containsAffirmativeOneFamilyPerWeekClaim(claim), claim).toBe(true);
    }
    for (const limitation of evidenceLimitations) {
      expect(containsAffirmativeOneFamilyPerWeekClaim(limitation), limitation).toBe(false);
    }
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
    expect(body).toContain('[R-Controlled Vowel Practice for Kids](/blog/phonics-r-controlled), is the practical activity owner');
    const source = fs.readFileSync(
      path.join(repoRoot, 'src/content/blog/posts/phonics/r-controlled-vowels-explained.ts'),
      'utf8',
    );
    expect(source).toContain('Blog #30, [R-Controlled Vowel Practice for Kids](/blog/phonics-r-controlled), is the practical activity owner');
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
