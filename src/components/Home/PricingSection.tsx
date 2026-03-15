import React from 'react';
import { motion } from 'framer-motion';
import Button from '../Button/Button';
import {
  formatINR,
  ONE_TO_ONE_MONTHLY_PACKAGES,
  PER_CLASS_PRICE,
  ULTRA_PREMIUM_PRICING,
} from '../../config/pricing';

const planMeta: Record<string, { name: string; highlight: boolean; note: string }> = {
  starter: {
    name: 'Starter Pack',
    highlight: false,
    note: 'Great for starting ages 3–6',
  },
  growth: {
    name: 'Growth Pack',
    highlight: true,
    note: 'Most popular for ages 5–10',
  },
  intensive: {
    name: 'Intensive Pack',
    highlight: false,
    note: 'Ideal for advanced or fast catch-up',
  },
};

const plans = ONE_TO_ONE_MONTHLY_PACKAGES.map((plan) => {
  const meta = planMeta[plan.id] || planMeta.starter;
  return {
    name: meta.name,
    price: formatINR(plan.monthlyFee),
    bullets: [
      `${plan.classes} live 1:1 classes (${plan.durationMinutes} mins each)`,
      `Effective rate: ${formatINR(PER_CLASS_PRICE)} per class`,
      meta.note,
    ],
    highlight: meta.highlight,
  };
});

const PricingSection = () => {
  return (
    <section className="bg-gradient-to-b from-slate-50 to-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <h3 className="font-heading text-2xl font-bold md:text-3xl">
            Tiny Steps Pricing
          </h3>
          <p className="mt-2 text-sm text-gray-600">Standard Program • Classes with expert Indian teachers</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <motion.div
              key={p.name}
              className={`rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200 ${
                p.highlight ? 'border-2 border-primary-500' : ''
              }`}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
            >
              <h4 className="font-heading text-xl font-bold text-gray-900">
                {p.name}
              </h4>
              <div className="mt-2 text-2xl font-extrabold text-gray-900">
                {p.price}
              </div>
              <ul className="mt-4 space-y-2 text-gray-700">
                {p.bullets.map((b) => (
                  <li key={b}>• {b}</li>
                ))}
              </ul>
              <div className="mt-6">
                <Button className="w-full">Choose Plan</Button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="relative mt-10 overflow-hidden rounded-[32px] border border-amber-200/30 bg-gradient-to-br from-[#0a1224] via-[#111d38] to-[#1a2747] p-8 text-white shadow-[0_30px_90px_-45px_rgba(2,6,23,0.95)]">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-amber-300/25 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-sky-300/15 blur-3xl" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-heading text-2xl font-bold text-white">
                Ultra Premium Program
              </h4>
              <span className="inline-flex rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-900">
                International Mentor Experience
              </span>
            </div>
            <p className="mt-1 text-sm text-amber-100">
              Classes with native English-speaking teachers
            </p>
            <p className="mt-3 text-sm text-slate-200">
              Premium option for international accent exposure, advanced speaking confidence, and global communication practice.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {ULTRA_PREMIUM_PRICING.map((row) => (
                <div
                  key={row.ratio}
                  className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-sm"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-amber-200">
                    {row.ratio}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">{row.format}</p>
                  <p className="mt-2 text-lg font-bold text-white">
                    {formatINR(row.perClass)}
                    <span className="ml-1 text-xs font-medium text-slate-200">{row.unitLabel}</span>
                  </p>
                  <p className="text-xs text-slate-200">
                    {formatINR(row.package12)} {row.packageLabel}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-300">
              Batch availability depends on age, level, and suitable peer matching.
            </p>
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-3xl text-center text-sm text-gray-600">
          Transparent • Flexible • Premium • Worth it. If you don’t see progress
          in 30 days, we extend free classes until you do.
        </p>
      </div>
    </section>
  );
};

export default PricingSection;
