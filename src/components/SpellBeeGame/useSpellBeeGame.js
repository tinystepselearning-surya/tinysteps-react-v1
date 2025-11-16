import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../lib/firebaseConfig';
import { getAdaptiveSettings, getFallbackWords } from './spellbeeWordData';

function levenshtein(a = '', b = '') {
  const s = a.toLowerCase();
  const t = b.toLowerCase();
  const m = s.length;
  const n = t.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function buildLocalFeedback(correctWord, studentAnswer) {
  const dist = levenshtein(correctWord, studentAnswer);
  const isCorrect = dist === 0;
  const almost = dist === 1;
  if (isCorrect) {
    return {
      correct: true,
      feedback: `✅ Great job! "${studentAnswer}" is correct.`,
      tip: 'Keep sounding out each letter.',
      encouragement: 'Awesome spelling!',
      explanation: 'Exact match.',
      score: 100,
      fallback: true,
    };
  }
  if (almost) {
    return {
      correct: false,
      feedback: `🤔 Almost! "${studentAnswer}" is close.`,
      tip: `Check the letters: ${correctWord}`,
      encouragement: 'One tiny tweak and you got it!',
      explanation: 'One letter off.',
      score: 70,
      fallback: true,
    };
  }
  return {
    correct: false,
    feedback: `💡 The correct spelling is "${correctWord}".`,
    tip: `Sound it out: ${correctWord.split('').join('-')}`,
    encouragement: 'Keep practicing—you’re improving!',
    explanation: 'Multiple letters differ.',
    score: 50,
    fallback: true,
  };
}

export function useSpellBeeGame(userId) {
  const [state, setState] = useState({
    loading: false,
    error: '',
    words: [],
    gameId: null,
    index: 0,
    score: 0,
    streak: 0,
    attempts: 0,
    results: [],
    difficulty: 'medium',
    adaptive: getAdaptiveSettings([]),
  });

  const fallbackRegions = useRef([
    import.meta?.env?.VITE_FUNCTIONS_REGION,
    'us-central1',
    'asia-south1',
  ].filter(Boolean));

  const total = state.words.length;
  const current = useMemo(() => state.words[state.index] || null, [state.index, state.words]);

  const callCallable = useCallback(
    async (fnName, payload) => {
      let lastError = null;
      for (const region of fallbackRegions.current) {
        try {
          const client = getFunctions(app, region);
          const fn = httpsCallable(client, fnName);
          const resp = await fn(payload);
          return resp?.data || null;
        } catch (err) {
          lastError = err;
        }
      }
      if (lastError) throw lastError;
      throw new Error('Callable invocation failed');
    },
    []
  );

  const loadWords = useCallback(async () => {
    if (!userId) return;
    const adaptive = getAdaptiveSettings(state.results);
    const targetDifficulty = adaptive.difficulty || 'medium';
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const data = await callCallable('generateSpellingWords', { userId, difficulty: targetDifficulty });
      const difficulty = data.difficulty || targetDifficulty;
      setState((s) => ({
        ...s,
        loading: false,
        words: data.words || [],
        gameId: data.gameId || null,
        index: 0,
        score: 0,
        streak: 0,
        attempts: 0,
        results: [],
        difficulty,
        adaptive,
      }));
    } catch (err) {
      const fallbackWords = getFallbackWords('level1', targetDifficulty);
      setState((s) => ({
        ...s,
        loading: false,
        error: 'Using offline word bank while AI is unavailable.',
        words: fallbackWords,
        gameId: null,
        index: 0,
        score: 0,
        streak: 0,
        attempts: 0,
        results: [],
        difficulty: targetDifficulty,
        adaptive,
      }));
    }
  }, [callCallable, state.results, userId]);

  useEffect(() => {
    loadWords();
  }, [loadWords]);

  const submitAnswer = useCallback(
    async (answer) => {
      if (!current || !userId) return null;
      setState((s) => ({ ...s, loading: true }));
      try {
        const data = await callCallable('gradeSpelling', {
          userId,
          correctWord: current.word,
          studentAnswer: answer,
          difficulty: state.difficulty,
          gameId: state.gameId,
        });
        const isCorrect = !!data.correct;
        setState((s) => {
          const nextScore = s.score + (isCorrect ? 10 : 0);
          const nextStreak = isCorrect ? s.streak + 1 : 0;
          const nextResults = [...s.results, { ...data, word: current.word }];
          const nextIndex = s.index + 1;
          return {
            ...s,
            loading: false,
            score: nextScore,
            streak: nextStreak,
            attempts: s.attempts + 1,
            results: nextResults,
            index: nextIndex,
          };
        });
        return data;
      } catch (err) {
        const dist = levenshtein(current.word, answer);
        const isCorrect = dist === 0;
        const feedback = buildLocalFeedback(current.word, answer);
        setState((s) => {
          const nextScore = s.score + (isCorrect ? 10 : 0);
          const nextStreak = isCorrect ? s.streak + 1 : 0;
          const nextResults = [...s.results, { ...feedback, word: current.word }];
          const nextIndex = s.index + 1;
          return {
            ...s,
            loading: false,
            score: nextScore,
            streak: nextStreak,
            attempts: s.attempts + 1,
            results: nextResults,
            index: nextIndex,
            error: s.error || 'AI grader unavailable — using local check.',
          };
        });
        return feedback;
      }
    },
    [callCallable, current, state.difficulty, userId]
  );

  const resetGame = useCallback(() => {
    loadWords();
  }, [loadWords]);

  const isGameOver = state.index >= total && total > 0;

  return {
    loading: state.loading,
    error: state.error,
    currentWord: current,
    score: state.score,
    streak: state.streak,
    attempts: state.attempts,
    difficulty: state.difficulty,
    adaptive: state.adaptive,
    index: state.index,
    total,
    results: state.results,
    isGameOver,
    submitAnswer,
    resetGame,
  };
}

export default useSpellBeeGame;
