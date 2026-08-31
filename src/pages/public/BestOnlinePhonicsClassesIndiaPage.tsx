import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import AboutAuthor from '../../components/AboutAuthor';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import ContentTrustNote from '../../components/seo/ContentTrustNote';
import TestimonialsSection from '../../components/seo/TestimonialsSection';
import { PUBLIC_SITE_FACTS } from '../../config/publicFacts';
import { ONE_TO_ONE_MONTHLY_PACKAGES, PER_CLASS_PRICE, formatINR } from '../../config/pricing';
import { applySeo, getRouteConfig } from '../../lib/seo';
import { createFAQPageSchema, createWebPageSchema, PUBLIC_FACTS } from '../../lib/schemas';

const primaryIntentKeywords = [
  'best online phonics classes in India',
  'best phonics classes for kids',
  'best phonics classes online',
  'best phonics course in India',
  'how to choose phonics classes',
  'online phonics classes comparison',
  'phonics classes fees',
  'phonics class cost',
  '1-to-1 vs group phonics classes',
  'what to look for in a phonics class',
  'which phonics program is best for my child',
];

const decisionGates = [
  {
    title: '1. Child fit',
    answer:
      'Start with the child’s actual reading stage. A child who needs sound–letter knowledge, blending, decoding, spelling, or fluency support should not automatically receive the same starting level.',
  },
  {
    title: '2. Teaching quality',
    answer:
      'Look for an explicit, cumulative phonics sequence with blending, segmenting, decoding, live correction, retry, and reading practice matched to what has already been taught.',
  },
  {
    title: '3. Proof of transfer',
    answer:
      'Ask whether progress is visible on fresh words, spelling, and connected text rather than only on repeated worksheets, lesson completion, or memorised word lists.',
  },
  {
    title: '4. Practical clarity',
    answer:
      'Confirm class format, duration, teacher continuity, parent updates, materials, fees, scheduling, and what happens before enrolment.',
  },
];

const comparisonFormats = [
  {
    format: 'Live 1:1 phonics',
    strongWhen: 'A child needs individual pacing, immediate correction, or support for a clearly identified decoding gap.',
    parentCheck: 'Ask how the teacher adjusts pace, corrects errors, and checks the same skill on an unfamiliar example.',
  },
  {
    format: 'Small-group phonics',
    strongWhen: 'Children can work productively at a shared pace and benefit from a social learning format.',
    parentCheck: 'Ask how much individual response time each child receives and what happens when one learner falls behind the group pace.',
  },
  {
    format: 'App or self-practice',
    strongWhen: 'The child already understands the target skill and mainly needs convenient reinforcement between teaching sessions.',
    parentCheck: 'Ask whether the tool can diagnose the reason for an error or whether a teacher or adult is still needed for correction.',
  },
];

const providerScorecard = [
  'Placement is based on current reading and spelling behaviour, not age alone.',
  'The provider can explain the child’s main bottleneck in plain language.',
  'The next teaching target follows logically from the assessed starting point.',
  'The phonics sequence is explicit, systematic, and cumulative.',
  'Blending for reading and segmenting for spelling are both taught.',
  'Children practise decoding instead of depending on pictures or word-shape guessing.',
  'Reading practice is matched to phonics patterns the child has already been taught.',
  'Fresh examples are used to check transfer, not only rehearsed word lists.',
  'Errors receive strategy-focused correction followed by another attempt.',
  'Parents can see observable progress and the next learning target.',
  'Class format, duration, materials, pricing, and policies are clear before enrolment.',
  'Marketing avoids fixed reading guarantees that ignore individual starting points.',
];

const demoQuestions = [
  'What did you observe that determined my child’s starting point?',
  'What is the first teaching target, and why is it first?',
  'How does your sequence move from sound knowledge into blending and reading?',
  'How do you check a taught pattern on a fresh word?',
  'How do you connect phonics with spelling and sentence reading?',
  'What happens when my child makes the same error repeatedly?',
  'How will I know what has improved and what still needs work?',
  'What class format, duration, frequency, package, and policies apply after the assessment?',
];

const redFlags = [
  'A fixed “read in X weeks” promise for every child, regardless of starting level.',
  'No placement process before recommending a level or package.',
  'Progress described only as lessons, worksheets, or levels completed.',
  'Heavy reliance on memorised word lists without checking unfamiliar-word decoding.',
  'No clear explanation of how sounds progress into blending, spelling, and connected reading.',
  'Unclear pricing, materials, scheduling, cancellation, or parent-feedback expectations.',
  'A “best” or “#1” claim without evidence parents can inspect for themselves.',
];

const pricingQuestions = [
  'Is the class 1:1, group, or mainly self-practice?',
  'Is assessment or placement included?',
  'Are materials or home-practice resources included?',
  'How often is parent progress shared?',
  'What happens if the child needs slower or faster pacing?',
  'Are rescheduling, cancellation, and package terms clear?',
];

