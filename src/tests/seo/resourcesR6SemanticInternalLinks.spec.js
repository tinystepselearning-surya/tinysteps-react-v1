import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CANONICAL_TOPIC_OWNERS_BY_ID,
  getCanonicalTopicOwnerPath,
} from '../../lib/canonicalTopicOwnershipRegistry.js';
import {
  SEMANTIC_INTERNAL_LINK_GRAPH,
  SEMANTIC_INTERNAL_LINK_REQUIRED_TOPIC_IDS,
  getSemanticInternalLinksForPath,
  getSemanticInternalLinksForTopic,
} from '../../lib/semanticInternalLinkRegistry.js';

const repoRoot = process.cwd();
const pathwaySource = fs.readFileSync(path.join(repoRoot, 'src/components/blog/BlogSemanticPathway.tsx'), 'utf8');
const conversionSource = fs.readFileSync(path.join(repoRoot, 'src/components/blog/BlogConversionCard.tsx'), 'utf8');

describe('Resources architecture R6 semantic internal-link engine', () => {
  it('resolves every semantic destination through Brick 5 canonical ownership', () => {
    for (const journey of SEMANTIC_INTERNAL_LINK_GRAPH) {
      expect(CANONICAL_TOPIC_OWNERS_BY_ID[journey.sourceTopicId]).toBeTruthy();
      const resolved = getSemanticInternalLinksForTopic(journey.sourceTopicId);
      expect(resolved).toHaveLength(journey.links.length);

      for (const link of resolved) {
        expect(CANONICAL_TOPIC_OWNERS_BY_ID[link.targetTopicId]).toBeTruthy();
        expect(link.to).toBe(getCanonicalTopicOwnerPath(link.targetTopicId));
      }
    }
  });

  it('provides explicit outbound journeys for the core editorial and diagnostic owners', () => {
    const sourceIds = new Set(SEMANTIC_INTERNAL_LINK_GRAPH.map((entry) => entry.sourceTopicId));
    for (const topicId of SEMANTIC_INTERNAL_LINK_REQUIRED_TOPIC_IDS) {
      expect(sourceIds.has(topicId)).toBe(true);
      expect(getSemanticInternalLinksForTopic(topicId).length).toBeGreaterThan(0);
    }
  });

  it('keeps semantic pathways concise and avoids duplicate destinations per source', () => {
    for (const journey of SEMANTIC_INTERNAL_LINK_GRAPH) {
      expect(journey.links.length).toBeGreaterThan(0);
      expect(journey.links.length).toBeLessThanOrEqual(4);
      const targets = journey.links.map((link) => link.targetTopicId);
      expect(new Set(targets).size).toBe(targets.length);
    }
  });

  it('maps a blending article to prerequisite, next, practice, and diagnostic owners', () => {
    const links = getSemanticInternalLinksForPath('/blog/how-kids-learn-blending');
    expect(links.map((link) => [link.relation, link.to])).toEqual([
      ['prerequisite', '/blog/satpin-phonics-guide'],
      ['next', '/blog/cvc-words-explained-for-parents'],
      ['practice', '/blog/phonics-blending-activities'],
      ['diagnostic', '/blog/why-child-knows-letter-sounds-but-cannot-read-words'],
    ]);
  });

  it('maps diagnostic reading content to learning, practice, and assessment without duplicating programme intent', () => {
    const links = getSemanticInternalLinksForPath('/blog/child-knows-abc-but-cannot-read');
    expect(links.map((link) => link.relation)).toEqual(['related', 'next', 'practice', 'assessment']);
    expect(links.filter((link) => ['assessment', 'programme'].includes(link.relation))).toHaveLength(1);
    expect(links.find((link) => link.relation === 'assessment')?.to).toBe('/book-demo');
  });

  it('renders only educational semantic links in the article pathway and keeps commercial CTAs separate', () => {
    expect(pathwaySource).toContain("excludeRelations: ['assessment', 'programme']");
    expect(pathwaySource).toContain('data-semantic-internal-links="true"');
    expect(pathwaySource).toContain('data-semantic-relation={link.relation}');
    expect(pathwaySource).toContain('Continue the learning path');
    expect(conversionSource).toContain('<BlogSemanticPathway slug={slug} />');
    expect(conversionSource).toContain('data-blog-conversion-family={config.family}');
  });

  it('does not invent semantic links for pages without an explicit Brick 6 journey', () => {
    expect(getSemanticInternalLinksForPath('/blog/non-existent-topic')).toEqual([]);
    expect(getSemanticInternalLinksForPath('/pricing')).toEqual([]);
  });
});
