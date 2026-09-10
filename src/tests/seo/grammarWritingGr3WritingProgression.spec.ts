import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { curriculumBySlug } from '../../content/courses';
import { GRAMMAR_WRITING_SKILL_TAXONOMY } from '../../lib/grammarWritingKnowledgeTaxonomy.js';
import { GRAMMAR_WRITING_TENSE_NODES } from '../../lib/grammarWritingTenseArchitecture.js';
import { getR19CanonicalTopicOwner, getR19CanonicalTopicOwnerPath } from '../../lib/grammarWritingSemanticCanonicalOwnership.js';
import {
  GRAMMAR_WRITING_WRITING_CURRICULUM_ANCHORS,
  GRAMMAR_WRITING_WRITING_PRINCIPLES,
  GRAMMAR_WRITING_WRITING_ROOT_ID,
  GRAMMAR_WRITING_WRITING_STAGES,
  GRAMMAR_WRITING_WRITING_TERMINAL_ID,
  getGrammarWritingNextWritingStages,
  getGrammarWritingWritingPrerequisites,
  getGrammarWritingWritingStage,
  getGrammarWritingWritingStagesForPublicTopic,
  getGrammarWritingWritingStagesForSkill,
  getGrammarWritingWritingStagesForTense,
} from '../../lib/grammarWritingWritingProgression.js';

const root = process.cwd();
const expectedStageIds = [
  'word-choice-idea-units',
  'complete-sentence',
  'expanded-sentence',
  'connected-sentences',
  'focused-paragraph',
  'cohesive-paragraph',
  'descriptive-writing',
  'narrative-writing',
  'explanation-opinion-writing',
  'editing-revision-transfer',
];

const publicLessonTitles = (courseSlug: 'basic-grammar' | 'advanced-grammar') =>
  (curriculumBySlug[courseSlug]?.weeks ?? []).flatMap((stage) => stage.lessons ?? []);

