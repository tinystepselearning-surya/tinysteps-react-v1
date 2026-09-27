import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CENTRAL_RESOURCE_CONTENT_FAMILIES,
  CENTRAL_RESOURCE_GATEWAY,
  CENTRAL_RESOURCE_RECONCILIATION,
  CENTRAL_RESOURCE_SUBJECT_HUBS,
} from '../../lib/centralResourceSystem.js';
import { CANONICAL_TOPIC_OWNERSHIP } from '../../lib/canonicalTopicOwnershipRegistry.js';
import { PHONICS_PUBLISHED_RESOURCE_PAGES } from '../../lib/phonicsPublicationRegistry.js';
import { RESOURCE_ECOSYSTEM_REGISTRY } from '../../lib/resourcesArchitectureRegistry.js';

const repoRoot = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('Resources R23 central resource reconciliation', () => {
  it('defines /resources as the single educational discovery gateway without moving existing owners', () => {
    expect(CENTRAL_RESOURCE_GATEWAY).toBe('/resources');
    expect(CENTRAL_RESOURCE_RECONCILIATION).toMatchObject({
      gateway: '/resources',
      preserveExistingUrls: true,
      moveExistingUrls: false,
      redirectExistingOwners: false,
      editorialArchive: '/blog',
      focusedPhonicsHub: '/resources/phonics',
      parentHelpHub: '/parents',
      practiceHub: '/free-english-games-for-kids',
      schoolsHub: '/for-schools',
    });
  });

  it('keeps the three subject hubs under Resources and the existing ecosystem as content families', () => {
    expect(CENTRAL_RESOURCE_SUBJECT_HUBS).toEqual([
      '/resources/phonics',
      '/resources/grammar',
      '/resources/speaking',
    ]);

    const byId = new Map(CENTRAL_RESOURCE_CONTENT_FAMILIES.map((item) => [item.id, item]));
    expect([...byId.keys()]).toEqual([
      'editorial-guides',
      'focused-phonics',
      'parent-help',
      'interactive-practice',
      'schools-educators',
    ]);
    expect(byId.get('editorial-guides')?.destination).toBe('/blog');
    expect(byId.get('focused-phonics')?.destination).toBe('/resources/phonics');
  });

  it('reconciles the governed 31 phonics pages into the central Phonics & Reading pathway', () => {
    const focused = CENTRAL_RESOURCE_CONTENT_FAMILIES.find((item) => item.id === 'focused-phonics');
    expect(PHONICS_PUBLISHED_RESOURCE_PAGES).toHaveLength(31);
    expect(focused?.governedPublishedCount).toBe(PHONICS_PUBLISHED_RESOURCE_PAGES.length);
    for (const page of PHONICS_PUBLISHED_RESOURCE_PAGES) {
      expect(page.path.startsWith('/resources/phonics/')).toBe(true);
    }
  });

  it('keeps established canonical owners while making /resources their discovery parent', () => {
    const ecosystemByPath = new Map(RESOURCE_ECOSYSTEM_REGISTRY.map((item) => [item.path, item]));
    expect(ecosystemByPath.get('/resources')).toMatchObject({
      pageFamily: 'learning-resource-gateway',
      primaryDestination: null,
      protection: 'protected',
    });
    expect(ecosystemByPath.get('/blog')).toMatchObject({
      pageFamily: 'editorial-library',
      futureResourceNode: '/resources',
      protection: 'protected',
    });
    expect(ecosystemByPath.get('/parents')?.futureResourceNode).toBe('/resources');
    expect(ecosystemByPath.get('/free-english-games-for-kids')?.futureResourceNode).toBe('/resources');
    expect(ecosystemByPath.get('/for-schools')?.futureResourceNode).toBe('/resources');

    const allGuides = CANONICAL_TOPIC_OWNERSHIP.find((item) => item.id === 'all-english-guides');
    expect(allGuides).toMatchObject({
      ownerPath: '/blog',
      hubPath: '/resources',
      ownerRole: 'editorial-library',
    });
  });

  it('renders the central content families on the Resources page without creating duplicate resource URLs', () => {
    const page = read('src/pages/ResourcesPage.tsx');
    const routes = read('src/app/routes.tsx');

    expect(page).toContain('CENTRAL_RESOURCE_CONTENT_FAMILIES');
    expect(page).toContain('One place to find the right learning support');
    expect(page).toContain('Editorial guide library');

    for (const duplicate of ['resources/blog', 'resources/parents', 'resources/games', 'resources/schools']) {
      expect(routes).not.toContain(`path: '${duplicate}'`);
    }
  });
});
