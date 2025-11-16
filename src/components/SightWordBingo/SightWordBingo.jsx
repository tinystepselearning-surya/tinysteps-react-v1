import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import useBingoGame from './useBingoGame';
import BingoCard from './BingoCard';
import ClueDisplay from './ClueDisplay';
import WinnerDisplay from './WinnerDisplay';

function checkBingo(card, marks) {
  if (!card || card.length === 0) return false;
  const grid = card;
  // rows
  for (let r = 0; r < 5; r++) {
    if (grid[r].every((w) => marks[w])) return true;
  }
  // cols
  for (let c = 0; c < 5; c++) {
    if ([0, 1, 2, 3, 4].every((r) => marks[grid[r][c]])) return true;
  }
  // diagonals
  if ([0, 1, 2, 3, 4].every((i) => marks[grid[i][i]])) return true;
  if ([0, 1, 2, 3, 4].every((i) => marks[grid[i][4 - i]])) return true;
  return false;
}

export default function SightWordBingo({ roomId, userId, difficulty = 'medium' }) {
  const {
    card,
    clues,
    currentClue,
    calledIndex,
    marks,
    winner,
    loading,
    error,
    markWord,
    callNext,
    declareWinner,
  } = useBingoGame({ roomId, userId, difficulty });

  useEffect(() => {
    if (card && card.length > 0) {
      const hasBingo = checkBingo(card, marks);
      if (hasBingo && !winner) {
        declareWinner(userId);
      }
    }
  }, [card, marks, declareWinner, userId, winner]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-indigo-600 font-semibold">Sight Word Bingo</p>
          <h1 className="text-3xl font-bold text-gray-900">Mark the words that match the clue!</h1>
          <p className="text-sm text-gray-600">Difficulty: {difficulty} • Room: {roomId}</p>
        </div>
        <div className="text-right text-sm text-gray-500">
          Clue {calledIndex + 1}/{clues.length || '?'}
        </div>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">{error}</div>}
      {loading && <div className="text-sm text-gray-500">Loading bingo card…</div>}

      <ClueDisplay clue={currentClue} onNext={callNext} canNext={!winner && calledIndex < clues.length - 1} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <BingoCard card={card} marks={marks} onMark={markWord} />
        </div>
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            className="p-3 rounded-xl bg-white border border-gray-100 shadow-sm"
          >
            <p className="text-sm text-gray-600">Players mark the matching word when they hear the clue. First to 5 in a row wins.</p>
          </motion.div>
          <WinnerDisplay winner={winner} onPlayAgain={() => window.location.reload()} />
        </div>
      </div>
    </div>
  );
}
