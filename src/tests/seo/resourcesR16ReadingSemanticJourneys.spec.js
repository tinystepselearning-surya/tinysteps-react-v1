import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  R16_CANONICAL_TOPIC_OWNERSHIP,
  R16_READING_EXISTING_CANONICAL_TOPIC_OWNERSHIP,
  getR16CanonicalTopicOwnerPath,
} from '../../lib/readingSemanticCanonicalOwnership.js';
import {
  R16_READING_SEMANTIC_JOURNEYS,
  getReadingSemanticInternalLinksForPath,
} from '../../lib/readingSemanticJourneyGraph.js';
import { R15_CANONICAL_TOPIC_OWNERSHIP } from '../../lib/readingContentCanonicalOwnership.js';

const root = process.cwd();
const pathwaySource = fs.readFileSync(path.join(root, 'src/components/blog/BlogSemanticPathway.tsx'), 'utf8');

describe('Resources R16 reading semantic journeys', () => {
  it('adds only the two missing established comprehension owners to the R15 ownership view', () => {
    expect(R16_READING_EXISTING_CANONICAL_TOPIC_OWNERSHIP).toHaveLength(2);
    expect(R16_CANONICAL_TOPIC_OWNERSHIP).toHaveLength(R15_CANONICAL_TOPIC_OWNERSHIP.length + 2);
    expect(getR16CanonicalTopicOwnerPath('reading-comprehension-bridge')).toBe('/blog/phonics-comprehension');
    expect(getR16CanonicalTopicOwnerPath('story-comprehension-diagnostic')).toBe('/blog/why-child-reads-words-but-does-not-understand-story');
  });

  it('gives every R15 reading guide an explicit educational journey', () => {
    const paths = [
      '/blog/phonological-awareness-vs-phonemic-awareness-vs-phonics',
      '/blog/how-vocabulary-supports-reading-comprehension',
      '/blog/how-children-recognise-words-automatically-after-phonics',
    ];
    for (const pathname of paths) {
      const links = getReadingSemanticInternalLinksForPath(pathname, { excludeRelations: ['assessment', 'programme'] });
      expect(links.length).toBeGreaterThanOrEqual(3);
      expect(new Set(links.map((link) => link.to)).size).toBe(links.length);
    }
  });

  it('connects the two established comprehension pages that had no Brick 6 topic owner', () => {
    const bridge = getReadingSemanticInternalLinksForPath('/blog/phonics-comprehension');
    const diagnostic = getReadingSemanticInternalLinksForPath('/blog/why-child-reads-words-but-does-not-understand-story');
    expect(bridge.map((link) => link.to)).toContain('/blog/how-vocabulary-supports-reading-comprehension');
    expect(bridge.map((link) => link.to)).toContain('/blog/why-child-reads-words-but-does-not-understand-story');
    expect(diagnostic.map((link) => link.to)).toContain('/blog/phonics-comprehension');
    expect(diagnostic.find((link) => link.relation === 'assessment')?.to).toBe('/book-demo');
  });

  it('preserves legacy Brick 6 output for an unaffected journey', () => {
    const links = getReadingSemanticInternalLinksForPath('/blog/how-kids-learn-blending');
    expect(links.map((link) => [link.relation, link.to])).toEqual([
      ['prerequisite', '/blog/satpin-phonics-guide'],
      ['next', '/blog/cvc-words-explained-for-parents'],
      ['practice', '/blog/phonics-blending-activities'],
      ['diagnostic', '/blog/why-child-knows-letter-sounds-but-cannot-read-words'],
    ]);
  });

  it('keeps pathways concise, deduplicated, and commercially bounded', () => {
    for (const journey of R16_READING_SEMANTIC_JOURNEYS) {
      expect(journey.links.length).toBeGreaterThan(0);
      expect(journey.links.length).toBeLessThanOrEqual(4);
      expect(new Set(journey.links.map((link) => link.targetTopicId)).size).toBe(journey.links.length);
      expect(journey.links.filter((link) => ['assessment', 'programme'].includes(link.relation))).toHaveLength(journey.sourceTopicId === 'story-comprehension-diagnostic' ? 1 : 0);
      for (const link of journey.links) expect(getR16CanonicalTopicOwnerPath(link.targetTopicId)).toBeTruthy();
    }
  });

  it('keeps directed next-step relationships acyclic', () => {
    const nextBySource = new Map(R16_READING_SEMANTIC_JOURNEYS.map((journey) => [
      journey.sourceTopicId,
      journey.links.filter((link) => link.relation === 'next').map((link) => link.targetTopicId),
    ]));
    const visiting = new Set();
    const visited = new Set();
    const visit = (id) => {
      if (visiting.has(id)) return false;
      if (visited.has(id)) return true;
      visiting.add(id);
      for (const target of nextBySource.get(id) || []) if (!visit(target)) return false;
      visiting.delete(id);
      visited.add(id);
      return true;
    };
    for (const id of nextBySource.keys()) expect(visit(id)).toBe(true);
  });

  it('keeps commercial links out of the rendered educational pathway', () => {
    const links = getReadingSemanticInternalLinksForPath('/blog/why-child-reads-words-but-does-not-understand-story', {
      limit: 4,
      excludeRelations: ['assessment', 'programme'],
    });
    expect(links.every((link) => !['assessment', 'programme'].includes(link.relation))).toBe(true);
    expect(pathwaySource).toContain('getReadingSemanticInternalLinksForPath');
    expect(pathwaySource).not.toContain("from '../../lib/semanticInternalLinkRegistry.js'");
    expect(pathwaySource).toContain("excludeRelations: ['assessment', 'programme']");
  });

  it('still invents no journey for unrelated pages', () => {
    expect(getReadingSemanticInternalLinksForPath('/blog/non-existent-topic')).toEqual([]);
    expect(getReadingSemanticInternalLinksForPath('/pricing')).toEqual([]);
  });
});
