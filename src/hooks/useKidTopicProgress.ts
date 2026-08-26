import { useCallback, useEffect, useRef, useState } from 'react';
import { collection, documentId, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';
import {
  deriveLegacyProgressFromRatings,
  hasExplicitProgressRatings,
  normalizeProgressRatings,
  normalizeProgressSkillsMeta,
  type ProgressRatings,
} from '../lib/skillRatings';
import {
  LEGACY_PROGRESS_SKILLS,
  progressSkillsFromRatingKeys,
  type ProgressSkillDefinition,
} from '../lib/progressSkills';

export interface KidTopicProgress {
  id: string;
  topicName?: string;
  area?: string;
  subskill?: string;
  mastery?: number | string | null;
  masteryKey?: string | null;
  masteryPct?: number | null;
  progressRatings?: ProgressRatings;
  progressSkillsMeta?: ProgressSkillDefinition[];
  skillRatings?: ProgressRatings;
  scoreBand?: string | null;
  lastEvidence?: string | null;
  nextAction?: string | null;
  teacherRemark?: string | null;
  updatedAt?: any;
  [key: string]: any;
}

interface UseKidTopicProgressResult {
  topics: KidTopicProgress[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  upsertLocalTopic: (topic: KidTopicProgress) => void;
}

const MASTERY_LEVELS: { key: string; pct: number }[] = [
  { key: 'not_started', pct: 0 },
  { key: 'emerging', pct: 25 },
  { key: 'developing', pct: 50 },
  { key: 'proficient', pct: 75 },
  { key: 'mastered', pct: 100 },
];

const MASTERY_KEYS = new Set(MASTERY_LEVELS.map((l) => l.key));

function normalizeMastery(value: any): { masteryKey: string; masteryPct: number } {
  const raw = String(value ?? '').toLowerCase().trim();

  if (MASTERY_KEYS.has(raw)) {
    const level = MASTERY_LEVELS.find((l) => l.key === raw)!;
    return { masteryKey: level.key, masteryPct: level.pct };
  }

  if (raw === 'not started') {
    return { masteryKey: 'not_started', masteryPct: 0 };
  }

  const num =
    typeof value === 'number' && Number.isFinite(value)
      ? value
      : Number.isFinite(Number(raw))
        ? Number(raw)
        : null;

  if (num == null) {
    return { masteryKey: 'not_started', masteryPct: 0 };
  }

  let best = MASTERY_LEVELS[0];
  let bestDiff = Math.abs(num - best.pct);

  for (const level of MASTERY_LEVELS) {
    const diff = Math.abs(num - level.pct);
    if (diff < bestDiff) {
      best = level;
      bestDiff = diff;
    }
  }

  return { masteryKey: best.key, masteryPct: best.pct };
}

function normalizeProgressRecord(id: string, data: any): KidTopicProgress {
  const progressSkillsMeta = normalizeProgressSkillsMeta(data.progressRatingsMeta);

  const resolvedArea =
    data.area === 'phonics' || data.area === 'grammar' || data.area === 'speaking'
      ? data.area
      : 'general';

  const resolvedSkills =
    progressSkillsMeta.length > 0
      ? progressSkillsMeta
      : hasExplicitProgressRatings(data.progressRatings)
        ? progressSkillsFromRatingKeys(Object.keys(data.progressRatings), resolvedArea)
        : hasExplicitProgressRatings(data.skillRatings)
          ? LEGACY_PROGRESS_SKILLS
          : [];

  const progressRatings = normalizeProgressRatings(data.progressRatings, resolvedSkills, {
    legacyRatings: data.skillRatings,
    mastery: data.mastery,
    checks: data.checks,
  });

  const legacyFromRatings = deriveLegacyProgressFromRatings(
    progressRatings,
    resolvedSkills.length > 0 ? resolvedSkills : LEGACY_PROGRESS_SKILLS,
  );

  const masteryNorm =
    hasExplicitProgressRatings(data.progressRatings) || hasExplicitProgressRatings(data.skillRatings)
      ? {
          masteryKey: legacyFromRatings.masteryKey,
          masteryPct: legacyFromRatings.masteryPct,
        }
      : normalizeMastery(data.mastery);

  return {
    ...data,
    id,
    topicName: data.topicName ?? data.name ?? id,
    area: data.area,
    subskill: data.subskill,
    progressRatings,
    progressSkillsMeta,
    skillRatings: progressRatings,
    mastery: masteryNorm.masteryPct,
    masteryKey: masteryNorm.masteryKey,
    masteryPct: masteryNorm.masteryPct,
    scoreBand: data.scoreBand ?? null,
    lastEvidence: data.lastEvidence ?? null,
    nextAction: data.nextAction ?? null,
    teacherRemark: data.teacherRemark ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

function mapProgressDoc(d: any): KidTopicProgress {
  return normalizeProgressRecord(d.id, d.data() as any);
}

function teacherTopicCacheKey(
  kidId: string,
  courseId: string,
  enrollmentId: string,
  topicId: string,
): string {
  return [kidId, courseId, enrollmentId, topicId].join('::');
}

export function useKidTopicProgress(
  kidId: string | null | undefined,
  courseId?: string | null,
  enabled = true,
  enrollmentId?: string | null,
  topicId?: string | null,
): UseKidTopicProgressResult {
  const [topics, setTopics] = useState<KidTopicProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestVersionRef = useRef(0);
  const teacherTopicCacheRef = useRef<Map<string, KidTopicProgress | null>>(new Map());

  const loadProgress = useCallback(async (bypassCache = false) => {
    const requestVersion = requestVersionRef.current + 1;
    requestVersionRef.current = requestVersion;
    const normalizedCourseId = String(courseId || '').trim();
    const normalizedEnrollmentId = String(enrollmentId || '').trim();
    const normalizedTopicId = String(topicId || '').trim();
    const requiresCourseScope = courseId !== undefined;
    const requiresEnrollmentScope = enrollmentId !== undefined;
    const requiresTopicScope = topicId !== undefined;
    if (
      !kidId
      || !enabled
      || (requiresCourseScope && !normalizedCourseId)
      || (requiresEnrollmentScope && !normalizedEnrollmentId)
      || (requiresTopicScope && !normalizedTopicId)
    ) {
      setTopics([]);
      setLoading(false);
      setError(null);
      return;
    }

    const isTeacherTopicScoped = Boolean(
      normalizedCourseId && normalizedEnrollmentId && normalizedTopicId,
    );
    const cacheKey = isTeacherTopicScoped
      ? teacherTopicCacheKey(
          kidId,
          normalizedCourseId,
          normalizedEnrollmentId,
          normalizedTopicId,
        )
      : null;

    if (!bypassCache && cacheKey && teacherTopicCacheRef.current.has(cacheKey)) {
      const cached = teacherTopicCacheRef.current.get(cacheKey) ?? null;
      if (requestVersion !== requestVersionRef.current) return;
      setTopics(cached ? [cached] : []);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    if (isTeacherTopicScoped) setTopics([]);

    try {
      const progressCol = collection(db, 'students', kidId, 'progress');
      const progressQuery = normalizedCourseId
        ? normalizedEnrollmentId
          ? normalizedTopicId
            ? query(
                progressCol,
                where('courseId', '==', normalizedCourseId),
                where('enrollmentId', '==', normalizedEnrollmentId),
                where(documentId(), '==', normalizedTopicId),
              )
            : query(
                progressCol,
                where('courseId', '==', normalizedCourseId),
                where('enrollmentId', '==', normalizedEnrollmentId),
              )
          : query(progressCol, where('courseId', '==', normalizedCourseId))
        : progressCol;
      const snap = await getDocs(progressQuery);

      const arr: KidTopicProgress[] = snap.docs.map(mapProgressDoc);
      if (cacheKey) {
        const selected = arr.find((entry) => entry.id === normalizedTopicId) ?? null;
        teacherTopicCacheRef.current.set(cacheKey, selected);
      }
      if (requestVersion !== requestVersionRef.current) return;
      setTopics(cacheKey ? arr.filter((entry) => entry.id === normalizedTopicId) : arr);
      setError(null);
    } catch (err: any) {
      if (requestVersion !== requestVersionRef.current) return;
      console.error('[useKidTopicProgress] Firestore error', err);
      setTopics([]);
      setError(err?.message ?? String(err));
    } finally {
      if (requestVersion === requestVersionRef.current) setLoading(false);
    }
  }, [courseId, enabled, enrollmentId, kidId, topicId]);

  useEffect(() => {
    void loadProgress();
    return () => {
      requestVersionRef.current += 1;
    };
  }, [loadProgress]);

  const upsertLocalTopic = useCallback((topic: KidTopicProgress) => {
    const normalized = normalizeProgressRecord(topic.id, topic);
    const normalizedCourseId = String(courseId || '').trim();
    const normalizedEnrollmentId = String(enrollmentId || '').trim();
    if (kidId && normalizedCourseId && normalizedEnrollmentId && topic.id) {
      const cacheKey = teacherTopicCacheKey(
        kidId,
        normalizedCourseId,
        normalizedEnrollmentId,
        topic.id,
      );
      teacherTopicCacheRef.current.set(cacheKey, normalized);
    }
    setTopics((current) => {
      const next = current.filter((entry) => entry.id !== topic.id);
      next.push(normalized);
      return next;
    });
  }, [courseId, enrollmentId, kidId]);

  // Enrollment-scoped teacher editors must never become editable after a failed read.
  // Keep the existing error visible while holding their editability gate closed.
  const failClosed = enrollmentId !== undefined && Boolean(error);

  return {
    topics,
    loading: loading || failClosed,
    error,
    refresh: () => loadProgress(true),
    upsertLocalTopic,
  };
}
