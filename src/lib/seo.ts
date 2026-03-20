// src/lib/seo.ts
import { SUBJECT_LANDING_ROUTE_META } from '../content/publicSubjectLandings';
import { organizationSchema } from './schemas';

type SeoConfig = {
  title: string;
  description?: string;
  keywords?: string | string[];
  canonicalPath?: string; // e.g. "/courses" (defaults to current path)
  noIndex?: boolean; // set true ONLY for private/test pages
  robots?: string; // optional explicit robots value (e.g. "noindex, nofollow")
  ogType?: "website" | "article";
  ogImage?: string; // absolute or "/..." path
  jsonLd?: object | object[];
};

const CANONICAL_ORIGIN = "https://tinystepslearning.com";
const JSONLD_SCRIPT_ID = "ts-jsonld";

// Private dashboard paths that should NOT get organization schema
const PRIVATE_PATH_PREFIXES = [
  '/admin',
  '/teacher',
  '/parent',
  '/kids',
  '/learning-partner/dashboard',
  '/surya'
];

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
  // Note: We now use a single script#ts-jsonld, so this legacy cleanup is kept for compatibility
  document.head
    .querySelectorAll('script[type="application/ld+json"][data-ts-seo="1"]:not(#ts-jsonld)')
    .forEach((n) => n.remove());
}

/**
 * Helper to generate a stable key for schema deduplication
 * Prefers @id if present, otherwise uses @type + stringified object
 */
function getSchemaKey(schema: any): string {
  if (schema?.['@id']) return `id:${schema['@id']}`;
  const type = schema?.['@type'] || 'Unknown';
  // Use JSON.stringify for stable comparison (note: not perfect for deeply nested objects with different key orders)
  return `${type}:${JSON.stringify(schema)}`;
}

/**
 * Deduplicate schemas by stable key
 * Keep first occurrence of each unique schema
 */
function deduplicateSchemas(schemas: any[]): any[] {
  const seen = new Set<string>();
  const result: any[] = [];
  
  for (const schema of schemas) {
    const key = getSchemaKey(schema);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(schema);
    }
  }
  
  return result;
}

/**
 * Coerce loose numeric inputs used in schema values.
 * Example: "250+" -> 250, "4.9" -> 4.9
 */
function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return undefined;

  const normalized = value.trim().replace(/,/g, '');
  if (!normalized) return undefined;
  const match = normalized.match(/-?\d+(\.\d+)?/);
  if (!match) return undefined;

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toInteger(value: unknown): number | undefined {
  const parsed = toFiniteNumber(value);
  if (parsed === undefined) return undefined;
  return Math.trunc(parsed);
}

/**
 * Normalize JSON-LD for stricter schema validators.
 * In particular, AggregateRating.ratingCount must be an integer.
 */
function sanitizeSchemaNode(node: any): any {
  if (Array.isArray(node)) {
    return node.map((item) => sanitizeSchemaNode(item));
  }

  if (!node || typeof node !== 'object') {
    return node;
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(node)) {
    sanitized[key] = sanitizeSchemaNode(value);
  }

  if (sanitized['@type'] === 'AggregateRating') {
    const ratingValue = toFiniteNumber(sanitized.ratingValue);
    const ratingCount = toInteger(sanitized.ratingCount);
    const bestRating = toFiniteNumber(sanitized.bestRating);
    const worstRating = toFiniteNumber(sanitized.worstRating);

    if (ratingValue !== undefined) sanitized.ratingValue = ratingValue;
    if (ratingCount !== undefined) sanitized.ratingCount = ratingCount;
    else delete sanitized.ratingCount;
    if (bestRating !== undefined) sanitized.bestRating = bestRating;
    if (worstRating !== undefined) sanitized.worstRating = worstRating;
  }

  return sanitized;
}

/**
 * Check if path is a private dashboard route
 */
function isPrivatePath(path: string): boolean {
  return PRIVATE_PATH_PREFIXES.some(prefix => path.startsWith(prefix));
}

