// @ts-nocheck
import React from 'react';
import ProgramLeadForm from './ProgramLeadForm';

const ProgramHero = ({ title, subtitle, badges, highlights, program }: any) => (
  <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_#ffe3ba,_#ffd38d,_#a3d9ff)] px-6 py-16">
    <div className="pointer-events-none absolute inset-0 opacity-30">
      <div className="absolute -left-16 top-10 h-48 w-48 rounded-full bg-[#ff9f5f]/50 blur-3xl" />
      <div className="absolute right-0 bottom-5 h-52 w-52 rounded-full bg-[#7dccff]/50 blur-3xl" />
    </div>
    <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.05fr_0.95fr]">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-gray-600">Tiny Steps • {program}</p>
        <h1 className="mt-3 text-4xl font-bold text-gray-900 md:text-5xl">{title}</h1>
        <p className="mt-3 text-lg text-gray-700">{subtitle}</p>
        <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold text-gray-700">
          {badges.map((badge: string) => (
            <span key={badge} className="rounded-full bg-white/80 px-3 py-1 shadow">{badge}</span>
          ))}
        </div>
        <ul className="mt-6 space-y-2 text-sm text-gray-700">
          {highlights.map((item: string) => (
            <li key={item} className="flex items-start gap-2"><span>🌟</span>{item}</li>
          ))}
        </ul>
      </div>
      <div className="glass-panel p-6">
        <div className="text-sm uppercase tracking-widest text-gray-500">Talk to our team</div>
        <h3 className="text-xl font-semibold text-gray-900">{program} inquiry form</h3>
        <p className="text-sm text-gray-600">Share details here for an in-app confirmation, or use the WhatsApp option if you prefer.</p>
        <div className="mt-4">
          <ProgramLeadForm program={program} />
        </div>
      </div>
    </div>
  </section>
);

export default ProgramHero;