const tinyStepsEvidence = [
  {
    criterion: 'Starting-point clarity',
    tinySteps: 'A free 35-minute 1:1 demo assessment class is used before package selection.',
    href: '/book-demo',
    label: 'Book the assessment',
  },
  {
    criterion: 'Program progression',
    tinySteps: 'The main phonics page owns Tiny Steps program details, levels, method, and placement guidance.',
    href: '/phonics',
    label: 'Explore the phonics program',
  },
  {
    criterion: 'Curriculum evidence',
    tinySteps: 'Parents can inspect the phonics learning roadmap instead of relying only on sales copy.',
    href: '/curriculum?tab=phonics',
    label: 'Review the curriculum',
  },
  {
    criterion: 'Live-class evidence',
    tinySteps: 'Class samples let parents inspect teacher pacing, participation, and correction in practice.',
    href: '/class-samples',
    label: 'Watch class samples',
  },
  {
    criterion: 'Parent experience',
    tinySteps: 'Selected parent feedback is available separately from the comparison claims on this page.',
    href: '/testimonials',
    label: 'Read parent reviews',
  },
  {
    criterion: 'Commercial clarity',
    tinySteps: 'Current public pricing can be reviewed before enrolment.',
    href: '/pricing',
    label: 'Check pricing',
  },
];

const fitCards = [
  'Child knows letters but cannot blend sounds into words',
  'Child knows some sounds but guesses unfamiliar words',
  'Child needs decoding and spelling support together',
  'Child needs individual pacing or immediate live correction',
  'Parent wants a clear starting level before choosing a package',
  'Family wants teacher-led instruction with home practice as reinforcement',
];

const faqItems = [
  {
    question: 'What should parents look for in the best online phonics classes in India?',
    answer:
      'Compare four things: child fit, teaching quality, proof that learning transfers to fresh words and reading, and practical clarity around format, progress, pricing, and policies. No single provider format is automatically best for every child.',
  },
  {
    question: 'Are 1:1 phonics classes better than group classes?',
    answer:
      'Not automatically. Live 1:1 can be especially useful when a child needs individual pacing or immediate correction. Group classes can work well when learners are comfortable progressing at a shared pace. The right choice depends on the child’s current need and the quality of teaching.',
  },
  {
    question: 'What age is Tiny Steps phonics for?',
    answer: `Tiny Steps serves ${PUBLIC_SITE_FACTS.audience.label}. Younger learners often begin with early sound and blending foundations, while older children can join when decoding, spelling, or reading gaps remain.`,
  },
  {
    question: 'How much do Tiny Steps online phonics classes cost?',
    answer:
      'The current standard reference is ₹400 per 1:1 class, with the starter 12-class plan at ₹4,800. Parents can review current pricing before enrolment and confirm the suitable package after the free assessment.',
  },
  {
    question: 'How do I know whether my child needs phonics or broader reading support?',
    answer:
      'If the main problem is recognising sound–spelling patterns, blending, or decoding unfamiliar words, phonics is usually central. If decoding is already accurate but reading remains slow or meaning is weak, fluency, vocabulary, or comprehension may need more attention.',
  },
  {
    question: 'How can parents compare teacher quality in an online phonics class?',
    answer:
      'Watch what happens after an error. A useful teacher should identify the exact difficulty, redirect the child to the relevant sound or spelling pattern, give only the support needed, and allow another attempt rather than simply supplying the word.',
  },
  {
    question: 'Is Tiny Steps phonics mainly 1:1?',
    answer:
      'Yes. Live 1:1 online phonics is the main Tiny Steps pathway. Small-group options may be available for selected schedules or program fits.',
  },
  {
    question: 'What happens in the free phonics demo assessment?',
    answer:
      'The 35-minute 1:1 session is used to observe the child’s current reading stage, identify the most relevant starting point, and discuss the recommended path before a package is selected.',
  },
  {
    question: 'How long does phonics progress take?',
    answer:
      'There is no reliable fixed timeline for every child. Progress depends on the starting point, the specific gap, attendance, practice, and how independently the child can transfer taught patterns to fresh words, spelling, and connected reading.',
  },
  {
    question: 'What platform does Tiny Steps use for online classes?',
    answer:
      'Tiny Steps conducts live online classes through Microsoft Teams. Families receive the class access details for their scheduled sessions.',
  },
];

const pageNavItems = [
  { id: 'comparison-framework', label: 'Choose' },
  { id: 'programme-fit', label: 'Child fit' },
  { id: 'format-comparison', label: 'Compare' },
  { id: 'tiny-steps-evidence', label: 'Tiny Steps' },
  { id: 'parent-reviews', label: 'Reviews' },
  { id: 'pricing', label: 'Cost' },
  { id: 'faq', label: 'FAQs' },
];

