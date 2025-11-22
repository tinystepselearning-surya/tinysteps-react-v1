import { motion } from 'framer-motion';

export default function PlayerCharacter({ current }) {
  if (!current) return null;
  const [r, c] = current;
  return (
    <motion.div
      className="absolute"
      initial={{ scale: 0.9, opacity: 0.8 }}
      animate={{ scale: [1, 1.05, 1], opacity: 1 }}
      transition={{ repeat: Infinity, duration: 1.5 }}
      style={{
        left: c * 20,
        top: r * 20,
        width: 20,
        height: 20,
        pointerEvents: 'none',
      }}
    >
      <div className="w-full h-full rounded-full bg-orange-400 border-2 border-orange-500 shadow-inner flex items-center justify-center text-white text-xs">
        🧒
      </div>
    </motion.div>
  );
}
