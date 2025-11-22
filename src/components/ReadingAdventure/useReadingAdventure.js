import { useCallback, useEffect, useState } from 'react';
import callFunction from '../../lib/callFunctions';
import { buildOfflineChapter, nextLevelKey } from './readingData';

export function useReadingAdventure({ bookId = 'default-book', readingLevel = 'early-primary' }) {
  const [chapterNumber, setChapterNumber] = useState(1);
  const [chapter, setChapter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  const loadChapter = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const lvlKey = readingLevel.startsWith('level') ? readingLevel : 'levelA';
      const data = await callFunction('generateReadingChapter', { bookId, chapterNumber, readingLevel: lvlKey });
      setChapter(data || null);
    } catch (err) {
      const lvlKey = readingLevel.startsWith('level') ? readingLevel : 'levelA';
      setChapter(buildOfflineChapter(lvlKey));
      const msg =
        err?.code === 'functions/unauthenticated' || /unauth/i.test(String(err?.message || ''))
          ? 'Please sign in to use AI reading adventure. Showing offline chapter instead.'
          : err?.message || 'Using offline chapter while AI is unavailable.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [bookId, chapterNumber, readingLevel]);

  useEffect(() => {
    loadChapter();
  }, [loadChapter]);

  const answer = useCallback(
    (choice) => {
      if (!chapter) return;
      const correct = choice === chapter.correctAnswer;
      setHistory((h) => [...h, { chapterNumber, choice, correct }]);
      if (correct) {
        const _nextLevel = nextLevelKey(chapter.level || readingLevel, [...history, { chapterNumber, choice, correct }]);
        setChapterNumber((n) => n + 1);
        // optionally adjust readingLevel to nextLevel for future fetches
      }
    },
    [chapter, chapterNumber, history, readingLevel]
  );

  return {
    chapterNumber,
    chapter,
    loading,
    error,
    history,
    answer,
    reload: loadChapter,
  };
}

export default useReadingAdventure;
