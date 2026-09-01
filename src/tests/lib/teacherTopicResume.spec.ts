import { describe, expect, it } from 'vitest';

import { selectTeacherTopicResumeId } from '../../lib/teacherTopicResume';

const courseTopics = [
  { id: 'early-phonics__lesson-01', order: 1 },
  { id: 'early-phonics__lesson-03', order: 3 },
  { id: 'early-phonics__lesson-05', order: 5 },
];

describe('selectTeacherTopicResumeId', () => {
  it('accepts the canonical latest saved lesson when it belongs to the current curriculum', () => {
    expect(selectTeacherTopicResumeId('early-phonics__lesson-05', courseTopics))
      .toBe('early-phonics__lesson-05');
  });

  it('trims the projected topic id', () => {
    expect(selectTeacherTopicResumeId('  early-phonics__lesson-03  ', courseTopics))
      .toBe('early-phonics__lesson-03');
  });

  it('rejects retired or foreign topic ids', () => {
    expect(selectTeacherTopicResumeId('retired-topic', courseTopics)).toBeNull();
    expect(selectTeacherTopicResumeId('advanced-phonics__lesson-03', courseTopics)).toBeNull();
  });

  it('returns null when the projection has no latest saved topic', () => {
    expect(selectTeacherTopicResumeId(null, courseTopics)).toBeNull();
    expect(selectTeacherTopicResumeId('', courseTopics)).toBeNull();
  });
});
