// Lightweight meta + JSON-LD injector without extra deps
import { useEffect } from "react";
import type { FC } from "react";

type MetaProps = {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string; // absolute preferred; if missing we auto-generate from current URL
  jsonLd?: Record<string, any> | Record<string, any>[];
};

const DEFAULT_TITLE = "Tiny Steps Learning | 1:1 Online English Classes for Kids";
const DEFAULT_DESCRIPTION =
  "Premium 1:1 online English classes for ages 3–12. IB-aligned phonics, grammar and public speaking with kind live mentors, AI-guided practice, and simple weekly progress updates for parents. Book a free assessment class.";

const upsertMetaByName = (name: string, content?: string) => {
  const existing = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;

  // Remove if empty/undefined so old tags don't “stick” across SPA navigation.
  if (!content) {
    if (existing) existing.remove();
    return;
  }

  const el = existing ?? document.createElement("meta");
  el.setAttribute("name", name);
  el.setAttribute("content", content);
  if (!existing) document.head.appendChild(el);
};

const upsertMetaByProperty = (property: string, content?: string) => {
  const existing = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;

  if (!content) {
    if (existing) existing.remove();
    return;
  }

  const el = existing ?? document.createElement("meta");
  el.setAttribute("property", property);
  el.setAttribute("content", content);
  if (!existing) document.head.appendChild(el);
};

const setCanonical = (href?: string) => {
  const existing = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;

  if (!href) {
    if (existing) existing.remove();
    return;
  }

  const el = existing ?? document.createElement("link");
  el.setAttribute("rel", "canonical");
  el.setAttribute("href", href);
  if (!existing) document.head.appendChild(el);
};

const computeCanonical = () => {
  try {
    const u = new URL(window.location.href);
    // strip query + hash
    return `${u.origin}${u.pathname}`;
  } catch {
    return undefined;
  }
};

const Meta: FC<MetaProps> = ({ title, description, keywords, canonical, jsonLd }) => {
  useEffect(() => {
    const finalTitle = title?.trim() || DEFAULT_TITLE;
    const finalDescription = (description ?? DEFAULT_DESCRIPTION).trim();

    document.title = finalTitle;

    upsertMetaByName("description", finalDescription);

    // NOTE: Google generally ignores meta keywords for ranking, but we keep it optional.
    upsertMetaByName("keywords", keywords?.trim());

    const finalCanonical = (canonical && canonical.trim()) || computeCanonical();
    setCanonical(finalCanonical);

    // Open Graph (helps WhatsApp / social previews)
    upsertMetaByProperty("og:title", finalTitle);
    upsertMetaByProperty("og:description", finalDescription);
    upsertMetaByProperty("og:url", finalCanonical);
    upsertMetaByProperty("og:type", "website");

    // JSON-LD: replace blocks each route change
    const existing = Array.from(document.querySelectorAll('script[data-meta-jsonld="true"]'));
    existing.forEach((n) => n.remove());

    const blocks = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
    for (const block of blocks) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-meta-jsonld", "true");
      script.text = JSON.stringify(block);
      document.head.appendChild(script);
    }
  }, [title, description, keywords, canonical, jsonLd]);

  return null;
};

export default Meta;

