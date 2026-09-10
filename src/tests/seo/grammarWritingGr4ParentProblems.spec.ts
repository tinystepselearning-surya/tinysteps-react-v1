import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { GRAMMAR_WRITING_SKILL_TAXONOMY } from '../../lib/grammarWritingKnowledgeTaxonomy.js';
import { GRAMMAR_WRITING_TENSE_NODES } from '../../lib/grammarWritingTenseArchitecture.js';
import { GRAMMAR_WRITING_WRITING_STAGES } from '../../lib/grammarWritingWritingProgression.js';
import { getR19CanonicalTopicOwner } from '../../lib/grammarWritingSemanticCanonicalOwnership.js';
import {
  GRAMMAR_WRITING_GR5_PRACTICE_KINDS,
  GRAMMAR_WRITING_PARENT_PROBLEM_PRINCIPLES,
  GRAMMAR_WRITING_PARENT_PROBLEMS,
  getGrammarWritingParentProblem,
  getGrammarWritingParentProblemsByCoverageMode,
  getGrammarWritingParentProblemsForPracticeKind,
  getGrammarWritingParentProblemsForSkill,
  getGrammarWritingParentProblemsForTense,
  getGrammarWritingParentProblemsForWritingStage,
} from '../../lib/grammarWritingParentProblemArchitecture.js';

const root = process.cwd();
const expectedProblemIds = [
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
];

const expectedPracticeKinds = [
  'tense-comparison',
  'sentence-builder',
  'sentence-expansion',
  'error-correction',
  'punctuation-challenge',
  'editing-practice',
  'paragraph-organiser',
  'conjunction-practice',
  'tense-choice',
];

