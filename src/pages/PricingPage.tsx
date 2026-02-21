// @ts-nocheck
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FC } from 'react';
import Meta from '../components/common/Meta';
import { useAuthStore } from '../store/useAuthStore';
import { catalogs } from '../content/courses';
import { DISCOUNT_PERCENT, INTENSIVE_PLAN } from '../lib/pricingPlans';

const MRP_PER_SESSION = 400;           // Official 1:1 base rate
const DEFAULT_PACK_RATE = 400; // Use base rate for estimates

// ============================================================================
// DISCOUNT HELPERS (Deprecated for current pricing)
// ============================================================================
const DISCOUNT_PCT = 0;

const applyDiscount = (amount: number): number => {
  return Math.round(amount * (100 - DISCOUNT_PCT) / 100);
};

const fmtINR = (n: number): string => `₹${n.toLocaleString('en-IN')}`;

// PriceLine component: renders original (struck), badge, and offered price
const PriceLine: FC<{ original: number; suffix?: string; offerOnly?: boolean }> = ({
  original,
  suffix = '',
  offerOnly = false,
}) => {
  const offered = applyDiscount(original);
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="font-bold text-gray-900">{fmtINR(offered)}</span>
      {suffix && <span className="text-sm text-gray-600">{suffix}</span>}
    </div>
  );
};

// PriceRangeLine component: renders original range (struck), badge, and offered range
const PriceRangeLine: FC<{ minOriginal: number; maxOriginal: number }> = ({
  minOriginal,
  maxOriginal,
}) => {
  const minOffered = applyDiscount(minOriginal);
  const maxOffered = applyDiscount(maxOriginal);
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="font-bold text-gray-900">
        {fmtINR(minOffered)} – {fmtINR(maxOffered)}
      </span>
    </div>
  );
};

const parseWeeks = (duration: string) => {
  const match = duration.match(/(\d+)(?:[–-](\d+))?/);
  if (!match) return { min: 0, max: 0 };
  const min = parseInt(match[1], 10);
  const max = match[2] ? parseInt(match[2], 10) : min;
  return { min, max };
};

const parseClassesPerWeek = (frequency: string) => {
  const match = frequency.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 2;
};

import { PRICING_PLANS, formatINR as formatCurrency } from '../lib/pricingPlans';

const plans = [
  {
    name: 'Starter',
    sessions: 12,
    monthlyFee: 4800,
    title: '12 Classes / Month',
    badge: 'New families',
    highlight: false,
    color: 'from-white via-[#fff7ec] to-[#ffe0b5]',
    features: [
      'Personalised assessment + roadmap',
      'Live 1:1 classes with expert mentors',
      'Weekly AI insight recap',
      'WhatsApp nudges for practice',
    ],
  },
  {
    name: 'Growth',
    sessions: 16,
    monthlyFee: 6400,
    title: '16 Classes / Month',
    badge: 'Most popular',
    highlight: true,
    color: 'from-[#fff1d6] via-white to-[#dff1ff]',
    features: [
      'Everything in Starter',
      'Monthly mastery review with mentor',
      'Recorded class access + worksheets',
      'Parent Q&A call every month',
    ],
  },
  {
    name: 'Intensive',
    sessions: 24,
    monthlyFee: 9600,
    title: '24 Classes / Month',
    badge: 'Fast-track',
    highlight: false,
    color: 'from-white via-[#e8f3ff] to-[#f4e8ff]',
    features: [
      'Daily AI reading/speaking coach prompts',
      'Capstone showcase video production',
      'Priority scheduling & reschedules',
      'Optional Saturday masterclass',
    ],
  },
];

