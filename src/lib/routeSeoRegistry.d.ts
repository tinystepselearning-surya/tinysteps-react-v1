export type RouteSeoRegistryEntry = {
  title: string;
  description: string;
  canonicalPath: string;
  robots?: string;
  keywords?: string | string[];
  ogImage?: string;
  ogType?: 'website' | 'article';
};

export const ROUTE_SEO_REGISTRY: Record<string, RouteSeoRegistryEntry>;
export function getRouteConfig(pathname: string): RouteSeoRegistryEntry | null;
