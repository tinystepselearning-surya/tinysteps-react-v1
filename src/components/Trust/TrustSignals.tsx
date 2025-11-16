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

const Testimonial = ({ name, city, text }: { name: string; city: string; text: string }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="rounded-2xl bg-white/80 backdrop-blur p-5 border border-gray-100 shadow-lg"
  >
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-tiny-blue-500 to-tiny-purple-500 ring-2 ring-white" />
      <div>
        <div className="text-sm font-semibold text-gray-900">{name}</div>
        <div className="text-xs text-gray-600">{city}</div>
      </div>
      <div className="ml-auto text-tiny-orange-600">★★★★★</div>
    </div>
    <p className="mt-3 text-sm text-gray-700">{text}</p>
  </motion.div>
);

const TeacherCard = ({ name, role, quals }: { name: string; role: string; quals: string }) => (
  <motion.div
    whileHover={{ scale: 1.02, rotateX: 1, rotateY: -1 }}
    className="rounded-2xl p-5 bg-white shadow-neumorphic border border-gray-100"
  >
    <div className="flex items-center gap-4">
      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-tiny-purple-500 to-tiny-blue-500" />
      <div>
        <div className="font-semibold text-gray-900">{name}</div>
        <div className="text-xs text-gray-600">{role}</div>
      </div>
    </div>
    <div className="mt-3 text-xs text-gray-700">{quals}</div>
  </motion.div>
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
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-5 py-2 text-sm font-semibold text-gray-800 shadow-sm"
          >
            {expanded ? 'Hide detailed proof' : 'View detailed proof'}
            <span className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
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
                <StatCard value="3500+" label="Students taught worldwide" />
                <StatCard value="95%" label="Parent satisfaction" />
                <StatCard value="9+" label="Countries (IN, US, UK, CA, SG, MY, VN, UAE, AU)" />
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/80 backdrop-blur p-4 border border-gray-100 text-sm text-gray-700 flex items-center gap-3">
                  <span className="h-8 w-8 rounded-full bg-tiny-green-500/20 text-tiny-green-600 grid place-items-center">🔒</span>
                  SSL secure • Safe payments
                </div>
                <div className="rounded-2xl bg-white/80 backdrop-blur p-4 border border-gray-100 text-sm text-gray-700 flex items-center gap-3">
                  <span className="h-8 w-8 rounded-full bg-tiny-purple-500/20 text-tiny-purple-600 grid place-items-center">🤖</span>
                  AI-curated lessons + parent insight reports
                </div>
                <div className="rounded-2xl bg-white/80 backdrop-blur p-4 border border-gray-100 text-sm text-gray-700 flex items-center gap-3">
                  <span className="h-8 w-8 rounded-full bg-tiny-orange-500/20 text-tiny-orange-600 grid place-items-center">✅</span>
                  Refund policy • Transparent terms
                </div>
              </div>

              <div className="mt-10 grid gap-4 md:grid-cols-3">
                <Testimonial name="Anita Rao" city="Bengaluru" text="My daughter's reading improved 40% in 3 months." />
                <Testimonial name="S. Patel" city="Ahmedabad" text="SATPIN routine made reading feel like playtime." />
                <Testimonial name="R. Sharma" city="Pune" text="Grammar finally clicked, writing is clear now." />
              </div>

              <div className="mt-10 grid gap-4 md:grid-cols-3">
                <TeacherCard name="Teacher Name" role="Lead Phonics" quals="Cambridge Phonics Cert • 7 yrs" />
                <TeacherCard name="Teacher Name" role="Grammar" quals="MA Eng • 8 yrs" />
                <TeacherCard name="Ms. Neha" role="Public Speaking" quals="CELTA • 6 yrs" />
              </div>

              <div className="mt-10 rounded-2xl border border-gray-100 bg-white/80 backdrop-blur p-4 text-xs text-gray-600 flex flex-wrap items-center justify-center gap-4">
                <span className="flex items-center gap-2"><span>🔒</span>SSL</span>
                <span className="flex items-center gap-2"><span>💳</span>UPI / Cards / Netbanking</span>
                <span className="flex items-center gap-2"><span>🛡️</span>Data protection</span>
                <span className="flex items-center gap-2"><span>⭐</span>100% Parent Satisfaction</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
