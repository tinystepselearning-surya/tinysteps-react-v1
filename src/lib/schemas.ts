/**
 * Reusable schema definitions for Tiny Steps Learning.
 * Public business/entity facts are projected from the Brick 1 semantic registry.
 */

import {
  CORE_PROGRAMS_TEXT as SEMANTIC_CORE_PROGRAMS_TEXT,
  ORGANIZATION_SAME_AS_URLS,
  SEMANTIC_FACTS,
} from '../config/semanticFacts';

export const SITE_ORIGIN = SEMANTIC_FACTS.brand.websiteOrigin;
export const PUBLIC_FACTS = {
  brandName: SEMANTIC_FACTS.brand.name,
  shortBrandName: SEMANTIC_FACTS.brand.shortName,
  organizationName: SEMANTIC_FACTS.brand.organizationName,
  founder: {
    displayName: SEMANTIC_FACTS.founder.displayName,
    fullName: SEMANTIC_FACTS.founder.fullName,
    givenName: SEMANTIC_FACTS.founder.givenName,
    familyName: SEMANTIC_FACTS.founder.familyName,
    alternateNames: SEMANTIC_FACTS.founder.alternateNames,
  },
  positioning: SEMANTIC_FACTS.brand.positioning,
  corePrograms: SEMANTIC_FACTS.programmes.coreLabels,
  sessionDuration: SEMANTIC_FACTS.delivery.standardOneToOne.durationLabel,
  primaryWebsite: SEMANTIC_FACTS.brand.websiteOrigin,
  deliveryModel: SEMANTIC_FACTS.delivery.mode,
  geography: SEMANTIC_FACTS.serviceArea.onlineReach,
} as const;
export const CORE_PROGRAMS_TEXT = SEMANTIC_CORE_PROGRAMS_TEXT;
export const ENTITY_FOCUS_AREAS = [
  'phonics',
  'grammar',
  'reading',
  'sentence formation',
  'communication',
  'public speaking',
] as const;
export const ENTITY_FOCUS_AREAS_TEXT = ENTITY_FOCUS_AREAS.join(', ');

/**
 * Canonical off-site corroboration pack.
 * Use this for third-party business profiles, directory citations, founder bios,
 * and external platform summaries to keep entity facts consistent.
 */
export const OFFSITE_CORROBORATION_PACK = {
  canonicalBrandOneLiner:
    `${PUBLIC_FACTS.brandName} is a ${PUBLIC_FACTS.positioning} platform with live online ${CORE_PROGRAMS_TEXT} programs.`,

  companyDescriptions: {
    short:
      `${PUBLIC_FACTS.brandName} offers ${PUBLIC_FACTS.positioning} through ${PUBLIC_FACTS.deliveryModel}. Standard 1:1 classes are ${PUBLIC_FACTS.sessionDuration}, serving ${PUBLIC_FACTS.geography}.`,
    medium:
      `${PUBLIC_FACTS.brandName} is a premium live-online English learning platform for children. The learning model is structured around ${CORE_PROGRAMS_TEXT}, so families can choose the right starting point and progress step by step. Standard 1:1 classes are ${PUBLIC_FACTS.sessionDuration}, with child-friendly teaching and clear parent visibility of learning goals and next steps.`,
    long:
      `${PUBLIC_FACTS.brandName} is built for families who want a clear, high-quality online English learning journey for children. We provide ${PUBLIC_FACTS.deliveryModel} with focused pathways in ${CORE_PROGRAMS_TEXT}. Instead of random topic coverage, teaching follows structured progression so children can build strong foundations, apply learning with confidence, and move forward with clarity. Session design is age-aware and practical, with standard 1:1 sessions of ${PUBLIC_FACTS.sessionDuration} that balance instruction, guided practice, and feedback. We support ${PUBLIC_FACTS.geography}, while maintaining one consistent academic approach: premium, child-friendly, and outcome-focused without overclaiming.`,
  },

  founderBio: {
    short:
      `${PUBLIC_FACTS.founder.fullName}, known as ${PUBLIC_FACTS.founder.displayName}, is the Founder of ${PUBLIC_FACTS.brandName}, where she leads the academic direction for premium live-online English learning in ${CORE_PROGRAMS_TEXT}.`,
    medium:
      `${PUBLIC_FACTS.founder.fullName}, known as ${PUBLIC_FACTS.founder.displayName}, is the Founder of ${PUBLIC_FACTS.brandName}. She leads curriculum direction and classroom quality across the platform's live online programs in ${CORE_PROGRAMS_TEXT}. Her focus is to keep learning structured, child-friendly, and practical for families who want clear English progression with confidence, communication, and reading growth.`,
  },

  coreCategories: [
    'Online Education',
    'English Classes for Children',
    'Phonics Classes',
    'Grammar Classes',
    'Public Speaking for Children',
    'Live Online Learning',
  ],

  canonicalFacts: {
    brandName: PUBLIC_FACTS.brandName,
    website: PUBLIC_FACTS.primaryWebsite,
    positioning: PUBLIC_FACTS.positioning,
    deliveryModel: PUBLIC_FACTS.deliveryModel,
    audience: 'children and families',
    corePrograms: [...PUBLIC_FACTS.corePrograms],
    sessionDuration: PUBLIC_FACTS.sessionDuration,
    serviceGeography: PUBLIC_FACTS.geography,
  },

  profileVariants: {
    trustpilotProfileSummary:
      `${PUBLIC_FACTS.brandName} provides ${PUBLIC_FACTS.positioning} through ${PUBLIC_FACTS.deliveryModel} in ${CORE_PROGRAMS_TEXT}. Families are encouraged to share honest feedback based on their real learning experience.`,
    justdialSulekhaBusinessSummary:
      `${PUBLIC_FACTS.brandName} offers premium live online English classes for children, including ${CORE_PROGRAMS_TEXT}. Standard 1:1 classes run for ${PUBLIC_FACTS.sessionDuration} and serve learners in India and globally online.`,
    linkedInCompanyAboutSummary:
      `${PUBLIC_FACTS.brandName} is a ${PUBLIC_FACTS.positioning} platform focused on ${CORE_PROGRAMS_TEXT}. We deliver ${PUBLIC_FACTS.deliveryModel} with structured progression, child-friendly teaching, and clear parent visibility of learning milestones.`,
    youTubeChannelAboutSummary:
      `${PUBLIC_FACTS.brandName} shares learning guidance and class-focused insights for families exploring premium live-online English learning for children across ${CORE_PROGRAMS_TEXT}.`,
  },

  reviewRequestPositioningNote:
    'Request honest reviews only, and never filter for positive sentiment or offer incentives.',
} as const;

