export type GrammarReferenceExtensionRouteEntry = Readonly<{
  id: string;
  cardTitle: string;
  relatedPaths: readonly string[];
  path: string;
  title: string;
  description: string;
}>;

export const GRAMMAR_REFERENCE_EXTENSION_ROUTE_MANIFEST: readonly GrammarReferenceExtensionRouteEntry[];
export const GRAMMAR_REFERENCE_EXTENSION_PATHS: readonly string[];
export const GRAMMAR_REFERENCE_EXTENSION_RESOURCE_SEO: Readonly<Record<string, Readonly<{
  title: string;
  description: string;
  canonicalPath: string;
  ogType: string;
}>>>;
