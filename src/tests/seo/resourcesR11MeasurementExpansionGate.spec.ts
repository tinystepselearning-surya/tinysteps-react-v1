import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  PHONICS_PROGRAMMATIC_PILOT_PAGES,
  PHONICS_PROGRAMMATIC_PILOT_PATHS,
} from '../../lib/phonicsProgrammaticPilot.js';
import {
  PHONICS_RESOURCE_HUB_PATH,
  PHONICS_RESOURCE_DISCOVERY_EDGES,
} from '../../lib/phonicsResourceDiscoveryGraph.js';
import {
  classifyResourceAssistDestination,
  getResourceMeasurementContext,
  getResourceNavigationRelation,
  isPhonicsResourcePath,
  normalizeResourcePath,
} from '../../lib/resourceMeasurement';
import {
  evaluateResourceExpansionEvidence,
  type ResourceExpansionEvidence,
} from '../../lib/resourceExpansionGate';

const repoRoot = process.cwd();
const readRepoFile = (relativePath: string) =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const evidence = (
  overrides: Partial<ResourceExpansionEvidence> = {},
): ResourceExpansionEvidence => ({
  scopeType: 'page',
  scopeId: '/resources/phonics/digraph-sh',
  pagePath: '/resources/phonics/digraph-sh',
  collectionDays: 21,
  technical: {
    indexable: true,
    canonicalSelf: true,
    inResourceSitemap: true,
    reachableFromHub: true,
    indexed: true,
  },
  search: {
    impressions: 180,
    clicks: 4,
    ctr: 4 / 180,
    averagePosition: 24,
    queryCount: 18,
  },
  engagement: {
    pageViews: 40,
    relatedResourceClicks: 4,
    practiceClicks: 1,
    commercialClicks: 0,
  },
  conversions: {
    demoClicks: 0,
    leadStarts: 0,
    leads: 0,
  },
  cannibalisation: { confirmed: false },
  ...overrides,
});

