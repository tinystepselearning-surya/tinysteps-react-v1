import type { FC } from 'react';
import { motion } from 'framer-motion';

const MotivationCenter: FC = () => {
  const dailyTip = "Did you know? There are 44 sounds in English! You're learning them one by one! 🎵";

  const messages = {
    parent: "Great job in your session today! ❤️ Keep up the amazing work!",
    teacher: "You're doing amazing! Keep practicing! 🌟",
    nextMilestone: "Only 2 more words to unlock 'Word Master'!"
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-center mb-6">You're Amazing! 💫</h1>

      {/* Daily Tip */}
      <motion.div
        className="bg-gradient-to-r from-yellow-300 to-orange-400 rounded-3xl p-6 mb-6 text-center text-white"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <h2 className="text-2xl font-bold mb-4">Daily Tip 💡</h2>
        <p className="text-lg">{dailyTip}</p>
      </motion.div>

      {/* Parent Message */}
      <motion.div
        className="bg-pink-100 rounded-3xl p-6 mb-6"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center mb-2">
          <span className="text-3xl mr-3">👨‍👩‍👧‍👦</span>
          <h3 className="text-xl font-bold">From Your Parents</h3>
        </div>
        <p className="text-lg text-pink-800">{messages.parent}</p>
      </motion.div>

      {/* Teacher Encouragement */}
      <motion.div
        className="bg-blue-100 rounded-3xl p-6 mb-6"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center mb-2">
          <span className="text-3xl mr-3">👩‍🏫</span>
          <h3 className="text-xl font-bold">From Your Teacher</h3>
        </div>
        <p className="text-lg text-blue-800">{messages.teacher}</p>
      </motion.div>

      {/* Next Milestone */}
      <motion.div
        className="bg-green-100 rounded-3xl p-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center mb-2">
          <span className="text-3xl mr-3">🎯</span>
          <h3 className="text-xl font-bold">Next Milestone</h3>
        </div>
        <p className="text-lg text-green-800">{messages.nextMilestone}</p>
      </motion.div>

      {/* Motivational Quote */}
      <motion.div
        className="bg-gradient-to-r from-purple-400 to-indigo-500 rounded-3xl p-6 text-center text-white"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
      >
        <p className="text-xl font-bold mb-2">"Every expert was once a beginner!"</p>
        <p className="text-lg">You're on your way to becoming a learning superstar! 🌟</p>
      </motion.div>
    </div>
  );
};

export default MotivationCenter;