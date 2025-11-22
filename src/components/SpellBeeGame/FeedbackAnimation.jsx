import { motion } from 'framer-motion';

const ConfettiPiece = ({ delay }) => (
  <motion.div
    initial={{ y: 0, opacity: 1 }}
    animate={{ y: -100, opacity: 0 }}
    transition={{ duration: 1, delay, ease: "easeOut" }}
    className="absolute w-2 h-2 bg-yellow-400 rounded-full"
    style={{ left: `${Math.random() * 100}%` }}
  />
);

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
      className={`relative p-4 rounded-2xl border overflow-hidden ${
        positive ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'
      }`}
    >
      {positive && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <ConfettiPiece key={i} delay={i * 0.05} />
          ))}
        </div>
      )}
      <p className="font-semibold text-lg relative z-10">{positive ? '🎉 Correct!' : '🤔 Try again'}</p>
      {feedback && <p className="text-sm mt-1 relative z-10">{feedback}</p>}
      {tip && <p className="text-xs text-gray-600 mt-1 relative z-10">{tip}</p>}
    </motion.div>
  );
}
