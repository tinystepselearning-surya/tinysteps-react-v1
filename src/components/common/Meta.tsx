// Thin wrapper around applySeo to keep Meta API compatible while delegating
import { useEffect } from 'react';
import type { FC } from 'react';
import { ORGANIZATION_SAME_AS_URLS } from '../../config/semanticFacts';
import { applySeo } from '../../lib/seo';
import { organizationSchema } from '../../lib/schemas';

type MetaProps = {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  robots?: string;
  jsonLd?: Record<string, any> | Record<string, any>[];
};

const DEFAULT_TITLE = 'Tiny Steps Learning | Premium Online English Learning School for Children';
const DEFAULT_DESCRIPTION =
  'Tiny Steps Learning is a premium online English learning school for children aged 3–12, offering structured phonics, grammar, reading, sentence formation, communication, and public speaking programs.';

function hasOrganizationType(schema: Record<string, any> | undefined) {
  const type = schema?.['@type'];
  if (typeof type === 'string') {
    return type === 'Organization' || type === 'EducationalOrganization';
  }
  if (Array.isArray(type)) {
    return type.includes('Organization') || type.includes('EducationalOrganization');
  }
  return false;
}

function withCanonicalOrganizationSameAs(schema: Record<string, any>) {
  if (!hasOrganizationType(schema)) return schema;

  const currentSameAs = Array.isArray(schema.sameAs)
    ? schema.sameAs
    : schema.sameAs
      ? [schema.sameAs]
      : [];

  return {
    ...schema,
    sameAs: Array.from(new Set([...currentSameAs, ...ORGANIZATION_SAME_AS_URLS])),
  };
}

const Meta: FC<MetaProps> = ({ title, description, keywords, canonical, robots, jsonLd }) => {
  useEffect(() => {
    const finalTitle = title?.trim() || DEFAULT_TITLE;
    const finalDescription = (description ?? DEFAULT_DESCRIPTION).trim();

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
      const pageJsonLdArray = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
      const pageJsonLdWithCanonicalProfiles = pageJsonLdArray.map((schema) =>
        withCanonicalOrganizationSameAs(schema),
      );
      const hasOrgSchema = pageJsonLdArray.some((schema) => hasOrganizationType(schema));

      if (hasOrgSchema) {
        mergedJsonLd = Array.isArray(jsonLd)
          ? pageJsonLdWithCanonicalProfiles
          : pageJsonLdWithCanonicalProfiles[0];
      } else {
        mergedJsonLd = [
          withCanonicalOrganizationSameAs(organizationSchema),
          ...pageJsonLdWithCanonicalProfiles,
        ];
      }
    } else {
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

    try {
      const existing = typeof document !== 'undefined'
        ? document.querySelector('meta[name="keywords"]') as HTMLMetaElement | null
        : null;
      const kw = keywords?.trim();
      if (!kw) {
        if (existing) existing.remove();
      } else if (existing) {
        existing.setAttribute('content', kw);
      } else if (typeof document !== 'undefined') {
        const el = document.createElement('meta');
        el.setAttribute('name', 'keywords');
        el.setAttribute('content', kw);
        document.head.appendChild(el);
      }
    } catch {
      // no-op
    }
  }, [title, description, keywords, canonical, robots, jsonLd]);

  return null;
};

export default Meta;
