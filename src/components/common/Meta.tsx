// Thin wrapper around applySeo to keep Meta API compatible while delegating
import { useEffect } from 'react';
import type { FC } from 'react';
import { applySeo } from '../../lib/seo';
import { organizationSchema } from '../../lib/schemas';

type MetaProps = {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string; // absolute preferred; if missing we auto-generate from current URL
  robots?: string;
  jsonLd?: Record<string, any> | Record<string, any>[];
};

const DEFAULT_TITLE = 'Tiny Steps Learning | 1:1 Online English Classes for Kids';
const DEFAULT_DESCRIPTION =
  'Premium 1:1 online English classes for ages 3–12. IB-aligned phonics, grammar and public speaking with kind live mentors, AI-guided practice, and simple stage-based progress updates for parents. Book a free assessment class.';

const Meta: FC<MetaProps> = ({ title, description, keywords, canonical, robots, jsonLd }) => {
  useEffect(() => {
    const finalTitle = title?.trim() || DEFAULT_TITLE;
    const finalDescription = (description ?? DEFAULT_DESCRIPTION).trim();

    // compute canonical path per rules
    let canonicalPath: string | undefined;
    try {
      if (canonical && canonical.trim()) {
        const c = canonical.trim();
        if (c.startsWith('http')) {
          try {
            canonicalPath = new URL(c).pathname || '/';
          } catch {
            canonicalPath = c;
          }
        } else if (c.startsWith('/')) {
          canonicalPath = c;
        } else {
          canonicalPath = c;
        }
      } else if (typeof window !== 'undefined') {
        canonicalPath = window.location.pathname;
      }
    } catch {
      canonicalPath = undefined;
    }

    // Merge base org schema with page-specific jsonLd for public pages only
    let mergedJsonLd: Record<string, any> | Record<string, any>[] | undefined;
    const isPrivateDashboard = canonicalPath && (
      canonicalPath.startsWith('/admin') ||
      canonicalPath.startsWith('/teacher') ||
      canonicalPath.startsWith('/parent') ||
      canonicalPath.startsWith('/kids') ||
      canonicalPath.startsWith('/learning-partner/dashboard') ||
      canonicalPath.startsWith('/surya')
    );

    if (!isPrivateDashboard) {
      // Check if page-specific jsonLd already includes Organization schema
      const pageJsonLdArray = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
      const hasOrgSchema = pageJsonLdArray.some(
        (schema) => schema?.['@type'] === 'Organization' || schema?.['@type'] === 'EducationalOrganization'
      );

      if (hasOrgSchema) {
        // Page already includes org schema; use as-is
        mergedJsonLd = jsonLd;
      } else {
        // Add base org schema first, then page-specific schemas
        mergedJsonLd = [organizationSchema, ...pageJsonLdArray];
      }
    } else {
      // Private dashboard: use page-specific jsonLd only (if any)
      mergedJsonLd = jsonLd;
    }

    applySeo({
      title: finalTitle,
      description: finalDescription,
      canonicalPath,
      robots: robots?.trim() || 'index, follow',
      ogType: 'website',
      jsonLd: mergedJsonLd,
    });

    // keywords: keep optional behavior — set/remove meta[name="keywords"]
    try {
      const existing = typeof document !== 'undefined' ? document.querySelector('meta[name="keywords"]') as HTMLMetaElement | null : null;
      const kw = keywords?.trim();
      if (!kw) {
        if (existing) existing.remove();
      } else {
        if (existing) {
          existing.setAttribute('content', kw);
        } else if (typeof document !== 'undefined') {
          const el = document.createElement('meta');
          el.setAttribute('name', 'keywords');
          el.setAttribute('content', kw);
          document.head.appendChild(el);
        }
      }
    } catch {
      // no-op
    }
  }, [title, description, keywords, canonical, robots, jsonLd]);

  return null;
};

export default Meta;
