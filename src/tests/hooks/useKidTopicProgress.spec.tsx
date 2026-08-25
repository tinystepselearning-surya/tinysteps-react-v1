import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getDocsMock, collectionMock, whereMock, queryMock } = vi.hoisted(() => ({
  getDocsMock: vi.fn(),
  collectionMock: vi.fn((...parts: unknown[]) => ({ kind: 'collection', parts })),
  whereMock: vi.fn((...parts: unknown[]) => ({ kind: 'where', parts })),
  queryMock: vi.fn((...parts: unknown[]) => ({ kind: 'query', parts })),
}));

vi.mock('firebase/firestore', () => ({
  collection: collectionMock,
  getDocs: getDocsMock,
  query: queryMock,
  where: whereMock,
}));

vi.mock('../../lib/firebaseConfig', () => ({
  db: { kind: 'db' },
}));

import { useKidTopicProgress } from '../../hooks/useKidTopicProgress';

describe('useKidTopicProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDocsMock.mockResolvedValue({
      docs: [
        {
          id: 'lesson-1',
          data: () => ({
            courseId: 'phonics-foundations',
            topicName: 'Lesson 1 — S',
            mastery: 'developing',
          }),
        },
      ],
    });
  });

  it('queries only the selected course and does not refetch on unchanged rerenders or local saves', async () => {
    const { result, rerender } = renderHook(
      ({ kidId, courseId }) => useKidTopicProgress(kidId, courseId),
      { initialProps: { kidId: 'kid-1', courseId: 'phonics-foundations' } },
    );

    await waitFor(() => expect(getDocsMock).toHaveBeenCalledTimes(1));
    expect(whereMock).toHaveBeenCalledWith('courseId', '==', 'phonics-foundations');

    rerender({ kidId: 'kid-1', courseId: 'phonics-foundations' });
    await act(async () => Promise.resolve());
    expect(getDocsMock).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.upsertLocalTopic({
        id: 'lesson-1',
        courseId: 'phonics-foundations',
        topicName: 'Lesson 1 — S',
        mastery: 75,
        updatedAt: new Date(),
      });
    });
    expect(getDocsMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refresh();
    });
    expect(getDocsMock).toHaveBeenCalledTimes(2);
  });

  it('does not fetch until a course is selected', async () => {
    const { rerender } = renderHook(
      ({ courseId }) => useKidTopicProgress('kid-1', courseId),
      { initialProps: { courseId: '' } },
    );

    await act(async () => Promise.resolve());
    expect(getDocsMock).not.toHaveBeenCalled();

    rerender({ courseId: 'early-phonics' });
    await waitFor(() => expect(getDocsMock).toHaveBeenCalledTimes(1));
    expect(whereMock).toHaveBeenCalledWith('courseId', '==', 'early-phonics');
  });
});
