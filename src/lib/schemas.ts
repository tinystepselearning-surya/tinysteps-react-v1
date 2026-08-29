/**
 * Reusable schema definitions for Tiny Steps Learning
 * Used across pages for consistent structured data (SEO + voice search)
 */

import { PUBLIC_CONTACT_EMAIL } from '../constants/publicContact';

export const SITE_ORIGIN = 'https://tinystepslearning.com';
export const PUBLIC_FACTS = {
  brandName: 'Tiny Steps Learning',
  shortBrandName: 'Tiny Steps',
  organizationName: 'Tiny Steps Early Education',
  founder: {
    displayName: 'Priya',
    fullName: 'Vannala Ravali Priya',
    givenName: 'Ravali Priya',
    familyName: 'Vannala',
    alternateNames: ['Priya', 'Ravali Priya', 'Vannala Ravali Priya', 'Vannal Ravali Priya'] as const,
  },
  positioning: 'premium online English learning school for children aged 3–12',
  corePrograms: ['Phonics', 'Grammar', 'Public Speaking'] as const,
  sessionDuration: '35–40 minutes per session',
  primaryWebsite: SITE_ORIGIN,
  deliveryModel: 'live online classes',
  geography: 'learners in India and globally online',
} as const;
export const CORE_PROGRAMS_TEXT = `${PUBLIC_FACTS.corePrograms[0]}, ${PUBLIC_FACTS.corePrograms[1]}, and ${PUBLIC_FACTS.corePrograms[2]}`;
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
      `${PUBLIC_FACTS.brandName} offers ${PUBLIC_FACTS.positioning} through ${PUBLIC_FACTS.deliveryModel} in ${PUBLIC_FACTS.sessionDuration}, serving ${PUBLIC_FACTS.geography}.`,
    medium:
      `${PUBLIC_FACTS.brandName} is a premium live-online English learning platform for children. The learning model is structured around ${CORE_PROGRAMS_TEXT}, so families can choose the right starting point and progress step by step. Classes are delivered online in ${PUBLIC_FACTS.sessionDuration}, with child-friendly teaching and clear parent visibility of learning goals and next steps.`,
    long:
      `${PUBLIC_FACTS.brandName} is built for families who want a clear, high-quality online English learning journey for children. We provide ${PUBLIC_FACTS.deliveryModel} with focused pathways in ${CORE_PROGRAMS_TEXT}. Instead of random topic coverage, teaching follows structured progression so children can build strong foundations, apply learning with confidence, and move forward with clarity. Session design is age-aware and practical, with ${PUBLIC_FACTS.sessionDuration} that balance instruction, guided practice, and feedback. We support ${PUBLIC_FACTS.geography}, while maintaining one consistent academic approach: premium, child-friendly, and outcome-focused without overclaiming.`,
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
      `${PUBLIC_FACTS.brandName} offers premium live online English classes for children, including ${CORE_PROGRAMS_TEXT}. Classes run for ${PUBLIC_FACTS.sessionDuration} and serve learners in India and globally online.`,
    linkedInCompanyAboutSummary:
      `${PUBLIC_FACTS.brandName} is a ${PUBLIC_FACTS.positioning} platform focused on ${CORE_PROGRAMS_TEXT}. We deliver ${PUBLIC_FACTS.deliveryModel} with structured progression, child-friendly teaching, and clear parent visibility of learning milestones.`,
    youTubeChannelAboutSummary:
      `${PUBLIC_FACTS.brandName} shares learning guidance and class-focused insights for families exploring premium live-online English learning for children across ${CORE_PROGRAMS_TEXT}.`,
  },

  // Internal guidance for review requests: keep trust-safe and platform-compliant.
  reviewRequestPositioningNote:
    'Request honest reviews only, and never filter for positive sentiment or offer incentives.',
} as const;

