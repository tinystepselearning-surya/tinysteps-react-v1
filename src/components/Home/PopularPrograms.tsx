// @ts-nocheck
import React, { useRef } from 'react';
import { Link } from 'react-router-dom';

const programs = [
  {
    title: 'Phonics Superstar',
    icon: '🔤',
    age: 'Ages 3-7',
    blurb: 'SATPIN to multisyllabic decoding + AI reading coaches.',
    href: '/courses/phonics-foundation',
    accent: 'from-sky-100 via-white to-purple-100'
  },
  {
    title: 'Grammar Pro Lab',
    icon: '✍️',
    age: 'Ages 6-12',
    blurb: 'Parts of speech, tenses, and weekly writing labs.',
    href: '/courses/grammar-essentials',
    accent: 'from-amber-100 via-white to-rose-100'
  },
  {
    title: 'Super Speakers',
    icon: '🎤',
    age: 'Ages 4-15',
    blurb: 'Confidence drills, debates, and capstone speeches.',
    href: '/courses/public-speaking-foundations',
    accent: 'from-green-100 via-white to-sky-100'
  },
  {
    title: 'Brush-Up Pods',
    icon: '🧩',
    age: 'Ages 7-12',
    blurb: 'AI-detected gaps + custom plan for fast catch-up.',
    href: '/courses/phonics-foundation',
    accent: 'from-indigo-100 via-white to-lime-100'
  }
];

export default function PopularPrograms() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (offset: number) => scrollRef.current?.scrollBy({ left: offset, behavior: 'smooth' });

  return (
    <section className="px-6 py-12">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div>
          <div className="gradient-chip">Popular Programs</div>
          <h2 className="mt-2 text-3xl font-semibold text-gray-900">Pick a track or mix and match levels</h2>
        </div>
        <div className="hidden sm:flex gap-2">
          <button
            onClick={() => scroll(-320)}
            className="rounded-full border border-gray-200 bg-white p-3 text-sm"
            aria-label="Previous track"
          >
            
            ←
          </button>
          <button
            onClick={() => scroll(320)}
            className="rounded-full border border-gray-200 bg-white p-3 text-sm"
            aria-label="Next track"
          >
            →
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="mt-6 flex gap-5 overflow-x-auto pb-4">
        {programs.map((program) => (
          <div
            key={program.title}
            className={`min-w-[260px] flex-1 rounded-3xl bg-gradient-to-br ${program.accent} p-6 shadow-lg shadow-blue-500/5 backdrop-blur border border-white/60`}
          >
            <div className="text-3xl">{program.icon}</div>
            <div className="mt-2 text-sm uppercase tracking-widest text-gray-500">{program.age}</div>
            <h3 className="mt-1 text-xl font-semibold text-gray-900">{program.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{program.blurb}</p>
            <Link to={program.href} className="mt-4 inline-flex items-center text-sm font-semibold text-tiny-blue-600">
              Learn more →
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
