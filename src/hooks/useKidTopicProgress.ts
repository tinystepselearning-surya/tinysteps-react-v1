// src/hooks/useKidTopicProgress.ts
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';

export interface KidTopicProgress {
  id: string;
  topicName?: string;
  area?: string;
  subskill?: string;
  mastery?: number | null;
  masteryKey?: string | null;
  masteryPct?: number | null;
  scoreBand?: string | null;
  lastEvidence?: string | null;
  nextAction?: string | null;
  teacherRemark?: string | null;
  updatedAt?: any;
  // keep any extra fields from Firestore
  [key: string]: any;
}

interface UseKidTopicProgressResult {
  topics: KidTopicProgress[];
  loading: boolean;
  error: string | null;
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

/**
 * Hook: read /students/{kidId}/progress/{topicId} docs.
 *
 * IMPORTANT: this hook is always called, even if kidId is null.
 * When kidId is null, we simply clear topics and skip Firestore.
 */
export function useKidTopicProgress(
  kidId: string | null | undefined,
): UseKidTopicProgressResult {
  const [topics, setTopics] = useState<KidTopicProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // No kid selected → reset state, no request
    if (!kidId) {
      setTopics([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const progressCol = collection(db, 'students', kidId, 'progress');
        const snap = await getDocs(progressCol);
        if (cancelled) return;

        const arr: KidTopicProgress[] = snap.docs.map((d) => {
          const data = d.data() as any;
          const masteryNorm = normalizeMastery(data.mastery);

          return {
            // Spread raw Firestore data *first* so our computed fields win
            ...data,
            id: d.id,
            topicName: data.topicName ?? data.name ?? d.id,
            area: data.area,
            subskill: data.subskill,
            mastery: masteryNorm.masteryPct,
            masteryKey: masteryNorm.masteryKey,
            masteryPct: masteryNorm.masteryPct,
            scoreBand: data.scoreBand ?? null,
            lastEvidence: data.lastEvidence ?? null,
            nextAction: data.nextAction ?? null,
            teacherRemark: data.teacherRemark ?? null,
            updatedAt: data.updatedAt ?? null,
          };
        });

        setTopics(arr);
      } catch (err: any) {
        if (cancelled) return;
        console.error('[useKidTopicProgress] Firestore error', err);
        setTopics([]);
        setError(err?.message ?? String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [kidId]);

  return { topics, loading, error };
}
