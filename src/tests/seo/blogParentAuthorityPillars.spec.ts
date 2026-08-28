import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import {
  PARENT_AUTHORITY_PILLARS,
  PARENT_AUTHORITY_SLUGS,
  getParentAuthorityPillar,
  getParentAuthorityPosts,
} from '../../content/blog/shared/parentAuthorityPillars';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));
const repoRoot = process.cwd();

const EXPECTED_GSC = {
  'satpin-phonics-guide': [269, 15190],
  'phonics-for-parents-guide': [4, 934],
  'why-child-knows-letter-sounds-but-cannot-read-words': [8, 460],
  'child-knows-abc-but-cannot-read': [3, 134],
  'how-kids-learn-blending': [3, 239],
  'phonics-blending-activities': [0, 154],
  'how-to-improve-reading-fluency-in-children': [0, 102],
} as const;

function bodyText(slug: string) {
  const post = bySlug.get(slug);
  expect(post, `missing blog post: ${slug}`).toBeTruthy();
  return post!.body.map((block) => block.content).join('\n');
}

describe('B6 parent authority pillars', () => {
  it('keeps the isolated blog registry stable and defines exactly the seven GSC-prioritised authority URLs', () => {
    expect(blogPosts).toHaveLength(77);
    expect(PARENT_AUTHORITY_PILLARS).toHaveLength(7);
    expect(new Set(PARENT_AUTHORITY_SLUGS).size).toBe(7);
    expect(getParentAuthorityPosts(blogPosts)).toHaveLength(7);

    for (const pillar of PARENT_AUTHORITY_PILLARS) {
      expect(bySlug.has(pillar.slug), `authority slug missing from registry: ${pillar.slug}`).toBe(true);
      expect(pillar.gsc.window).toBe('3 months');
      expect(pillar.gsc.source).toBe('user-shared-gsc-2026-08-28');
      expect([pillar.gsc.clicks, pillar.gsc.impressions]).toEqual(
        EXPECTED_GSC[pillar.slug as keyof typeof EXPECTED_GSC],
      );
    }
  });

  it('protects SATPIN as the strongest authority URL without changing its primary title', () => {
    const satpin = bySlug.get('satpin-phonics-guide');
    expect(satpin?.title).toBe('SATPIN Phonics Guide for Parents: How to Start and What to Expect');
    expect(getParentAuthorityPillar('satpin-phonics-guide')?.role).toBe('protected-authority');
    expect(getParentAuthorityPillar('satpin-phonics-guide')?.changePolicy).toBe('protect');

    const text = bodyText('satpin-phonics-guide');
    expect(text).toContain('/blog/phonics-for-parents-guide');
    expect(text).toContain('/blog/why-child-knows-letter-sounds-but-cannot-read-words');
  });

  it('keeps the phonics parent guide on its dedicated research route and preserves a substantial evidence page', () => {
    const routes = fs.readFileSync(path.join(repoRoot, 'src/app/routes.tsx'), 'utf8');
    const dedicatedPage = fs.readFileSync(
      path.join(repoRoot, 'src/pages/blog/PhonicsForParentsResearchPage.tsx'),
      'utf8',
    );

    expect(routes).toContain("const PhonicsForParentsResearchPage = lazy(() => import('../pages/blog/PhonicsForParentsResearchPage'))");
    expect(routes).toContain("{ path: 'blog/phonics-for-parents-guide', element: <PhonicsForParentsResearchPage /> }");
    expect(dedicatedPage).toContain('Education Endowment Foundation');
    expect(dedicatedPage).toContain('National Reading Panel');
    expect(dedicatedPage).toContain('Reading Rockets');
    expect(dedicatedPage).toContain('International Dyslexia Association');
    expect(dedicatedPage).toContain('10-minute home routine');
  });

  it('keeps the two cannot-read diagnoses distinct and cross-links them instead of merging them', () => {
    const abc = bySlug.get('child-knows-abc-but-cannot-read');
    const sounds = bySlug.get('why-child-knows-letter-sounds-but-cannot-read-words');

    expect(abc?.title).toContain('Knows ABC');
    expect(sounds?.title).toContain('Know Letter Sounds');
    expect(getParentAuthorityPillar(abc!.slug)?.role).toBe('distinct-diagnostic');
    expect(getParentAuthorityPillar(sounds!.slug)?.role).toBe('diagnostic-owner');

    expect(bodyText(abc!.slug)).toContain('/blog/why-child-knows-letter-sounds-but-cannot-read-words');
    expect(bodyText(sounds!.slug)).toContain('/blog/child-knows-abc-but-cannot-read');
  });

  it('keeps blending explanation and blending activities as separate complementary intents', () => {
    const explainer = bySlug.get('how-kids-learn-blending');
    const activities = bySlug.get('phonics-blending-activities');

    expect(getParentAuthorityPillar(explainer!.slug)?.role).toBe('stage-explainer');
    expect(getParentAuthorityPillar(activities!.slug)?.role).toBe('practice-satellite');
    expect(explainer?.title).toContain('Stage-by-Stage');
    expect(activities?.title).toContain('Activities');

    expect(bodyText(explainer!.slug)).toContain('/blog/phonics-blending-activities');
    expect(bodyText(activities!.slug)).toContain('/blog/how-kids-learn-blending');
    expect(bodyText(explainer!.slug)).toContain('/blog/phonics-for-parents-guide');
    expect(bodyText(activities!.slug)).toContain('/blog/phonics-for-parents-guide');
  });

  it('evidence-hardens the letter-sounds diagnosis with direct reading sources and next-step links', () => {
    const text = bodyText('why-child-knows-letter-sounds-but-cannot-read-words');

    expect(text).toContain('educationendowmentfoundation.org.uk');
    expect(text).toContain('ies.ed.gov/ncee/wwc/PracticeGuide/21');
    expect(text).toContain('readingrockets.org/reading-101/reading-and-writing-basics/phonics-and-decoding');
    expect(text).toContain('/blog/how-to-improve-reading-fluency-in-children');
    expect(text).toContain('/blog/phonics-for-parents-guide');
    expect(text).toContain('/reading-classes-for-kids');
  });

  it('makes the fluency pillar accuracy- and meaning-first and removes unsupported fixed thresholds', () => {
    const fluency = bySlug.get('how-to-improve-reading-fluency-in-children');
    const text = bodyText(fluency!.slug);

    expect(fluency?.title).toBe('How to Improve Reading Fluency in Children: Accuracy, Phrasing and Meaning');
    expect(text).toContain('National Reading Panel');
    expect(text).toContain('ies.ed.gov/ncee/wwc/PracticeGuide/21');
    expect(text).toContain('Reading Rockets');
    expect(text).toContain('not a race against a timer');
    expect(text).toContain('/blog/why-child-knows-letter-sounds-but-cannot-read-words');
    expect(text).toContain('/blog/phonics-for-parents-guide');

    expect(text).not.toContain('80-150 word');
    expect(text).not.toContain('12-15 minute routine done consistently is more effective');
    expect(text).not.toContain('5-6 days per week');
    expect(text).not.toContain('after 6-8 weeks');
    expect(text).not.toContain('Timed repeated reading');
  });
});
