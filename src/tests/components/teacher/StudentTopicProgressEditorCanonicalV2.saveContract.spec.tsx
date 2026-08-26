import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  PHONICS_COURSES,
  PHONICS_CURRICULUM_REVISION,
  getPhonicsLessons,
  type PhonicsCourseId,
  type PhonicsLesson,
} from '../../../content/phonicsCurriculum';

const { docMock, getDocMock, setDocMock, upsertLocalTopicMock } = vi.hoisted(() => ({
  docMock: vi.fn((...parts: unknown[]) => ({ parts })),
  getDocMock: vi.fn(),
  setDocMock: vi.fn(),
  upsertLocalTopicMock: vi.fn(),
}));

let enrollmentCourseId: PhonicsCourseId = 'phonics-foundations';

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
    upsertLocalTopic: upsertLocalTopicMock,
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

const edgeLessons: PhonicsLesson[] = (['phonics-foundations', 'early-phonics', 'advanced-phonics'] as PhonicsCourseId[])
  .flatMap((courseId) => {
    const lessons = getPhonicsLessons(courseId);
    return [lessons[0], lessons[lessons.length - 1]];
  });

describe('StudentTopicProgressEditorCanonicalV2 canonical phonics save contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setDocMock.mockResolvedValue(undefined);
    getDocMock.mockImplementation(async (ref: { parts?: unknown[] }) => {
      const parts = ref?.parts ?? [];
      if (parts.includes('enrollments')) {
        return {
          exists: () => true,
          data: () => ({ courseId: enrollmentCourseId }),
        };
      }
      return { exists: () => false, data: () => ({}) };
    });
  });

  afterEach(() => {
    cleanup();
  });

  it.each(edgeLessons)('writes canonical identity for $id', async (topic) => {
    enrollmentCourseId = topic.courseId;

    render(
      <StudentTopicProgressEditorCanonicalV2
        kidId="kid-1"
        enrollmentId="enrollment-1"
        courseId={topic.courseId}
      />,
    );

    await screen.findByText('Current lesson');
    const lessonSelect = screen.getByLabelText(/^Lesson$/) as HTMLSelectElement;

    if (lessonSelect.value !== topic.id) {
      fireEvent.change(lessonSelect, { target: { value: topic.id } });
    }
    await waitFor(() => expect(lessonSelect.value).toBe(topic.id));

    const readyButton = screen.getByRole('button', { name: /Ready to move on/i });
    fireEvent.click(readyButton);

    const saveButton = screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement;
    await waitFor(() => expect(saveButton.disabled).toBe(false));
    fireEvent.click(saveButton);

    await waitFor(() => expect(setDocMock).toHaveBeenCalledTimes(1));

    const [ref, data, options] = setDocMock.mock.calls[0];
    expect((ref as { parts: unknown[] }).parts.slice(-4)).toEqual([
      'students',
      'kid-1',
      'progress',
      topic.id,
    ]);
    expect(options).toEqual({ merge: true });
    expect(data).toMatchObject({
      topicId: topic.id,
      topicName: topic.displayTitle,
      area: 'phonics',
      courseId: topic.courseId,
      courseLabel: PHONICS_COURSES[topic.courseId].label,
      courseTotalTopics: PHONICS_COURSES[topic.courseId].lessonCount,
      lesson: topic.lesson,
      lessonNumber: topic.lessonNumber,
      stageLabel: topic.stageLabel,
      stageOrder: topic.stageOrder,
      rubricType: topic.rubricType,
      curriculumRevision: PHONICS_CURRICULUM_REVISION,
      enrollmentId: 'enrollment-1',
      updatedBy: 'teacher-1',
      updatedByRole: 'teacher',
      source: 'teacher_topic_progress',
    });

    expect(upsertLocalTopicMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: topic.id,
        topicId: topic.id,
        courseId: topic.courseId,
        lessonNumber: topic.lessonNumber,
        stageLabel: topic.stageLabel,
        stageOrder: topic.stageOrder,
        rubricType: topic.rubricType,
        curriculumRevision: PHONICS_CURRICULUM_REVISION,
        enrollmentId: 'enrollment-1',
      }),
    );
  });
});
