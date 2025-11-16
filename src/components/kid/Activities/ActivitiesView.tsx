import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ActivitiesView = () => {
  const [activeFilter, setActiveFilter] = useState('all');

  const assignedWorksheets = [
    {
      id: 1,
      title: 'Phonics Words Practice',
      difficulty: 2,
      time: '5-10 min',
      status: 'ready',
      thumbnail: '📝'
    },
    {
      id: 2,
      title: 'Grammar Fun Quiz',
      difficulty: 1,
      time: '3-5 min',
      status: 'completed',
      completedDate: 'Nov 14',
      thumbnail: '📚'
    }
  ];

  const availableGames = [
    {
      id: 1,
      title: 'Phoneme Matching',
      category: 'phonics',
      emoji: '🔤',
      highScore: 850,
      thumbnail: '🎯'
    },
    {
      id: 2,
      title: 'Grammar Builder',
      category: 'grammar',
      emoji: '📚',
      highScore: null,
      thumbnail: '🧱'
    },
    {
      id: 3,
      title: 'Speaking Stars',
      category: 'speaking',
      emoji: '🗣️',
      highScore: 720,
      thumbnail: '⭐'
    }
  ];

  const filters = [
    { id: 'all', label: '📋 All' },
    { id: 'phonics', label: '🔤 Phonics' },
    { id: 'grammar', label: '📚 Grammar' },
    { id: 'speaking', label: '🗣️ Speaking' }
  ];

  const filteredGames = activeFilter === 'all' 
    ? availableGames 
    : availableGames.filter(game => game.category === activeFilter);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Fun Activities! 🎉</h1>

      {/* Assigned Worksheets */}
      <h2 className="text-2xl font-bold mb-4">Your Worksheets 📝</h2>
      <div className="space-y-4 mb-8">
        {assignedWorksheets.map((worksheet) => (
          <motion.div
            key={worksheet.id}
            className="bg-white rounded-3xl p-4 shadow-lg flex items-center"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-4xl mr-4">{worksheet.thumbnail}</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">{worksheet.title}</h3>
              <div className="flex items-center mb-2">
                <span className="text-yellow-500 mr-1">{'⭐'.repeat(worksheet.difficulty)}</span>
                <span className="text-gray-500 ml-2">{worksheet.time}</span>
              </div>
              {worksheet.status === 'completed' ? (
                <div className="flex items-center">
                  <span className="text-green-600 font-bold mr-2">✅ Completed</span>
                  <span className="text-sm text-gray-500">{worksheet.completedDate}</span>
                </div>
              ) : (
                <span className="text-blue-600 font-bold">Ready to do!</span>
              )}
            </div>
            <motion.button
              className={`text-xl font-bold py-2 px-4 rounded-2xl ${
                worksheet.status === 'completed' 
                  ? 'bg-gray-300 text-gray-500' 
                  : 'bg-green-500 text-white'
              }`}
              whileTap={{ scale: 0.95 }}
              disabled={worksheet.status === 'completed'}
            >
              {worksheet.status === 'completed' ? 'Done!' : 'Do Now'}
            </motion.button>
          </motion.div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex justify-center mb-6">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`text-lg font-bold py-2 px-4 mx-1 rounded-2xl transition-all ${
              activeFilter === filter.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Available Games */}
      <h2 className="text-2xl font-bold mb-4">Games to Play 🎮</h2>
      <div className="grid grid-cols-1 gap-4">
        {filteredGames.map((game) => (
          <motion.div
            key={game.id}
            className="bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl p-4 text-white shadow-lg"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-4xl mr-4">{game.thumbnail}</div>
                <div>
                  <h3 className="text-xl font-bold">{game.title}</h3>
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{game.emoji}</span>
                    {game.highScore && (
                      <span className="text-sm bg-white bg-opacity-30 px-2 py-1 rounded-full">
                        High Score: {game.highScore} 🏆
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <motion.button
                className="bg-white text-purple-600 text-xl font-bold py-3 px-6 rounded-2xl shadow-lg"
                whileTap={{ scale: 0.95 }}
              >
                {game.highScore ? 'Play Again' : 'Play'}
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ActivitiesView;