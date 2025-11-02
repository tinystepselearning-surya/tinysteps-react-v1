import React from 'react';
import { motion } from 'framer-motion';

interface BalloonProps {
  label: string;
  selected?: boolean;
  onClick: () => void;
  index: number;
  reducedMotion?: boolean;
}

const Balloon: React.FC<BalloonProps> = ({ label, selected, onClick, index, reducedMotion = false }) => {
  return (
    <motion.button
      onClick={onClick}
      className={`
        relative min-w-[80px] min-h-[80px] px-6 py-4 
        rounded-full text-2xl font-bold
        transition-all duration-200
        focus:outline-none focus:ring-[3px] focus:ring-blue-500 focus:ring-offset-2
        ${selected 
          ? 'bg-yellow-400 text-gray-900 ring-4 ring-yellow-500 scale-110' 
          : 'bg-gradient-to-br from-pink-400 to-purple-500 text-white hover:scale-105'
        }
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        scale: selected ? 1.1 : 1,
      }}
      whileHover={{ scale: selected ? 1.1 : 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      style={reducedMotion ? {} : {
        animation: `float 3s ease-in-out infinite`,
        animationDelay: `${index * 0.1}s`,
      }}
      aria-label={`Balloon ${index + 1}: ${label}`}
      aria-pressed={selected}
    >
      <span className="relative z-10">{label}</span>
      
      {/* Balloon string effect */}
      <div 
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0.5 h-8 bg-gray-400 opacity-50"
        aria-hidden="true"
      />
      
      {!reducedMotion && (
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
        `}</style>
      )}
    </motion.button>
  );
};

export default React.memo(Balloon);
