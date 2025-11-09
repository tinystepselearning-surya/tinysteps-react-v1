// @ts-nocheck
import { motion, useInView } from 'framer-motion';
import React, { useRef } from 'react';

interface Stat {
  value: string | number;
  label: string;
}

interface ModernCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  image?: string;
  color?: string;
  hoverEffect?: 'lift' | 'glow' | 'scale';
  delay?: number;
  onClick?: () => void;
  badge?: string;
  stats?: Stat[];
  gradient?: boolean;
}

export const ModernCard: React.FC<ModernCardProps> = ({
  title,
  description,
  icon,
  image,
  color = 'from-blue-500 to-purple-500',
  hoverEffect = 'lift',
  delay = 0,
  onClick,
  badge,
  stats,
  gradient = true,
}) => {
  const ref = useRef<Element | null>(null);
  const isInView = useInView(ref as React.RefObject<Element>, { amount: 0.2 });

  const variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay,
        ease: 'easeOut',
      },
    },
  };

  const hoverVariants = {
    lift: {
      y: -12,
      boxShadow: '0 30px 60px rgba(0, 0, 0, 0.15)',
    },
    glow: {
      boxShadow: '0 0 40px rgba(59, 130, 246, 0.4)',
    },
    scale: {
      scale: 1.03,
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants}
      whileHover={hoverVariants[hoverEffect]}
      onClick={onClick}
      className="h-full cursor-pointer group"
    >
      <div className="relative h-full bg-white rounded-3xl shadow-xl overflow-hidden p-8 transition-all duration-300">
        {/* Gradient Background Overlay */}
        {gradient && (
          <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-3 transition-opacity duration-300`} />
        )}

        {/* Top Section with Image or Icon */}
        {image ? (
          // @ts-ignore
          <motion.div
            className="relative w-full h-48 rounded-2xl overflow-hidden mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover"
            />
            {badge && (
              <div className={`absolute top-4 right-4 px-4 py-2 bg-gradient-to-r ${color} text-white rounded-full text-xs font-semibold`}>
                {badge}
              </div>
            )}
          </motion.div>
        ) : icon ? (
          // @ts-ignore
          <motion.div
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-6`}
            whileHover={{ rotate: 10, scale: 1.1 }}
          >
            <span className="text-3xl">{icon}</span>
          </motion.div>
        ) : null}

        {/* Content */}
        <div className="relative z-10">
          {/* Title */}
          <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text transition-all duration-300" style={{
            backgroundImage: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
          }}>
            {title}
          </h3>

          {/* Description */}
          <p className="text-gray-600 leading-relaxed mb-6 text-base">
            {description}
          </p>

          {/* Stats (optional) */}
          {stats && (
            <div className="flex gap-4 mb-6 pb-6 border-b border-gray-200">
              {stats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: delay + idx * 0.1, duration: 0.5 }}
                >
                  <div className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* CTA Arrow */}
          <motion.div
            className="flex items-center text-blue-600 font-semibold text-sm group-hover:gap-3 gap-2 transition-all duration-300"
            whileHover={{ x: 5 }}
          >
            Learn more
            <motion.svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              animate={{ x: 0 }}
              whileHover={{ x: 5 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </motion.svg>
          </motion.div>
        </div>

        {/* Bottom Accent Line */}
        <motion.div
          className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${color}`}
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ delay: delay + 0.3, duration: 0.6 }}
          style={{ originX: 0 }}
        />

        {/* Hover Border Effect */}
        <motion.div
          className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-blue-200 transition-colors duration-300"
          initial={false}
        />
      </div>
    </motion.div>
  );
};