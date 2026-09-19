export type PhonicsFeeFormat = 'one-to-one' | 'group';

export type PhonicsFeeEvidenceStatus =
  | 'exact-normalized'
  | 'published-not-normalized';

export type PhonicsFeeOffer = {
  format: PhonicsFeeFormat;
  publicPriceLabel: string;
  sessionStructureLabel: string;
  durationLabel?: string;
  groupSizeLabel?: string;
  normalizedPerClassLabel?: string;
  benchmarkRates?: readonly number[];
  benchmarkEligible: boolean;
  evidenceStatus: PhonicsFeeEvidenceStatus;
  evidenceNote: string;
};

export type PhonicsFeeProvider = {
  provider: string;
  sourceUrl: string;
  sourceLabel: string;
  checkedAt: string;
  note?: string;
  oneToOne?: PhonicsFeeOffer;
  group?: PhonicsFeeOffer;
};

export type PhonicsFeeReviewedWithoutBenchmark = {
  provider: string;
  sourceUrl: string;
  reason: string;
};

export type PhonicsFeeMarketSegment = {
  unitLabel: string;
  providerCount: number;
  exactRateObservationCount: number;
  median: number;
  average: number;
  minExactPublishedRate: number;
  maxExactPublishedRate: number;
};

function median(values: readonly number[]) {
  if (!values.length) return 0;
  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  if (ordered.length % 2 === 1) return ordered[middle];
  return (ordered[middle - 1] + ordered[middle]) / 2;
}

