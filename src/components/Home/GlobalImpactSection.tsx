// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';

const metrics = [
  { value: '3500+', label: 'Learners guided since 2020', detail: 'Personalised phonics, grammar & public speaking plans' },
  { value: '8 countries', label: 'Live cohorts worldwide', detail: 'India • US • UK • Canada • Singapore • Malaysia • Vietnam • UAE • Australia' },
  { value: '95% satisfaction', label: 'Parent happiness score', detail: 'Weekly AI progress mails + WhatsApp mentor access' },
  { value: '< 6 hrs', label: 'Advisor response time', detail: 'Dedicated WhatsApp line + 1:1 onboarding call' }
];

const countries = ['India', 'United States', 'United Kingdom', 'Canada', 'Singapore', 'Malaysia', 'Vietnam', 'United Arab Emirates', 'Australia'];

const blips = [
  { cx: 180, cy: 140, label: 'US' },
  { cx: 230, cy: 160, label: 'Canada' },
  { cx: 310, cy: 140, label: 'UK' },
  { cx: 420, cy: 190, label: 'India' },
  { cx: 460, cy: 200, label: 'UAE' },
  { cx: 500, cy: 210, label: 'Singapore' },
  { cx: 520, cy: 220, label: 'Malaysia' },
  { cx: 540, cy: 200, label: 'Vietnam' },
  { cx: 600, cy: 250, label: 'Australia' }
];

const WorldMap = () => (
  <svg viewBox="0 0 720 360" className="h-72 w-full" role="img" aria-label="World map showing Tiny Steps presence">
    <defs>
      <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffd89c" />
        <stop offset="50%" stopColor="#f6b6ff" />
        <stop offset="100%" stopColor="#8fd3f4" />
      </linearGradient>
      <radialGradient id="halo" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width="720" height="360" fill="url(#halo)" opacity="0.4" />
    <path
      d="M50 210C90 120 190 80 260 120C300 140 350 140 400 110C470 70 560 120 600 160C660 220 700 230 680 270C660 310 600 330 540 320C480 310 430 340 360 330C290 320 230 280 170 280C120 280 40 260 50 210Z"
      fill="url(#mapGradient)"
      opacity="0.9"
    />
    <path
      d="M140 260C200 240 240 260 280 300C320 340 260 350 210 330C180 318 140 300 140 260Z"
      fill="#fef6e4"
      opacity="0.7"
    />
    {blips.map((blip) => (
      <g key={blip.label}>
        <circle cx={blip.cx} cy={blip.cy} r={8} fill="#ff8f5c" opacity="0.85" />
        <circle cx={blip.cx} cy={blip.cy} r={16} fill="#ff8f5c" opacity="0.2" />
        <text x={blip.cx + 12} y={blip.cy + 4} fontSize="12" fill="#0f172a" fontFamily="'Inter', sans-serif">{blip.label}</text>
      </g>
    ))}
  </svg>
);

const GlobalImpactSection = () => {
  return (
    <section data-animate="fade-up" className="bg-gradient-to-b from-white to-slate-50/50 px-6 py-16">
      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 overflow-hidden rounded-[32px] border border-orange-100 bg-white/80 p-8 shadow-card-hover lg:flex-row">
        <div className="absolute inset-x-0 -top-32 h-64 bg-[radial-gradient(circle,_rgba(255,196,125,0.35),_transparent_60%)]" />
        <div className="absolute -bottom-24 right-10 h-48 w-48 rounded-full bg-[#9cd6ff]/40 blur-3xl" />
        <div className="relative flex-1 space-y-4">
          <div className="gradient-chip w-max">Global parent community</div>
          <h2 className="text-3xl font-semibold text-gray-900 md:text-4xl">Loved across continents, rooted in India</h2>
          <p className="text-base text-gray-700 md:text-lg">
            Families in metros and tier-2 cities — plus expat parents across the US, UK, Singapore, Malaysia, Vietnam, UAE and Australia — rely on Tiny Steps for
            AI-curated English learning paths.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {metrics.map((metric) => (
              <motion.div
                key={metric.label}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-white/40 bg-white/90 p-4 shadow-sm"
              >
                <div className="text-xl font-semibold text-gray-900">{metric.value}</div>
                <div className="text-sm text-gray-600">{metric.label}</div>
                <p className="mt-2 text-xs text-gray-500">{metric.detail}</p>
              </motion.div>
            ))}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Serving families in</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {countries.map((country) => (
                <span key={country} className="rounded-full border border-gray-200 bg-white/80 px-3 py-1 text-xs font-semibold text-gray-700">
                  {country}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="relative flex-1 rounded-[28px] border border-white/60 bg-gradient-to-br from-[#fff4dd] via-white to-[#d6ecff] p-6 shadow-inner">
          <div className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">Impact map</div>
          <WorldMap />
          <p className="mt-4 text-xs text-gray-600">
            Each glow represents an active Tiny Steps cohort where certified mentors run live sessions and share AI insights with parents.
          </p>
        </div>
      </div>
    </section>
  );
};

export default GlobalImpactSection;
