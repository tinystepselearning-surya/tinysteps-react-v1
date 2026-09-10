import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  IndianRupee,
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
import { applySeo, getRouteConfig } from '../../lib/seo';
import { createFAQPageSchema, createWebPageSchema, PUBLIC_FACTS } from '../../lib/schemas';

const feeKeywords = [
  'phonics classes fees in India',
  'phonics class fees India',
  'online phonics classes fees',
  'phonics classes cost India',
  '1 to 1 phonics class fees',
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
  'Confirm group size, package terms and any rescheduling rules before paying.',
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
    question: 'How much are Tiny Steps phonics classes in India?',
    answer: 'The current standard Tiny Steps rate with an Indian teacher is ₹400 per live 1:1 class. Each standard 1:1 class is 35 minutes. A 12-class package is ₹4,800.',
  },
  {
    question: 'How much is a 12-class phonics package?',
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
    answer: 'No. Price alone does not establish teaching quality. Parents should also compare curriculum sequence, live correction, individual response time, placement, reading transfer, progress visibility and policies.',
  },
  {
    question: 'How should I compare phonics course packages from different providers?',
    answer: 'Divide the total package fee by the number of clearly stated live classes, then compare class duration, teacher-to-child ratio, assessment, live correction, practice expectations and package policies. Avoid treating a lower or higher headline price as a quality ranking.',
  },
  {
    question: 'Is this page for India pricing only?',
    answer: 'This page presents Tiny Steps pricing in Indian rupees and is the canonical owner for India phonics-fee searches. International and NRI families can still join Tiny Steps online phonics classes, but should confirm the applicable billing and teacher option with admissions before enrolment.',
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

export default function PhonicsFeesIndiaPage() {
  const routeConfig = getRouteConfig('/phonics-fees-india');
  const canonicalPath = routeConfig?.canonicalPath ?? '/phonics-fees-india';
  const canonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${canonicalPath}`;
  const seoTitle = routeConfig?.title ?? 'Phonics Class Fees in India 2026 | ₹400 1:1 | Tiny Steps';
  const seoDescription = routeConfig?.description ?? 'Tiny Steps phonics classes cost ₹400 per 35-minute live 1:1 class in India. See 12, 16 and 24-class package prices, small-group fees and the free assessment.';

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
      about: [
        { '@type': 'Thing', name: 'Phonics class fees in India' },
        { '@type': 'Thing', name: 'Online phonics class pricing' },
        { '@type': 'Thing', name: '1:1 phonics class cost' },
        { '@type': 'Thing', name: 'Small-group phonics pricing' },
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
              Current Tiny Steps phonics pricing · India
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-[3.35rem] lg:leading-[1.03]">
              Phonics Class Fees in India
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Tiny Steps standard live 1:1 phonics classes cost <strong>{formatINR(PER_CLASS_PRICE)} per class</strong>. Each standard 1:1 class is <strong>35 minutes</strong>, and the 12-class starter package is <strong>{starter ? formatINR(starter.monthlyFee) : '₹4,800'}</strong>.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#tiny-steps-pricing" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-300/40 transition hover:-translate-y-0.5 hover:bg-slate-800">
                See current fees <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <Link to="/book-demo" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-400">
                Book free 35-minute assessment
              </Link>
            </div>
            <p className="mt-5 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
              {PUBLIC_SITE_FACTS.audience.label} · live online · standard Indian-teacher pricing in INR · updated September 2026
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white/95 p-5 shadow-2xl shadow-slate-200/50">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Quick answer</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MoneyCard title="Standard 1:1" amount={formatINR(PER_CLASS_PRICE)} detail="per child · per 35-minute live class" />
              <MoneyCard title="12 live classes" amount={starter ? formatINR(starter.monthlyFee) : '₹4,800'} detail="standard 1:1 starter package" />
            </div>
            <div className="mt-3 rounded-2xl bg-slate-950 p-5 text-white">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-200" aria-hidden="true" />
                <p className="text-sm leading-6 text-slate-200">
                  <strong className="text-white">One free 35-minute 1:1 demo assessment comes first.</strong> The assessment helps identify the child’s starting point before a package is selected.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="tiny-steps-pricing" className="mx-auto max-w-7xl scroll-mt-28 px-6 py-11 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-700">1:1 package pricing</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Same standard per-class rate, clear package totals</h2>
          <p className="mt-3 text-base leading-7 text-slate-600">The standard Indian-teacher 1:1 rate remains {formatINR(PER_CLASS_PRICE)} per live class. Package totals simply reflect the number of classes.</p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {ONE_TO_ONE_MONTHLY_PACKAGES.map((pkg) => (
            <article key={pkg.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">{pkg.classes} live classes</p>
              <p className="mt-3 text-3xl font-black text-slate-950">{formatINR(pkg.monthlyFee)}</p>
              <p className="mt-2 text-sm text-slate-600">{formatINR(Math.round(pkg.monthlyFee / pkg.classes))} per class · {pkg.durationMinutes} minutes · 1 child : 1 teacher</p>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950">
          <strong>Pricing is not a reading-level recommendation.</strong> The right starting point and pace should follow the child’s assessment, not the largest package or the child’s age alone.
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-11 lg:px-8 lg:py-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-700">Small-group pricing</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Current per-child group fees</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">Small-group pricing decreases per child as the group gets larger, while session duration increases. Group placement depends on a suitable learning and schedule fit.</p>
            </div>
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
          <p className="mt-3 text-xs leading-5 text-slate-500">All group fees above are per child. For broader English-program pricing and native-English-speaking teacher tiers, use the main pricing page.</p>
          <Link to="/pricing" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-sky-700 hover:text-sky-900">View all Tiny Steps pricing <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-11 lg:px-8 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700"><Calculator className="h-5 w-5" aria-hidden="true" /></div>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Compare packages fairly</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Use effective fee per live class</h2>
            <p className="mt-3 leading-7 text-slate-600">Provider pricing changes frequently and formats differ, so this page does not present an unsupported nationwide “average phonics fee.” Instead, compare every provider using the same calculation.</p>
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
            <p className="mt-3 text-sm leading-7 text-slate-600">These answers use current Tiny Steps pricing rather than an unsupported nationwide average.</p>
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
