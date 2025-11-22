import { motion } from 'framer-motion';

export default function RecordButton({ recording, onStart, onStop }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={recording ? onStop : onStart}
      className={`px-4 py-3 rounded-xl text-white font-semibold shadow ${
        recording ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'
      }`}
    >
      {recording ? 'Stop Recording' : 'Start Recording'}
    </motion.button>
  );
}
