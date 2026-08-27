import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getDocsMock, collectionMock, documentIdMock, whereMock, queryMock } = vi.hoisted(() => ({
  getDocsMock: vi.fn(),
  collectionMock: vi.fn((...parts: unknown[]) => ({ kind: 'collection', parts })),
  documentIdMock: vi.fn(() => ({ kind: 'documentId' })),
  whereMock: vi.fn((...parts: unknown[]) => ({ kind: 'where', parts })),
  queryMock: vi.fn((...parts: unknown[]) => ({ kind: 'query', parts })),
}));

vi.mock('firebase/firestore', () => ({
  collection: collectionMock,
  documentId: documentIdMock,
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
            enrollmentId: 'enrollment-1',
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

  it('scopes explicit teacher reads by both courseId and enrollmentId', async () => {
    renderHook(() => useKidTopicProgress(
      'kid-1',
      'phonics-foundations',
      true,
      'enrollment-1',
    ));

    await waitFor(() => expect(getDocsMock).toHaveBeenCalledTimes(1));
    expect(queryMock).toHaveBeenCalledTimes(1);
    expect(whereMock).toHaveBeenCalledWith('courseId', '==', 'phonics-foundations');
    expect(whereMock).toHaveBeenCalledWith('enrollmentId', '==', 'enrollment-1');
    expect(queryMock).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'collection' }),
      expect.objectContaining({ kind: 'where', parts: ['courseId', '==', 'phonics-foundations'] }),
      expect.objectContaining({ kind: 'where', parts: ['enrollmentId', '==', 'enrollment-1'] }),
    );
  });

  it('does not fetch canonical teacher progress until the explicit enrollment is present', async () => {
    const { rerender } = renderHook(
      ({ enrollmentId }) => useKidTopicProgress(
        'kid-1',
        'phonics-foundations',
        true,
        enrollmentId,
      ),
      { initialProps: { enrollmentId: '' } },
    );

    await act(async () => Promise.resolve());
    expect(getDocsMock).not.toHaveBeenCalled();

    rerender({ enrollmentId: 'enrollment-1' });
    await waitFor(() => expect(getDocsMock).toHaveBeenCalledTimes(1));
    expect(whereMock).toHaveBeenCalledWith('enrollmentId', '==', 'enrollment-1');
  });

  it('keeps the canonical query bound to one enrollment when the same child and course have another enrollment', async () => {
    renderHook(() => useKidTopicProgress(
      'kid-1',
      'phonics-foundations',
      true,
      'enrollment-1',
    ));

    await waitFor(() => expect(getDocsMock).toHaveBeenCalledTimes(1));
    const enrollmentWhereCalls = whereMock.mock.calls.filter(
      (call) => call[0] === 'enrollmentId',
    );
    expect(enrollmentWhereCalls).toEqual([['enrollmentId', '==', 'enrollment-1']]);
    expect(enrollmentWhereCalls).not.toContainEqual(['enrollmentId', '==', 'enrollment-2']);
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

  it('preserves broad reads only for legacy callers that omit the course argument', async () => {
    renderHook(() => useKidTopicProgress('kid-legacy'));

    await waitFor(() => expect(getDocsMock).toHaveBeenCalledTimes(1));
    expect(queryMock).not.toHaveBeenCalled();
    expect(getDocsMock).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'collection' }),
    );
  });

  it('ignores a slower response from the previously selected course', async () => {
    let resolveFirst: ((value: unknown) => void) | undefined;
    let resolveSecond: ((value: unknown) => void) | undefined;
    getDocsMock
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve; }));

    const { result, rerender } = renderHook(
      ({ courseId }) => useKidTopicProgress('kid-1', courseId),
      { initialProps: { courseId: 'phonics-foundations' } },
    );
    rerender({ courseId: 'early-phonics' });

    await act(async () => {
      resolveSecond?.({
        docs: [{ id: 'new-course-topic', data: () => ({ courseId: 'early-phonics' }) }],
      });
    });
    await waitFor(() => expect(result.current.topics[0]?.id).toBe('new-course-topic'));

    await act(async () => {
      resolveFirst?.({
        docs: [{ id: 'stale-course-topic', data: () => ({ courseId: 'phonics-foundations' }) }],
      });
    });
    expect(result.current.topics[0]?.id).toBe('new-course-topic');
  });

  it('holds enrollment-scoped teacher editors closed after a failed progress read', async () => {
    getDocsMock.mockRejectedValueOnce(new Error('Missing or insufficient permissions.'));

    const { result } = renderHook(() => useKidTopicProgress(
      'kid-1',
      'phonics-foundations',
      true,
      'enrollment-1',
    ));

    await waitFor(() => expect(result.current.error).toBe('Missing or insufficient permissions.'));
    expect(result.current.topics).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it('does not change legacy loading semantics when a non-enrollment-scoped read fails', async () => {
    getDocsMock.mockRejectedValueOnce(new Error('legacy read failed'));

    const { result } = renderHook(() => useKidTopicProgress(
      'kid-1',
      'phonics-foundations',
    ));

    await waitFor(() => expect(result.current.error).toBe('legacy read failed'));
    expect(result.current.topics).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('waits for the selected lesson before an enrollment-scoped teacher read', async () => {
    const { rerender } = renderHook(
      ({ topicId }) => useKidTopicProgress(
        'kid-1',
        'phonics-foundations',
        true,
        'enrollment-1',
        topicId,
      ),
      { initialProps: { topicId: '' } },
    );

    await act(async () => Promise.resolve());
    expect(getDocsMock).not.toHaveBeenCalled();

    rerender({ topicId: 'phonics-foundations__lesson-01' });
    await waitFor(() => expect(getDocsMock).toHaveBeenCalledTimes(1));
    expect(documentIdMock).toHaveBeenCalledTimes(2);
    expect(whereMock).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'documentId' }),
      '>=',
      'phonics-foundations__lesson-01',
    );
    expect(whereMock).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'documentId' }),
      '<=',
      'phonics-foundations__lesson-01',
    );
  });

  it('loads only the selected lesson and serves revisits from the in-session cache', async () => {
    const lessonOneId = 'phonics-foundations__lesson-01';
    const lessonTwoId = 'phonics-foundations__lesson-02';
    getDocsMock
      .mockResolvedValueOnce({
        docs: [{
          id: lessonOneId,
          data: () => ({
            courseId: 'phonics-foundations',
            enrollmentId: 'enrollment-1',
            topicName: 'Lesson 1 — Letter S',
            mastery: 'developing',
          }),
        }],
      })
      .mockResolvedValueOnce({
        docs: [{
          id: lessonTwoId,
          data: () => ({
            courseId: 'phonics-foundations',
            enrollmentId: 'enrollment-1',
            topicName: 'Lesson 2 — Letter A',
            mastery: 'proficient',
          }),
        }],
      });

    const { result, rerender } = renderHook(
      ({ topicId }) => useKidTopicProgress(
        'kid-1',
        'phonics-foundations',
        true,
        'enrollment-1',
        topicId,
      ),
      { initialProps: { topicId: lessonOneId } },
    );

    await waitFor(() => expect(result.current.topics[0]?.id).toBe(lessonOneId));
    expect(getDocsMock).toHaveBeenCalledTimes(1);

    rerender({ topicId: lessonTwoId });
    await waitFor(() => expect(result.current.topics[0]?.id).toBe(lessonTwoId));
    expect(getDocsMock).toHaveBeenCalledTimes(2);

    rerender({ topicId: lessonOneId });
    await waitFor(() => expect(result.current.topics[0]?.id).toBe(lessonOneId));
    expect(getDocsMock).toHaveBeenCalledTimes(2);
  });

  it('bypasses the selected-lesson cache on an explicit refresh', async () => {
    const topicId = 'phonics-foundations__lesson-01';
    getDocsMock.mockResolvedValue({
      docs: [{
        id: topicId,
        data: () => ({
          courseId: 'phonics-foundations',
          enrollmentId: 'enrollment-1',
          topicName: 'Lesson 1 — Letter S',
          mastery: 'developing',
        }),
      }],
    });

    const { result } = renderHook(() => useKidTopicProgress(
      'kid-1',
      'phonics-foundations',
      true,
      'enrollment-1',
      topicId,
    ));

    await waitFor(() => expect(getDocsMock).toHaveBeenCalledTimes(1));
    await act(async () => {
      await result.current.refresh();
    });
    expect(getDocsMock).toHaveBeenCalledTimes(2);
  });
});
