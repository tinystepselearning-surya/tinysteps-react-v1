/**
 * SEO Utilities for Tiny Steps Learning
 * 
 * This file provides helper functions and constants for managing SEO across the application.
 * Use these utilities to set dynamic meta tags, structured data, and page-specific SEO.
 */

export interface PageSEO {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
  schema?: Record<string, any>;
}

// Base site information
export const SITE_CONFIG = {
  name: "Tiny Steps Learning",
  url: "https://tinystepslearning.com",
  logo: "https://tinystepslearning.com/assets/images/logo.png",
  ogImage: "https://tinystepslearning.com/assets/images/og-image.png",
  twitterHandle: "@tinystepslearn",
  facebookPage: "https://www.facebook.com/tinystepslearning",
  instagramPage: "https://www.instagram.com/tinystepslearning",
  defaultDescription: "India's premier online learning platform offering expert-led phonics, grammar, and public speaking classes for children aged 3-12 years.",
  phone: "+91-XXXXXXXXXX",
  email: "hello@tinystepslearning.com",
};

// Page-specific SEO configurations
export const PAGE_SEO: Record<string, PageSEO> = {
  home: {
    title: "Tiny Steps Learning | Online Phonics, Grammar & Public Speaking Classes for Kids India",
    description: "India's premier online learning platform for kids aged 3-12. Expert-led phonics, grammar & public speaking classes with 1-on-1 sessions, interactive games, and measurable progress tracking. Enroll now for a free trial!",
    keywords: "online phonics classes India, grammar classes for kids, public speaking for children, English learning for kids, kids communication skills, Jolly Phonics online, online tutoring India",
    canonicalUrl: SITE_CONFIG.url,
  },
  
  phonics: {
    title: "Phonics Classes for Kids Online | Jolly Phonics Programme India | Tiny Steps Learning",
    description: "Systematic phonics classes following Jolly Phonics methodology. Live 1-on-1 sessions with expert teachers, digital worksheets, interactive games & weekly progress updates for kids aged 3-8 years.",
    keywords: "phonics classes online India, Jolly Phonics online, phonics for kids, synthetic phonics, reading skills for kids, phonics tutoring India",
    canonicalUrl: `${SITE_CONFIG.url}/courses/phonics`,
  },
  
  grammar: {
    title: "Online Grammar Classes for Kids | Grammar & Writing Lab India | Tiny Steps Learning",
    description: "Comprehensive grammar and writing programme for kids aged 6-12. Master parts of speech, tenses, punctuation, sentence construction & creative writing with expert teachers and interactive workshops.",
    keywords: "grammar classes for kids, online grammar tutoring, writing classes for kids, English grammar India, grammar worksheets, kids writing skills",
    canonicalUrl: `${SITE_CONFIG.url}/courses/grammar`,
  },
  
  publicSpeaking: {
    title: "Public Speaking Classes for Kids Online | Confidence Building Programme | Tiny Steps",
    description: "Build confidence and communication skills with our public speaking programme for kids aged 5-12. Expert coaching in delivery, pronunciation, storytelling & presentation skills. Transform shy kids into confident speakers!",
    keywords: "public speaking for kids, communication skills for children, confidence building classes, speech classes for kids, presentation skills for kids",
    canonicalUrl: `${SITE_CONFIG.url}/courses/public-speaking`,
  },
  
  courses: {
    title: "Online Courses for Kids | Phonics, Grammar & Public Speaking | Tiny Steps Learning",
    description: "Explore our comprehensive online programmes: Phonics Foundations (ages 3-8), Grammar & Writing Lab (ages 6-12), and Public Speaking Studio (ages 5-12). Expert-led live classes with proven results.",
    keywords: "online courses for kids India, kids learning programmes, English courses for children, online education for kids",
    canonicalUrl: `${SITE_CONFIG.url}/courses`,
  },
  
  pricing: {
    title: "Pricing & Plans | Affordable Online Classes for Kids | Tiny Steps Learning",
    description: "Transparent pricing for quality online education. Choose from 1-on-1 personalized sessions or small group batches. Flexible monthly and quarterly plans. Start with a free trial class!",
    keywords: "online class pricing India, affordable kids classes, online tutoring costs, learning plans for kids",
    canonicalUrl: `${SITE_CONFIG.url}/pricing`,
  },
  
  about: {
    title: "About Us | Expert Online Education for Kids India | Tiny Steps Learning",
    description: "Learn about Tiny Steps Learning - India's trusted online education platform. Meet our expert teachers, understand our proven methodology & discover why parents choose us for their children's learning journey.",
    keywords: "online learning platform India, kids education company, certified teachers for kids, online tutoring India",
    canonicalUrl: `${SITE_CONFIG.url}/about`,
  },
  
  faq: {
    title: "FAQ | Frequently Asked Questions | Tiny Steps Learning",
    description: "Find answers to common questions about our online phonics, grammar & public speaking classes. Learn about class duration, schedules, pricing, curriculum, trial classes and more.",
    keywords: "online classes FAQ, phonics classes questions, online learning help",
    canonicalUrl: `${SITE_CONFIG.url}/faq`,
  },
  
  blog: {
    title: "Blog | Learning Tips & Resources for Parents | Tiny Steps Learning",
    description: "Expert tips, learning activities, and educational resources for parents. Weekly phonics lessons, grammar guides, speaking tips and more to support your child's learning journey at home.",
    keywords: "kids learning blog, phonics activities, grammar tips for kids, parenting resources India",
    canonicalUrl: `${SITE_CONFIG.url}/blog`,
  },
  
  // Portal pages (noindex)
  parentPortal: {
    title: "Parent Portal | Student Progress Dashboard | Tiny Steps Learning",
    description: "Access your child's learning dashboard, track progress, view attendance, manage payments and communicate with teachers.",
    noindex: true,
  },
  
  teacherPortal: {
    title: "Teacher Portal | Class Management & Resources | Tiny Steps Learning",
    description: "Manage your classes, track student progress, access teaching resources and submit session reports.",
    noindex: true,
  },
  
  login: {
    title: "Login | Tiny Steps Learning",
    description: "Login to access your Tiny Steps Learning portal.",
    noindex: true,
  },
  
  signup: {
    title: "Sign Up | Start Your Free Trial | Tiny Steps Learning",
    description: "Create an account and start your child's learning journey with a free trial class.",
    noindex: true,
  },
};

