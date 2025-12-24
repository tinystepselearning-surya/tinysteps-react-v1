// src/components/Home/GlobalImpactSection.tsx
// @ts-nocheck
import React from "react";
import { motion } from "framer-motion";

const metrics = [
  {
    value: "9+",
    label: "Countries",
    detail: "Expanding across continents with active cohorts in metros and tier-2 cities.",
  },
  {
    value: "3500+",
    label: "Learners guided since 2020",
    detail: "Personalised phonics, grammar & public speaking plans",
  },
  {
    value: "9 countries",
    label: "Live cohorts worldwide",
    detail: "India • US • UK • Canada • Singapore • Malaysia • Vietnam • UAE • Australia",
  },
  {
    value: "95% satisfaction",
    label: "Parent happiness score",
    detail: "Weekly AI progress mails + WhatsApp mentor access",
  },
  {
    value: "< 6 hrs",
    label: "Advisor response time",
    detail: "Dedicated WhatsApp line + 1:1 onboarding call",
  },
];

const countries = ["India", "United States", "United Kingdom", "Canada", "Singapore", "Malaysia", "Vietnam", "UAE", "Australia"];

// Dot positions tuned for a clean “impact blob” look (not a real map)
const blips = [
  { id: "india", x: 24, y: 44, label: "India", size: 11 },
  { id: "us", x: 40, y: 30, label: "United States", size: 10 },
  { id: "uk", x: 48, y: 33, label: "United Kingdom", size: 9 },
  { id: "canada", x: 44, y: 22, label: "Canada", size: 9 },
  { id: "singapore", x: 55, y: 46, label: "Singapore", size: 9 },
  { id: "malaysia", x: 57, y: 51, label: "Malaysia", size: 9 },
  { id: "vietnam", x: 60, y: 56, label: "Vietnam", size: 9 },
  { id: "uae", x: 66, y: 66, label: "UAE", size: 9 },
  { id: "australia", x: 75, y: 74, label: "Australia", size: 9 },
];

