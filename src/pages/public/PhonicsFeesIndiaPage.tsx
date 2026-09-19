import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ExternalLink,
  IndianRupee,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import {
  GROUP_MONTHLY_FEES,
  ONE_TO_ONE_MONTHLY_PACKAGES,
  PER_CLASS_PRICE,
  formatINR,
} from '../../config/pricing';
import {
  PHONICS_FEES_INDIA_PROVIDERS,
  PHONICS_FEES_INDIA_RESEARCH,
  PHONICS_FEES_REVIEWED_WITHOUT_COMPARABLE_PUBLIC_PRICE,
  type PhonicsFeeOffer,
} from '../../data/commercial/phonicsFeesIndiaResearch';
import { applySeo, getRouteConfig } from '../../lib/seo';
import { createFAQPageSchema, createWebPageSchema, PUBLIC_FACTS } from '../../lib/schemas';

const research = PHONICS_FEES_INDIA_RESEARCH;
const reviewedProviderCount =
  PHONICS_FEES_INDIA_PROVIDERS.length + PHONICS_FEES_REVIEWED_WITHOUT_COMPARABLE_PUBLIC_PRICE.length;
const publishedPriceProviderCount = PHONICS_FEES_INDIA_PROVIDERS.length;

const tinyStepsGroupRows = GROUP_MONTHLY_FEES.filter((row) => row.ratio !== '1:1');
const tinyStepsGroupRates = tinyStepsGroupRows.map((row) => Math.round(row.monthlyFee / row.classes));
const tinyStepsGroupMin = Math.min(...tinyStepsGroupRates);
const tinyStepsGroupMax = Math.max(...tinyStepsGroupRates);
const tinyStepsGroupDurationMin = Math.min(...tinyStepsGroupRows.map((row) => row.durationMinutes));
const tinyStepsGroupDurationMax = Math.max(...tinyStepsGroupRows.map((row) => row.durationMinutes));

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
  'Normalize the package to an effective fee per live class.',
  'Keep 1:1 and group prices separate.',
  'Compare live class duration and group size.',
  'Check materials, rescheduling and package terms before paying.',
];

const faqItems = [
  {
    question: 'How much do live 1:1 phonics classes cost in India?',
    answer:
      'In the external-provider research checked on ' +
      research.reviewedLabel +
      ', ' +
      research.oneToOne.providerCount +
      ' providers had exact enough public 1:1 pricing to enter the benchmark. The provider-level median was about ' +
      formatINR(Math.round(research.oneToOne.median)) +
      ' per live class. Exact published rates observed in those source rows ranged from about ' +
      formatINR(Math.round(research.oneToOne.minExactPublishedRate)) +
      ' to ' +
      formatINR(Math.round(research.oneToOne.maxExactPublishedRate)) +
      '. Tiny Steps is excluded from the external-provider statistics.',
  },
  {
    question: 'How much do live group phonics classes cost in India?',
    answer:
      'In the same research, ' +
      research.group.providerCount +
      ' external providers had exact enough public group pricing to enter the benchmark. The provider-level median was about ' +
      formatINR(Math.round(research.group.median)) +
      ' per child per live class. Exact published rates observed ranged from about ' +
      formatINR(Math.round(research.group.minExactPublishedRate)) +
      ' to ' +
      formatINR(Math.round(research.group.maxExactPublishedRate)) +
      '.',
  },
  {
    question: 'Why are some public prices not converted to a per-class fee?',
    answer:
      'Tiny Steps does not estimate a class count when a provider publishes only a monthly fee, a starting price, an enquiry-led quote or a package with conflicting session information. Those public prices can still be shown, but they are excluded from the benchmark median and average.',
  },
  {
    question: 'How were the phonics fee benchmarks calculated?',
    answer:
      'Tiny Steps reviewed official provider websites and official provider brochures, kept 1:1 and group formats separate, and normalized package totals only when the live-session count was explicit. When a provider published several exact package rates in the same format, that provider contributes one provider-level benchmark observation so one company cannot dominate the sample.',
  },
  {
    question: 'How much are Tiny Steps phonics classes?',
    answer:
      'The current standard Tiny Steps rate is ₹400 per 35-minute live 1:1 class. A 12-class package is ₹4,800, 16 classes are ₹6,400 and 24 classes are ₹9,600. Tiny Steps is not included in the external-provider benchmark statistics.',
  },
  {
    question: 'How current are the provider prices on this page?',
    answer:
      'The named provider sources were checked on ' +
      research.reviewedLabel +
      '. Prices can change, so each provider name links to the official source used for the research and parents should confirm the latest offer before paying.',
  },
];

