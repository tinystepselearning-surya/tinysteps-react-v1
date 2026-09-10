import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { CANONICAL_TOPIC_OWNERSHIP } from '../../lib/canonicalTopicOwnershipRegistry.js';
import { SPEAKING_COMMUNICATION_KNOWLEDGE_DOMAINS } from '../../lib/speakingCommunicationKnowledgeArchitecture.js';
import { R22_CANONICAL_TOPIC_OWNERSHIP } from '../../lib/speakingCommunicationSemanticCanonicalOwnership.js';
import { getSpeakingCommunicationSemanticInternalLinksForPath as getR22Links } from '../../lib/speakingCommunicationSemanticJourneyGraph.js';
import {
  SPEAKING_COMMUNICATION_COMPLETION_BRICKS,
  SPEAKING_COMMUNICATION_FREEZE,
  SPEAKING_COMMUNICATION_PARENT_PROBLEM_ROUTES,
  SPEAKING_COMMUNICATION_POST_R22_GAPS,
  SPEAKING_COMMUNICATION_PRACTICE_ROUTES,
  SPEAKING_COMMUNICATION_TIER1_CLUSTER_OWNERS,
} from '../../lib/speakingCommunicationCompletionArchitecture.js';
import {
  SP6_CANONICAL_TOPIC_OWNERSHIP,
  SP6_SPEAKING_COMMUNICATION_ADDITIVE_CANONICAL_OWNERSHIP,
  getSP6CanonicalTopicOwnerPath,
} from '../../lib/speakingCommunicationCompletionCanonicalOwnership.js';
import {
  SP6_SPEAKING_COMMUNICATION_SEMANTIC_JOURNEYS,
  getSpeakingCommunicationSemanticInternalLinksForPath as getSP6Links,
} from '../../lib/speakingCommunicationCompletionSemanticJourneyGraph.js';

const root = process.cwd();
const publicBlogPaths = new Set(blogPosts.map((post) => `/blog/${post.slug}`));
const educationalOptions = { limit: 4, excludeRelations: ['assessment', 'programme'] as const };
const source = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');

