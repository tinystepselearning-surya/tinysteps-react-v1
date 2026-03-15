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

        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h4 className="font-heading text-xl font-bold text-gray-900">
            Ultra Premium Program
          </h4>
          <p className="mt-1 text-sm text-gray-600">
            Classes with native English-speaking teachers
          </p>
          <p className="mt-3 text-sm text-gray-700">
            Premium option for international accent exposure, advanced speaking confidence, and global communication practice.
          </p>
          <div className="mt-4 grid gap-2 text-sm text-gray-700 md:grid-cols-2">
            {ULTRA_PREMIUM_PRICING.map((row) => (
              <p key={row.ratio}>
                {row.format}: {formatINR(row.perClass)} {row.unitLabel} • {formatINR(row.package12)} {row.packageLabel}
              </p>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Batch availability depends on age, level, and suitable peer matching.
          </p>
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
