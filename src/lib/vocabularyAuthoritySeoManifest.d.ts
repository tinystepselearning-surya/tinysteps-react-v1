export type VocabularyAuthorityRouteEntry = Readonly<{
  id: string;
  cardTitle: string;
  path: string;
  title: string;
  description: string;
}>;

export const VOCABULARY_HUB_PATH: '/resources/vocabulary';
export const VOCABULARY_AUTHORITY_ROUTE_MANIFEST: readonly VocabularyAuthorityRouteEntry[];
export const VOCABULARY_AUTHORITY_PATHS: readonly string[];
export const VOCABULARY_RESOURCE_SEO: Readonly<Record<string, Readonly<{
  title: string;
  description: string;
  canonicalPath: string;
  ogType: string;
}>>>;
