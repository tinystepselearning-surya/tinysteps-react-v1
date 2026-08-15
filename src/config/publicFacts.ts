export const PUBLIC_SITE_FACTS = {
  brandName: 'Tiny Steps Learning',
  audience: {
    ageMin: 3,
    ageMax: 12,
    label: 'children ages 3–12',
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
    label: '35–40 minutes per session',
  },
  deliveryModel: 'live online classes',
  corePrograms: ['Phonics', 'Grammar', 'Public Speaking'] as const,
  geography: 'India and families worldwide online',
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
  summerCamp2026: {
    status: 'concluded' as const,
    startDateIso: '2026-04-27',
    endDateIso: '2026-06-13',
    startDateLabel: '27 April 2026',
    endDateLabel: '13 June 2026',
    classCount: 24,
    batchDurationWeeks: 4,
    historicalEnrollmentPriceInr: 2400,
    historicalListPriceInr: 5000,
    batchCap: 8,
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
