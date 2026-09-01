import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getPhonicsLessons } from '../../../content/phonicsCurriculum';

const { getDocMock, useKidTopicProgressMock } = vi.hoisted(() => ({
  getDocMock: vi.fn(),
  useKidTopicProgressMock: vi.fn(),
}));

let resumeRows: Array<Record<string, unknown> & { id: string }> = [];

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((...parts: unknown[]) => ({ parts })),
  getDoc: getDocMock,
  serverTimestamp: vi.fn(() => ({ kind: 'serverTimestamp' })),
  setDoc: vi.fn(),
}));

vi.mock('../../../lib/firebaseConfig', () => ({ db: { kind: 'db' } }));

vi.mock('../../../hooks/useKidTopicProgress', () => ({
  useKidTopicProgress: (...args: unknown[]) => useKidTopicProgressMock(...args),
}));

vi.mock('../../../store/useAuthStore', () => ({
  useAuthStore: vi.fn(() => ({ user: { uid: 'teacher-1', role: 'teacher' } })),
}));

vi.mock('../../../components/progress/ChildSkillRatingCard', () => ({
  default: () => <div data-testid="skill-rating-card" />,
}));

import StudentTopicProgressEditorCanonicalV2 from '../../../components/teacher/StudentTopicProgressEditorCanonicalV2';

const hookResult = (topics: typeof resumeRows) => ({
  topics,
  loading: false,
  error: null,
  refresh: vi.fn(),
  upsertLocalTopic: vi.fn(),
});

describe('StudentTopicProgressEditorCanonicalV2 resume selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resumeRows = [];
    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({ courseId: 'early-phonics' }),
    });
    useKidTopicProgressMock.mockImplementation((
      _kidId: string,
      _courseId: string,
      _enabled: boolean,
      _enrollmentId: string,
      topicId?: string,
    ) => {
      if (topicId === undefined) return hookResult(resumeRows);
      return hookResult(resumeRows.filter((row) => row.id === topicId));
    });
  });

  afterEach(() => cleanup());

  it('lands on the most recently saved lesson when historical progress exists', async () => {
    const lessons = getPhonicsLessons('early-phonics');
    const lesson3 = lessons[2];
    const lesson5 = lessons[4];
    resumeRows = [
      { id: lesson5.id, updatedAt: new Date('2026-06-03T12:26:06.720Z') },
      { id: lesson3.id, updatedAt: new Date('2026-07-01T14:10:24.000Z') },
    ];

    render(
      <StudentTopicProgressEditorCanonicalV2
        kidId="kid-1"
        kidName="Student One"
        enrollmentId="enrollment-1"
        courseId="early-phonics"
      />,
    );

    const lessonSelect = await screen.findByLabelText(/^Lesson$/) as HTMLSelectElement;
    await waitFor(() => expect(lessonSelect.value).toBe(lesson3.id));
  });

  it('uses lesson 1 only when there is no saved progress for the current curriculum', async () => {
    const firstLesson = getPhonicsLessons('early-phonics')[0];

    render(
      <StudentTopicProgressEditorCanonicalV2
        kidId="kid-2"
        kidName="New Student"
        enrollmentId="enrollment-2"
        courseId="early-phonics"
      />,
    );

    const lessonSelect = await screen.findByLabelText(/^Lesson$/) as HTMLSelectElement;
    await waitFor(() => expect(lessonSelect.value).toBe(firstLesson.id));
  });

  it('does not snap back after the teacher manually chooses another lesson', async () => {
    const lessons = getPhonicsLessons('early-phonics');
    const resumedLesson = lessons[4];
    const manualLesson = lessons[6];
    resumeRows = [
      { id: resumedLesson.id, updatedAt: new Date('2026-07-01T14:10:24.000Z') },
    ];

    render(
      <StudentTopicProgressEditorCanonicalV2
        kidId="kid-3"
        kidName="Student Three"
        enrollmentId="enrollment-3"
        courseId="early-phonics"
      />,
    );

    const lessonSelect = await screen.findByLabelText(/^Lesson$/) as HTMLSelectElement;
    await waitFor(() => expect(lessonSelect.value).toBe(resumedLesson.id));

    fireEvent.change(lessonSelect, { target: { value: manualLesson.id } });
    await waitFor(() => expect(lessonSelect.value).toBe(manualLesson.id));
  });
});