export const ORGANIZATION_ID = `${SITE_ORIGIN}/#educational-organization`;
export const WEBSITE_ID = `${SITE_ORIGIN}/#website`;
export const FOUNDER_PROFILE_PATH = SEMANTIC_FACTS.founder.profilePath;
export const FOUNDER_PROFILE_URL = `${SITE_ORIGIN}${FOUNDER_PROFILE_PATH}`;
export const FOUNDER_ID = `${FOUNDER_PROFILE_URL}#person`;

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  '@id': ORGANIZATION_ID,
  name: PUBLIC_FACTS.organizationName,
  alternateName: [PUBLIC_FACTS.brandName, PUBLIC_FACTS.shortBrandName],
  url: `${SITE_ORIGIN}/`,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_ORIGIN}/logo-square.webp`,
  },
  founder: {
    '@type': 'Person',
    '@id': FOUNDER_ID,
    name: PUBLIC_FACTS.founder.fullName,
    givenName: PUBLIC_FACTS.founder.givenName,
    familyName: PUBLIC_FACTS.founder.familyName,
    alternateName: [...PUBLIC_FACTS.founder.alternateNames],
    jobTitle: SEMANTIC_FACTS.founder.title,
    url: FOUNDER_PROFILE_URL,
    image: `${SITE_ORIGIN}/priya-founder-tiny-steps-learning.webp`,
    mainEntityOfPage: {
      '@id': `${FOUNDER_PROFILE_URL}#webpage`,
    },
    worksFor: {
      '@id': ORGANIZATION_ID,
    },
  },
  description:
    'Tiny Steps Learning is a premium online English learning school for children aged 3–12, offering structured phonics, grammar, reading, sentence formation, communication, and public speaking programs.',
  foundingDate: '2020',
  foundingLocation: {
    '@type': 'Place',
    name: SEMANTIC_FACTS.serviceArea.primaryCountry,
  },
  address: {
    '@type': 'PostalAddress',
    addressLocality: SEMANTIC_FACTS.serviceArea.city,
    addressRegion: SEMANTIC_FACTS.serviceArea.region,
    addressCountry: SEMANTIC_FACTS.serviceArea.primaryCountryCode,
  },
  areaServed: [...SEMANTIC_FACTS.serviceArea.schemaAreaServed],
  serviceType:
    'Premium online English learning school for children aged 3–12 with structured phonics, grammar, reading, sentence formation, communication, and public speaking programs',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Service',
    telephone: SEMANTIC_FACTS.contact.telephoneDisplay,
    email: SEMANTIC_FACTS.contact.email,
    url: `${SITE_ORIGIN}${SEMANTIC_FACTS.contact.contactPath}`,
    areaServed: [...SEMANTIC_FACTS.serviceArea.schemaAreaServed],
    availableLanguage: ['en'],
  },
  knowsAbout: [
    'online phonics classes for children',
    'online grammar and sentence formation classes for children',
    'online reading classes for children',
    'online communication and public speaking programs for children',
    'online public speaking classes for children',
  ],
  sameAs: [...ORGANIZATION_SAME_AS_URLS],
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  name: PUBLIC_FACTS.brandName,
  url: SITE_ORIGIN,
  inLanguage: 'en-IN',
  publisher: {
    '@id': ORGANIZATION_ID,
  },
};

