import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { R18_CANONICAL_TOPIC_OWNERSHIP } from '../../lib/grammarWritingContentCanonicalOwnership.js';
import {
  R19_CANONICAL_TOPIC_OWNERSHIP,
  R19_GRAMMAR_WRITING_EXISTING_CANONICAL_TOPIC_OWNERSHIP,
  getR19CanonicalTopicOwnerPath,
} from '../../lib/grammarWritingSemanticCanonicalOwnership.js';
import {
  R19_GRAMMAR_WRITING_SEMANTIC_JOURNEYS,
  getGrammarWritingSemanticInternalLinksForPath,
} from '../../lib/grammarWritingSemanticJourneyGraph.js';

const root = process.cwd();
const pathwaySource = fs.readFileSync(path.join(root, 'src/components/blog/BlogSemanticPathway.tsx'), 'utf8');
const publicSlugs = new Set(blogPosts.map((post) => post.slug));

describe('Resources R19 grammar and writing semantic journeys', () => {
  it('adds exactly six canonical topic IDs for strong existing grammar/writing owners', () => {
    expect(R19_GRAMMAR_WRITING_EXISTING_CANONICAL_TOPIC_OWNERSHIP).toHaveLength(6);
    expect(R19_CANONICAL_TOPIC_OWNERSHIP).toHaveLength(R18_CANONICAL_TOPIC_OWNERSHIP.length + 6);
    expect(new Set(R19_CANONICAL_TOPIC_OWNERSHIP.map((item) => item.id)).size).toBe(R19_CANONICAL_TOPIC_OWNERSHIP.length);
    expect(new Set(R19_CANONICAL_TOPIC_OWNERSHIP.map((item) => item.queryIntent.toLowerCase())).size).toBe(R19_CANONICAL_TOPIC_OWNERSHIP.length);

    const expected: Record<string, string> = {
      'grammar-tenses-guide': '/blog/grammar-tenses',
      'subject-verb-agreement-guide': '/blog/grammar-subject-verb',
      'conjunctions-guide': '/blog/grammar-conjunctions',
      'creative-writing-guide': '/blog/grammar-creative-writing',
      'grammar-editing-guide': '/blog/grammar-editing-camp',
      'grammar-assessment-guide': '/blog/grammar-assessment',
    };
    for (const [topicId, pathname] of Object.entries(expected)) {
      expect(getR19CanonicalTopicOwnerPath(topicId)).toBe(pathname);
      expect(publicSlugs.has(pathname.replace(/^\/blog\//, ''))).toBe(true);
    }
  });

  it('gives the two R18 guides useful educational continuations', () => {
    const punctuation = getGrammarWritingSemanticInternalLinksForPath('/blog/punctuation-and-capital-letters-for-kids', {
      excludeRelations: ['assessment', 'programme'],
    });
    expect(punctuation.map((link) => link.to)).toEqual([
      '/blog/how-to-improve-sentence-formation-in-kids',
      '/blog/grammar-nouns-to-paragraphs',
      '/blog/grammar-editing-camp',
      '/free-grammar-games-for-kids',
    ]);

    const paragraph = getGrammarWritingSemanticInternalLinksForPath('/blog/how-to-teach-paragraph-writing-to-kids', {
      excludeRelations: ['assessment', 'programme'],
    });
    expect(paragraph.map((link) => link.to)).toEqual([
      '/blog/how-to-improve-sentence-formation-in-kids',
      '/blog/grammar-conjunctions',
      '/blog/grammar-creative-writing',
      '/blog/grammar-editing-camp',
    ]);
  });

  it('connects the six strong existing grammar guides without replacing their established URLs', () => {
    const expectations: Record<string, string[]> = {
      '/blog/grammar-tenses': ['/blog/grammar-subject-verb', '/blog/child-knows-grammar-but-makes-mistakes'],
      '/blog/grammar-subject-verb': ['/blog/grammar-tenses', '/blog/child-knows-grammar-but-makes-mistakes'],
      '/blog/grammar-conjunctions': ['/blog/how-to-improve-sentence-formation-in-kids', '/blog/how-to-teach-paragraph-writing-to-kids'],
      '/blog/grammar-creative-writing': ['/blog/how-to-teach-paragraph-writing-to-kids', '/blog/grammar-editing-camp'],
      '/blog/grammar-editing-camp': ['/blog/child-knows-grammar-but-makes-mistakes', '/blog/punctuation-and-capital-letters-for-kids'],
      '/blog/grammar-assessment': ['/blog/child-knows-grammar-but-makes-mistakes', '/blog/grammar-nouns-to-paragraphs'],
    };
    for (const [pathname, expectedTargets] of Object.entries(expectations)) {
      const links = getGrammarWritingSemanticInternalLinksForPath(pathname);
      for (const target of expectedTargets) expect(links.map((link) => link.to)).toContain(target);
    }
  });

  it('preserves historical Brick 6 and R16 output for unaffected reading journeys', () => {
    const links = getGrammarWritingSemanticInternalLinksForPath('/blog/how-kids-learn-blending');
    expect(links.map((link) => [link.relation, link.to])).toEqual([
      ['prerequisite', '/blog/satpin-phonics-guide'],
      ['next', '/blog/cvc-words-explained-for-parents'],
      ['practice', '/blog/phonics-blending-activities'],
      ['diagnostic', '/blog/why-child-knows-letter-sounds-but-cannot-read-words'],
    ]);

    const vocabulary = getGrammarWritingSemanticInternalLinksForPath('/blog/how-vocabulary-supports-reading-comprehension');
    expect(vocabulary.map((link) => link.to)).toContain('/blog/phonics-comprehension');
    expect(vocabulary.map((link) => link.to)).toContain('/blog/why-child-reads-words-but-does-not-understand-story');
  });

  it('keeps each additive journey concise, deduplicated and commercially bounded', () => {
    expect(R19_GRAMMAR_WRITING_SEMANTIC_JOURNEYS).toHaveLength(8);
    for (const journey of R19_GRAMMAR_WRITING_SEMANTIC_JOURNEYS) {
      expect(getR19CanonicalTopicOwnerPath(journey.sourceTopicId)).toBeTruthy();
      expect(journey.links.length).toBeGreaterThan(0);
      expect(journey.links.length).toBeLessThanOrEqual(4);
      expect(new Set(journey.links.map((link) => link.targetTopicId)).size).toBe(journey.links.length);
      expect(journey.links.filter((link) => ['assessment', 'programme'].includes(link.relation)).length).toBeLessThanOrEqual(1);
      for (const link of journey.links) expect(getR19CanonicalTopicOwnerPath(link.targetTopicId)).toBeTruthy();
    }
  });

  it('keeps directed next-step relationships acyclic', () => {
    const nextBySource = new Map(R19_GRAMMAR_WRITING_SEMANTIC_JOURNEYS.map((journey) => [
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

  it('keeps assessment/programme links out of the rendered educational pathway', () => {
    const links = getGrammarWritingSemanticInternalLinksForPath('/blog/grammar-assessment', {
      limit: 4,
      excludeRelations: ['assessment', 'programme'],
    });
    expect(links.every((link) => !['assessment', 'programme'].includes(link.relation))).toBe(true);
    expect(pathwaySource).toContain('getGrammarWritingSemanticInternalLinksForPath');
    expect(pathwaySource).not.toContain("from '../../lib/semanticInternalLinkRegistry.js'");
    expect(pathwaySource).not.toContain("from '../../lib/readingSemanticJourneyGraph.js'");
    expect(pathwaySource).toContain("excludeRelations: ['assessment', 'programme']");
  });

  it('does not invent journeys for unrelated pages', () => {
    expect(getGrammarWritingSemanticInternalLinksForPath('/blog/non-existent-topic')).toEqual([]);
    expect(getGrammarWritingSemanticInternalLinksForPath('/pricing')).toEqual([]);
  });
});
