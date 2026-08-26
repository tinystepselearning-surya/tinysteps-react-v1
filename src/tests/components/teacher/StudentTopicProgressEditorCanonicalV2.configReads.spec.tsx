import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { docMock, getDocMock, setDocMock } = vi.hoisted(() => ({
  docMock: vi.fn((...parts: unknown[]) => ({ parts })),
  getDocMock: vi.fn(),
  setDocMock: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: docMock,
  getDoc: getDocMock,
  serverTimestamp: vi.fn(() => ({ kind: 'serverTimestamp' })),
  setDoc: setDocMock,
}));

vi.mock('../../../lib/firebaseConfig', () => ({
  db: { kind: 'db' },
}));

vi.mock('../../../hooks/useKidTopicProgress', () => ({
  useKidTopicProgress: vi.fn(() => ({
    topics: [],
    loading: false,
    error: null,
    refresh: vi.fn(),
    upsertLocalTopic: vi.fn(),
  })),
}));

vi.mock('../../../store/useAuthStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { uid: 'teacher-1', role: 'teacher' },
  })),
}));

vi.mock('../../../components/progress/ChildSkillRatingCard', () => ({
  default: () => <div data-testid="skill-rating-card" />,
}));

import StudentTopicProgressEditorCanonicalV2 from '../../../components/teacher/StudentTopicProgressEditorCanonicalV2';

function configReads() {
  return getDocMock.mock.calls.filter(([ref]) => {
    const parts = (ref as { parts?: unknown[] })?.parts ?? [];
    return parts.includes('config') && parts.includes('curriculumTopics');
  });
}

describe('StudentTopicProgressEditorCanonicalV2 curriculum config reads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDocMock.mockImplementation(async (ref: { parts?: unknown[] }) => {
      const parts = ref?.parts ?? [];
      if (parts.includes('config') && parts.includes('curriculumTopics')) {
        return {
          exists: () => true,
          data: () => ({
            topics: [
              {
                id: 'basic-grammar__lesson-01',
                courseId: 'basic-grammar',
                lesson: 'Lesson-1',
                label: 'Nouns',
                order: 1,
              },
            ],
          }),
        };
      }
      return { exists: () => false, data: () => ({}) };
    });
  });

  afterEach(() => {
    cleanup();
  });

  it.each([
    'phonics-foundations',
    'early-phonics',
    'advanced-phonics',
  ])('does not read config/curriculumTopics for %s', async (courseId) => {
    render(
      <StudentTopicProgressEditorCanonicalV2
        kidId="kid-1"
        courseId={courseId}
      />,
    );

    await screen.findByText('Current lesson');
    await Promise.resolve();

    expect(configReads()).toHaveLength(0);
    expect(getDocMock).not.toHaveBeenCalled();
  });

  it('preserves the remote curriculum config read for grammar', async () => {
    render(
      <StudentTopicProgressEditorCanonicalV2
        kidId="kid-1"
        courseId="basic-grammar"
      />,
    );

    await waitFor(() => expect(configReads()).toHaveLength(1));
    expect(getDocMock).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Current lesson')).toBeTruthy();
  });
});
