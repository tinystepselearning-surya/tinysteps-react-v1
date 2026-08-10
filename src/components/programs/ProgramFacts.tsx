import React from 'react';
import { Link } from 'react-router-dom';

type ProgramFactsProps = {
  ageRange: string;
  format: string;
  duration: string;
  structure: string;
  outcomes: string[];
  ctaLabel?: string;
  ctaHref?: string;
};

export default function ProgramFacts({
  ageRange,
  format,
  duration,
  structure,
  outcomes,
  ctaLabel = 'Book Free 35-Minute Demo',
  ctaHref = '/book-demo',
}: ProgramFactsProps) {
  return (
    <section className="mx-auto max-w-4xl px-6 py-8">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-sky-50/30 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <div className="border-b border-slate-200/60 bg-white/60 px-6 py-4 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-slate-900">Program at a Glance</h2>
          <p className="mt-1 text-sm text-slate-600">Everything you need to know</p>
        </div>

        <div className="grid gap-px bg-slate-200/40 sm:grid-cols-2">
          <div className="bg-white px-6 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-lg">👶</div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Age Range</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{ageRange}</p>
              </div>
            </div>
          </div>

          <div className="bg-white px-6 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-lg">💻</div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Format</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{format}</p>
              </div>
            </div>
          </div>

          <div className="bg-white px-6 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-lg">⏱️</div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Duration</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{duration}</p>
              </div>
            </div>
          </div>

          <div className="bg-white px-6 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-lg">📚</div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Structure</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{structure}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Expected Outcomes</p>
          <ul className="mt-3 space-y-2">
            {outcomes.map((outcome, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-0.5 text-emerald-600">✓</span>
                <span>{outcome}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-slate-200/60 bg-white px-6 py-5 text-center">
          <Link
            to={ctaHref}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
