import { describe, expect, it } from 'vitest';
import {
  aggregateExternalTrafficDocs,
  normalizeExternalAnalyticsPath,
  previousEqualLengthRange,
} from '../src/externalTrafficAnalyticsCore';

describe('external traffic analytics core', () => {
  it('normalizes only Tiny Steps page paths and strips query/trailing slash noise', () => {
    expect(normalizeExternalAnalyticsPath('/blog/phonics-guide/?utm_source=test')).toBe('/blog/phonics-guide');
    expect(normalizeExternalAnalyticsPath('https://tinystepslearning.com/phonics/?a=1')).toBe('/phonics');
    expect(normalizeExternalAnalyticsPath('https://example.com/phonics')).toBeNull();
  });

  it('builds the immediately preceding equal-length comparison period', () => {
    expect(previousEqualLengthRange('2026-08-01', '2026-08-31')).toEqual({
      startDateKey: '2026-07-01',
      endDateKey: '2026-07-31',
    });
  });

  it('aggregates additive GA4/GSC metrics while weighting search position by impressions', () => {
    const aggregate = aggregateExternalTrafficDocs([
      {
        dateKey: '2026-09-01',
        ga4: {
          status: 'ok',
          syncedAt: '2026-09-02T01:00:00.000Z',
          sessions: 10,
          engagedSessions: 6,
          pages: [
            { path: '/blog/a', sessions: 7, engagedSessions: 5 },
            { path: '/phonics', sessions: 3, engagedSessions: 1 },
          ],
        },
        gsc: {
          status: 'ok',
          syncedAt: '2026-09-02T01:00:00.000Z',
          clicks: 4,
          impressions: 100,
          weightedPositionSum: 800,
          pages: [
            { path: '/blog/a', clicks: 3, impressions: 60, weightedPositionSum: 420 },
            { path: '/phonics', clicks: 1, impressions: 40, weightedPositionSum: 380 },
          ],
        },
      },
      {
        dateKey: '2026-09-02',
        ga4: {
          status: 'ok',
          syncedAt: '2026-09-02T08:00:00.000Z',
          partial: true,
          sessions: 5,
          engagedSessions: 2,
          pages: [{ path: '/blog/a', sessions: 5, engagedSessions: 2 }],
        },
        gsc: {
          status: 'ok',
          syncedAt: '2026-09-02T08:00:00.000Z',
          partial: true,
          clicks: 1,
          impressions: 20,
          weightedPositionSum: 240,
          pages: [{ path: '/blog/a', clicks: 1, impressions: 20, weightedPositionSum: 240 }],
        },
      },
    ], '2026-09-01', '2026-09-02');

    expect(aggregate.ga4).toMatchObject({
      coverageDays: 2,
      partialDays: 1,
      sessions: 15,
      engagedSessions: 8,
    });
    expect(aggregate.gsc).toMatchObject({
      coverageDays: 2,
      partialDays: 1,
      clicks: 5,
      impressions: 120,
    });
    expect(aggregate.gsc.averagePosition).toBeCloseTo(1040 / 120, 6);
    expect(aggregate.pages[0]).toMatchObject({
      path: '/blog/a',
      sessions: 12,
      engagedSessions: 7,
      clicks: 4,
      impressions: 80,
    });
    expect(aggregate.pages[0].averagePosition).toBeCloseTo(660 / 80, 6);
  });

  it('does not turn missing provider days into real zero coverage', () => {
    const aggregate = aggregateExternalTrafficDocs([
      {
        dateKey: '2026-09-01',
        ga4: {
          status: 'ok',
          syncedAt: '2026-09-02T01:00:00.000Z',
          sessions: 0,
          engagedSessions: 0,
          pages: [],
        },
      },
    ], '2026-09-01', '2026-09-02');

    expect(aggregate.expectedDays).toBe(2);
    expect(aggregate.ga4.coverageDays).toBe(1);
    expect(aggregate.ga4.sessions).toBe(0);
    expect(aggregate.gsc.coverageDays).toBe(0);
  });
});