export function applySeo(cfg: SeoConfig) {
  // Title
  document.title = cfg.title;

  // Description (ensure removal when empty)
  upsertMeta('meta[name="description"]', {
    name: 'description',
    content: cfg.description ?? undefined,
  });

  // Keywords (optional, mainly for non-Google engines and internal SEO tooling)
  const keywordsValue = Array.isArray(cfg.keywords) ? cfg.keywords.join(', ') : cfg.keywords;
  upsertMeta('meta[name="keywords"]', {
    name: 'keywords',
    content: keywordsValue ?? undefined,
  });

  // Canonical
  const path = cfg.canonicalPath ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
  const canonicalUrl = path === '/' ? `${CANONICAL_ORIGIN}/` : `${CANONICAL_ORIGIN}${path}`;
  upsertLink('link[rel="canonical"]', { rel: 'canonical', href: canonicalUrl });
  upsertLink('link[rel="alternate"][hreflang="en-IN"]', { rel: 'alternate', hreflang: 'en-IN', href: canonicalUrl });
  upsertLink('link[rel="alternate"][hreflang="en"]', { rel: 'alternate', hreflang: 'en', href: canonicalUrl });
  upsertLink('link[rel="alternate"][hreflang="x-default"]', { rel: 'alternate', hreflang: 'x-default', href: canonicalUrl });

  // Robots: allow explicit override via cfg.robots, else use noIndex flag
  const robotsContent = cfg.robots ?? (cfg.noIndex ? 'noindex, nofollow' : 'index, follow');
  upsertMeta('meta[name="robots"]', { name: 'robots', content: robotsContent });
  upsertMeta('meta[name="googlebot"]', { name: 'googlebot', content: robotsContent });
  upsertMeta('meta[name="bingbot"]', { name: 'bingbot', content: robotsContent });

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

  // Resolve OG image: prefer explicit cfg.ogImage, else provide a parents default for /parents routes, else fallback to og-default.jpg
  const resolvedOgImage = (function () {
    if (cfg.ogImage) return cfg.ogImage.startsWith('http') ? cfg.ogImage : `${CANONICAL_ORIGIN}${cfg.ogImage}`;
    try {
      if (path && path.startsWith('/parents')) return `${CANONICAL_ORIGIN}/og-parents.png`;
    } catch (e) {
      /* ignore */
    }
    // Fallback to default OG image for all public pages
    return `${CANONICAL_ORIGIN}/og-default.jpg`;
  })();

  const resolvedOgImageType =
    resolvedOgImage.endsWith('.jpg') || resolvedOgImage.endsWith('.jpeg')
      ? 'image/jpeg'
      : resolvedOgImage.endsWith('.webp')
        ? 'image/webp'
        : 'image/png';

  // Always set OG image (we now always have a fallback)
  upsertMeta('meta[property="og:image"]', { property: 'og:image', content: resolvedOgImage });
  upsertMeta('meta[property="og:image:secure_url"]', { property: 'og:image:secure_url', content: resolvedOgImage });
  upsertMeta('meta[property="og:image:type"]', { property: 'og:image:type', content: resolvedOgImageType });
  upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: resolvedOgImage });
  upsertMeta('meta[name="twitter:image:alt"]', {
    name: 'twitter:image:alt',
    content: 'Tiny Steps Learning - Online English classes for kids',
  });
  upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });

  // JSON-LD with merge + dedupe to handle multiple applySeo calls
  removeExistingJsonLd(); // Clean up legacy data-ts-seo scripts
  
  // 1. Read existing schemas from our managed script (ONLY if same path)
  let existingSchemas: any[] = [];
  const existingScript = document.getElementById(JSONLD_SCRIPT_ID);
  if (existingScript && existingScript.textContent) {
    // Check if existing schemas belong to the same page
    const existingPath = existingScript.dataset.path || '';
    const canonicalPath = cfg.canonicalPath || path;
    
    if (existingPath === canonicalPath) {
      // Same page: allow merge (handles multiple applySeo calls on same page)
      try {
        const parsed = JSON.parse(existingScript.textContent);
        existingSchemas = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        // Invalid JSON, ignore and start fresh
        existingSchemas = [];
      }
    }
    // else: Different page, existingSchemas stays [] (no bleed)
  }
  
  // 2. Normalize new schemas to array
  const newSchemas = cfg.jsonLd 
    ? (Array.isArray(cfg.jsonLd) ? cfg.jsonLd : [cfg.jsonLd])
    : [];
  
  // 3. Add base organization schema for public pages
  const isPrivate = isPrivatePath(path);
  const baseSchemas: any[] = [];
  
  if (!isPrivate) {
    // Check if org schema already exists in existing or new schemas
    const allSchemas = [...existingSchemas, ...newSchemas];
    const hasOrgSchema = allSchemas.some(
      s => s?.['@type'] === 'Organization' || s?.['@type'] === 'EducationalOrganization'
    );
    
    if (!hasOrgSchema) {
      baseSchemas.push(organizationSchema);
    }
  }
  
  // 4. Merge and deduplicate: [base org, ...existing, ...new]
  const mergedSchemas = [...baseSchemas, ...existingSchemas, ...newSchemas];
  const finalSchemas = deduplicateSchemas(mergedSchemas).map((schema) => sanitizeSchemaNode(schema));
  
  // 5. Write to single managed script element with path marker
  let scriptEl = document.getElementById(JSONLD_SCRIPT_ID) as HTMLScriptElement | null;
  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = JSONLD_SCRIPT_ID;
    scriptEl.type = 'application/ld+json';
    scriptEl.setAttribute('data-ts-seo', '1');
    document.head.appendChild(scriptEl);
  }
  
  // Always write as array for consistency
  scriptEl.textContent = JSON.stringify(finalSchemas);
  // Store path to prevent schema bleed across routes
  scriptEl.dataset.path = cfg.canonicalPath || path;
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
    title: 'Online Phonics, Grammar & Public Speaking Classes for Kids | Tiny Steps Learning',
    description: '1:1 online phonics, grammar, and public speaking classes for kids ages 3–12. Structured curriculum, trained teachers, weekly parent updates, and free assessment.',
    canonicalPath: '/',
    ogType: 'website',
    ogImage: '/og-default.jpg',
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
  '/book-demo': {
    title: 'Book Free Assessment Class | Tiny Steps Learning',
    description: 'Book a free 1:1 assessment class for your child (ages 3-12). Discover their English level and get a personalized learning plan. Live online classes with expert mentors. No credit card required.',
    canonicalPath: '/book-demo',
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
  '/careers': {
    title: 'Careers | Join the Tiny Steps Team',
    description: 'We’re hiring remote part-time Online Teachers, Learning Partners, and Curriculum Administrators. Work with children aged 3–12. Apply on WhatsApp.',
    canonicalPath: '/careers',
    ogType: 'website',
  },
  '/learning-partner': {
    title: 'Learning Partner Support | Tiny Steps Learning',
    description: 'Learn how Tiny Steps Learning Partners support parents, teachers, and children with onboarding, scheduling, and steady progress.',
    canonicalPath: '/learning-partner',
    ogType: 'website',
  },
  '/privacy-policy': {
    title: 'Privacy Policy | Tiny Steps Learning',
    description: 'Read the Tiny Steps Learning privacy policy covering family data collection, children’s privacy, cookies, security, retention, and parent rights.',
    canonicalPath: '/privacy-policy',
    ogType: 'website',
  },
  '/terms-and-conditions': {
    title: 'Terms and Conditions | Tiny Steps Learning',
    description: 'Review the Tiny Steps Learning terms covering enrolment, payments, scheduling, conduct, intellectual property, liability, and governing law.',
    canonicalPath: '/terms-and-conditions',
    robots: 'noindex, follow',
    ogType: 'website',
  },
  '/refund-guarantee': {
    title: 'Refund and Guarantee Policy | Tiny Steps Learning',
    description: 'Read the Tiny Steps Learning refund and guarantee policy covering assessments, 7-day refunds, unused classes, mentor fit, and refund processing timelines.',
    canonicalPath: '/refund-guarantee',
    robots: 'noindex, follow',
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
    title: 'Summer Camps for Kids | Tiny Steps Learning',
    description: 'Summer English Camp 2026 now lives under Tiny Steps Summer Camps. Explore online group batches in India for phonics, grammar, and speaking fast-track tracks with enrollment at ₹2,400 (70% off).',
    canonicalPath: '/summer-camps',
    robots: 'noindex, follow',
    ogType: 'website',
  },
  '/online-phonics-reading-classes': {
    title: 'Online Phonics & Reading Classes for Kids | Tiny Steps Learning',
    description: 'Specialized 1:1 online phonics and reading classes. Master early literacy with expert guidance and interactive practice.',
    canonicalPath: '/online-phonics-reading-classes',
    ogType: 'website',
  },
  '/best-online-phonics-classes-india': {
    title: 'Best Online Phonics Classes in India | Tiny Steps Learning',
    description: 'Compare online phonics classes in India with a clear parent checklist covering method, teacher quality, class format, pricing, and progress tracking.',
    canonicalPath: '/best-online-phonics-classes-india',
    ogType: 'website',
  },
  '/phonics-apps-for-preschoolers-india': {
    title: 'Phonics Apps for Preschoolers in India | Tiny Steps Learning',
    description: 'Parent-friendly guide to phonics apps for preschoolers in India with screen-time advice, app selection criteria, and a simple home routine.',
    canonicalPath: '/phonics-apps-for-preschoolers-india',
    ogType: 'website',
  },
  '/phonics-games-for-preschoolers': {
    title: 'Phonics Games for Preschoolers | Tiny Steps Learning',
    description: 'Simple phonics games for preschoolers that build letter-sound recognition, blending confidence, and short daily practice habits.',
    canonicalPath: '/phonics-games-for-preschoolers',
    ogType: 'website',
  },
  '/phonics-learning-games': {
    title: 'Phonics Practice Games for Kids | Tiny Steps Learning',
    description: 'Interactive phonics practice games for kids with tracing, sound work, and reading readiness. ₹199/month or ₹999 lifetime per child, with a 3-day free trial.',
    canonicalPath: '/phonics-learning-games',
    ogType: 'website',
  },
  '/summer-camps': {
    title: 'Online Summer Camp for Kids in India | Tiny Steps Learning',
    description: 'Online summer camp for kids in India with 10-week phonics, grammar, and speaking fast-track group courses. Fast Track Pack enrollment at ₹2,400 (70% off) with weekly parent updates.',
    canonicalPath: '/summer-camps',
    robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
    ogType: 'website',
  },
  ...SUBJECT_LANDING_ROUTE_META,
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
  '/learning-partner/dashboard': {
    title: 'Learning Partner Dashboard | Tiny Steps Learning',
    description: 'Learning partner dashboard.',
    canonicalPath: '/learning-partner/dashboard',
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