const PricingPage: FC = () => {
  useEffect(() => {
    document.title = 'Pricing | Tiny Steps';
  }, []);

  const coursePricing = useMemo(
    () =>
      catalogs.map((course) => {
        const weeks = parseWeeks(course.duration);
        const classesPerWeek = parseClassesPerWeek(course.frequency);
        const effectiveClassesPerWeek = Math.max(classesPerWeek, 3);
        const minSessions = weeks.min * effectiveClassesPerWeek;
        const maxSessions = weeks.max * effectiveClassesPerWeek;

        // Use the typical pack rate (~₹550) for fee estimates
        const minFee = minSessions * DEFAULT_PACK_RATE;
        const maxFee = maxSessions * DEFAULT_PACK_RATE;

        return {
          course,
          weeks,
          classesPerWeek,
          effectiveClassesPerWeek,
          minSessions,
          maxSessions,
          minFee,
          maxFee,
        };
      }),
    []
  );

  const planPricing = useMemo(() => plans, []);

  const navigate = useNavigate();
  const groupPricing = [
    {
      size: '1:1',
      fee12: 4800,
      save: null,
      bestFor: 'Premium 1:1 (all ages)',
      duration: '35 min',
      chip: 'Premium',
      theme: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        badge: 'bg-amber-100 text-amber-900',
      },
    },
    {
      size: '1:2',
      fee12: 3600,
      save: 25,
      bestFor: 'Early learners (4–10)',
      duration: '40 min',
      chip: 'Small group',
      theme: {
        bg: 'bg-sky-50',
        border: 'border-sky-200',
        badge: 'bg-sky-100 text-sky-900',
      },
    },
    {
      size: '1:3',
      fee12: 3000,
      save: 38,
      bestFor: 'Same-level kids (5–10)',
      duration: '45 min',
      chip: 'Small group',
      theme: {
        bg: 'bg-violet-50',
        border: 'border-violet-200',
        badge: 'bg-violet-100 text-violet-900',
      },
    },
    {
      size: '1:4',
      fee12: 2640,
      save: 45,
      bestFor: 'Confident learners (6–12)',
      duration: '50 min',
      chip: 'Small group',
      theme: {
        bg: 'bg-teal-50',
        border: 'border-teal-200',
        badge: 'bg-teal-100 text-teal-900',
      },
    },
    {
      size: '1:5',
      fee12: 2400,
      save: 50,
      bestFor: 'Practice groups (7–12)',
      duration: '55 min',
      chip: 'Small group',
      theme: {
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        badge: 'bg-rose-100 text-rose-900',
      },
    },
    {
      size: '1:6',
      fee12: 2160,
      save: 55,
      bestFor: 'Fluency & speaking (8–12)',
      duration: '60 min',
      chip: 'Small group',
      theme: {
        bg: 'bg-lime-50',
        border: 'border-lime-200',
        badge: 'bg-lime-100 text-lime-900',
      },
    },
  ];
  const baseGroupFee12 = 4800;

  const offerCatalog = {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: 'Tiny Steps Course Pricing',
    itemListElement: coursePricing.map((entry, index) => ({
      '@type': 'Offer',
      position: index + 1,
      itemOffered: {
        '@type': 'Course',
        name: entry.course.name,
        description: entry.course.overview.join(', '),
      },
      price: `${entry.minFee}`,
      priceCurrency: 'INR',
    })),
  };

  const user = useAuthStore().user;

  return (
    <div className="page-gradient min-h-screen">
      <Meta
        title="Pricing | Tiny Steps Online School"
        description="Premium 1:1 online English school for ages 3–12. IB-aligned phonics, grammar and public speaking with kind live mentors, AI-guided practice and weekly parent progress insights. Free assessment class; flexible monthly plans."
        canonical="https://tinystepslearning.com/pricing"
        jsonLd={offerCatalog}
      />

      <section className="relative px-6 pt-24 pb-10">
        <div className="mx-auto max-w-5xl glass-panel px-8 py-10 text-center">
          <div className="gradient-chip mx-auto w-max">
            ₹{MRP_PER_SESSION} per class • Choose 12, 16, or 24 classes per month
          </div>
          <h1 className="mt-3 text-3xl font-bold text-gray-900 md:text-4xl">
            Pricing that mirrors your child’s curriculum
          </h1>
          <p className="mt-3 text-gray-700">
            All plans are billed monthly. We’ll help you pick the right plan after a free assessment.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="grid gap-6 md:grid-cols-3">
          {planPricing.map((plan) => (
            <div
              key={plan.name}
              className={`relative overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-br ${plan.color} p-6 shadow-card-hover`}
            >
              {plan.badge && (
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${
                    plan.highlight
                      ? 'bg-[#ff8f5c] text-white'
                      : 'bg-white/80 text-gray-700'
                  }`}
                >
                  {plan.badge.toUpperCase()}
                </span>
              )}
              <h3 className="mt-4 text-2xl font-semibold text-gray-900">
                {plan.title}
              </h3>
              <div className="mt-4">
                <div className="text-2xl font-semibold text-gray-900">
                  {fmtINR(plan.monthlyFee)} / month
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {`₹${DEFAULT_PACK_RATE} per class • ${plan.sessions} live classes`}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span>✨</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                className={`mt-6 w-full rounded-2xl px-4 py-3 text-sm font-semibold ${
                  plan.highlight
                    ? 'bg-gray-900 text-white shadow-2xl'
                    : 'bg-white text-gray-900 shadow'
                }`}
                onClick={() => navigate('/?book=1')}
              >
                Enroll now
              </button>
              <p className="mt-2 text-[11px] text-gray-500">
                Need EMI or split payments? WhatsApp us and we’ll arrange it.
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-semibold text-gray-900">Small-Group Classes (Live)</h2>
          <p className="mt-2 text-sm text-gray-600">
            Same Tiny Steps curriculum • Level-matched groups • Monthly fee per child
          </p>
        </div>
        <div className="overflow-x-auto rounded-3xl bg-white shadow-card-hover border border-gray-100">
          <table className="w-full border-collapse text-sm text-gray-700">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Group size</th>
                <th className="px-4 py-3">Monthly fee (12 classes)</th>
                <th className="px-4 py-3">Session duration</th>
                <th className="px-4 py-3">Save vs 1:1</th>
                <th className="px-4 py-3">Best for</th>
              </tr>
            </thead>
            <tbody>
              {groupPricing.map((row) => {
                const savings = row.save == null ? 0 : baseGroupFee12 - row.fee12;
                return (
                  <tr
                    key={row.size}
                    className={`group border-t border-gray-100 border-l-4 ${row.theme.bg} ${row.theme.border} transition-shadow hover:shadow-sm`}
                  >
                    <td className="px-4 py-4 font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold">{row.size}</span>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${row.theme.badge}`}>
                          {row.chip}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-base font-semibold text-gray-900">{fmtINR(row.fee12)}/mo</div>
                      <div className="text-xs text-gray-600">
                        {row.save == null ? 'Premium 1:1' : `Save ${fmtINR(savings)}/mo`}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-700 font-medium">{row.duration}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${row.theme.badge}`}>
                        {row.save == null ? 'Base' : `Save ${row.save}%`}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-700 font-medium">{row.bestFor}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 space-y-1 text-center text-xs text-gray-500">
          <p>Fees shown are per child for 12 classes/month. Session duration increases with group size (35–60 minutes).</p>
          <p>We do a quick level check before placing your child in a group.</p>
        </div>
        <div className="mt-6 text-center">
          <button
            className="rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-2xl"
            onClick={() => navigate('/?book=1')}
          >
            Book a free assessment for group classes
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="overflow-x-auto rounded-3xl bg-white shadow-card-hover border border-gray-100">
          <table className="w-full border-collapse text-sm text-gray-700">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Classes / week</th>
                <th className="px-4 py-3">Total sessions</th>
                <th className="px-4 py-3">
                  Total fee (Premium 1:1 estimate)
                </th>
              </tr>
            </thead>
            <tbody>
              {coursePricing.map(
                ({
                  course,
                  weeks,
                  classesPerWeek,
                  effectiveClassesPerWeek,
                  minSessions,
                  maxSessions,
                  minFee,
                  maxFee,
                }) => (
                  <tr key={course.slug} className="border-t border-gray-100">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-900">
                        {course.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {course.track.toUpperCase()} • Level: {course.level}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {weeks.min === weeks.max
                        ? `${weeks.min} weeks`
                        : `${weeks.min}–${weeks.max} weeks`}
                    </td>
                    <td className="px-4 py-4">{effectiveClassesPerWeek} per week</td>
                    <td className="px-4 py-4">
                      {minSessions === maxSessions
                        ? minSessions
                        : `${minSessions}–${maxSessions}`}
                    </td>
                    <td className="px-4 py-4 font-semibold text-gray-900">
                      {minFee === maxFee ? (
                        <PriceLine original={minFee} />
                      ) : (
                        <PriceRangeLine minOriginal={minFee} maxOriginal={maxFee} />
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-500 text-center">
          We follow a mastery-first approach. Most children complete in the typical timeline shown, but we adjust pacing based on the child’s assessment and progress.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3 text-sm text-gray-600">
          <div className="glass-panel p-5">
            <div className="font-semibold text-gray-900">
              What’s included
            </div>
            <ul className="mt-2 list-disc pl-5">
              <li>Live 1:1 or small-group sessions</li>
              <li>Weekly mastery reports</li>
              <li>Recorded sessions + resources</li>
            </ul>
          </div>
          <div className="glass-panel p-5">
            <div className="font-semibold text-gray-900">
              Payment options
            </div>
            <ul className="mt-2 list-disc pl-5">
              <li>UPI</li>
              <li>Bank transfer (with manual confirmation)</li>
              <li>Online autopay subscriptions</li>
            </ul>
          </div>
          <div className="glass-panel p-5">
            <div className="font-semibold text-gray-900">
              Need installment plans?
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {!user ? (
                <>
                  Chat with us on{' '}
                  <a
                    href="https://wa.me/919618398383"
                    className="text-tiny-green-600"
                  >
                    WhatsApp
                  </a>
                  . We set up 2-month or 3-month payment splits for most
                  families.
                </>
              ) : (
                <>
                  Please use{' '}
                  <a href="/contact" className="text-tiny-blue-600">
                    Contact
                  </a>{' '}
                  to verify payment options; our finance team will assist.
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Reinstated and updated the gaming subscription section */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="overflow-x-auto rounded-3xl bg-white shadow-card-hover border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-900 text-center py-6">
            Optional Game Subscriptions
          </h2>
          <p className="text-gray-700 text-center mb-6">
            Enhance your child’s learning with curated games. These subscriptions are designed to complement our core 1:1 classes.
          </p>
          <table className="w-full border-collapse text-sm text-gray-700">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Features</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.name} className="border-t border-gray-100">
                  <td className="px-4 py-4">
                    <div className="font-semibold text-gray-900">{plan.name}</div>
                  </td>
                  <td className="px-4 py-4 font-semibold text-gray-900">
                    {plan.price}
                  </td>
                  <td className="px-4 py-4">
                    <ul className="list-disc pl-5">
                      {plan.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;