describe('Session C SP0-SP6 Speaking & Communication completion', () => {
  it('closes all seven bricks and freezes informational expansion', () => {
    expect(SPEAKING_COMMUNICATION_COMPLETION_BRICKS.map((brick) => brick.id)).toEqual(['SP0', 'SP1', 'SP2', 'SP3', 'SP4', 'SP5', 'SP6']);
    expect(SPEAKING_COMMUNICATION_COMPLETION_BRICKS.slice(0, 6).every((brick) => brick.state === 'complete')).toBe(true);
    expect(SPEAKING_COMMUNICATION_COMPLETION_BRICKS[6].state).toBe('frozen');
    expect(SPEAKING_COMMUNICATION_FREEZE).toMatchObject({ state: 'frozen', contentExpansionAllowed: false });
  });

  it('records only the five genuine post-R22 gaps and creates no new content owner', () => {
    expect(SPEAKING_COMMUNICATION_POST_R22_GAPS).toHaveLength(5);
    expect(SPEAKING_COMMUNICATION_POST_R22_GAPS.some((gap) => gap.action === 'create')).toBe(false);
    expect(SPEAKING_COMMUNICATION_POST_R22_GAPS.find((gap) => gap.id === 'classroom-communication-semantic-integration')).toMatchObject({
      priority: 'high',
      action: 'register-existing-owner',
      ownerPath: '/blog/back-to-school-english-confidence-plan',
    });
  });

  it('gives every Tier-1 speaking cluster an established owner without semantic duplication', () => {
    expect(SPEAKING_COMMUNICATION_TIER1_CLUSTER_OWNERS).toHaveLength(15);
    expect(new Set(SPEAKING_COMMUNICATION_TIER1_CLUSTER_OWNERS.map((entry) => entry.id)).size).toBe(15);
    const domainIds = new Set(SPEAKING_COMMUNICATION_KNOWLEDGE_DOMAINS.map((entry) => entry.id));
    for (const cluster of SPEAKING_COMMUNICATION_TIER1_CLUSTER_OWNERS) {
      expect(domainIds.has(cluster.domainId)).toBe(true);
      expect(publicBlogPaths.has(cluster.ownerPath)).toBe(true);
    }
  });

  it('registers exactly one post-R22 canonical owner: the existing classroom communication page', () => {
    expect(SP6_SPEAKING_COMMUNICATION_ADDITIVE_CANONICAL_OWNERSHIP).toHaveLength(1);
    expect(SP6_CANONICAL_TOPIC_OWNERSHIP).toHaveLength(R22_CANONICAL_TOPIC_OWNERSHIP.length + 1);
    expect(getSP6CanonicalTopicOwnerPath('classroom-communication-guide')).toBe('/blog/back-to-school-english-confidence-plan');
    expect(new Set(SP6_CANONICAL_TOPIC_OWNERSHIP.map((entry) => entry.id)).size).toBe(SP6_CANONICAL_TOPIC_OWNERSHIP.length);
    expect(new Set(SP6_CANONICAL_TOPIC_OWNERSHIP.map((entry) => entry.queryIntent.toLowerCase())).size).toBe(SP6_CANONICAL_TOPIC_OWNERSHIP.length);
  });

  it('preserves the visible R22 journeys exactly for every R22 source', () => {
    const paths = [
      '/blog/conversation-skills-for-kids',
      '/blog/child-gives-one-word-answers',
      '/blog/how-to-teach-storytelling-to-kids',
      '/blog/speaking-structure',
      '/blog/public-speaking-delivery-for-kids',
      '/blog/speaking-confidence-seeds',
      '/blog/speaking-debate-starters',
      '/blog/speaking-video-feedback',
    ];
    for (const pathname of paths) {
      expect(getSP6Links(pathname, educationalOptions).map((link) => [link.relation, link.to])).toEqual(
        getR22Links(pathname, educationalOptions).map((link) => [link.relation, link.to]),
      );
    }
  });

  it('gives the classroom owner a focused four-link educational journey with inbound relationships', () => {
    expect(getSP6Links('/blog/back-to-school-english-confidence-plan', educationalOptions).map((link) => [link.relation, link.to])).toEqual([
      ['diagnostic', '/blog/child-understands-english-but-does-not-speak'],
      ['related', '/blog/conversation-skills-for-kids'],
      ['related', '/blog/how-to-improve-sentence-formation-in-kids'],
      ['practice', '/blog/speaking-family-showcase'],
    ]);
    const conversationUncapped = getSP6Links('/blog/conversation-skills-for-kids').map((link) => link.to);
    const confidenceUncapped = getSP6Links('/blog/speaking-confidence-seeds').map((link) => link.to);
    expect(conversationUncapped).toContain('/blog/back-to-school-english-confidence-plan');
    expect(confidenceUncapped).toContain('/blog/back-to-school-english-confidence-plan');
  });

  it('covers all nine parent problems with an owner and a real practice continuation', () => {
    expect(SPEAKING_COMMUNICATION_PARENT_PROBLEM_ROUTES).toHaveLength(9);
    const expected = [
      'understands-but-does-not-speak',
      'one-word-answers',
      'hesitates',
      'cannot-explain-ideas',
      'cannot-tell-stories',
      'vocabulary-disappears',
      'unfamiliar-people',
      'cannot-express-opinions',
      'presentation-difficulty',
    ];
    expect(SPEAKING_COMMUNICATION_PARENT_PROBLEM_ROUTES.map((route) => route.id)).toEqual(expected);
    for (const route of SPEAKING_COMMUNICATION_PARENT_PROBLEM_ROUTES) {
      expect(route.ownerPath.length).toBeGreaterThan(5);
      expect(route.practicePath.length).toBeGreaterThan(5);
    }
  });

  it('connects practice to all nine R20 communication domains', () => {
    expect(SPEAKING_COMMUNICATION_PRACTICE_ROUTES).toHaveLength(9);
    expect(new Set(SPEAKING_COMMUNICATION_PRACTICE_ROUTES.map((entry) => entry.domainId))).toEqual(
      new Set(SPEAKING_COMMUNICATION_KNOWLEDGE_DOMAINS.map((entry) => entry.id)),
    );
  });

  it('refreshes conversation for vocabulary retrieval and storytelling for oral summarising', () => {
    const conversation = source('src/content/blog/posts/public-speaking/conversation-skills-for-kids.ts');
    expect(conversation).toContain('When vocabulary disappears during speaking: RETRIEVE → USE → REUSE');
    expect(conversation).toContain('/blog/how-to-improve-sentence-formation-in-kids');
    expect(conversation).toContain('/blog/back-to-school-english-confidence-plan');

    const storytelling = source('src/content/blog/posts/public-speaking/how-to-teach-storytelling-to-kids.ts');
    expect(storytelling).toContain('Retelling and summarising are different speaking jobs');
    expect(storytelling).toContain('If the listener only needs the most important part, what must stay?');
  });

  it('keeps debate, structure and delivery owners intact instead of duplicating SP3/SP4', () => {
    expect(getSP6CanonicalTopicOwnerPath('speaking-debate-guide')).toBe('/blog/speaking-debate-starters');
    expect(getSP6CanonicalTopicOwnerPath('speech-structure-guide')).toBe('/blog/speaking-structure');
    expect(getSP6CanonicalTopicOwnerPath('public-speaking-delivery-guide')).toBe('/blog/public-speaking-delivery-for-kids');
    expect(source('src/content/blog/posts/public-speaking/public-speaking-delivery-for-kids.ts')).toContain('Intelligibility is more useful than accent conformity');
  });

  it('protects subject and commercial ownership and keeps the educational UI conversion-free', () => {
    const canonicalById = new Map(CANONICAL_TOPIC_OWNERSHIP.map((entry) => [entry.id, entry]));
    expect(canonicalById.get('speaking-subject-discovery')).toMatchObject({ ownerPath: '/resources/speaking', intent: 'informational' });
    expect(canonicalById.get('live-public-speaking-classes')).toMatchObject({ ownerPath: '/speaking', intent: 'high-commercial' });
    expect(canonicalById.get('spoken-english-classes')).toMatchObject({ ownerPath: '/spoken-english-classes-for-kids-online', intent: 'commercial' });
    const pathway = source('src/components/blog/BlogSemanticPathway.tsx');
    expect(pathway).toContain("from '../../lib/speakingCommunicationCompletionSemanticJourneyGraph.js'");
    expect(pathway).toContain("excludeRelations: ['assessment', 'programme']");
  });

  it('adds only four small completion journeys and resolves every target through inherited ownership', () => {
    expect(SP6_SPEAKING_COMMUNICATION_SEMANTIC_JOURNEYS).toHaveLength(4);
    for (const journey of SP6_SPEAKING_COMMUNICATION_SEMANTIC_JOURNEYS) {
      expect(getSP6CanonicalTopicOwnerPath(journey.sourceTopicId)).toBeTruthy();
      for (const link of journey.links) expect(getSP6CanonicalTopicOwnerPath(link.targetTopicId)).toBeTruthy();
    }
  });
});
