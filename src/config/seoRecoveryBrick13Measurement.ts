export type SeoRecoveryBrick13Bucket = 'revenue' | 'qualified-informational' | 'traffic';

export const SEO_RECOVERY_BRICK13_GSC_BASELINE = Object.freeze({
  siteUrl: 'https://tinystepslearning.com/',
  current: Object.freeze({
    startDate: '2026-08-13',
    endDate: '2026-09-09',
    finalized: true,
    clicks: 3490,
    impressions: 46626,
    ctr: 0.07485094153476601,
    position: 8.002638013125724,
  }),
  comparison: Object.freeze({
    startDate: '2026-07-16',
    endDate: '2026-08-12',
    finalized: true,
    clicks: 1794,
    impressions: 35296,
    ctr: 0.05082728921124207,
    position: 7.158346554850408,
  }),
  finalizationLagDaysApprox: 3,
  source: 'Google Search Console planning connector — finalized data pulled 2026-09-12',
});

export const SEO_RECOVERY_BRICK13_BUCKETS = Object.freeze({
  revenue: Object.freeze({
    purpose: 'Measure search demand that can reasonably lead to a programme, price, comparison or assessment decision.',
    pages: Object.freeze([
      '/phonics',
      '/best-online-phonics-classes-for-kids-in-india',
      '/phonics-fees-india',
      '/pricing',
      '/book-demo',
      '/reading-classes-for-kids',
      '/grammar',
      '/speaking',
      '/online-english-classes-for-kids',
    ]),
    queryFamilies: Object.freeze([
      'phonics classes',
      'phonics classes online',
      'online phonics classes',
      'online phonics classes for kids',
      'phonics online classes',
      'best phonics classes online',
      'best online phonics classes',
      'phonics fees / cost / price',
    ]),
    primaryMetrics: Object.freeze(['qualified leads', 'demos', 'admissions', 'clicks', 'CTR', 'position']),
  }),
  'qualified-informational': Object.freeze({
    purpose: 'Measure informational search that indicates a real parent problem, learning-stage question or provider-research need.',
    pages: Object.freeze([
      '/blog/satpin-phonics-guide',
      '/blog/phonics-for-parents-guide',
      '/blog/why-child-knows-letter-sounds-but-cannot-read-words',
      '/blog/child-knows-abc-but-cannot-read',
      '/blog/how-kids-learn-blending',
      '/blog/cvc-words-explained-for-parents',
      '/blog/long-vowel-sounds-for-kids',
    ]),
    queryFamilies: Object.freeze([
      'satpin / satpin phonics / satpin method / satpin order / satpin words / satpin reading',
      'child knows letter sounds but cannot read words',
      'child knows abc but cannot read',
      'how kids learn blending / blending difficulty',
      'cvc words',
      'long vowel sounds',
    ]),
    primaryMetrics: Object.freeze(['clicks', 'impressions', 'CTR', 'position', 'assisted leads']),
  }),
  traffic: Object.freeze({
    purpose: 'Measure high-volume discovery/free-resource traffic separately so it cannot hide weakness in commercial SEO.',
    pages: Object.freeze([
      '/free-letter-tracing-game-for-kids',
      '/letter-tracing-with-sounds-game',
      '/free-english-games-for-kids',
      '/free-phonics-games-for-kids',
      '/free-word-building-game-for-kids',
    ]),
    queryFamilies: Object.freeze([
      'abc tracing',
      'letter tracing',
      'letter tracing online',
      'tracing games',
      'alphabet tracing',
      'tracing letters',
    ]),
    primaryMetrics: Object.freeze(['clicks', 'impressions', 'CTR', 'position']),
  }),
} satisfies Record<SeoRecoveryBrick13Bucket, unknown>);

export const SEO_RECOVERY_BRICK13_PRIORITY_GSC_BASELINES = Object.freeze([
  { bucket: 'traffic', page: '/free-letter-tracing-game-for-kids', clicks: 1931, impressions: 19975, ctr: 0.09667083854818523, position: 6.81171464330413 },
  { bucket: 'revenue', page: '/phonics', clicks: 128, impressions: 3966, ctr: 0.03227433182047403, position: 5.14750378214826 },
  { bucket: 'qualified-informational', page: '/blog/satpin-phonics-guide', clicks: 83, impressions: 6907, ctr: 0.012016794556247285, position: 7.910235992471406 },
  { bucket: 'revenue', page: '/best-online-phonics-classes-for-kids-in-india', clicks: 20, impressions: 1158, ctr: 0.017271157167530225, position: 12.358376511226252 },
  { bucket: 'revenue', page: '/pricing', clicks: 8, impressions: 929, ctr: 0.008611410118406888, position: 4.346609257265877 },
  { bucket: 'revenue', page: '/phonics-fees-india', clicks: 2, impressions: 129, ctr: 0.015503875968992248, position: 7.1937984496124034 },
] as const);

