import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { FC } from 'react';
import Meta from '../components/common/Meta';
import { getRouteConfig } from '../lib/seo';
import {
  formatINR,
  GROUP_MONTHLY_FEES,
  ONE_TO_ONE_MONTHLY_PACKAGES,
  PER_CLASS_PRICE,
  ULTRA_PREMIUM_PRICING,
} from '../config/pricing';
import {
  FREE_DEMO_CTA_LABEL,
  FREE_DEMO_DURATION_MINUTES,
  FREE_DEMO_FULL_DESCRIPTION,
  STANDARD_PRICING_SUMMARY,
} from '../config/publicOffer';
import {
  ORGANIZATION_ID,
  PUBLIC_FACTS,
  createFAQPageSchema,
  createWebPageSchema,
} from '../lib/schemas';

const pricingSeo = getRouteConfig('/pricing');
const pricingCanonicalPath = pricingSeo?.canonicalPath ?? '/pricing';
const pricingCanonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${pricingCanonicalPath}`;
const pricingSeoTitle =
  pricingSeo?.title ?? 'Online English Classes for Kids Fees & Pricing | Tiny Steps';
const pricingSeoDescription =
  pricingSeo?.description ??
  `See Tiny Steps online English class fees: standard live 1:1 ${formatINR(PER_CLASS_PRICE)}/class, 12 classes ${formatINR(ONE_TO_ONE_MONTHLY_PACKAGES[0].monthlyFee)}, small groups ${formatINR(180)}–${formatINR(300)} per child/class, plus native-teacher options.`;

const pricingKeywords = [
  'online English classes for kids fees',
  'online English classes fees',
  'English classes for kids price',
  'online English classes pricing',
  'online English classes cost India',
  'English classes fees India',
  '1 to 1 English class fees',
  '1 to 1 English classes price',
  'online English tutor fees for kids',
  'small group English class fees',
  'live online English class price',
  'online English course fees for kids',
];

const standardOneToOne = ONE_TO_ONE_MONTHLY_PACKAGES;
const standardGroups = GROUP_MONTHLY_FEES.filter((row) => row.ratio !== '1:1');
const smallGroupPerClassValues = standardGroups.map((row) => Math.round(row.monthlyFee / row.classes));
const smallGroupMin = Math.min(...smallGroupPerClassValues);
const smallGroupMax = Math.max(...smallGroupPerClassValues);

const faqItems = [
  {
    question: 'How much do Tiny Steps online English classes cost?',
    answer:
      `Standard live 1:1 classes cost ${formatINR(PER_CLASS_PRICE)} per class. A 12-class standard 1:1 package is ${formatINR(ONE_TO_ONE_MONTHLY_PACKAGES[0].monthlyFee)}, 16 classes are ${formatINR(ONE_TO_ONE_MONTHLY_PACKAGES[1].monthlyFee)}, and 24 classes are ${formatINR(ONE_TO_ONE_MONTHLY_PACKAGES[2].monthlyFee)}.`,
  },
  {
    question: 'How long is a standard 1:1 class?',
    answer:
      `Each standard live 1:1 class is ${ONE_TO_ONE_MONTHLY_PACKAGES[0].durationMinutes} minutes. Small-group duration varies by group size and is shown in the pricing table.`,
  },
  {
    question: 'How much do Tiny Steps small-group English classes cost?',
    answer:
      `Standard small-group pricing ranges from ${formatINR(smallGroupMin)} to ${formatINR(smallGroupMax)} per child per live class depending on group size. Current 12-class package totals and session durations are shown on this page.`,
  },
  {
    question: 'Are the standard 12, 16 and 24-class 1:1 packages different prices per class?',
    answer:
      `No. The current standard Indian-teacher 1:1 rate is ${formatINR(PER_CLASS_PRICE)} per class across the 12, 16 and 24-class package options. The packages differ in the number of live classes, not the per-class rate.`,
  },
  {
    question: 'Do you offer classes with native English-speaking teachers?',
    answer:
      'Yes. Tiny Steps also lists an Ultra Premium option with native English-speaking teachers. Current 1:1 and group rates are shown separately on this page so parents can compare them with the standard Indian-teacher pricing.',
  },
  {
    question: 'Should I choose 1:1 or a small group based only on price?',
    answer:
      'No. Compare the effective fee per live class together with teacher attention, class duration, group size, programme fit, schedule fit and the amount of live practice your child needs.',
  },
  {
    question: 'Is there a free assessment before enrolment?',
    answer: FREE_DEMO_FULL_DESCRIPTION,
  },
  {
    question: 'Where can I compare phonics fees in India?',
    answer:
      'Use the dedicated Phonics Class Fees in India page for Tiny Steps phonics pricing plus the research-led phonics market benchmark. This main pricing page remains the owner for cross-programme English class fees and value comparison.',
  },
  {
    question: 'What is included in the live class fee?',
    answer:
      'The fee covers the live teacher-led class, assessment-led programme placement, structured programme activities, guided child practice, parent communication and progress visibility. Any separate optional products or services should be checked independently before purchase.',
  },
];

const offerCatalog = {
  '@context': 'https://schema.org',
  '@type': 'OfferCatalog',
  '@id': `${pricingCanonicalUrl}#offer-catalog`,
  name: 'Tiny Steps Online English Class Pricing',
  url: pricingCanonicalUrl,
  itemListElement: [
    ...standardOneToOne.map((pkg) => ({
      '@type': 'Offer',
      name: `Standard live 1:1 — ${pkg.classes} classes`,
      price: String(pkg.monthlyFee),
      priceCurrency: 'INR',
      url: pricingCanonicalUrl,
      itemOffered: {
        '@type': 'Service',
        name: 'Live 1:1 online English classes for kids',
        provider: { '@id': ORGANIZATION_ID },
        audience: {
          '@type': 'EducationalAudience',
          educationalRole: 'student',
          audienceType: 'Children',
        },
      },
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: String(PER_CLASS_PRICE),
        priceCurrency: 'INR',
        unitText: 'live class',
      },
    })),
    ...standardGroups.map((row) => ({
      '@type': 'Offer',
      name: `Standard live ${row.ratio} group — ${row.classes} classes per child`,
      price: String(row.monthlyFee),
      priceCurrency: 'INR',
      url: pricingCanonicalUrl,
      itemOffered: {
        '@type': 'Service',
        name: `Live ${row.ratio} online English classes for kids`,
        provider: { '@id': ORGANIZATION_ID },
      },
    })),
    ...ULTRA_PREMIUM_PRICING.map((row) => ({
      '@type': 'Offer',
      name: `Ultra Premium ${row.format} — 12 classes`,
      price: String(row.package12),
      priceCurrency: 'INR',
      url: `${pricingCanonicalUrl}?program=ultra`,
      itemOffered: {
        '@type': 'Service',
        name: `${row.format} with native English-speaking teacher`,
        provider: { '@id': ORGANIZATION_ID },
      },
    })),
  ],
};

