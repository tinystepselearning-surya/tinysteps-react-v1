import React from 'react';
import { motion } from 'framer-motion';

export default function JunctionChoice({ junction, onSelect }) {
  if (!junction) return null;
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white rounded-2xl shadow-lg border border-indigo-100 p-4 space-y-3"
    >
      <p className="text-sm font-semibold text-indigo-600 uppercase">Phonics Junction</p>
      <h3 className="text-lg font-bold text-gray-900">{junction.question}</h3>
      <div className="grid grid-cols-1 gap-2">
        {junction.options?.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(opt)}
            className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-indigo-200 bg-indigo-50/40 text-base font-semibold transition"
          >
            {opt.text} <span className="text-xs text-gray-500">{opt.sound}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
