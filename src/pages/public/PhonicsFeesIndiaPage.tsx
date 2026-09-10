import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  IndianRupee,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import { PUBLIC_SITE_FACTS } from '../../config/publicFacts';
import {
  GROUP_MONTHLY_FEES,
  ONE_TO_ONE_MONTHLY_PACKAGES,
  PER_CLASS_PRICE,
  formatINR,
} from '../../config/pricing';
import {
  PHONICS_FEES_INDIA_RESEARCH,
  type PhonicsFeeMarketSegment,
} from '../../data/commercial/phonicsFeesIndiaResearch';
import { applySeo, getRouteConfig } from '../../lib/seo';
import { createFAQPageSchema, createWebPageSchema, PUBLIC_FACTS } from '../../lib/schemas';

const research = PHONICS_FEES_INDIA_RESEARCH;

const feeKeywords = [
  'phonics classes fees in India',
  'phonics class fees India',
  'online phonics classes fees',
  'phonics classes cost India',
  '1 to 1 phonics class fees',
  'group phonics class fees',
  'phonics course price India',
  'phonics class price per session',
  'phonics classes fees for kids',
  'small group phonics fees',
];

const comparisonChecks = [
  'Compare the effective fee per live class, not only the package total.',
  'Check whether the format is 1:1, small group, or mainly self-practice.',
  'Compare class duration as well as price.',
  'Ask whether placement is based on the child’s current reading stage.',
  'Check how much live reading, correction and retry time the child receives.',
  'Confirm group size, package terms and rescheduling rules before paying.',
];

const assessmentChecks = [
  'Letter–sound knowledge',
  'Oral blending and segmenting',
  'Word blending and decoding',
  'Spelling / encoding',
  'Sentence reading and transfer',
  'Fluency and comprehension when appropriate',
];

const faqItems = [
  {
    question: 'How much do live 1:1 phonics classes cost in India?',
    answer: `In the Tiny Steps ${research.reviewedLabel} research sample of publicly advertised live online phonics pricing available to Indian parents, the central 1:1 range was approximately ${research.oneToOne.centralRangeLabel} per live class. The sample median was about ${formatINR(research.oneToOne.median)} and the average was about ${formatINR(research.oneToOne.average)} per class. Class duration, teacher attention and what is included still need to be compared separately.`,
  },
  {
    question: 'How much do group phonics classes cost in India?',
    answer: `In the same reviewed research, the central live-group range was approximately ${research.group.centralRangeLabel} per child per live class. The sample median was about ${formatINR(research.group.median)} and the average was about ${formatINR(research.group.average)} per child per class. Batch size and session duration are important parts of the comparison.`,
  },
  {
    question: 'How much are Tiny Steps phonics classes in India?',
    answer: 'The current standard Tiny Steps rate with an Indian teacher is ₹400 per live 1:1 class. Each standard 1:1 class is 35 minutes. A 12-class package is ₹4,800.',
  },
  {
    question: 'How much is a 12-class phonics package at Tiny Steps?',
    answer: 'At the standard ₹400 per-class rate, 12 live 1:1 phonics classes cost ₹4,800. Tiny Steps also maintains 16-class and 24-class package options at the same standard ₹400 per-class rate.',
  },
  {
    question: 'How much do Tiny Steps small-group phonics classes cost?',
    answer: 'Current small-group pricing ranges from ₹180 to ₹300 per child per class depending on group size. Group session duration increases with the number of children, so parents should compare both price and live teaching time.',
  },
  {
    question: 'Is the phonics demo assessment free?',
    answer: 'Yes. Tiny Steps offers one free 35-minute live 1:1 online demo assessment class per child before enrolment so the recommended starting point can be based on the child’s current reading behaviour.',
  },
  {
    question: 'Does a higher phonics fee mean better teaching?',
    answer: 'No. A higher price does not automatically establish stronger teaching. Parents should also compare curriculum sequence, live correction, individual response time, placement, reading transfer, progress visibility and policies.',
  },
  {
    question: 'How were the phonics fee benchmarks calculated?',
    answer: 'Tiny Steps reviewed publicly advertised live online phonics pricing available to Indian parents, analysed 1:1 and group formats separately, and converted package totals to an effective per-live-class fee only when the number of live sessions was clearly stated. Offers with unclear or conflicting session counts were excluded from the statistical calculation. Provider identities are intentionally not published.',
  },
];