const WorldMap = () => (
  <div className="relative w-full">
    {/* map card header spacing */}
    <div className="relative aspect-[16/10] w-full">
      <svg
        viewBox="0 0 1000 620"
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label="Impact map showing Tiny Steps presence"
      >
        <defs>
          <linearGradient id="tsBlob" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#FFD6A5" stopOpacity="0.88" />
            <stop offset="0.46" stopColor="#FFB5E8" stopOpacity="0.84" />
            <stop offset="0.72" stopColor="#C5B3FF" stopOpacity="0.82" />
            <stop offset="1" stopColor="#A0C4FF" stopOpacity="0.86" />
          </linearGradient>

          <radialGradient id="tsBgWash" cx="30%" cy="25%" r="70%">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>

          <filter id="blobShadow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="16" result="b" />
            <feOffset dx="0" dy="10" in="b" result="o" />
            <feColorMatrix
              in="o"
              type="matrix"
              values="
                0 0 0 0 0
                0 0 0 0 0
                0 0 0 0 0
                0 0 0 0.18 0"
            />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 0.55 0"
              result="glow"
            />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* soft wash */}
        <rect x="0" y="0" width="1000" height="620" fill="url(#tsBgWash)" opacity="0.55" />

        {/* big blob */}
        <path
          filter="url(#blobShadow)"
          d="M165,330
             C158,250 235,190 340,178
             C435,168 470,132 565,148
             C645,161 645,228 735,238
             C835,248 905,294 915,366
             C925,443 858,488 760,502
             C640,520 575,490 490,512
             C390,540 252,520 205,450
             C182,416 171,372 165,330 Z"
          fill="url(#tsBlob)"
          opacity="0.98"
        />

        {/* subtle highlight swoosh */}
        <path
          d="M318,425
             C300,388 330,360 382,350
             C440,339 496,354 518,382
             C540,410 508,441 454,455
             C396,470 338,458 318,425 Z"
          fill="#FFF"
          opacity="0.22"
        />

        {/* dots */}
        {blips.map((b) => {
          const cx = (b.x / 100) * 1000;
          const cy = (b.y / 100) * 620;
          const r = b.size ?? 10;

          const labelW = Math.max(92, b.label.length * 7.2);

          return (
            <g key={b.id}>
              {/* outer glow */}
              <circle cx={cx} cy={cy} r={r * 2.05} fill="#FFB07C" opacity="0.22" filter="url(#softGlow)" />
              {/* core dot */}
              <circle cx={cx} cy={cy} r={r} fill="#FF9A62" />
              <circle cx={cx} cy={cy} r={r * 0.62} fill="#FFD3B6" opacity="0.95" />

              {/* label chip */}
              <g transform={`translate(${cx + 18}, ${cy + 5})`}>
                <rect
                  x={0}
                  y={-16}
                  rx={12}
                  ry={12}
                  width={labelW}
                  height={28}
                  fill="rgba(255,255,255,0.78)"
                  stroke="rgba(0,0,0,0.06)"
                />
                <text x={10} y={4} fontSize="14" fontWeight="600" fill="#0F172A" fontFamily="'Inter', system-ui, sans-serif">
                  {b.label}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* gentle pulse overlay (CSS only, respects reduced motion) */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .ts-pulse-dot::after{
            content:'';
            position:absolute;
            inset:-10px;
            border-radius:999px;
            background: rgba(255,154,98,0.16);
            animation: tsPulse 1.7s ease-in-out infinite;
          }
          @keyframes tsPulse{
            0%{ transform: scale(0.72); opacity: .35; }
            70%{ transform: scale(1.28); opacity: 0; }
            100%{ transform: scale(1.28); opacity: 0; }
          }
        }
      `}</style>
    </div>
  </div>
);

const MetricCard = ({ metric }) => (
  <motion.div
    whileHover={{ y: -4 }}
    transition={{ type: "spring", stiffness: 260, damping: 20 }}
    className="rounded-2xl border border-black/5 bg-white/90 p-5 shadow-sm"
  >
    <div className="text-2xl font-extrabold text-slate-900">{metric.value}</div>
    <div className="mt-1 text-sm font-semibold text-slate-800">{metric.label}</div>
    <p className="mt-2 text-xs leading-relaxed text-gray-600">{metric.detail}</p>
  </motion.div>
);

const GlobalImpactSection = () => {
  const primaryCards = metrics.slice(0, 4);
  const secondary = metrics[4];

  return (
    <section data-animate="fade-up" className="bg-gradient-to-b from-white to-slate-50/60 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[36px] border border-orange-100/70 bg-white/80 p-8 shadow-card-hover lg:p-10">
          {/* soft background blobs */}
          <div className="pointer-events-none absolute inset-x-0 -top-40 h-72 bg-[radial-gradient(circle,_rgba(255,196,125,0.35),_transparent_60%)]" />
          <div className="pointer-events-none absolute -bottom-28 right-10 h-56 w-56 rounded-full bg-[#9cd6ff]/35 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
            {/* LEFT */}
            <div className="space-y-5">
              <div className="gradient-chip w-max">Global parent community</div>

              <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
                Loved across continents,
                <br />
                rooted in India
              </h2>

              <p className="max-w-[58ch] text-base leading-relaxed text-gray-700 md:text-lg">
                Families in metros and tier-2 cities — plus expat parents across the US, UK, Singapore, Malaysia, Vietnam, UAE, Canada and Australia — rely on
                Tiny Steps for AI-curated English learning paths.
              </p>

              {/* Stat cards (4 like the reference) */}
              <div className="grid gap-4 sm:grid-cols-2">
                {primaryCards.map((m) => (
                  <MetricCard key={m.label} metric={m} />
                ))}
              </div>

              {/* Extra metric as a premium “info strip” */}
              <div className="rounded-2xl border border-black/5 bg-white/85 p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <div className="text-lg font-extrabold text-slate-900">{secondary.value}</div>
                  <div className="text-sm font-semibold text-slate-800">{secondary.label}</div>
                </div>
                <p className="mt-1.5 text-xs text-gray-600">{secondary.detail}</p>
              </div>

              {/* Countries chips */}
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-gray-500">Serving families in</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {countries.map((country) => (
                    <span
                      key={country}
                      className="rounded-full border border-gray-200 bg-white/80 px-3 py-1 text-xs font-semibold text-gray-700"
                    >
                      {country}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="relative">
              <div className="rounded-[32px] border border-black/5 bg-white/85 p-6 shadow-sm">
                <div className="text-sm font-semibold uppercase tracking-[0.32em] text-gray-500">Impact map</div>

                <div className="mt-4 rounded-[28px] border border-white/60 bg-gradient-to-br from-[#fff4dd] via-white to-[#d6ecff] p-6 shadow-inner">
                  <WorldMap />
                </div>

                <p className="mt-4 text-sm text-gray-600">
                  Each glow represents an active Tiny Steps cohort where certified mentors run live sessions and share AI insights with parents.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GlobalImpactSection;
