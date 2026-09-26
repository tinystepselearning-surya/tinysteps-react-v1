import { describe, expect, it } from 'vitest';

import { curriculumBySlug } from '../../content/courses';
import {
  GRAMMAR_COURSES,
  GRAMMAR_CURRICULUM_REVISION,
  GRAMMAR_CURRICULUM_SCHEMA_VERSION,
  GRAMMAR_CURRICULUM_TOPICS,
  buildTeacherGrammarTopics,
  getGrammarCourse,
  normalizeGrammarCourseId,
  planGrammarCurriculumProjection,
} from '../../content/grammarCurriculum';

describe('canonical Grammar curriculum', () => {
  it('defines complete, sequential, stable Basic and Advanced courses', () => {
    const basic = GRAMMAR_COURSES['basic-grammar'];
    const advanced = GRAMMAR_COURSES['advanced-grammar'];
    expect(basic.lessons).toHaveLength(36);
    expect(advanced.lessons).toHaveLength(36);
    expect(advanced.stages).toHaveLength(6);
    expect(advanced.stages.map((stage) => stage.end - stage.start + 1)).toEqual([6, 6, 6, 6, 6, 6]);

    const ids = GRAMMAR_CURRICULUM_TOPICS.map((lesson) => lesson.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const course of Object.values(GRAMMAR_COURSES)) {
      expect(course.lessons.map((lesson) => lesson.order)).toEqual(
        Array.from({ length: course.lessons.length }, (_, index) => index + 1),
      );
      course.lessons.forEach((lesson) => {
        expect(course.stages.filter((stage) => lesson.order >= stage.start && lesson.order <= stage.end)).toHaveLength(1);
      });
    }
    expect(advanced.lessons[0].id).toBe('advanced-grammar__lesson-01');
    expect(advanced.lessons[35].id).toBe('advanced-grammar__lesson-36');
  });

  it('drives website lessons and approved representative Advanced Grammar copy', () => {
    const canonical = GRAMMAR_COURSES['advanced-grammar'];
    const website = curriculumBySlug['grammar-mastery'].weeks ?? [];
    expect(website.flatMap((stage) => stage.lessons ?? [])).toEqual(
      canonical.lessons.map((lesson) => lesson.displayTitle),
    );
    expect(website.map((stage) => stage.title)).toEqual(canonical.stages.map((stage) => stage.label));

    const representatives = new Map(canonical.lessons.map((lesson) => [lesson.order, lesson.displayTitle]));
    expect(representatives.get(1)).toBe('Lesson 1 — Subject, Verb & Object');
    expect(representatives.get(7)).toBe('Lesson 7 — Present Time: Simple Present vs Present Continuous');
    expect(representatives.get(10)).toBe('Lesson 10 — Present Perfect & Simple Past');
    expect(representatives.get(19)).toBe('Lesson 19 — Compound Sentences');
    expect(representatives.get(31)).toBe('Lesson 31 — Building a Powerful Paragraph');
    expect(representatives.get(36)).toBe('Lesson 36 — Final Grammar, Speaking & Writing Mastery Showcase');

    expect(curriculumBySlug['advanced-grammar'].weeks).toEqual(website);
    expect(curriculumBySlug['basic-grammar'].weeks).toEqual(curriculumBySlug['grammar-essentials'].weeks);
    expect(curriculumBySlug.grammar.weeks).toEqual(curriculumBySlug['basic-grammar'].weeks);
  });

  it('provides the exact canonical teacher topic identity, order, labels and stages', () => {
    for (const courseId of ['basic-grammar', 'advanced-grammar'] as const) {
      const canonical = GRAMMAR_COURSES[courseId].lessons;
      const teacherTopics = buildTeacherGrammarTopics(courseId);
      expect(teacherTopics.map(({ id, label, order, stageLabel }) => ({ id, label, order, stageLabel }))).toEqual(
        canonical.map(({ id, label, order, stageLabel }) => ({ id, label, order, stageLabel })),
      );
    }
  });

  it('preserves Basic Grammar public stage learning outcomes in the canonical source', () => {
    const basic = GRAMMAR_COURSES['basic-grammar'];
    expect(basic.stages[0].learningOutcomes).toEqual([
      'Identify nouns, proper nouns, verbs, adjectives, and pronouns',
      'Understand that different words do different jobs',
      'Build a strong foundation in basic word types',
    ]);
    expect(basic.stages[5].learningOutcomes).toContain('Revise the full beginner grammar syllabus');

    const website = curriculumBySlug['grammar-essentials'].weeks ?? [];
    expect(website[0]?.learns).toEqual(basic.stages[0].learningOutcomes);
    expect(website[5]?.learns).toEqual(basic.stages[5].learningOutcomes);
  });

  it('preserves topic-specific teacher metadata for representative Grammar lessons', () => {
    const basic = buildTeacherGrammarTopics('basic-grammar');
    const advanced = buildTeacherGrammarTopics('advanced-grammar');
    const topic = (topics: ReturnType<typeof buildTeacherGrammarTopics>, order: number) =>
      topics.find((candidate) => candidate.order === order);

    expect(topic(basic, 4)?.subskillChips).toContain('identify adjectives');
    expect(topic(basic, 7)?.subskillChips).toContain('make plural');
    expect(topic(basic, 13)?.subskillChips).toContain('capitalize first word');
    expect(topic(basic, 15)?.subskillChips).toContain('use exclamation mark');
    expect(topic(advanced, 12)?.subskillChips).toContain('identify tense');
    expect(topic(advanced, 28)?.subskillChips).toContain('spot run-on/fragment');
  });

  it('normalizes public, internal, and legacy aliases to canonical IDs', () => {
    expect(normalizeGrammarCourseId('grammar-mastery')).toBe('advanced-grammar');
    expect(normalizeGrammarCourseId('advanced-grammar')).toBe('advanced-grammar');
    expect(normalizeGrammarCourseId('grammar-essentials')).toBe('basic-grammar');
    expect(normalizeGrammarCourseId('basic-grammar')).toBe('basic-grammar');
    expect(normalizeGrammarCourseId('intermediate-grammar')).toBe('basic-grammar');
    expect(getGrammarCourse('grammar')?.id).toBe('basic-grammar');
  });
});

