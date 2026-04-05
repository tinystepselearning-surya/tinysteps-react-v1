// @ts-nocheck
import React from 'react';

const pillars = [
  {
    title: 'Approaches to Learning (ATL)',
    detail: 'Communication · Thinking · Research · Social · Self-Management',
    bullets: [
      'These are the skills children use to learn independently, communicate clearly, and grow in confidence.',
      'Lesson reflections and voice/video journals strengthen communication and self-management in practical ways.',
    ],
  },
  {
    title: 'Transdisciplinary Themes',
    detail: 'Who we are · How we express ourselves · How we organize ourselves',
    bullets: [
      'Children use language to explore themselves, ideas, people, and the world around them.',
      'Reading, grammar, and writing projects connect to real-life contexts in age-appropriate ways.',
    ],
  },
  {
    title: 'IB Learner Profile',
    detail: 'Inquirer · Communicator · Reflective · Principled',
    bullets: [
      'This helps children become curious learners, thoughtful speakers, and reflective individuals.',
      'Children set goals, reflect using “Glow & Grow,” and share clear progress evidence with parents.',
    ],
  },
];

const IBAlignmentSection = () => (
  <section data-animate="fade-up" className="px-6 pb-10">
    <div className="mx-auto max-w-6xl rounded-[32px] border border-white/40 bg-white/85 p-6 shadow-card-hover">
      <div className="text-center">
        <div className="gradient-chip mx-auto w-max">IB Primary Years Programme lens</div>
        <h2 className="mt-3 text-3xl font-semibold text-gray-900">How Tiny Steps aligns with IB English scopes</h2>
        <p className="mt-2 text-sm text-gray-700">Children build communication, thinking, reflection, and confidence through inquiry-led English learning.</p>
        <p className="mt-1 text-sm text-gray-700">Learning is inquiry-led and concept-driven, so children question, discuss, connect ideas, and apply English in meaningful contexts.</p>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {pillars.map((pillar) => (
          <div key={pillar.title} className="rounded-3xl border border-gray-100 bg-gradient-to-br from-white via-slate-50 to-white p-5 shadow-sm hover:shadow-lg transition">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{pillar.title}</div>
            <div className="text-lg font-semibold text-gray-900">{pillar.detail}</div>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {pillar.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2">
                  <span>✦</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default IBAlignmentSection;