export const ORGANIZATION_ID = `${SITE_ORIGIN}/#educational-organization`;
export const WEBSITE_ID = `${SITE_ORIGIN}/#website`;
export const FOUNDER_ID = `${SITE_ORIGIN}/#founder`;

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  '@id': ORGANIZATION_ID,
  name: PUBLIC_FACTS.organizationName,
  alternateName: [PUBLIC_FACTS.brandName, PUBLIC_FACTS.shortBrandName],
  url: `${SITE_ORIGIN}/`,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_ORIGIN}/logo-square.webp`
  },
  founder: {
    '@type': 'Person',
    '@id': FOUNDER_ID,
    name: PUBLIC_FACTS.founder.fullName,
    givenName: PUBLIC_FACTS.founder.givenName,
    familyName: PUBLIC_FACTS.founder.familyName,
    alternateName: [...PUBLIC_FACTS.founder.alternateNames],
    jobTitle: 'Founder',
    worksFor: {
      '@id': ORGANIZATION_ID,
    },
  },
  description:
    'Tiny Steps Learning is a premium online English learning school for children aged 3–12, offering structured phonics, grammar, reading, sentence formation, communication, and public speaking programs.',
  foundingDate: '2020',
  foundingLocation: {
    '@type': 'Place',
    name: 'India'
  },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Hyderabad',
    addressRegion: 'Telangana',
    addressCountry: 'IN'
  },
  areaServed: ['IN', 'Worldwide'],
  serviceType:
    'Premium online English learning school for children aged 3–12 with structured phonics, grammar, reading, sentence formation, communication, and public speaking programs',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Service',
    telephone: '+91-9618398383',
    email: PUBLIC_CONTACT_EMAIL,
    url: `${SITE_ORIGIN}/contact`,
    areaServed: ['IN', 'Worldwide'],
    availableLanguage: ['en']
  },
  knowsAbout: [
    'online phonics classes for children',
    'online grammar and sentence formation classes for children',
    'online reading classes for children',
    'online communication and public speaking programs for children',
    'online public speaking classes for children',
  ],
  sameAs: [
    'https://www.facebook.com/tinystepslearning',
    'https://www.instagram.com/tiny_steps_oel/',
    'https://www.youtube.com/@TinyStepsLearning-1157',
    'https://www.linkedin.com/company/tiny-steps-learning/',
  ]
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
  telephone: '+91-9618398383',
  email: PUBLIC_CONTACT_EMAIL,
  url: SITE_ORIGIN,
  parentOrganization: {
    '@id': ORGANIZATION_ID,
  },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Hyderabad',
    addressRegion: 'Telangana',
    addressCountry: 'IN'
  },
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens: '07:00',
    closes: '23:59'
  }
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

/**
 * Create HowTo schema for parent guide pages
 * @param title - Guide title (e.g., "Getting started with phonics")
 * @param steps - Array of step strings
 * @returns HowTo schema object
 */
export function createHowToSchema(title: string, steps: string[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: title,
    step: steps.map((text, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: `Step ${index + 1}`,
      text: text,
      // Add speakable markup for voice search
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['.how-to-step'],
        xpath: [`//li[@class="how-to-step"][${index + 1}]`]
      }
    }))
  };
}

