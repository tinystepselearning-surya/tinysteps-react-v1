// @ts-nocheck
import React from 'react';

const pillars = [
  {
    title: 'Approaches to Learning',
    detail: 'Communication · Thinking · Research · Social · Self-Management',
    bullets: [
      'Lesson reflections and voice/video journals nurture communication + self-management.',
      'Inquiry prompts in every unit connect literacy skills to real-life contexts.',
    ],
  },
  {
    title: 'Transdisciplinary Themes',
    detail: 'Who we are · How we express ourselves · How we organize ourselves',
    bullets: [
      'Phonics texts and speeches draw from culture, community, nature, and innovation themes.',
      'Grammar + writing projects map to PYP exhibition style tasks and persuasive writing.',
    ],
  },
  {
    title: 'IB Learner Profile',
    detail: 'Inquirer · Communicator · Reflective · Principled',
    bullets: [
      'Learners set lesson goals, reflect using “Glow & Grow,” and share evidence with parents.',
      'Capstone speeches + writing tasks emphasise principled expression and empathy.',
    ],
  },
];

const IBAlignmentSection = () => (
  <section data-animate="fade-up" className="px-6 pb-10">
    <div className="mx-auto max-w-6xl rounded-[32px] border border-white/40 bg-white/85 p-6 shadow-card-hover">
      <div className="text-center">
        <div className="gradient-chip mx-auto w-max">IB Primary Years Programme lens</div>
        <h2 className="mt-3 text-3xl font-semibold text-gray-900">How Tiny Steps aligns with IB English scopes</h2>
        <p className="mt-2 text-sm text-gray-700">Every course publishes inquiry questions, ATL focus, and learner-profile outcomes inside the parent dashboard.</p>
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
