import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface Badge {
  id: number;
  title: string;
  emoji: string;
  description: string;
  earnedDate?: string;
  message: string;
}

const AchievementsView = () => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebratedBadge, setCelebratedBadge] = useState<Badge | null>(null);

  const earnedBadges = [
    {
      id: 1,
      title: 'First Lesson',
      emoji: '🎖️',
      description: 'You attended your first session!',
      earnedDate: 'Nov 1',
      message: 'Welcome to the learning adventure! 🚀'
    },
    {
      id: 2,
      title: 'Perfect Week',
      emoji: '🏆',
      description: 'You attended all sessions this week!',
      earnedDate: 'Nov 7',
      message: 'You\'re unstoppable! 💪'
    },
    {
      id: 3,
      title: 'Speedy Learner',
      emoji: '⚡',
      description: 'You completed 5 topics! Wow!',
      earnedDate: 'Nov 10',
      message: 'Learning fast like a rocket! 🚀'
    },
    {
      id: 4,
      title: 'Super Phonics Star',
      emoji: '⭐',
      description: 'You mastered all Phonics Level 1 topics!',
      earnedDate: 'Nov 12',
      message: 'You\'re a phonics champion! 🏆'
    }
  ];

  const inProgressBadges = [
    {
      id: 5,
      title: '50 Words',
      emoji: '📝',
      description: 'Learn 10 more words to unlock this!',
      progress: 40,
      total: 50,
      message: 'Almost there! Keep learning! 📚'
    },
    {
      id: 6,
      title: 'Perfect Month',
      emoji: '📅',
      description: 'Complete 4 more sessions this month!',
      progress: 6,
      total: 10,
      message: 'You\'re doing great! Stay consistent! 🌟'
    },
    {
      id: 7,
      title: 'Master of All',
      emoji: '👑',
      description: 'Master all 3 areas to unlock!',
      progress: { phonics: 80, grammar: 60, speaking: 40 },
      message: 'You\'re becoming a learning master! 🎓'
    }
  ];

  const handleBadgeClick = (badge: Badge) => {
    if (earnedBadges.some(b => b.id === badge.id)) {
      setCelebratedBadge(badge);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Your Amazing Badges! 🏆</h1>

      {/* Earned Badges */}
      <h2 className="text-2xl font-bold mb-4">Earned Badges ⭐</h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {earnedBadges.map((badge) => (
          <motion.div
            key={badge.id}
            className="bg-gradient-to-br from-yellow-300 to-orange-400 rounded-3xl p-4 text-center shadow-lg cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleBadgeClick(badge)}
          >
            <div className="text-6xl mb-2">{badge.emoji}</div>
            <h3 className="text-xl font-bold mb-1">{badge.title}</h3>
            <p className="text-sm mb-2">{badge.description}</p>
            <p className="text-xs opacity-80">Earned {badge.earnedDate}</p>
          </motion.div>
        ))}
      </div>

      {/* In Progress Badges */}
      <h2 className="text-2xl font-bold mb-4">Coming Soon ⏳</h2>
      <div className="space-y-4">
        {inProgressBadges.map((badge) => (
          <motion.div
            key={badge.id}
            className="bg-gray-200 rounded-3xl p-4 shadow-lg"
            initial={{ opacity: 0.7 }}
          >
            <div className="flex items-center mb-2">
              <span className="text-4xl mr-3">{badge.emoji}</span>
              <div className="flex-1">
                <h3 className="text-xl font-bold">{badge.title}</h3>
                <p className="text-sm text-gray-600">{badge.description}</p>
              </div>
            </div>
            {badge.progress && typeof badge.progress === 'number' ? (
              <div className="mb-2">
                <div className="bg-gray-300 rounded-full h-4">
                  <motion.div
                    className="bg-blue-500 h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(badge.progress / (badge as any).total) * 100}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
                <p className="text-sm text-center mt-1">{badge.progress}/{badge.total}</p>
              </div>
            ) : badge.progress && typeof badge.progress === 'object' ? (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {Object.entries(badge.progress).map(([subject, progress]) => (
                  <div key={subject} className="text-center">
                    <p className="text-xs capitalize">{subject}</p>
                    <p className="text-sm font-bold">{progress}%</p>
                  </div>
                ))}
              </div>
            ) : null}
            <p className="text-sm text-gray-700">{badge.message}</p>
          </motion.div>
        ))}
      </div>

      {/* Celebration Modal */}
      {showCelebration && celebratedBadge && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="bg-white rounded-3xl p-8 text-center max-w-md mx-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="text-8xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold mb-2">Congratulations!</h2>
            <div className="text-6xl mb-4">{celebratedBadge.emoji}</div>
            <h3 className="text-2xl font-bold mb-2">{celebratedBadge.title}</h3>
            <p className="text-lg mb-4">{celebratedBadge.message}</p>
            <button className="bg-blue-500 text-white text-xl font-bold py-3 px-6 rounded-2xl">
              Show Parents! 👨‍👩‍👧‍👦
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default AchievementsView;