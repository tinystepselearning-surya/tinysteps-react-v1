import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { R21_CANONICAL_TOPIC_OWNERSHIP } from '../../lib/speakingCommunicationContentCanonicalOwnership.js';
import {
  R22_CANONICAL_TOPIC_OWNERSHIP,
  R22_SPEAKING_COMMUNICATION_EXISTING_CANONICAL_TOPIC_OWNERSHIP,
  getR22CanonicalTopicOwnerPath,
} from '../../lib/speakingCommunicationSemanticCanonicalOwnership.js';
import {
  R22_SPEAKING_COMMUNICATION_SEMANTIC_JOURNEYS,
  getSpeakingCommunicationSemanticInternalLinksForPath,
} from '../../lib/speakingCommunicationSemanticJourneyGraph.js';

const root = process.cwd();
const pathwaySource = fs.readFileSync(path.join(root, 'src/components/blog/BlogSemanticPathway.tsx'), 'utf8');
const publicSlugs = new Set(blogPosts.map((post) => post.slug));

const expectedOwners: Record<string, string> = {
  'speech-structure-guide': '/blog/speaking-structure',
  'speaking-visual-aids-guide': '/blog/speaking-visual-aids',
  'speaking-debate-guide': '/blog/speaking-debate-starters',
  'speaking-video-feedback-guide': '/blog/speaking-video-feedback',
  'speaking-competition-preparation-guide': '/blog/speaking-competition-prep',
  'speaking-family-showcase-practice': '/blog/speaking-family-showcase',
  'story-card-speaking-bridge': '/blog/grammar-speaking-bridge',
};

const paths = (pathname: string) => getSpeakingCommunicationSemanticInternalLinksForPath(pathname, {
  excludeRelations: ['assessment', 'programme'],
}).map((link) => link.to);

