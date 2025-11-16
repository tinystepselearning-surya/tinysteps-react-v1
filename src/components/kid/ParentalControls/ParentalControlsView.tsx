import React from 'react';
import { motion } from 'framer-motion';

const ParentalControlsView = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Parental Controls 👨‍👩‍👧‍👦</h1>

      {/* Session Reminders */}
      <motion.div
        className="bg-blue-100 rounded-3xl p-6 mb-6"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <h2 className="text-2xl font-bold mb-4">Session Reminders ⏰</h2>
        <div className="space-y-2">
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="mr-3 w-5 h-5" />
            <span className="text-lg">1 hour before session</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="mr-3 w-5 h-5" />
            <span className="text-lg">15 minutes before session</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-3 w-5 h-5" />
            <span className="text-lg">Daily activity reminders</span>
          </label>
        </div>
      </motion.div>

      {/* Activity Approval */}
      <motion.div
        className="bg-green-100 rounded-3xl p-6 mb-6"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-2xl font-bold mb-4">Activity Approval ✅</h2>
        <div className="space-y-2">
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="mr-3 w-5 h-5" />
            <span className="text-lg">Approve new games</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="mr-3 w-5 h-5" />
            <span className="text-lg">Approve worksheets</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-3 w-5 h-5" />
            <span className="text-lg">Auto-approve familiar activities</span>
          </label>
        </div>
      </motion.div>

      {/* Activity History */}
      <motion.div
        className="bg-purple-100 rounded-3xl p-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-2xl font-bold mb-4">Activity History 📊</h2>
        <div className="space-y-3">
          <div className="bg-white bg-opacity-50 rounded-2xl p-3">
            <p className="font-bold">Today: Played Phoneme Matching (Score: 850)</p>
            <p className="text-sm text-gray-600">Completed 15 min worksheet</p>
          </div>
          <div className="bg-white bg-opacity-50 rounded-2xl p-3">
            <p className="font-bold">Yesterday: Earned "Speedy Learner" badge</p>
            <p className="text-sm text-gray-600">Completed 3 activities</p>
          </div>
        </div>
      </motion.div>

      {/* Screen Time Limits */}
      <motion.div
        className="bg-orange-100 rounded-3xl p-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h2 className="text-2xl font-bold mb-4">Screen Time ⏱️</h2>
        <div className="space-y-2">
          <p className="text-lg">Daily limit: 4-6 PM</p>
          <div className="bg-white bg-opacity-50 rounded-full h-4">
            <div className="bg-orange-500 h-full rounded-full w-3/4"></div>
          </div>
          <p className="text-sm text-gray-600">2 hours 30 min used today</p>
        </div>
      </motion.div>

      {/* Weekly Report */}
      <motion.div
        className="bg-indigo-100 rounded-3xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <h2 className="text-2xl font-bold mb-4">Weekly Report 📈</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">7</p>
            <p className="text-sm">Sessions attended</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">3</p>
            <p className="text-sm">Badges earned</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">52</p>
            <p className="text-sm">Words learned</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">95%</p>
            <p className="text-sm">Average score</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ParentalControlsView;