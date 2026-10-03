import { describe, expect, it } from 'vitest';

import { curriculumBySlug } from '../../content/courses';
import {
  SPEAKING_COMMUNICATION_DIMENSIONS,
  SPEAKING_COURSES,
  SPEAKING_CURRICULUM_REVISION,
  SPEAKING_CURRICULUM_SCHEMA_VERSION,
  SPEAKING_CURRICULUM_TOPICS_V2,
  SPEAKING_CURRICULUM_TRANSITION_POLICY,
  SPEAKING_PEDAGOGY_PRINCIPLES,
  buildPublicSpeakingStages,
} from '../../content/speakingCurriculum';

describe('Speaking & Communication Curriculum v2', () => {
  it('defines two complete readiness-based levels with 36 lessons and 6 stages each', () => {
    const foundations = SPEAKING_COURSES['basic-public-speaking'];
    const excellence = SPEAKING_COURSES['advanced-public-speaking'];

    for (const course of [foundations, excellence]) {
      expect(course.lessons).toHaveLength(36);
      expect(course.stages).toHaveLength(6);
      expect(course.stages.map((stage) => stage.end - stage.start + 1)).toEqual([6, 6, 6, 6, 6, 6]);
      expect(course.lessons.map((lesson) => lesson.order)).toEqual(
        Array.from({ length: 36 }, (_, index) => index + 1),
      );
      expect(course.lessons.every((lesson) => lesson.curriculumRevision === SPEAKING_CURRICULUM_REVISION)).toBe(true);
      expect(course.lessons.every((lesson) => lesson.schemaVersion === SPEAKING_CURRICULUM_SCHEMA_VERSION)).toBe(true);
      expect(course.lessons.every((lesson) => lesson.transferTask.toLowerCase().includes('fresh'))).toBe(true);
      expect(course.lessons.every((lesson) => lesson.evidence.toLowerCase().includes('independent'))).toBe(true);
    }

    expect(SPEAKING_CURRICULUM_TOPICS_V2).toHaveLength(72);
    expect(new Set(SPEAKING_CURRICULUM_TOPICS_V2.map((lesson) => lesson.id)).size).toBe(72);
  });

  it('uses versioned topic IDs so v2 cannot silently reinterpret old operational lesson progress', () => {
    expect(SPEAKING_COURSES['basic-public-speaking'].lessons[0].id).toBe('basic-public-speaking__v2-lesson-01');
    expect(SPEAKING_COURSES['advanced-public-speaking'].lessons[35].id).toBe('advanced-public-speaking__v2-lesson-36');
    expect(SPEAKING_CURRICULUM_TRANSITION_POLICY.existingOperationalProgress).toBe('preserve_v1');
    expect(SPEAKING_CURRICULUM_TRANSITION_POLICY.newV2TopicIdsAreVersioned).toBe(true);
  });

  it('puts reciprocal communication, questioning and clarification before presentation in Foundations', () => {
    const foundations = SPEAKING_COURSES['basic-public-speaking'];
    expect(foundations.stages.map((stage) => stage.label)).toEqual([
      'Stage 1 — Connect & Communicate',
      'Stage 2 — Ask, Listen & Clarify',
      'Stage 3 — Describe & Explain',
      'Stage 4 — Story & Perspective',
      'Stage 5 — Short Talks & Audience',
      'Stage 6 — Independent Communication & Smart Questioning',
    ]);

    expect(foundations.lessons[4].label).toContain('Turn-Taking');
    expect(foundations.lessons[10].label).toContain('Follow-Up Question');
    expect(foundations.lessons[11].label).toContain('Clarify & Repair');
    expect(foundations.lessons[28].label).toContain('Audience Awareness');
    expect(foundations.lessons[35].label).toContain('Final Communication Showcase');
  });

  it('puts dialogue, reasoning, mediation and responsible AI-era communication into Excellence', () => {
    const excellence = SPEAKING_COURSES['advanced-public-speaking'];
    expect(excellence.stages.map((stage) => stage.label)).toEqual([
      'Stage 1 — Purpose, Audience & Delivery',
      'Stage 2 — Questioning, Listening & Dialogue',
      'Stage 3 — Reasoning & Explanation',
      'Stage 4 — Story, Perspective & Impromptu Thinking',
      'Stage 5 — Discussion, Persuasion & Mediation',
      'Stage 6 — Presentation & AI-Era Communication',
    ]);

    expect(excellence.lessons[9].label).toBe('Paraphrase What You Heard');
    expect(excellence.lessons[17].label).toContain('Evidence & Sources');
    expect(excellence.lessons[28].label).toContain('Mediate Another Idea');
    expect(excellence.lessons[31].label).toContain('Recognise AI');
    expect(excellence.lessons[32].label).toContain('Privacy');
    expect(excellence.lessons[34].label).toContain('Evaluate & Improve an AI Answer');
  });

  it('drives both canonical public course-detail curricula from the same source', () => {
    const foundationsWebsite = curriculumBySlug['public-speaking-foundations'].weeks ?? [];
    const excellenceWebsite = curriculumBySlug['public-speaking-excellence'].weeks ?? [];

    expect(foundationsWebsite).toEqual(buildPublicSpeakingStages('basic-public-speaking'));
    expect(excellenceWebsite).toEqual(buildPublicSpeakingStages('advanced-public-speaking'));
    expect(curriculumBySlug['basic-public-speaking'].weeks).toEqual(foundationsWebsite);
    expect(curriculumBySlug['advanced-public-speaking'].weeks).toEqual(excellenceWebsite);

    expect(foundationsWebsite.flatMap((stage) => stage.lessons ?? [])).toEqual(
      SPEAKING_COURSES['basic-public-speaking'].lessons.map((lesson) => lesson.displayTitle),
    );
    expect(excellenceWebsite.flatMap((stage) => stage.lessons ?? [])).toEqual(
      SPEAKING_COURSES['advanced-public-speaking'].lessons.map((lesson) => lesson.displayTitle),
    );
  });

  it('protects child-responsive and multilingual pedagogy in the source contract', () => {
    expect(SPEAKING_PEDAGOGY_PRINCIPLES).toContain('Responsive back-and-forth interaction before performance');
    expect(SPEAKING_PEDAGOGY_PRINCIPLES).toContain('Model → guide → fade support → independent use → fresh-task transfer');
    expect(SPEAKING_PEDAGOGY_PRINCIPLES.some((item) => item.toLowerCase().includes('multilingual'))).toBe(true);
    expect(SPEAKING_PEDAGOGY_PRINCIPLES.some((item) => item.toLowerCase().includes('mandatory eye contact'))).toBe(true);
    expect(SPEAKING_PEDAGOGY_PRINCIPLES.some((item) => item.toLowerCase().includes('accent conformity'))).toBe(true);
  });

  it('publishes the complete communication capability spine', () => {
    expect(SPEAKING_COMMUNICATION_DIMENSIONS).toEqual([
      'Response expansion',
      'Sentence formation in speaking',
      'Vocabulary in use',
      'Listening & response relevance',
      'Questioning & clarification',
      'Idea organisation',
      'Storytelling & retelling',
      'Reasoning & evidence',
      'Collaborative dialogue & perspective',
      'Delivery & intelligibility',
      'Audience & purpose',
      'Independence & fresh-task transfer',
    ]);
  });
});
