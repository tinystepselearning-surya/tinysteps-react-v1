import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

vi.mock('../../../lib/firebaseConfig', () => ({ db: { kind: 'db' } }));

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
  useAuthStore: vi.fn(() => ({ user: { uid: 'teacher-1', role: 'teacher' } })),
}));

vi.mock('../../../components/progress/ChildSkillRatingCard', () => ({
  default: ({ skills, onChange }: {
    skills: Array<{ key: string; label: string }>;
    onChange?: (key: string, value: number) => void;
  }) => (
    <div data-testid="skill-rating-card">
      {skills.map((skill) => (
        <button
          type="button"
          key={skill.key}
          onClick={() => onChange?.(skill.key, 4)}
        >
          Rate {skill.label} 4
        </button>
      ))}
    </div>
  ),
}));

import StudentTopicProgressEditorCanonicalV2 from '../../../components/teacher/StudentTopicProgressEditorCanonicalV2';

describe('StudentTopicProgressEditorCanonicalV2 star-derived subskills', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setDocMock.mockResolvedValue(undefined);
    getDocMock.mockImplementation(async (ref: { parts?: unknown[] }) => {
      const parts = ref?.parts ?? [];
      if (parts.includes('enrollments')) {
        return {
          exists: () => true,
          data: () => ({ courseId: 'phonics-foundations' }),
        };
      }
      return { exists: () => false, data: () => ({}) };
    });
  });

  afterEach(() => cleanup());

  it('suggests from stars, preserves teacher override, and can reset to stars', async () => {
    render(
      <StudentTopicProgressEditorCanonicalV2
        kidId="kid-1"
        enrollmentId="enrollment-1"
        courseId="phonics-foundations"
      />,
    );

    await screen.findByText('Current lesson');
    expect(screen.getByText(/suggested from the skill stars/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Rate Letter recognition 4' }));

    const letterButtons = screen.getAllByRole('button', { name: 'Letter recognition' });
    expect(letterButtons).toHaveLength(2);
    fireEvent.click(letterButtons[1]);

    await screen.findByText(/adjusted by the teacher/i);
    expect(screen.getByRole('button', { name: 'Use star suggestions' })).toBeTruthy();

    const saveButton = screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement;
    await waitFor(() => expect(saveButton.disabled).toBe(false));
    fireEvent.click(saveButton);
    await waitFor(() => expect(setDocMock).toHaveBeenCalledTimes(1));

    expect(setDocMock.mock.calls[0][1]).toMatchObject({
      subskillSelectionSource: 'teacher',
      strengthSubskills: [],
      needsPracticeSubskills: ['Letter recognition'],
      selectedSubskills: ['Letter recognition'],
    });

    fireEvent.click(screen.getByRole('button', { name: 'Use star suggestions' }));
    await screen.findByText(/suggested from the skill stars/i);

    await waitFor(() => expect(saveButton.disabled).toBe(false));
    fireEvent.click(saveButton);
    await waitFor(() => expect(setDocMock).toHaveBeenCalledTimes(2));

    expect(setDocMock.mock.calls[1][1]).toMatchObject({
      subskillSelectionSource: 'stars',
      strengthSubskills: ['Letter recognition'],
      needsPracticeSubskills: [],
      selectedSubskills: ['Letter recognition'],
    });
  });
});