/**
 * Update page meta tags dynamically
 */
export function updatePageSEO(pageKey: keyof typeof PAGE_SEO) {
  const seo = PAGE_SEO[pageKey];
  if (!seo) return;

  // Update title
  document.title = seo.title;

  // Update or create meta tags
  const updateMeta = (name: string, content: string, property?: boolean) => {
    const attribute = property ? 'property' : 'name';
    let meta = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
    
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attribute, name);
      document.head.appendChild(meta);
    }
    meta.content = content;
  };

  // Basic meta tags
  updateMeta('description', seo.description);
  if (seo.keywords) updateMeta('keywords', seo.keywords);
  if (seo.noindex) {
    updateMeta('robots', 'noindex, nofollow');
  } else {
    updateMeta('robots', 'index, follow, max-image-preview:large');
  }

  // Open Graph
  updateMeta('og:title', seo.title, true);
  updateMeta('og:description', seo.description, true);
  updateMeta('og:url', seo.canonicalUrl || window.location.href, true);
  if (seo.ogImage) updateMeta('og:image', seo.ogImage, true);
  if (seo.ogType) updateMeta('og:type', seo.ogType, true);

  // Twitter Card
  updateMeta('twitter:title', seo.title);
  updateMeta('twitter:description', seo.description);

  // Canonical URL
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = seo.canonicalUrl || window.location.href;
}

/**
 * Generate structured data for Course pages
 */
export function generateCourseSchema(courseName: string, courseData: {
  description: string;
  level: string;
  ageRange: string;
  duration: string;
  price?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": courseName,
    "description": courseData.description,
    "provider": {
      "@type": "Organization",
      "name": SITE_CONFIG.name,
      "sameAs": SITE_CONFIG.url,
    },
    "educationalLevel": courseData.level,
    "audience": {
      "@type": "EducationalAudience",
      "educationalRole": "student",
      "audienceType": courseData.ageRange,
    },
    "hasCourseInstance": {
      "@type": "CourseInstance",
      "courseMode": "online",
      "courseWorkload": courseData.duration,
    },
    "offers": {
      "@type": "Offer",
      "category": "Paid",
      "priceCurrency": "INR",
      "price": courseData.price,
      "availability": "https://schema.org/InStock",
    },
  };
}

/**
 * Generate structured data for Blog posts
 */
export function generateBlogPostSchema(postData: {
  title: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": postData.title,
    "description": postData.description,
    "image": postData.image || SITE_CONFIG.ogImage,
    "author": {
      "@type": "Person",
      "name": postData.author,
    },
    "publisher": {
      "@type": "Organization",
      "name": SITE_CONFIG.name,
      "logo": {
        "@type": "ImageObject",
        "url": SITE_CONFIG.logo,
      },
    },
    "datePublished": postData.datePublished,
    "dateModified": postData.dateModified || postData.datePublished,
  };
}

/**
 * Inject structured data script into page
 */
export function injectStructuredData(schema: Record<string, any>) {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify(schema);
  document.head.appendChild(script);
}

/**
 * Remove existing dynamic structured data scripts
 */
export function removeDynamicStructuredData() {
  const scripts = document.querySelectorAll('script[type="application/ld+json"][data-dynamic="true"]');
  scripts.forEach(script => script.remove());
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url,
    })),
  };
}

/**
 * Get page title with site name
 */
export function getFullTitle(pageTitle: string): string {
  return `${pageTitle} | ${SITE_CONFIG.name}`;
}

/**
 * Validate and sanitize meta content
 */
export function sanitizeMetaContent(content: string, maxLength: number = 160): string {
  return content.trim().substring(0, maxLength);
}
