export type VocabularyAuthorityRouteEntry = Readonly<{
  order: number;
  id: string;
  stageId: string;
  path: string;
  slug: string;
  cardTitle: string;
  title: string;
  description: string;
  relatedPaths: readonly string[];
}>;

export const VOCABULARY_AUTHORITY_REVISION: string;
export const VOCABULARY_HUB_SEO: Readonly<{
  title: string;
  description: string;
  canonicalPath: '/resources/vocabulary';
  ogType: string;
}>;
export const VOCABULARY_AUTHORITY_ROUTE_MANIFEST: readonly VocabularyAuthorityRouteEntry[];
export const VOCABULARY_AUTHORITY_PATHS: readonly string[];
export const VOCABULARY_AUTHORITY_RESOURCE_SEO: Readonly<Record<string, Readonly<{
  title: string;
  description: string;
  canonicalPath: string;
  ogType: string;
}>>>;