describe('Resources R11 measurement and expansion gate', () => {
  it('gives the hub and every currently published phonics guide a measurement context', () => {
    expect(getResourceMeasurementContext(PHONICS_RESOURCE_HUB_PATH)).toMatchObject({
      surface: 'phonics_hub',
      subject: 'phonics',
      pagePath: PHONICS_RESOURCE_HUB_PATH,
    });

    expect(PHONICS_PROGRAMMATIC_PILOT_PAGES).toHaveLength(16);
    for (const page of PHONICS_PROGRAMMATIC_PILOT_PAGES) {
      expect(getResourceMeasurementContext(page.path)).toMatchObject({
        surface: 'phonics_guide',
        subject: 'phonics',
        pagePath: page.path,
        conceptId: page.conceptId,
        publicationRevision: page.publicationRevision,
      });
      expect(getResourceMeasurementContext(page.path)?.clusterId).toBeTruthy();
    }
  });

  it('normalizes query strings, hashes and trailing slashes before measurement classification', () => {
    const path = `${PHONICS_PROGRAMMATIC_PILOT_PATHS[0]}/?utm_source=test#practice`;
    expect(normalizeResourcePath(path)).toBe(PHONICS_PROGRAMMATIC_PILOT_PATHS[0]);
    expect(isPhonicsResourcePath(path)).toBe(true);
    expect(getResourceMeasurementContext(path)?.pagePath).toBe(PHONICS_PROGRAMMATIC_PILOT_PATHS[0]);
  });

  it('uses the R10 graph to classify resource navigation relationships', () => {
    const hubEdge = PHONICS_RESOURCE_DISCOVERY_EDGES.find(
      (edge) => edge.from === PHONICS_RESOURCE_HUB_PATH && edge.relation === 'hub-child',
    );
    expect(hubEdge).toBeTruthy();
    expect(getResourceNavigationRelation(hubEdge!.from, hubEdge!.to)).toBe('hub-child');
    expect(getResourceNavigationRelation(hubEdge!.to, PHONICS_RESOURCE_HUB_PATH)).toBe('parent-hub');
  });

  it('separates commercial, practice and supporting-content assists', () => {
    expect(classifyResourceAssistDestination('/phonics?from=resource')).toBe('commercial');
    expect(classifyResourceAssistDestination('/book-demo')).toBe('commercial');
    expect(classifyResourceAssistDestination('/kids/games/phonics/letter-tracing-sounds')).toBe('practice');
    expect(classifyResourceAssistDestination('/blog/why-child-cannot-blend')).toBe('supporting-content');
  });

  it('blocks only the affected scope when a technical discovery contract breaks', () => {
    const result = evaluateResourceExpansionEvidence(
      evidence({
        technical: {
          indexable: true,
          canonicalSelf: false,
          inResourceSitemap: true,
          reachableFromHub: true,
          indexed: true,
        },
      }),
    );
    expect(result.status).toBe('blocked');
    expect(result.blockScope).toBe('page');
    expect(result.blocksOtherClusters).toBe(false);
  });

  it('blocks only the evaluated cluster for confirmed cannibalisation', () => {
    const result = evaluateResourceExpansionEvidence(
      evidence({
        scopeType: 'cluster',
        scopeId: 'vowel-patterns',
        clusterId: 'vowel-patterns',
        cannibalisation: {
          confirmed: true,
          competingPath: '/phonics',
          queryFamily: 'online phonics classes',
        },
      }),
    );
    expect(result.status).toBe('blocked');
    expect(result.blockScope).toBe('cluster');
    expect(result.blocksOtherClusters).toBe(false);
  });

  it('does not punish a new or low-sample page for having little search evidence', () => {
    const result = evaluateResourceExpansionEvidence(
      evidence({
        collectionDays: 6,
        search: { impressions: 12, clicks: 0, ctr: 0, averagePosition: 72 },
        engagement: { pageViews: 8, relatedResourceClicks: 1, practiceClicks: 0, commercialClicks: 0 },
      }),
    );
    expect(result.status).toBe('insufficient-evidence');
    expect(result.blockScope).toBe('none');
  });

  it('repairs a published page that remains not indexed after the minimum observation window', () => {
    const result = evaluateResourceExpansionEvidence(
      evidence({
        collectionDays: 21,
        technical: {
          indexable: true,
          canonicalSelf: true,
          inResourceSitemap: true,
          reachableFromHub: true,
          indexed: false,
        },
      }),
    );
    expect(result.status).toBe('repair');
  });

  it('repairs meaningful search exposure when CTR and position are both clearly weak', () => {
    const result = evaluateResourceExpansionEvidence(
      evidence({
        search: { impressions: 600, clicks: 2, ctr: 2 / 600, averagePosition: 48 },
      }),
    );
    expect(result.status).toBe('repair');
  });

  it('promotes a resource when search discovery and measured engagement both support expansion', () => {
    const result = evaluateResourceExpansionEvidence(
      evidence({
        search: { impressions: 420, clicks: 18, ctr: 18 / 420, averagePosition: 14 },
        engagement: { pageViews: 150, relatedResourceClicks: 22, practiceClicks: 11, commercialClicks: 4 },
        conversions: { demoClicks: 2, leadStarts: 1, leads: 1 },
      }),
    );
    expect(result.status).toBe('promote');
    expect(result.blocksOtherClusters).toBe(false);
  });

  it('observes mature neutral evidence instead of forcing a publish or repair decision', () => {
    const result = evaluateResourceExpansionEvidence(evidence());
    expect(result.status).toBe('observe');
    expect(result.blockScope).toBe('none');
  });

  it('wires the measurement contract into the existing public conversion tracker without duplicate resource-assist navigation', () => {
    const tracker = readRepoFile('src/components/common/ConversionTracker.tsx');
    expect(tracker).toContain('trackResourcePageView');
    expect(tracker).toContain('trackResourceNavigationClick');
    expect(tracker).toContain('trackResourceAssistClick');
    expect(tracker).toContain('if (isPhonicsResourcePath(destinationPath))');
    expect(tracker).toContain('else {\n          trackResourceAssistClick');
  });
});