export const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': `${SITE_ORIGIN}/#localbusiness`,
  name: PUBLIC_FACTS.brandName,
  image: `${SITE_ORIGIN}/logo-square.webp`,
  description: 'Premium online English learning school for children aged 3–12',
  telephone: SEMANTIC_FACTS.contact.telephoneDisplay,
  email: SEMANTIC_FACTS.contact.email,
  url: SITE_ORIGIN,
  parentOrganization: {
    '@id': ORGANIZATION_ID,
  },
  address: {
    '@type': 'PostalAddress',
    addressLocality: SEMANTIC_FACTS.serviceArea.city,
    addressRegion: SEMANTIC_FACTS.serviceArea.region,
    addressCountry: SEMANTIC_FACTS.serviceArea.primaryCountryCode,
  },
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens: '07:00',
    closes: '23:59',
  },
};

export function createWebPageSchema(params: {
  name: string;
  description?: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${params.url}#webpage`,
    name: params.name,
    url: params.url,
    ...(params.description ? { description: params.description } : {}),
    isPartOf: {
      '@id': WEBSITE_ID,
    },
    publisher: {
      '@id': ORGANIZATION_ID,
    },
    about: {
      '@id': ORGANIZATION_ID,
    },
    inLanguage: 'en-IN',
  };
}

export function createTestimonialsStructuredData(params: {
  name?: string;
  url: string;
  organizationType?: 'EducationalOrganization' | 'Organization';
  ratingValue: number;
  ratingCount: number;
  reviewCount: number;
  reviews: Array<{
    authorName: string;
    datePublished: string;
    reviewBody: string;
    ratingValue: number;
  }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': params.organizationType || 'EducationalOrganization',
    name: params.name || PUBLIC_FACTS.brandName,
    url: params.url,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: params.ratingValue,
      bestRating: 5,
      worstRating: 1,
      ratingCount: params.ratingCount,
      reviewCount: params.reviewCount,
    },
    review: params.reviews.map((entry) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: entry.authorName,
      },
      datePublished: entry.datePublished,
      reviewBody: entry.reviewBody,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: entry.ratingValue,
        bestRating: 5,
        worstRating: 1,
      },
    })),
  };
}

export function createHowToSchema(title: string, steps: string[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: title,
    step: steps.map((text, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: `Step ${index + 1}`,
      text,
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['.how-to-step'],
        xpath: [`//li[@class="how-to-step"][${index + 1}]`],
      },
    })),
  };
}

