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

  if (cfg.ogImage) {
    const img = cfg.ogImage.startsWith('http') ? cfg.ogImage : `${CANONICAL_ORIGIN}${cfg.ogImage}`;
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: img });
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
  } else {
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: undefined });
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary' });
  }

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
