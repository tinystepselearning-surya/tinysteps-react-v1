import { describe, expect, it } from 'vitest';

import { selectTeacherTopicResumeId } from '../../lib/teacherTopicResume';

const courseTopics = [
  { id: 'early-phonics__lesson-01', order: 1 },
  { id: 'early-phonics__lesson-03', order: 3 },
  { id: 'early-phonics__lesson-05', order: 5 },
];

describe('selectTeacherTopicResumeId', () => {
  it('opens the most recently saved curriculum lesson instead of lesson 1', () => {
    expect(selectTeacherTopicResumeId([
      {
        id: 'early-phonics__lesson-05',
        updatedAt: new Date('2026-06-03T12:26:06.720Z'),
      },
      {
        id: 'early-phonics__lesson-03',
        updatedAt: new Date('2026-07-01T14:10:24.000Z'),
      },
    ], courseTopics)).toBe('early-phonics__lesson-03');
  });

  it('supports Firestore timestamp-like values and ignores rows outside the current curriculum', () => {
    expect(selectTeacherTopicResumeId([
      {
        id: 'retired-topic',
        updatedAt: { toMillis: () => Date.parse('2026-09-01T00:00:00Z') },
      },
      {
        id: 'early-phonics__lesson-05',
        updatedAt: { toMillis: () => Date.parse('2026-08-01T00:00:00Z') },
      },
    ], courseTopics)).toBe('early-phonics__lesson-05');
  });

  it('falls back deterministically to the furthest saved curriculum lesson when legacy timestamps are absent', () => {
    expect(selectTeacherTopicResumeId([
      { id: 'early-phonics__lesson-01' },
      { id: 'early-phonics__lesson-05' },
      { id: 'early-phonics__lesson-03' },
    ], courseTopics)).toBe('early-phonics__lesson-05');
  });

  it('returns null when the child has no saved progress in the current curriculum', () => {
    expect(selectTeacherTopicResumeId([], courseTopics)).toBeNull();
    expect(selectTeacherTopicResumeId([{ id: 'retired-topic' }], courseTopics)).toBeNull();
  });
});
