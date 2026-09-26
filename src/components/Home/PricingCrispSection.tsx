import React from 'react';
import { Link } from 'react-router-dom';
import {
  formatINR,
  ONE_TO_ONE_MONTHLY_PACKAGES,
  PER_CLASS_PRICE,
} from '../../config/pricing';
import {
  FREE_DEMO_CTA_LABEL,
  STANDARD_PRICING_SUMMARY,
} from '../../config/publicOffer';

const PricingCrispSection: React.FC = () => {
  return (
    <section
      id="one-to-one-pricing"
      className="bg-slate-50/60 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="mb-2 inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Standard live 1:1 plans
          </p>
          <h2 className="text-center text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
            Simple 1:1 pricing
          </h2>
          <p className="mt-3 text-center text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Standard live 1:1 pricing is shared across the core programme system; programme and starting-level fit are confirmed through assessment.
          </p>
          <p className="mt-3 text-center text-sm font-semibold text-slate-800">
            {STANDARD_PRICING_SUMMARY}
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {/* Starter Pack */}
          <div className="relative flex flex-col justify-between rounded-[24px] border border-slate-200 bg-white p-6">
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

          </div>

          {/* Growth Pack */}
          <div className="relative flex flex-col justify-between rounded-[24px] border border-slate-200 bg-white p-6">
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

          </div>
        </div>

        <p className="mx-auto mt-5 max-w-3xl text-center text-sm leading-6 text-slate-600">
          All standard 1:1 packages use the same per-class rate and class duration. Package size is a scheduling choice; the child&apos;s programme and starting level are determined separately.
        </p>

        <div className="mt-7 rounded-[24px] border border-slate-200 bg-slate-50/80 px-5 py-4 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <p className="text-sm font-semibold text-slate-900">Other class formats are available</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Small-group classes and optional native English-speaking teacher formats are offered on selected schedules. Keep the homepage decision simple; the full pricing page shows the current format and fee details.
            </p>
          </div>
          <Link
            to="/pricing"
            className="mt-3 inline-flex shrink-0 text-sm font-semibold text-sky-700 underline decoration-sky-300 underline-offset-4 hover:text-sky-900 sm:mt-0"
          >
            Compare all formats
          </Link>
        </div>

        <div className="mt-7 flex flex-col items-center justify-center text-xs text-slate-500 sm:text-sm">
          <p className="text-center leading-6">
            Current scheduling, cancellation and refund terms are available with the full pricing details.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
            >
              View pricing details
            </Link>
            <Link
              to="/book-demo"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {FREE_DEMO_CTA_LABEL}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingCrispSection;
