import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { docMock, onSnapshotMock, unsubscribeMock } = vi.hoisted(() => ({
  docMock: vi.fn((...parts: unknown[]) => ({ parts })),
  onSnapshotMock: vi.fn(),
  unsubscribeMock: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: docMock,
  onSnapshot: onSnapshotMock,
}));

vi.mock('../../lib/firebaseConfig', () => ({
  db: { kind: 'db' },
}));

import { useChildCourseProgressProjection } from '../../hooks/useChildCourseProgressProjection';

describe('useChildCourseProgressProjection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onSnapshotMock.mockReturnValue(unsubscribeMock);
  });

  it('keeps one listener for an unchanged child/course and cleans it up', () => {
    const { rerender, unmount } = renderHook(
      ({ kidId, courseId }) => useChildCourseProgressProjection(kidId, courseId),
      { initialProps: { kidId: 'kid-1', courseId: 'phonics-foundations' } },
    );

    expect(onSnapshotMock).toHaveBeenCalledTimes(1);
    rerender({ kidId: 'kid-1', courseId: 'phonics-foundations' });
    expect(onSnapshotMock).toHaveBeenCalledTimes(1);

    rerender({ kidId: 'kid-1', courseId: 'early-phonics' });
    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
    expect(onSnapshotMock).toHaveBeenCalledTimes(2);

    unmount();
    expect(unsubscribeMock).toHaveBeenCalledTimes(2);
  });

  it('does not expose the previous child projection while switching children', () => {
    let emitSnapshot: ((snapshot: { exists: () => boolean; data: () => unknown }) => void) | undefined;
    onSnapshotMock.mockImplementation((_ref, onNext) => {
      emitSnapshot = onNext;
      return unsubscribeMock;
    });

    const { result, rerender } = renderHook(
      ({ kidId }) => useChildCourseProgressProjection(kidId, 'phonics-foundations'),
      { initialProps: { kidId: 'kid-1' } },
    );

    act(() => {
      emitSnapshot?.({
        exists: () => true,
        data: () => ({ courseId: 'phonics-foundations', completedTopics: 4 }),
      });
    });
    expect(result.current.data?.completedTopics).toBe(4);

    rerender({ kidId: 'kid-2' });
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);
  });
});
