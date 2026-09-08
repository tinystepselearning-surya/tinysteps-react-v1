import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  PHONICS_PROGRAMMATIC_PILOT_PAGES,
  PHONICS_PROGRAMMATIC_PILOT_PATHS,
} from '../../lib/phonicsProgrammaticPilot.js';
import {
  PHONICS_RESOURCE_DISCOVERY_CLUSTERS,
  PHONICS_RESOURCE_DISCOVERY_EDGES,
  PHONICS_RESOURCE_HUB_PATH,
  getPhonicsResourceDiscoveryClusterForPath,
  getPhonicsResourceReachablePaths,
  getRelatedPhonicsResourcePages,
} from '../../lib/phonicsResourceDiscoveryGraph.js';
import { PUBLIC_ROUTE_MANIFEST } from '../../lib/publicRouteManifest.js';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const manifestByPath = new Map(PUBLIC_ROUTE_MANIFEST.map((entry) => [entry.path, entry]));

describe('Resources architecture R10 discovery infrastructure', () => {
  it('organises every published phonics resource into exactly one crawlable cluster', () => {
    expect(PHONICS_RESOURCE_DISCOVERY_CLUSTERS).toHaveLength(4);
    const clusteredPaths = PHONICS_RESOURCE_DISCOVERY_CLUSTERS.flatMap((cluster) => cluster.pages.map((page) => page.path));
    expect(clusteredPaths).toHaveLength(PHONICS_PROGRAMMATIC_PILOT_PATHS.length);
    expect(new Set(clusteredPaths)).toEqual(new Set(PHONICS_PROGRAMMATIC_PILOT_PATHS));
    expect(new Set(PHONICS_RESOURCE_DISCOVERY_CLUSTERS.map((cluster) => cluster.anchorId)).size)
      .toBe(PHONICS_RESOURCE_DISCOVERY_CLUSTERS.length);
  });

  it('keeps the phonics hub as the parent discovery root without inventing thin category URLs', () => {
    expect(PHONICS_RESOURCE_HUB_PATH).toBe('/resources/phonics');
    for (const cluster of PHONICS_RESOURCE_DISCOVERY_CLUSTERS) {
      expect(cluster.href).toBe(`/resources/phonics#${cluster.anchorId}`);
      expect(manifestByPath.has(`/resources/phonics/${cluster.id}`)).toBe(false);
    }
  });

  it('makes every published page reachable from the phonics hub in the semantic graph', () => {
    const reachable = new Set(getPhonicsResourceReachablePaths());
    expect(reachable.has(PHONICS_RESOURCE_HUB_PATH)).toBe(true);
    for (const path of PHONICS_PROGRAMMATIC_PILOT_PATHS) expect(reachable.has(path)).toBe(true);
  });

  it('gives each page a parent-hub edge and multiple useful related-page edges', () => {
    for (const page of PHONICS_PROGRAMMATIC_PILOT_PAGES) {
      expect(getPhonicsResourceDiscoveryClusterForPath(page.path)?.group).toBe(page.group);
      expect(PHONICS_RESOURCE_DISCOVERY_EDGES.some((edge) => edge.from === page.path && edge.to === PHONICS_RESOURCE_HUB_PATH && edge.relation === 'parent-hub')).toBe(true);
      const related = getRelatedPhonicsResourcePages(page.path, 4);
      expect(related.length).toBe(4);
      expect(related.every((candidate) => candidate.path !== page.path)).toBe(true);
      expect(new Set(related.map((candidate) => candidate.path)).size).toBe(related.length);
    }
  });

  it('keeps every published resource indexable, prerendered and sitemap eligible', () => {
    for (const path of PHONICS_PROGRAMMATIC_PILOT_PATHS) {
      const entry = manifestByPath.get(path);
      expect(entry).toBeTruthy();
      expect(entry.indexable).toBe(true);
      expect(entry.prerender).toBe(true);
      expect(entry.sitemap).toBe(true);
      expect(entry.canonicalPath).toBe(path);
    }
  });

  it('renders stable family anchors and direct HTML links from the phonics hub', () => {
    const source = read('src/components/resources/PhonicsPilotGuideGrid.tsx');
    expect(source).toContain('PHONICS_RESOURCE_DISCOVERY_CLUSTERS');
    expect(source).toContain('Browse phonics guide families');
    expect(source).toContain('data-resource-discovery-cluster');
    expect(source).toContain('data-resource-discovery-path');
    expect(source).toContain("href={`#${cluster.anchorId}`}");
    expect(source).toContain('PHONICS_PROGRAMMATIC_PILOT_PAGES');
  });
});
