import React from 'react';
import { motion } from 'framer-motion';

type ProgramProofProps = {
  metrics: Array<{
    value: string;
    label: string;
  }>;
  title?: string;
};

export default function ProgramProof({ metrics, title = 'Real Progress Parents Can See' }: ProgramProofProps) {
  return (
    <section className="mx-auto max-w-5xl px-6 py-10">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 px-6 py-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:px-8">
        <div className="mb-8 text-center">
          <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h3>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-slate-200"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
                {metric.value}
              </div>
              <p className="mt-2 text-sm leading-snug text-slate-700">{metric.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
