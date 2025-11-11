// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';

type SmartCardProps = {
  title: string;
  description?: string;
  badge?: string;
  cta?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

export default function SmartCard({ title, description, badge, cta, children, className }: SmartCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -5 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className={`relative rounded-2xl bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 shadow-lg shadow-blue-500/10 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 border border-gray-100 ${className||''}`}
    >
      {badge && (
        <div className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-tiny-orange-500 to-tiny-purple-500 px-3 py-1 text-xs font-semibold text-white shadow">
          {badge}
        </div>
      )}
      <div className="text-2xl font-bold text-gray-900 tracking-tight">{title}</div>
      {description && <p className="mt-2 text-gray-600 leading-relaxed">{description}</p>}
      {children && <div className="mt-3">{children}</div>}
      {cta && <div className="mt-4">{cta}</div>}
    </motion.div>
  );
}