export function createBlogPostingSchema(params: {
  headline: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  articleBody: string;
  category?: string;
  url: string;
  wordCount?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: params.headline,
    description: params.description,
    author: {
      '@type': 'Person',
      name: params.author,
    },
    datePublished: params.datePublished,
    dateModified: params.dateModified || params.datePublished,
    image: params.image || `${SITE_ORIGIN}/logo-square.webp`,
    articleBody: params.articleBody,
    articleSection: params.category || 'Education',
    ...(params.wordCount && { wordCount: params.wordCount }),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': params.url,
    },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', 'article > p:first-of-type'],
      xpath: ['/html/body/article/h1', '/html/body/article/p[1]'],
    },
    publisher: {
      '@type': 'EducationalOrganization',
      '@id': ORGANIZATION_ID,
      name: PUBLIC_FACTS.organizationName,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_ORIGIN}/logo-square.webp`,
      },
    },
  };
}

export function createFAQPageSchema(items: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['.faq-question', '.faq-answer'],
        xpath: ['//h3[@class="faq-question"]', '//p[@class="faq-answer"]'],
      },
    })),
  };
}

export function createServiceSchema(params: {
  name: string;
  description: string;
  serviceType: string;
  areaServed: string | string[];
  url: string;
  audienceType?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: params.name,
    description: params.description,
    serviceType: params.serviceType,
    provider: {
      '@id': ORGANIZATION_ID,
      '@type': 'EducationalOrganization',
      name: PUBLIC_FACTS.organizationName,
      url: `${SITE_ORIGIN}/`,
    },
    areaServed: params.areaServed,
    ...(params.audienceType
      ? {
          audience: {
            '@type': 'EducationalAudience',
            educationalRole: 'student',
            audienceType: params.audienceType,
          },
        }
      : {}),
    url: params.url,
    inLanguage: 'en-IN',
  };
}

export function createCourseSchema(params: {
  name: string;
  description: string;
  url: string;
  provider?: string;
  educationalLevel?: string;
  teaches?: string[];
  areaServed?: string | string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: params.name,
    description: params.description,
    url: params.url,
    provider: {
      '@id': ORGANIZATION_ID,
      '@type': 'EducationalOrganization',
      name: PUBLIC_FACTS.organizationName,
      url: `${SITE_ORIGIN}/`,
    },
    ...(params.educationalLevel && {
      educationalLevel: params.educationalLevel,
    }),
    ...(params.teaches?.length && {
      teaches: params.teaches,
    }),
    ...(params.areaServed && {
      areaServed: params.areaServed,
    }),
    audience: {
      '@type': 'EducationalAudience',
      educationalRole: 'student',
      audienceType: 'Children',
    },
    inLanguage: 'en-IN',
    isAccessibleForFree: false,
  };
}

export function createCourseListSchema(params: {
  name: string;
  url: string;
  description?: string;
  courses: Array<{
    id?: string;
    name: string;
    description: string;
    url: string;
    provider?: string;
    educationalLevel?: string;
    audienceType?: string;
    inLanguage?: string;
  }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: params.name,
    ...(params.description ? { description: params.description } : {}),
    url: params.url,
    numberOfItems: params.courses.length,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement: params.courses.map((course, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: course.url,
      item: {
        '@type': 'Course',
        ...(course.id ? { '@id': course.id } : {}),
        name: course.name,
        description: course.description,
        provider: {
          '@type': 'EducationalOrganization',
          '@id': ORGANIZATION_ID,
          name: PUBLIC_FACTS.organizationName,
          url: `${SITE_ORIGIN}/`,
        },
        ...(course.educationalLevel ? { educationalLevel: course.educationalLevel } : {}),
        ...(course.audienceType
          ? {
              audience: {
                '@type': 'EducationalAudience',
                educationalRole: 'student',
                audienceType: course.audienceType,
              },
            }
          : {}),
        ...(course.inLanguage ? { inLanguage: course.inLanguage } : {}),
        url: course.url,
      },
    })),
  };
}

export function createEventSchema(params: {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  eventStatus: 'EventScheduled' | 'EventCancelled' | 'EventPostponed' | 'EventRescheduled' | 'EventMovedOnline';
  availability?: 'https://schema.org/InStock' | 'https://schema.org/OutOfStock' | 'https://schema.org/PreOrder';
  validFrom?: string;
  price?: number;
  url: string;
  locationType?: 'online' | 'physical' | 'mixed';
  locationName?: string;
  virtualUrl?: string;
  eventAttendanceMode?: 'OfflineEventAttendanceMode' | 'OnlineEventAttendanceMode' | 'MixedEventAttendanceMode';
  organizer?: string;
}) {
  let location: any;
  if (params.locationType === 'physical' && params.locationName) {
    location = {
      '@type': 'Place',
      name: params.locationName,
    };
  } else if (params.locationType === 'mixed' && params.virtualUrl && params.locationName) {
    location = {
      '@type': 'VirtualLocation',
      url: params.virtualUrl || params.url,
    };
  } else {
    location = {
      '@type': 'VirtualLocation',
      url: params.virtualUrl || params.url,
    };
  }

  const event: any = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: params.name,
    description: params.description,
    startDate: params.startDate,
    endDate: params.endDate,
    eventStatus: `https://schema.org/${params.eventStatus}`,
    eventAttendanceMode: `https://schema.org/${params.eventAttendanceMode || 'OnlineEventAttendanceMode'}`,
    location,
    organizer: {
      '@type': 'Organization',
      name: params.organizer || PUBLIC_FACTS.brandName,
      url: SITE_ORIGIN,
    },
  };

  if (params.availability && params.validFrom && params.price) {
    event.offers = {
      '@type': 'Offer',
      price: params.price,
      priceCurrency: 'INR',
      availability: params.availability,
      url: params.url,
      validFrom: params.validFrom,
    };
  }

  return event;
}

export default {
  organizationSchema,
  localBusinessSchema,
  createHowToSchema,
  createBlogPostingSchema,
  createFAQPageSchema,
  createServiceSchema,
  createCourseSchema,
  createCourseListSchema,
  createEventSchema,
};
