import { SEMANTIC_FACTS } from './semanticFacts';

// Backward-compatible public business-fact facade.
// Brick 1 moves the canonical values into semanticFacts.ts so pages, schema,
// offers and identity surfaces can converge on one machine-readable source.
export const PUBLIC_SITE_FACTS = {
  brandName: SEMANTIC_FACTS.brand.name,
  audience: {
    ageMin: SEMANTIC_FACTS.audience.coreAgeMin,
    ageMax: SEMANTIC_FACTS.audience.coreAgeMax,
    label: SEMANTIC_FACTS.audience.coreLabel,
  },
  learnerReach: SEMANTIC_FACTS.learnerReach,
  liveSessions: {
    minimumMinutes: SEMANTIC_FACTS.delivery.standardOneToOne.durationMinutes,
    maximumMinutes: SEMANTIC_FACTS.delivery.standardOneToOne.durationMinutes,
    label: SEMANTIC_FACTS.delivery.standardOneToOne.durationLabel,
  },
  deliveryModel: SEMANTIC_FACTS.delivery.mode,
  corePrograms: SEMANTIC_FACTS.programmes.coreLabels,
  geography: SEMANTIC_FACTS.serviceArea.onlineReach,
  standardOffer: {
    oneToOnePerClassInr: SEMANTIC_FACTS.pricing.standardOneToOnePerClassInr,
    smallGroupMinPerClassInr: SEMANTIC_FACTS.pricing.standardSmallGroupMinPerClassInr,
    smallGroupMaxPerClassInr: SEMANTIC_FACTS.pricing.standardSmallGroupMaxPerClassInr,
    demoSessionCount: SEMANTIC_FACTS.delivery.assessment.sessionCount,
    demoDurationMinutes: SEMANTIC_FACTS.delivery.assessment.durationMinutes,
    demoPriceInr: SEMANTIC_FACTS.delivery.assessment.priceInr,
  },
  schoolPartnership: SEMANTIC_FACTS.schoolPartnership,
  proofPolicy: SEMANTIC_FACTS.proofPolicy,
  outcomePolicy: SEMANTIC_FACTS.outcomePolicy,
  summerCamp2026: SEMANTIC_FACTS.seasonal.summerCamp2026,
} as const;

export const PUBLIC_LEARNER_REACH_LABEL =
  `${PUBLIC_SITE_FACTS.learnerReach.learnersLabel} across ${PUBLIC_SITE_FACTS.learnerReach.countriesLabel}`;
export const PUBLIC_AGE_RANGE_LABEL = PUBLIC_SITE_FACTS.audience.label;
export const PUBLIC_SESSION_DURATION_LABEL = PUBLIC_SITE_FACTS.liveSessions.label;
export const SUMMER_CAMP_2026_ARCHIVE_LABEL =
  `Summer Camp 2026 concluded on ${PUBLIC_SITE_FACTS.summerCamp2026.endDateLabel}.`;

export function formatPublicInr(value: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);
}
