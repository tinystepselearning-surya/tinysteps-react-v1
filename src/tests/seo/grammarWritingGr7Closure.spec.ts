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
import {
  GRAMMAR_WRITING_GR5_PRACTICE_KINDS,
  GRAMMAR_WRITING_PARENT_PROBLEMS,
} from '../../lib/grammarWritingParentProblemArchitecture.js';
import {
  GRAMMAR_WRITING_PRACTICE_BLUEPRINTS,
  GRAMMAR_WRITING_PRACTICE_UTILITIES,
} from '../../lib/grammarWritingPracticeUtilities.js';
import {
  GRAMMAR_WRITING_GR6_PUBLIC_JOURNEYS,
  GRAMMAR_WRITING_GR6_PUBLIC_OWNERS,
  GRAMMAR_WRITING_GR6_SEMANTIC_NODES,
  getGrammarWritingGr6IncomingEdges,
  getGrammarWritingGr6OutgoingEdges,
} from '../../lib/grammarWritingGr6SemanticGraph.js';
import {
  GRAMMAR_WRITING_GR7_CLOSURE_REVISION,
  GRAMMAR_WRITING_GR7_COUNTS,
  GRAMMAR_WRITING_GR7_EXPECTED_REVISIONS,
  GRAMMAR_WRITING_GR7_FREEZE_CRITERIA,
  GRAMMAR_WRITING_GR7_FROZEN_PARENT_PROBLEM_IDS,
  GRAMMAR_WRITING_GR7_FROZEN_PRACTICE_KINDS,
  GRAMMAR_WRITING_GR7_PUBLICATION_POLICY,
  GRAMMAR_WRITING_GR7_STATUS,
  getGrammarWritingGr7ClosureSnapshot,
} from '../../lib/grammarWritingGr7Closure.js';

const root = process.cwd();

