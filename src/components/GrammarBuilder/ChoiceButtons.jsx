import React from 'react';
import { motion } from 'framer-motion';

export default function ChoiceButtons({ choices = [], onChoose, disabled }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
      {choices.map((c, idx) => (
        <motion.button
          key={idx}
          whileTap={{ scale: 0.97 }}
          onClick={() => onChoose(c)}
          disabled={disabled}
          className="px-4 py-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-800 font-semibold hover:border-indigo-200 disabled:opacity-60"
        >
          {c.text}
        </motion.button>
      ))}
    </div>
  );
}
