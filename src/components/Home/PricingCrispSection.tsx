import React from 'react';
import { Link } from 'react-router-dom';
import {
  formatINR,
  ONE_TO_ONE_MONTHLY_PACKAGES,
  PER_CLASS_PRICE,
  ULTRA_PREMIUM_PRICING,
} from '../../config/pricing';

const PricingCrispSection: React.FC = () => {
  return (
    <section
      id="one-to-one-pricing"
      className="bg-gradient-to-b from-[#FDF7EC] via-white to-[#F3F7FF] py-20"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="mb-2 inline-flex items-center rounded-full bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 shadow-sm">
            1:1 Phonics · Grammar · Public Speaking
          </p>
          <h2 className="text-center text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
            Premium 1:1 classes, simple plans
          </h2>
          <p className="mt-3 text-center text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            <span className="font-semibold text-slate-900">Standard Program</span> • Classes with expert Indian teachers
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {/* Starter Pack */}
          <div className="relative flex flex-col justify-between rounded-3xl bg-white/80 p-6 shadow-sm ring-1 ring-slate-100 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
              Starter · {ONE_TO_ONE_MONTHLY_PACKAGES[0].classes} classes / month
            </p>
            <div className="mt-2">
              <div className="text-2xl font-bold text-slate-900">
                {formatINR(ONE_TO_ONE_MONTHLY_PACKAGES[0].monthlyFee)}
              </div>
              <div className="text-sm text-slate-600">
                {formatINR(PER_CLASS_PRICE)} per class • {ONE_TO_ONE_MONTHLY_PACKAGES[0].durationMinutes} mins
              </div>
            </div>
            <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
              <li>• Personalised assessment + roadmap</li>
              <li>• Around 2 classes per week</li>
              <li>• Phonics, grammar, or public speaking</li>
            </ul>
          </div>

          {/* Growth Pack (Most Popular) */}
          <div className="relative flex flex-col justify-between rounded-3xl bg-white p-6 shadow-lg ring-2 ring-orange-300/70">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-3 py-1 text-xs font-semibold text-white shadow-md">
              Most popular
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
              Growth · {ONE_TO_ONE_MONTHLY_PACKAGES[1].classes} classes / month
            </p>
            <div className="mt-2">
              <div className="text-2xl font-bold text-slate-900">
                {formatINR(ONE_TO_ONE_MONTHLY_PACKAGES[1].monthlyFee)}
              </div>
              <div className="text-sm text-slate-600">
                {formatINR(PER_CLASS_PRICE)} per class • {ONE_TO_ONE_MONTHLY_PACKAGES[1].durationMinutes} mins
              </div>
            </div>
            <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
              <li>• Personalised assessment + roadmap</li>
              <li>• Around 3–4 classes per week</li>
              <li>• Phonics, grammar, or public speaking</li>
            </ul>
          </div>

          {/* Intensive Pack */}
          <div className="relative flex flex-col justify-between rounded-3xl bg-white/80 p-6 shadow-sm ring-1 ring-slate-100 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
              Intensive · {ONE_TO_ONE_MONTHLY_PACKAGES[2].classes} classes / month
            </p>
            <div className="mt-2">
              <div className="text-2xl font-bold text-slate-900">
                {formatINR(ONE_TO_ONE_MONTHLY_PACKAGES[2].monthlyFee)}
              </div>
              <div className="text-sm text-slate-600">
                {formatINR(PER_CLASS_PRICE)} per class • {ONE_TO_ONE_MONTHLY_PACKAGES[2].durationMinutes} mins
              </div>
            </div>
            <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
              <li>• Personalised assessment + roadmap</li>
              <li>• Around 5–6 classes per week</li>
              <li>• Phonics, grammar, or public speaking</li>
            </ul>
          </div>
        </div>

        <div className="relative mt-8 overflow-hidden rounded-[32px] border border-amber-200/30 bg-gradient-to-br from-[#0a1224] via-[#111d38] to-[#1a2747] p-6 text-white shadow-[0_30px_90px_-45px_rgba(2,6,23,0.95)] md:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-amber-300/25 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-sky-300/15 blur-3xl" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <p className="inline-flex rounded-full border border-amber-200/40 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100">
                Ultra Premium Program
              </p>
              <span className="inline-flex rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-900">
                International Mentor Experience
              </span>
            </div>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Classes with native English-speaking teachers
            </h3>
            <p className="mt-3 max-w-3xl text-sm text-slate-200 md:text-base">
              Optional premium format for parents seeking global accent exposure, advanced speaking confidence, and a high-touch classroom experience.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ULTRA_PREMIUM_PRICING.map((row) => (
                <div
                  key={row.ratio}
                  className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-sm"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-amber-200">
                    {row.ratio}
                  </p>
                  <p className="mt-1 text-base font-semibold text-white">{row.format}</p>
                  <p className="mt-3 text-xl font-bold text-white">
                    {formatINR(row.perClass)}
                    <span className="ml-1 text-xs font-medium text-slate-200">{row.unitLabel}</span>
                  </p>
                  <p className="mt-1 text-sm text-slate-200">
                    {formatINR(row.package12)} {row.packageLabel}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-100">
              <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1">Live interactive classes</span>
              <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1">Premium speaking & listening exposure</span>
              <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1">Structured Tiny Steps curriculum</span>
            </div>
            <p className="mt-4 text-xs text-slate-300">
              Batch availability depends on age, level, and suitable peer matching.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-2 text-xs sm:text-sm text-slate-600">
          <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span>✅ No long-term lock-in</span>
            <span>✅ Easy class rescheduling</span>
            <span>✅ Pause anytime between months</span>
          </p>
          <div className="mt-4">
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
            >
              View pricing details
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingCrispSection;