type PricingProgram = 'premium' | 'ultra';

const PricingPage: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const programParam = searchParams.get('program');
  const [activeProgram, setActiveProgram] = useState<PricingProgram>(
    programParam === 'ultra' ? 'ultra' : 'premium',
  );

  useEffect(() => {
    setActiveProgram(programParam === 'ultra' ? 'ultra' : 'premium');
  }, [programParam]);

  const setProgram = (program: PricingProgram) => {
    setActiveProgram(program);
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (program === 'ultra') next.set('program', 'ultra');
      else next.delete('program');
      return next;
    }, { replace: true });
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${PUBLIC_FACTS.primaryWebsite}/` },
      { '@type': 'ListItem', position: 2, name: 'Pricing', item: pricingCanonicalUrl },
    ],
  };

  const webpageSchema = {
    ...createWebPageSchema({
      name: 'Online English Classes for Kids Fees & Pricing',
      description: pricingSeoDescription,
      url: pricingCanonicalUrl,
    }),
    '@id': `${pricingCanonicalUrl}#webpage`,
    about: [
      { '@type': 'Thing', name: 'Online English classes for kids fees' },
      { '@type': 'Thing', name: 'Live 1:1 English class pricing' },
      { '@type': 'Thing', name: 'Small-group English class pricing' },
    ],
  };

  const faqSchema = {
    ...createFAQPageSchema(faqItems),
    '@id': `${pricingCanonicalUrl}#faq`,
  };

  return (
    <div className="page-gradient min-h-screen pb-20">
      <Meta
        title={pricingSeoTitle}
        description={pricingSeoDescription}
        keywords={pricingKeywords.join(',')}
        canonical={pricingCanonicalUrl}
        robots="index,follow"
        jsonLd={[breadcrumbSchema, webpageSchema, offerCatalog, faqSchema]}
      />

      <section className="relative px-6 pb-10 pt-24">
        <div className="glass-panel mx-auto max-w-5xl px-7 py-10 text-center sm:px-10">
          <div className="gradient-chip mx-auto w-max">Fees, packages & value comparison</div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 md:text-5xl">
            Online English Classes for Kids: Fees & Pricing
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-gray-700 md:text-lg">
            Standard live 1:1 classes are <strong>{formatINR(PER_CLASS_PRICE)} per class</strong>, with 12, 16 and 24-class options. Small groups range from <strong>{formatINR(smallGroupMin)}–{formatINR(smallGroupMax)} per child per class</strong>. Start with one free {FREE_DEMO_DURATION_MINUTES}-minute 1:1 assessment before choosing the programme and package.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to="/book-demo" className="rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-xl">
              {FREE_DEMO_CTA_LABEL}
            </Link>
            <a href="#standard-pricing" className="rounded-2xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-900">
              See Standard Pricing
            </a>
            <a href="#compare-value" className="rounded-2xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-900">
              Compare Value
            </a>
          </div>
          <div className="mx-auto mt-7 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Standard 1:1</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{formatINR(PER_CLASS_PRICE)}</p>
              <p className="mt-1 text-xs text-slate-600">per live class</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">12 classes</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{formatINR(standardOneToOne[0].monthlyFee)}</p>
              <p className="mt-1 text-xs text-slate-600">standard live 1:1</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">1:1 duration</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{standardOneToOne[0].durationMinutes} min</p>
              <p className="mt-1 text-xs text-slate-600">standard class</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Assessment</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">Free</p>
              <p className="mt-1 text-xs text-slate-600">one {FREE_DEMO_DURATION_MINUTES}-minute 1:1 demo</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-10">
        <div className="grid gap-5 md:grid-cols-2">
          <button
            onClick={() => setProgram('premium')}
            className={`rounded-3xl border p-6 text-left transition ${activeProgram === 'premium' ? 'border-slate-900 bg-slate-900 text-white shadow-xl' : 'border-slate-200 bg-white text-slate-800'}`}
            aria-pressed={activeProgram === 'premium'}
          >
            <p className="text-lg font-bold">Standard Pricing</p>
            <p className={`mt-2 text-sm leading-6 ${activeProgram === 'premium' ? 'text-slate-200' : 'text-slate-600'}`}>
              Live classes with Indian teachers. Standard 1:1 is {formatINR(PER_CLASS_PRICE)} per class.
            </p>
          </button>
          <button
            onClick={() => setProgram('ultra')}
            className={`rounded-3xl border p-6 text-left transition ${activeProgram === 'ultra' ? 'border-amber-300 bg-slate-900 text-white shadow-xl' : 'border-slate-200 bg-white text-slate-800'}`}
            aria-pressed={activeProgram === 'ultra'}
          >
            <p className="text-lg font-bold">Ultra Premium Pricing</p>
            <p className={`mt-2 text-sm leading-6 ${activeProgram === 'ultra' ? 'text-slate-200' : 'text-slate-600'}`}>
              Separate pricing for classes with native English-speaking teachers.
            </p>
          </button>
        </div>
      </section>

      {activeProgram === 'premium' ? (
        <>
          <section id="standard-pricing" className="mx-auto max-w-6xl scroll-mt-28 px-6 pb-12">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Standard live 1:1</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-950">Choose 12, 16 or 24 live classes</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                All three standard 1:1 options use the same {formatINR(PER_CLASS_PRICE)} per-class rate and the same {standardOneToOne[0].durationMinutes}-minute live class duration. The only pricing difference is the number of classes selected.
              </p>
              <div className="mt-7 grid gap-5 md:grid-cols-3">
                {standardOneToOne.map((pkg) => (
                  <article key={pkg.id} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">{pkg.classes} live classes</p>
                    <p className="mt-3 text-3xl font-black text-slate-950">{formatINR(pkg.monthlyFee)}</p>
                    <p className="mt-2 text-sm text-slate-600">{formatINR(Math.round(pkg.monthlyFee / pkg.classes))} per class · {pkg.durationMinutes} minutes · 1 child : 1 teacher</p>
                    <Link to="/book-demo" className="mt-5 inline-flex text-sm font-semibold text-slate-900 underline underline-offset-4">
                      Start with the free assessment
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-6 pb-12">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">Standard small groups</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-950">Compare group size, fee and live session duration</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                Group fees are per child. Group placement depends on a suitable learning, level and schedule fit; a lower price alone does not determine the best format for a child.
              </p>
              <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full border-collapse text-sm text-slate-700">
                  <thead>
                    <tr className="bg-slate-950 text-left text-xs uppercase tracking-[0.12em] text-slate-200">
                      <th className="px-4 py-3">Format</th>
                      <th className="px-4 py-3">12-class package / child</th>
                      <th className="px-4 py-3">Per child / class</th>
                      <th className="px-4 py-3">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {GROUP_MONTHLY_FEES.map((row) => (
                      <tr key={row.ratio} className="border-t border-slate-100">
                        <td className="px-4 py-4 font-semibold text-slate-950">{row.ratio}</td>
                        <td className="px-4 py-4">{formatINR(row.monthlyFee)}</td>
                        <td className="px-4 py-4">{formatINR(Math.round(row.monthlyFee / row.classes))}</td>
                        <td className="px-4 py-4">{row.durationMinutes} minutes</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500">
                Every row above is sourced from the current Tiny Steps public pricing configuration. Small-group availability is subject to suitable matching and slot availability.
              </p>
            </div>
          </section>
        </>
      ) : (
        <section id="ultra-pricing" className="mx-auto max-w-6xl scroll-mt-28 px-6 pb-12">
          <div className="rounded-[2rem] border border-amber-200 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-xl sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-200">Ultra Premium</p>
            <h2 className="mt-2 text-3xl font-bold">Classes with native English-speaking teachers</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              Ultra Premium uses a separate price table. We show only the currently configured format and fee here; class fit and scheduling are confirmed before enrolment.
            </p>
            <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {ULTRA_PREMIUM_PRICING.map((row) => (
                <article key={row.ratio} className="rounded-3xl border border-white/10 bg-white/[0.07] p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-200">{row.ratio}</p>
                  <h3 className="mt-2 text-xl font-semibold">{row.format}</h3>
                  <p className="mt-4 text-3xl font-black">{formatINR(row.perClass)}</p>
                  <p className="mt-1 text-sm text-slate-300">{row.unitLabel}</p>
                  <p className="mt-3 text-sm text-slate-200">12-class package: {formatINR(row.package12)} · {row.packageLabel}</p>
                </article>
              ))}
            </div>
            <div className="mt-7">
              <Link to="/book-demo" className="inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950">
                Book an assessment first
              </Link>
            </div>
          </div>
        </section>
      )}

      <section id="compare-value" className="mx-auto max-w-6xl scroll-mt-28 px-6 pb-12">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Price vs value</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-950">How parents should compare online English class fees</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Package totals are not enough. Compare the actual live teaching format and the effective price per live class before deciding.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              ['Effective fee per class', 'Divide the package total by the clearly stated number of live classes.'],
              ['Class duration', 'Compare the live minutes attached to each price rather than assuming every provider uses the same session length.'],
              ['1:1 or group', 'One-to-one and group formats provide different amounts of individual teacher attention.'],
              ['Teacher type', 'Compare standard Indian-teacher pricing and native English-speaking teacher pricing as separate options.'],
              ['Programme fit', 'Price has little meaning if the child is placed into the wrong phonics, reading, grammar, writing or speaking path.'],
              ['Package and policy terms', 'Confirm scheduling, payment, cancellation and refund terms before paying.'],
            ].map(([title, body]) => (
              <article key={title} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <h3 className="font-semibold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">What the live class fee covers</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">Keep inclusions factual and programme-led</h2>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
              <li>• Live teacher-led class time</li>
              <li>• Assessment-led programme and starting-point recommendation</li>
              <li>• Structured Tiny Steps programme activities for the selected learning path</li>
              <li>• Guided child practice and correction during the live class</li>
              <li>• Parent communication and progress visibility</li>
            </ul>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Separate optional products, special services or payment arrangements are not assumed to be included unless they are explicitly confirmed before enrolment.
            </p>
          </article>

          <article className="rounded-[2rem] border border-sky-200 bg-sky-50 p-6 shadow-sm sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Phonics-specific research</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">Looking specifically for phonics fees in India?</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              The dedicated Phonics Class Fees in India page contains Tiny Steps phonics pricing plus the anonymised research benchmark for live 1:1 and group phonics fees. This page stays focused on cross-programme English-class pricing.
            </p>
            <Link to="/phonics-fees-india" className="mt-5 inline-flex text-sm font-semibold text-slate-950 underline underline-offset-4">
              See the phonics fee research
            </Link>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Choose the programme after assessment</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-950">The price owner should not replace the programme owner</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Standard pricing is shared across the core live 1:1 programme system. Use the specialist pages to understand what the child will learn, then use this page to compare format and price.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-slate-900">
            {[
              ['/phonics', 'Phonics'],
              ['/reading-classes-for-kids', 'Reading'],
              ['/grammar', 'Grammar'],
              ['/writing-classes-for-kids', 'Writing'],
              ['/spoken-english-classes-for-kids-online', 'Spoken English'],
              ['/speaking', 'Public Speaking & Communication'],
              ['/confidence-building-program-kids', 'Confidence Building'],
            ].map(([href, label]) => (
              <Link key={href} to={href} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 hover:border-slate-300">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">Parents also ask</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-950">Online English class pricing FAQs</h2>
          <div className="mt-6 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200">
            {faqItems.map((item) => (
              <details key={item.question} className="group p-5 open:bg-slate-50/60">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-semibold text-slate-950">
                  <span>{item.question}</span>
                  <span className="text-xl font-light text-slate-400 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-10">
        <div className="rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-xl sm:px-8 lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div>
            <h2 className="text-2xl font-bold">Start with the child’s level before choosing a package</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
              {FREE_DEMO_FULL_DESCRIPTION} After the assessment, review the recommended programme, format, available timings and current pricing before deciding.
            </p>
          </div>
          <div className="mt-5 flex shrink-0 flex-wrap gap-3 lg:mt-0">
            <Link to="/book-demo" className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950">
              {FREE_DEMO_CTA_LABEL}
            </Link>
            <Link to="/refund-guarantee" className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold text-white">
              Refund & Guarantee Policy
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;
