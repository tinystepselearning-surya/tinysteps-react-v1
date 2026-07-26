import { PUBLIC_ROUTE_MANIFEST } from '../src/lib/publicRouteManifest.js';

export const STATIC_MARKETING_ROUTES = PUBLIC_ROUTE_MANIFEST
  .filter((entry) => entry.group !== 'parents' && entry.prerender)
  .map((entry) => entry.path);

export const PARENT_HELP_ROUTES = PUBLIC_ROUTE_MANIFEST
  .filter((entry) => entry.group === 'parents')
  .map((entry) => entry.path);

export const INDEXABLE_STATIC_ROUTES = PUBLIC_ROUTE_MANIFEST
  .filter((entry) => entry.group !== 'parents' && entry.indexable)
  .map((entry) => entry.path);

export const SITEMAP_STATIC_ROUTES = PUBLIC_ROUTE_MANIFEST
  .filter((entry) => entry.group !== 'parents' && entry.sitemap)
  .map((entry) => entry.path);

export const SITEMAP_PARENT_ROUTES = PUBLIC_ROUTE_MANIFEST
  .filter((entry) => entry.group === 'parents' && entry.sitemap)
  .map((entry) => entry.path);

export const PRERENDER_STATIC_ROUTES = PUBLIC_ROUTE_MANIFEST
  .filter((entry) => entry.group !== 'parents' && entry.prerender)
  .map((entry) => entry.path);

export const LEGAL_ROUTES = PUBLIC_ROUTE_MANIFEST
  .filter((entry) => entry.group === 'legal')
  .map((entry) => entry.path);

export function uniqueRoutes(routes) {
  return [...new Set(routes)];
}