describe('Resources R22 speaking and communication semantic journeys', () => {
  it('adds exactly seven canonical IDs for substantial existing speaking owners', () => {
    expect(R22_SPEAKING_COMMUNICATION_EXISTING_CANONICAL_TOPIC_OWNERSHIP).toHaveLength(7);
    expect(R22_CANONICAL_TOPIC_OWNERSHIP).toHaveLength(R21_CANONICAL_TOPIC_OWNERSHIP.length + 7);
    expect(new Set(R22_CANONICAL_TOPIC_OWNERSHIP.map((item) => item.id)).size).toBe(R22_CANONICAL_TOPIC_OWNERSHIP.length);
    expect(new Set(R22_CANONICAL_TOPIC_OWNERSHIP.map((item) => item.queryIntent.toLowerCase())).size).toBe(R22_CANONICAL_TOPIC_OWNERSHIP.length);

    for (const [topicId, pathname] of Object.entries(expectedOwners)) {
      expect(getR22CanonicalTopicOwnerPath(topicId)).toBe(pathname);
      expect(publicSlugs.has(pathname.replace(/^\/blog\//, ''))).toBe(true);
    }
  });

  it('builds eight focused speaking journeys with exactly 32 semantic edges', () => {
    expect(R22_SPEAKING_COMMUNICATION_SEMANTIC_JOURNEYS).toHaveLength(8);
    expect(R22_SPEAKING_COMMUNICATION_SEMANTIC_JOURNEYS.reduce((sum, journey) => sum + journey.links.length, 0)).toBe(32);
    for (const journey of R22_SPEAKING_COMMUNICATION_SEMANTIC_JOURNEYS) {
      expect(getR22CanonicalTopicOwnerPath(journey.sourceTopicId)).toBeTruthy();
      expect(journey.links).toHaveLength(4);
      expect(new Set(journey.links.map((link) => link.targetTopicId)).size).toBe(4);
      expect(journey.links.filter((link) => ['assessment', 'programme'].includes(link.relation)).length).toBeLessThanOrEqual(1);
      for (const link of journey.links) expect(getR22CanonicalTopicOwnerPath(link.targetTopicId)).toBeTruthy();
    }
  });

  it('connects conversation to response expansion, confidence, discussion and familiar practice', () => {
    expect(paths('/blog/conversation-skills-for-kids')).toEqual([
      '/blog/child-gives-one-word-answers',
      '/blog/speaking-confidence-seeds',
      '/blog/speaking-debate-starters',
      '/blog/speaking-family-showcase',
    ]);
  });

  it('moves response expansion into storytelling while keeping initiation as a distinct diagnostic', () => {
    const links = getSpeakingCommunicationSemanticInternalLinksForPath('/blog/child-gives-one-word-answers');
    expect(links.map((link) => link.to)).toContain('/blog/how-to-teach-storytelling-to-kids');
    expect(links.find((link) => link.relation === 'diagnostic')?.to).toBe('/blog/child-understands-english-but-does-not-speak');
    expect(links.map((link) => link.to)).toContain('/blog/conversation-skills-for-kids');
  });

  it('connects storytelling to speech structure and existing oral-practice contexts', () => {
    expect(paths('/blog/how-to-teach-storytelling-to-kids')).toEqual([
      '/blog/child-gives-one-word-answers',
      '/blog/speaking-structure',
      '/blog/grammar-speaking-bridge',
      '/blog/speaking-family-showcase',
    ]);
  });

  it('connects speech structure to delivery, visual support and focused rehearsal', () => {
    expect(paths('/blog/speaking-structure')).toEqual([
      '/blog/how-to-teach-storytelling-to-kids',
      '/blog/public-speaking-delivery-for-kids',
      '/blog/speaking-visual-aids',
      '/blog/speaking-video-feedback',
    ]);
  });

  it('connects delivery to confidence, feedback and event-specific preparation without accent conformity', () => {
    expect(paths('/blog/public-speaking-delivery-for-kids')).toEqual([
      '/blog/speaking-structure',
      '/blog/speaking-confidence-seeds',
      '/blog/speaking-video-feedback',
      '/blog/speaking-competition-prep',
    ]);
  });

  it('connects discussion back to conversation and onward to focused feedback', () => {
    const debate = paths('/blog/speaking-debate-starters');
    expect(debate).toContain('/blog/conversation-skills-for-kids');
    expect(debate).toContain('/blog/speaking-structure');
    expect(debate).toContain('/blog/speaking-video-feedback');
    expect(debate).toContain('/blog/speaking-confidence-seeds');
  });

  it('preserves unaffected Brick 6, R16 and R19 semantic outputs exactly', () => {
    expect(getSpeakingCommunicationSemanticInternalLinksForPath('/blog/how-kids-learn-blending').map((link) => [link.relation, link.to])).toEqual([
      ['prerequisite', '/blog/satpin-phonics-guide'],
      ['next', '/blog/cvc-words-explained-for-parents'],
      ['practice', '/blog/phonics-blending-activities'],
      ['diagnostic', '/blog/why-child-knows-letter-sounds-but-cannot-read-words'],
    ]);
    expect(paths('/blog/punctuation-and-capital-letters-for-kids')).toEqual([
      '/blog/how-to-improve-sentence-formation-in-kids',
      '/blog/grammar-nouns-to-paragraphs',
      '/blog/grammar-editing-camp',
      '/free-grammar-games-for-kids',
    ]);
  });

  it('keeps directed next-step relationships acyclic', () => {
    const nextBySource = new Map(R22_SPEAKING_COMMUNICATION_SEMANTIC_JOURNEYS.map((journey) => [
      journey.sourceTopicId,
      journey.links.filter((link) => link.relation === 'next').map((link) => link.targetTopicId),
    ]));
    const visiting = new Set<string>();
    const visited = new Set<string>();
    const visit = (id: string): boolean => {
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

  it('uses R22 as the runtime adapter and keeps conversion links out of the educational pathway', () => {
    const links = getSpeakingCommunicationSemanticInternalLinksForPath('/blog/conversation-skills-for-kids', {
      limit: 4,
      excludeRelations: ['assessment', 'programme'],
    });
    expect(links.every((link) => !['assessment', 'programme'].includes(link.relation))).toBe(true);
    expect(pathwaySource).toContain('getSpeakingCommunicationSemanticInternalLinksForPath');
    expect(pathwaySource).not.toContain("from '../../lib/grammarWritingSemanticJourneyGraph.js'");
    expect(pathwaySource).not.toContain("from '../../lib/readingSemanticJourneyGraph.js'");
    expect(pathwaySource).not.toContain("from '../../lib/semanticInternalLinkRegistry.js'");
    expect(pathwaySource).toContain("excludeRelations: ['assessment', 'programme']");
  });

  it('does not invent journeys for unrelated pages', () => {
    expect(getSpeakingCommunicationSemanticInternalLinksForPath('/blog/non-existent-topic')).toEqual([]);
    expect(getSpeakingCommunicationSemanticInternalLinksForPath('/pricing')).toEqual([]);
  });
});