/**
 * Create BlogPosting schema with speakable markup
 * @param title - Article headline
 * @param description - Meta description
 * @param author - Author name
 * @param datePublished - ISO date string
 * @param dateModified - ISO date string
 * @param image - Image URL
 * @param articleBody - Full article text
 * @param category - Article category
 * @param url - Canonical URL
 * @param wordCount - Word count (optional)
 * @returns BlogPosting schema object
 */
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
      name: params.author
    },
    datePublished: params.datePublished,
    dateModified: params.dateModified || params.datePublished,
    image: params.image || 'https://tinystepslearning.com/logo-square.webp',
    articleBody: params.articleBody,
    articleSection: params.category || 'Education',
    ...(params.wordCount && { wordCount: params.wordCount }),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': params.url
    },
    // Speakable for voice search & assistant integration
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', 'article > p:first-of-type'],
      xpath: ['/html/body/article/h1', '/html/body/article/p[1]']
    },
    // Publisher info
    publisher: {
      '@type': 'EducationalOrganization',
      '@id': ORGANIZATION_ID,
      name: PUBLIC_FACTS.organizationName,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_ORIGIN}/logo-square.webp`
      }
    }
  };
}

/**
 * Create FAQPage schema with speakable markup
 * @param items - Array of {question, answer} objects
 * @returns FAQPage schema object
 */
export function createFAQPageSchema(items: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      },
      // Speakable for voice assistants
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['.faq-question', '.faq-answer'],
        xpath: ['//h3[@class="faq-question"]', '//p[@class="faq-answer"]']
      }
    }))
  };
}

/**
 * Create Service schema for local SEO landing pages
 * @param name - Service name
 * @param description - Service description
 * @param serviceType - Generic service type label
 * @param areaServed - Geographic area served
 * @param url - Canonical URL of the service page
 * @param audienceType - Optional audience type (e.g., "Children")
 * @returns Service schema object
 */
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

/**
 * Create Course schema for program pages (Phonics, Grammar, Speaking)
 * @param name - Course name
 * @param description - Course description
 * @param url - Course landing page URL
 * @returns Course schema object
 */
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
      url: `${SITE_ORIGIN}/`
    },
    ...(params.educationalLevel && {
      educationalLevel: params.educationalLevel
    }),
    ...(params.teaches?.length && {
      teaches: params.teaches
    }),
    ...(params.areaServed && {
      areaServed: params.areaServed
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

/**
 * Create an ItemList-based course list schema for course hub pages.
 * This complements per-course Course nodes with a host-carousel-friendly list.
 */
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

/**
 * Create Event schema for events such as summer camp batches
 *
 * @param name - Event name (e.g., "Phonics Fast Track Summer Camp 2026")
 * @param description - Event description
 * @param startDate - ISO date string
 * @param endDate - ISO date string
 * @param location - Event location (default: "Online")
 * @param eventStatus - Status of the event (EventScheduled, EventCancelled, etc.). Required for proper schema.
 * @param availability - Offer availability enum if commercial offer exists (e.g., 'https://schema.org/InStock'). Omit if no offer.
 * @param validFrom - ISO date string for offer validFrom. Required if offer exists. Must not be current build time.
 * @param price - Event price in INR (optional). Only include if commercial details are real and current.
 * @param url - Event landing page URL
 * @param locationType - Whether location is 'online', 'physical', or 'mixed'
 * @param locationName - Physical location name if applicable
 * @param virtualUrl - Virtual event URL if applicable
 * @param eventAttendanceMode - Event attendance mode
 * @param organizer - Organizer name (defaults to PUBLIC_FACTS.brandName)
 * @returns Event schema object
 */
export function createEventSchema(params: {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  eventStatus: 'EventScheduled' | 'EventCancelled' | 'EventPostponed' | 'EventRescheduled' | 'EventMovedOnline';
  availability?: 'https://schema.org/InStock' | 'https://schema.org/OutOfStock' | 'https://schema.org/PreOrder';
  validFrom?: string; // ISO date. Required if availability is set.
  price?: number;
  url: string;
  locationType?: 'online' | 'physical' | 'mixed';
  locationName?: string;
  virtualUrl?: string;
  eventAttendanceMode?: 'OfflineEventAttendanceMode' | 'OnlineEventAttendanceMode' | 'MixedEventAttendanceMode';
  organizer?: string;
}) {
  // Build location object based on type
  let location: any;
  if (params.locationType === 'physical' && params.locationName) {
    location = {
      '@type': 'Place',
      name: params.locationName
    };
  } else if (params.locationType === 'mixed' && params.virtualUrl && params.locationName) {
    location = {
      '@type': 'VirtualLocation',
      url: params.virtualUrl || params.url
    };
  } else {
    // Default to virtual
    location = {
      '@type': 'VirtualLocation',
      url: params.virtualUrl || params.url
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
      url: 'https://tinystepslearning.com'
    },
  };

  // Only add offer if both availability and validFrom are explicitly provided
  if (params.availability && params.validFrom && params.price) {
    event.offers = {
      '@type': 'Offer',
      price: params.price,
      priceCurrency: 'INR',
      availability: params.availability,
      url: params.url,
      validFrom: params.validFrom
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
  createEventSchema
};
