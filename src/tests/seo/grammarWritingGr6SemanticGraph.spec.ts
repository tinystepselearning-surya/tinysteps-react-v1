import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { GRAMMAR_WRITING_SKILL_TAXONOMY } from '../../lib/grammarWritingKnowledgeTaxonomy.js';
import {
  GRAMMAR_WRITING_TENSE_COMPARISONS,
  GRAMMAR_WRITING_TENSE_ERROR_PATTERNS,
  GRAMMAR_WRITING_TENSE_NODES,
} from '../../lib/grammarWritingTenseArchitecture.js';
import { GRAMMAR_WRITING_WRITING_STAGES } from '../../lib/grammarWritingWritingProgression.js';
import { GRAMMAR_WRITING_PARENT_PROBLEMS } from '../../lib/grammarWritingParentProblemArchitecture.js';
import { GRAMMAR_WRITING_PRACTICE_UTILITIES } from '../../lib/grammarWritingPracticeUtilities.js';
import {
  R19_GRAMMAR_WRITING_SEMANTIC_JOURNEYS,
  getGrammarWritingSemanticInternalLinksForPath,
} from '../../lib/grammarWritingSemanticJourneyGraph.js';
import {
  GRAMMAR_WRITING_GR6_PRINCIPLES,
  GRAMMAR_WRITING_GR6_PUBLIC_COMPLETION_JOURNEYS,
  GRAMMAR_WRITING_GR6_PUBLIC_JOURNEYS,
  GRAMMAR_WRITING_GR6_PUBLIC_OWNERS,
  GRAMMAR_WRITING_GR6_RELATION_SEQUENCE,
  GRAMMAR_WRITING_GR6_SEMANTIC_EDGES,
  GRAMMAR_WRITING_GR6_SEMANTIC_NODES,
  getGrammarWritingGr6IncomingEdges,
  getGrammarWritingGr6OutgoingEdges,
  getGrammarWritingGr6PublicJourney,
  getGrammarWritingGr6PublicLinksForPath,
  getGrammarWritingGr6SemanticNode,
  getGrammarWritingGr6TenseJourney,
} from '../../lib/grammarWritingGr6SemanticGraph.js';

const root = process.cwd();

