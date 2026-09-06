import { describe, expect, it } from 'vitest';
import type { ExternalTrafficPeriod } from '../../lib/externalTrafficAnalytics';
import type { BlogLeadAttributionSummary } from '../../pages/admin/blogLeadAttributionAnalytics';
import {
  buildContentSeoArticleRows,
  summarizeBlogTraffic,
  summarizeContentSeoSignals,
} from '../../pages/admin/contentSeoAnalytics';

const period = (pages: ExternalTrafficPeriod['pages']): ExternalTrafficPeriod => ({
  startDateKey: '2026-09-01',
  endDateKey: '2026-09-02',
  expectedDays: 2,
  ga4: {
    coverageDays: 2,
    partialDays: 0,
    truncatedDays: 0,
    sessions: pages.reduce((sum, row) => sum + row.sessions, 0),
    engagedSessions: pages.reduce((sum, row) => sum + row.engagedSessions, 0),
  },
  gsc: {
    coverageDays: 2,
    partialDays: 0,
    truncatedDays: 0,
    clicks: pages.reduce((sum, row) => sum + row.clicks, 0),
    impressions: pages.reduce((sum, row) => sum + row.impressions, 0),
    weightedPositionSum: pages.reduce((sum, row) => sum + ((row.averagePosition || 0) * row.impressions), 0),
    averagePosition: null,
  },
  pages,
});

const summary = (
  rows: BlogLeadAttributionSummary['articleRows'],
): BlogLeadAttributionSummary => ({
  uniqueBlogLeadCount: new Set(rows.flatMap((row) => row.leadIds)).size,
  firstTouchBlogLeadCount: 0,
  influencedBlogLeadCount: 0,
  crossArticleJourneyCount: 0,
  demoCreatedCount: rows.reduce((sum, row) => sum + row.demoCreatedCount, 0),
  demoCompletedCount: rows.reduce((sum, row) => sum + row.demoCompletedCount, 0),
  enrolledCount: rows.reduce((sum, row) => sum + row.enrolledCount, 0),
  articleRows: rows,
});

const article = (
  slug: string,
  leadCount: number,
  demoCompletedCount: number,
  enrolledCount: number,
): BlogLeadAttributionSummary['articleRows'][number] => ({
  slug,
  leadCount,
  firstTouchCount: leadCount,
  influencedCount: 0,
  demoCreatedCount: leadCount,
  demoCompletedCount,
  enrolledCount,
  leadIds: Array.from({ length: leadCount }, (_value, index) => `${slug}-${index}`),
  familyCounts: {},
  ctaPositionCounts: {},
});

describe('Brick 7 Content & SEO analytics', () => {
  it('joins blog traffic/search with business attribution without collapsing metric grains', () => {
    const current = period([
      {
        path: '/blog/article-a',
        sessions: 150,
        engagedSessions: 105,
        clicks: 24,
        impressions: 1200,
        averagePosition: 6,
      },
    ]);
    const previous = period([
      {
        path: '/blog/article-a',
        sessions: 100,
        engagedSessions: 65,
        clicks: 18,
        impressions: 800,
        averagePosition: 8,
      },
    ]);

    const rows = buildContentSeoArticleRows(
      current,
      previous,
      summary([article('article-a', 4, 2, 1)]),
      summary([article('article-a', 2, 1, 0)]),
      ['article-a', 'article-zero'],
    );

    const articleA = rows.find((row) => row.slug === 'article-a');
    const zero = rows.find((row) => row.slug === 'article-zero');
    expect(articleA).toBeTruthy();
    expect(articleA?.current.sessions).toBe(150);
    expect(articleA?.current.leads).toBe(4);
    expect(articleA?.sessionChangePct).toBe(50);
    expect(articleA?.positionImprovement).toBe(2);
    expect(articleA?.signals).toContain('converting');
    expect(articleA?.signals).toContain('traffic_rising');
    expect(articleA?.signals).toContain('visibility_rising');
    expect(articleA?.signals).toContain('ranking_gain');

    expect(zero?.signals).toEqual(['no_measurement']);
    expect(zero?.current.leads).toBe(0);
    expect(zero?.current.sessions).toBe(0);
  });

  it('surfaces decline and CTR opportunities with low-volume safeguards', () => {
    const rows = buildContentSeoArticleRows(
      period([
        {
          path: '/blog/declining',
          sessions: 60,
          engagedSessions: 30,
          clicks: 10,
          impressions: 1000,
          averagePosition: 9,
        },
        {
          path: '/blog/tiny',
          sessions: 2,
          engagedSessions: 1,
          clicks: 1,
          impressions: 10,
          averagePosition: 15,
        },
      ]),
      period([
        {
          path: '/blog/declining',
          sessions: 100,
          engagedSessions: 60,
          clicks: 20,
          impressions: 1000,
          averagePosition: 7,
        },
        {
          path: '/blog/tiny',
          sessions: 1,
          engagedSessions: 1,
          clicks: 0,
          impressions: 5,
          averagePosition: 16,
        },
      ]),
      summary([]),
      summary([]),
    );

    const declining = rows.find((row) => row.slug === 'declining');
    const tiny = rows.find((row) => row.slug === 'tiny');
    expect(declining?.signals).toContain('traffic_declining');
    expect(declining?.signals).toContain('ctr_opportunity');
    expect(declining?.signals).toContain('ranking_decline');
    expect(tiny?.signals).not.toContain('traffic_rising');

    const signalSummary = summarizeContentSeoSignals(rows);
    expect(signalSummary.decliners).toBe(1);
    expect(signalSummary.ctrOpportunities).toBe(1);

    const totals = summarizeBlogTraffic(rows, 'current');
    expect(totals.sessions).toBe(62);
    expect(totals.impressions).toBe(1010);
  });
});
