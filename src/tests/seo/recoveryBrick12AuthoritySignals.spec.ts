import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { PHONICS_AUTHORITY_SLUGS } from '../../lib/phonicsAuthorityRoutes.js';
import {
  SEO_RECOVERY_BRICK12_AUTHORITY_NODES,
  SEO_RECOVERY_BRICK12_BLOG_RULES,
  SEO_RECOVERY_BRICK12_OWNER_EDGES,
} from '../../config/seoRecoveryBrick12AuthoritySignals';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const renderedBody = (slug: string) => {
  const post = blogPosts.find((candidate) => candidate.slug === slug);
  expect(post, `missing rendered blog post ${slug}`).toBeTruthy();
  return post!.body.map((block) => String(block.content || '')).join('\n');
};

describe('SEO recovery Brick 12 authority signals', () => {
  it('locks the recovery hierarchy into one Tier A, two Tier B and three Tier C owners', () => {
    expect(SEO_RECOVERY_BRICK12_AUTHORITY_NODES).toMatchObject({
      phonicsProgramme: { path: '/phonics', tier: 'A' },
      phonicsComparison: { path: '/best-online-phonics-classes-for-kids-in-india', tier: 'B' },
      phonicsFees: { path: '/phonics-fees-india', tier: 'B' },
      satpinMaster: { path: '/blog/satpin-phonics-guide', tier: 'C' },
      parentDecodingDiagnostic: {
        path: '/blog/why-child-knows-letter-sounds-but-cannot-read-words',
        tier: 'C',
      },
      tracingOwner: { path: '/free-letter-tracing-game-for-kids', tier: 'C' },
    });

    const tiers = Object.values(SEO_RECOVERY_BRICK12_AUTHORITY_NODES).map((node) => node.tier);
    expect(tiers.filter((tier) => tier === 'A')).toHaveLength(1);
    expect(tiers.filter((tier) => tier === 'B')).toHaveLength(2);
    expect(tiers.filter((tier) => tier === 'C')).toHaveLength(3);
  });

  it('keeps the owner-page authority graph reciprocal where the recovery plan requires it', () => {
    const phonics = read('src/pages/phonics.tsx');
    const comparison = read('src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx');
    const fees = read('src/pages/public/PhonicsFeesIndiaPage.tsx');
    const satpin = read('src/content/blog/posts/phonics/satpin-phonics-guide.ts');
    const diagnostic = read(
      'src/content/blog/posts/parent-tips/why-child-knows-letter-sounds-but-cannot-read-words.ts',
    );
    const tracing = read('src/pages/public/FreeLetterTracingGamePage.tsx');

    const sourceByPath: Record<string, string> = {
      '/phonics': phonics,
      '/best-online-phonics-classes-for-kids-in-india': comparison,
      '/phonics-fees-india': fees,
      '/blog/satpin-phonics-guide': satpin,
      '/blog/why-child-knows-letter-sounds-but-cannot-read-words': diagnostic,
      '/free-letter-tracing-game-for-kids': tracing,
    };

    for (const edge of SEO_RECOVERY_BRICK12_OWNER_EDGES) {
      expect(
        sourceByPath[edge.from],
        `Brick 12 owner source missing for ${edge.from}`,
      ).toContain(edge.to);
    }
  });

  it('routes SATPIN support into the SATPIN master', () => {
    expect(renderedBody('phonics-satpin-launch')).toContain('/blog/satpin-phonics-guide');
  });

  it('routes blending and decoding support into the parent diagnostic authority', () => {
    for (const slug of [
      'how-kids-learn-blending',
      'phonics-blending-activities',
      'phonics-blending-club',
      'cvc-words-explained-for-parents',
      'phonics-diagnostics',
      'why-letter-sounds-are-not-enough-to-read',
    ]) {
      expect(
        renderedBody(slug),
        `${slug} should reinforce the decoding diagnostic owner`,
      ).toContain('/blog/why-child-knows-letter-sounds-but-cannot-read-words');
    }
  });

  it('preserves the dedicated broad parent-guide route instead of layering a second rendering contract onto it', () => {
    const dedicatedPage = read('src/pages/blog/PhonicsForParentsResearchPage.tsx');
    const parentGuide = read('src/content/blog/posts/research/phonics-for-parents-guide.ts');

    expect(dedicatedPage).toContain("import post from '../../content/blog/posts/research/phonics-for-parents-guide'");
    expect(parentGuide).toContain('/blog/why-child-knows-letter-sounds-but-cannot-read-words');
    expect(parentGuide).toContain('/phonics');
    expect(SEO_RECOVERY_BRICK12_BLOG_RULES).not.toHaveProperty('phonics-for-parents-guide');
  });

  it('keeps provider-decision support feeding the comparison owner', () => {
    for (const slug of [
      'online-phonics-classes-vs-school',
      'why-parents-choose-online-phonics',
      'are-phonics-apps-enough-for-kids',
    ]) {
      expect(renderedBody(slug)).toContain('/best-online-phonics-classes-for-kids-in-india');
    }
  });

  it('keeps the existing C7 commercial handoff layer ahead of Brick 12 specialist reinforcement', () => {
    const blogIndex = read('src/content/blog/index.ts');
    const c7Position = blogIndex.indexOf('applyCommercialC7ContextualHandoffs(ctrTestedPost)');
    const brick12Position = blogIndex.indexOf('applySeoRecoveryBrick12AuthoritySignals(contextualLinkedPost)');

    expect(c7Position).toBeGreaterThan(-1);
    expect(brick12Position).toBeGreaterThan(c7Position);
  });

  it('does not use Brick 12 to add programme, fee or assessment CTAs to supporting articles', () => {
    const protectedCommercialDestinations = new Set([
      '/phonics',
      '/phonics-fees-india',
      '/book-demo',
      '/pricing',
    ]);

    for (const rule of Object.values(SEO_RECOVERY_BRICK12_BLOG_RULES)) {
      for (const signal of rule.signals) {
        expect(protectedCommercialDestinations.has(signal.to)).toBe(false);
      }
    }
  });

  it('keeps Brick 12 reinforcement targeted instead of creating a blanket rule for every phonics article', () => {
    expect(Object.keys(SEO_RECOVERY_BRICK12_BLOG_RULES).length).toBeLessThan(PHONICS_AUTHORITY_SLUGS.length);
    expect(Object.keys(SEO_RECOVERY_BRICK12_BLOG_RULES)).toEqual(
      expect.arrayContaining([
        'phonics-satpin-launch',
        'how-kids-learn-blending',
        'why-letter-sounds-are-not-enough-to-read',
      ]),
    );
  });
});
