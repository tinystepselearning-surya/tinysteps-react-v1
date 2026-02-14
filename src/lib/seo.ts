// src/lib/seo.ts
type SeoConfig = {
  title: string;
  description?: string;
  canonicalPath?: string; // e.g. "/courses" (defaults to current path)
  noIndex?: boolean; // set true ONLY for private/test pages
  robots?: string; // optional explicit robots value (e.g. "noindex, nofollow")
  ogType?: "website" | "article";
  ogImage?: string; // absolute or "/..." path
  jsonLd?: object | object[];
};

const CANONICAL_ORIGIN = "https://tinystepslearning.com";

function upsertMeta(selector: string, attrs: Record<string, string | undefined>) {
  const el = document.head.querySelector(selector) as HTMLMetaElement | null;

  const content = attrs.content;
  // If no content provided, remove existing tag to avoid sticky meta across SPA navigation
  if (!content) {
    if (el) el.remove();
    return;
  }

  let target = el;
  if (!target) {
    target = document.createElement("meta");
    document.head.appendChild(target);
  }
  Object.entries(attrs).forEach(([k, v]) => {
    if (v === undefined) return;
    target!.setAttribute(k, v);
  });
}

function upsertLink(selector: string, attrs: Record<string, string | undefined>) {
  const el = document.head.querySelector(selector) as HTMLLinkElement | null;
  const href = attrs.href;
  if (!href) {
    if (el) el.remove();
    return;
  }
  let target = el;
  if (!target) {
    target = document.createElement("link");
    document.head.appendChild(target);
  }
  Object.entries(attrs).forEach(([k, v]) => {
    if (v === undefined) return;
    target!.setAttribute(k, v);
  });
}

function removeExistingJsonLd() {
  document.head
    .querySelectorAll('script[type="application/ld+json"][data-ts-seo="1"]')
    .forEach((n) => n.remove());
}

export function applySeo(cfg: SeoConfig) {
  // Title
  document.title = cfg.title;

  // Description (ensure removal when empty)
  upsertMeta('meta[name="description"]', {
    name: 'description',
    content: cfg.description ?? undefined,
  });

  // Canonical
  const path = cfg.canonicalPath ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
  const canonicalUrl = path === '/' ? `${CANONICAL_ORIGIN}/` : `${CANONICAL_ORIGIN}${path}`;
  upsertLink('link[rel="canonical"]', { rel: 'canonical', href: canonicalUrl });

  // Robots: allow explicit override via cfg.robots, else use noIndex flag
  const robotsContent = cfg.robots ?? (cfg.noIndex ? 'noindex, nofollow' : 'index, follow');
  upsertMeta('meta[name="robots"]', { name: 'robots', content: robotsContent });

  // Open Graph basics (keep in sync / remove when absent)
  upsertMeta('meta[property="og:title"]', { property: 'og:title', content: cfg.title });
  upsertMeta('meta[property="og:description"]', {
    property: 'og:description',
    content: cfg.description ?? undefined,
  });
  upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
  upsertMeta('meta[property="og:type"]', { property: 'og:type', content: cfg.ogType ?? 'website' });

  // Twitter metadata: keep in sync with OG but allow pages to override via cfg
  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: cfg.title });
  upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: cfg.description ?? undefined });

  // Resolve OG image: prefer explicit cfg.ogImage, else provide a parents default for /parents routes, else fallback to og-default.png
  const resolvedOgImage = (function () {
    if (cfg.ogImage) return cfg.ogImage.startsWith('http') ? cfg.ogImage : `${CANONICAL_ORIGIN}${cfg.ogImage}`;
    try {
      if (path && path.startsWith('/parents')) return `${CANONICAL_ORIGIN}/og-parents.png`;
    } catch (e) {
      /* ignore */
    }
    // Fallback to default OG image for all public pages
    return `${CANONICAL_ORIGIN}/og-default.png`;
  })();

  // Always set OG image (we now always have a fallback)
  upsertMeta('meta[property="og:image"]', { property: 'og:image', content: resolvedOgImage });
  upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: resolvedOgImage });
  upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });

  // JSON-LD (optional)
  removeExistingJsonLd();
  if (cfg.jsonLd) {
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.setAttribute('data-ts-seo', '1');
    s.text = JSON.stringify(cfg.jsonLd);
    document.head.appendChild(s);
  }
}

