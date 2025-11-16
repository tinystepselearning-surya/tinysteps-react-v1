import React from 'react';
import { motion } from 'framer-motion';

export default function FeedbackAnimation({ correct, feedback, tip }) {
  if (correct == null) return null;
  const positive = correct === true;
  const variants = positive
    ? { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1.05, opacity: 1 } }
    : { initial: { x: -6, opacity: 0 }, animate: { x: [6, -6, 4, -4, 0], opacity: 1 } };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      transition={{ duration: 0.6 }}
      variants={variants}
      className={`p-4 rounded-2xl border ${
        positive ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'
      }`}
    >
      <p className="font-semibold text-lg">{positive ? '✅ Correct!' : '🤔 Try again'}</p>
      {feedback && <p className="text-sm mt-1">{feedback}</p>}
      {tip && <p className="text-xs text-gray-600 mt-1">{tip}</p>}
    </motion.div>
  );
}
