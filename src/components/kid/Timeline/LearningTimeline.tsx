import type { FC } from 'react';
import { motion } from 'framer-motion';

const LearningTimeline: FC = () => {
  const timelineEvents = [
    { date: 'Nov 1', event: 'Started course', emoji: '🎓', type: 'milestone' },
    { date: 'Nov 3', event: 'Learned phoneme A', emoji: '✨', type: 'topic' },
    { date: 'Nov 5', event: 'Learned phoneme B', emoji: '✨', type: 'topic' },
    { date: 'Nov 7', event: 'Got "Super Learner" badge', emoji: '🏆', type: 'badge' },
    { date: 'Nov 10', event: 'Mastered Level 1', emoji: '🎉', type: 'milestone' },
    { date: 'Nov 12', event: 'Learned phoneme C', emoji: '✨', type: 'topic' },
    { date: 'Nov 15', event: 'Next: Start Level 2', emoji: '🚀', type: 'future' }
  ];

  const getEventColor = (type: string): string => {
    switch (type) {
      case 'milestone': return 'bg-yellow-400';
      case 'badge': return 'bg-purple-400';
      case 'topic': return 'bg-blue-400';
      case 'future': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Your Learning Journey! 🌟</h1>

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full"></div>

        {/* Timeline Events */}
        <div className="space-y-6">
          {timelineEvents.map((event, index) => (
            <motion.div
              key={index}
              className="flex items-center"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={`w-16 h-16 rounded-full ${getEventColor(event.type)} flex items-center justify-center text-2xl shadow-lg z-10`}>
                {event.emoji}
              </div>
              <div className="ml-4 bg-white rounded-3xl p-4 shadow-lg flex-1">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">{event.event}</h3>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {event.date}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        className="mt-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-3xl p-6 text-white text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <h2 className="text-2xl font-bold mb-2">Keep Going! 🚀</h2>
        <p className="text-lg">Your learning adventure is just beginning!</p>
      </motion.div>
    </div>
  );
};

export default LearningTimeline;