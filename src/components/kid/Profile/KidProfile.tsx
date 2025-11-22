import type { FC } from 'react';
import { motion } from 'framer-motion';

const KidProfile: FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-center mb-6">My Profile 👤</h1>

      {/* Profile Photo */}
      <motion.div
        className="text-center mb-6"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className="w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mx-auto flex items-center justify-center text-6xl mb-4 shadow-lg">
          👦
        </div>
  <h2 className="text-2xl font-bold">{/* child name */}</h2>
  <p className="text-gray-600">{/* grade */}</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <motion.div
          className="bg-blue-100 rounded-3xl p-4 text-center"
          whileHover={{ scale: 1.05 }}
        >
          <div className="text-4xl mb-2">📚</div>
          <h3 className="text-xl font-bold">—</h3>
          <p className="text-sm text-blue-700">Active Courses</p>
        </motion.div>
        <motion.div
          className="bg-green-100 rounded-3xl p-4 text-center"
          whileHover={{ scale: 1.05 }}
        >
          <div className="text-4xl mb-2">🎓</div>
          <h3 className="text-xl font-bold">—</h3>
          <p className="text-sm text-green-700">Sessions Done</p>
        </motion.div>
        <motion.div
          className="bg-yellow-100 rounded-3xl p-4 text-center"
          whileHover={{ scale: 1.05 }}
        >
          <div className="text-4xl mb-2">🏆</div>
          <h3 className="text-xl font-bold">—</h3>
          <p className="text-sm text-yellow-700">Badges Earned</p>
        </motion.div>
        <motion.div
          className="bg-purple-100 rounded-3xl p-4 text-center"
          whileHover={{ scale: 1.05 }}
        >
          <div className="text-4xl mb-2">⭐</div>
          <h3 className="text-xl font-bold">—</h3>
          <p className="text-sm text-purple-700">Best Subject</p>
        </motion.div>
      </div>

      {/* Favorite Activity */}
      <motion.div
        className="bg-pink-100 rounded-3xl p-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
  <h3 className="text-xl font-bold mb-2">My Favorite Activity 🎮</h3>
  <p className="text-lg text-pink-800">—</p>
      </motion.div>

      {/* About Me */}
      <motion.div
        className="bg-indigo-100 rounded-3xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-xl font-bold mb-2">About Me 📖</h3>
        <p className="text-lg text-indigo-800">—</p>
      </motion.div>
    </div>
  );
};

export default KidProfile;