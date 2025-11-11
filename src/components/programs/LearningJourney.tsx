// @ts-nocheck
import React from 'react';

const LearningJourney = ({ stages }: any) => (
  <section className="px-6 py-12">
    <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-b from-white to-[#f8fbff] p-6 shadow-card-hover">
      <h3 className="text-2xl font-semibold text-gray-900">Learning journey</h3>
      <div className="mt-6 space-y-6 border-l-2 border-dashed border-[#ffb347] pl-6">
        {stages.map((stage: any, idx: number) => (
          <div key={stage.title} className="relative">
            <span className="absolute -left-[38px] flex h-8 w-8 items-center justify-center rounded-full bg-[#ff8f5c] text-white font-semibold">{idx+1}</span>
            <div className="rounded-2xl bg-white/90 p-4 shadow">
              <div className="text-sm uppercase tracking-widest text-gray-500">{stage.duration}</div>
              <div className="text-lg font-semibold text-gray-900">{stage.title}</div>
              <p className="text-sm text-gray-600">{stage.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default LearningJourney;
