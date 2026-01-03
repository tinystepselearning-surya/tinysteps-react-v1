import React from 'react';
import Button from '../Button/Button';

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
            Choose a flexible monthly pack. Every plan includes live 1:1 classes, AI-guided practice, and clear progress updates for parents.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {/* Starter Pack */}
          <div className="relative flex flex-col justify-between rounded-3xl bg-white/80 p-6 shadow-sm ring-1 ring-slate-100 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Starter · 8 classes / month
            </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {formatINR(DEFAULT_PER_CLASS_PRICE)}<span className="text-sm font-normal text-slate-500"> / class</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">{formatINR(DEFAULT_PER_CLASS_PRICE * 8)} total · billed monthly</p>
            <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
              <li>• Personalised assessment + roadmap</li>
              <li>• Around 2 classes per week</li>
              <li>• Phonics, grammar, or public speaking</li>
            </ul>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button className="inline-flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-orange-400 to-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition">
                Book Free Assessment Class
              </button>
              <button className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
                Learn More
              </button>
            </div>
          </div>

          {/* Growth Pack (Most Popular) */}
          <div className="relative flex flex-col justify-between rounded-3xl bg-white p-6 shadow-lg ring-2 ring-orange-300/70">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-3 py-1 text-xs font-semibold text-white shadow-md">
              Most popular
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Growth · 16 classes / month
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              ₹525<span className="text-sm font-normal text-slate-500"> / class</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">₹8,400 total · billed monthly</p>
            <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
              <li>• Personalised assessment + roadmap</li>
              <li>• Around 3–4 classes per week</li>
              <li>• Phonics, grammar, or public speaking</li>
            </ul>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button className="inline-flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-orange-400 to-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition">
                Book Free Assessment Class
              </button>
              <button className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
                Learn More
              </button>
            </div>
          </div>

          {/* Power Pack */}
          <div className="relative flex flex-col justify-between rounded-3xl bg-white/80 p-6 shadow-sm ring-1 ring-slate-100 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Power · 24 classes / month
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              ₹500<span className="text-sm font-normal text-slate-500"> / class</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">₹12,000 total · billed monthly</p>
            <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
              <li>• Personalised assessment + roadmap</li>
              <li>• Around 5–6 classes per week</li>
              <li>• Phonics, grammar, or public speaking</li>
            </ul>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button className="inline-flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-orange-400 to-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition">
                Book Free Assessment Class
              </button>
              <button className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
                Learn More
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-2 text-xs sm:text-sm text-slate-500">
          <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span>✅ No long-term lock-in</span>
            <span>✅ Easy class rescheduling</span>
            <span>✅ Pause anytime between months</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingCrispSection;
