import React, { useMemo, useState } from 'react';
import { Carousel } from '../common/Carousel';

type Step = {
  icon: string;
  header: string;
  duration: string;
  bullets: string[];
  progress: string;
};

const steps: Step[] = [
  {
    icon: '🎯',
    header: 'Week 1: Assessment',
    duration: '1 Class',
    bullets: ['Initial level check', 'Learning style assessment', 'Customized plan', 'Detailed parent report'],
    progress: '0%'
  },
  {
    icon: '📚',
    header: 'Weeks 2-8: Intensive Learning',
    duration: '6–8 Weeks',
    bullets: ['2–3 classes/week', 'Core skills development', 'Fun practice activities', 'Weekly progress reports'],
    progress: '45%'
  },
  {
    icon: '🚀',
    header: 'Weeks 9-12: Confidence Building',
    duration: '4 Weeks',
    bullets: ['Real‑world application', 'Presentation practice', 'Milestone moments', 'Peer sharing sessions'],
    progress: '80%'
  },
  {
    icon: '⭐',
    header: 'Month 4+: Independent Learning',
    duration: 'Ongoing',
    bullets: ['Reads independently', 'Speaks confidently', 'Advanced paths', 'Maintenance classes'],
    progress: '100%'
  }
];

const StepTimeline: React.FC = () => {
  const desktop = useMemo(
    () => (
      <div className="hidden md:grid grid-cols-4 gap-6">
        {steps.map((s, i) => (
          <div key={s.header} className="rounded-2xl bg-white p-5 shadow ring-1 ring-slate-200">
            <div className="text-2xl">{s.icon}</div>
            <div className="mt-2 font-semibold text-gray-900">{s.header}</div>
            <div className="text-sm text-primary-600">{s.duration}</div>
            <ul className="mt-3 space-y-1 text-sm text-gray-700">
              {s.bullets.map((b) => (
                <li key={b}>• {b}</li>
              ))}
            </ul>
            <div className="mt-3 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-gray-700">Progress: {s.progress}</div>
          </div>
        ))}
      </div>
    ),
    []
  );

  const mobile = (
    <div className="md:hidden">
      <Carousel className="-mx-2" autoRotateMs={6000}>
        {steps.map((s) => (
          <div key={s.header} className="rounded-2xl bg-white p-6 shadow ring-1 ring-slate-200">
            <div className="text-2xl">{s.icon}</div>
            <div className="mt-2 font-semibold text-gray-900">{s.header}</div>
            <div className="text-sm text-primary-600">{s.duration}</div>
            <ul className="mt-3 space-y-1 text-sm text-gray-700">
              {s.bullets.map((b) => (
                <li key={b}>• {b}</li>
              ))}
            </ul>
            <div className="mt-3 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-gray-700">Progress: {s.progress}</div>
          </div>
        ))}
      </Carousel>
    </div>
  );

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <h2 className="font-heading text-3xl font-bold md:text-4xl">Your Child's Learning Journey</h2>
          <p className="mt-2 text-base text-gray-700">Desktop timeline • Mobile carousel</p>
        </div>
        {desktop}
        {mobile}
      </div>
    </section>
  );
};

export default StepTimeline;

