import React from 'react';
import { motion } from 'framer-motion';

const KidNotifications = () => {
  const notifications = [
    {
      id: 1,
      message: "Your session is in 1 hour! 🎓",
      type: "session",
      time: "2 hours ago"
    },
    {
      id: 2,
      message: "You earned a new badge! 🏆",
      type: "achievement",
      time: "1 day ago"
    },
    {
      id: 3,
      message: "Parent sent you a message! 💌",
      type: "message",
      time: "2 days ago"
    },
    {
      id: 4,
      message: "Great job today! 🌟",
      type: "praise",
      time: "3 days ago"
    }
  ];

  const getNotificationColor = (type: string): string => {
    switch (type) {
      case 'session': return 'bg-blue-100 border-blue-300';
      case 'achievement': return 'bg-yellow-100 border-yellow-300';
      case 'message': return 'bg-pink-100 border-pink-300';
      case 'praise': return 'bg-green-100 border-green-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Your Messages! 💌</h1>

      <div className="space-y-4">
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            className={`rounded-3xl p-4 border-2 ${getNotificationColor(notification.type)} shadow-lg`}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-lg font-bold mb-1">{notification.message}</p>
            <p className="text-sm text-gray-600">{notification.time}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="mt-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl p-6 text-center text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <h2 className="text-2xl font-bold mb-2">Stay Tuned! 🎉</h2>
        <p className="text-lg">More exciting messages coming your way!</p>
      </motion.div>
    </div>
  );
};

export default KidNotifications;