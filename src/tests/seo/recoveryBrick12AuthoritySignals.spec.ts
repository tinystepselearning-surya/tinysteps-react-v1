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

const READING_OWNER_SLUGS = new Set([
  'prevent-summer-slide-reading',
  'phonics-comprehension',
]);

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

  it('routes SATPIN support into the SATPIN master before the commercial programme', () => {
    const body = renderedBody('phonics-satpin-launch');
    expect(body).toContain('/blog/satpin-phonics-guide');
    expect(body).toContain('/phonics');
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
      const body = renderedBody(slug);
      expect(
        body,
        `${slug} should reinforce the decoding diagnostic owner`,
      ).toContain('/blog/why-child-knows-letter-sounds-but-cannot-read-words');
      expect(body, `${slug} should still connect upward to /phonics`).toContain('/phonics');
    }
  });

  it('uses the broad parent guide as a discovery bridge into the two specialist authorities', () => {
    const body = renderedBody('phonics-for-parents-guide');
    expect(body).toContain('/blog/satpin-phonics-guide');
    expect(body).toContain('/blog/why-child-knows-letter-sounds-but-cannot-read-words');
    expect(body).toContain('/phonics');
  });

  it('keeps provider-decision support feeding the comparison owner rather than creating another buyer owner', () => {
    for (const slug of [
      'online-phonics-classes-vs-school',
      'why-parents-choose-online-phonics',
      'are-phonics-apps-enough-for-kids',
    ]) {
      const body = renderedBody(slug);
      expect(body).toContain('/best-online-phonics-classes-for-kids-in-india');
      expect(body).toContain('/phonics');
    }
  });

  it('keeps the established phonics knowledge set connected to the correct frozen programme owner', () => {
    for (const slug of PHONICS_AUTHORITY_SLUGS) {
      const body = renderedBody(slug);
      const expectedOwner = READING_OWNER_SLUGS.has(slug) ? '/reading-classes-for-kids' : '/phonics';
      expect(body, `${slug} lost its upward ${expectedOwner} authority signal`).toContain(expectedOwner);
    }
  });

  it('keeps Brick 12 reinforcement targeted instead of creating a blanket rule for every blog', () => {
    expect(Object.keys(SEO_RECOVERY_BRICK12_BLOG_RULES).length).toBeLessThan(PHONICS_AUTHORITY_SLUGS.length);
    expect(Object.keys(SEO_RECOVERY_BRICK12_BLOG_RULES)).toEqual(
      expect.arrayContaining([
        'phonics-satpin-launch',
        'phonics-for-parents-guide',
        'why-letter-sounds-are-not-enough-to-read',
      ]),
    );
  });
});
