import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const HomeScreen = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 30, seconds: 15 });
  const [sessionStatus, setSessionStatus] = useState('upcoming'); // upcoming, ready, inProgress

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) seconds--;
        else if (minutes > 0) { minutes--; seconds = 59; }
        else if (hours > 0) { hours--; minutes = 59; seconds = 59; }
        else {
          setSessionStatus('ready');
          return { hours: 0, minutes: 0, seconds: 0 };
        }
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getTimerColor = () => {
    const totalSeconds = timeLeft.hours * 3600 + timeLeft.minutes * 60 + timeLeft.seconds;
    if (totalSeconds > 300) return 'text-green-600';
    if (totalSeconds > 60) return 'text-yellow-600';
    return 'text-red-600 animate-pulse';
  };

  const handleJoinSession = () => {
    setSessionStatus('inProgress');
    // Open Zoom link
    window.open('https://zoom.us/j/example', '_blank');
  };

  return (
    <div className="p-6">
      {/* Hero Section */}
      <motion.div
        className="bg-gradient-to-r from-blue-400 to-purple-500 rounded-3xl p-8 mb-6 text-white text-center"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold mb-4">Next Session In</h1>
        <div className={`text-6xl font-mono font-bold mb-4 ${getTimerColor()}`}>
          {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
        </div>
        <p className="text-xl">Get ready for fun learning! 🎓</p>
      </motion.div>

      {/* Session Card */}
      <motion.div
        className="bg-white rounded-3xl p-6 mb-6 shadow-lg"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className="flex items-center mb-4">
          <span className="text-4xl mr-4">👩‍🏫</span>
          <div>
            <h2 className="text-2xl font-bold">{/* Teacher name */}</h2>
            <p className="text-gray-600">{/* role or subtitle */}</p>
          </div>
        </div>
        <div className="flex items-center mb-4">
          <span className="text-4xl mr-4">🔤</span>
          <div>
            <h2 className="text-2xl font-bold">{/* Course name */}</h2>
            <p className="text-gray-600">{/* start time */}</p>
          </div>
        </div>
        {sessionStatus === 'ready' ? (
          <motion.button
            onClick={handleJoinSession}
            className="w-full bg-green-500 text-white text-2xl font-bold py-4 rounded-2xl shadow-lg"
            whileTap={{ scale: 0.95 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            🎓 JOIN NOW 🎓
          </motion.button>
        ) : (
          <div className="text-center">
            <p className="text-xl font-bold text-blue-600 mb-2">Can't wait! 🚀</p>
            <p className="text-gray-600">Get your crayons ready!</p>
          </div>
        )}
      </motion.div>

      {/* Daily Streak */}
      <motion.div
        className="bg-orange-100 rounded-3xl p-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="text-6xl mb-2">🔥</div>
        <h3 className="text-2xl font-bold mb-2">7 Day Streak!</h3>
        <p className="text-lg text-orange-700">Keep it up! You're amazing! 🌟</p>
      </motion.div>
    </div>
  );
};

export default HomeScreen;