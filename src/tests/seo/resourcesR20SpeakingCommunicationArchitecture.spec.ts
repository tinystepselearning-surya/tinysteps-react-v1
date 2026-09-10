import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { CANONICAL_TOPIC_OWNERSHIP } from '../../lib/canonicalTopicOwnershipRegistry.js';
import { R19_CANONICAL_TOPIC_OWNERSHIP } from '../../lib/grammarWritingSemanticCanonicalOwnership.js';
import { getGrammarWritingSemanticInternalLinksForPath } from '../../lib/grammarWritingSemanticJourneyGraph.js';
import { getSpeakingCommunicationContentExecution } from '../../lib/speakingCommunicationContentExecutionRegistry.js';
import {
  SPEAKING_COMMUNICATION_CONTENT_AUDIT,
  SPEAKING_COMMUNICATION_KNOWLEDGE_DOMAINS,
  getSpeakingCommunicationContentAuditByAction,
} from '../../lib/speakingCommunicationKnowledgeArchitecture.js';

const root = process.cwd();
const source = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
const blogSource = source('src/content/blog/posts/public-speaking/spoken-english-classes-for-kids-confidence.ts');
const routeManifestSource = source('src/lib/publicRouteManifest.js');
const ownerById = new Map(R19_CANONICAL_TOPIC_OWNERSHIP.map((entry) => [entry.id, entry]));
const publicBlogSlugs = new Set(blogPosts.map((post) => post.slug));

describe('Resources R20 speaking and communication knowledge architecture', () => {
  it('defines nine connected, non-rigid communication domains', () => {
    expect(SPEAKING_COMMUNICATION_KNOWLEDGE_DOMAINS).toHaveLength(9);
    expect(SPEAKING_COMMUNICATION_KNOWLEDGE_DOMAINS.map((item) => item.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const ids = new Set(SPEAKING_COMMUNICATION_KNOWLEDGE_DOMAINS.map((item) => item.id));
    for (const domain of SPEAKING_COMMUNICATION_KNOWLEDGE_DOMAINS) {
      expect(domain.adjacentDomainIds.length).toBeGreaterThan(0);
      for (const adjacent of domain.adjacentDomainIds) expect(ids.has(adjacent)).toBe(true);
    }
    const architecture = source('src/lib/speakingCommunicationKnowledgeArchitecture.js');
    expect(architecture).toContain('not a claim that confident speaking');
    expect(architecture).toContain('develops through one rigid ladder');
    expect(architecture).toContain('rather than loudness, extroversion or forced eye contact');
    expect(architecture).toContain('without treating accent conformity');
    expect(architecture).toContain('multilingual performance can differ by setting/topic');
  });

  it('keeps ten strong pages, holds one consolidation candidate and preserves exactly three R20 CREATE decisions for explicit R21 execution', () => {
    expect(getSpeakingCommunicationContentAuditByAction('keep')).toHaveLength(10);
    expect(getSpeakingCommunicationContentAuditByAction('consolidate')).toHaveLength(1);
    const creates = getSpeakingCommunicationContentAuditByAction('create');
    expect(creates).toHaveLength(3);
    expect(creates.map((item) => item.id)).toEqual([
      'conversation-skills-parent-guide',
      'storytelling-retelling-parent-guide',
      'speaking-delivery-parent-guide',
    ]);
    for (const item of creates) {
      expect(item).toMatchObject({ path: null, canonicalTopicId: null, implementationState: 'proposal-only', publicationApproved: false });
      expect(item.proposedPath).toMatch(/^\/blog\/[a-z0-9-]+$/);
      const execution = getSpeakingCommunicationContentExecution(item.id);
      expect(execution?.state).toBe('published');
      expect(execution?.path).toBe(item.proposedPath);
      expect(publicBlogSlugs.has(item.proposedPath!.replace('/blog/', ''))).toBe(true);
    }
  });

  it('preserves registered canonical owners and commercial/informational route roles', () => {
    for (const item of SPEAKING_COMMUNICATION_CONTENT_AUDIT.filter((entry) => entry.canonicalTopicId)) {
      expect(ownerById.get(item.canonicalTopicId!)?.ownerPath).toBe(item.path);
    }
    const canonicalById = new Map(CANONICAL_TOPIC_OWNERSHIP.map((entry) => [entry.id, entry]));
    expect(canonicalById.get('speaking-subject-discovery')).toMatchObject({ ownerPath: '/resources/speaking', intent: 'informational' });
    expect(canonicalById.get('live-public-speaking-classes')).toMatchObject({ ownerPath: '/speaking', intent: 'high-commercial' });
    expect(canonicalById.get('spoken-english-classes')).toMatchObject({ ownerPath: '/spoken-english-classes-for-kids-online', intent: 'commercial' });
    expect(routeManifestSource).toContain("route('/resources/speaking'");
    expect(routeManifestSource).toContain("route('/speaking'");
    expect(routeManifestSource).toContain("route('/spoken-english-classes-for-kids-online'");
  });

  it('keeps every strong-page owner in place without creating thin label pages', () => {
    const keepPaths = getSpeakingCommunicationContentAuditByAction('keep').map((item) => item.path);
    expect(new Set(keepPaths).size).toBe(10);
    for (const item of getSpeakingCommunicationContentAuditByAction('keep')) {
      expect(item.path).toMatch(/^\/blog\//);
      expect(item.implementationState).toBe('established');
      expect(publicBlogSlugs.has(item.path!.replace('/blog/', ''))).toBe(true);
    }
    expect(SPEAKING_COMMUNICATION_CONTENT_AUDIT).toHaveLength(14);
  });

  it('holds the legacy consolidation candidate without authorizing a URL change', () => {
    const legacy = getSpeakingCommunicationContentAuditByAction('consolidate')[0];
    expect(legacy).toMatchObject({
      path: '/blog/spoken-english-classes-for-kids-confidence',
      consolidationTarget: '/blog/speaking-confidence-seeds',
      implementationState: 'hold',
      publicationApproved: false,
      urlChangeAuthorized: false,
    });
    expect(blogSource).toContain("slug: 'spoken-english-classes-for-kids-confidence'");
  });

  it('does not change Brick 6, R16 or R19 semantic behavior', () => {
    expect(getGrammarWritingSemanticInternalLinksForPath('/blog/how-kids-learn-blending').map((link) => [link.relation, link.to])).toEqual([
      ['prerequisite', '/blog/satpin-phonics-guide'],
      ['next', '/blog/cvc-words-explained-for-parents'],
      ['practice', '/blog/phonics-blending-activities'],
      ['diagnostic', '/blog/why-child-knows-letter-sounds-but-cannot-read-words'],
    ]);
    expect(getGrammarWritingSemanticInternalLinksForPath('/blog/how-vocabulary-supports-reading-comprehension').map((link) => link.to)).toEqual(expect.arrayContaining([
      '/blog/phonics-comprehension',
      '/blog/why-child-reads-words-but-does-not-understand-story',
    ]));
    expect(getGrammarWritingSemanticInternalLinksForPath('/blog/how-to-teach-paragraph-writing-to-kids').map((link) => link.to)).toEqual([
      '/blog/how-to-improve-sentence-formation-in-kids',
      '/blog/grammar-conjunctions',
      '/blog/grammar-creative-writing',
      '/blog/grammar-editing-camp',
    ]);
  });
});
