import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import {
  SEO_RECOVERY_BRICK10_EXPERIMENTS,
  SEO_RECOVERY_BRICK10_GSC_RANGE,
  applySeoRecoveryBrick10CtrExperiment,
} from '../../config/seoRecoveryBrick10CtrExperiments';

describe('SEO recovery Brick 10 CTR experiments', () => {
  it('uses the finalized GSC baseline window and one controlled five-page batch', () => {
    expect(SEO_RECOVERY_BRICK10_GSC_RANGE).toEqual({
      startDate: '2026-08-13',
      endDate: '2026-09-09',
      comparisonStartDate: '2026-07-16',
      comparisonEndDate: '2026-08-12',
    });
    expect(SEO_RECOVERY_BRICK10_EXPERIMENTS).toHaveLength(5);
  });

  it('targets only the five approved low-CTR educational URLs', () => {
    expect(SEO_RECOVERY_BRICK10_EXPERIMENTS.map((experiment) => experiment.page)).toEqual([
      '/blog/satpin-phonics-guide',
      '/blog/long-vowel-sounds-for-kids',
      '/blog/grammar-conjunctions',
      '/blog/grammar-subject-verb',
      '/blog/digraphs-and-tricky-words',
    ]);
  });

  it('keeps experiment titles and descriptions concise and query-facing', () => {
    for (const experiment of SEO_RECOVERY_BRICK10_EXPERIMENTS) {
      expect(experiment.title.length, experiment.page).toBeLessThanOrEqual(65);
      expect(experiment.metaDescription.length, experiment.page).toBeGreaterThanOrEqual(100);
      expect(experiment.metaDescription.length, experiment.page).toBeLessThanOrEqual(160);
      expect(experiment.baseline.impressions, experiment.page).toBeGreaterThanOrEqual(150);
      expect(experiment.baseline.position, experiment.page).toBeLessThan(10);
    }
  });

  it('applies the experiment only after the public blog slug is established', () => {
    const conjunctions = blogPosts.find((post) => post.slug === 'grammar-conjunctions');
    const subjectVerb = blogPosts.find((post) => post.slug === 'grammar-subject-verb');
    const satpin = blogPosts.find((post) => post.slug === 'satpin-phonics-guide');

    expect(conjunctions?.title).toBe('Conjunctions for Kids: And, But, Because & So Examples');
    expect(conjunctions?.metaDescription).toContain('and, but, because and so examples');
    expect(subjectVerb?.title).toBe('Subject-Verb Agreement for Kids: Rules, Examples & Mistakes');
    expect(subjectVerb?.metaDescription).toContain('is/are and has/have');
    expect(satpin?.title).toBe('SATPIN Phonics Guide: Sounds, Order, Words & Blending');
    expect(satpin?.metaDescription).toContain('SATPIN order');
  });

  it('does not mutate pages outside the Brick 10 experiment set', () => {
    const post = {
      slug: 'why-child-knows-letter-sounds-but-cannot-read-words',
      title: 'Original title',
      category: 'Parent Tips' as const,
      author: 'Priya',
      date: '2026-05-15',
      readTime: '20 min read',
      excerpt: 'Original excerpt',
      body: [],
    };

    expect(applySeoRecoveryBrick10CtrExperiment(post)).toBe(post);
  });
});
