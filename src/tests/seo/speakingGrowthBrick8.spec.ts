import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { CANONICAL_TOPIC_OWNERSHIP } from '../../lib/canonicalTopicOwnershipRegistry.js';
import {
  SPEAKING_COMMUNICATION_FREEZE,
  SPEAKING_COMMUNICATION_TIER1_CLUSTER_OWNERS,
} from '../../lib/speakingCommunicationCompletionArchitecture.js';
import {
  SPEAKING_KNOWLEDGE_CLUSTER_DIMENSION_IDS,
  SPEAKING_KNOWLEDGE_CLUSTER_GROUPS,
  SPEAKING_KNOWLEDGE_CLUSTER_OWNER_IDS,
  SPEAKING_KNOWLEDGE_CLUSTER_PATHS,
  SPEAKING_KNOWLEDGE_CLUSTER_REVISION,
} from '../../lib/speakingKnowledgeCluster';
import { SPEAKING_PROGRESS_DIMENSIONS } from '../../lib/speakingProgressFramework';

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');

const hubSource = read('src/pages/SubjectResourcesPage.tsx');
const sitemapGeneratorSource = read('scripts/generate-sitemaps.js');
const sitemapStatic = read('public/sitemap-static.xml');
const routeManifestSource = read('src/lib/publicRouteManifest.js');
const routesSource = read('src/app/routes.tsx');
const pathwaySource = read('src/components/blog/BlogSemanticPathway.tsx');

