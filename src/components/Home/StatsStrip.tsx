// @ts-nocheck
import React from 'react';

const stats = [
  { label: '3500+ students', detail: 'India • US • UK • Canada • Singapore • Malaysia • Vietnam • UAE • Australia' },
  { label: '95% parent satisfaction', detail: 'Weekly AI insights + mentor calls' },
  { label: 'AI-driven curriculum', detail: 'Personalised learning path + dashboard' }
];

export default function StatsStrip() {
  return (
    <section className="bg-white/80 px-6 py-6">
      <div className="mx-auto grid max-w-6xl gap-4 rounded-3xl border border-orange-100 bg-gradient-to-r from-[#fff1cc] via-white to-[#cfe9ff] p-6 text-sm font-semibold text-gray-800 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label}>
            <div className="text-lg text-gray-900">{stat.label}</div>
            <div className="text-xs text-gray-600">{stat.detail}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
