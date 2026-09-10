export type PublicRouteGroup = string;
export type PublicRouteIntent = 'index' | 'noindex';

export interface PublicRouteManifestEntry {
  readonly path: string;
  readonly group: PublicRouteGroup;
  readonly intent: PublicRouteIntent;
  readonly indexable: boolean;
  readonly prerender: boolean;
  readonly sitemap: boolean;
  readonly canonicalPath: string;
  readonly robots: string;
  readonly seoRegistry: true;
}

export const PUBLIC_ROUTE_MANIFEST: readonly PublicRouteManifestEntry[];