function average(values: readonly number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Provider-level source-of-truth research for the Tiny Steps phonics-fee page.
 *
 * Research rules:
 * - Official provider websites or official provider brochures only.
 * - Live child phonics programmes only; teacher-training and self-paced products are excluded.
 * - 1:1 and group formats are kept separate.
 * - A provider contributes to the statistical benchmark only when an exact live-class
 *   rate is public, or when package fee + exact live-session count make that rate
 *   unambiguous.
 * - "From" prices, monthly fees without a fixed class count, conflicting package
 *   structures and enquiry-only pricing are shown for transparency but excluded
 *   from the median/average.
 * - For a provider publishing multiple exact package rates in the same format,
 *   the provider contributes one benchmark observation: the median of its own
 *   published per-class rates. This prevents a provider with many package sizes
 *   from dominating the sample.
 * - Tiny Steps is NOT included in the external market median/average.
 */
export const PHONICS_FEES_INDIA_PROVIDERS: readonly PhonicsFeeProvider[] = [
  {
    provider: 'Learn2Read',
    sourceUrl: 'https://www.learn2read.co/english-phonics/power-plus/',
    sourceLabel: 'Official Power PLUS phonics course page',
    checkedAt: '2026-09-19',
    oneToOne: {
      format: 'one-to-one',
      publicPriceLabel: '₹466.66 per class',
      sessionStructureLabel: '24 live sessions · 3 classes/week (Power PLUS)',
      normalizedPerClassLabel: '₹466.66 / class',
      benchmarkRates: [466.66],
      benchmarkEligible: true,
      evidenceStatus: 'exact-normalized',
      evidenceNote: 'Provider publishes the per-class 1:1 rate directly.',
    },
    group: {
      format: 'group',
      publicPriceLabel: '₹316.66 per child per class',
      sessionStructureLabel: '24 live sessions · 3 classes/week (Power PLUS)',
      normalizedPerClassLabel: '₹316.66 / class',
      benchmarkRates: [316.66],
      benchmarkEligible: true,
      evidenceStatus: 'exact-normalized',
      evidenceNote: 'Provider publishes the group per-class rate directly.',
    },
  },
  {
    provider: 'Klariti Learning',
    sourceUrl: 'https://www.klaritilearning.com/phonics',
    sourceLabel: 'Official phonics course page',
    checkedAt: '2026-09-19',
    oneToOne: {
      format: 'one-to-one',
      publicPriceLabel: '₹18,000 / 40 sessions',
      sessionStructureLabel: '40 live sessions · 4 months',
      durationLabel: '40 minutes',
      normalizedPerClassLabel: '₹450 / class',
      benchmarkRates: [450],
      benchmarkEligible: true,
      evidenceStatus: 'exact-normalized',
      evidenceNote: '₹18,000 ÷ 40 clearly stated live sessions.',
    },
    group: {
      format: 'group',
      publicPriceLabel: '₹12,000 / 40 sessions',
      sessionStructureLabel: '40 live sessions · 3 classes/week · 4 months',
      durationLabel: '40 minutes',
      groupSizeLabel: 'Maximum 5 children',
      normalizedPerClassLabel: '₹300 / child / class',
      benchmarkRates: [300],
      benchmarkEligible: true,
      evidenceStatus: 'exact-normalized',
      evidenceNote: '₹12,000 ÷ 40 clearly stated live sessions.',
    },
  },
  {
    provider: 'MyBeeClub (Arise ‘n’ Shine)',
    sourceUrl: 'https://myarisenshine.com/online-phonics-reading-new.html',
    sourceLabel: 'Official online phonics course page',
    checkedAt: '2026-09-19',
    oneToOne: {
      format: 'one-to-one',
      publicPriceLabel: '₹500 per session',
      sessionStructureLabel: '20 live sessions per level',
      durationLabel: '30 minutes',
      normalizedPerClassLabel: '₹500 / class',
      benchmarkRates: [500],
      benchmarkEligible: true,
      evidenceStatus: 'exact-normalized',
      evidenceNote: 'Provider publishes ₹500/session directly for its 1:1 schedules.',
    },
    group: {
      format: 'group',
      publicPriceLabel: '₹3,500 / 30 sessions per level',
      sessionStructureLabel: '30 live group sessions per level',
      durationLabel: '30 or 60 minutes depending schedule',
      groupSizeLabel: '6–10 children',
      normalizedPerClassLabel: '₹116.67 / child / class',
      benchmarkRates: [116.67],
      benchmarkEligible: true,
      evidenceStatus: 'exact-normalized',
      evidenceNote: '₹3,500 ÷ 30 clearly stated live group sessions.',
    },
  },
  {
    provider: 'Fluffy Tales',
    sourceUrl: 'https://fluffytale.in/creative-cubs-2/',
    sourceLabel: 'Official Creative Cubs phonics course page',
    checkedAt: '2026-09-19',
    note:
      'The page contains a 60-versus-66 total-class inconsistency, so the benchmark uses only its directly published per-class prices and does not infer a package total.',
    oneToOne: {
      format: 'one-to-one',
      publicPriceLabel: '₹480 personal coaching per class',
      sessionStructureLabel: 'Customized 1:1 teaching available',
      normalizedPerClassLabel: '₹480 / class',
      benchmarkRates: [480],
      benchmarkEligible: true,
      evidenceStatus: 'exact-normalized',
      evidenceNote: 'The provider publishes the ₹480 personal-coaching per-class rate directly.',
    },
    group: {
      format: 'group',
      publicPriceLabel: '₹250 per class',
      sessionStructureLabel: '3 classes/week',
      groupSizeLabel: '3–4 children',
      normalizedPerClassLabel: '₹250 / child / class',
      benchmarkRates: [250],
      benchmarkEligible: true,
      evidenceStatus: 'exact-normalized',
      evidenceNote: 'The provider publishes the group cost per class directly.',
    },
  },
  {
    provider: 'EduNext Academy (CRECT Trust)',
    sourceUrl: 'https://crect.org/',
    sourceLabel: 'Official EduNext phonics pricing / FAQ',
    checkedAt: '2026-09-19',
    oneToOne: {
      format: 'one-to-one',
      publicPriceLabel: '₹300 per session',
      sessionStructureLabel: '40 live 1:1 sessions total',
      durationLabel: '30–45 minutes',
      normalizedPerClassLabel: '₹300 / class',
      benchmarkRates: [300],
      benchmarkEligible: true,
      evidenceStatus: 'exact-normalized',
      evidenceNote: 'Provider publishes ₹300/session and 40 total 1:1 sessions.',
    },
    group: {
      format: 'group',
      publicPriceLabel: '₹1,500 / 3 months',
      sessionStructureLabel: 'Live online group programme',
      benchmarkEligible: false,
      evidenceStatus: 'published-not-normalized',
      evidenceNote: 'The public FAQ does not state an exact total live-session count for the 3-month group fee.',
    },
  },
  {
    provider: 'instrucko',
    sourceUrl: 'https://www.instrucko.com/brochure_instrucko.pdf',
    sourceLabel: 'Official instrucko brochure · India-teacher phonics pricing',
    checkedAt: '2026-09-19',
    oneToOne: {
      format: 'one-to-one',
      publicPriceLabel: '₹14,605 / 20 · ₹25,640 / 40 · ₹48,680 / 80',
      sessionStructureLabel: 'India-teacher 1:1 packages',
      normalizedPerClassLabel: '₹730 · ₹641 · ₹609 / class',
      benchmarkRates: [730, 641, 609],
      benchmarkEligible: true,
      evidenceStatus: 'exact-normalized',
      evidenceNote:
        'The brochure publishes both package totals and per-class prices. Provider-level benchmark value is the median of its three exact rates (₹641).',
    },
    group: {
      format: 'group',
      publicPriceLabel: '₹7,400 / 40 · ₹14,080 / 80',
      sessionStructureLabel: 'India-teacher group packages',
      normalizedPerClassLabel: '₹185 · ₹176 / child / class',
      benchmarkRates: [185, 176],
      benchmarkEligible: true,
      evidenceStatus: 'exact-normalized',
      evidenceNote:
        'The brochure publishes both package totals and per-class prices. Provider-level benchmark value is the median of its two exact rates (₹180.50).',
    },
  },
  {
    provider: 'Bambinos / Unbox English',
    sourceUrl: 'https://demo.bambinos.live/',
    sourceLabel: 'Official Unbox English public page',
    checkedAt: '2026-09-19',
    oneToOne: {
      format: 'one-to-one',
      publicPriceLabel: 'From ₹699 per class',
      sessionStructureLabel: '24 / 48 / 96-class packages',
      benchmarkEligible: false,
      evidenceStatus: 'published-not-normalized',
      evidenceNote: 'The public page gives a starting per-class price; full package pricing is shared during the demo.',
    },
    group: {
      format: 'group',
      publicPriceLabel: 'From ₹299 per class',
      sessionStructureLabel: 'Semi-private live classes',
      groupSizeLabel: 'Up to 6 children',
      benchmarkEligible: false,
      evidenceStatus: 'published-not-normalized',
      evidenceNote: 'The public page gives a starting price rather than an exact package-specific rate.',
    },
  },
  {
    provider: 'iSchooling',
    sourceUrl: 'https://ischooling.in/program/online-phonics-classes/',
    sourceLabel: 'Official online phonics programme page',
    checkedAt: '2026-09-19',
    oneToOne: {
      format: 'one-to-one',
      publicPriceLabel: '₹5,000 per month',
      sessionStructureLabel: '3 sessions/week',
      durationLabel: '30 minutes',
      benchmarkEligible: false,
      evidenceStatus: 'published-not-normalized',
      evidenceNote: 'A calendar month does not specify an exact fixed total session count, so no ₹/class rate is inferred.',
    },
    group: {
      format: 'group',
      publicPriceLabel: '₹2,500 per month',
      sessionStructureLabel: '3 sessions/week',
      durationLabel: '30 minutes',
      benchmarkEligible: false,
      evidenceStatus: 'published-not-normalized',
      evidenceNote: 'A calendar month does not specify an exact fixed total session count, so no ₹/class rate is inferred.',
    },
  },
  {
    provider: 'Jolly Reading',
    sourceUrl: 'https://jollyreading.in/product-category/online-phonics-classes/',
    sourceLabel: 'Official online phonics product category',
    checkedAt: '2026-09-19',
    group: {
      format: 'group',
      publicPriceLabel: '₹18,000 beginner · ₹20,000 advanced',
      sessionStructureLabel: '2 classes/week · published 8–10 month course durations',
      durationLabel: '1 hour',
      groupSizeLabel: '6–7 children on the beginner product page',
      benchmarkEligible: false,
      evidenceStatus: 'published-not-normalized',
      evidenceNote:
        'Exact total live-session count is not stated, and the beginner product page contains an 8-versus-10-month duration conflict. No per-class rate is inferred.',
    },
  },
  {
    provider: 'Raynira Kids Academy',
    sourceUrl: 'https://raynira.com/',
    sourceLabel: 'Official academy home / course page',
    checkedAt: '2026-09-19',
    group: {
      format: 'group',
      publicPriceLabel: 'From ₹1,900/month beginner · ₹2,000/month advanced',
      sessionStructureLabel: '6-month live online phonics courses',
      groupSizeLabel: 'Small learning groups',
      benchmarkEligible: false,
      evidenceStatus: 'published-not-normalized',
      evidenceNote: 'The exact number of live classes included per month is not publicly stated.',
    },
  },
  {
    provider: 'WizMantra',
    sourceUrl: 'https://wizmantraenglishclasses.com/phonics-for-kids/',
    sourceLabel: 'Official phonics-for-kids pricing page',
    checkedAt: '2026-09-19',
    oneToOne: {
      format: 'one-to-one',
      publicPriceLabel: '₹4,890/month',
      sessionStructureLabel: 'Live 1:1 · 5 days/week',
      benchmarkEligible: false,
      evidenceStatus: 'published-not-normalized',
      evidenceNote: 'The exact fixed number of sessions in a billed calendar month is not stated, so no ₹/class rate is inferred.',
    },
  },
] as const;

export const PHONICS_FEES_REVIEWED_WITHOUT_COMPARABLE_PUBLIC_PRICE: readonly PhonicsFeeReviewedWithoutBenchmark[] = [
  {
    provider: 'Little Genius Academy',
    sourceUrl: 'https://littlegeniusacademy.co.in/one-on-one-online-phonics-classes.php',
    reason:
      'The current 1:1 phonics page states a 36-session, 45-minute structure, but the public fee documents found do not clearly tie a current price to that exact 1:1 phonics package. We do not join separate pages by assumption.',
  },
  {
    provider: 'Kiddie Expert',
    sourceUrl: 'https://kiddieexpert.com/jolly-phonics/',
    reason: 'A current phonics class page was found, but no current child-class fee was publicly stated on the page reviewed.',
  },
  {
    provider: 'Phonics Power',
    sourceUrl: 'https://phonicspower.com/',
    reason: 'Current course/contact pages were found, but no current child-phonics fee was publicly stated in the pages reviewed.',
  },
  {
    provider: 'Katral Elithu Academy',
    sourceUrl: 'https://admissions.katralelithu.com/',
    reason:
      'The current child admissions site says fees are billed every two months but does not expose the current phonics amount in the public page reviewed. Older ₹5,000 workshop pricing is for an adult parent/teacher workshop, not the child class.',
  },
] as const;

function getEligibleProviderValues(format: PhonicsFeeFormat) {
  return PHONICS_FEES_INDIA_PROVIDERS.flatMap((provider) => {
    const offer = format === 'one-to-one' ? provider.oneToOne : provider.group;
    if (!offer?.benchmarkEligible || !offer.benchmarkRates?.length) return [];
    return [median(offer.benchmarkRates)];
  });
}

function getExactPublishedRates(format: PhonicsFeeFormat) {
  return PHONICS_FEES_INDIA_PROVIDERS.flatMap((provider) => {
    const offer = format === 'one-to-one' ? provider.oneToOne : provider.group;
    if (!offer?.benchmarkEligible || !offer.benchmarkRates?.length) return [];
    return [...offer.benchmarkRates];
  });
}

function buildSegment(format: PhonicsFeeFormat, unitLabel: string): PhonicsFeeMarketSegment {
  const providerValues = getEligibleProviderValues(format);
  const exactRates = getExactPublishedRates(format);
  return {
    unitLabel,
    providerCount: providerValues.length,
    exactRateObservationCount: exactRates.length,
    median: median(providerValues),
    average: average(providerValues),
    minExactPublishedRate: Math.min(...exactRates),
    maxExactPublishedRate: Math.max(...exactRates),
  };
}

export const PHONICS_FEES_INDIA_RESEARCH = {
  id: 'phonics-fees-india-2026-09-19',
  status: 'named-provider-source-of-truth-study' as const,
  geography: 'India-facing live online child phonics providers',
  reviewedAt: '2026-09-19',
  reviewedLabel: '19 September 2026',
  sourceBasis: 'Official provider websites and official provider brochures',
  providerNamesPublic: true,
  rawProviderRowsRetainedInRepository: true,
  sampleSizeRetainedInRepository: true,
  benchmarkExcludesTinySteps: true,
  methodology: [
    'Reviewed official provider websites and official provider brochures for live online child phonics pricing available to Indian families.',
    'Kept live 1:1 and live group formats separate because teacher attention, group size and economics differ materially.',
    'Included a provider in the statistical benchmark only when an exact per-class rate was published or an exact package fee and exact live-session count made the rate unambiguous.',
    'Excluded starting-price-only offers, monthly fees without a fixed total live-session count, conflicting package structures and enquiry-only pricing from the median and average.',
    'When one provider published multiple exact package rates in the same format, used the median of that provider’s own rates as one provider-level benchmark observation so one company could not dominate the sample.',
    'Excluded Tiny Steps from the external-provider benchmark statistics; Tiny Steps pricing is disclosed separately on the page.',
    'Treated the result as a transparent market observation, not a quality ranking, recommendation or nationwide census.',
  ] as const,
  oneToOne: buildSegment('one-to-one', 'per live 1:1 class'),
  group: buildSegment('group', 'per child / live group class'),
  publicDisclosure:
    'Tiny Steps publishes this price research. External-provider benchmark statistics exclude Tiny Steps. Provider prices can change; every named row links to the official source checked on 19 September 2026.',
} as const;
