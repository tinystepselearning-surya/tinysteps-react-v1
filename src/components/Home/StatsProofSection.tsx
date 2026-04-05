import React from 'react';
import { motion } from 'framer-motion';

const stats = [
  { value: '95%', label: 'Visible improvement within 3 months' },
  { value: '89%', label: 'Parents report increased confidence' },
  { value: '92%', label: 'Children now ENJOY English learning' },
  { value: '5000+', label: 'Families supported worldwide (since 2020)' },
  { value: '4.9/5', label: 'Parent satisfaction rating' }
];

const StatsProofSection: React.FC = () => {
  return (
    <section className="bg-gradient-to-b from-slate-50 to-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <h3 className="font-heading text-2xl font-bold md:text-3xl">Results That Speak for Themselves</h3>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {stats.map((s) => (
            <motion.div
              key={s.label}
              className="rounded-3xl bg-white p-6 text-center shadow-lg ring-1 ring-slate-200"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
            >
              <div className="animated-gradient-text text-3xl font-extrabold md:text-4xl">{s.value}</div>
              <p className="mt-2 text-sm text-gray-700">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsProofSection;
