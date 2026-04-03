// src/lib/seo.ts
import {
  ROUTE_SEO_REGISTRY as SHARED_ROUTE_SEO_REGISTRY,
  getRouteConfig as getSharedRouteConfig,
} from './routeSeoRegistry.js';
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

function getSchemaTypes(node: Record<string, any>): string[] {
  const type = node['@type'];
  if (typeof type === 'string') return [type];
  if (Array.isArray(type)) return type.filter((item): item is string => typeof item === 'string');
  return [];
}

function isValidCount(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/**
 * Normalize JSON-LD for stricter schema validators.
 * In particular, AggregateRating.ratingCount must be an integer.
 */
function sanitizeSchemaNode(node: any): any | undefined {
  if (Array.isArray(node)) {
    return node
      .map((item) => sanitizeSchemaNode(item))
      .filter((item) => item !== undefined);
  }

  if (!node || typeof node !== 'object') {
    return node;
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(node)) {
    const next = sanitizeSchemaNode(value);
    if (next !== undefined) sanitized[key] = next;
  }

  const types = getSchemaTypes(sanitized);

  if (types.includes('AggregateRating')) {
    const ratingValue = toFiniteNumber(sanitized.ratingValue);
    const ratingCount = toInteger(sanitized.ratingCount);
    const reviewCount = toInteger(sanitized.reviewCount);
    const bestRating = toFiniteNumber(sanitized.bestRating);
    const worstRating = toFiniteNumber(sanitized.worstRating);

    const normalizedRatingCount = isValidCount(ratingCount) ? ratingCount : undefined;
    const normalizedReviewCount = isValidCount(reviewCount) ? reviewCount : undefined;

    // AggregateRating is ineligible if ratingValue is missing/invalid
    // or if both counts are missing/invalid.
    if (ratingValue === undefined || (!normalizedRatingCount && !normalizedReviewCount)) {
      return undefined;
    }

    sanitized.ratingValue = ratingValue;
    if (normalizedRatingCount !== undefined) sanitized.ratingCount = normalizedRatingCount;
    else delete sanitized.ratingCount;
    if (normalizedReviewCount !== undefined) sanitized.reviewCount = normalizedReviewCount;
    else delete sanitized.reviewCount;

    if (bestRating !== undefined) sanitized.bestRating = bestRating;
    else delete sanitized.bestRating;
    if (worstRating !== undefined) sanitized.worstRating = worstRating;
    else delete sanitized.worstRating;

    if (
      typeof sanitized.bestRating === 'number' &&
      typeof sanitized.worstRating === 'number' &&
      sanitized.bestRating <= sanitized.worstRating
    ) {
      delete sanitized.bestRating;
      delete sanitized.worstRating;
    }
  }

  if (types.includes('Rating')) {
    const ratingValue = toFiniteNumber(sanitized.ratingValue);
    if (ratingValue === undefined) return undefined;
    sanitized.ratingValue = ratingValue;

    const bestRating = toFiniteNumber(sanitized.bestRating);
    const worstRating = toFiniteNumber(sanitized.worstRating);
    if (bestRating !== undefined) sanitized.bestRating = bestRating;
    else delete sanitized.bestRating;
    if (worstRating !== undefined) sanitized.worstRating = worstRating;
    else delete sanitized.worstRating;
  }

  return Object.keys(sanitized).length ? sanitized : undefined;
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
  document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((node) => node.remove());

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
      (schema) => getSchemaTypes(schema).some((type) => type === 'Organization' || type === 'EducationalOrganization')
    );
    
    if (!hasOrgSchema) {
      baseSchemas.push(organizationSchema);
    }
  }
  
  // 4. Merge and deduplicate: [base org, ...existing, ...new]
  const mergedSchemas = [...baseSchemas, ...existingSchemas, ...newSchemas];
  const finalSchemas = deduplicateSchemas(mergedSchemas)
    .map((schema) => sanitizeSchemaNode(schema))
    .filter((schema): schema is Record<string, any> => schema !== undefined);
  
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
  keywords?: string | string[];
  ogImage?: string;
  ogType?: "website" | "article";
};

/**
 * Complete SEO registry for all publicly prerendered routes.
 * Used at build time to inject meta tags into dist/<route>/index.html
 */
export const ROUTE_SEO_REGISTRY: Record<string, RouteConfig> = SHARED_ROUTE_SEO_REGISTRY;

/**
 * Helper function to get SEO config for a given route pathname.
 * Used at build time by prerender.mjs to inject meta tags.
 * @param pathname e.g. "/" or "/courses" or "/blog/my-post"
 * @returns RouteConfig or null if not in registry
 */
export function getRouteConfig(pathname: string): RouteConfig | null {
  return getSharedRouteConfig(pathname) as RouteConfig | null;
}