// ============================================================================
// BUILD-TIME ROUTE SEO REGISTRY
// Exported for use in prerender.mjs to inject meta into generated HTML
// ============================================================================

export type RouteConfig = {
  title: string;
  description: string;
  canonicalPath: string;
  robots?: string; // defaults to "index, follow"
  ogImage?: string;
  ogType?: "website" | "article";
};

/**
 * Complete SEO registry for all publicly prerendered routes.
 * Used at build time to inject meta tags into dist/<route>/index.html
 */
export const ROUTE_SEO_REGISTRY: Record<string, RouteConfig> = {
  '/': {
    title: 'Tiny Steps Learning | 1:1 Online English Classes for Kids',
    description: 'Premium 1:1 online English classes for ages 3–12. IB-aligned phonics, grammar and public speaking with kind live mentors, AI-guided practice, and simple weekly progress updates for parents. Book a free assessment class.',
    canonicalPath: '/',
    ogType: 'website',
    ogImage: '/og-default.png',
  },
  '/courses': {
    title: 'English Courses for Kids | Tiny Steps Learning',
    description: 'Browse our range of 1:1 online English courses for kids ages 3–12. Phonics, grammar, public speaking, and more. Customized to each child\'s pace and learning style.',
    canonicalPath: '/courses',
    ogType: 'website',
  },
  '/curriculum': {
    title: 'IB-Aligned English Curriculum | Tiny Steps Learning',
    description: 'Explore our comprehensive, IB-aligned English curriculum for young learners. Phonics mastery, grammar fundamentals, and communication skills—all designed by education experts.',
    canonicalPath: '/curriculum',
    ogType: 'website',
  },
  '/phonics': {
    title: 'Online Phonics Classes for Kids | Tiny Steps Learning',
    description: 'Personalized 1:1 online phonics classes for kids ages 3–6. Master letter sounds, blending, and early reading with expert live mentors and AI practice games.',
    canonicalPath: '/phonics',
    ogType: 'website',
  },
  '/grammar': {
    title: 'English Grammar Classes for Kids | Tiny Steps Learning',
    description: 'Transform your child\'s grammar confidence. 1:1 online grammar classes for kids ages 6–12, covering parts of speech, sentence structure, and more.',
    canonicalPath: '/grammar',
    ogType: 'website',
  },
  '/speaking': {
    title: 'Public Speaking & Communication Classes for Kids | Tiny Steps Learning',
    description: 'Build communication confidence. 1:1 online public speaking classes for kids ages 6–12. Presentation skills, fluency, and confident self-expression.',
    canonicalPath: '/speaking',
    ogType: 'website',
  },
  '/blog': {
    title: 'Blog | Tiny Steps Learning',
    description: 'Read expert articles on English language learning, teaching strategies, and child development. Tips for parents and educators.',
    canonicalPath: '/blog',
    ogType: 'website',
  },
  '/pricing': {
    title: 'Pricing & Plans | Tiny Steps Learning',
    description: 'Affordable, transparent pricing for 1:1 online English classes. Choose the plan that fits your family. No hidden fees.',
    canonicalPath: '/pricing',
    ogType: 'website',
  },
  '/contact': {
    title: 'Contact Us | Tiny Steps Learning',
    description: 'Have questions? Get in touch with our team. We\'re here to help you find the perfect English class for your child.',
    canonicalPath: '/contact',
    ogType: 'website',
  },
  '/why-tiny-steps': {
    title: 'Why Choose Tiny Steps Learning | Online English Classes for Kids',
    description: 'Discover why thousands of families trust Tiny Steps Learning. Expert mentors, personalized learning, proven results.',
    canonicalPath: '/why-tiny-steps',
    ogType: 'website',
  },
  '/faq': {
    title: 'Frequently Asked Questions | Tiny Steps Learning',
    description: 'Find answers to common questions about our 1:1 online English classes, curriculum, scheduling, pricing, and more.',
    canonicalPath: '/faq',
    ogType: 'website',
  },
  '/for-schools': {
    title: 'English Program for Schools | Tiny Steps Learning',
    description: 'Tiny Steps Learning partners with schools to deliver high-quality, personalized English instruction for groups or individuals.',
    canonicalPath: '/for-schools',
    ogType: 'website',
  },
  '/parents': {
    title: 'Parents Hub | Tiny Steps Learning',
    description: 'Resources and guides for parents. Learn how to support your child\'s English learning journey at home.',
    canonicalPath: '/parents',
    ogType: 'website',
    ogImage: '/og-parents.png',
  },
  '/parents/getting-started': {
    title: 'Getting Started Guide | Parents Hub | Tiny Steps Learning',
    description: 'A step-by-step guide for parents to get started with Tiny Steps Learning. Enrollment, first class, and what to expect.',
    canonicalPath: '/parents/getting-started',
    ogType: 'article',
  },
  '/parents/choosing-course': {
    title: 'Choosing the Right Course for Your Child | Parents Hub | Tiny Steps Learning',
    description: 'How to choose the best English course for your child\'s age, level, and learning goals.',
    canonicalPath: '/parents/choosing-course',
    ogType: 'article',
  },
  '/parents/scheduling': {
    title: 'Scheduling Classes | Parents Hub | Tiny Steps Learning',
    description: 'Tips for scheduling and managing your child\'s online English classes with flexibility and consistency.',
    canonicalPath: '/parents/scheduling',
    ogType: 'article',
  },
  '/parents/payments': {
    title: 'Payments & Invoicing | Parents Hub | Tiny Steps Learning',
    description: 'Learn about our flexible payment options, billing cycles, and invoicing for English classes.',
    canonicalPath: '/parents/payments',
    ogType: 'article',
  },
  '/parents/tracking-progress': {
    title: 'Tracking Your Child\'s Progress | Parents Hub | Tiny Steps Learning',
    description: 'Understand how Tiny Steps Learning helps you track your child\'s English learning progress and celebrate milestones.',
    canonicalPath: '/parents/tracking-progress',
    ogType: 'article',
  },
  '/parents/helping-with-homework': {
    title: 'Helping with Homework | Parents Hub | Tiny Steps Learning',
    description: 'Tips and strategies for parents to support their child\'s English practice and homework between classes.',
    canonicalPath: '/parents/helping-with-homework',
    ogType: 'article',
  },
  '/parents/phonics-mission': {
    title: 'Phonics Mission Guide | Parents Hub | Tiny Steps Learning',
    description: 'A parent\'s guide to the Phonics Mission program. How to help your child master phonics through engaging practice.',
    canonicalPath: '/parents/phonics-mission',
    ogType: 'article',
  },
  '/parents/reading-at-home': {
    title: 'Reading at Home | Parents Hub | Tiny Steps Learning',
    description: 'Strategies for parents to encourage reading at home and support your child\'s literacy development.',
    canonicalPath: '/parents/reading-at-home',
    ogType: 'article',
  },
  '/parents/speech-confidence': {
    title: 'Building Speech Confidence | Parents Hub | Tiny Steps Learning',
    description: 'How to help your shy child build confidence in speaking English. Tips from our expert mentors.',
    canonicalPath: '/parents/speech-confidence',
    ogType: 'article',
  },
  '/parents/common-mistakes': {
    title: 'Common Learning Mistakes | Parents Hub | Tiny Steps Learning',
    description: 'Avoid common pitfalls in English learning. Expert advice from Tiny Steps Learning mentors.',
    canonicalPath: '/parents/common-mistakes',
    ogType: 'article',
  },
  '/summer-english-camp-2026': {
    title: 'Summer English Camp 2026 | Tiny Steps Learning',
    description: 'Join our immersive Summer English Camp 2026. Dynamic group sessions, games, and creative projects for kids ages 6–12.',
    canonicalPath: '/summer-english-camp-2026',
    ogType: 'website',
  },
  '/online-phonics-reading-classes': {
    title: 'Online Phonics & Reading Classes for Kids | Tiny Steps Learning',
    description: 'Specialized 1:1 online phonics and reading classes. Master early literacy with expert guidance and interactive practice.',
    canonicalPath: '/online-phonics-reading-classes',
    ogType: 'website',
  },
  '/english-grammar-writing-classes': {
    title: 'English Grammar & Writing Classes for Kids | Tiny Steps Learning',
    description: 'Improve grammar and writing skills with 1:1 online classes. For kids ages 7–12. Clear explanations, practical exercises, and feedback.',
    canonicalPath: '/english-grammar-writing-classes',
    ogType: 'website',
  },
  '/public-speaking-communication-kids': {
    title: 'Public Speaking & Communication Classes for Kids | Tiny Steps Learning',
    description: 'Build speaking confidence and communication skills. 1:1 online classes for kids ages 7–12. Presentations, fluency, and self-expression.',
    canonicalPath: '/public-speaking-communication-kids',
    ogType: 'website',
  },
  // Protected / Portal Routes — NOINDEX
  '/login': {
    title: 'Sign In | Tiny Steps Learning',
    description: 'Sign in to your Tiny Steps Learning account.',
    canonicalPath: '/login',
    robots: 'noindex, nofollow',
  },
  '/teacher/login': {
    title: 'Teacher Sign In | Tiny Steps Learning',
    description: 'Sign in as a teacher.',
    canonicalPath: '/teacher/login',
    robots: 'noindex, nofollow',
  },
  '/parent/login': {
    title: 'Parent Sign In | Tiny Steps Learning',
    description: 'Sign in as a parent.',
    canonicalPath: '/parent/login',
    robots: 'noindex, nofollow',
  },
  '/learning-partner/login': {
    title: 'Learning Partner Sign In | Tiny Steps Learning',
    description: 'Sign in as a learning partner.',
    canonicalPath: '/learning-partner/login',
    robots: 'noindex, nofollow',
  },
  '/surya/login': {
    title: 'Admin Sign In | Tiny Steps Learning',
    description: 'Admin sign in.',
    canonicalPath: '/surya/login',
    robots: 'noindex, nofollow',
  },
  '/admin/login': {
    title: 'Admin Sign In | Tiny Steps Learning',
    description: 'Admin sign in.',
    canonicalPath: '/admin/login',
    robots: 'noindex, nofollow',
  },
  '/unauthorized': {
    title: 'Unauthorized | Tiny Steps Learning',
    description: 'You do not have permission to access this resource.',
    canonicalPath: '/unauthorized',
    robots: 'noindex, nofollow',
  },
  '/surya': {
    title: 'Admin Dashboard | Tiny Steps Learning',
    description: 'Admin dashboard.',
    canonicalPath: '/surya',
    robots: 'noindex, nofollow',
  },
  '/teacher': {
    title: 'Teacher Dashboard | Tiny Steps Learning',
    description: 'Teacher dashboard.',
    canonicalPath: '/teacher',
    robots: 'noindex, nofollow',
  },
  '/parent': {
    title: 'Parent Dashboard | Tiny Steps Learning',
    description: 'Parent dashboard.',
    canonicalPath: '/parent',
    robots: 'noindex, nofollow',
  },
  '/kids': {
    title: 'Kids Portal | Tiny Steps Learning',
    description: 'Kids learning portal.',
    canonicalPath: '/kids',
    robots: 'noindex, nofollow',
  },
  '/learning-partner': {
    title: 'Learning Partner Dashboard | Tiny Steps Learning',
    description: 'Learning partner dashboard.',
    canonicalPath: '/learning-partner',
    robots: 'noindex, nofollow',
  },
};

/**
 * Helper function to get SEO config for a given route pathname.
 * Used at build time by prerender.mjs to inject meta tags.
 * @param pathname e.g. "/" or "/courses" or "/blog/my-post"
 * @returns RouteConfig or null if not in registry
 */
export function getRouteConfig(pathname: string): RouteConfig | null {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return ROUTE_SEO_REGISTRY[normalized] || null;
}
