import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { curriculumBySlug } from '../../content/courses';
import { getR19CanonicalTopicOwnerPath } from '../../lib/grammarWritingSemanticCanonicalOwnership.js';
import { getGrammarWritingSkill } from '../../lib/grammarWritingKnowledgeTaxonomy.js';
import {
  GRAMMAR_WRITING_TENSE_COMPARISONS,
  GRAMMAR_WRITING_TENSE_ERROR_PATTERNS,
  GRAMMAR_WRITING_TENSE_NODES,
  GRAMMAR_WRITING_TENSE_PARENT_SKILL_ID,
  GRAMMAR_WRITING_TENSE_TEACHING_PRINCIPLES,
  getGrammarWritingNextTenses,
  getGrammarWritingTense,
  getGrammarWritingTenseComparisonsForTense,
  getGrammarWritingTenseErrorsForTense,
  getGrammarWritingTensePrerequisites,
} from '../../lib/grammarWritingTenseArchitecture.js';

const root = process.cwd();
const expectedTenseIds = [
  'simple-present',
  'simple-past',
  'simple-future-will',
  'present-continuous',
  'past-continuous',
  'future-forms',
  'present-perfect',
  'past-perfect',
  'tense-consistency-transfer',
];
const expectedComparisonIds = [
  'simple-present-vs-present-continuous',
  'simple-past-vs-past-continuous',
  'future-forms-choice',
  'present-perfect-vs-simple-past',
  'past-perfect-vs-simple-past',
];

const publicLessonTitles = (courseSlug: 'basic-grammar' | 'advanced-grammar') =>
  (curriculumBySlug[courseSlug]?.weeks ?? []).flatMap((stage) => stage.lessons ?? []);