describe('Session B GR4 grammar/writing parent problem architecture', () => {
  it('freezes the 10 agreed Tier-1 parent problems in stable order', () => {
    expect(GRAMMAR_WRITING_PARENT_PROBLEMS.map((item) => item.id)).toEqual(expectedProblemIds);
    expect(GRAMMAR_WRITING_PARENT_PROBLEMS.map((item) => item.order)).toEqual([1,2,3,4,5,6,7,8,9,10]);
    expect(new Set(GRAMMAR_WRITING_PARENT_PROBLEMS.map((item) => item.problemClass)).size).toBe(10);
  });

  it('uses diagnosis and fresh transfer rather than treating parent wording as a grammar label', () => {
    const principles = Object.fromEntries(GRAMMAR_WRITING_PARENT_PROBLEM_PRINCIPLES.map((item) => [item.id, item.statement]));
    expect(principles['observe-before-label']).toContain('actually observe');
    expect(principles['find-first-break']).toContain('first point');
    expect(principles['separate-knowledge-from-transfer']).toContain('transfer problem');
    expect(principles['separate-length-from-quality']).toContain('Short writing is not automatically weak');
    expect(principles['fresh-task-confirms-progress']).toContain('fresh topic or passage');
    for (const problem of GRAMMAR_WRITING_PARENT_PROBLEMS) {
      expect(problem.observableSignals.length).toBeGreaterThanOrEqual(3);
      expect(problem.diagnosticQuestions.length).toBeGreaterThanOrEqual(4);
      expect(problem.likelyBreakdowns.length).toBeGreaterThanOrEqual(3);
      expect(problem.interventionSequence.length).toBeGreaterThanOrEqual(4);
      expect(problem.progressSignals.length).toBeGreaterThanOrEqual(3);
      expect(problem.firstTeachingMove.length).toBeGreaterThan(100);
    }
  });

  it('distinguishes incomplete sentences from underdeveloped sentences', () => {
    const incomplete = getGrammarWritingParentProblem('incomplete-sentences');
    const short = getGrammarWritingParentProblem('very-short-sentences');
    expect(incomplete?.problemClass).toBe('sentence-formation');
    expect(incomplete?.parentObservation).toContain('fragments');
    expect(incomplete?.gr3WritingStageIds).toEqual(['word-choice-idea-units', 'complete-sentence']);
    expect(short?.problemClass).toBe('sentence-development');
    expect(short?.parentObservation).toContain('complete sentences');
    expect(short?.gr3WritingStageIds).toEqual(['complete-sentence', 'expanded-sentence', 'connected-sentences']);
    expect(short?.firstTeachingMove).toContain('one meaningful expansion dimension');
  });

  it('distinguishes general grammar transfer from the specific oral-to-written bridge', () => {
    const ruleTransfer = getGrammarWritingParentProblem('knows-rules-but-does-not-use-them');
    const oralWriting = getGrammarWritingParentProblem('speaking-grammar-does-not-transfer-to-writing');
    expect(ruleTransfer?.problemClass).toBe('grammar-transfer');
    expect(ruleTransfer?.diagnosticQuestions.join(' ')).toContain('cued fresh sentence');
    expect(oralWriting?.problemClass).toBe('oral-written-transfer');
    expect(oralWriting?.firstTeachingMove).toContain('SAY → HOLD → WRITE → READ BACK → COMPARE');
    expect(oralWriting?.diagnosticQuestions.join(' ')).toContain('spoken and written versions');
  });

  it('connects every GR1 skill, every GR2 tense/control node and every GR3 writing stage to a parent problem', () => {
    for (const skill of GRAMMAR_WRITING_SKILL_TAXONOMY) {
      expect(getGrammarWritingParentProblemsForSkill(skill.id).length, `GR1 ${skill.id}`).toBeGreaterThan(0);
    }
    for (const tense of GRAMMAR_WRITING_TENSE_NODES) {
      expect(getGrammarWritingParentProblemsForTense(tense.id).length, `GR2 ${tense.id}`).toBeGreaterThan(0);
    }
    for (const stage of GRAMMAR_WRITING_WRITING_STAGES) {
      expect(getGrammarWritingParentProblemsForWritingStage(stage.id).length, `GR3 ${stage.id}`).toBeGreaterThan(0);
    }
  });

  it('freezes the exact GR5 practice handoff and gives every planned utility a real parent use case', () => {
    expect(GRAMMAR_WRITING_GR5_PRACTICE_KINDS).toEqual(expectedPracticeKinds);
    for (const kind of expectedPracticeKinds) {
      expect(getGrammarWritingParentProblemsForPracticeKind(kind).length, kind).toBeGreaterThan(0);
    }
    expect(getGrammarWritingParentProblemsForPracticeKind('paragraph-organiser').map((item) => item.id)).toContain('cannot-organise-paragraphs');
    expect(getGrammarWritingParentProblemsForPracticeKind('tense-comparison').map((item) => item.id)).toContain('mixes-tenses');
    expect(getGrammarWritingParentProblemsForPracticeKind('punctuation-challenge').map((item) => item.id)).toContain('poor-punctuation');
  });

  it('reuses existing canonical owners and records direct vs supported coverage without publishing new pages', () => {
    const direct = getGrammarWritingParentProblemsByCoverageMode('direct-existing-owner');
    const supported = getGrammarWritingParentProblemsByCoverageMode('supported-by-existing-owners');
    expect(direct.map((item) => item.id)).toEqual([
      'knows-rules-but-does-not-use-them',
      'incomplete-sentences',
      'speaking-grammar-does-not-transfer-to-writing',
    ]);
    expect(supported).toHaveLength(7);
    for (const problem of GRAMMAR_WRITING_PARENT_PROBLEMS) {
      const primary = getR19CanonicalTopicOwner(problem.primaryPublicTopicId);
      expect(primary, problem.primaryPublicTopicId).toBeTruthy();
      expect(problem.publicAnchorTopicIds).toContain(problem.primaryPublicTopicId);
      expect(problem.coverageRationale.length).toBeGreaterThan(100);
      for (const topicId of problem.publicAnchorTopicIds) expect(getR19CanonicalTopicOwner(topicId), topicId).toBeTruthy();
    }
    for (const problem of direct) {
      expect(getR19CanonicalTopicOwner(problem.primaryPublicTopicId)?.ownerRole).toBe('diagnostic-owner');
    }
    const source = fs.readFileSync(path.join(root, 'src/lib/grammarWritingParentProblemArchitecture.js'), 'utf8');
    expect(source).not.toContain('proposedPath:');
    expect(source).not.toContain('ownerPath:');
    expect(source).not.toContain("'/blog/");
  });

  it('routes tense mixing and editing problems to the established skill/transfer owners instead of thin diagnostic clones', () => {
    const tenses = getGrammarWritingParentProblem('mixes-tenses');
    expect(tenses?.primaryPublicTopicId).toBe('grammar-tenses-guide');
    expect(tenses?.publicAnchorTopicIds).toEqual(['grammar-tenses-guide', 'grammar-transfer-mistakes', 'grammar-editing-guide']);
    expect(tenses?.gr2TenseIds).toEqual(GRAMMAR_WRITING_TENSE_NODES.map((item) => item.id));
    expect(tenses?.coverageRationale).toContain('separate near-duplicate');

    const editing = getGrammarWritingParentProblem('weak-editing');
    expect(editing?.primaryPublicTopicId).toBe('grammar-editing-guide');
    expect(editing?.firstTeachingMove).toContain('FIND → EXPLAIN → FIX → REREAD → TRANSFER');
  });
});