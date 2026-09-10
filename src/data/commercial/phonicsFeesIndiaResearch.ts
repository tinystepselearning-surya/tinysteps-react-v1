export type PhonicsFeeBand = {
  label: string;
  rangeLabel: string;
  average: number;
};

export type PhonicsFeeMarketSegment = {
  unitLabel: string;
  centralRangeLabel: string;
  median: number;
  average: number;
  bands: readonly PhonicsFeeBand[];
};

/**
 * Research snapshot retained from the August 2026 Tiny Steps phonics-fee study.
 *
 * Provenance:
 * - The public pricing benchmark was introduced in PR #183 as a research-led
 *   comparison of publicly advertised live-online phonics pricing available to
 *   Indian parents.
 * - Provider identities were intentionally excluded from the parent-facing page.
 * - Package prices were normalized only when the number of live sessions was clear.
 * - 1:1 and group formats were analysed separately.
 *
 * Important limitation:
 * The original provider-by-provider source table and sample count were not committed
 * to Git history. This file therefore preserves the finalized aggregate findings and
 * methodology without inventing provider rows or a sample size. Future refreshes can
 * append an anonymized observation table while preserving this public contract.
 */
export const PHONICS_FEES_INDIA_RESEARCH = {
  id: 'phonics-fees-india-2026-08',
  status: 'retained-aggregate-study' as const,
  geography: 'India-facing live online phonics providers',
  reviewedAt: '2026-08-31',
  reviewedLabel: 'August 2026',
  sourceBasis: 'Publicly advertised live online phonics pricing available to Indian parents',
  providerNamesPublic: false,
  rawProviderRowsRetainedInRepository: false,
  sampleSizeRetainedInRepository: false,
  methodology: [
    'Reviewed publicly advertised live online phonics pricing available to Indian parents.',
    'Analysed live 1:1 and live group formats separately because teacher attention and economics differ materially.',
    'Where a provider advertised a package, divided the total fee by the clearly stated number of live sessions to derive an effective fee per class.',
    'Excluded offers with unclear or conflicting live-session counts from the statistical calculation.',
    'Treated comparable package lengths from one provider as one provider-level observation so one company could not dominate the sample.',
    'Used the results as market-price observations, not as quality rankings or a nationwide census.',
  ] as const,
  oneToOne: {
    unitLabel: 'per live 1:1 class',
    centralRangeLabel: '₹350–₹550',
    median: 458,
    average: 474,
    bands: [
      { label: 'Lower fee band', rangeLabel: 'Below ₹350', average: 280 },
      { label: 'Typical fee band', rangeLabel: '₹350–₹550', average: 450 },
      { label: 'Higher fee band', rangeLabel: 'Above ₹550', average: 720 },
    ],
  } satisfies PhonicsFeeMarketSegment,
  group: {
    unitLabel: 'per child / live group class',
    centralRangeLabel: '₹200–₹299',
    median: 225,
    average: 226,
    bands: [
      { label: 'Lower fee band', rangeLabel: 'Below ₹200', average: 145 },
      { label: 'Typical fee band', rangeLabel: '₹200–₹299', average: 225 },
      { label: 'Higher fee band', rangeLabel: '₹300+', average: 305 },
    ],
  } satisfies PhonicsFeeMarketSegment,
  publicDisclosure:
    'Provider identities are intentionally omitted. Figures summarize the reviewed sample and should be treated as a pricing benchmark, not a quality ranking or nationwide census.',
} as const;
