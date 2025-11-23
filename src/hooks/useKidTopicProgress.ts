// src/hooks/useKidTopicProgress.ts
import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';

export interface KidTopicProgress {
  id: string; // topicId (document ID)
  topicName: string;
  area: string; // phonics / grammar / speaking / etc.
  subskill?: string | null;
  mastery?: string | null; // not_started / emerging / developing / proficient / mastered
  scoreBand?: string | null; // e.g. "0–20", "21–40"
  lastEvidence?: string | null; // worksheet / game / oral / assignment
  nextAction?: string | null; // practice / reteach / advance
  teacherRemark?: string | null;
  updatedAt?: Date | null;
}

interface UseKidTopicProgressResult {
  topics: KidTopicProgress[];
  loading: boolean;
  error: string | null;
}

function mapDocToTopic(
  docSnap: QueryDocumentSnapshot<DocumentData>,
): KidTopicProgress {
  const data = docSnap.data() || {};

  return {
    id: docSnap.id,
    topicName:
      data.topicName ||
      data.topic ||
      data.subtopic ||
      'Unnamed topic',
    area: data.area || 'phonics',
    subskill: data.subskill ?? null,
    mastery: data.mastery ?? 'not_started',
    scoreBand: data.scoreBand ?? null,
    lastEvidence: data.lastEvidence ?? null,
    nextAction: data.nextAction ?? null,
    teacherRemark: data.teacherRemark ?? null,
    updatedAt:
      typeof data.updatedAt?.toDate === 'function'
        ? data.updatedAt.toDate()
        : null,
  };
}

/**
 * Reads topic-wise progress from:
 *   /students/{kidId}/progress/{topicId}
 */
export function useKidTopicProgress(
  kidId?: string | null,
): UseKidTopicProgressResult {
  const [topics, setTopics] = useState<KidTopicProgress[]>([]);
  const [loading, setLoading] = useState<boolean>(!!kidId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!kidId) {
      setTopics([]);
      setLoading(false);
      setError(null);
      return;
    }

    const progressRef = collection(db, 'students', kidId, 'progress');
    const q = query(progressRef, orderBy('updatedAt', 'desc'));

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => mapDocToTopic(d));
        setTopics(items);
        setLoading(false);
      },
      (err) => {
        setTopics([]);
        setLoading(false);
        setError(err?.message || String(err));
      },
    );

    return () => {
      unsubscribe();
    };
  }, [kidId]);

  return { topics, loading, error };
}
