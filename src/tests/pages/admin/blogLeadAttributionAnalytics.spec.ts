import { describe, expect, it } from 'vitest';
import {
  aggregateBlogLeadAttribution,
  blogAttributionModeForSlug,
  blogSlugFromLandingPage,
  resolveBlogLeadAttributionCredit,
} from '../../../pages/admin/blogLeadAttributionAnalytics';

describe('blog lead attribution analytics', () => {
  it('recognizes article landing pages without treating the blog index as an article', () => {
    expect(blogSlugFromLandingPage('/blog/how-kids-learn-blending?utm_source=google')).toBe(
      'how-kids-learn-blending',
    );
    expect(blogSlugFromLandingPage('https://tinystepslearning.com/blog/phonics-for-parents-guide#cta')).toBe(
      'phonics-for-parents-guide',
    );
    expect(blogSlugFromLandingPage('/blog/')).toBeNull();
    expect(blogSlugFromLandingPage('/blog')).toBeNull();
    expect(blogSlugFromLandingPage('/phonics')).toBeNull();
  });

  it('keeps first-touch and later blog influence as separate evidence', () => {
    const credit = resolveBlogLeadAttributionCredit({
      id: 'lead-1',
      landingPage: '/blog/phonics-for-parents-guide',
      sourceDetail: 'blog|child-gives-one-word-answers|speaking-confidence|inline',
    });

    expect(credit).toEqual({
      firstTouchSlug: 'phonics-for-parents-guide',
      influencedSlug: 'child-gives-one-word-answers',
      family: 'speaking-confidence',
      ctaPosition: 'inline',
    });
    expect(blogAttributionModeForSlug(credit!, 'phonics-for-parents-guide')).toBe('first_touch');
    expect(blogAttributionModeForSlug(credit!, 'child-gives-one-word-answers')).toBe('influenced');
  });

  it('deduplicates blog leads while allowing explicit cross-article credit', () => {
    const summary = aggregateBlogLeadAttribution([
      {
        id: 'lead-a',
        landingPage: '/blog/article-a',
        sourceDetail: 'blog|article-a|phonics-practice|hero',
        status: 'demo_completed',
        demoSessionId: 'demo-a',
      },
      {
        id: 'lead-b',
        landingPage: '/blog/article-a',
        status: 'admitted_confirmed',
        demoSessionId: 'demo-b',
      },
      {
        id: 'lead-c',
        landingPage: '/phonics',
        sourceDetail: 'blog|article-b|speaking-confidence|footer',
        status: 'demo_pending_schedule',
        demoSessionId: 'demo-c',
      },
      {
        id: 'lead-d',
        landingPage: '/blog/article-a',
        sourceDetail: 'blog|article-b|speaking-confidence|inline',
        status: 'admitted_confirmed',
        demoSessionId: 'demo-d',
      },
      // Duplicate input must not double count the same lead.
      {
        id: 'lead-d',
        landingPage: '/blog/article-a',
        sourceDetail: 'blog|article-b|speaking-confidence|inline',
        status: 'admitted_confirmed',
        demoSessionId: 'demo-d',
      },
    ]);

    expect(summary.uniqueBlogLeadCount).toBe(4);
    expect(summary.firstTouchBlogLeadCount).toBe(3);
    expect(summary.influencedBlogLeadCount).toBe(3);
    expect(summary.crossArticleJourneyCount).toBe(1);
    expect(summary.demoCreatedCount).toBe(4);
    expect(summary.demoCompletedCount).toBe(3);
    expect(summary.enrolledCount).toBe(2);

    const articleA = summary.articleRows.find((row) => row.slug === 'article-a');
    const articleB = summary.articleRows.find((row) => row.slug === 'article-b');

    expect(articleA).toMatchObject({
      leadCount: 3,
      firstTouchCount: 3,
      influencedCount: 1,
      demoCompletedCount: 3,
      enrolledCount: 2,
    });
    expect(articleB).toMatchObject({
      leadCount: 2,
      firstTouchCount: 0,
      influencedCount: 2,
      demoCompletedCount: 1,
      enrolledCount: 1,
    });
    expect(articleB?.familyCounts['speaking-confidence']).toBe(2);
    expect(articleB?.ctaPositionCounts.inline).toBe(1);
    expect(articleB?.ctaPositionCounts.footer).toBe(1);

    // One cross-article lead can appear in two article rows, while the summary remains lead-unique.
    expect(summary.articleRows.reduce((total, row) => total + row.leadCount, 0)).toBe(5);
  });
});
