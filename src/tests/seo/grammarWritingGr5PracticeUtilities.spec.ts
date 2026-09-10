import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { GRAMMAR_WRITING_SKILL_TAXONOMY } from '../../lib/grammarWritingKnowledgeTaxonomy.js';
import { GRAMMAR_WRITING_TENSE_NODES } from '../../lib/grammarWritingTenseArchitecture.js';
import { GRAMMAR_WRITING_WRITING_STAGES } from '../../lib/grammarWritingWritingProgression.js';
import {
  GRAMMAR_WRITING_GR5_PRACTICE_KINDS,
  GRAMMAR_WRITING_PARENT_PROBLEMS,
} from '../../lib/grammarWritingParentProblemArchitecture.js';
import { getR19CanonicalTopicOwner } from '../../lib/grammarWritingSemanticCanonicalOwnership.js';
import {
  GRAMMAR_WRITING_PRACTICE_BLUEPRINTS,
  GRAMMAR_WRITING_PRACTICE_LEVELS,
  GRAMMAR_WRITING_PRACTICE_PRINCIPLES,
  GRAMMAR_WRITING_PRACTICE_UTILITIES,
  buildGrammarWritingPracticeTask,
  getGrammarWritingPracticeBlueprintsForUtility,
  getGrammarWritingPracticeUtilitiesForParentProblem,
  getGrammarWritingPracticeUtilitiesForSkill,
  getGrammarWritingPracticeUtilitiesForTense,
  getGrammarWritingPracticeUtilitiesForWritingStage,
  getGrammarWritingPracticeUtility,
  renderGrammarWritingPracticePrompt,
} from '../../lib/grammarWritingPracticeUtilities.js';

