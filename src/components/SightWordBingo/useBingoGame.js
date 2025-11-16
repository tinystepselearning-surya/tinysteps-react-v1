import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import callFunction from '../../lib/callFunctions';
import { db } from '../../lib/firebaseConfig';
import { buildBingoCard, buildClues, getBingoAdaptiveSettings } from './sightWordData';

export function useBingoGame({ roomId, userId, difficulty = 'medium' }) {
  const [card, setCard] = useState([]);
  const [clues, setClues] = useState([]);
  const [words, setWords] = useState([]);
  const [calledIndex, setCalledIndex] = useState(0);
  const [marks, setMarks] = useState({});
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history] = useState([]); // placeholder for adaptive signal

  const roomRef = roomId ? doc(db, 'bingo-rooms', roomId) : null;

  const loadOrCreateRoom = useCallback(async () => {
    if (!roomRef) return;
    setLoading(true);
    setError('');
    const unsub = onSnapshot(roomRef, async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCard(data.card || []);
        setClues(data.clues || []);
        setWords(data.words || []);
        setCalledIndex(data.calledIndex || 0);
        setWinner(data.winner || null);
        setLoading(false);
      } else {
        try {
          const adaptive = getBingoAdaptiveSettings(history);
          let data = null;
          try {
            data = await callFunction('generateBingoCard', { difficulty: adaptive.difficulty });
          } catch (_) {
            // fall back below
          }
          const cardData = data?.card || buildBingoCard(adaptive.level, history);
          const cluesData = data?.clues || buildClues(cardData, adaptive.difficulty, adaptive.level);
          const wordsData = data?.words || cardData.flat().filter((w) => w !== 'FREE');
          await setDoc(roomRef, {
            card: cardData,
            clues: cluesData,
            words: wordsData,
            calledIndex: 0,
            winner: null,
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          setError(err?.message || 'Could not generate bingo card');
          setLoading(false);
        }
      }
    });
    return unsub;
  }, [difficulty, roomRef]);

  useEffect(() => {
    let unsub;
    loadOrCreateRoom().then((u) => (unsub = u));
    return () => {
      if (unsub) unsub();
    };
  }, [loadOrCreateRoom]);

  const currentClue = useMemo(() => clues[calledIndex] || null, [clues, calledIndex]);

  const markWord = useCallback(
    async (word) => {
      setMarks((m) => ({ ...m, [word]: true }));
      // No server write for marks; keep client-side. Winner detected locally.
    },
    []
  );

  const callNext = useCallback(async () => {
    if (!roomRef) return;
    try {
      await updateDoc(roomRef, { calledIndex: calledIndex + 1 });
    } catch (err) {
      setError(err?.message || 'Could not call next clue');
    }
  }, [calledIndex, roomRef]);

  const declareWinner = useCallback(
    async (user) => {
      if (!roomRef) return;
      try {
        await updateDoc(roomRef, { winner: user });
      } catch (err) {
        // ignore
      }
    },
    [roomRef]
  );

  return {
    card,
    clues,
    words,
    currentClue,
    calledIndex,
    marks,
    winner,
    loading,
    error,
    markWord,
    callNext,
    declareWinner,
  };
}

export default useBingoGame;