describe('Speaking growth Brick 8 knowledge cluster', () => {
  it('curates exactly five parent-facing groups without creating a second speaking taxonomy', () => {
    expect(SPEAKING_KNOWLEDGE_CLUSTER_REVISION).toBe('2026-09-19-b8-v1');
    expect(SPEAKING_KNOWLEDGE_CLUSTER_GROUPS).toHaveLength(5);
    expect(SPEAKING_KNOWLEDGE_CLUSTER_GROUPS.map((group) => group.id)).toEqual([
      'everyday-speaking-foundations',
      'confidence-and-context',
      'storytelling-and-organisation',
      'discussion-and-presentation',
      'rehearsal-and-transfer',
    ]);
    expect(SPEAKING_COMMUNICATION_FREEZE).toMatchObject({
      state: 'frozen',
      contentExpansionAllowed: false,
      protectedCommercialOwner: '/speaking',
      protectedSubjectHub: '/resources/speaking',
      protectedSpokenEnglishCommercialOwner: '/spoken-english-classes-for-kids-online',
    });
  });

  it('represents all fifteen established Tier-1 cluster records exactly once', () => {
    const expectedIds = SPEAKING_COMMUNICATION_TIER1_CLUSTER_OWNERS.map((item) => item.id).sort();
    expect([...SPEAKING_KNOWLEDGE_CLUSTER_OWNER_IDS].sort()).toEqual([...expectedIds]);
    expect(new Set(SPEAKING_KNOWLEDGE_CLUSTER_OWNER_IDS).size).toBe(15);
    expect(SPEAKING_KNOWLEDGE_CLUSTER_PATHS).toHaveLength(14);
    expect(
      SPEAKING_KNOWLEDGE_CLUSTER_GROUPS
        .flatMap((group) => group.links)
        .find((link) => link.to === '/blog/conversation-skills-for-kids')
        ?.ownerIds,
    ).toEqual(['conversation', 'spoken-vocabulary-transfer']);
  });

  it('connects the knowledge cluster to every Brick 7 progress dimension', () => {
    expect([...SPEAKING_KNOWLEDGE_CLUSTER_DIMENSION_IDS].sort()).toEqual(
      SPEAKING_PROGRESS_DIMENSIONS.map((dimension) => dimension.id).sort(),
    );
    expect(new Set(SPEAKING_KNOWLEDGE_CLUSTER_DIMENSION_IDS).size).toBe(10);
    for (const group of SPEAKING_KNOWLEDGE_CLUSTER_GROUPS) {
      expect(group.dimensionIds.length).toBeGreaterThan(0);
      expect(group.dimensionLabels).toHaveLength(group.dimensionIds.length);
    }
  });

  it('deep-freezes the Brick 8 grouping contract', () => {
    expect(Object.isFrozen(SPEAKING_KNOWLEDGE_CLUSTER_GROUPS)).toBe(true);
    expect(Object.isFrozen(SPEAKING_KNOWLEDGE_CLUSTER_OWNER_IDS)).toBe(true);
    expect(Object.isFrozen(SPEAKING_KNOWLEDGE_CLUSTER_PATHS)).toBe(true);
    expect(Object.isFrozen(SPEAKING_KNOWLEDGE_CLUSTER_DIMENSION_IDS)).toBe(true);

    for (const group of SPEAKING_KNOWLEDGE_CLUSTER_GROUPS) {
      expect(Object.isFrozen(group)).toBe(true);
      expect(Object.isFrozen(group.dimensionIds)).toBe(true);
      expect(Object.isFrozen(group.dimensionLabels)).toBe(true);
      expect(Object.isFrozen(group.links)).toBe(true);
      for (const link of group.links) {
        expect(Object.isFrozen(link)).toBe(true);
        expect(Object.isFrozen(link.ownerIds)).toBe(true);
      }
    }
  });

  it('uses only already-published blog destinations for the knowledge corpus', () => {
    const publishedPaths = new Set(blogPosts.map((post) => `/blog/${post.slug}`));
    for (const clusterPath of SPEAKING_KNOWLEDGE_CLUSTER_PATHS) {
      expect(clusterPath.startsWith('/blog/')).toBe(true);
      expect(publishedPaths.has(clusterPath)).toBe(true);
    }
  });

  it('keeps commercial and hub ownership unchanged', () => {
    const topicById = new Map(CANONICAL_TOPIC_OWNERSHIP.map((item: { id: string }) => [item.id, item]));
    expect(topicById.get('speaking-subject-discovery')).toMatchObject({
      ownerPath: '/resources/speaking',
      intent: 'informational',
    });
    expect(topicById.get('live-public-speaking-classes')).toMatchObject({
      ownerPath: '/speaking',
      intent: 'high-commercial',
    });
    expect(topicById.get('spoken-english-classes')).toMatchObject({
      ownerPath: '/spoken-english-classes-for-kids-online',
      intent: 'commercial',
    });
    expect(SPEAKING_KNOWLEDGE_CLUSTER_PATHS).not.toContain('/speaking');
    expect(SPEAKING_KNOWLEDGE_CLUSTER_PATHS).not.toContain('/spoken-english-classes-for-kids-online');
  });

  it('surfaces the five-group cluster on the existing Speaking resources hub', () => {
    expect(hubSource).toContain("import { SPEAKING_KNOWLEDGE_CLUSTER_GROUPS } from '../lib/speakingKnowledgeCluster'");
    expect(hubSource).toContain('data-speaking-knowledge-cluster');
    expect(hubSource).toContain('SPEAKING_KNOWLEDGE_CLUSTER_GROUPS.map');
    expect(hubSource).toContain('Explore speaking skills by the need you can observe');
    expect(hubSource).toContain('They are not a rigid ladder');
    expect(hubSource).toContain('to="/speaking-progress-framework"');
    expect(hubSource).toContain('group.dimensionLabels.map');
  });

  it('keeps the existing SP6 semantic pathway engine authoritative for blog-to-blog journeys', () => {
    expect(pathwaySource).toContain(
      "from '../../lib/speakingCommunicationCompletionSemanticJourneyGraph.js'",
    );
    expect(pathwaySource).toContain("excludeRelations: ['assessment', 'programme']");
    expect(pathwaySource).not.toContain('speakingKnowledgeCluster');
  });

  it('creates no new public route or canonical URL for Brick 8', () => {
    expect(routesSource).not.toContain("path: 'speaking-knowledge-cluster'");
    expect(routeManifestSource).not.toContain("route('/speaking-knowledge-cluster'");
    expect(sitemapStatic).not.toContain(
      '<loc>https://tinystepslearning.com/speaking-knowledge-cluster</loc>',
    );
  });

  it('tracks Brick 8 source freshness on the existing Speaking resources sitemap URL', () => {
    expect(sitemapGeneratorSource).toContain(
      "const speakingKnowledgeClusterTs = path.join(root, 'src', 'lib', 'speakingKnowledgeCluster.ts')",
    );
    expect(sitemapGeneratorSource).toContain(
      "'/resources/speaking': [appRoutesTs, subjectResourcesPageTsx, speakingKnowledgeClusterTs]",
    );
    expect(sitemapStatic).toContain(
      '<loc>https://tinystepslearning.com/resources/speaking</loc>\n    <lastmod>2026-09-19</lastmod>',
    );
  });
});
