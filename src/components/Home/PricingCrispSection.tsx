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

const planNames = ['Starter', 'Growth', 'Intensive'];

const PricingCrispSection: React.FC = () => {
  return (
    <section id="one-to-one-pricing" className="bg-slate-50/60 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:gap-12">
          <div className="lg:sticky lg:top-28">
            <p className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              Standard live 1:1 plans
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Simple 1:1 pricing
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              Every standard 1:1 package uses the same per-class rate and 35-minute class duration. Choose the monthly class count that suits your schedule; programme and starting level are confirmed separately through assessment.
            </p>

            <div className="mt-5 rounded-[20px] border border-slate-200 bg-white px-5 py-4">
              <p className="text-sm font-semibold text-slate-950">Current standard pricing</p>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">{STANDARD_PRICING_SUMMARY}</p>
            </div>

            <div className="mt-4 rounded-[20px] border border-slate-200 bg-white px-5 py-4">
              <p className="text-sm font-semibold text-slate-950">Other class formats are available</p>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">
                Small-group and selected native English-speaking teacher formats have their own current schedules and fee details.
              </p>
              <Link
                to="/pricing"
                className="mt-3 inline-flex text-sm font-semibold text-sky-700 underline decoration-sky-300 underline-offset-4 hover:text-sky-900"
              >
                Compare all formats
              </Link>
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Current scheduling, cancellation and refund terms are available with the full pricing details.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
              >
                View pricing details
              </Link>
              <Link
                to="/book-demo"
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {FREE_DEMO_CTA_LABEL}
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            {ONE_TO_ONE_MONTHLY_PACKAGES.map((plan, index) => (
              <div
                key={plan.classes}
                className="group rounded-[22px] border border-slate-200 bg-white px-5 py-5 transition hover:border-slate-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.05)] sm:px-6"
              >
                <div className="grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                    {String(index + 1).padStart(2, '0')}
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {planNames[index]}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
                      {plan.classes} classes / month
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatINR(PER_CLASS_PRICE)} per class • {plan.durationMinutes} mins
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <div className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                      {formatINR(plan.monthlyFee)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">monthly package</div>
                  </div>
                </div>
              </div>
            ))}

            <div className="rounded-[20px] border border-dashed border-slate-300 bg-white/60 px-5 py-4 text-sm leading-6 text-slate-600">
              Package size is a scheduling choice, not a different curriculum tier. The assessment determines the child&apos;s recommended programme and starting level.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingCrispSection;
