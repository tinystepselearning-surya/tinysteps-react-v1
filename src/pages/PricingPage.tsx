// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import type { FC } from 'react';
import Meta from '../components/common/Meta';
import { useAuthStore } from '../store/useAuthStore';
import { catalogs } from '../content/courses';
import {
  formatINR,
  GROUP_MONTHLY_FEES,
  ONE_TO_ONE_MONTHLY_PACKAGES,
  PER_CLASS_PRICE,
  ULTRA_PREMIUM_PRICING,
  totalFeeForSessions,
} from '../config/pricing';

const DEFAULT_PACK_RATE = PER_CLASS_PRICE; // Use base rate for estimates

const fmtINR = (n: number): string => formatINR(n);

const parseLessons = (duration: string) => {
  const match = duration.match(/(\d+)(?:[–-](\d+))?/);
  if (!match) return { min: 0, max: 0 };
  const min = parseInt(match[1], 10);
  const max = match[2] ? parseInt(match[2], 10) : min;
  return { min, max };
};

const planMeta = {
  starter: {
    name: 'Starter',
    title: '12 Classes / Month',
    badge: 'New families',
    highlight: false,
    color: 'from-white via-[#fff7ec] to-[#ffe0b5]',
    features: [
      'Personalised assessment + roadmap',
      'Live 1:1 classes with expert mentors',
      'Stage-based insight recap',
      'WhatsApp nudges for practice',
    ],
  },
  growth: {
    name: 'Growth',
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
  intensive: {
    name: 'Intensive',
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
} as const;

const plans = ONE_TO_ONE_MONTHLY_PACKAGES.map((pkg) => {
  const meta = planMeta[pkg.id] || planMeta.starter;
  return {
    name: meta.name,
    sessions: pkg.classes,
    monthlyFee: pkg.monthlyFee,
    price: formatINR(pkg.monthlyFee),
    title: meta.title,
    badge: meta.badge,
    highlight: meta.highlight,
    color: meta.color,
    features: meta.features,
  };
});

type PricingProgram = 'premium' | 'ultra';

const PricingPage: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const programParam = searchParams.get('program');
  const initialProgram: PricingProgram = programParam === 'ultra' ? 'ultra' : 'premium';
  const [activeProgram, setActiveProgram] = useState<PricingProgram>(initialProgram);

  useEffect(() => {
    document.title = 'Pricing | Tiny Steps';
  }, []);

  useEffect(() => {
    setActiveProgram(programParam === 'ultra' ? 'ultra' : 'premium');
  }, [programParam]);

  const coursePricing = useMemo(
    () =>
      catalogs.map((course) => {
        const lessons = parseLessons(course.duration);
        const minSessions = lessons.min;
        const maxSessions = lessons.max;

        // Use the current per-class rate for fee estimates
        const minFee = totalFeeForSessions(minSessions, DEFAULT_PACK_RATE);
        const maxFee = totalFeeForSessions(maxSessions, DEFAULT_PACK_RATE);

        return {
          course,
          lessons,
          pace: course.frequency,
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
  const setProgram = (program: PricingProgram) => {
    setActiveProgram(program);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (program === 'ultra') next.set('program', 'ultra');
      else next.delete('program');
      return next;
    }, { replace: true });
  };
  const groupMeta = {
    '1:1': {
      bestFor: 'Premium 1:1 (all ages)',
      chip: 'Premium',
      theme: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        badge: 'bg-amber-100 text-amber-900',
      },
    },
    '1:2': {
      bestFor: 'Early learners (4–10)',
      chip: 'Small group',
      theme: {
        bg: 'bg-sky-50',
        border: 'border-sky-200',
        badge: 'bg-sky-100 text-sky-900',
      },
    },
    '1:3': {
      bestFor: 'Same-level kids (5–10)',
      chip: 'Small group',
      theme: {
        bg: 'bg-violet-50',
        border: 'border-violet-200',
        badge: 'bg-violet-100 text-violet-900',
      },
    },
    '1:4': {
      bestFor: 'Confident learners (6–12)',
      chip: 'Small group',
      theme: {
        bg: 'bg-teal-50',
        border: 'border-teal-200',
        badge: 'bg-teal-100 text-teal-900',
      },
    },
    '1:5': {
      bestFor: 'Practice groups (7–12)',
      chip: 'Small group',
      theme: {
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        badge: 'bg-rose-100 text-rose-900',
      },
    },
    '1:6': {
      bestFor: 'Fluency & speaking (8–12)',
      chip: 'Small group',
      theme: {
        bg: 'bg-lime-50',
        border: 'border-lime-200',
        badge: 'bg-lime-100 text-lime-900',
      },
    },
  } as const;

  const baseGroupFee12 =
    GROUP_MONTHLY_FEES.find((row) => row.ratio === '1:1')?.monthlyFee ?? 0;
  const ultraPerClassPrice =
    ULTRA_PREMIUM_PRICING.find((row) => row.ratio === '1:1')?.perClass ?? 1899;
  const premiumPerClassValues = GROUP_MONTHLY_FEES.map((row) =>
    Math.round(row.monthlyFee / row.classes)
  );
  const premiumMinPerClass = Math.min(...premiumPerClassValues);
  const premiumMaxPerClass = Math.max(...premiumPerClassValues);
  const ultraPerClassValues = ULTRA_PREMIUM_PRICING.map((row) => row.perClass);
  const ultraMinPerClass = Math.min(...ultraPerClassValues);
  const ultraMaxPerClass = Math.max(...ultraPerClassValues);
  const premiumMonthlyEstimate =
    ONE_TO_ONE_MONTHLY_PACKAGES.find((row) => row.id === 'starter')?.monthlyFee ?? totalFeeForSessions(12, DEFAULT_PACK_RATE);
  const ultraMonthlyEstimate =
    ULTRA_PREMIUM_PRICING.find((row) => row.ratio === '1:1')?.package12 ?? totalFeeForSessions(12, ultraPerClassPrice);
  const currentMonthlyEstimate = activeProgram === 'ultra' ? ultraMonthlyEstimate : premiumMonthlyEstimate;

  const groupPricing = GROUP_MONTHLY_FEES.map((row) => {
    const meta = groupMeta[row.ratio as keyof typeof groupMeta] || groupMeta['1:1'];
    const save = row.ratio === '1:1'
      ? null
      : Math.round((1 - row.monthlyFee / baseGroupFee12) * 100);
    return {
      size: row.ratio,
      fee12: row.monthlyFee,
      save,
      bestFor: meta.bestFor,
      duration: `${row.durationMinutes} min`,
      chip: meta.chip,
      theme: meta.theme,
    };
  });

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
        description="Premium 1:1 online English school for ages 3–12. IB-aligned phonics, grammar and public speaking with kind live mentors, AI-guided practice and stage-based parent progress insights. Free assessment class; flexible monthly plans."
        canonical="https://tinystepslearning.com/pricing"
        jsonLd={offerCatalog}
      />

      <section className="relative px-6 pt-24 pb-10">
        <div className="mx-auto max-w-5xl glass-panel px-8 py-10 text-center">
          <div className="gradient-chip mx-auto w-max">
            {activeProgram === 'premium'
              ? `Tiny Steps Premium Classes • Starting from ${formatINR(premiumMinPerClass)} to ${formatINR(premiumMaxPerClass)} per class`
              : `Tiny Steps Ultra Premium • Native English-speaking teachers • Starting from ${formatINR(ultraMinPerClass)} to ${formatINR(ultraMaxPerClass)} per class`}
          </div>
          <h1 className="mt-3 text-3xl font-bold text-gray-900 md:text-4xl">
            {activeProgram === 'premium'
              ? 'Pricing that mirrors your child’s curriculum'
              : 'Ultra Premium English Program'}
          </h1>
          <p className="mt-3 text-gray-700">
            {activeProgram === 'premium'
              ? 'Choose the regular Premium Classes format with expert Indian teachers, or switch to Ultra Premium with native English-speaking teachers.'
              : 'For families seeking an international-classroom feel, premium speaking confidence, and high-touch mentorship with native English-speaking teachers.'}
          </p>
          <div className="mt-6 mx-auto grid max-w-3xl gap-3 sm:grid-cols-2">
            <button
              onClick={() => setProgram('premium')}
              className={`rounded-2xl border px-5 py-4 text-left transition ${
                activeProgram === 'premium'
                  ? 'border-slate-900 bg-slate-900 text-white shadow-2xl'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
              aria-pressed={activeProgram === 'premium'}
            >
              <p className="text-base font-semibold">Premium Classes</p>
              <p className={`mt-1 text-xs ${activeProgram === 'premium' ? 'text-slate-200' : 'text-slate-500'}`}>
                Tiny Steps Standard • Expert Indian teachers
              </p>
            </button>
            <button
              onClick={() => setProgram('ultra')}
              className={`rounded-2xl border px-5 py-4 text-left transition ${
                activeProgram === 'ultra'
                  ? 'border-amber-300 bg-gradient-to-r from-[#131c2f] to-[#1f2a44] text-white shadow-2xl'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
              aria-pressed={activeProgram === 'ultra'}
            >
              <p className="text-base font-semibold">Ultra Premium Classes</p>
              <p className={`mt-1 text-xs ${activeProgram === 'ultra' ? 'text-amber-100' : 'text-slate-500'}`}>
                Native English-speaking teachers
              </p>
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {activeProgram === 'premium'
              ? `Premium monthly estimate (12 sessions): ${formatINR(premiumMonthlyEstimate)}/month.`
              : `Ultra Premium monthly estimate (12 sessions): ${formatINR(ultraMonthlyEstimate)}/month.`}
          </p>
        </div>
      </section>

      {activeProgram === 'premium' ? (
        <>
          <section className="mx-auto max-w-6xl px-6 pb-12">
            <div className="mb-5 text-center">
              <h2 className="text-2xl font-semibold text-gray-900">Premium Classes (Standard Program)</h2>
              <p className="mt-1 text-sm text-gray-600">Classes with expert Indian teachers</p>
            </div>
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
                    {`${formatINR(DEFAULT_PACK_RATE)} per class • ${plan.sessions} live classes`}
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
              <h2 className="text-3xl font-semibold text-gray-900">Small-Group Classes (Live) - Premium Classes</h2>
              <p className="mt-2 text-sm text-gray-600">
                Same Tiny Steps curriculum • Level-matched groups • Classes with expert Indian teachers
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
        </>
      ) : (
        <>
          <section className="mx-auto max-w-6xl px-6 pb-10">
            <div className="relative overflow-hidden rounded-[32px] border border-amber-200/30 bg-gradient-to-br from-[#0b1324] via-[#101a33] to-[#1a2743] p-8 text-white shadow-[0_32px_96px_-48px_rgba(2,6,23,0.95)]">
              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-amber-300/20 blur-3xl" />
              <div className="absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-sky-300/10 blur-3xl" />
              <div className="relative">
                <p className="inline-flex rounded-full border border-amber-200/40 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100">
                  Ultra Premium Program
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                  Classes with native English-speaking teachers
                </h2>
                <p className="mt-4 max-w-3xl text-sm text-slate-200 md:text-base">
                  For parents looking for a premium international learning experience, Tiny Steps offers a dedicated Ultra Premium format with native English-speaking teachers. Designed for advanced speaking confidence, global communication practice, and a high-touch classroom experience.
                </p>
                <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-100">
                  <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1">Live interactive classes</span>
                  <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1">Premium speaking and listening exposure</span>
                  <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1">Structured Tiny Steps curriculum</span>
                  <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1">Ideal for global communication confidence</span>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-6 pb-16">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {ULTRA_PREMIUM_PRICING.map((row) => (
                <div
                  key={row.ratio}
                  className="rounded-3xl border border-amber-100 bg-gradient-to-br from-white to-amber-50/60 p-5 shadow-card-hover"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">{row.ratio}</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">{row.format}</h3>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">
                    {formatINR(row.perClass)}
                    <span className="ml-1 text-sm font-medium text-slate-600">{row.unitLabel}</span>
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {formatINR(row.package12)} {row.packageLabel}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 overflow-x-auto rounded-3xl bg-white shadow-card-hover border border-amber-100">
              <table className="w-full border-collapse text-sm text-gray-700">
                <thead>
                  <tr className="bg-slate-900 text-left text-xs uppercase tracking-wide text-slate-100">
                    <th className="px-4 py-3">Format</th>
                    <th className="px-4 py-3">Per class</th>
                    <th className="px-4 py-3">12-class package</th>
                  </tr>
                </thead>
                <tbody>
                  {ULTRA_PREMIUM_PRICING.map((row) => (
                    <tr key={`${row.ratio}-table`} className="border-t border-gray-100">
                      <td className="px-4 py-4 font-semibold text-gray-900">{row.format}</td>
                      <td className="px-4 py-4">{formatINR(row.perClass)} {row.unitLabel}</td>
                      <td className="px-4 py-4">{formatINR(row.package12)} {row.packageLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-center text-xs text-gray-500">
              Batch availability depends on age, level, and suitable peer matching.
            </p>
            <div className="mt-6 text-center">
              <button
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-2xl"
                onClick={() => navigate('/?book=1')}
              >
                Book an Ultra Premium assessment
              </button>
            </div>
          </section>
        </>
      )}

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-5 text-center">
          <h2 className="text-2xl font-semibold text-gray-900">
            Curriculum-Aligned Monthly Estimates ({activeProgram === 'premium' ? 'Premium Classes' : 'Ultra Premium'})
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Monthly fee is shown using 12 sessions/month so planning feels simple and predictable.
          </p>
        </div>
        <div className="overflow-x-auto rounded-3xl bg-white shadow-card-hover border border-gray-100">
          <table className="w-full border-collapse text-sm text-gray-700">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Lessons</th>
                <th className="px-4 py-3">Pace</th>
                <th className="px-4 py-3">Approx duration (months)</th>
                <th className="px-4 py-3">
                  Monthly fee (12 sessions)
                </th>
              </tr>
            </thead>
            <tbody>
              {coursePricing.map(
                ({
                  course,
                  lessons,
                  pace,
                  minSessions,
                  maxSessions,
                }) => {
                  const minMonths = minSessions / 12;
                  const maxMonths = maxSessions / 12;
                  const monthRange =
                    minMonths === maxMonths
                      ? `${minMonths.toFixed(1)} months`
                      : `${minMonths.toFixed(1)}–${maxMonths.toFixed(1)} months`;
                  return (
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
                        {lessons.min === lessons.max
                          ? `${lessons.min} lessons`
                          : `${lessons.min}–${lessons.max} lessons`}
                      </td>
                      <td className="px-4 py-4">{pace}</td>
                      <td className="px-4 py-4">
                        {monthRange}
                      </td>
                      <td className="px-4 py-4 font-semibold text-gray-900">
                        {formatINR(currentMonthlyEstimate)}/month
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-500 text-center">
          We follow a mastery-first approach. Lesson counts are fixed, and approximate completion months vary by pace and assessment.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3 text-sm text-gray-600">
          <div className="glass-panel p-5">
            <div className="font-semibold text-gray-900">
              What’s included
            </div>
            <ul className="mt-2 list-disc pl-5">
              <li>Live 1:1 or small-group sessions</li>
              <li>Stage-based mastery reports</li>
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
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-tiny-green-600"
                  >
                    WhatsApp - opens new window
                  </a>
                  , or use our{' '}
                  <a href="/contact" className="text-tiny-blue-600">
                    contact form
                  </a>
                  . We set up 2-month or 3-month payment splits for most families.
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

      {activeProgram === 'premium' && (
        <section className="mx-auto max-w-6xl px-6 pb-16">
          <div className="overflow-x-auto rounded-3xl bg-white shadow-card-hover border border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-900 text-center py-6">
              Optional Game Subscriptions
            </h2>
            <p className="text-gray-700 text-center mb-3">
              Enhance your child’s learning with curated games. These subscriptions are designed to complement our core 1:1 classes.
            </p>
            <div className="mb-6 text-center">
              <Link to="/games/english-excellence" className="text-sm font-semibold text-tiny-blue-700 underline">
                Explore English Excellence games preview and plans
              </Link>
            </div>
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
      )}
    </div>
  );
};

export default PricingPage;
