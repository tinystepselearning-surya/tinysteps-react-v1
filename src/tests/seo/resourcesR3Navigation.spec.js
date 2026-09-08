import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PUBLIC_ROUTE_MANIFEST } from '../../lib/publicRouteManifest.js';
import { RESOURCE_ECOSYSTEM_REGISTRY } from '../../lib/resourcesArchitectureRegistry.js';
import { ROUTE_SEO_REGISTRY } from '../../lib/routeSeoRegistry.js';

const repoRoot = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('Resources architecture R3 global navigation migration', () => {
  it('promotes Resources into the primary header instead of Blog', () => {
    const nav = read('src/components/NavBar/NavBar.tsx');

    expect(nav).toContain('{ label: "Resources", to: "/resources" }');
    expect(nav).not.toContain('{ label: "Blog", to: "/blog" }');
  });

  it('keeps Resources active for future nested resource hubs', () => {
    const nav = read('src/components/NavBar/NavBar.tsx');

    expect(nav).toContain('pathname === item.to || pathname.startsWith(`${item.to}/`)');
    expect(nav).toContain('matchesNavItem(location.pathname, item)');
  });

  it('preserves direct editorial-library access in the footer', () => {
    const footer = read('src/components/common/Footer.tsx');

    expect(footer).toContain("{ label: 'Resources', href: '/resources' }");
    expect(footer).toContain("{ label: 'All Guides', href: '/blog' }");
    expect(footer).not.toContain("{ label: 'Blog', href: '/blog' }");
  });

  it('keeps Resources and Blog as separate protected intent owners', () => {
    const byPath = new Map(RESOURCE_ECOSYSTEM_REGISTRY.map((item) => [item.path, item]));

    expect(byPath.get('/resources')).toMatchObject({
      currentState: 'route',
      pageFamily: 'learning-resource-gateway',
      protection: 'protected',
    });
    expect(byPath.get('/blog')).toMatchObject({
      pageFamily: 'editorial-library',
      protection: 'protected',
    });
  });

  it('keeps both /resources and /blog indexable, self-canonical public routes', () => {
    for (const pathName of ['/resources', '/blog']) {
      const route = PUBLIC_ROUTE_MANIFEST.find((item) => item.path === pathName);
      expect(route).toMatchObject({
        path: pathName,
        intent: 'index',
        indexable: true,
        prerender: true,
        sitemap: true,
        canonicalPath: pathName,
      });
      expect(ROUTE_SEO_REGISTRY[pathName]).toMatchObject({ canonicalPath: pathName });
    }
  });

  it('does not publish subject hubs or alter the Brick 3 boundary', () => {
    const manifestPaths = new Set(PUBLIC_ROUTE_MANIFEST.map((item) => item.path));

    for (const pathName of ['/resources/phonics', '/resources/grammar', '/resources/speaking']) {
      expect(manifestPaths.has(pathName)).toBe(false);
    }
  });
});
