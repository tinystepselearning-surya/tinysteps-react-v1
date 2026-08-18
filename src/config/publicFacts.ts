import { PUBLIC_FACTS as SCHEMA_PUBLIC_FACTS } from '../lib/schemas';
import {
  FREE_DEMO_DURATION_MINUTES,
  FREE_DEMO_PRICE,
  FREE_DEMO_SESSION_COUNT,
  STANDARD_ONE_TO_ONE_PER_CLASS_PRICE,
  STANDARD_SMALL_GROUP_MAX_PER_CLASS,
  STANDARD_SMALL_GROUP_MIN_PER_CLASS,
} from './publicOffer';

// Canonical public business facts used by public SEO/AEO/GEO experiences.
// Identity/programme/session wording is inherited from schemas; standard public
// pricing/demo facts are inherited from publicOffer; institutional and seasonal
// facts are centralized here. New public claims should resolve through this
// layer instead of introducing another page-local number.
export const PUBLIC_SITE_FACTS = {
  brandName: SCHEMA_PUBLIC_FACTS.brandName,
  audience: {
    ageMin: 3,
    ageMax: 12,
    label: 'children aged 3–12',
  },
  learnerReach: {
    minimumLearners: 5000,
    minimumCountries: 15,
    learnersLabel: '5000+ learners',
    countriesLabel: '15+ countries',
  },
  liveSessions: {
    minimumMinutes: 35,
    maximumMinutes: 40,
    label: SCHEMA_PUBLIC_FACTS.sessionDuration,
  },
  deliveryModel: SCHEMA_PUBLIC_FACTS.deliveryModel,
  corePrograms: SCHEMA_PUBLIC_FACTS.corePrograms,
  geography: SCHEMA_PUBLIC_FACTS.geography,
  standardOffer: {
    oneToOnePerClassInr: STANDARD_ONE_TO_ONE_PER_CLASS_PRICE,
    smallGroupMinPerClassInr: STANDARD_SMALL_GROUP_MIN_PER_CLASS,
    smallGroupMaxPerClassInr: STANDARD_SMALL_GROUP_MAX_PER_CLASS,
    demoSessionCount: FREE_DEMO_SESSION_COUNT,
    demoDurationMinutes: FREE_DEMO_DURATION_MINUTES,
    demoPriceInr: FREE_DEMO_PRICE,
  },
  schoolPartnership: {
    focusedLaunchInr: 59000,
    wholeSchoolInr: 149000,
    multiCampusInr: 299000,
    pilotInr: 24900,
    gstExtra: true,
    pilotDurationWeeks: 8,
    pilotMaximumTeachers: 4,
    pilotMaximumLearners: 60,
  },
  proofPolicy: {
    aggregateRatingsRequireApprovedTestimonials: true,
    generatedFallbackTestimonialsAllowed: false,
    unsupportedSatisfactionPercentagesAllowed: false,
  },
  outcomePolicy: {
    universalGuaranteedTimelineAllowed: false,
    assessmentBasedProgression: true,
    evidenceStandard: 'independent transfer to fresh, appropriately matched examples',
  },
  summerCamp2026: {
    status: 'concluded' as const,
    endDateIso: '2026-06-13',
    endDateLabel: '13 June 2026',
  },
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
