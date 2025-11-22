import { motion } from 'framer-motion';

export default function WordCard({ word, pronunciation, hint, emoji = '🔤', onSpeak }) {
  if (!word) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="bg-white rounded-2xl shadow p-5 text-center space-y-2 border border-yellow-100"
    >
      <div className="text-4xl">{emoji}</div>
      <h2 className="text-3xl font-bold text-gray-900">{word}</h2>
      {pronunciation && <p className="text-sm text-gray-500">{pronunciation}</p>}
      {hint && <p className="text-sm text-gray-600">{hint}</p>}
      <button
        onClick={onSpeak}
        className="mt-2 inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-yellow-50 text-yellow-700 text-sm font-semibold border border-yellow-200"
      >
        🔊 Hear it again
      </button>
    </motion.div>
  );
}
