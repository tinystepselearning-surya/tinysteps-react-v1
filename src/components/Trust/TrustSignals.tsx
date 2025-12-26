export { default } from '../trust/trustsignals';
// @ts-nocheck
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const StatCard = ({ value, label }: { value: string; label: string }) => (
  <motion.div
    whileHover={{ scale: 1.03, y: -4 }}
    transition={{ type: 'spring', stiffness: 280 }}
    className="rounded-2xl bg-gradient-to-br from-tiny-blue-50 via-white to-tiny-purple-50 p-6 shadow-lg shadow-blue-500/10 hover:shadow-2xl hover:shadow-blue-500/20 border border-gray-100"
  >
    <div className="text-3xl font-extrabold text-gray-900 tracking-tight">{value}</div>
    <div className="mt-1 text-sm text-gray-600">{label}</div>
  </motion.div>
);

const FeatureChip = ({ icon, text }: { icon: any; text: string }) => (
  <div className="rounded-2xl bg-white/80 backdrop-blur p-4 border border-gray-100 text-sm text-gray-700 flex items-center gap-3">
    <span className={`h-8 w-8 rounded-full ${icon.bgColor} ${icon.textColor} grid place-items-center`}>
      {icon.symbol}
    </span>
    {text}
  </div>
);

export default function TrustSignals() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section data-animate="fade-up" className="relative py-14">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <div className="gradient-chip mx-auto w-max">Why Parents Trust Us</div>
          <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Proof, Not Promises</h2>
          <p className="mt-2 text-gray-700">Tap to scan the outcomes, testimonials, and mentor credentials that back Tiny Steps.</p>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-5 py-2 text-sm font-semibold text-gray-800 shadow-sm"
          >
            {expanded ? 'Hide detailed proof' : 'View detailed proof'}
            <span className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="trust-details"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <StatCard value="5000+" label="Students empowered globally" />
                <StatCard value="98%" label="Parent satisfaction rate" />
                <StatCard value="12+" label="Countries (IN, US, UK, CA, SG, MY, VN, UAE, AU, NZ, ZA, PH)" />
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <FeatureChip icon={{ symbol: '🔒', bgColor: 'bg-tiny-green-500/20', textColor: 'text-tiny-green-600' }} text="SSL secure • Safe payments" />
                <FeatureChip icon={{ symbol: '🤖', bgColor: 'bg-tiny-purple-500/20', textColor: 'text-tiny-purple-600' }} text="AI-curated lessons • Insightful reports" />
                <FeatureChip icon={{ symbol: '✅', bgColor: 'bg-tiny-orange-500/20', textColor: 'text-tiny-orange-600' }} text="Refund policy • Transparent terms" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
