import React from 'react';
import { Link } from 'react-router-dom';

type ParentReassuranceProps = {
  programName?: string;
};

export default function ParentReassurance({ programName = 'this program' }: ParentReassuranceProps) {
  return (
    <section className="mx-auto max-w-4xl px-6 py-8">
      <div className="overflow-hidden rounded-3xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-sky-50/40 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <div className="px-6 py-5 sm:px-8">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">No Commitment Required</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">What Happens Next?</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
              We make it easy to see if {programName} is the right fit for your child
            </p>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">1. Free Assessment</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                35-minute session with a trained mentor to understand your child's current level and learning style
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">2. Personalized Plan</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Receive a custom learning plan showing the recommended starting point, lesson structure, and expected milestones
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">3. You Decide</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Choose to enroll with a plan that fits your schedule and budget, or simply take the insights home—no pressure
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-sky-200/60 bg-sky-50/50 px-6 py-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-lg">💡</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">What You'll Receive After Assessment</p>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-emerald-600">•</span>
                    <span>Current skill level report with strengths and focus areas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-emerald-600">•</span>
                    <span>Recommended starting lesson and track placement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-emerald-600">•</span>
                    <span>Sample practice activities you can try at home immediately</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-emerald-600">•</span>
                    <span>Clear pricing options with no hidden fees</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/?book=1"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Book Your Free Assessment
            </Link>
            <p className="mt-3 text-xs text-slate-500">Takes 2 minutes • No credit card required</p>
          </div>
        </div>
      </div>
    </section>
  );
}
