import React from 'react';
import { motion } from 'framer-motion';

export default function StoryDisplay({ story }) {
  return (
    <motion.div
      initial={{ opacity: 0.8 }}
      animate={{ opacity: 1 }}
      className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm"
    >
      <p className="text-sm text-gray-500 mb-1">Story so far</p>
      <p className="text-lg leading-relaxed text-gray-900 whitespace-pre-line">{story}</p>
    </motion.div>
  );
}
