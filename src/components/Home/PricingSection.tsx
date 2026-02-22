import React from 'react';
import { motion } from 'framer-motion';
import Button from '../Button/Button';
import { formatINR, ONE_TO_ONE_MONTHLY_PACKAGES, PER_CLASS_PRICE } from '../../config/pricing';

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
            Flexible Premium Plans for Indian Families
          </h3>
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

        <p className="mx-auto mt-6 max-w-3xl text-center text-sm text-gray-600">
          Transparent • Flexible • Premium • Worth it. If you don’t see progress
          in 30 days, we extend free classes until you do.
        </p>
      </div>
    </section>
  );
};

export default PricingSection;
