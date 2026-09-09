import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PHONICS_PUBLISHED_RESOURCE_PAGES, PHONICS_PUBLISHED_RESOURCE_PATHS } from '../../lib/phonicsPublicationRegistry.js';
import { PHONICS_RESOURCE_DISCOVERY_CLUSTERS, PHONICS_RESOURCE_DISCOVERY_EDGES, PHONICS_RESOURCE_HUB_PATH, getPhonicsResourceDiscoveryClusterForPath, getPhonicsResourceReachablePaths, getRelatedPhonicsResourcePages } from '../../lib/phonicsResourceDiscoveryGraph.js';
import { PUBLIC_ROUTE_MANIFEST } from '../../lib/publicRouteManifest.js';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const manifestByPath = new Map(PUBLIC_ROUTE_MANIFEST.map((entry) => [entry.path, entry]));

describe('Resources architecture R10 discovery infrastructure under R12 publication', () => {
  it('organises every published phonics resource into exactly one crawlable cluster', () => {
    expect(PHONICS_RESOURCE_DISCOVERY_CLUSTERS).toHaveLength(4);
    const clusteredPaths = PHONICS_RESOURCE_DISCOVERY_CLUSTERS.flatMap((cluster) => cluster.pages.map((page) => page.path));
    expect(clusteredPaths).toHaveLength(PHONICS_PUBLISHED_RESOURCE_PATHS.length);
    expect(new Set(clusteredPaths)).toEqual(new Set(PHONICS_PUBLISHED_RESOURCE_PATHS));
  });
  it('keeps the hub root and avoids thin category URLs', () => {
    expect(PHONICS_RESOURCE_HUB_PATH).toBe('/resources/phonics');
    for (const cluster of PHONICS_RESOURCE_DISCOVERY_CLUSTERS) expect(manifestByPath.has(`/resources/phonics/${cluster.id}`)).toBe(false);
  });
  it('makes all 31 pages reachable and safely related', () => {
    const reachable = new Set(getPhonicsResourceReachablePaths());
    for (const page of PHONICS_PUBLISHED_RESOURCE_PAGES) {
      expect(reachable.has(page.path)).toBe(true);
      expect(getPhonicsResourceDiscoveryClusterForPath(page.path)?.group).toBe(page.group);
      expect(PHONICS_RESOURCE_DISCOVERY_EDGES.some((edge) => edge.from === page.path && edge.to === PHONICS_RESOURCE_HUB_PATH && edge.relation === 'parent-hub')).toBe(true);
      const related = getRelatedPhonicsResourcePages(page.path, 4);
      expect(related).toHaveLength(4);
      expect(related.every((candidate) => candidate.path !== page.path)).toBe(true);
    }
  });
  it('keeps all published resources indexable, prerendered and sitemap eligible', () => {
    for (const path of PHONICS_PUBLISHED_RESOURCE_PATHS) {
      const entry = manifestByPath.get(path);
      expect(entry).toBeTruthy();
      expect(entry.indexable).toBe(true);
      expect(entry.prerender).toBe(true);
      expect(entry.sitemap).toBe(true);
      expect(entry.canonicalPath).toBe(path);
    }
  });
  it('renders data-driven hub and detail discovery', () => {
    const grid = read('src/components/resources/PhonicsPilotGuideGrid.tsx');
    expect(grid).toContain('PHONICS_PUBLISHED_RESOURCE_PAGES');
    expect(grid).toContain('PHONICS_RESOURCE_DISCOVERY_CLUSTERS');
    expect(grid).toContain('data-resource-discovery-path');
    const detail = read('src/pages/PhonicsKnowledgePage.tsx');
    expect(detail).toContain('getRelatedPhonicsResourcePages');
    expect(detail).toContain('data-resource-related-path');
  });
});
