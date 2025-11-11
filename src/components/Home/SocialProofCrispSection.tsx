import React from 'react';
import TestimonialsCarousel from './TestimonialsCarousel';

const items = [
  { value: '95%', label: 'Visible improvement in 3 months' },
  { value: '1000+', label: 'Children transformed since 2023' },
  { value: '4.9/5', label: 'Parent satisfaction' },
  { value: '89%', label: 'Report increased confidence' }
];

const SocialProofCrispSection: React.FC = () => {
  return (
    <section className="bg-gradient-to-b from-slate-50 to-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <h2 className="font-heading text-3xl font-bold md:text-4xl">Results & Stories</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {items.map((s) => (
            <div
              key={s.label}
              className="rounded-3xl bg-white p-6 text-center shadow-lg ring-1 ring-slate-200 transition-transform will-change-transform hover:-translate-y-1"
            >
              <div className="animated-gradient-text text-3xl font-extrabold md:text-4xl">{s.value}</div>
              <p className="mt-2 text-sm text-gray-700">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-12">
          <TestimonialsCarousel />
        </div>
      </div>
    </section>
  );
};

export default SocialProofCrispSection;