const premiumTones = [
  {
    card: 'border-orange-200/80 bg-gradient-to-br from-white via-orange-50/55 to-amber-50/75 hover:border-orange-300 hover:shadow-[0_18px_44px_rgba(249,115,22,0.14)]',
    badge: 'bg-orange-100 text-orange-800 ring-orange-200',
    glow: 'bg-orange-200/55',
    accent: 'from-orange-400 to-amber-400',
    soft: 'bg-orange-50/80',
    row: 'bg-gradient-to-r from-orange-50/65 to-white hover:from-orange-100/70',
  },
  {
    card: 'border-sky-200/80 bg-gradient-to-br from-white via-sky-50/55 to-cyan-50/75 hover:border-sky-300 hover:shadow-[0_18px_44px_rgba(14,165,233,0.13)]',
    badge: 'bg-sky-100 text-sky-800 ring-sky-200',
    glow: 'bg-sky-200/55',
    accent: 'from-sky-400 to-cyan-400',
    soft: 'bg-sky-50/80',
    row: 'bg-gradient-to-r from-sky-50/65 to-white hover:from-sky-100/70',
  },
  {
    card: 'border-violet-200/80 bg-gradient-to-br from-white via-violet-50/55 to-fuchsia-50/60 hover:border-violet-300 hover:shadow-[0_18px_44px_rgba(139,92,246,0.13)]',
    badge: 'bg-violet-100 text-violet-800 ring-violet-200',
    glow: 'bg-violet-200/55',
    accent: 'from-violet-400 to-fuchsia-400',
    soft: 'bg-violet-50/80',
    row: 'bg-gradient-to-r from-violet-50/65 to-white hover:from-violet-100/70',
  },
  {
    card: 'border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/55 to-teal-50/70 hover:border-emerald-300 hover:shadow-[0_18px_44px_rgba(16,185,129,0.13)]',
    badge: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    glow: 'bg-emerald-200/55',
    accent: 'from-emerald-400 to-teal-400',
    soft: 'bg-emerald-50/80',
    row: 'bg-gradient-to-r from-emerald-50/65 to-white hover:from-emerald-100/70',
  },
  {
    card: 'border-rose-200/80 bg-gradient-to-br from-white via-rose-50/50 to-pink-50/65 hover:border-rose-300 hover:shadow-[0_18px_44px_rgba(244,63,94,0.12)]',
    badge: 'bg-rose-100 text-rose-800 ring-rose-200',
    glow: 'bg-rose-200/50',
    accent: 'from-rose-400 to-pink-400',
    soft: 'bg-rose-50/80',
    row: 'bg-gradient-to-r from-rose-50/60 to-white hover:from-rose-100/65',
  },
  {
    card: 'border-amber-200/80 bg-gradient-to-br from-white via-amber-50/55 to-yellow-50/65 hover:border-amber-300 hover:shadow-[0_18px_44px_rgba(245,158,11,0.12)]',
    badge: 'bg-amber-100 text-amber-800 ring-amber-200',
    glow: 'bg-amber-200/50',
    accent: 'from-amber-400 to-yellow-400',
    soft: 'bg-amber-50/80',
    row: 'bg-gradient-to-r from-amber-50/60 to-white hover:from-amber-100/65',
  },
];

type SectionTint = 'white' | 'blue' | 'warm' | 'lavender';

