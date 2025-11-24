import React from 'react';
import { motion } from 'framer-motion';

const items = [
  {
    icon: '🤝',
    title: 'Caring 1:1 mentors',
    points: [
      'Children learn with warm, patient teachers who encourage them to speak, read and ask questions without fear.'
    ]
  },
  {
    icon: '📣',
    title: 'Clear progress for parents',
    points: [
      'Regular messages and progress updates show what your child practised, what they did well, and what we\'ll work on next.'
    ]
  },
  {
    icon: '🎓',
    title: 'Strong school support',
    points: [
      'IB-aligned phonics, grammar and speaking practice that strengthens school English rather than competing with it.'
    ]
  },
  {
    icon: '⏱️',
    title: 'Built for busy families',
    points: [
      'Short 35-minute sessions, flexible scheduling across time zones, and digital practice that doesn\'t overload parents.'
    ]
  }
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 }
};

const WhyParentsSection: React.FC = () => {
  return (
    <section className="bg-gradient-to-b from-white to-slate-50/50 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <h2 className="font-heading text-3xl font-bold md:text-4xl">Why parents trust Tiny Steps</h2>
          <p className="mt-2 text-base text-gray-700 md:text-lg">Parents tell us they stay because classes are calm, teachers are kind, and progress is visible at home and in school.</p>
        </div>
        <motion.div
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-4"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {items.map((card) => (
            <motion.div key={card.title} variants={item} className="group rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:shadow-2xl">
              <div className="text-3xl">{card.icon}</div>
              <h3 className="mt-3 text-lg font-semibold text-gray-900">{card.title}</h3>
              <ul className="mt-4 space-y-1 text-sm text-gray-700">
                {card.points.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default WhyParentsSection;
