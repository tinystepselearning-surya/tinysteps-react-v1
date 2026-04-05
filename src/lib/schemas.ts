/**
 * Reusable schema definitions for Tiny Steps Learning
 * Used across pages for consistent structured data (SEO + voice search)
 */

import { PUBLIC_CONTACT_EMAIL } from '../constants/publicContact';

export const SITE_ORIGIN = 'https://tinystepslearning.com';
export const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`;
export const WEBSITE_ID = `${SITE_ORIGIN}/#website`;

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': ['EducationalOrganization', 'Organization'],
  '@id': ORGANIZATION_ID,
  name: 'Tiny Steps Learning',
  alternateName: 'Tiny Steps',
  url: SITE_ORIGIN,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_ORIGIN}/logo-square.webp`
  },
  description: 'Online phonics, grammar, and public speaking classes for children ages 3–12',
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
  areaServed: 'IN',
  serviceType: 'Online English classes for kids',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Service',
    telephone: '+91-9618398383',
    email: PUBLIC_CONTACT_EMAIL,
    url: `${SITE_ORIGIN}/contact`,
    areaServed: 'IN',
    availableLanguage: ['en']
  },
  knowsAbout: [
    'online phonics classes for kids',
    'online grammar classes for kids',
    'online spoken English classes for kids',
    'online public speaking classes for kids',
    'reading classes for children',
  ],
  sameAs: [
    'https://www.facebook.com/tinystepslearning',
    'https://www.instagram.com/tinystepslearning',
    'https://www.youtube.com/@TinyStepsLearning-1157',
    'https://www.linkedin.com/company/tinystepslearning',
    'https://wa.me/919618398383'
  ]
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  name: 'Tiny Steps Learning',
  url: SITE_ORIGIN,
  inLanguage: 'en-IN',
  publisher: {
    '@id': ORGANIZATION_ID,
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_ORIGIN}/courses?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': `${SITE_ORIGIN}/#localbusiness`,
  name: 'Tiny Steps Learning',
  image: `${SITE_ORIGIN}/logo-square.webp`,
  description: 'Online English learning platform',
  telephone: '+91-9618398383',
  email: PUBLIC_CONTACT_EMAIL,
  url: SITE_ORIGIN,
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
    about: {
      '@id': ORGANIZATION_ID,
    },
    inLanguage: 'en-IN',
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
    wordCount: params.wordCount || 1500,
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
      '@type': 'Organization',
      '@id': ORGANIZATION_ID,
      name: 'Tiny Steps Learning',
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
 * Create Course schema for program pages (Phonics, Grammar, Speaking)
 * @param name - Course name (e.g., "Phonics Reading Program")
 * @param description - Course description
 * @param provider - Provider name (default: "Tiny Steps Learning")
 * @param url - Course landing page URL
 * @param price - Course price in INR (optional)
 * @returns Course schema object with speakable markup
 */
export function createCourseSchema(params: {
  name: string;
  description: string;
  provider?: string;
  url: string;
  price?: number;
  courseMode?: 'online' | 'offline' | 'blended';
  educationalLevel?: string;
  ageRange?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: params.name,
    description: params.description,
    provider: {
      '@type': 'Organization',
      '@id': ORGANIZATION_ID,
      name: params.provider || 'Tiny Steps Learning',
      url: SITE_ORIGIN
    },
    url: params.url,
    ...(params.price && {
      offers: {
        '@type': 'Offer',
        price: params.price,
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        url: params.url
      }
    }),
    ...(params.courseMode && {
      courseMode: params.courseMode
    }),
    ...(params.educationalLevel && {
      educationalLevel: params.educationalLevel
    }),
    ...(params.ageRange && {
      audience: {
        '@type': 'EducationalAudience',
        educationalRole: 'student',
        audienceType: params.ageRange
      }
    }),
    // Speakable for voice search
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '.course-description', '.course-outcomes'],
      xpath: ['/html/body//h1', '/html/body//p[@class="course-description"]']
    }
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
          '@type': 'Organization',
          '@id': ORGANIZATION_ID,
          name: course.provider || 'Tiny Steps Learning',
          url: SITE_ORIGIN,
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
 * Create Event schema for summer camp batches
 * @param name - Event name (e.g., "Phonics Fast Track Summer Camp 2026")
 * @param description - Event description
 * @param startDate - ISO date string
 * @param endDate - ISO date string
 * @param location - Event location (default: "Online")
 * @param price - Event price in INR (optional)
 * @param url - Event landing page URL
 * @returns Event schema object
 */
export function createEventSchema(params: {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
  price?: number;
  url: string;
  eventAttendanceMode?: 'OfflineEventAttendanceMode' | 'OnlineEventAttendanceMode' | 'MixedEventAttendanceMode';
  organizer?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: params.name,
    description: params.description,
    startDate: params.startDate,
    endDate: params.endDate,
    eventAttendanceMode: `https://schema.org/${params.eventAttendanceMode || 'OnlineEventAttendanceMode'}`,
    location: params.location
      ? {
          '@type': 'VirtualLocation',
          url: params.url
        }
      : {
          '@type': 'VirtualLocation',
          url: 'https://tinystepslearning.com/summer-camps'
        },
    organizer: {
      '@type': 'Organization',
      name: params.organizer || 'Tiny Steps Learning',
      url: 'https://tinystepslearning.com'
    },
    ...(params.price && {
      offers: {
        '@type': 'Offer',
        price: params.price,
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        url: params.url,
        validFrom: new Date().toISOString()
      }
    })
  };
}

export default {
  organizationSchema,
  localBusinessSchema,
  createHowToSchema,
  createBlogPostingSchema,
  createFAQPageSchema,
  createCourseSchema,
  createCourseListSchema,
  createEventSchema
};