describe('Grammar Firestore projection plan', () => {
  const phonicsTopic = { id: 'phonics-foundations__lesson-01', courseId: 'phonics-foundations', area: 'phonics' };
  const speakingTopic = { id: 'basic-public-speaking__lesson-01', courseId: 'basic-public-speaking', area: 'speaking' };
  const unrelatedGrammarMetadata = { id: 'grammar-placement-band', area: 'grammar', kind: 'diagnostic' };

  it('preserves non-Grammar topics and unrelated metadata while replacing stale Grammar', () => {
    const existing = {
      topics: [
        phonicsTopic,
        { id: 'advanced-grammar__lesson-01', courseId: 'advanced-grammar', area: 'grammar', label: 'Old label' },
        { id: 'legacy-grammar-topic', courseId: 'advanced-grammar', area: 'grammar' },
        speakingTopic,
        unrelatedGrammarMetadata,
      ],
      unrelated: { keep: true },
    };
    const plan = planGrammarCurriculumProjection(existing);
    expect(plan.hasChanges).toBe(true);
    expect(plan.topics).toContainEqual(phonicsTopic);
    expect(plan.topics).toContainEqual(speakingTopic);
    expect(plan.topics).toContainEqual(unrelatedGrammarMetadata);
    expect(plan.staleIds).toEqual(['legacy-grammar-topic']);
    expect(plan.changedIds).toContain('advanced-grammar__lesson-01');
    expect(plan.changedTopics).toContainEqual(expect.objectContaining({
      id: 'advanced-grammar__lesson-01',
      previousLabel: 'Old label',
      nextLabel: 'Lesson 1 — Subject, Verb & Object',
    }));
    expect(plan.basicCount).toBe(36);
    expect(plan.advancedCount).toBe(36);
    expect(existing.unrelated).toEqual({ keep: true });
  });

  it('is idempotent and plans no write when content and revision match', () => {
    const projected = {
      topics: [phonicsTopic, speakingTopic, ...GRAMMAR_CURRICULUM_TOPICS],
      grammarCurriculumRevision: GRAMMAR_CURRICULUM_REVISION,
      grammarCurriculumSchemaVersion: GRAMMAR_CURRICULUM_SCHEMA_VERSION,
      unrelated: 'preserved',
    };
    const first = planGrammarCurriculumProjection(projected);
    expect(first.hasChanges).toBe(false);
    expect(first.addedIds).toEqual([]);
    expect(first.changedIds).toEqual([]);
    expect(first.staleIds).toEqual([]);
    expect(planGrammarCurriculumProjection({ ...projected, topics: first.topics }).hasChanges).toBe(false);
  });

  it('ignores non-Grammar topic reordering when the Grammar projection is already canonical', () => {
    const reordered = {
      topics: [speakingTopic, ...GRAMMAR_CURRICULUM_TOPICS, phonicsTopic],
      grammarCurriculumRevision: GRAMMAR_CURRICULUM_REVISION,
      grammarCurriculumSchemaVersion: GRAMMAR_CURRICULUM_SCHEMA_VERSION,
    };
    const plan = planGrammarCurriculumProjection(reordered);
    expect(plan.hasChanges).toBe(false);
    expect(plan.addedIds).toEqual([]);
    expect(plan.changedIds).toEqual([]);
    expect(plan.staleIds).toEqual([]);
    expect(plan.duplicateIds).toEqual([]);
  });

  it('treats legacy intermediate-grammar projection rows as stale Grammar config only', () => {
    const legacy = {
      id: 'intermediate-grammar__lesson-01',
      courseId: 'intermediate-grammar',
      area: 'grammar',
      label: 'Legacy Grammar lesson',
    };
    const plan = planGrammarCurriculumProjection({
      topics: [phonicsTopic, speakingTopic, legacy, ...GRAMMAR_CURRICULUM_TOPICS],
      grammarCurriculumRevision: GRAMMAR_CURRICULUM_REVISION,
      grammarCurriculumSchemaVersion: GRAMMAR_CURRICULUM_SCHEMA_VERSION,
    });
    expect(plan.hasChanges).toBe(true);
    expect(plan.staleIds).toContain('intermediate-grammar__lesson-01');
    expect(plan.topics).not.toContainEqual(legacy);
    expect(plan.topics).toContainEqual(phonicsTopic);
    expect(plan.topics).toContainEqual(speakingTopic);
  });

  it('requires synchronization for revision mismatch without changing canonical IDs', () => {
    const plan = planGrammarCurriculumProjection({
      topics: [...GRAMMAR_CURRICULUM_TOPICS],
      grammarCurriculumRevision: 'old-revision',
      grammarCurriculumSchemaVersion: GRAMMAR_CURRICULUM_SCHEMA_VERSION,
    });
    expect(plan.hasChanges).toBe(true);
    expect(plan.previousRevision).toBe('old-revision');
    expect(plan.topics.filter((topic: any) => topic.area === 'grammar').map((topic: any) => topic.id)).toEqual(
      GRAMMAR_CURRICULUM_TOPICS.map((topic) => topic.id),
    );
  });

  it('surfaces duplicate projected IDs for the admin audit', () => {
    const duplicated = GRAMMAR_CURRICULUM_TOPICS[0];
    const plan = planGrammarCurriculumProjection({
      topics: [duplicated, { ...duplicated }],
      grammarCurriculumRevision: GRAMMAR_CURRICULUM_REVISION,
      grammarCurriculumSchemaVersion: GRAMMAR_CURRICULUM_SCHEMA_VERSION,
    });
    expect(plan.hasChanges).toBe(true);
    expect(plan.duplicateIds).toEqual([duplicated.id]);
  });
});
