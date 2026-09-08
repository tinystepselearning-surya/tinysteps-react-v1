import { GROUP_MONTHLY_FEES, PER_CLASS_PRICE } from './pricing';

export const SEMANTIC_FACTS_VERSION = '2026-09-08-r1';

const STANDARD_ONE_TO_ONE_DURATION_MINUTES = 35;
const FREE_ASSESSMENT_DURATION_MINUTES = 35;
const FREE_ASSESSMENT_SESSION_COUNT = 1;
const FREE_ASSESSMENT_PRICE_INR = 0;

const smallGroupPerClassValues = GROUP_MONTHLY_FEES
  .filter((row) => row.ratio !== '1:1')
  .map((row) => Math.round(row.monthlyFee / row.classes));

export const SEMANTIC_FACTS = {
  version: SEMANTIC_FACTS_VERSION,

  brand: {
    name: 'Tiny Steps Learning',
    shortName: 'Tiny Steps',
    organizationName: 'Tiny Steps Early Education',
    websiteOrigin: 'https://tinystepslearning.com',
    positioning: 'premium online English learning school for children aged 3–12',
  },

  founder: {
    displayName: 'Priya',
    fullName: 'Vannala Ravali Priya',
    givenName: 'Ravali Priya',
    familyName: 'Vannala',
    alternateNames: ['Priya', 'Ravali Priya', 'Vannala Ravali Priya', 'Vannal Ravali Priya'],
    title: 'Founder',
    profilePath: '/team/vannala-ravali-priya',
    publicProfiles: [
      {
        platform: 'LinkedIn',
        url: 'https://www.linkedin.com/in/ravali-priya-vannala/',
        purpose: 'Vannala Ravali Priya — Founder of Tiny Steps Learning',
      },
    ],
  },

  audience: {
    coreAgeMin: 3,
    coreAgeMax: 12,
    coreLabel: 'children aged 3–12',
    note: 'The brand-level public audience is ages 3–12. Level-specific course metadata must not silently widen this brand claim.',
  },

  delivery: {
    mode: 'live online classes',
    standardOneToOne: {
      format: '1:1 online',
      durationMinutes: STANDARD_ONE_TO_ONE_DURATION_MINUTES,
      durationLabel: '35 minutes',
    },
    assessment: {
      format: '1:1 online demo assessment',
      sessionCount: FREE_ASSESSMENT_SESSION_COUNT,
      durationMinutes: FREE_ASSESSMENT_DURATION_MINUTES,
      durationLabel: '35 minutes',
      priceInr: FREE_ASSESSMENT_PRICE_INR,
      priceLabel: 'free',
      bookingPath: '/book-demo',
      claim: 'One free 35-minute 1:1 online demo assessment class per child before enrolment.',
    },
  },

  pricing: {
    currency: 'INR',
    standardOneToOnePerClassInr: PER_CLASS_PRICE,
    standardSmallGroupMinPerClassInr: Math.min(...smallGroupPerClassValues),
    standardSmallGroupMaxPerClassInr: Math.max(...smallGroupPerClassValues),
    pricingPath: '/pricing',
  },

  programmes: {
    coreLabels: ['Phonics', 'Grammar', 'Public Speaking'],
    phonics: {
      label: 'Phonics & Reading',
      commercialPath: '/phonics',
      claim: 'Structured phonics and early-reading progression through live online teaching.',
      levels: {
        foundations: {
          courseId: 'phonics-foundations',
          publicSlug: 'phonics-foundation',
          label: 'Phonics Foundations',
          lessonCount: 31,
        },
        early: {
          courseId: 'early-phonics',
          publicSlug: 'phonics-brush-up',
          label: 'Early Phonics',
          lessonCount: 40,
        },
        advanced: {
          courseId: 'advanced-phonics',
          publicSlug: 'phonics-advanced',
          label: 'Advanced Phonics',
          lessonCount: 30,
        },
      },
      totalLessonCount: 101,
    },
    grammar: {
      label: 'Grammar & Writing',
      commercialPath: '/grammar',
      claim: 'Structured grammar, sentence-building and writing progression.',
      levels: {
        beginner: {
          courseId: 'basic-grammar',
          publicSlug: 'basic-grammar',
          label: 'Beginner Grammar',
          lessonCount: 36,
        },
        advanced: {
          courseId: 'advanced-grammar',
          publicSlug: 'advanced-grammar',
          label: 'Advanced Grammar',
          lessonCount: 36,
        },
      },
      totalLessonCount: 72,
    },
    speaking: {
      label: 'Speaking & Communication',
      commercialPath: '/speaking',
      claim: 'Structured speaking, vocabulary, communication and public-speaking progression.',
      levels: {
        beginner: {
          courseId: 'basic-public-speaking',
          publicSlug: 'basic-public-speaking',
          label: 'Public Speaking (Basic)',
          lessonCount: 36,
        },
        advanced: {
          courseId: 'advanced-public-speaking',
          publicSlug: 'advanced-public-speaking',
          label: 'Public Speaking (Advanced)',
          lessonCount: 36,
        },
      },
      totalLessonCount: 72,
    },
  },

  serviceArea: {
    primaryCountryCode: 'IN',
    primaryCountry: 'India',
    city: 'Hyderabad',
    region: 'Telangana',
    onlineReach: 'learners in India and globally online',
    schemaAreaServed: ['IN', 'Worldwide'],
  },

  contact: {
    email: 'RavaliPriyaVannala@tinystepslearning.com',
    telephoneDisplay: '+91-9618398383',
    whatsappNumber: '919618398383',
    contactPath: '/contact',
  },

  organizationProfiles: [
    {
      platform: 'Facebook',
      url: 'https://www.facebook.com/profile.php?id=61593673422886',
      purpose: 'Tiny Steps Learning updates and parent-facing learning content',
      includeInOrganizationSameAs: true,
    },
    {
      platform: 'Instagram',
      url: 'https://www.instagram.com/tiny_steps_oel/',
      purpose: 'Tiny Steps Learning classroom and learning updates',
      includeInOrganizationSameAs: true,
    },
    {
      platform: 'YouTube',
      url: 'https://www.youtube.com/@TinyStepsLearning_Priya',
      purpose: 'Tiny Steps Learning videos and learning guidance',
      includeInOrganizationSameAs: true,
    },
    {
      platform: 'LinkedIn',
      url: 'https://www.linkedin.com/company/tiny-steps-learning/',
      purpose: 'Tiny Steps Learning company and educational updates',
      includeInOrganizationSameAs: true,
    },
    {
      platform: 'Pinterest',
      url: 'https://www.pinterest.com/tinystepselearning/',
      purpose: 'Tiny Steps Learning parent resources, phonics ideas, and learning inspiration',
      includeInOrganizationSameAs: false,
    },
    {
      platform: 'Quora',
      url: 'https://www.quora.com/profile/Tiny-Steps-Learning',
      purpose: 'Tiny Steps Learning answers on phonics, reading, and parent guidance',
      includeInOrganizationSameAs: true,
    },
  ],

  learnerReach: {
    minimumLearners: 5000,
    minimumCountries: 15,
    learnersLabel: '5000+ learners',
    countriesLabel: '15+ countries',
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

  seasonal: {
    summerCamp2026: {
      status: 'concluded',
      endDateIso: '2026-06-13',
      endDateLabel: '13 June 2026',
    },
  },
} as const;

export const ORGANIZATION_SAME_AS_URLS = SEMANTIC_FACTS.organizationProfiles
  .filter((profile) => profile.includeInOrganizationSameAs)
  .map((profile) => profile.url);

export const OFFICIAL_ORGANIZATION_PROFILE_URLS = SEMANTIC_FACTS.organizationProfiles.map(
  (profile) => profile.url,
);

export const FOUNDER_PUBLIC_PROFILE_URLS = SEMANTIC_FACTS.founder.publicProfiles.map(
  (profile) => profile.url,
);

export const CORE_PROGRAMS_TEXT =
  `${SEMANTIC_FACTS.programmes.coreLabels[0]}, ${SEMANTIC_FACTS.programmes.coreLabels[1]}, and ${SEMANTIC_FACTS.programmes.coreLabels[2]}`;