function MoneyCard({ title, amount, detail }: { title: string; amount: string; detail: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{amount}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </article>
  );
}

function MarketBandGrid({ segment }: { segment: PhonicsFeeMarketSegment }) {
  return (
    <div className="grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-3">
      {segment.bands.map((band) => {
        const isTypical = band.label === 'Typical fee band';
        return (
          <article
            key={band.label}
            className={`bg-white px-4 py-4 lg:px-4 xl:px-5 ${isTypical ? 'bg-sky-50/70 ring-1 ring-inset ring-sky-200' : ''}`}
          >
            <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${isTypical ? 'text-sky-800' : 'text-slate-500'}`}>
              {band.label}
            </p>
            <p className="mt-2 whitespace-nowrap text-[1.45rem] font-black tracking-tight text-slate-950 xl:text-[1.6rem]">
              {band.rangeLabel}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Sample avg <strong className="text-base text-slate-900">~{formatINR(band.average)}</strong>
            </p>
          </article>
        );
      })}
    </div>
  );
}

export default function PhonicsFeesIndiaPage() {
  const routeConfig = getRouteConfig('/phonics-fees-india');
  const canonicalPath = routeConfig?.canonicalPath ?? '/phonics-fees-india';
  const canonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${canonicalPath}`;
  const seoTitle = routeConfig?.title ?? 'Phonics Class Fees in India 2026 | 1:1 & Group Price Guide';
  const seoDescription = routeConfig?.description ?? 'Compare 2026 phonics class fees in India for live 1:1 and group classes, including market fee bands, package costs and Tiny Steps ₹400 live 1:1 pricing.';

  useEffect(() => {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${PUBLIC_FACTS.primaryWebsite}/` },
        { '@type': 'ListItem', position: 2, name: 'Phonics', item: `${PUBLIC_FACTS.primaryWebsite}/phonics` },
        { '@type': 'ListItem', position: 3, name: 'Phonics Class Fees in India', item: canonicalUrl },
      ],
    };

    const webpageSchema = {
      ...createWebPageSchema({
        name: 'Phonics Class Fees in India',
        description: seoDescription,
        url: canonicalUrl,
      }),
      '@id': `${canonicalUrl}#webpage`,
      dateModified: research.reviewedAt,
      about: [
        { '@type': 'Thing', name: 'Phonics class fees in India' },
        { '@type': 'Thing', name: 'Online phonics class pricing' },
        { '@type': 'Thing', name: '1:1 phonics class cost' },
        { '@type': 'Thing', name: 'Group phonics class cost' },
      ],
    };

    applySeo({
      title: seoTitle,
      description: seoDescription,
      canonicalPath,
      ogType: routeConfig?.ogType ?? 'website',
      keywords: feeKeywords,
      jsonLd: [breadcrumbSchema, webpageSchema, { ...createFAQPageSchema(faqItems), '@id': `${canonicalUrl}#faq` }],
    });
  }, [canonicalPath, canonicalUrl, routeConfig?.ogType, seoDescription, seoTitle]);

  const starter = ONE_TO_ONE_MONTHLY_PACKAGES.find((pkg) => pkg.id === 'starter');

  return (
    <main className="overflow-hidden bg-white text-slate-900">
      <section className="relative border-b border-slate-200 bg-gradient-to-br from-sky-50 via-white to-amber-50/60">
        <div className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-sky-200/25 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-amber-200/25 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-9 px-6 py-11 lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:py-14">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/90 px-3.5 py-1.5 text-sm font-semibold text-sky-800 shadow-sm">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              2026 India phonics pricing guide
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-[3.35rem] lg:leading-[1.03]">
              Phonics Class Fees in India
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Compare researched live 1:1 and group fee ranges, understand effective per-class pricing, and see Tiny Steps’ current transparent phonics fees.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#market-pricing" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-300/40 transition hover:-translate-y-0.5 hover:bg-slate-800">
                Compare market fees <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <Link to="/book-demo" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-400">
                Book free 35-minute assessment
              </Link>
            </div>
            <p className="mt-5 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
              Publicly advertised prices reviewed · 1:1 and groups analysed separately · research reviewed {research.reviewedLabel}
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white/95 p-5 shadow-2xl shadow-slate-200/50">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Quick market snapshot</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MoneyCard title="Typical live 1:1" amount={research.oneToOne.centralRangeLabel} detail={research.oneToOne.unitLabel} />
              <MoneyCard title="Typical live group" amount={research.group.centralRangeLabel} detail={research.group.unitLabel} />
            </div>
            <div className="mt-3 rounded-2xl bg-slate-950 p-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-sky-200">Tiny Steps standard 1:1</p>
                  <p className="mt-2 text-3xl font-black">{formatINR(PER_CLASS_PRICE)}</p>
                  <p className="mt-1 text-sm text-slate-300">per child · per 35-minute live class</p>
                </div>
                <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-sky-200" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="market-pricing" className="mx-auto max-w-7xl scroll-mt-28 px-6 py-11 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-700">Market pricing research</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Compare 1:1 and group phonics fees separately</h2>
          <p className="mt-3 text-base leading-7 text-slate-600">Teacher attention, group size and session duration change the economics significantly, so combining live 1:1 and group prices would be misleading.</p>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <article className="rounded-[2rem] border border-slate-200 bg-slate-50/60 p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Live 1:1 online phonics</p>
                <h3 className="mt-1 text-2xl font-black text-slate-950">One child, one teacher</h3>
              </div>
              <div className="text-right text-xs text-slate-500">
                <div>Median <strong className="text-slate-900">~{formatINR(research.oneToOne.median)}</strong></div>
                <div className="mt-1">Average <strong className="text-slate-900">~{formatINR(research.oneToOne.average)}</strong></div>
              </div>
            </div>
            <MarketBandGrid segment={research.oneToOne} />
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-slate-50/60 p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Live group online phonics</p>
                <h3 className="mt-1 text-2xl font-black text-slate-950">Price per child</h3>
              </div>
              <div className="text-right text-xs text-slate-500">
                <div>Median <strong className="text-slate-900">~{formatINR(research.group.median)}</strong></div>
                <div className="mt-1">Average <strong className="text-slate-900">~{formatINR(research.group.average)}</strong></div>
              </div>
            </div>
            <MarketBandGrid segment={research.group} />
          </article>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sm leading-7 text-slate-700">
            <strong className="text-slate-950">How to read these figures:</strong> they summarize the publicly advertised provider sample reviewed by Tiny Steps in {research.reviewedLabel}. They are market observations—not a nationwide census and not a quality ranking. Provider identities are intentionally omitted from the public page.
          </div>
          <details className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold text-slate-950">
              <span className="flex items-center gap-2"><Search className="h-4 w-4 text-sky-700" aria-hidden="true" />How we calculated the benchmark</span>
              <span className="text-slate-400 transition group-open:rotate-45">+</span>
            </summary>
            <div className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
              {research.methodology.map((item) => <p key={item}>{item}</p>)}
              <p className="font-semibold text-slate-800">Research provenance note: the original provider-by-provider source table and sample count were not retained in Git history, so this page preserves the finalized aggregate findings without inventing source rows.</p>
            </div>
          </details>
        </div>
      </section>

      <section id="tiny-steps-pricing" className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-11 lg:px-8 lg:py-14">
          <div className="grid gap-7 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">Tiny Steps pricing</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{formatINR(PER_CLASS_PRICE)} per standard live 1:1 phonics class</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">Each standard Indian-teacher 1:1 class is 35 minutes. Tiny Steps’ {formatINR(PER_CLASS_PRICE)} rate sits inside the researched central 1:1 market band of {research.oneToOne.centralRangeLabel}.</p>
              <div className="mt-5 rounded-2xl bg-slate-950 p-5 text-white">
                <p className="text-sm leading-6 text-slate-200"><strong className="text-white">One free 35-minute 1:1 demo assessment comes first.</strong> The child’s starting point should guide placement before a package is selected.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {ONE_TO_ONE_MONTHLY_PACKAGES.map((pkg) => (
                <article key={pkg.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">{pkg.classes} live classes</p>
                  <p className="mt-3 text-3xl font-black text-slate-950">{formatINR(pkg.monthlyFee)}</p>
                  <p className="mt-2 text-sm text-slate-600">{formatINR(Math.round(pkg.monthlyFee / pkg.classes))} per class · {pkg.durationMinutes} minutes · 1 child : 1 teacher</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-11 lg:px-8 lg:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-700">Tiny Steps small groups</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Current per-child group fees</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">These are Tiny Steps’ current group prices, separate from the market-research benchmark above.</p>
          </div>
          <Link to="/pricing" className="inline-flex items-center gap-2 text-sm font-bold text-sky-700 hover:text-sky-900">View all Tiny Steps pricing <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>

        <div className="mt-7 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-[.7fr_1fr_1fr] gap-3 border-b border-slate-200 bg-slate-950 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-200 sm:px-6">
            <span>Format</span><span>Fee / child</span><span>Duration</span>
          </div>
          {GROUP_MONTHLY_FEES.filter((row) => row.ratio !== '1:1').map((row) => (
            <div key={row.ratio} className="grid grid-cols-[.7fr_1fr_1fr] gap-3 border-b border-slate-100 px-4 py-4 text-sm last:border-b-0 sm:px-6">
              <strong className="text-slate-950">{row.ratio}</strong>
              <span className="text-slate-700">{formatINR(Math.round(row.monthlyFee / row.classes))} / class</span>
              <span className="text-slate-700">{row.durationMinutes} minutes</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">All group fees above are per child. Group placement depends on a suitable learning and schedule fit.</p>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-11 lg:px-8 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700"><Calculator className="h-5 w-5" aria-hidden="true" /></div>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Compare packages fairly</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Use effective fee per live class</h2>
              <p className="mt-3 leading-7 text-slate-600">A large package can look cheaper or more expensive until you normalize it to the number of actual live classes.</p>
              <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm font-semibold text-slate-900">Total package fee ÷ clearly stated number of live classes = effective fee per live class</div>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">Do not compare price alone</p>
              <div className="mt-4 space-y-3">
                {comparisonChecks.map((item, index) => (
                  <div key={item} className="flex gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-sky-700 ring-1 ring-slate-200">{index + 1}</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-11 lg:px-8 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-sky-200 ring-1 ring-white/10"><ClipboardCheck className="h-4 w-4" aria-hidden="true" /> Assessment before enrolment</div>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">What should the free phonics assessment check?</h2>
              <p className="mt-3 text-base leading-8 text-slate-300">Two children of the same age can need different starting points. The first commercial decision should therefore be level fit—not package size.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {assessmentChecks.map((item) => (
                <div key={item} className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-slate-200">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />{item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-11 lg:px-8 lg:py-14">
        <div className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <IndianRupee className="h-5 w-5 text-sky-700" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-black text-slate-950">Need the phonics programme itself?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">This page owns fees. The main phonics page explains levels, teaching sequence, blending, decoding and placement.</p>
            <Link to="/phonics" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-sky-700">Explore phonics classes <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </article>
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <Users className="h-5 w-5 text-indigo-700" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-black text-slate-950">Comparing providers?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Use the buyer guide for child fit, 1:1 vs group format, teaching quality, progress evidence and provider comparison.</p>
            <Link to="/best-online-phonics-classes-for-kids-in-india" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-sky-700">Compare phonics options <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </article>
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <Sparkles className="h-5 w-5 text-amber-600" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-black text-slate-950">Ready to check your child’s level?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">The demo owner handles the free 35-minute 1:1 assessment and the next-step recommendation.</p>
            <Link to="/book-demo" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-sky-700">Book free assessment <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </article>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-11 lg:grid-cols-[.7fr_1.3fr] lg:px-8 lg:py-14">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">Parent questions</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Phonics fees FAQs</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">Research benchmarks and Tiny Steps’ own current fees are kept distinct so parents can compare the market without confusing it with our pricing.</p>
          </div>
          <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {faqItems.map((item) => (
              <details key={item.question} className="group p-5 open:bg-slate-50/60">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-bold text-slate-950"><span>{item.question}</span><span className="mt-0.5 text-xl font-light text-slate-400 transition group-open:rotate-45">+</span></summary>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
        <div className="rounded-[2rem] bg-gradient-to-r from-sky-700 via-indigo-700 to-slate-950 px-6 py-7 text-white shadow-xl shadow-indigo-200/30 sm:px-8 lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div>
            <h2 className="text-2xl font-black">Start with the child’s level before choosing a package</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">Book one free 35-minute live 1:1 online demo assessment and get a starting-point recommendation before enrolment.</p>
          </div>
          <Link to="/book-demo" className="mt-5 inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-100 lg:mt-0">Book Free 35-Minute Demo <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
      </section>

      <div className="pb-24 sm:pb-20"><ClusterSeoNav cluster="phonics" compact /></div>
    </main>
  );
}