function benchmarkMoney(value: number) {
  return formatINR(Math.round(value));
}

function MoneyCard({ title, amount, detail }: { title: string; amount: string; detail: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{title}</p>
      <p className="mt-1.5 text-2xl font-black tracking-tight text-slate-950">{amount}</p>
      <p className="mt-1.5 text-xs leading-5 text-slate-600">{detail}</p>
    </article>
  );
}

function OfferSummary({ offer }: { offer?: PhonicsFeeOffer }) {
  if (!offer) return <span className="text-slate-400">Not publicly listed</span>;

  return (
    <div className="min-w-0">
      <p className="font-bold leading-5 text-slate-950">
        {offer.normalizedPerClassLabel ?? offer.publicPriceLabel}
      </p>
      {offer.normalizedPerClassLabel && (
        <p className="mt-1 text-xs leading-5 text-slate-500">{offer.publicPriceLabel}</p>
      )}
      <p className="mt-1 text-xs leading-5 text-slate-600">{offer.sessionStructureLabel}</p>
      {(offer.durationLabel || offer.groupSizeLabel) && (
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {[offer.durationLabel, offer.groupSizeLabel].filter(Boolean).join(' · ')}
        </p>
      )}
      <span
        className={
          'mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ' +
          (offer.benchmarkEligible
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-amber-50 text-amber-800')
        }
      >
        {offer.benchmarkEligible ? 'Exact public rate' : 'Public price · not normalized'}
      </span>
    </div>
  );
}

function providerOneToOneSortValue(provider: (typeof PHONICS_FEES_INDIA_PROVIDERS)[number]) {
  const offer = provider.oneToOne;
  if (!offer?.benchmarkEligible || !offer.benchmarkRates?.length) return null;
  const ordered = [...offer.benchmarkRates].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 === 1
    ? ordered[middle]
    : (ordered[middle - 1] + ordered[middle]) / 2;
}

function ProviderMatrix() {
  const sortedProviders = [...PHONICS_FEES_INDIA_PROVIDERS].sort((a, b) => {
    const aValue = providerOneToOneSortValue(a);
    const bValue = providerOneToOneSortValue(b);

    if (aValue !== null && bValue !== null) return bValue - aValue;
    if (aValue !== null) return -1;
    if (bValue !== null) return 1;
    return a.provider.localeCompare(b.provider);
  });

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="bg-slate-950 text-[11px] uppercase tracking-[0.12em] text-slate-200">
            <tr>
              <th className="w-[19%] px-4 py-3">Provider</th>
              <th className="w-[31%] px-4 py-3">Live 1:1</th>
              <th className="w-[31%] px-4 py-3">Live group</th>
              <th className="w-[19%] px-4 py-3">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedProviders.map((provider) => (
              <tr key={provider.provider} className="align-top">
                <td className="px-4 py-3.5">
                  <p className="font-bold leading-5 text-slate-950">{provider.provider}</p>
                  {provider.note && <p className="mt-1 text-[11px] leading-4 text-amber-800">{provider.note}</p>}
                </td>
                <td className="px-4 py-3.5"><OfferSummary offer={provider.oneToOne} /></td>
                <td className="px-4 py-3.5"><OfferSummary offer={provider.group} /></td>
                <td className="px-4 py-3.5">
                  <a
                    href={provider.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-bold text-sky-700 hover:text-sky-900"
                  >
                    Official source <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                  <p className="mt-1 text-[11px] leading-4 text-slate-500">Checked {research.reviewedLabel}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {sortedProviders.map((provider) => (
          <article key={provider.provider} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-950">{provider.provider}</h3>
                {provider.note && <p className="mt-1 text-xs leading-5 text-amber-800">{provider.note}</p>}
              </div>
              <a
                href={provider.sourceUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={'Open official source for ' + provider.provider}
                className="shrink-0 rounded-lg border border-slate-200 p-2 text-sky-700"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-sky-700">Live 1:1</p>
                <OfferSummary offer={provider.oneToOne} />
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-700">Live group</p>
                <OfferSummary offer={provider.group} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

export default function PhonicsFeesIndiaPage() {
  const routeConfig = getRouteConfig('/phonics-fees-india');
  const canonicalPath = routeConfig?.canonicalPath ?? '/phonics-fees-india';
  const canonicalUrl = PUBLIC_FACTS.primaryWebsite + canonicalPath;
  const seoTitle = routeConfig?.title ?? 'Phonics Class Fees in India 2026 | 1:1 & Group Price Guide';
  const seoDescription =
    routeConfig?.description ??
    'Compare 2026 phonics class fees in India for live 1:1 and group classes, including market fee bands, package costs and Tiny Steps ₹400 live 1:1 pricing.';

  useEffect(() => {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: PUBLIC_FACTS.primaryWebsite + '/' },
        { '@type': 'ListItem', position: 2, name: 'Phonics', item: PUBLIC_FACTS.primaryWebsite + '/phonics' },
        { '@type': 'ListItem', position: 3, name: 'Phonics Class Fees in India', item: canonicalUrl },
      ],
    };

    const webpageSchema = {
      ...createWebPageSchema({
        name: 'Phonics Class Fees in India',
        description: seoDescription,
        url: canonicalUrl,
      }),
      '@id': canonicalUrl + '#webpage',
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
      jsonLd: [
        breadcrumbSchema,
        webpageSchema,
        { ...createFAQPageSchema(faqItems), '@id': canonicalUrl + '#faq' },
      ],
    });
  }, [canonicalPath, canonicalUrl, routeConfig?.ogType, seoDescription, seoTitle]);

  return (
    <main className="overflow-hidden bg-white text-slate-900">
      <section className="relative border-b border-slate-200 bg-gradient-to-br from-sky-50 via-white to-amber-50/60">
        <div className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-sky-200/25 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-amber-200/25 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-7 px-6 py-9 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-11">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/90 px-3 py-1.5 text-xs font-bold text-sky-800 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              2026 India phonics pricing research
            </div>
            <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-[3.2rem] lg:leading-[1.04]">
              Phonics Class Fees in India
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              We checked public prices from India-facing phonics providers and separated live 1:1 from group classes so parents can compare like with like.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span><strong className="text-slate-950">{reviewedProviderCount}</strong> providers checked</span>
              <span className="text-slate-300">•</span>
              <span><strong className="text-slate-950">{publishedPriceProviderCount}</strong> public-price providers shown</span>
              <span className="text-slate-300">•</span>
              <span>Verified {research.reviewedLabel}</span>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#provider-prices"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-300/40 transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                See provider prices <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#methodology"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:border-slate-400"
              >
                How we verified them
              </a>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white/95 p-4 shadow-xl shadow-slate-200/40">
            <p className="px-1 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">Quick answer</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <MoneyCard
                title="Live 1:1 median"
                amount={'~' + benchmarkMoney(research.oneToOne.median)}
                detail={
                  'Observed exact rates ' +
                  benchmarkMoney(research.oneToOne.minExactPublishedRate) +
                  '–' +
                  benchmarkMoney(research.oneToOne.maxExactPublishedRate)
                }
              />
              <MoneyCard
                title="Live group median"
                amount={'~' + benchmarkMoney(research.group.median)}
                detail={
                  'Observed exact rates ' +
                  benchmarkMoney(research.group.minExactPublishedRate) +
                  '–' +
                  benchmarkMoney(research.group.maxExactPublishedRate) +
                  ' / child'
                }
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-4 rounded-2xl bg-slate-950 px-4 py-4 text-white">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-sky-200">Tiny Steps standard 1:1</p>
                <p className="mt-1 text-2xl font-black">{formatINR(PER_CLASS_PRICE)} <span className="text-sm font-semibold text-slate-300">/ 35 min</span></p>
                <p className="mt-1 text-xs text-slate-400">Shown for context · excluded from the external benchmark</p>
              </div>
              <ShieldCheck className="h-6 w-6 shrink-0 text-sky-200" aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      <section id="market-pricing" className="mx-auto max-w-7xl scroll-mt-28 px-6 py-10 lg:px-8 lg:py-12">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">Market pricing research</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Compare 1:1 and group phonics fees separately
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-600">
            The matrix below shows the public price exactly as we found it. Green rows are precise enough to enter the benchmark; amber prices are published but not converted when the session count is unclear.
          </p>
        </div>

        <div id="provider-prices" className="mt-7 scroll-mt-28">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>Sorted by exact comparable live 1:1 per-class rate: highest → lowest.</span>
            <span>Non-normalized monthly / “from” prices follow and are not used for the ordering.</span>
          </div>
          <ProviderMatrix />
        </div>

        <div id="methodology" className="mt-5 grid gap-3 lg:grid-cols-2">
          <details className="group rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold text-slate-950">
              <span className="flex items-center gap-2">
                <Search className="h-4 w-4 text-sky-700" aria-hidden="true" />
                How we calculated the benchmark
              </span>
              <span className="text-slate-400 transition group-open:rotate-45">+</span>
            </summary>
            <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              {research.methodology.map((item) => <p key={item}>{item}</p>)}
              <p className="font-semibold text-slate-800">
                Prices can change. Every displayed provider links to the official source checked on {research.reviewedLabel}.
              </p>
            </div>
          </details>

          <details className="group rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold text-slate-950">
              <span>Providers checked without a comparable public fee</span>
              <span className="text-slate-400 transition group-open:rotate-45">+</span>
            </summary>
            <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
              {PHONICS_FEES_REVIEWED_WITHOUT_COMPARABLE_PUBLIC_PRICE.map((item) => (
                <div key={item.provider}>
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-sky-700 underline decoration-sky-200 underline-offset-4"
                  >
                    {item.provider}
                  </a>
                  <p className="mt-0.5">{item.reason}</p>
                </div>
              ))}
            </div>
          </details>
        </div>

        <p className="mt-4 text-xs leading-5 text-slate-500">
          Tiny Steps publishes this research and is not an independent comparison service. Provider names and public prices are reported for factual market research only; no quality or value ranking is assigned.
        </p>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-9 lg:px-8 lg:py-10">
          <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                <IndianRupee className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Tiny Steps price, for reference</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                {formatINR(PER_CLASS_PRICE)} per 35-minute live 1:1 class
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                Tiny Steps is intentionally excluded from the external-provider median. The current standard packages below use the same {formatINR(PER_CLASS_PRICE)} per-class rate.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {ONE_TO_ONE_MONTHLY_PACKAGES.map((pkg) => (
                <article key={pkg.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-700">{pkg.classes} live classes</p>
                  <p className="mt-1.5 text-2xl font-black text-slate-950">{formatINR(pkg.monthlyFee)}</p>
                  <p className="mt-1 text-xs text-slate-500">{pkg.durationMinutes} minutes · 1:1</p>
                </article>
              ))}
              <article className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-700">Small groups</p>
                <p className="mt-1.5 text-2xl font-black text-slate-950">
                  {formatINR(tinyStepsGroupMin)}–{formatINR(tinyStepsGroupMax)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  per child / class · {tinyStepsGroupDurationMin}–{tinyStepsGroupDurationMax} min
                </p>
              </article>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
            <Link to="/pricing" className="inline-flex items-center gap-2 font-bold text-sky-700 hover:text-sky-900">
              View full Tiny Steps pricing <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600">12 classes: ₹4,800 · 16: ₹6,400 · 24: ₹9,600</span>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-9 lg:px-8 lg:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-200">Compare packages fairly</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">Use effective fee per live class</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Package total alone is not enough. Compare the live format, teaching time and terms behind the number.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-slate-100">
              Total package fee ÷ stated live classes = effective fee per class
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {comparisonChecks.map((item, index) => (
              <div key={item} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.05] p-4 text-sm leading-6 text-slate-200">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-slate-950">{index + 1}</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-9 lg:px-8 lg:py-10">
        <div className="grid gap-7 lg:grid-cols-[.65fr_1.35fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">Parent questions</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Phonics fees FAQs</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Short answers to the pricing questions parents usually need before comparing programmes.
            </p>
          </div>
          <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {faqItems.map((item) => (
              <details key={item.question} className="group p-4 open:bg-slate-50/60">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-bold text-slate-950">
                  <span>{item.question}</span>
                  <span className="mt-0.5 text-xl font-light text-slate-400 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            <Link to="/phonics" className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-700">Programme</p>
              <p className="mt-1 font-black text-slate-950">See the Tiny Steps phonics pathway</p>
            </Link>
            <Link to="/best-online-phonics-classes-for-kids-in-india" className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-700">Comparison guide</p>
              <p className="mt-1 font-black text-slate-950">Compare programme fit and teaching quality</p>
            </Link>
            <Link to="/book-demo" className="rounded-2xl border border-slate-900 bg-slate-950 p-4 text-white transition hover:-translate-y-0.5 hover:bg-slate-800">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-200">Next step</p>
              <p className="mt-1 flex items-center justify-between gap-3 font-black">
                Book the free 35-minute assessment <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </p>
            </Link>
          </div>
        </div>
      </section>

      <div className="pb-20"><ClusterSeoNav cluster="phonics" compact /></div>
    </main>
  );
}
