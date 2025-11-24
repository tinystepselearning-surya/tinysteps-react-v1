// Lightweight meta + JSON-LD injector without extra deps
import { useEffect } from 'react';
import type { FC } from 'react';

type MetaProps = {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  jsonLd?: Record<string, any> | Record<string, any>[];
};

const DEFAULT_DESCRIPTION = 'Premium 1:1 online English school for ages 3–12. IB-aligned phonics, grammar and public speaking with kind live mentors, AI-guided practice and weekly parent progress insights. Free assessment class; flexible monthly plans.';

const setTag = (name: string, content?: string) => {
  if (!content) return;
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const Meta: FC<MetaProps> = ({ title, description, keywords, canonical, jsonLd }) => {
  useEffect(() => {
    if (title) document.title = title;
    setTag('description', description ?? DEFAULT_DESCRIPTION);
    setTag('keywords', keywords);
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonical);
    }

    // JSON-LD
    const existing = Array.from(document.querySelectorAll('script[data-meta-jsonld="true"]'));
    existing.forEach((n) => n.parentElement?.removeChild(n));
    const blocks = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
    for (const block of blocks) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-meta-jsonld', 'true');
      script.text = JSON.stringify(block);
      document.head.appendChild(script);
    }
  }, [title, description, keywords, canonical, jsonLd]);

  return null;
};

export default Meta;