describe('Session B GR6 grammar/writing semantic journey graph', () => {
  it('composes the frozen GR1-GR5 layers without inventing a second taxonomy', () => {
    expect(GRAMMAR_WRITING_GR6_RELATION_SEQUENCE).toEqual([
      'prerequisite',
      'comparison',
      'common-error',
      'writing-application',
      'practice',
      'next-concept',
    ]);

    const counts = Object.fromEntries(
      ['skill', 'tense', 'comparison', 'error', 'writing-stage', 'parent-problem', 'practice', 'public-topic']
        .map((kind) => [kind, GRAMMAR_WRITING_GR6_SEMANTIC_NODES.filter((item) => item.kind === kind).length]),
    );
    expect(counts).toEqual({
      skill: 14,
      tense: 9,
      comparison: 5,
      error: 16,
      'writing-stage': 10,
      'parent-problem': 10,
      practice: 9,
      'public-topic': 17,
    });
    expect(GRAMMAR_WRITING_GR6_SEMANTIC_NODES).toHaveLength(90);
    expect(new Set(GRAMMAR_WRITING_GR6_SEMANTIC_NODES.map((item) => item.ref)).size).toBe(90);
  });

  it('builds the complete tense semantic sequence from the exact GR2 records', () => {
    for (const tense of GRAMMAR_WRITING_TENSE_NODES) {
      const journey = getGrammarWritingGr6TenseJourney(tense.id);
      expect(journey, tense.id).toBeTruthy();
      expect(journey?.conceptRef).toBe(`tense:${tense.id}`);
      expect(journey?.prerequisiteRefs.length, tense.id).toBeGreaterThan(0);
      expect(journey?.comparisonRefs).toEqual(tense.comparisonIds.map((id) => `comparison:${id}`));
      expect(journey?.commonErrorRefs).toEqual(tense.commonErrorIds.map((id) => `error:${id}`));
      expect(journey?.writingApplicationRefs.length, tense.id).toBeGreaterThan(0);
      expect(journey?.practiceRefs.length, tense.id).toBeGreaterThan(0);
      expect(journey?.nextConceptRefs.length, tense.id).toBeGreaterThan(0);
    }
    expect(getGrammarWritingGr6TenseJourney('simple-present')?.prerequisiteRefs).toEqual(['skill:tenses']);
    expect(getGrammarWritingGr6TenseJourney('tense-consistency-transfer')?.nextConceptRefs).toEqual(['skill:editing-revision']);
  });

  it('gives every GR1-GR5 entity semantic connectivity with no orphan internal nodes', () => {
    const expectedRefs = [
      ...GRAMMAR_WRITING_SKILL_TAXONOMY.map((item) => `skill:${item.id}`),
      ...GRAMMAR_WRITING_TENSE_NODES.map((item) => `tense:${item.id}`),
      ...GRAMMAR_WRITING_TENSE_COMPARISONS.map((item) => `comparison:${item.id}`),
      ...GRAMMAR_WRITING_TENSE_ERROR_PATTERNS.map((item) => `error:${item.id}`),
      ...GRAMMAR_WRITING_WRITING_STAGES.map((item) => `writing-stage:${item.id}`),
      ...GRAMMAR_WRITING_PARENT_PROBLEMS.map((item) => `parent-problem:${item.id}`),
      ...GRAMMAR_WRITING_PRACTICE_UTILITIES.map((item) => `practice:${item.id}`),
    ];
    for (const nodeRef of expectedRefs) {
      expect(getGrammarWritingGr6SemanticNode(nodeRef), nodeRef).toBeTruthy();
      expect(
        getGrammarWritingGr6OutgoingEdges(nodeRef).length + getGrammarWritingGr6IncomingEdges(nodeRef).length,
        nodeRef,
      ).toBeGreaterThan(0);
    }
  });

  it('connects concepts into writing and practice instead of leaving grammar informational-only', () => {
    for (const skill of GRAMMAR_WRITING_SKILL_TAXONOMY) {
      const source = `skill:${skill.id}`;
      expect(getGrammarWritingGr6OutgoingEdges(source, 'writing-application').length, skill.id).toBeGreaterThan(0);
      expect(getGrammarWritingGr6OutgoingEdges(source, 'practice').length, skill.id).toBeGreaterThan(0);
    }
    for (const tense of GRAMMAR_WRITING_TENSE_NODES) {
      const source = `tense:${tense.id}`;
      expect(getGrammarWritingGr6OutgoingEdges(source, 'common-error').length, tense.id).toBeGreaterThan(0);
      expect(getGrammarWritingGr6OutgoingEdges(source, 'writing-application').length, tense.id).toBeGreaterThan(0);
      expect(getGrammarWritingGr6OutgoingEdges(source, 'practice').length, tense.id).toBeGreaterThan(0);
    }
  });

  it('gives all 17 existing grammar/writing canonical owners inbound and outbound semantic connections', () => {
    expect(GRAMMAR_WRITING_GR6_PUBLIC_OWNERS).toHaveLength(17);
    expect(GRAMMAR_WRITING_GR6_PUBLIC_JOURNEYS).toHaveLength(17);
    expect(new Set(GRAMMAR_WRITING_GR6_PUBLIC_JOURNEYS.map((item) => item.sourceTopicId)).size).toBe(17);

    for (const owner of GRAMMAR_WRITING_GR6_PUBLIC_OWNERS) {
      const nodeRef = `public-topic:${String(owner.id)}`;
      expect(getGrammarWritingGr6PublicJourney(String(owner.id)), String(owner.id)).toBeTruthy();
      expect(getGrammarWritingGr6OutgoingEdges(nodeRef).length, `${String(owner.id)} outgoing`).toBeGreaterThan(0);
      expect(getGrammarWritingGr6IncomingEdges(nodeRef).length, `${String(owner.id)} incoming`).toBeGreaterThan(0);
    }
  });

  it('preserves the eight R19 public journeys and adds exactly nine completion sources', () => {
    expect(R19_GRAMMAR_WRITING_SEMANTIC_JOURNEYS).toHaveLength(8);
    expect(GRAMMAR_WRITING_GR6_PUBLIC_COMPLETION_JOURNEYS).toHaveLength(9);
    const r19Sources = new Set(R19_GRAMMAR_WRITING_SEMANTIC_JOURNEYS.map((item) => item.sourceTopicId));
    for (const item of GRAMMAR_WRITING_GR6_PUBLIC_COMPLETION_JOURNEYS) expect(r19Sources.has(item.sourceTopicId)).toBe(false);

    const historical = getGrammarWritingSemanticInternalLinksForPath('/blog/grammar-nouns-to-paragraphs').map((link) => [link.relation, link.to]);
    expect(historical).toEqual([
      ['next', '/blog/how-to-improve-sentence-formation-in-kids'],
      ['practice', '/free-grammar-games-for-kids'],
      ['programme', '/grammar'],
    ]);
  });

  it('resolves GR6 public graph data only through established owner paths', () => {
    expect(getGrammarWritingGr6PublicLinksForPath('/resources/grammar', { excludeRelations: ['programme'] }).map((item) => item.to)).toEqual([
      '/blog/grammar-nouns-to-paragraphs',
      '/blog/how-to-improve-sentence-formation-in-kids',
      '/free-grammar-games-for-kids',
    ]);
    expect(getGrammarWritingGr6PublicLinksForPath('/blog/grammar-tenses').map((item) => item.to)).toEqual([
      '/blog/grammar-subject-verb',
      '/blog/child-knows-grammar-but-makes-mistakes',
      '/free-grammar-games-for-kids',
    ]);
    expect(getGrammarWritingGr6PublicLinksForPath('/not-a-grammar-owner')).toEqual([]);
  });

  it('keeps public journeys concise and bounded to grammar/writing canonical owners', () => {
    for (const journey of GRAMMAR_WRITING_GR6_PUBLIC_JOURNEYS) {
      expect(journey.links.length, journey.sourceTopicId).toBeGreaterThan(0);
      expect(journey.links.length, journey.sourceTopicId).toBeLessThanOrEqual(4);
      expect(new Set(journey.links.map((item) => item.targetTopicId)).size).toBe(journey.links.length);
      for (const link of journey.links) {
        expect(GRAMMAR_WRITING_GR6_PUBLIC_OWNERS.map((item) => item.id)).toContain(link.targetTopicId);
      }
    }
  });

  it('protects GR6 from becoming a publication or route-generation layer', () => {
    const principles = Object.fromEntries(GRAMMAR_WRITING_GR6_PRINCIPLES.map((item) => [item.id, item.statement]));
    expect(principles['existing-public-owners-only']).toContain('does not add a route');
    expect(principles['no-orphan-nodes-or-owners']).toContain('Every GR1-GR5 entity');

    const source = fs.readFileSync(path.join(root, 'src/lib/grammarWritingGr6SemanticGraph.js'), 'utf8');
    for (const forbidden of ['proposedPath:', 'publicationApproved:', 'queryIntent:', 'canonicalOwner:', 'createRoute:']) {
      expect(source).not.toContain(forbidden);
    }
    expect(source).not.toContain("ownerPath: '/");
  });

  it('covers every relation in the intended semantic sequence', () => {
    const relations = new Set(GRAMMAR_WRITING_GR6_SEMANTIC_EDGES.map((item) => item.relation));
    for (const relation of GRAMMAR_WRITING_GR6_RELATION_SEQUENCE) expect(relations.has(relation), relation).toBe(true);
  });
});
