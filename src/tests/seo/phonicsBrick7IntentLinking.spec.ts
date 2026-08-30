import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import {
  B7_BEST_PHONICS_DECISION_GUIDES,
  B7_BLOG_AUTHORITY_PLANS,
  B7_PHONICS_FEATURED_GUIDES,
  getBlogAuthorityPlan,
} from '../../content/blog/shared/authorityLinking';

const PHONICS = '/phonics';
const BEST_PHONICS = '/best-online-phonics-classes-for-kids-in-india';
const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

function finalBody(slug: string) {
  const post = bySlug.get(slug);
  expect(post, `missing blog ${slug}`).toBeDefined();
  return post?.body.map((block) => block.content).join('\n') ?? '';
}

describe('Phonics Brick 7 intent-aware internal linking', () => {
  it('maps exactly Blogs 1-51 in the founder-approved sequence', () => {
    expect(B7_BLOG_AUTHORITY_PLANS).toHaveLength(51);
    expect(B7_BLOG_AUTHORITY_PLANS.map((plan) => plan.number)).toEqual(
      Array.from({ length: 51 }, (_, index) => index + 1),
    );
    expect(new Set(B7_BLOG_AUTHORITY_PLANS.map((plan) => plan.slug)).size).toBe(51);

    for (const plan of B7_BLOG_AUTHORITY_PLANS) {
      expect(bySlug.has(plan.slug), `Blog #${plan.number} slug must resolve: ${plan.slug}`).toBe(true);
    }
  });

  it('connects every pure-phonics Blog 1-34 to the main phonics authority or the dedicated comparison owner', () => {
    for (const plan of B7_BLOG_AUTHORITY_PLANS.filter((item) => item.number <= 34)) {
      const destinations = [plan.primary.to, plan.secondary?.to].filter(Boolean);
      expect(
        destinations.includes(PHONICS) || destinations.includes(BEST_PHONICS),
        `Blog #${plan.number} must support a phonics authority page`,
      ).toBe(true);
    }
  });

  it('reserves the best-phonics commercial owner for genuinely comparison-oriented articles', () => {
    const bestLinkedNumbers = B7_BLOG_AUTHORITY_PLANS
      .filter((plan) => plan.primary.to === BEST_PHONICS || plan.secondary?.to === BEST_PHONICS)
      .map((plan) => plan.number);

    expect(bestLinkedNumbers).toEqual([10, 12, 34, 35]);
    expect(bestLinkedNumbers).not.toContain(33);
    expect(bestLinkedNumbers).not.toContain(47);
    expect(bestLinkedNumbers.length).toBeLessThan(6);
  });

  it('routes parent Blogs 35-51 by the actual child or parent need instead of forcing phonics everywhere', () => {
    expect(getBlogAuthorityPlan('are-phonics-apps-enough-for-kids')?.primary.to).toBe(BEST_PHONICS);
    expect(getBlogAuthorityPlan('child-gives-one-word-answers')?.primary.to).toBe('/speaking');
    expect(getBlogAuthorityPlan('child-knows-grammar-but-makes-mistakes')?.primary.to).toBe('/grammar');
    expect(getBlogAuthorityPlan('child-reads-in-class-but-forgets-at-home')?.primary.to).toBe('/reading-classes-for-kids');
    expect(getBlogAuthorityPlan('child-understands-english-but-does-not-speak')?.primary.to).toBe('/speaking');
    expect(getBlogAuthorityPlan('how-to-improve-sentence-formation-in-kids')?.primary.to).toBe('/grammar');
    expect(getBlogAuthorityPlan('online-english-classes-for-kids-india')?.primary.to).toBe('/courses');
    expect(getBlogAuthorityPlan('screen-smart-summer-routine-for-kids')?.primary.to).toBe('/parents');
    expect(getBlogAuthorityPlan('why-child-knows-letter-sounds-but-cannot-read-words')?.primary.to).toBe(PHONICS);
    expect(getBlogAuthorityPlan('why-child-reads-words-but-does-not-understand-story')?.primary.to).toBe('/reading-classes-for-kids');
  });

  it('ensures each mapped article contains its primary next-step route after normalization', () => {
    for (const plan of B7_BLOG_AUTHORITY_PLANS) {
      expect(finalBody(plan.slug), `Blog #${plan.number} primary destination`).toContain(`(${plan.primary.to})`);
    }
  });

  it('does not duplicate an authority route when the article already contains it', () => {
    for (const plan of B7_BLOG_AUTHORITY_PLANS) {
      const body = finalBody(plan.slug);
      const nextStepHeadingCount = (
        body.match(/Where this fits in the learning pathway|Compare the next step before you decide|Choose the next step from the skill gap|Choose the next reading step|Choose the next grammar step|Choose the next speaking step|Keep the next step practical|Choose the next English learning step/g) ?? []
      ).length;
      expect(nextStepHeadingCount).toBeLessThanOrEqual(1);
    }
  });

  it('keeps reverse-link recommendations curated instead of dumping the 51-blog inventory', () => {
    expect(B7_PHONICS_FEATURED_GUIDES).toHaveLength(8);
    expect(B7_BEST_PHONICS_DECISION_GUIDES).toHaveLength(6);
    expect(new Set(B7_PHONICS_FEATURED_GUIDES).size).toBe(B7_PHONICS_FEATURED_GUIDES.length);
    expect(new Set(B7_BEST_PHONICS_DECISION_GUIDES).size).toBe(B7_BEST_PHONICS_DECISION_GUIDES.length);

    for (const slug of [...B7_PHONICS_FEATURED_GUIDES, ...B7_BEST_PHONICS_DECISION_GUIDES]) {
      expect(getBlogAuthorityPlan(slug)).not.toBeNull();
    }
  });
});
