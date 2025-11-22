import { useCallback, useEffect, useMemo, useState } from 'react';
import { httpsCallable, getFunctions } from 'firebase/functions';
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
  addDoc,
} from 'firebase/firestore';
import { app, db } from '../../lib/firebaseConfig';

/* global setTimeout */

const functionsClient = getFunctions(app, 'us-central1');
const generateDailyPractice = httpsCallable(functionsClient, 'generateDailyPractice');

const todayKey = () => new Date().toISOString().slice(0, 10);

export function useDailyPractice(studentId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exercises, setExercises] = useState([]);
  const [current, setCurrent] = useState(0);
  const [attempts, setAttempts] = useState({});
  const [result, setResult] = useState(null);
  const [completed, setCompleted] = useState(false);

  const currentExercise = exercises[current] || null;
  const total = exercises.length;
  const score = useMemo(() => {
    const correct = Object.values(attempts).filter((a) => a.correct).length;
    return { correct, total };
  }, [attempts]);

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError('');
    try {
      const q = query(
        collection(db, 'daily-practice'),
        where('studentId', '==', studentId),
        where('dateKey', '==', todayKey()),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docData = snap.docs[0].data();
        setExercises(docData.exercises || []);
        setCompleted(!!docData.completed);
        setCurrent(0);
        return;
      }
      const resp = await generateDailyPractice({
        studentId,
        level: 'early-primary',
        recentHistory: [],
        focusArea: 'mixed',
      });
      const data = resp?.data || {};
      const list = data.exercises || [];
      const id = data.id || null;
      setExercises(list);
      setCurrent(0);
      if (id) {
        await setDoc(doc(db, 'daily-practice', id), {
          studentId,
          dateKey: todayKey(),
          exercises: list,
          totalExercises: list.length,
          completed: false,
          score: null,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      setError(err?.message || 'Failed to load practice');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const logAttempt = useCallback(
    async ({ idx, attempt, correct }) => {
      try {
        await addDoc(collection(db, 'student-daily-practice-log'), {
          studentId,
          dateKey: todayKey(),
          exerciseIndex: idx,
          attempt,
          correct,
          timestamp: serverTimestamp(),
        });
      } catch (_err) {
        // non-blocking
      }
    },
    [studentId]
  );

  const answer = useCallback(
    async (choice) => {
      if (!currentExercise) return;
      const already = attempts[current] || { tries: 0 };
      if (already.correct || already.tries >= 2) return;

      const isCorrect = currentExercise.answer?.trim().toLowerCase() === choice.trim().toLowerCase();
      const newEntry = {
        tries: already.tries + 1,
        correct: already.correct || isCorrect,
        lastChoice: choice,
      };
      setAttempts((prev) => ({ ...prev, [current]: newEntry }));
      await logAttempt({ idx: current, attempt: choice, correct: isCorrect });

      setResult({
        correct: isCorrect,
        explanation: currentExercise.explanation,
        answer: currentExercise.answer,
      });

      if (isCorrect || newEntry.tries >= 2) {
        const next = current + 1;
        if (next < total) {
          setTimeout(() => {
            setResult(null);
            setCurrent(next);
          }, 1200);
        } else {
          setCompleted(true);
          try {
            const docId = await persistSummary(score.correct + (isCorrect ? 1 : 0));
            if (docId) {
              await setDoc(
                doc(db, 'daily-practice', docId),
                { completed: true, score: ((score.correct + (isCorrect ? 1 : 0)) / total) * 100 },
                { merge: true }
              );
            }
          } catch (_err) {
            /* ignore */
          }
        }
      }
    },
    [attempts, current, currentExercise, logAttempt, score.correct, total]
  );

  const persistSummary = useCallback(
    async (correctCount) => {
      try {
        const practiceQuery = query(
          collection(db, 'daily-practice'),
          where('studentId', '==', studentId),
          where('dateKey', '==', todayKey()),
          limit(1)
        );
        const snap = await getDocs(practiceQuery);
        let docId = null;
        if (!snap.empty) docId = snap.docs[0].id;
        await addDoc(collection(db, 'practice-history'), {
          studentId,
          date: serverTimestamp(),
          exercisesCompleted: total,
          totalScore: Math.round((correctCount / total) * 100),
          strengths: [],
          weaknesses: [],
          trend: 'stable',
          createdAt: serverTimestamp(),
        });
        return docId;
      } catch (_err) {
        return null;
      }
    },
    [studentId, total]
  );

  const skip = useCallback(() => {
    setResult(null);
    setCurrent((prev) => Math.min(prev + 1, total - 1));
  }, [total]);

  return {
    loading,
    error,
    exercises,
    currentExercise,
    currentIndex: current,
    total,
    answer,
    result,
    skip,
    completed,
    score,
    reload: load,
  };
}

export default useDailyPractice;