describe('Session B GR2 tense knowledge architecture', () => {
  it('refines the single GR1 Tenses node into nine stable internal tense/control nodes', () => {
    expect(GRAMMAR_WRITING_TENSE_PARENT_SKILL_ID).toBe('tenses');
    expect(getGrammarWritingSkill(GRAMMAR_WRITING_TENSE_PARENT_SKILL_ID)?.label).toBe('Tenses');
    expect(GRAMMAR_WRITING_TENSE_NODES.map((item) => item.id)).toEqual(expectedTenseIds);
    expect(GRAMMAR_WRITING_TENSE_NODES.map((item) => item.order)).toEqual([1,2,3,4,5,6,7,8,9]);
    expect(getGrammarWritingTense('simple-present')?.prerequisiteTenseIds).toEqual([]);
    expect(getGrammarWritingTense('tense-consistency-transfer')?.nextTenseIds).toEqual([]);
  });

  it('keeps meaning ahead of clue-word matching and preserves the future-time boundary', () => {
    const principles = Object.fromEntries(GRAMMAR_WRITING_TENSE_TEACHING_PRINCIPLES.map((item) => [item.id, item.statement]));
    expect(principles['clues-not-rules']).toContain('not mechanical rules');
    expect(principles['future-time-system']).toContain('more than one construction');
    expect(principles['connected-language-check']).toContain('connected speaking and writing');
    expect(getGrammarWritingTense('simple-present')?.teachingBoundary).toContain('Do not define simple present as “happening now.”');
    expect(getGrammarWritingTense('future-forms')?.teachingBoundary).toContain('not one conjugated tense');
  });

  it('defines reciprocal prerequisite and next-skill relationships throughout the tense graph', () => {
    for (const tense of GRAMMAR_WRITING_TENSE_NODES) {
      for (const prerequisite of getGrammarWritingTensePrerequisites(tense.id)) {
        expect(prerequisite.nextTenseIds, `${prerequisite.id} should point forward to ${tense.id}`).toContain(tense.id);
      }
      for (const next of getGrammarWritingNextTenses(tense.id)) {
        expect(next.prerequisiteTenseIds, `${next.id} should point back to ${tense.id}`).toContain(tense.id);
      }
      expect(tense.childFriendlyMeaning.length).toBeGreaterThan(80);
      expect(tense.writingApplications.length).toBeGreaterThan(0);
      expect(tense.curriculumAnchors.length).toBeGreaterThan(0);
    }
  });

  it('freezes the five high-value tense comparisons instead of creating near-identical tense pages', () => {
    expect(GRAMMAR_WRITING_TENSE_COMPARISONS.map((item) => item.id)).toEqual(expectedComparisonIds);
    expect(getGrammarWritingTenseComparisonsForTense('simple-present').map((item) => item.id)).toContain('simple-present-vs-present-continuous');
    expect(getGrammarWritingTenseComparisonsForTense('simple-past').map((item) => item.id)).toEqual(expect.arrayContaining([
      'simple-past-vs-past-continuous',
      'present-perfect-vs-simple-past',
      'past-perfect-vs-simple-past',
    ]));
    expect(getGrammarWritingTenseComparisonLabels()).toEqual([
      'Simple Present vs Present Continuous',
      'Simple Past vs Past Continuous',
      'Choosing Future Forms',
      'Present Perfect vs Simple Past',
      'Past Perfect & Event Sequence',
    ]);
  });

  it('models common child errors as diagnosis plus teaching response, including transfer failures', () => {
    expect(GRAMMAR_WRITING_TENSE_ERROR_PATTERNS).toHaveLength(16);
    expect(new Set(GRAMMAR_WRITING_TENSE_ERROR_PATTERNS.map((item) => item.category))).toEqual(new Set([
      'form', 'meaning', 'morphology', 'consistency', 'strategy', 'transfer',
    ]));
    for (const error of GRAMMAR_WRITING_TENSE_ERROR_PATTERNS) {
      expect(error.incorrectExample.length).toBeGreaterThan(8);
      expect(error.correction.length).toBeGreaterThan(8);
      expect(error.diagnosis.length).toBeGreaterThan(40);
      expect(error.teachingResponse.length).toBeGreaterThan(40);
    }
    expect(getGrammarWritingTenseErrorsForTense('tense-consistency-transfer').map((item) => item.id)).toEqual([
      'tense-drift-connected-language',
      'clue-word-matching-without-meaning',
      'controlled-practice-transfer-gap',
    ]);
  });

  it('matches every declared GR2 curriculum anchor to the live Beginner or Advanced Grammar curriculum', () => {
    const courseLessons = {
      'basic-grammar': publicLessonTitles('basic-grammar'),
      'advanced-grammar': publicLessonTitles('advanced-grammar'),
    };
    for (const tense of GRAMMAR_WRITING_TENSE_NODES) {
      for (const anchor of tense.curriculumAnchors) {
        expect(courseLessons[anchor.courseSlug]).toContain(`Lesson ${anchor.lessonNumber} — ${anchor.lessonTitle}`);
      }
    }
    for (const comparison of GRAMMAR_WRITING_TENSE_COMPARISONS) {
      for (const anchor of comparison.curriculumAnchors) {
        expect(courseLessons[anchor.courseSlug]).toContain(`Lesson ${anchor.lessonNumber} — ${anchor.lessonTitle}`);
      }
    }
  });

  it('preserves one established public tense owner and keeps GR2 itself non-publishing', () => {
    expect(getR19CanonicalTopicOwnerPath('grammar-tenses-guide')).toBe('/blog/grammar-tenses');
    const forbiddenFields = ['path', 'ownerPath', 'proposedPath', 'canonicalTopicId', 'queryIntent', 'publicationApproved'];
    for (const record of [
      ...GRAMMAR_WRITING_TENSE_NODES,
      ...GRAMMAR_WRITING_TENSE_COMPARISONS,
      ...GRAMMAR_WRITING_TENSE_ERROR_PATTERNS,
    ]) {
      for (const field of forbiddenFields) expect(Object.prototype.hasOwnProperty.call(record, field)).toBe(false);
    }
    const source = fs.readFileSync(path.join(root, 'src/lib/grammarWritingTenseArchitecture.js'), 'utf8');
    expect(source).not.toContain("proposedPath:");
    expect(source).not.toContain("ownerPath:");
    expect(source).not.toContain("'/blog/");
  });

  it('gives the perfect and future systems the semantic distinctions required by the Advanced Grammar curriculum', () => {
    expect(getGrammarWritingTense('present-perfect')?.teachingBoundary).toContain('finished past time');
    expect(getGrammarWritingTense('past-perfect')?.childFriendlyMeaning).toContain('earlier than another past reference point');
    expect(getGrammarWritingTense('future-forms')?.formPatterns).toEqual(expect.arrayContaining([
      'will + base verb',
      'am/is/are going to + base verb',
      'present continuous for a planned arrangement',
      'simple present for a fixed timetable or schedule',
    ]));
    expect(getGrammarWritingTense('tense-consistency-transfer')?.teachingBoundary).toContain('purposeful tense shift');
  });
});

function getGrammarWritingTenseComparisonLabels() {
  return GRAMMAR_WRITING_TENSE_COMPARISONS.map((item) => item.label);
}
