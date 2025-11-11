// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { trackEvent } from '../../lib/analytics';

const FloatingAssistant = () => {
  const openWhatsApp = (message = 'Hi Tiny Steps! I have a quick question.') => {
    trackEvent('floating_whatsapp_click', { source: 'floating_assistant' });
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/919618398383?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-4 z-40 flex flex-col items-end gap-3">
      <motion.button
        className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-xl ring-1 ring-gray-100"
        whileHover={{ y: -2 }}
        onClick={() => openWhatsApp('Hi Tiny Steps team! Can you help me choose a course?')}
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#ff8f5c] to-[#59c3ff] text-white">🤖</span>
        Ask TinySteps
      </motion.button>
      <motion.button
        className="flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-2xl"
        whileHover={{ scale: 1.05 }}
        onClick={() => openWhatsApp('Hi! I want to chat about Tiny Steps programs.')}
      >
        WhatsApp Advisor
      </motion.button>
    </div>
  );
};

export default FloatingAssistant;
