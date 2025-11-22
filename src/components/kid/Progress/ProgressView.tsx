import type { FC } from 'react';
import { motion } from 'framer-motion';

const ProgressView: FC = () => {
  const progressData = [
    {
      subject: 'Phonics',
      emoji: '🔤',
      level: 2,
      progress: 80,
      learned: 52,
      topicsDone: 8,
      totalTopics: 12,
      next: 'Phoneme "U"',
      color: 'from-blue-400 to-blue-600'
    },
    {
      subject: 'Grammar',
      emoji: '📚',
      level: 1,
      progress: 60,
      learned: 15,
      topicsDone: 6,
      totalTopics: 10,
      next: 'Past tense',
      color: 'from-green-400 to-green-600'
    },
    {
      subject: 'Speaking',
      emoji: '🗣️',
      level: 1,
      progress: 40,
      learned: 8,
      topicsDone: 4,
      totalTopics: 10,
      next: 'Pronunciation',
      color: 'from-purple-400 to-purple-600'
    }
  ];

  const getMotivationalMessage = (progress: number): string => {
    if (progress >= 80) return "Wow! You're so smart! 🌟";
    if (progress >= 60) return "Almost there! 💪";
    return "You're doing great! 🎉";
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Your Amazing Progress! 🚀</h1>

      {progressData.map((item, index) => (
        <motion.div
          key={item.subject}
          className={`bg-gradient-to-r ${item.color} rounded-3xl p-6 mb-6 text-white shadow-lg`}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.2 }}
        >
          <div className="flex items-center mb-4">
            <span className="text-4xl mr-4">{item.emoji}</span>
            <div>
              <h2 className="text-2xl font-bold">{item.subject} Level {item.level}</h2>
              <p className="text-lg opacity-90">{item.progress}% done! 🎯</p>
            </div>
          </div>

          <div className="mb-4">
            <div className="bg-white bg-opacity-30 rounded-full h-6 mb-2">
              <motion.div
                className="bg-white h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${item.progress}%` }}
                transition={{ duration: 1, delay: index * 0.2 }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <p className="text-3xl font-bold">{item.learned}</p>
              <p className="text-sm opacity-90">Learned! ✏️</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{item.topicsDone}/{item.totalTopics}</p>
              <p className="text-sm opacity-90">Topics Done! 📖</p>
            </div>
          </div>

          <p className="text-lg mb-2">Next: {item.next} 🎓</p>
          <p className="text-xl font-bold">{getMotivationalMessage(item.progress)}</p>
        </motion.div>
      ))}

      <motion.div
        className="bg-yellow-100 rounded-3xl p-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <h3 className="text-2xl font-bold mb-2">You've learned 52 words in Phonics! 🎉</h3>
        <p className="text-lg text-yellow-700">Keep going, superstar! 🌟</p>
      </motion.div>
    </div>
  );
};

export default ProgressView;