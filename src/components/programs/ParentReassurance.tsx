import React from 'react';
import { Link } from 'react-router-dom';

type ParentReassuranceProps = {
  programName?: string;
};

export default function ParentReassurance({ programName = 'Tiny Steps' }: ParentReassuranceProps) {
  return (
    <section className="mx-auto max-w-4xl px-6 py-8">
      <div className="overflow-hidden rounded-3xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-sky-50/40 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <div className="px-6 py-5 sm:px-8">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Assessment before enrolment</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Try the assessment before you decide</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              The free assessment helps you understand whether {programName} is a suitable next step for your child before you choose a plan.
            </p>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">1. Free 35-minute assessment</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                A Tiny Steps teacher checks the skills most relevant to the concern you shared and observes where your child is secure or getting stuck.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">2. Recommended starting point</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                You receive a clear recommendation for the most suitable pathway and starting level based on what the teacher observed.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                <span className="text-2xl">✓</span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">3. You decide</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Review the recommendation, available schedule and current pricing, then decide whether you want to continue. There is no enrolment commitment from taking the assessment.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-sky-200/60 bg-sky-50/50 px-6 py-4">
            <p className="text-sm font-semibold text-slate-900">What parents leave the assessment with</p>
            <ul className="mt-2 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              <li>• Observed strengths and current focus areas</li>
              <li>• Recommended pathway and starting level</li>
              <li>• Simple home-practice guidance where useful</li>
              <li>• Current class format, schedule and pricing options</li>
            </ul>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/book-demo"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Book Free 35-Minute Demo
            </Link>
            <p className="mt-3 text-xs text-slate-500">The assessment itself is free; no payment is required to book it.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
