import React from 'react';
import { motion } from 'framer-motion';

export default function FeedbackPopup({ feedback }) {
  if (!feedback) return null;
  const positive = feedback.correct;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-3 rounded-xl border ${
        positive ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'
      }`}
    >
      <p className="text-sm font-semibold">{positive ? '✅ Correct path!' : '🔄 Wrong turn, try again.'}</p>
      {feedback.text && <p className="text-xs mt-1 text-gray-700">{feedback.text}</p>}
    </motion.div>
  );
}