function Section({ children, tint = 'white', id }: { children: ReactNode; tint?: SectionTint; id?: string }) {
  const backgrounds: Record<SectionTint, string> = {
    white: 'bg-white',
    blue: 'bg-[#F3F9FF]',
    warm: 'bg-[#FFF9F1]',
    lavender: 'bg-[#FBF8FF]',
  };

  return (
    <section id={id} className={`${backgrounds[tint]} scroll-mt-[176px] px-4 py-12 sm:px-5 md:scroll-mt-[184px] md:py-16 lg:px-6`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="max-w-4xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold tracking-[-0.025em] text-slate-950 sm:text-[34px]">{title}</h2>
      {children ? <div className="mt-3 text-base leading-8 text-slate-700">{children}</div> : null}
    </div>
  );
}

export default function BestOnlinePhonicsClassesIndiaPage() {
  const routeConfig = getRouteConfig('/best-online-phonics-classes-for-kids-in-india');
  const canonicalPath = routeConfig?.canonicalPath ?? '/best-online-phonics-classes-for-kids-in-india';
  const canonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${canonicalPath}`;
  const seoTitle = routeConfig?.title ?? 'Best Online Phonics Classes for Kids in India | Tiny Steps Learning';
  const seoDescription =
    'Compare the best online phonics classes for kids in India by child fit, 1:1 vs group format, curriculum, teacher correction, transfer evidence, phonics class cost, fees, and progress visibility.';
  const starterPlan = ONE_TO_ONE_MONTHLY_PACKAGES.find((pkg) => pkg.id === 'starter');
  const [activeSection, setActiveSection] = useState(pageNavItems[0].id);

  useEffect(() => {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${PUBLIC_FACTS.primaryWebsite}/` },
        { '@type': 'ListItem', position: 2, name: 'Phonics', item: `${PUBLIC_FACTS.primaryWebsite}/phonics` },
        { '@type': 'ListItem', position: 3, name: 'Best Online Phonics Classes for Kids in India', item: canonicalUrl },
      ],
    };

    const decisionFrameworkSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${canonicalUrl}#decision-framework`,
      name: 'How parents should compare online phonics classes',
      itemListElement: decisionGates.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Thing',
          name: item.title,
          description: item.answer,
        },
      })),
    };

    const scorecardSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${canonicalUrl}#provider-scorecard`,
      name: 'Parent scorecard for comparing phonics providers',
      itemListElement: providerScorecard.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item,
      })),
    };

    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': `${canonicalUrl}#faq`,
    };

    const webpageSchema = {
      ...createWebPageSchema({
        name: 'Best Online Phonics Classes for Kids in India',
        description: seoDescription,
        url: canonicalUrl,
      }),
      '@id': `${canonicalUrl}#webpage`,
      about: [
        { '@type': 'Thing', name: 'Online phonics classes comparison' },
        { '@type': 'Thing', name: '1-to-1 vs group phonics classes' },
        { '@type': 'Thing', name: 'Phonics class fees and cost' },
      ],
    };

    applySeo({
      title: seoTitle,
      description: seoDescription,
      canonicalPath,
      ogType: routeConfig?.ogType ?? 'website',
      keywords: primaryIntentKeywords,
      jsonLd: [breadcrumbSchema, webpageSchema, decisionFrameworkSchema, scorecardSchema, faqSchema],
    });
  }, [canonicalPath, canonicalUrl, routeConfig?.ogType, seoDescription, seoTitle]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const sections = pageNavItems
      .map((item) => document.getElementById(item.id))
      .filter((section): section is HTMLElement => Boolean(section));

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target.id) setActiveSection(visible.target.id);
      },
      {
        rootMargin: '-23% 0px -63% 0px',
        threshold: [0.05, 0.2, 0.45],
      },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-white pb-24 lg:pb-16">
      <section className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-[#FFF5EA] via-white to-[#EAF6FF] px-4 py-10 sm:px-5 md:py-14 lg:px-8 lg:py-[72px]">
        <div className="pointer-events-none absolute -left-16 top-8 h-52 w-52 rounded-full bg-orange-100/90 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-12 top-0 h-64 w-64 rounded-full bg-sky-100/95 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-0 left-[44%] h-40 w-40 rounded-full bg-violet-100/35 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-12">
          <div>
            <p className="inline-flex rounded-full border border-orange-200 bg-white/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-orange-700 shadow-sm">
              Parent comparison & decision guide
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-[1.02] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-[58px]">
              Best Online Phonics Classes for Kids in India
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-700 sm:text-lg">
              Compare phonics programmes by child fit, teaching quality, 1-to-1 vs group format, proof of reading transfer, progress visibility, fees, and total class cost before you choose.
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              This page is the Tiny Steps buyer-comparison guide. For the full Tiny Steps phonics method, levels, and learning pathway, use the{' '}
              <Link to="/phonics" className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-700">
                main phonics programme page
              </Link>
              .
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/book-demo"
                className="inline-flex min-h-[50px] w-full items-center justify-center rounded-full bg-slate-950 px-6 py-3 font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.20)] motion-safe:transition-all motion-safe:duration-300 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-[0_16px_34px_rgba(15,23,42,0.24)] sm:w-auto"
              >
                Book Free 35-Minute Assessment
              </Link>
              <a
                href="#comparison-framework"
                className="inline-flex min-h-[50px] w-full items-center justify-center rounded-full border border-slate-300 bg-white/90 px-6 py-3 font-semibold text-slate-900 shadow-sm motion-safe:transition-all motion-safe:duration-300 hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50/60 hover:shadow-md sm:w-auto"
              >
                Compare Phonics Options
              </a>
            </div>
          </div>

          <aside className="rounded-[30px] border border-white/90 bg-white/88 p-5 shadow-[0_24px_64px_rgba(15,23,42,0.12)] backdrop-blur sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tiny Steps quick facts</p>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,0.12)]" aria-hidden="true" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { label: 'Age range', value: PUBLIC_SITE_FACTS.audience.label, tone: premiumTones[0] },
                { label: 'Main format', value: 'Live 1:1 online', tone: premiumTones[1] },
                { label: 'Session length', value: PUBLIC_SITE_FACTS.liveSessions.label, tone: premiumTones[2] },
                { label: 'Current reference', value: `${formatINR(PER_CLASS_PRICE)} per 1:1 class`, tone: premiumTones[3] },
              ].map((fact) => (
                <div
                  key={fact.label}
                  className={`group relative overflow-hidden rounded-2xl border p-4 shadow-[0_4px_14px_rgba(15,23,42,0.03)] motion-safe:transition-all motion-safe:duration-300 hover:-translate-y-0.5 hover:shadow-md ${fact.tone.card}`}
                >
                  <div className={`pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full blur-2xl ${fact.tone.glow}`} aria-hidden="true" />
                  <p className="relative text-xs font-semibold text-slate-500">{fact.label}</p>
                  <p className="relative mt-1 font-bold leading-6 text-slate-900">{fact.value}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600">
              The free assessment is the first step so the recommended starting point follows the child’s current reading behaviour rather than age alone.
            </p>
          </aside>
        </div>
      </section>

      <div className="sticky top-[72px] z-30 border-y border-slate-200/75 bg-white/94 shadow-[0_8px_24px_rgba(15,23,42,0.055)] backdrop-blur-xl lg:top-[78px]">
        <nav
          aria-label="On this page"
          className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none] sm:px-5 lg:px-6 [&::-webkit-scrollbar]:hidden"
        >
          {pageNavItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={isActive ? 'location' : undefined}
                className={`inline-flex min-h-[38px] shrink-0 items-center justify-center rounded-full px-4 text-sm font-semibold motion-safe:transition-all motion-safe:duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-slate-950 to-slate-800 text-white shadow-[0_7px_16px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/10'
                    : 'border border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>

      <Section id="comparison-framework" tint="warm">
        <SectionHeading eyebrow="Quick answer" title="How should parents choose the best phonics class?">
          <p>
            Compare four things before you compare brands: <strong>child fit, teaching quality, proof of transfer, and practical clarity</strong>. The strongest programme for one child may not be the strongest fit for another, so this page avoids unsupported “#1” claims and gives you criteria you can verify.
          </p>
        </SectionHeading>

        <div className="relative mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {decisionGates.map((item, index) => {
            const tone = premiumTones[index];
            return (
              <article
                key={item.title}
                className={`group relative overflow-hidden rounded-[28px] border p-5 shadow-[0_8px_24px_rgba(15,23,42,0.045)] motion-safe:transition-all motion-safe:duration-300 hover:-translate-y-1 ${tone.card}`}
              >
                <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl motion-safe:transition-transform motion-safe:duration-300 group-hover:scale-125 ${tone.glow}`} aria-hidden="true" />
                <span className={`relative flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ring-1 ${tone.badge}`}>
                  {index + 1}
                </span>
                <h3 className="relative mt-4 text-lg font-bold text-slate-900">{item.title.replace(/^\d+\.\s*/, '')}</h3>
                <p className="relative mt-2 text-sm leading-7 text-slate-700">{item.answer}</p>
                <div className={`absolute inset-x-5 bottom-0 h-1 origin-left scale-x-0 rounded-full bg-gradient-to-r motion-safe:transition-transform motion-safe:duration-300 group-hover:scale-x-100 ${tone.accent}`} aria-hidden="true" />
              </article>
            );
          })}
        </div>
      </Section>

      <Section id="programme-fit">
        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
          <div>
            <SectionHeading eyebrow="Programme fit" title="Who may benefit most from Tiny Steps phonics?" />
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {fitCards.map((item, index) => {
                const tone = premiumTones[index % premiumTones.length];
                return (
                  <article
                    key={item}
                    className={`group relative flex min-h-[92px] gap-3 overflow-hidden rounded-2xl border p-4 shadow-[0_5px_16px_rgba(15,23,42,0.035)] motion-safe:transition-all motion-safe:duration-300 hover:-translate-y-0.5 ${tone.card}`}
                  >
                    <div className={`pointer-events-none absolute -bottom-8 -right-8 h-20 w-20 rounded-full blur-2xl ${tone.glow}`} aria-hidden="true" />
                    <span className={`relative mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1 ${tone.badge}`}>
                      {index + 1}
                    </span>
                    <p className="relative text-sm leading-7 text-slate-700">{item}</p>
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="group relative overflow-hidden rounded-[30px] border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50/80 p-6 shadow-[0_12px_36px_rgba(249,115,22,0.07)] motion-safe:transition-all motion-safe:duration-300 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-[0_18px_44px_rgba(249,115,22,0.12)] sm:p-7">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-orange-100/80 blur-3xl motion-safe:transition-transform motion-safe:duration-500 group-hover:scale-125" aria-hidden="true" />
            <div className="absolute -bottom-12 left-10 h-28 w-28 rounded-full bg-amber-100/65 blur-3xl" aria-hidden="true" />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">When phonics may not be the main need</p>
              <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Accurate decoding but slow or weak reading?</h3>
              <p className="mt-4 text-sm leading-7 text-slate-700 sm:text-base">
                If your child already decodes words accurately but reads very slowly, struggles with expression, or does not understand what they read, the main bottleneck may have moved beyond basic phonics.
              </p>
              <Link
                to="/reading-classes-for-kids"
                className="mt-6 inline-flex min-h-[44px] items-center rounded-full border border-orange-200 bg-white px-5 py-2.5 font-semibold text-slate-900 shadow-sm motion-safe:transition-all motion-safe:duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50 hover:shadow-md"
              >
                Compare broader reading support
              </Link>
            </div>
          </aside>
        </div>
      </Section>

      <Section id="format-comparison" tint="blue">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading eyebrow="Format comparison" title="1-to-1 vs group phonics classes vs app practice" />
          <p className="max-w-xl text-sm leading-7 text-slate-600">
            Format matters, but teaching quality and child fit matter more than the label alone.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {comparisonFormats.map((item, index) => {
            const tone = premiumTones[index];
            return (
              <article
                key={item.format}
                className={`group relative overflow-hidden rounded-[28px] border p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] motion-safe:transition-all motion-safe:duration-300 hover:-translate-y-1 sm:p-6 ${tone.card}`}
              >
                <div className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl motion-safe:transition-transform motion-safe:duration-500 group-hover:scale-125 ${tone.glow}`} aria-hidden="true" />
                <div className="relative flex items-start justify-between gap-4">
                  <h3 className="text-xl font-bold tracking-tight text-slate-950">{item.format}</h3>
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1 ${tone.badge}`}>
                    {index + 1}
                  </span>
                </div>
                <div className="relative mt-5 border-t border-slate-200/70 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Can be strong when</p>
                  <p className="mt-2 text-sm leading-7 text-slate-700">{item.strongWhen}</p>
                </div>
                <div className={`relative mt-4 rounded-2xl border border-white/70 p-4 shadow-inner ${tone.soft}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">What parents should check</p>
                  <p className="mt-2 text-sm leading-7 text-slate-700">{item.parentCheck}</p>
                </div>
                <div className={`absolute inset-x-6 bottom-0 h-1 scale-x-0 rounded-full bg-gradient-to-r motion-safe:transition-transform motion-safe:duration-300 group-hover:scale-x-100 ${tone.accent}`} aria-hidden="true" />
              </article>
            );
          })}
        </div>
      </Section>

      <Section id="provider-scorecard">
        <SectionHeading eyebrow="Parent scorecard" title="12 checks before choosing a phonics programme">
          <p>
            Use these as comparison questions, not as a universal rating system. A provider does not need to use Tiny Steps terminology, but it should be able to answer the underlying questions clearly.
          </p>
        </SectionHeading>

        <div className="mt-8 overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.055)]">
          <div className="grid md:grid-cols-2">
            {providerScorecard.map((item, index) => {
              const tone = premiumTones[index % premiumTones.length];
              return (
                <article
                  key={item}
                  className={`group flex gap-4 border-slate-100 p-4 motion-safe:transition-all motion-safe:duration-200 sm:p-5 ${tone.row} ${
                    index > 0 ? 'border-t' : ''
                  } ${index === 1 ? 'md:border-t-0' : ''} ${index % 2 === 1 ? 'md:border-l' : ''}`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1 motion-safe:transition-transform motion-safe:duration-200 group-hover:scale-105 ${tone.badge}`}>
                    {index + 1}
                  </span>
                  <p className="text-sm leading-7 text-slate-700 sm:text-base">{item}</p>
                </article>
              );
            })}
          </div>
        </div>
      </Section>

      <Section id="tiny-steps-evidence" tint="lavender">
        <SectionHeading eyebrow="Tiny Steps against the criteria" title="What can parents verify before choosing Tiny Steps?">
          <p>
            The useful question is not “Does Tiny Steps call itself the best?” It is “Can I inspect the programme, evidence, pricing, and teaching approach before I decide?”
          </p>
        </SectionHeading>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tinyStepsEvidence.map((item, index) => {
            const tone = premiumTones[index % premiumTones.length];
            return (
              <article
                key={item.criterion}
                className={`group relative flex h-full flex-col overflow-hidden rounded-[26px] border p-5 shadow-[0_8px_24px_rgba(15,23,42,0.045)] motion-safe:transition-all motion-safe:duration-300 hover:-translate-y-1 focus-within:-translate-y-1 ${tone.card}`}
              >
                <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl motion-safe:transition-transform motion-safe:duration-500 group-hover:scale-125 ${tone.glow}`} aria-hidden="true" />
                <div className="relative flex items-start justify-between gap-4">
                  <h3 className="text-lg font-bold text-slate-950">{item.criterion}</h3>
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1 ${tone.badge}`}>
                    {index + 1}
                  </span>
                </div>
                <p className="relative mt-3 flex-1 text-sm leading-7 text-slate-700">{item.tinySteps}</p>
                <Link
                  to={item.href}
                  className={`relative mt-5 inline-flex min-h-[42px] items-center justify-center rounded-full border border-white/80 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm motion-safe:transition-all motion-safe:duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-md ${tone.soft}`}
                >
                  {item.label}
                  <span className="ml-2 text-slate-400 motion-safe:transition-transform motion-safe:duration-200 group-hover:translate-x-0.5" aria-hidden="true">→</span>
                </Link>
              </article>
            );
          })}
        </div>
      </Section>

      <div className="bg-white py-2">
        <ContentTrustNote text="This comparison page is created by the Tiny Steps academic team and founder-reviewed to help parents compare phonics options using visible criteria, realistic expectations, and inspectable evidence rather than unsupported ranking claims." />
      </div>

      <AboutAuthor
        className="!mt-8 mx-auto max-w-6xl px-4 sm:px-5 lg:px-6 [&>div]:!p-5 sm:[&>div]:!p-6 [&_figure]:!h-16 [&_figure]:!w-16 [&_dl]:!mt-4 [&_dl]:!pt-4 lg:[&_dl]:!grid-cols-3"
        title="About the Founder Review"
        intro="This buyer guide separates provider-comparison intent from the main Tiny Steps phonics programme page so parents can compare options without losing the detailed learning pathway."
        note="The comparison framework focuses on child fit, teaching quality, transfer evidence, and practical clarity before enrolment."
        highlights={[
          { label: 'Audience', value: PUBLIC_SITE_FACTS.audience.label },
          { label: 'Comparison focus', value: 'Fit, teaching, transfer evidence, format, progress, fees and cost' },
          { label: 'Primary next step', value: 'Free 35-minute 1:1 demo assessment before package selection' },
        ]}
        badges={['Founder reviewed', 'Buyer comparison guide']}
        ctas={[
          { label: 'Explore the main phonics programme', to: '/phonics', variant: 'secondary' },
          { label: 'Book one free 35-minute assessment', to: '/book-demo', variant: 'primary' },
        ]}
      />

      <div id="parent-reviews" className="scroll-mt-[176px] md:scroll-mt-[184px]">
        <TestimonialsSection
          title="Parent feedback to consider alongside the comparison criteria"
          subtitle="Reviews are one evidence source—not a universal guarantee. Use them together with class samples, curriculum, pricing, and the child’s assessment result."
          courseTag="phonics"
          limit={6}
          compact
          viewAllHref="/testimonials"
          viewAllLabel="View all parent reviews"
        />
      </div>

      <Section id="pricing" tint="warm">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
          <div>
            <SectionHeading eyebrow="Phonics classes fees" title="What does Tiny Steps phonics cost?" />
            <p className="mt-4 text-base leading-8 text-slate-700">
              The current standard reference is <strong>{formatINR(PER_CLASS_PRICE)} per 1:1 class</strong>
              {starterPlan ? (
                <>
                  {' '}and <strong>{formatINR(starterPlan.monthlyFee)} for {starterPlan.classes} classes</strong>
                </>
              ) : null}. Parents should compare total programme clarity—not price alone—because a lower cost is not automatically stronger teaching, and a higher cost is not proof of better teaching.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/pricing"
                className="inline-flex min-h-[46px] w-full items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-900 shadow-sm motion-safe:transition-all hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50/60 hover:shadow-md sm:w-auto"
              >
                View Current Pricing
              </Link>
              <Link
                to="/book-demo"
                className="inline-flex min-h-[46px] w-full items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)] motion-safe:transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-[0_14px_30px_rgba(15,23,42,0.20)] sm:w-auto"
              >
                Book Free Assessment
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.065)] sm:p-6">
            <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-orange-100/50 blur-3xl" aria-hidden="true" />
            <h3 className="relative text-xl font-bold text-slate-950">When comparing phonics class cost, ask:</h3>
            <ul className="relative mt-5 grid gap-3 text-sm leading-7 text-slate-700 sm:grid-cols-2 sm:text-base">
              {pricingQuestions.map((item, index) => {
                const tone = premiumTones[index % premiumTones.length];
                return (
                  <li
                    key={item}
                    className={`group flex gap-2.5 rounded-2xl border border-transparent p-3.5 motion-safe:transition-all motion-safe:duration-200 hover:-translate-y-0.5 hover:border-white hover:shadow-md ${tone.soft}`}
                  >
                    <span className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ring-1 ${tone.badge}`}>
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </Section>

      <Section tint="blue">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Use the trial well" title="8 questions to ask during a phonics demo or assessment" />
            <ol className="mt-7 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.045)]">
              {demoQuestions.map((item, index) => {
                const tone = premiumTones[index % premiumTones.length];
                return (
                  <li
                    key={item}
                    className={`group flex gap-3 px-4 py-3.5 motion-safe:transition-colors motion-safe:duration-200 sm:px-5 ${index > 0 ? 'border-t border-slate-100' : ''} ${tone.row}`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1 ${tone.badge}`}>
                      {index + 1}
                    </span>
                    <span className="text-sm leading-7 text-slate-700 sm:text-base">{item}</span>
                  </li>
                );
              })}
            </ol>
          </div>

          <div>
            <SectionHeading eyebrow="Comparison red flags" title="What should make a parent ask more questions?" />
            <div className="mt-7 space-y-2.5">
              {redFlags.map((item, index) => (
                <article
                  key={item}
                  className="group flex gap-3 rounded-2xl border border-rose-200/80 bg-gradient-to-r from-rose-50/80 to-white px-4 py-3.5 text-sm leading-7 text-slate-700 shadow-[0_4px_14px_rgba(244,63,94,0.035)] motion-safe:transition-all motion-safe:duration-200 hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-[0_9px_22px_rgba(244,63,94,0.08)] sm:text-base"
                >
                  <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-rose-200 bg-white text-xs font-bold text-rose-700 shadow-sm">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </article>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <div className="group relative overflow-hidden rounded-[30px] border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-violet-50/45 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.045)] motion-safe:transition-all motion-safe:duration-300 hover:border-violet-200 hover:shadow-[0_16px_40px_rgba(139,92,246,0.08)] sm:p-8">
          <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-violet-100/65 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Go deeper</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Use the full parent comparison framework</h2>
            <p className="mt-3 max-w-4xl text-base leading-8 text-slate-700">
              For a deeper editorial checklist covering placement, teaching sequence, decodable reading, transfer evidence, teacher training, progress reporting, pricing clarity, and red flags, read our complete parent guide.
            </p>
            <Link
              to="/blog/how-to-choose-phonics-classes"
              className="mt-5 inline-flex min-h-[46px] items-center rounded-full bg-slate-950 px-5 py-2.5 font-semibold text-white shadow-sm motion-safe:transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md"
            >
              How to Choose a Phonics Class
            </Link>
          </div>
        </div>
      </Section>

      <Section id="faq" tint="lavender">
        <SectionHeading eyebrow="Parent questions" title="Frequently asked questions" />
        <div className="mt-7 grid gap-3 lg:grid-cols-2 lg:items-start">
          {faqItems.map((item, index) => {
            const tone = premiumTones[index % premiumTones.length];
            return (
              <details
                key={item.question}
                className={`group relative overflow-hidden rounded-2xl border bg-white shadow-[0_6px_20px_rgba(15,23,42,0.04)] motion-safe:transition-all motion-safe:duration-200 hover:-translate-y-0.5 open:translate-y-0 open:shadow-[0_12px_30px_rgba(15,23,42,0.075)] ${tone.card}`}
              >
                <div className={`pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full blur-3xl ${tone.glow}`} aria-hidden="true" />
                <summary className="relative flex min-h-[62px] cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
                  <h3 className="text-base font-bold leading-6 text-slate-900 sm:text-lg">{item.question}</h3>
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xl font-medium leading-none ring-1 motion-safe:transition-transform motion-safe:duration-200 group-open:rotate-45 ${tone.badge}`} aria-hidden="true">
                    +
                  </span>
                </summary>
                <div className="relative border-t border-slate-200/70 bg-white/65 px-5 pb-5 pt-4 backdrop-blur-sm">
                  <p className="text-sm leading-7 text-slate-700 sm:text-base">{item.answer}</p>
                </div>
              </details>
            );
          })}
        </div>
      </Section>

      <section className="scroll-mt-[176px] px-4 py-12 sm:px-5 md:scroll-mt-[184px] md:py-16 lg:px-6">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[34px] border border-slate-800/80 bg-gradient-to-br from-slate-950 via-[#071124] to-indigo-950 p-7 text-center text-white shadow-[0_26px_64px_rgba(15,23,42,0.24)] sm:p-10">
          <div className="pointer-events-none absolute -left-12 -top-12 h-48 w-48 rounded-full bg-orange-500/16 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-16 -right-10 h-56 w-56 rounded-full bg-sky-400/14 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/45 to-transparent" aria-hidden="true" />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to compare Tiny Steps against your child’s actual needs?</h2>
            <p className="mx-auto mt-3 max-w-3xl text-base leading-8 text-slate-300">
              Start with the free 35-minute 1:1 assessment, then use the same comparison criteria on this page to judge fit, teaching approach, evidence, and cost before you enrol.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/book-demo"
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-white px-6 py-3 font-semibold text-slate-950 shadow-[0_10px_24px_rgba(255,255,255,0.10)] motion-safe:transition-all hover:-translate-y-0.5 hover:bg-orange-50 hover:shadow-[0_14px_30px_rgba(255,255,255,0.16)] sm:w-auto"
              >
                Book Free Assessment
              </Link>
              <Link
                to="/phonics"
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-slate-600 bg-white/5 px-6 py-3 font-semibold text-white backdrop-blur motion-safe:transition-all hover:-translate-y-0.5 hover:border-sky-300/60 hover:bg-white/10 sm:w-auto"
              >
                Explore Tiny Steps Phonics
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ClusterSeoNav cluster="phonics" />
    </div>
  );
}