export const SEO_RECOVERY_BRICK13_REVENUE_QUERY_BASELINES = Object.freeze([
  { query: 'phonics classes', clicks: 4, impressions: 646, ctr: 0.006191950464396285, position: 5.746130030959752 },
  { query: 'phonics classes online', clicks: 6, impressions: 174, ctr: 0.034482758620689655, position: 6.350574712643678 },
  { query: 'online phonics classes', clicks: 3, impressions: 104, ctr: 0.028846153846153848, position: 12.923076923076923 },
  { query: 'online phonics classes for kids', clicks: 2, impressions: 114, ctr: 0.017543859649122806, position: 8.385964912280702 },
  { query: 'phonics online classes', clicks: 3, impressions: 61, ctr: 0.04918032786885246, position: 9.62295081967213 },
  { query: 'best phonics classes online', clicks: 5, impressions: 162, ctr: 0.030864197530864196, position: 3.2098765432098766 },
] as const);

export const SEO_RECOVERY_BRICK13_ATTRIBUTION = Object.freeze({
  august2026: Object.freeze({
    period: '2026-08-01 to 2026-08-31',
    timezone: 'Asia/Kolkata',
    leads: 161,
    attributionCoverage: 121,
    attributionCoverageRate: 0.75,
    reachedDemo: 156,
    admitted: 8,
    channels: Object.freeze({
      chatgpt: { leads: 66, demo: 66, admitted: 4 },
      googleOrganic: { leads: 40, demo: 40, admitted: 2 },
      legacyUnattributed: { leads: 31, demo: 26, admitted: 0 },
      directUnknown: { leads: 14, demo: 14, admitted: 2 },
      whatsappLegacy: { leads: 9, demo: 9, admitted: 0 },
      referral: { leads: 1, demo: 1, admitted: 0 },
    }),
    selectedLandingPages: Object.freeze({
      '/phonics': { leads: 30, demo: 30, admitted: 1 },
      '/': { leads: 20, demo: 20, admitted: 2 },
      '/best-online-phonics-classes-for-kids-in-india': { leads: 9, demo: 9, admitted: 0 },
      '/free-letter-tracing-game-for-kids': { leads: 4, demo: 4, admitted: 0 },
      '/reading-classes-for-kids': { leads: 4, demo: 4, admitted: 2 },
      '/pricing': { leads: 3, demo: 3, admitted: 1 },
      '/online-english-classes-for-kids': { leads: 3, demo: 3, admitted: 1 },
      '/book-demo': { leads: 4, demo: 4, admitted: 0 },
    }),
  }),
  september2026Snapshot: Object.freeze({
    period: 'user-supplied September snapshot; exact start/end dates not supplied',
    cohortMaturity: 'incomplete — do not interpret zero admissions as final conversion performance',
    observedChannelLeads: 60,
    channels: Object.freeze({
      otherCampaign: { leads: 25, demo: 25, admitted: 0 },
      googleOrganic: { leads: 24, demo: 24, admitted: 0 },
      directUnknown: { leads: 4, demo: 4, admitted: 0 },
      legacyUnattributed: { leads: 3, demo: 3, admitted: 0 },
      whatsappLegacy: { leads: 3, demo: 3, admitted: 0 },
      referral: { leads: 1, demo: 1, admitted: 0 },
    }),
    selectedLandingPages: Object.freeze({
      '/phonics': { leads: 24, demo: 24, admitted: 0 },
      '/': { leads: 15, demo: 15, admitted: 0 },
      '/speaking': { leads: 2, demo: 2, admitted: 0 },
      '/grammar': { leads: 1, demo: 1, admitted: 0 },
      '/best-online-phonics-classes-for-kids-in-india': { leads: 1, demo: 1, admitted: 0 },
      '/online-english-classes-for-kids': { leads: 1, demo: 1, admitted: 0 },
      '/book-demo': { leads: 1, demo: 1, admitted: 0 },
    }),
  }),
  source: 'User-supplied first-touch website marketing-attribution report',
});

export const SEO_RECOVERY_BRICK13_DECISION_RULES = Object.freeze({
  doNotUseTotalTrafficAsRevenueProxy: true,
  compareLikeForLikeWindows: true,
  useFinalizedGscOnly: true,
  evaluatePageAndQueryTogether: true,
  requireOwnerConsistencyBeforeDeclaringWin: true,
  businessOutcomePriority: Object.freeze(['admissions', 'qualified leads', 'demos', 'organic clicks', 'CTR', 'position']),
  cohortRule: 'Do not compare admission rates until the newer lead cohort has had enough time to progress through demo and admission.',
  attributionRule: 'GSC measures Google Search visibility; website attribution measures first-touch lead source. ChatGPT, direct, referral and campaign leads must not be credited to Google Organic.',
  trafficRule: 'Traffic/free-resource growth is reported separately and cannot offset a decline in revenue-intent search performance.',
  changeRule: 'During stabilization, do not make another broad SEO change from one short-window movement; investigate owner, query, page and business outcomes first.',
});

export const SEO_RECOVERY_BRICK13_REVIEW_CADENCE = Object.freeze({
  deploymentCheck: '7 days after deployment',
  preliminarySearchReview: '14–21 days after deployment',
  fullRecoveryReview: '28+ days after deployment',
  monthlyBusinessReview: 'calendar month after attribution cohorts mature',
});
