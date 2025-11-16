import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSpellBeeGame from './useSpellBeeGame';
import GameHeader from './GameHeader';
import WordCard from './WordCard';
import SpellingInput from './SpellingInput';
import FeedbackAnimation from './FeedbackAnimation';
import ScoreBoard from './ScoreBoard';
import GameOver from './GameOver';

export default function SpellBeeGame({ userId }) {
  const {
    loading,
    error,
    currentWord,
    score,
    streak,
    attempts,
    difficulty,
    index,
    total,
    results,
    isGameOver,
    submitAnswer,
    resetGame,
  } = useSpellBeeGame(userId);

  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    setFeedback(null);
    setAnswer('');
  }, [currentWord]);

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    const resp = await submitAnswer(answer.trim());
    if (resp) setFeedback(resp);
  };

  const speak = () => {
    if (!currentWord) return;
    if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(currentWord.word);
      utter.rate = 0.9;
      utter.pitch = 1;
      window.speechSynthesis.speak(utter);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <GameHeader score={score} streak={streak} index={index} total={total} onReset={resetGame} />

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">{error}</div>}

      <ScoreBoard score={score} streak={streak} attempts={attempts} total={total} />

      <AnimatePresence mode="wait">
        {!isGameOver && currentWord && (
          <motion.div key={currentWord.word} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <WordCard word={currentWord.word} pronunciation={currentWord.pronunciation} hint={currentWord.hint} onSpeak={speak} />
            <div className="mt-4 space-y-3">
              <SpellingInput value={answer} onChange={setAnswer} onSubmit={handleSubmit} disabled={loading} />
              <FeedbackAnimation correct={feedback?.correct} feedback={feedback?.feedback} tip={feedback?.tip} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isGameOver && (
        <GameOver score={score} results={results} onPlayAgain={resetGame} />
      )}

      <div className="text-xs text-gray-500">
        Difficulty: {difficulty}. Words left: {Math.max(total - index, 0)}. Powered by Groq SpellBee.
      </div>
    </div>
  );
}
