import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getPhonicsLessons } from '../../../content/phonicsCurriculum';

const { docMock, getDocMock, useKidTopicProgressMock } = vi.hoisted(() => ({
  docMock: vi.fn((...parts: unknown[]) => ({ parts })),
  getDocMock: vi.fn(),
  useKidTopicProgressMock: vi.fn(),
}));

let projectedLatestTopicId: string | null = null;

vi.mock('firebase/firestore', () => ({
  doc: docMock,
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

const hookResult = (topics: Array<Record<string, unknown> & { id: string }> = []) => ({
  topics,
  loading: false,
  error: null,
  refresh: vi.fn(),
  upsertLocalTopic: vi.fn(),
});

describe('StudentTopicProgressEditorCanonicalV2 resume selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    projectedLatestTopicId = null;
    getDocMock.mockImplementation(async (ref: { parts?: unknown[] }) => {
      const parts = ref?.parts ?? [];
      if (parts.includes('courseProgress')) {
        return {
          exists: () => projectedLatestTopicId !== null,
          data: () => ({ latestTopicId: projectedLatestTopicId }),
        };
      }
      if (parts.includes('enrollments')) {
        return {
          exists: () => true,
          data: () => ({ courseId: 'early-phonics' }),
        };
      }
      return { exists: () => false, data: () => ({}) };
    });
    useKidTopicProgressMock.mockReturnValue(hookResult());
  });

  afterEach(() => cleanup());

  it('lands on the canonical projection latest saved lesson instead of lesson 1', async () => {
    const lessons = getPhonicsLessons('early-phonics');
    const resumedLesson = lessons[4];
    projectedLatestTopicId = resumedLesson.id;

    render(
      <StudentTopicProgressEditorCanonicalV2
        kidId="kid-1"
        kidName="Student One"
        enrollmentId="enrollment-1"
        courseId="early-phonics"
      />,
    );

    const lessonSelect = await screen.findByLabelText(/^Lesson$/) as HTMLSelectElement;
    await waitFor(() => expect(lessonSelect.value).toBe(resumedLesson.id));
    expect(docMock).toHaveBeenCalledWith(
      expect.anything(),
      'students',
      'kid-1',
      'courseProgress',
      'early-phonics',
    );
  });

  it('uses lesson 1 only when the projection has no saved progress', async () => {
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

  it('falls back to lesson 1 when the projected latest topic is no longer in the curriculum', async () => {
    const firstLesson = getPhonicsLessons('early-phonics')[0];
    projectedLatestTopicId = 'retired-early-phonics-topic';

    render(
      <StudentTopicProgressEditorCanonicalV2
        kidId="kid-legacy"
        kidName="Legacy Student"
        enrollmentId="enrollment-legacy"
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
    projectedLatestTopicId = resumedLesson.id;

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
