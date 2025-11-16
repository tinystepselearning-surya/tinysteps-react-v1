import { useCallback, useEffect, useMemo, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from 'firebase/firestore';
import { app, db } from '../../lib/firebaseConfig';

// Whitelisted CVC words built from SATPIN set
export const PRACTICE_WORDS = [
  'sat',
  'pin',
  'sit',
  'tap',
  'pat',
  'nap',
  'tan',
  'pan',
  'tin',
  'sip',
  'sap',
  'pit',
  'tip',
  'nit',
  'sin',
];

const DAILY_LIMIT = 10;
const functionsClient = getFunctions(app, 'us-central1');
const generateAIResponse = httpsCallable(functionsClient, 'generateAIResponse');

const fallbackMessage = 'Practice Buddy is taking a break. Try again in a minute!';

const getStartAndEndOfDay = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

const buildPrompt = (word) =>
  [
    `Create a kid-friendly phonics lesson for the word: ${word}`,
    'Include:',
    "- Sound breakdown (onset-nucleus-coda): c-a-t = /k/ /æ/ /t/",
    "- Example sentence: 'The cat sits on the mat.'",
    '- Picture hint: (simple emoji or text description)',
    "- Fun tip: 'Listen to the /c/ sound at the start!'",
    'Keep it simple for 6-year-olds. Use emoji where helpful.',
  ].join('\n');

export function usePracticeBuddy(studentId) {
  const [selectedWord, setSelectedWord] = useState(PRACTICE_WORDS[0]);
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tokensUsed, setTokensUsed] = useState(null);
  const [todayCount, setTodayCount] = useState(0);
  const [lastDurationMs, setLastDurationMs] = useState(null);

  const todayRange = useMemo(() => {
    const { start, end } = getStartAndEndOfDay();
    return {
      start: Timestamp.fromDate(start),
      end: Timestamp.fromDate(end),
    };
  }, []);

  const loadTodayCount = useCallback(async () => {
    if (!studentId) return;
    const historyRef = collection(db, 'student-ai-history');
    const q = query(
      historyRef,
      where('studentId', '==', studentId),
      where('timestamp', '>=', todayRange.start),
      where('timestamp', '<', todayRange.end),
      where('feature', '==', 'practice-buddy')
    );
    const snapshot = await getDocs(q);
    setTodayCount(snapshot.size);
  }, [studentId, todayRange.end, todayRange.start]);

  useEffect(() => {
    loadTodayCount().catch(() => {
      // Suppress load errors to avoid blocking UI
    });
  }, [loadTodayCount]);

  const practiceWord = useCallback(
    async (word) => {
      setError('');
      if (!studentId) {
        setError('No student selected.');
        return;
      }
      if (!PRACTICE_WORDS.includes(word)) {
        setError('Please pick a word from the CVC list.');
        return;
      }
      if (todayCount >= DAILY_LIMIT) {
        setError('Daily limit reached. Come back tomorrow for more practice!');
        return;
      }

      const prompt = buildPrompt(word);
      setLoading(true);
      const start = Date.now();

      try {
        const response = await generateAIResponse({
          prompt,
          studentId,
          featureType: 'practice-buddy',
        });

        const data = response?.data || {};
        const resultText = data.response || '';
        const tokenCount = data.tokens_used ?? data.tokensUsed ?? null;
        const durationMs = Date.now() - start;

        setAiResponse(resultText);
        setTokensUsed(tokenCount);
        setLastDurationMs(durationMs);

        // Log to Firestore for history + analytics
        await addDoc(collection(db, 'student-ai-history'), {
          studentId,
          feature: 'practice-buddy',
          word,
          prompt,
          response: resultText,
          rating: null,
          tokensUsed: tokenCount,
          durationMs,
          timestamp: serverTimestamp(),
        });

        setTodayCount((prev) => prev + 1);
      } catch (err) {
        console.error('Practice buddy error', err);
        setError(
          err?.message ||
            err?.code ||
            err?.response?.data?.message ||
            fallbackMessage
        );
        setAiResponse(fallbackMessage);
      } finally {
        setLoading(false);
      }
    },
    [studentId, todayCount]
  );

  const pickRandomWord = useCallback(() => {
    const next = PRACTICE_WORDS[Math.floor(Math.random() * PRACTICE_WORDS.length)];
    setSelectedWord(next);
    setAiResponse('');
    setError('');
  }, []);

  return {
    selectedWord,
    setSelectedWord,
    aiResponse,
    tokensUsed,
    loading,
    error,
    todayCount,
    lastDurationMs,
    practiceWord,
    pickRandomWord,
    wordList: PRACTICE_WORDS,
  };
}
