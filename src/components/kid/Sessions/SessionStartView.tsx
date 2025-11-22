import type { FC } from 'react';
import { motion } from 'framer-motion';

const SessionStartView: FC = () => {
  return (
    <div className="p-6">
      <motion.div
        className="bg-green-100 rounded-3xl p-8 text-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <div className="text-8xl mb-4">🎉</div>
        <h1 className="text-4xl font-bold text-green-800 mb-4">Great! Let's Go!</h1>
        <p className="text-xl text-green-700">Your session is starting now!</p>
        <motion.div
          className="mt-6"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <span className="text-6xl">🌟</span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SessionStartView;