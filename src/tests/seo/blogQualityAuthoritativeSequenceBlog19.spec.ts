import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));
const repoRoot = process.cwd();

const UNSUPPORTED_SATPIN_CLAIMS = [
  /\bSATPIN is (?:the )?(?:best|only) first (?:set|sequence|six sounds?)(?: for every child)?\b/i,
  /\bSATPIN is scientifically superior to (?:every|all|any) other starter (?:set|sequence)\b/i,
  /\bSATPIN is the only scientifically correct first sequence\b/i,
  /\bEvery child should start with SATPIN\b/i,
];

function isExplicitlyRejectedClaim(value: string, claimStart: number, claimEnd: number) {
  const prefix = value.slice(Math.max(0, claimStart - 120), claimStart);
  const suffix = value.slice(claimEnd, Math.min(value.length, claimEnd + 120));

  return (
    /\b(?:no|not any) evidence (?:that |to support )?$/i.test(prefix) ||
    /\b(?:does|do|did) not (?:show|establish|prove|support)\b[^.!?\n]{0,100}$/i.test(prefix) ||
    /^[^.!?\n]{0,40}[”"']?\s+is not(?:[.!?]|\s+(?:a )?(?:defensible|supported|evidence-based) claim\b)/i.test(suffix)
  );
}

function containsAffirmativeUnsupportedSatpinClaim(value: string) {
  return UNSUPPORTED_SATPIN_CLAIMS.some((pattern) => {
    const matches = value.matchAll(new RegExp(pattern.source, `${pattern.flags}g`));
    return Array.from(matches).some(
      (match) => !isExplicitlyRejectedClaim(value, match.index, match.index + match[0].length),
    );
  });
}

describe('authoritative Blog #19 quality lock', () => {
  it('owns the SATPIN starter-set explanation and progression decision without presenting SATPIN as a universal mandatory sequence', () => {
    const post = bySlug.get('satpin-phonics-guide');
    expect(post).toBeDefined();
    expect(post?.title).toBe('SATPIN Phonics Guide for Parents: How to Start and What to Expect');
    expect(post?.author).toBe('Priya');
    expect(post?.date).toBe('2025-11-06');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('SATPIN is a useful early phonics set, not a magic reading method');
    expect(body).toContain('**SATPIN** refers to the six letters **s, a, t, p, i and n**');
    expect(body).toContain('does **not** show that every child must begin with SATPIN');
    expect(body).toContain('hear the sound → connect sound and print → retrieve it → blend a word → segment and spell → transfer to a fresh word or short text');
    expect(body).toContain('Different phonics programmes may introduce these letters in a slightly different internal order');
    expect(body).toContain('A small set can create real words quickly');
    expect(body).toContain('Do children need to master all six SATPIN sounds before blending?');
    expect(body).toContain('**No.** Blending can begin as soon as the child knows enough taught correspondences to build a simple word');
    expect(body).toContain('Letter names and sounds both belong in alphabet knowledge');
    expect(body).toContain('Use blendable pronunciations');
    expect(body).toContain('A parent-friendly SATPIN start sequence');
    expect(body).toContain('What should SATPIN progress look like?');
    expect(body).toContain('Five common SATPIN difficulties and what to practise next');
    expect(body).toContain('When should a child move beyond SATPIN?');

    expect(body).toContain('/blog/phonics-rules-for-beginners');
    expect(body).toContain('/blog/phonics-games-for-letter-sounds');
    expect(body).toContain('/blog/how-kids-learn-blending');
    expect(body).toContain('/blog/phonics-blending-activities');
    expect(body).toContain('/blog/cvc-words-explained-for-parents');

    expect(body).not.toContain('pure sound mastery first');
    expect(body).not.toContain('Introduce SATPIN in small batches (1-2 sounds)');
    expect(body).not.toContain('Check weekly whether your child can decode');
    expect(body).not.toContain('across several sessions');
    expect(containsAffirmativeUnsupportedSatpinClaim(body)).toBe(false);
    expect(body).not.toMatch(/(?:must|should|need(?:s)? to|has to|require(?:s|d)?|reach|achieve)[^.\n]{0,80}\b(?:90|95|100)%\s+(?:accuracy|mastery|correct)/i);
  });

  it('rejects affirmative SATPIN overclaims while allowing explicit evidence limitations', () => {
    const unsupportedClaims = [
      'SATPIN is the best first set for every child.',
      'SATPIN is the only scientifically correct first sequence.',
      'SATPIN is scientifically superior to every other starter set.',
      'Every child should start with SATPIN.',
    ];
    const evidenceLimitations = [
      'SATPIN is not the best first set for every child.',
      'There is no evidence that SATPIN is scientifically superior to every other starter set.',
      '“SATPIN is the best first six sounds for every child” is not a defensible claim.',
    ];

    for (const claim of unsupportedClaims) {
      expect(containsAffirmativeUnsupportedSatpinClaim(claim), claim).toBe(true);
    }
    for (const limitation of evidenceLimitations) {
      expect(containsAffirmativeUnsupportedSatpinClaim(limitation), limitation).toBe(false);
    }
  });

  it('adds evidence, non-diagnostic safeguards, practical-owner boundaries and five extractable FAQs', () => {
    const post = bySlug.get('satpin-phonics-guide');
    expect(post).toBeDefined();

    const body = post?.body.map((block) => block.content).join('\n') || '';
    const evidence = getBlogEvidenceSummary(post!);

    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(6);
    expect(body).toContain('SATPIN at home: guide versus routine');
    expect(body).toContain('[SATPIN at Home: A Parent Launch Plan for Early Blending and Reading](/blog/phonics-satpin-launch)');
    const source = fs.readFileSync(
      path.join(repoRoot, 'src/content/blog/posts/phonics/satpin-phonics-guide.ts'),
      'utf8',
    );
    expect(source).toContain('Blog #22, [SATPIN at Home: A Parent Launch Plan for Early Blending and Reading](/blog/week-1-phonics-satpin-launch)');
    expect(body).toContain('This article is the **SATPIN explanation and progression owner**');
    expect(body).toContain('The evidence below supports **systematic and explicit sound–spelling teaching');
    expect(body).toContain('does **not** establish SATPIN as the single mandatory first set');
    expect(body).toContain('SATPIN difficulty is not, by itself, evidence of dyslexia');
    expect(body).toContain('This article provides educational guidance, not diagnosis');
    expect(body).toContain('[Tiny Steps Balloon Pop](/free-balloon-pop-phonics-game-for-kids?level=1)');
    expect(body).toContain('[Letter Tracing With Sounds](/letter-tracing-with-sounds-game)');
    expect(body).toContain('Neither game, by itself, proves that a child can blend SATPIN into words');

    expect(post?.faq).toHaveLength(5);
    expect(post?.faq?.some((item) => /What is SATPIN phonics/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /Why is SATPIN often taught early/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /all six SATPIN sounds before blending/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /ready to move beyond SATPIN/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /knows SATPIN sounds but cannot blend/i.test(item.question))).toBe(true);
  });
});
