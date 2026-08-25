import { useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

import { db } from '../lib/firebaseConfig';

export type ChildCourseProgressProjection = {
  courseId?: string;
  totalTopics?: number;
  completedTopics?: number;
  inProgressTopics?: number;
  overallPct?: number;
  lastUpdatedAtMs?: number | null;
  updatedAt?: unknown;
};

type ProjectionState = {
  key: string;
  data: ChildCourseProgressProjection | null;
  loading: boolean;
  error: string | null;
};

const EMPTY_STATE: ProjectionState = {
  key: '',
  data: null,
  loading: false,
  error: null,
};

export function useChildCourseProgressProjection(
  kidId: string | null | undefined,
  courseId: string | null | undefined,
  enabled = true,
) {
  const normalizedKidId = String(kidId || '').trim();
  const normalizedCourseId = String(courseId || '').trim();
  const projectionKey = enabled && normalizedKidId && normalizedCourseId
    ? `${normalizedKidId}::${normalizedCourseId}`
    : '';
  const [state, setState] = useState<ProjectionState>(EMPTY_STATE);

  useEffect(() => {
    if (!projectionKey) {
      setState(EMPTY_STATE);
      return;
    }

    setState({ key: projectionKey, data: null, loading: true, error: null });
    return onSnapshot(
      doc(db, 'students', normalizedKidId, 'courseProgress', normalizedCourseId),
      (snapshot) => {
        setState({
          key: projectionKey,
          data: snapshot.exists()
            ? (snapshot.data() as ChildCourseProgressProjection)
            : null,
          loading: false,
          error: null,
        });
      },
      (error) => {
        setState({
          key: projectionKey,
          data: null,
          loading: false,
          error: error?.message || 'Unable to load course progress.',
        });
      },
    );
  }, [normalizedCourseId, normalizedKidId, projectionKey]);

  return useMemo(() => {
    if (!projectionKey || state.key !== projectionKey) {
      return { data: null, loading: Boolean(projectionKey), error: null };
    }
    return { data: state.data, loading: state.loading, error: state.error };
  }, [projectionKey, state]);
}