describe('Session B GR7 grammar/writing closure and freeze', () => {
  it('freezes GR1-GR7 on the intended revision chain', () => {
    expect(GRAMMAR_WRITING_GR7_CLOSURE_REVISION).toBe('2026-09-10-gr7');
    expect(GRAMMAR_WRITING_GR7_STATUS).toBe('frozen');
    expect(GRAMMAR_WRITING_GR7_EXPECTED_REVISIONS).toEqual({
      gr1: '2026-09-10-gr1',
      gr2: '2026-09-10-gr2',
      gr3: '2026-09-10-gr3',
      gr4: '2026-09-10-gr4',
      gr5: '2026-09-10-gr5',
      gr6: '2026-09-10-gr6',
      gr7: '2026-09-10-gr7',
    });
  });

  it('locks the complete Session B architecture counts', () => {
    expect(GRAMMAR_WRITING_GR7_COUNTS).toMatchObject({
      r17Domains: 9,
      gr1Skills: 14,
      gr2Tenses: 9,
      gr2Comparisons: 5,
      gr2ErrorPatterns: 16,
      gr3WritingStages: 10,
      gr4ParentProblems: 10,
      gr5PracticeUtilities: 9,
      gr5PracticeBlueprints: 27,
      gr6SemanticNodes: 90,
      publicOwners: 17,
      publicJourneys: 17,
    });
    expect(GRAMMAR_WRITING_GR7_COUNTS.gr6SemanticEdges).toBeGreaterThanOrEqual(90);
  });

  it('freezes the exact ten Tier-1 parent problems', () => {
    expect(GRAMMAR_WRITING_GR7_FROZEN_PARENT_PROBLEM_IDS).toEqual([
      'knows-rules-but-does-not-use-them',
      'mixes-tenses',
      'incomplete-sentences',
      'very-short-sentences',
      'repetitive-sentence-beginnings',
      'limited-descriptive-vocabulary',
      'cannot-organise-paragraphs',
      'poor-punctuation',
      'weak-editing',
      'speaking-grammar-does-not-transfer-to-writing',
    ]);
    expect(GRAMMAR_WRITING_PARENT_PROBLEMS.map((item) => item.id)).toEqual(GRAMMAR_WRITING_GR7_FROZEN_PARENT_PROBLEM_IDS);
    for (const problem of GRAMMAR_WRITING_PARENT_PROBLEMS) {
      expect(problem.gr1SkillIds.length, problem.id).toBeGreaterThan(0);
      expect(problem.gr3WritingStageIds.length, problem.id).toBeGreaterThan(0);
      expect(problem.recommendedPracticeKinds.length, problem.id).toBeGreaterThan(0);
      expect(problem.publicAnchorTopicIds.length, problem.id).toBeGreaterThan(0);
    }
  });

  it('freezes the exact reusable practice layer and three-level transfer contract', () => {
    expect(GRAMMAR_WRITING_GR7_FROZEN_PRACTICE_KINDS).toEqual(GRAMMAR_WRITING_GR5_PRACTICE_KINDS);
    expect(GRAMMAR_WRITING_PRACTICE_UTILITIES.map((item) => item.id)).toEqual(GRAMMAR_WRITING_GR7_FROZEN_PRACTICE_KINDS);
    expect(GRAMMAR_WRITING_PRACTICE_BLUEPRINTS).toHaveLength(27);
    for (const utility of GRAMMAR_WRITING_PRACTICE_UTILITIES) {
      expect(utility.blueprints.map((item) => item.level)).toEqual(['guided', 'independent', 'transfer']);
      expect(utility.targetParentProblemIds.length, utility.id).toBeGreaterThan(0);
    }
  });

  it('proves there are no orphan semantic nodes or public owners at closure', () => {
    expect(GRAMMAR_WRITING_GR6_SEMANTIC_NODES).toHaveLength(90);
    for (const node of GRAMMAR_WRITING_GR6_SEMANTIC_NODES) {
      const degree = getGrammarWritingGr6IncomingEdges(node.ref).length + getGrammarWritingGr6OutgoingEdges(node.ref).length;
      expect(degree, node.ref).toBeGreaterThan(0);
    }
    expect(GRAMMAR_WRITING_GR6_PUBLIC_OWNERS).toHaveLength(17);
    expect(GRAMMAR_WRITING_GR6_PUBLIC_JOURNEYS).toHaveLength(17);
    for (const owner of GRAMMAR_WRITING_GR6_PUBLIC_OWNERS) {
      const ref = `public-topic:${String(owner.id)}`;
      expect(getGrammarWritingGr6IncomingEdges(ref).length, `${ref} inbound`).toBeGreaterThan(0);
      expect(getGrammarWritingGr6OutgoingEdges(ref).length, `${ref} outbound`).toBeGreaterThan(0);
    }
  });

  it('retains full GR1-GR3 academic coverage rather than freezing a partial graph', () => {
    expect(GRAMMAR_WRITING_SKILL_TAXONOMY).toHaveLength(14);
    expect(GRAMMAR_WRITING_TENSE_NODES).toHaveLength(9);
    expect(GRAMMAR_WRITING_TENSE_COMPARISONS).toHaveLength(5);
    expect(GRAMMAR_WRITING_TENSE_ERROR_PATTERNS).toHaveLength(16);
    expect(GRAMMAR_WRITING_WRITING_STAGES).toHaveLength(10);
  });

  it('freezes informational expansion without turning internal nodes into SEO pages', () => {
    expect(GRAMMAR_WRITING_GR7_PUBLICATION_POLICY).toMatchObject({
      informationalExpansion: 'frozen',
      thinMicroPages: 'hold',
      duplicateIntentPages: 'hold',
      newCanonicalOwners: 'evidence-required',
      practicePublication: 'separate-execution-decision',
      commercialSeoExpansion: 'separate-project',
    });
    expect(GRAMMAR_WRITING_GR7_PUBLICATION_POLICY.rule).toContain('demonstrated user, curriculum or search-intent gap');

    const source = fs.readFileSync(path.join(root, 'src/lib/grammarWritingGr7Closure.js'), 'utf8');
    for (const forbidden of ['proposedPath:', 'createRoute:', 'publicationApproved:', "ownerPath: '/", 'sitemapPath:']) {
      expect(source).not.toContain(forbidden);
    }
  });

  it('defines all eight closure criteria including technical SEO and CI', () => {
    expect(GRAMMAR_WRITING_GR7_FREEZE_CRITERIA).toHaveLength(8);
    expect(GRAMMAR_WRITING_GR7_FREEZE_CRITERIA.map((item) => item.id)).toEqual([
      'taxonomy-complete',
      'tense-system-complete',
      'writing-progression-complete',
      'tier1-parent-problems-covered',
      'practice-layer-complete',
      'semantic-graph-closed',
      'canonical-ownership-stable',
      'technical-seo-ci-green',
    ]);
    expect(GRAMMAR_WRITING_GR7_FREEZE_CRITERIA.find((item) => item.id === 'technical-seo-ci-green')?.requirement).toContain('production build/prerender');
  });

  it('exposes one immutable closure snapshot for downstream governance', () => {
    const snapshot = getGrammarWritingGr7ClosureSnapshot();
    expect(snapshot.status).toBe('frozen');
    expect(snapshot.counts).toBe(GRAMMAR_WRITING_GR7_COUNTS);
    expect(snapshot.criteria).toBe(GRAMMAR_WRITING_GR7_FREEZE_CRITERIA);
    expect(snapshot.publicOwnerIds).toHaveLength(17);
    expect(new Set(snapshot.publicOwnerIds).size).toBe(17);
    expect(Object.isFrozen(snapshot)).toBe(true);
  });
});