const root = process.cwd();
const expectedKinds = [
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

describe('Session B GR5 reusable grammar/writing practice utilities', () => {
  it('implements the exact nine practice kinds frozen by GR4', () => {
    expect(GRAMMAR_WRITING_GR5_PRACTICE_KINDS).toEqual(expectedKinds);
    expect(GRAMMAR_WRITING_PRACTICE_UTILITIES.map((item) => item.id)).toEqual(expectedKinds);
    expect(GRAMMAR_WRITING_PRACTICE_UTILITIES.map((item) => item.order)).toEqual([1,2,3,4,5,6,7,8,9]);
  });

  it('gives every utility guided, independent and transfer practice instead of one static exercise', () => {
    expect(GRAMMAR_WRITING_PRACTICE_LEVELS).toEqual(['guided', 'independent', 'transfer']);
    expect(GRAMMAR_WRITING_PRACTICE_BLUEPRINTS).toHaveLength(27);
    expect(new Set(GRAMMAR_WRITING_PRACTICE_BLUEPRINTS.map((item) => item.id)).size).toBe(27);
    for (const utility of GRAMMAR_WRITING_PRACTICE_UTILITIES) {
      expect(getGrammarWritingPracticeBlueprintsForUtility(utility.id).map((item) => item.level)).toEqual(['guided', 'independent', 'transfer']);
      expect(utility.scaffoldSteps.length).toBeGreaterThanOrEqual(3);
      expect(utility.successCriteria.length).toBeGreaterThanOrEqual(3);
      expect(utility.feedbackRules.length).toBeGreaterThanOrEqual(3);
      for (const blueprint of utility.blueprints) {
        expect(blueprint.requiredDataFields.length).toBeGreaterThan(0);
        expect(blueprint.variationAxes.length).toBeGreaterThanOrEqual(3);
        expect(blueprint.evaluationRule.length).toBeGreaterThan(30);
      }
    }
  });

  it('keeps the GR4 parent-problem handoff reciprocal and gives every problem usable practice', () => {
    for (const problem of GRAMMAR_WRITING_PARENT_PROBLEMS) {
      const utilities = getGrammarWritingPracticeUtilitiesForParentProblem(problem.id);
      expect(utilities.length, problem.id).toBeGreaterThan(0);
      expect(utilities.map((item) => item.id)).toEqual(problem.recommendedPracticeKinds);
      for (const kind of problem.recommendedPracticeKinds) {
        expect(getGrammarWritingPracticeUtility(kind)?.targetParentProblemIds).toContain(problem.id);
      }
    }
  });

  it('closes practice coverage across GR1 skills, GR2 tense/control nodes and GR3 writing stages', () => {
    for (const skill of GRAMMAR_WRITING_SKILL_TAXONOMY) {
      expect(getGrammarWritingPracticeUtilitiesForSkill(skill.id).length, `GR1 ${skill.id}`).toBeGreaterThan(0);
    }
    for (const tense of GRAMMAR_WRITING_TENSE_NODES) {
      expect(getGrammarWritingPracticeUtilitiesForTense(tense.id).length, `GR2 ${tense.id}`).toBeGreaterThan(0);
    }
    for (const stage of GRAMMAR_WRITING_WRITING_STAGES) {
      expect(getGrammarWritingPracticeUtilitiesForWritingStage(stage.id).length, `GR3 ${stage.id}`).toBeGreaterThan(0);
    }
  });

  it('uses existing practice owners and does not invent a utility-per-URL publication layer', () => {
    for (const utility of GRAMMAR_WRITING_PRACTICE_UTILITIES) {
      const primary = getR19CanonicalTopicOwner(utility.primaryPublicTopicId);
      expect(primary, utility.primaryPublicTopicId).toBeTruthy();
      expect(primary?.intent).toBe('practice');
      expect(utility.publicAnchorTopicIds).toContain(utility.primaryPublicTopicId);
      for (const topicId of utility.publicAnchorTopicIds) expect(getR19CanonicalTopicOwner(topicId), topicId).toBeTruthy();
    }
    const source = fs.readFileSync(path.join(root, 'src/lib/grammarWritingPracticeUtilities.js'), 'utf8');
    for (const forbidden of ['proposedPath:', 'ownerPath:', 'publicPath:', 'route:', 'publicationApproved:']) expect(source).not.toContain(forbidden);
    expect(source).not.toContain("'/free-");
  });

  it('renders data-driven prompts deterministically and rejects incomplete blueprint data', () => {
    expect(renderGrammarWritingPracticePrompt('sentence-builder-guided', {
      units: 'the dog / runs / quickly',
      meaning: 'A dog is running quickly.',
    })).toContain('the dog / runs / quickly');
    expect(() => renderGrammarWritingPracticePrompt('sentence-builder-guided', { units: 'the dog / runs' })).toThrow(/missing data fields: meaning/);
    expect(() => renderGrammarWritingPracticePrompt('missing-blueprint', {})).toThrow(/Unknown GR5 practice blueprint/);

    const task = buildGrammarWritingPracticeTask('tense-choice', 'transfer', {
      sentenceCount: 3,
      freshTopic: 'a school trip',
      timeFrame: 'past',
    });
    expect(task.practiceKind).toBe('tense-choice');
    expect(task.level).toBe('transfer');
    expect(task.prompt).toContain('3 connected sentences');
    expect(task.prompt).toContain('a school trip');
    expect(task.successCriteria).toHaveLength(3);
  });

  it('protects the pedagogical boundaries identified in GR2-GR4', () => {
    const principles = Object.fromEntries(GRAMMAR_WRITING_PRACTICE_PRINCIPLES.map((item) => [item.id, item.statement]));
    expect(principles['guided-independent-transfer']).toContain('fresh transfer task');
    expect(principles['meaning-before-form-choice']).toContain('intended meaning');
    expect(principles['paragraphs-are-meaning-units']).toContain('five-sentence formula');
    expect(principles['practice-layer-not-publication-layer']).toContain('does not by itself create a new route');

    expect(getGrammarWritingPracticeUtility('sentence-expansion')?.feedbackRules.join(' ')).toContain('adjective accumulation');
    expect(getGrammarWritingPracticeUtility('paragraph-organiser')?.feedbackRules.join(' ')).toContain('five-sentence structure');
    expect(getGrammarWritingPracticeUtility('editing-practice')?.purpose).toContain('meaning and organisation first');
    expect(getGrammarWritingPracticeUtility('tense-choice')?.purpose).toContain('intended meaning');
    expect(getGrammarWritingPracticeUtility('conjunction-practice')?.successCriteria.join(' ')).toContain('two separate sentences');
  });

  it('supports the highest-value GR4 routing cases with the intended utility combinations', () => {
    expect(getGrammarWritingPracticeUtilitiesForParentProblem('mixes-tenses').map((item) => item.id)).toEqual([
      'tense-comparison', 'editing-practice', 'tense-choice',
    ]);
    expect(getGrammarWritingPracticeUtilitiesForParentProblem('cannot-organise-paragraphs').map((item) => item.id)).toEqual([
      'editing-practice', 'paragraph-organiser', 'conjunction-practice',
    ]);
    expect(getGrammarWritingPracticeUtilitiesForParentProblem('poor-punctuation').map((item) => item.id)).toEqual([
      'error-correction', 'punctuation-challenge', 'editing-practice',
    ]);
    expect(getGrammarWritingPracticeUtilitiesForParentProblem('speaking-grammar-does-not-transfer-to-writing').map((item) => item.id)).toContain('sentence-builder');
  });
});
