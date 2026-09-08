import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PUBLIC_ROUTE_MANIFEST } from '../../lib/publicRouteManifest.js';
import { RESOURCE_ECOSYSTEM_REGISTRY } from '../../lib/resourcesArchitectureRegistry.js';
import { ROUTE_SEO_REGISTRY } from '../../lib/routeSeoRegistry.js';

const repoRoot = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('Resources architecture R2 learning gateway', () => {
  it('registers /resources as an independent indexable, prerendered, self-canonical route', () => {
    const route = PUBLIC_ROUTE_MANIFEST.find((item) => item.path === '/resources');
    expect(route).toMatchObject({
      path: '/resources',
      group: 'static',
      intent: 'index',
      indexable: true,
      prerender: true,
      sitemap: true,
      canonicalPath: '/resources',
    });

    expect(ROUTE_SEO_REGISTRY['/resources']).toMatchObject({
      canonicalPath: '/resources',
      ogType: 'website',
    });
  });

  it('promotes /resources from redirect opportunity to protected learning-resource gateway', () => {
    const resources = RESOURCE_ECOSYSTEM_REGISTRY.find((item) => item.path === '/resources');
    expect(resources).toMatchObject({
      currentState: 'route',
      pageFamily: 'learning-resource-gateway',
      primaryIntent: 'informational',
      commercialReadiness: 'low',
      ctaPolicy: 'related-resource',
      protection: 'protected',
    });
  });

  it('removes direct /resources hosting redirects and normalizes the legacy /main/resources alias to the new hub', () => {
    const firebase = JSON.parse(read('firebase.json'));
    const redirects = firebase.hosting?.redirects ?? [];

    expect(redirects.some((item) => item.source === '/resources')).toBe(false);
    expect(redirects.some((item) => item.source === '/resources/')).toBe(false);
    expect(redirects.find((item) => item.source === '/main/resources')).toMatchObject({
      destination: '/resources',
      type: 301,
    });
    expect(redirects.find((item) => item.source === '/main/resources/')).toMatchObject({
      destination: '/resources',
      type: 301,
    });
  });

  it('renders /resources through ResourcesPage rather than redirecting it to /blog', () => {
    const routes = read('src/app/routes.tsx');
    expect(routes).toContain("const ResourcesPage = lazy(() => import('../pages/ResourcesPage'));");
    expect(routes).toContain("{ path: 'resources', element: <ResourcesPage /> },");
    expect(routes).toContain("{ path: 'main/resources', element: <Navigate to=\"/resources\" replace /> },");
    expect(routes).not.toContain("{ path: 'resources', element: <Navigate to=\"/blog\" replace /> },");
  });

  it('keeps the gateway focused on six existing ecosystem destinations until subject hubs are built', () => {
    const page = read('src/pages/ResourcesPage.tsx');

    for (const title of [
      'Phonics & Reading',
      'Grammar & Writing',
      'Speaking & Communication',
      'Parent Help',
      'Free Learning Activities',
      'Schools & Educators',
    ]) {
      expect(page).toContain(title);
    }

    for (const destination of [
      '/blog?topic=Phonics',
      '/blog?topic=Grammar',
      '/blog?topic=Speaking%20%26%20Communication',
      '/parents',
      '/free-english-games-for-kids',
      '/for-schools',
    ]) {
      expect(page).toContain(destination);
    }

    expect(page).toContain('Browse all guides');
    expect(page).not.toContain("to: '/resources/phonics'");
    expect(page).not.toContain("to: '/resources/grammar'");
    expect(page).not.toContain("to: '/resources/speaking'");
  });

  it('does not prematurely publish the planned subject hubs or duplicate protected ecosystem hubs', () => {
    const manifestPaths = new Set(PUBLIC_ROUTE_MANIFEST.map((item) => item.path));
    for (const pathName of ['/resources/phonics', '/resources/grammar', '/resources/speaking']) {
      expect(manifestPaths.has(pathName)).toBe(false);
      expect(RESOURCE_ECOSYSTEM_REGISTRY.find((item) => item.path === pathName)).toMatchObject({
        currentState: 'planned',
        protection: 'planned',
      });
    }

    for (const duplicate of ['/resources/parents', '/resources/games', '/resources/schools', '/resources/blog']) {
      expect(manifestPaths.has(duplicate)).toBe(false);
    }
  });

  it('keeps /blog and the existing ecosystem protected', () => {
    const byPath = new Map(RESOURCE_ECOSYSTEM_REGISTRY.map((item) => [item.path, item]));
    for (const protectedPath of [
      '/blog',
      '/phonics',
      '/grammar',
      '/speaking',
      '/parents',
      '/for-schools',
      '/free-english-games-for-kids',
    ]) {
      expect(byPath.get(protectedPath)?.protection).toBe('protected');
    }
  });
});
