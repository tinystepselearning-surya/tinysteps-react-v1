import { motion } from 'framer-motion';

export default function WordButton({ word, marked, onClick }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(word)}
      className={`w-full h-14 rounded-lg border text-lg font-semibold transition ${
        marked
          ? 'bg-emerald-100 border-emerald-200 text-emerald-800 line-through'
          : 'bg-white border-gray-200 text-gray-800 hover:border-indigo-200'
      }`}
    >
      {word}
    </motion.button>
  );
}
