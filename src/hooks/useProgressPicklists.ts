// src/hooks/useProgressPicklists.ts
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';

export type TopicArea = 'phonics' | 'grammar' | 'speaking' | string;

export interface TopicDefinition {
  id: string;
  label: string;
  area: TopicArea;
  subskills?: string[];
}

export interface ProgressPicklists {
  topics: TopicDefinition[];
  mastery: string[];
  scoreBands: string[];
  lastEvidence: string[];
  nextActions: string[];
}

interface UseProgressPicklistsResult {
  config: ProgressPicklists | null;
  loading: boolean;
  error: string | null;
}

/**
 * Reads shared picklists from:
 *   /config/picklists
 */
export function useProgressPicklists(): UseProgressPicklistsResult {
  const [config, setConfig] = useState<ProgressPicklists | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ref = doc(db, 'config', 'picklists');

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setConfig({
            topics: [],
            mastery: [],
            scoreBands: [],
            lastEvidence: [],
            nextActions: [],
          });
          setLoading(false);
          return;
        }

        const data = snap.data() || {};
        const rawTopics = Array.isArray(data.topics) ? data.topics : [];

        const topics: TopicDefinition[] = rawTopics.map((t: any) => ({
          id: String(t.id ?? ''),
          label: String(
            t.label ?? t.topicName ?? t.name ?? 'Untitled topic',
          ),
          area: (t.area as TopicArea) ?? 'phonics',
          subskills: Array.isArray(t.subskills)
            ? t.subskills.map((s: any) => String(s))
            : [],
        }));

        setConfig({
          topics,
          mastery: Array.isArray(data.mastery)
            ? data.mastery.map((m: any) => String(m))
            : [],
          scoreBands: Array.isArray(data.scoreBands)
            ? data.scoreBands.map((s: any) => String(s))
            : [],
          lastEvidence: Array.isArray(data.lastEvidence)
            ? data.lastEvidence.map((e: any) => String(e))
            : [],
          nextActions: Array.isArray(data.nextActions)
            ? data.nextActions.map((n: any) => String(n))
            : [],
        });

        setLoading(false);
      },
      (err) => {
        setConfig(null);
        setLoading(false);
        setError(err?.message || String(err));
      },
    );

    return () => unsubscribe();
  }, []);

  return { config, loading, error };
}
