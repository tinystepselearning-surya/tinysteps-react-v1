import React from 'react';
import { motion } from 'framer-motion';

export default function ClueDisplay({ clue, onNext, canNext }) {
  if (!clue) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-between"
    >
      <div>
        <p className="text-xs uppercase text-indigo-600 font-semibold">Current clue</p>
        <p className="text-base text-gray-900">{clue}</p>
      </div>
      <button
        onClick={onNext}
        disabled={!canNext}
        className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50"
      >
        Next clue
      </button>
    </motion.div>
  );
}
