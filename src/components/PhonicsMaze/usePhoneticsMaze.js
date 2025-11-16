import { useCallback, useEffect, useMemo, useState } from 'react';
import callFunction from '../../lib/callFunctions';
import { getOfflineMaze, getPhonicsAdaptiveSettings } from './phonicsMazeData';

export function usePhoneticsMaze({ userId, difficulty = 'medium', focusTopic = 'CVC' }) {
  const [maze, setMaze] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [positionIndex, setPositionIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const [results, setResults] = useState([]);

  const correctPath = maze?.correctPath || [];
  const currentCell = correctPath[positionIndex] || null;

  const junctionsByPos = useMemo(() => {
    const map = {};
    (maze?.junctions || []).forEach((j) => {
      map[`${j.position[0]}-${j.position[1]}`] = j;
    });
    return map;
  }, [maze]);

  const currentJunction = currentCell ? junctionsByPos[`${currentCell[0]}-${currentCell[1]}`] : null;
  const isComplete = positionIndex >= correctPath.length - 1 && correctPath.length > 0;

  const loadMaze = useCallback(async () => {
    if (!userId) return;
    const adaptive = getPhonicsAdaptiveSettings(results);
    const targetLevel = adaptive.level === 1 ? 'level1' : adaptive.level === 2 ? 'level2' : 'level3';
    const targetDifficulty = adaptive.difficulty || difficulty;
    setLoading(true);
    setError('');
    try {
      const data = await callFunction('generateMaze', { difficulty: targetDifficulty, focusTopic });
      setMaze(data);
      setPositionIndex(0);
      setFeedback(null);
      setStartedAt(Date.now());
    } catch (err) {
      const fallback = getOfflineMaze(targetLevel);
      setMaze(fallback);
      setPositionIndex(0);
      setFeedback(null);
      setStartedAt(Date.now());
      setError('Using offline maze while AI is unavailable.');
    } finally {
      setLoading(false);
    }
  }, [difficulty, focusTopic, results, userId]);

  useEffect(() => {
    loadMaze();
  }, [loadMaze]);

  const answerJunction = useCallback(
    async (opt) => {
      if (!currentJunction || !maze?.mazeId) return;
      const wasCorrect = !!opt.correct;
      try {
        await callFunction('gradePhonicsJunction', {
          mazeId: maze.mazeId,
          userId,
          junctionIndex: positionIndex,
          correct: wasCorrect,
        });
      } catch (err) {
        // non-blocking
      }
      if (wasCorrect) {
        setFeedback({ correct: true, text: 'Great! Keep going.' });
        setPositionIndex((i) => i + 1);
      } else {
        setFeedback({ correct: false, text: 'Try again from the last junction.' });
        setPositionIndex((i) => Math.max(0, i - 1));
      }
      setResults((r) => [...r, { correct: wasCorrect }]);
    },
    [currentJunction, maze?.mazeId, positionIndex, userId]
  );

  return {
    maze,
    loading,
    error,
    currentCell,
    currentJunction,
    correctPath,
    positionIndex,
    isComplete,
    feedback,
    startedAt,
    answerJunction,
    reload: loadMaze,
  };
}

export default usePhoneticsMaze;
