import { useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

import { db } from '../lib/firebaseConfig';
import {
  normalizeBootstrapCourseId,
  requestCourseProgressBootstrap,
} from '../lib/parentCanonicalProjectionBootstrap';

export type ChildCourseProgressStageProjection = {
  key: string;
  label: string;
  order: number;
  totalTopics: number;
  completedTopics: number;
  inProgressTopics: number;
  notStartedTopics: number;
  completionPct: number;
};

export type ChildCourseProgressProjection = {
  schemaVersion?: number;
  modelType?: 'child_course_progress_v1' | 'child_course_progress_v2' | 'child_course_progress_v3' | string;
  completionAuthority?: 'teacher_lesson_status' | 'teacher_progress_save' | string;
  definitionStatus?: 'configured' | 'missing' | string;
  courseId?: string;
  courseLabel?: string | null;
  totalTopics?: number;
  completedTopics?: number;
  inProgressTopics?: number;
  notStartedTopics?: number;
  overallPct?: number;
  totalStages?: number;
  completedStages?: number;
  stageSummaries?: readonly ChildCourseProgressStageProjection[];
  latestTopicId?: string | null;
  latestTopicName?: string | null;
  latestLessonNumber?: number | null;
  latestMastery?: string | number | null;
  strengthHighlights?: readonly string[];
  practiceHighlights?: readonly string[];
  latestTeacherRemark?: string | null;
  recentUpdates?: readonly Record<string, unknown>[];
  lastUpdatedAtMs?: number | null;
  updatedAt?: unknown;
};

type ProjectionState = {
  key: string;
  kidId?: string;
  courseId?: string;
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

export function isCurrentChildCourseProgressProjection(
  projection: ChildCourseProgressProjection | null | undefined,
): boolean {
  return Boolean(
    projection &&
      projection.schemaVersion === 3 &&
      projection.modelType === 'child_course_progress_v3' &&
      projection.completionAuthority === 'teacher_progress_save',
  );
}

// ParentDashboard owns the primary live P3 listener for the active child. Overview and P6 can
// reuse that snapshot without opening duplicate listeners. P6 only opens a secondary listener
// when the parent explicitly selects a different enrolled course in Insights.
const latestProjectionByKid = new Map<string, ProjectionState>();
const latestProjectionSubscribers = new Set<() => void>();
let latestActiveKidId = '';

function publishLatestProjection(kidId: string, state: ProjectionState) {
  if (!kidId) return;
  latestActiveKidId = kidId;
  latestProjectionByKid.set(kidId, state);
  latestProjectionSubscribers.forEach((listener) => listener());
}

function requestRepairIfNeeded(
  kidId: string,
  courseId: string,
  raw: ChildCourseProgressProjection | null,
) {
  if (!isCurrentChildCourseProgressProjection(raw)) {
    void requestCourseProgressBootstrap(kidId, courseId).catch(() => undefined);
  }
}

export function useLatestChildCourseProgressProjection(
  kidId: string | null | undefined,
  enabled = true,
) {
  const normalizedKidId = String(kidId || '').trim();
  const [, setVersion] = useState(0);

  useEffect(() => {
    if (!enabled || !normalizedKidId) return undefined;
    const listener = () => setVersion((value) => value + 1);
    latestProjectionSubscribers.add(listener);
    return () => {
      latestProjectionSubscribers.delete(listener);
    };
  }, [enabled, normalizedKidId]);

  if (!enabled || !normalizedKidId) {
    return {
      data: null,
      loading: false,
      error: null,
      isLoading: false,
      isError: false,
      courseId: null as string | null,
    };
  }

  const state = latestProjectionByKid.get(normalizedKidId);
  if (!state) {
    return {
      data: null,
      loading: true,
      error: null,
      isLoading: true,
      isError: false,
      courseId: null as string | null,
    };
  }
  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    isLoading: state.loading,
    isError: Boolean(state.error),
    courseId: state.courseId || state.data?.courseId || null,
  };
}

/**
 * P6 bridge for the currently selected parent child.
 *
 * If Insights is showing the same course as ParentDashboard's primary P3 listener, this hook
 * reuses the in-memory state. A secondary Firestore listener is opened only when the parent
 * changes the Insights course selector to another course.
 */
export function useCurrentParentCourseProgressProjection(
  courseId: string | null | undefined,
  enabled = true,
) {
  const normalizedCourseId = normalizeBootstrapCourseId(String(courseId || '')) || '';
  const [, setVersion] = useState(0);
  const [secondaryState, setSecondaryState] = useState<ProjectionState>(EMPTY_STATE);

  useEffect(() => {
    if (!enabled || !normalizedCourseId) return undefined;
    const listener = () => setVersion((value) => value + 1);
    latestProjectionSubscribers.add(listener);
    return () => {
      latestProjectionSubscribers.delete(listener);
    };
  }, [enabled, normalizedCourseId]);

  const kidId = enabled ? latestActiveKidId : '';
  const primaryState = kidId ? latestProjectionByKid.get(kidId) : undefined;
  const primaryCourseId = normalizeBootstrapCourseId(
    String(primaryState?.courseId || primaryState?.data?.courseId || ''),
  ) || '';
  const reusePrimary = Boolean(kidId && normalizedCourseId && primaryCourseId === normalizedCourseId);
  const secondaryKey = enabled && kidId && normalizedCourseId && !reusePrimary
    ? `${kidId}::${normalizedCourseId}`
    : '';

  useEffect(() => {
    if (!secondaryKey) {
      setSecondaryState(EMPTY_STATE);
      return;
    }

    setSecondaryState({
      key: secondaryKey,
      kidId,
      courseId: normalizedCourseId,
      data: null,
      loading: true,
      error: null,
    });

    return onSnapshot(
      doc(db, 'students', kidId, 'courseProgress', normalizedCourseId),
      (snapshot) => {
        const raw = snapshot.exists()
          ? (snapshot.data() as ChildCourseProgressProjection)
          : null;
        requestRepairIfNeeded(kidId, normalizedCourseId, raw);
        setSecondaryState({
          key: secondaryKey,
          kidId,
          courseId: normalizedCourseId,
          data: raw ? { ...raw, courseId: raw.courseId || normalizedCourseId } : null,
          loading: false,
          error: null,
        });
      },
      (error) => {
        setSecondaryState({
          key: secondaryKey,
          kidId,
          courseId: normalizedCourseId,
          data: null,
          loading: false,
          error: error?.message || 'Unable to load course progress.',
        });
      },
    );
  }, [kidId, normalizedCourseId, secondaryKey]);

  if (!enabled || !normalizedCourseId) {
    return {
      data: null,
      loading: false,
      error: null,
      isLoading: false,
      isError: false,
    };
  }
  if (!kidId) {
    return {
      data: null,
      loading: true,
      error: null,
      isLoading: true,
      isError: false,
    };
  }
  if (reusePrimary && primaryState) {
    return {
      data: primaryState.data,
      loading: primaryState.loading,
      error: primaryState.error,
      isLoading: primaryState.loading,
      isError: Boolean(primaryState.error),
    };
  }
  if (!secondaryKey || secondaryState.key !== secondaryKey) {
    return {
      data: null,
      loading: true,
      error: null,
      isLoading: true,
      isError: false,
    };
  }
  return {
    data: secondaryState.data,
    loading: secondaryState.loading,
    error: secondaryState.error,
    isLoading: secondaryState.loading,
    isError: Boolean(secondaryState.error),
  };
}

export function useChildCourseProgressProjection(
  kidId: string | null | undefined,
  courseId: string | null | undefined,
  enabled = true,
) {
  const normalizedKidId = String(kidId || '').trim();
  const normalizedCourseId = normalizeBootstrapCourseId(String(courseId || '')) || '';
  const projectionKey = enabled && normalizedKidId && normalizedCourseId
    ? `${normalizedKidId}::${normalizedCourseId}`
    : '';
  const [state, setState] = useState<ProjectionState>(EMPTY_STATE);

  useEffect(() => {
    if (!projectionKey) {
      setState(EMPTY_STATE);
      return;
    }

    const loadingState: ProjectionState = {
      key: projectionKey,
      kidId: normalizedKidId,
      courseId: normalizedCourseId,
      data: null,
      loading: true,
      error: null,
    };
    setState(loadingState);
    publishLatestProjection(normalizedKidId, loadingState);

    return onSnapshot(
      doc(db, 'students', normalizedKidId, 'courseProgress', normalizedCourseId),
      (snapshot) => {
        const raw = snapshot.exists()
          ? (snapshot.data() as ChildCourseProgressProjection)
          : null;

        // Existing parents can hold a P3 V2 projection created under the superseded
        // lessonStatus completion rule. Request one bounded V3 rebuild whenever the row is
        // missing or stale; the backend rebuilds from the child's already-saved lesson docs.
        requestRepairIfNeeded(normalizedKidId, normalizedCourseId, raw);

        const data = raw
          ? { ...raw, courseId: raw.courseId || normalizedCourseId }
          : null;
        const nextState: ProjectionState = {
          key: projectionKey,
          kidId: normalizedKidId,
          courseId: normalizedCourseId,
          data,
          loading: false,
          error: null,
        };
        setState(nextState);
        publishLatestProjection(normalizedKidId, nextState);
      },
      (error) => {
        const nextState: ProjectionState = {
          key: projectionKey,
          kidId: normalizedKidId,
          courseId: normalizedCourseId,
          data: null,
          loading: false,
          error: error?.message || 'Unable to load course progress.',
        };
        setState(nextState);
        publishLatestProjection(normalizedKidId, nextState);
      },
    );
  }, [normalizedCourseId, normalizedKidId, projectionKey]);

  return useMemo(() => {
    if (!projectionKey || state.key !== projectionKey) {
      const loading = Boolean(projectionKey);
      return {
        data: null,
        loading,
        error: null,
        isLoading: loading,
        isError: false,
      };
    }
    return {
      data: state.data,
      loading: state.loading,
      error: state.error,
      isLoading: state.loading,
      isError: Boolean(state.error),
    };
  }, [projectionKey, state]);
}
