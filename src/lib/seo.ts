// Stable SEO public exports. Route registry loads only in consumers that request this module.
export { applySeo } from './seoRuntime';
import {
  ROUTE_SEO_REGISTRY as SHARED_ROUTE_SEO_REGISTRY,
  getRouteConfig as getSharedRouteConfig,
} from './routeSeoRegistry.js';

// ============================================================================
// BUILD-TIME ROUTE SEO REGISTRY
// Exported for use in prerender.mjs to inject meta into generated HTML
// ============================================================================

export type RouteConfig = {
  title: string;
  description: string;
  canonicalPath: string;
  robots?: string; // defaults to "index, follow"
  keywords?: string | string[];
  ogImage?: string;
  ogType?: "website" | "article";
};

/**
 * Complete SEO registry for all publicly prerendered routes.
 * Used at build time to inject meta tags into dist/<route>/index.html
 */
export const ROUTE_SEO_REGISTRY: Record<string, RouteConfig> = SHARED_ROUTE_SEO_REGISTRY;

/**
 * Helper function to get SEO config for a given route pathname.
 * Used at build time by prerender.mjs to inject meta tags.
 * @param pathname e.g. "/" or "/courses" or "/blog/my-post"
 * @returns RouteConfig or null if not in registry
 */
export function getRouteConfig(pathname: string): RouteConfig | null {
  return getSharedRouteConfig(pathname) as RouteConfig | null;
}
