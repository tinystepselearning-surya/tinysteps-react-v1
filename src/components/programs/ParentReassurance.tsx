import React from 'react';
import { Link } from 'react-router-dom';

type ParentReassuranceProps = {
  programName?: string;
};

export default function ParentReassurance({ programName = 'Tiny Steps' }: ParentReassuranceProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-6 sm:py-8">
      <div className="rounded-[22px] border border-slate-200 bg-white px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Assessment before enrolment
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Free assessment. Clear recommendation. You decide.
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The free assessment helps you understand whether {programName} is a suitable next step for your child. No payment or enrolment commitment is required to take the assessment.
            </p>
          </div>

          <Link
            to="/book-demo"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Book Free 35-Minute Demo
          </Link>
        </div>

        <ol className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">1</span>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Assess the relevant skills</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                The teacher checks the areas connected to the concern you shared.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">2</span>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Recommend a starting point</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                You receive the recommended pathway and starting level, with current schedule and pricing context.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">3</span>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Decide what to do next</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Review the recommendation and continue only if the programme is the right fit for your child.
              </p>
            </div>
          </li>
        </ol>
      </div>
    </section>
  );
}
