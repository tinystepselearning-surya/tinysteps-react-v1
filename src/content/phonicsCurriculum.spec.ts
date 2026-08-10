import { describe, expect, it } from 'vitest';
import {
  PHONICS_CURRICULUM_TOPICS,
  PHONICS_LESSONS_BY_COURSE,
} from './phonicsCurriculum';

describe('canonical phonics curriculum', () => {
  it('keeps the approved lesson counts', () => {
    expect(PHONICS_LESSONS_BY_COURSE['phonics-foundations']).toHaveLength(31);
    expect(PHONICS_LESSONS_BY_COURSE['early-phonics']).toHaveLength(40);
    expect(PHONICS_LESSONS_BY_COURSE['advanced-phonics']).toHaveLength(30);
    expect(PHONICS_CURRICULUM_TOPICS).toHaveLength(101);
  });

  it('keeps stable lesson-number topic ids', () => {
    expect(PHONICS_LESSONS_BY_COURSE['phonics-foundations'][30].id)
      .toBe('phonics-foundations__lesson-31');
    expect(PHONICS_LESSONS_BY_COURSE['early-phonics'][39].id)
      .toBe('early-phonics__lesson-40');
    expect(PHONICS_LESSONS_BY_COURSE['advanced-phonics'][29].id)
      .toBe('advanced-phonics__lesson-30');
  });

  it('contains the approved final boundary lessons', () => {
    expect(PHONICS_LESSONS_BY_COURSE['phonics-foundations'][30].label)
      .toBe('Grand Revision');
    expect(PHONICS_LESSONS_BY_COURSE['early-phonics'][39].label)
      .toBe('The Lazy Sound');
    expect(PHONICS_LESSONS_BY_COURSE['advanced-phonics'][28].label)
      .toBe('Missing and Sleepy Sounds');
    expect(PHONICS_LESSONS_BY_COURSE['advanced-phonics'][29].label)
      .toBe('The Lazy Vowel Mystery');
  });

  it('keeps every course lesson number continuous and unique', () => {
    Object.values(PHONICS_LESSONS_BY_COURSE).forEach((lessons) => {
      expect(lessons.map((lesson) => lesson.lessonNumber))
        .toEqual(Array.from({ length: lessons.length }, (_, index) => index + 1));
      expect(new Set(lessons.map((lesson) => lesson.id)).size).toBe(lessons.length);
    });
  });
});
