import React from 'react';
const items = [
  { value: '3500+', label: 'Learners guided since 2020' },
  { value: '9+ countries', label: 'Families across India and 8+ other countries' },
  { value: '95%', label: (
    <>
      Parents see visible improvement <span className="font-bold">within 12 weeks</span>
    </>
  ) },
  { value: '4.9/5', label: 'Average parent satisfaction rating' }
];

const SocialProofCrispSection: React.FC = () => {
  return (
    <section data-animate="fade-up" className="bg-gradient-to-b from-slate-50 to-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <h2 className="font-heading text-3xl font-bold md:text-4xl">Results & Stories</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {items.map((s, index) => (
            <div
              key={typeof s.label === 'string' ? s.label : `item-${index}`}
              className="rounded-3xl bg-white p-6 text-center shadow-lg ring-1 ring-slate-200 transition-transform will-change-transform hover:-translate-y-1"
            >
              <div className="animated-gradient-text text-3xl font-extrabold md:text-4xl">{s.value}</div>
              <p className="mt-2 text-sm text-gray-700">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-12">
        </div>
      </div>
    </section>
  );
};

export default SocialProofCrispSection;