describe('Session B GR3 writing progression architecture', () => {
  it('freezes the planned word-to-editing progression as ten stable writing stages', () => {
    expect(GRAMMAR_WRITING_WRITING_ROOT_ID).toBe('word-choice-idea-units');
    expect(GRAMMAR_WRITING_WRITING_TERMINAL_ID).toBe('editing-revision-transfer');
    expect(GRAMMAR_WRITING_WRITING_STAGES.map((item) => item.id)).toEqual(expectedStageIds);
    expect(GRAMMAR_WRITING_WRITING_STAGES.map((item) => item.order)).toEqual([1,2,3,4,5,6,7,8,9,10]);
    expect(getGrammarWritingWritingStage('word-choice-idea-units')?.prerequisiteStageIds).toEqual([]);
    expect(getGrammarWritingWritingStage('editing-revision-transfer')?.nextStageIds).toEqual([]);
  });

  it('keeps sentence and paragraph development sequential but treats genres as parallel applications', () => {
    expect(getGrammarWritingNextWritingStages('word-choice-idea-units').map((item) => item.id)).toEqual(['complete-sentence']);
    expect(getGrammarWritingNextWritingStages('complete-sentence').map((item) => item.id)).toEqual(['expanded-sentence']);
    expect(getGrammarWritingNextWritingStages('expanded-sentence').map((item) => item.id)).toEqual(['connected-sentences']);
    expect(getGrammarWritingNextWritingStages('connected-sentences').map((item) => item.id)).toEqual(['focused-paragraph']);
    expect(getGrammarWritingNextWritingStages('focused-paragraph').map((item) => item.id)).toEqual(['cohesive-paragraph']);
    expect(getGrammarWritingNextWritingStages('cohesive-paragraph').map((item) => item.id)).toEqual([
      'descriptive-writing',
      'narrative-writing',
      'explanation-opinion-writing',
    ]);
    expect(getGrammarWritingWritingStage('editing-revision-transfer')?.prerequisiteMode).toBe('any');
    expect(getGrammarWritingWritingPrerequisites('editing-revision-transfer').map((item) => item.id)).toEqual([
      'descriptive-writing',
      'narrative-writing',
      'explanation-opinion-writing',
    ]);
  });

  it('keeps every prerequisite and next-stage edge reciprocal', () => {
    for (const stage of GRAMMAR_WRITING_WRITING_STAGES) {
      for (const prerequisite of getGrammarWritingWritingPrerequisites(stage.id)) {
        expect(prerequisite.nextStageIds, `${prerequisite.id} should point forward to ${stage.id}`).toContain(stage.id);
      }
      for (const next of getGrammarWritingNextWritingStages(stage.id)) {
        expect(next.prerequisiteStageIds, `${next.id} should point back to ${stage.id}`).toContain(stage.id);
      }
      expect(stage.masterySignals).toHaveLength(3);
      expect(stage.commonBreakdowns).toHaveLength(3);
      expect(stage.teachingMoves).toHaveLength(3);
      expect(stage.transferCheck.length).toBeGreaterThan(120);
    }
  });

  it('connects every GR1 grammar/writing skill to at least one writing application stage', () => {
    for (const skill of GRAMMAR_WRITING_SKILL_TAXONOMY) {
      const stages = getGrammarWritingWritingStagesForSkill(skill.id);
      expect(stages.length, `GR1 skill ${skill.id} should have a writing application`).toBeGreaterThan(0);
    }
    expect(getGrammarWritingWritingStagesForSkill('paragraph-writing').map((item) => item.id)).toEqual(expect.arrayContaining([
      'focused-paragraph',
      'cohesive-paragraph',
      'descriptive-writing',
      'narrative-writing',
      'explanation-opinion-writing',
      'editing-revision-transfer',
    ]));
  });

  it('connects every GR2 tense/control node to authentic writing use instead of isolated tense drills', () => {
    for (const tense of GRAMMAR_WRITING_TENSE_NODES) {
      const stages = getGrammarWritingWritingStagesForTense(tense.id);
      expect(stages.length, `GR2 tense ${tense.id} should have a writing application`).toBeGreaterThan(0);
    }
    expect(getGrammarWritingWritingStagesForTense('past-perfect').map((item) => item.id)).toEqual(['narrative-writing']);
    expect(getGrammarWritingWritingStagesForTense('future-forms').map((item) => item.id)).toEqual(['explanation-opinion-writing']);
    expect(getGrammarWritingWritingStagesForTense('tense-consistency-transfer').map((item) => item.id)).toEqual(expect.arrayContaining([
      'focused-paragraph',
      'cohesive-paragraph',
      'narrative-writing',
      'explanation-opinion-writing',
      'editing-revision-transfer',
    ]));
  });

  it('matches every declared GR3 anchor to the live Beginner or Advanced Grammar curriculum', () => {
    const courseLessons = {
      'basic-grammar': publicLessonTitles('basic-grammar'),
      'advanced-grammar': publicLessonTitles('advanced-grammar'),
    };
    expect(GRAMMAR_WRITING_WRITING_CURRICULUM_ANCHORS.length).toBeGreaterThan(15);
    for (const anchor of GRAMMAR_WRITING_WRITING_CURRICULUM_ANCHORS) {
      expect(courseLessons[anchor.courseSlug]).toContain(`Lesson ${anchor.lessonNumber} — ${anchor.lessonTitle}`);
    }
  });

  it('anchors stages to existing canonical owners without creating new public routes or intent owners', () => {
    for (const stage of GRAMMAR_WRITING_WRITING_STAGES) {
      for (const topicId of stage.publicAnchorTopicIds) expect(getR19CanonicalTopicOwner(topicId), topicId).not.toBeNull();
    }
    expect(getR19CanonicalTopicOwnerPath('paragraph-writing-guide')).toBe('/blog/how-to-teach-paragraph-writing-to-kids');
    expect(getR19CanonicalTopicOwnerPath('creative-writing-guide')).toBe('/blog/grammar-creative-writing');
    expect(getR19CanonicalTopicOwnerPath('grammar-editing-guide')).toBe('/blog/grammar-editing-camp');
    expect(getGrammarWritingWritingStagesForPublicTopic('paragraph-writing-guide').map((item) => item.id)).toEqual(expect.arrayContaining([
      'focused-paragraph',
      'cohesive-paragraph',
      'descriptive-writing',
      'narrative-writing',
      'explanation-opinion-writing',
    ]));

    const forbiddenFields = ['path', 'ownerPath', 'proposedPath', 'canonicalTopicId', 'queryIntent', 'publicationApproved'];
    for (const stage of GRAMMAR_WRITING_WRITING_STAGES) {
      for (const field of forbiddenFields) expect(Object.prototype.hasOwnProperty.call(stage, field)).toBe(false);
    }
    const source = fs.readFileSync(path.join(root, 'src/lib/grammarWritingWritingProgression.js'), 'utf8');
    expect(source).not.toContain('proposedPath:');
    expect(source).not.toContain('ownerPath:');
    expect(source).not.toContain("'/blog/");
  });

  it('protects the key writing-teaching boundaries already established by Tiny Steps content', () => {
    const principles = Object.fromEntries(GRAMMAR_WRITING_WRITING_PRINCIPLES.map((item) => [item.id, item.statement]));
    expect(principles['meaning-before-length']).toContain('not automatically better writing');
    expect(principles['paragraph-function-not-count']).toContain('not as a compulsory fixed number of sentences');
    expect(principles['genres-branch-after-cohesion']).toContain('one genre is not a mandatory prerequisite for another');
    expect(principles['revise-before-surface-polish']).toContain('Revision first checks meaning');
    expect(principles['fresh-transfer-is-mastery']).toContain('fresh topic');
  });

  it('preserves distinct mastery goals for sentence, paragraph, genre and transfer stages', () => {
    expect(getGrammarWritingWritingStage('complete-sentence')?.purpose).toContain('one complete sentence');
    expect(getGrammarWritingWritingStage('expanded-sentence')?.purpose).toContain('preserving the original sentence core');
    expect(getGrammarWritingWritingStage('focused-paragraph')?.purpose).toContain('selecting a main focus');
    expect(getGrammarWritingWritingStage('cohesive-paragraph')?.purpose).toContain('reader can follow relationships across sentences');
    expect(getGrammarWritingWritingStage('narrative-writing')?.purpose).toContain('sequence of events');
    expect(getGrammarWritingWritingStage('explanation-opinion-writing')?.purpose).toContain('reasons, examples or evidence');
    expect(getGrammarWritingWritingStage('editing-revision-transfer')?.purpose).toContain('improve meaning, relevance, order and clarity first');
  });
});
