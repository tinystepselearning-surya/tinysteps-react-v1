import { ROUTE_SEO_REGISTRY as BASE_ROUTE_SEO_REGISTRY } from './routeSeoRegistry.catalog.js';

// Keep route-specific overrides small and explicit while preserving the full public SEO catalog.
const CAREERS_SEO = {
  title: 'Online English Teacher Jobs Worldwide | Tiny Steps Learning',
  description:
    'Apply for remote online English teacher jobs with Tiny Steps Learning. Teach phonics, grammar, spoken English and public speaking to children in live 1:1 classes.',
  canonicalPath: '/careers',
  ogType: 'website',
  keywords:
    'online English teacher jobs,remote English teacher jobs,online English teacher jobs worldwide,work from home English teacher jobs,online phonics teacher jobs,phonics teacher jobs remote,online grammar teacher jobs,public speaking teacher jobs online,spoken English teacher jobs,online English tutor jobs,remote tutoring jobs for English teachers,English teaching jobs from home,international online teaching jobs,remote teaching jobs for English teachers,Tiny Steps Learning careers',
};

export const ROUTE_SEO_REGISTRY = {
  ...BASE_ROUTE_SEO_REGISTRY,
  '/careers': CAREERS_SEO,
};

export function getRouteConfig(pathname) {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return ROUTE_SEO_REGISTRY[normalized] || null;
}
