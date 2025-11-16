import React from 'react';
import { motion } from 'framer-motion';

export default function WinnerDisplay({ winner, onPlayAgain }) {
  if (!winner) return null;
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-center space-y-2"
    >
      <p className="text-xl font-bold">Bingo! 🎉</p>
      <p className="text-sm">Winner: {winner}</p>
      {onPlayAgain && (
        <button
          onClick={onPlayAgain}
          className="px-3 py-2 rounded-lg bg-white text-emerald-700 font-semibold border border-emerald-200"
        >
          Play again
        </button>
      )}
    </motion.div>
  );
}
