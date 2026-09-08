import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PUBLIC_ROUTE_MANIFEST } from '../../lib/publicRouteManifest.js';
import { RESOURCE_ECOSYSTEM_REGISTRY } from '../../lib/resourcesArchitectureRegistry.js';
import { ROUTE_SEO_REGISTRY } from '../../lib/routeSeoRegistry.js';

const repoRoot = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
const SUBJECT_PATHS = ['/resources/phonics', '/resources/grammar', '/resources/speaking'];

describe('Resources architecture R4 subject hubs', () => {
  it('publishes three indexable, prerendered, self-canonical subject routes', () => {
    for (const pathName of SUBJECT_PATHS) {
      expect(PUBLIC_ROUTE_MANIFEST.find((item) => item.path === pathName)).toMatchObject({
        path: pathName,
        group: 'static',
        intent: 'index',
        indexable: true,
        prerender: true,
        sitemap: true,
        canonicalPath: pathName,
      });
      expect(ROUTE_SEO_REGISTRY[pathName]).toMatchObject({ canonicalPath: pathName, ogType: 'website' });
      expect(ROUTE_SEO_REGISTRY[pathName].title).not.toMatch(/classes/i);
    }
  });

  it('turns only the approved subject nodes into protected informational orchestration routes', () => {
    const byPath = new Map(RESOURCE_ECOSYSTEM_REGISTRY.map((item) => [item.path, item]));
    for (const pathName of SUBJECT_PATHS) {
      expect(byPath.get(pathName)).toMatchObject({
        currentState: 'route',
        pageFamily: 'subject-resource-hub',
        primaryIntent: 'informational',
        commercialReadiness: 'low',
        ctaPolicy: 'related-resource',
        protection: 'protected',
      });
      expect(byPath.get(pathName).primaryQueryOwner).toMatch(/^Tiny Steps /);
    }

    for (const duplicate of ['/resources/parents', '/resources/games', '/resources/schools', '/resources/blog']) {
      expect(byPath.has(duplicate)).toBe(false);
    }
  });

  it('routes the gateway subjects into the new hubs and preserves the existing other ecosystem hubs', () => {
    const page = read('src/pages/ResourcesPage.tsx');
    for (const pathName of SUBJECT_PATHS) expect(page).toContain(`to: '${pathName}'`);
    for (const existing of ['/parents', '/free-english-games-for-kids', '/for-schools']) expect(page).toContain(existing);
  });

  it('renders all three routes through the shared subject-hub page', () => {
    const routes = read('src/app/routes.tsx');
    expect(routes).toContain("const SubjectResourcesPage = lazy(() => import('../pages/SubjectResourcesPage'));");
    expect(routes).toContain("{ path: 'resources/phonics', element: <SubjectResourcesPage subject=\"phonics\" /> },");
    expect(routes).toContain("{ path: 'resources/grammar', element: <SubjectResourcesPage subject=\"grammar\" /> },");
    expect(routes).toContain("{ path: 'resources/speaking', element: <SubjectResourcesPage subject=\"speaking\" /> },");
  });

  it('uses established authority, problem and practice URLs rather than inventing replacement topic owners', () => {
    const page = read('src/pages/SubjectResourcesPage.tsx');
    for (const existingOwner of [
      '/blog/what-is-phonics-for-kids',
      '/blog/satpin-phonics-guide',
      '/blog/how-kids-learn-blending',
      '/blog/cvc-words-explained-for-parents',
      '/blog/child-knows-abc-but-cannot-read',
      '/blog/why-child-knows-letter-sounds-but-cannot-read-words',
      '/blog/how-to-improve-reading-fluency-in-children',
      '/blog/grammar-nouns-to-paragraphs',
      '/blog/how-to-improve-sentence-formation-in-kids',
      '/blog/child-knows-grammar-but-makes-mistakes',
      '/blog/speaking-confidence-seeds',
      '/blog/child-gives-one-word-answers',
      '/blog/child-understands-english-but-does-not-speak',
      '/free-letter-sound-games-for-kids',
      '/free-word-building-games-for-kids',
      '/free-grammar-games-for-kids',
      '/free-speaking-games-for-kids',
    ]) {
      expect(page).toContain(existingOwner);
    }
  });

  it('keeps commercial programme routes separate and secondary', () => {
    const page = read('src/pages/SubjectResourcesPage.tsx');
    expect(page).toContain("programmeTo: '/phonics'");
    expect(page).toContain("programmeTo: '/grammar'");
    expect(page).toContain("programmeTo: '/speaking'");
    expect(page).toContain('Keep resource discovery separate from programme decisions.');
  });

  it('exposes all three subject hubs in llms.txt without changing physical article URLs', () => {
    const llms = read('public/llms.txt');
    for (const pathName of SUBJECT_PATHS) expect(llms).toContain(`https://tinystepslearning.com${pathName}`);
    expect(llms).toContain('https://tinystepslearning.com/blog/satpin-phonics-guide');
    expect(llms).toContain('https://tinystepslearning.com/blog/how-to-improve-sentence-formation-in-kids');
  });
});
