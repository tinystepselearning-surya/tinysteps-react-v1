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

type SectionTint = 'white' | 'blue' | 'warm' | 'lavender';

function Section({ children, tint = 'white', id }: { children: ReactNode; tint?: SectionTint; id?: string }) {
  const backgrounds: Record<SectionTint, string> = {
    white: 'bg-white',
    blue: 'bg-[#F4FAFF]',
    warm: 'bg-[#FFF9F1]',
    lavender: 'bg-[#FBF8FF]',
  };

  return (
    <section id={id} className={`${backgrounds[tint]} scroll-mt-32 px-4 py-12 sm:px-5 md:py-16 lg:px-6`}>
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
        rootMargin: '-24% 0px -62% 0px',
        threshold: [0.05, 0.2, 0.45],
      },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-white pb-24 lg:pb-16">
      <section className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-[#FFF7EF] via-white to-[#EDF7FF] px-4 py-10 sm:px-5 md:py-14 lg:px-8 lg:py-[72px]">
        <div className="pointer-events-none absolute -left-16 top-8 h-52 w-52 rounded-full bg-orange-100/80 blur-3xl" />
        <div className="pointer-events-none absolute -right-12 top-0 h-64 w-64 rounded-full bg-sky-100/90 blur-3xl" />
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
                className="inline-flex min-h-[50px] w-full items-center justify-center rounded-full border border-slate-300 bg-white/90 px-6 py-3 font-semibold text-slate-900 motion-safe:transition-all motion-safe:duration-300 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-white sm:w-auto"
              >
                Compare Phonics Options
              </a>
            </div>
          </div>

          <aside className="rounded-[30px] border border-white/80 bg-white/90 p-5 shadow-[0_22px_60px_rgba(15,23,42,0.11)] backdrop-blur sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tiny Steps quick facts</p>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,0.12)]" aria-hidden="true" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-orange-100 bg-orange-50/70 p-4">
                <p className="text-xs font-semibold text-slate-500">Age range</p>
                <p className="mt-1 font-bold leading-6 text-slate-900">{PUBLIC_SITE_FACTS.audience.label}</p>
              </div>
              <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                <p className="text-xs font-semibold text-slate-500">Main format</p>
                <p className="mt-1 font-bold leading-6 text-slate-900">Live 1:1 online</p>
              </div>
              <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4">
                <p className="text-xs font-semibold text-slate-500">Session length</p>
                <p className="mt-1 font-bold leading-6 text-slate-900">{PUBLIC_SITE_FACTS.liveSessions.label}</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                <p className="text-xs font-semibold text-slate-500">Current reference</p>
                <p className="mt-1 font-bold leading-6 text-slate-900">{formatINR(PER_CLASS_PRICE)} per 1:1 class</p>
              </div>
            </div>
            <p className="mt-5 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600">
              The free assessment is the first step so the recommended starting point follows the child’s current reading behaviour rather than age alone.
            </p>
          </aside>
        </div>
      </section>

      <div className="sticky top-[72px] z-30 border-y border-slate-200/80 bg-white/95 shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur lg:top-[78px]">
        <nav
          aria-label="On this page"
          className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-2.5 [scrollbar-width:none] sm:px-5 lg:px-6 [&::-webkit-scrollbar]:hidden"
        >
          {pageNavItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={isActive ? 'location' : undefined}
                className={`inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-full px-4 text-sm font-semibold motion-safe:transition-all motion-safe:duration-200 ${
                  isActive
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950'
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
          {decisionGates.map((item, index) => (
            <article
              key={item.title}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] motion-safe:transition-all motion-safe:duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_14px_32px_rgba(15,23,42,0.09)]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
                {index + 1}
              </span>
              <h3 className="mt-4 text-lg font-bold text-slate-900">{item.title.replace(/^\d+\.\s*/, '')}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-700">{item.answer}</p>
              <div className="absolute inset-x-5 bottom-0 h-0.5 origin-left scale-x-0 bg-orange-400 motion-safe:transition-transform motion-safe:duration-300 group-hover:scale-x-100" aria-hidden="true" />
            </article>
          ))}
        </div>
      </Section>

      <Section id="programme-fit">
        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
          <div>
            <SectionHeading eyebrow="Programme fit" title="Who may benefit most from Tiny Steps phonics?" />
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {fitCards.map((item, index) => (
                <article
                  key={item}
                  className="flex min-h-[92px] gap-3 rounded-2xl border border-slate-200 bg-white p-4 motion-safe:transition-all motion-safe:duration-300 hover:border-slate-300 hover:shadow-md"
                >
                  <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-50 text-xs font-bold text-orange-700">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-7 text-slate-700">{item}</p>
                </article>
              ))}
            </div>
          </div>

          <aside className="relative overflow-hidden rounded-[30px] border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50/70 p-6 sm:p-7">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-orange-100/70 blur-3xl" aria-hidden="true" />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">When phonics may not be the main need</p>
              <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Accurate decoding but slow or weak reading?</h3>
              <p className="mt-4 text-sm leading-7 text-slate-700 sm:text-base">
                If your child already decodes words accurately but reads very slowly, struggles with expression, or does not understand what they read, the main bottleneck may have moved beyond basic phonics.
              </p>
              <Link
                to="/reading-classes-for-kids"
                className="mt-6 inline-flex min-h-[44px] items-center rounded-full border border-orange-200 bg-white px-5 py-2.5 font-semibold text-slate-900 motion-safe:transition-all motion-safe:duration-200 hover:border-orange-300 hover:bg-orange-50"
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
          {comparisonFormats.map((item, index) => (
            <article
              key={item.format}
              className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] motion-safe:transition-all motion-safe:duration-300 hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(15,23,42,0.09)] sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-xl font-bold tracking-tight text-slate-950">{item.format}</h3>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-900">
                  {index + 1}
                </span>
              </div>
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Can be strong when</p>
                <p className="mt-2 text-sm leading-7 text-slate-700">{item.strongWhen}</p>
              </div>
              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">What parents should check</p>
                <p className="mt-2 text-sm leading-7 text-slate-700">{item.parentCheck}</p>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section id="provider-scorecard">
        <SectionHeading eyebrow="Parent scorecard" title="12 checks before choosing a phonics programme">
          <p>
            Use these as comparison questions, not as a universal rating system. A provider does not need to use Tiny Steps terminology, but it should be able to answer the underlying questions clearly.
          </p>
        </SectionHeading>

        <div className="mt-8 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)]">
          <div className="grid md:grid-cols-2">
            {providerScorecard.map((item, index) => (
              <article
                key={item}
                className={`flex gap-4 border-slate-100 p-4 sm:p-5 ${
                  index > 0 ? 'border-t' : ''
                } ${index === 1 ? 'md:border-t-0' : ''} ${index % 2 === 1 ? 'md:border-l' : ''}`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <p className="text-sm leading-7 text-slate-700 sm:text-base">{item}</p>
              </article>
            ))}
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
          {tinyStepsEvidence.map((item, index) => (
            <article
              key={item.criterion}
              className="flex h-full flex-col rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] motion-safe:transition-all motion-safe:duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-lg font-bold text-slate-950">{item.criterion}</h3>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 text-xs font-bold text-violet-700">
                  {index + 1}
                </span>
              </div>
              <p className="mt-3 flex-1 text-sm leading-7 text-slate-700">{item.tinySteps}</p>
              <Link
                to={item.href}
                className="mt-5 inline-flex min-h-[42px] items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-900 motion-safe:transition-colors hover:border-slate-300 hover:bg-white"
              >
                {item.label}
              </Link>
            </article>
          ))}
        </div>
      </Section>

      <div className="bg-white py-2">
        <ContentTrustNote text="This comparison page is created by the Tiny Steps academic team and founder-reviewed to help parents compare phonics options using visible criteria, realistic expectations, and inspectable evidence rather than unsupported ranking claims." />
      </div>

      <AboutAuthor
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

      <div id="parent-reviews" className="scroll-mt-32">
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
                className="inline-flex min-h-[46px] w-full items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-900 motion-safe:transition-all hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 sm:w-auto"
              >
                View Current Pricing
              </Link>
              <Link
                to="/book-demo"
                className="inline-flex min-h-[46px] w-full items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 font-semibold text-white shadow-sm motion-safe:transition-all hover:-translate-y-0.5 hover:bg-slate-800 sm:w-auto"
              >
                Book Free Assessment
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_32px_rgba(15,23,42,0.06)] sm:p-6">
            <h3 className="text-xl font-bold text-slate-950">When comparing phonics class cost, ask:</h3>
            <ul className="mt-5 grid gap-3 text-sm leading-7 text-slate-700 sm:grid-cols-2 sm:text-base">
              <li className="rounded-2xl bg-slate-50 p-3.5">• Is the class 1:1, group, or mainly self-practice?</li>
              <li className="rounded-2xl bg-slate-50 p-3.5">• Is assessment or placement included?</li>
              <li className="rounded-2xl bg-slate-50 p-3.5">• Are materials or home-practice resources included?</li>
              <li className="rounded-2xl bg-slate-50 p-3.5">• How often is parent progress shared?</li>
              <li className="rounded-2xl bg-slate-50 p-3.5">• What happens if the child needs slower or faster pacing?</li>
              <li className="rounded-2xl bg-slate-50 p-3.5">• Are rescheduling, cancellation, and package terms clear?</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section tint="blue">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Use the trial well" title="8 questions to ask during a phonics demo or assessment" />
            <ol className="mt-7 overflow-hidden rounded-[26px] border border-slate-200 bg-white">
              {demoQuestions.map((item, index) => (
                <li key={item} className={`flex gap-3 p-4 sm:p-5 ${index > 0 ? 'border-t border-slate-100' : ''}`}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-900">
                    {index + 1}
                  </span>
                  <span className="text-sm leading-7 text-slate-700 sm:text-base">{item}</span>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <SectionHeading eyebrow="Comparison red flags" title="What should make a parent ask more questions?" />
            <div className="mt-7 space-y-3">
              {redFlags.map((item, index) => (
                <article
                  key={item}
                  className="flex gap-3 rounded-2xl border border-rose-200/80 bg-rose-50/55 p-4 text-sm leading-7 text-slate-700 sm:text-base"
                >
                  <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-rose-200 bg-white text-xs font-bold text-rose-700">
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
        <div className="rounded-[30px] border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Go deeper</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Use the full parent comparison framework</h2>
          <p className="mt-3 max-w-4xl text-base leading-8 text-slate-700">
            For a deeper editorial checklist covering placement, teaching sequence, decodable reading, transfer evidence, teacher training, progress reporting, pricing clarity, and red flags, read our complete parent guide.
          </p>
          <Link
            to="/blog/how-to-choose-phonics-classes"
            className="mt-5 inline-flex min-h-[46px] items-center rounded-full bg-slate-950 px-5 py-2.5 font-semibold text-white motion-safe:transition-all hover:-translate-y-0.5 hover:bg-slate-800"
          >
            How to Choose a Phonics Class
          </Link>
        </div>
      </Section>

      <Section id="faq" tint="lavender">
        <SectionHeading eyebrow="Parent questions" title="Frequently asked questions" />
        <div className="mt-7 grid gap-3 lg:grid-cols-2 lg:items-start">
          {faqItems.map((item, index) => (
            <details
              key={item.question}
              open={index === 0}
              className="group rounded-2xl border border-slate-200 bg-white shadow-[0_6px_20px_rgba(15,23,42,0.04)] open:border-slate-300 open:shadow-[0_10px_28px_rgba(15,23,42,0.07)]"
            >
              <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
                <h3 className="text-base font-bold leading-6 text-slate-900 sm:text-lg">{item.question}</h3>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl font-medium leading-none text-slate-700 motion-safe:transition-transform motion-safe:duration-200 group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <div className="border-t border-slate-100 px-5 pb-5 pt-4">
                <p className="text-sm leading-7 text-slate-700 sm:text-base">{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </Section>

      <section className="scroll-mt-32 px-4 py-12 sm:px-5 md:py-16 lg:px-6">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-slate-950 p-7 text-center text-white shadow-[0_24px_60px_rgba(15,23,42,0.20)] sm:p-10">
          <div className="pointer-events-none absolute -left-12 -top-12 h-44 w-44 rounded-full bg-orange-500/10 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-16 -right-10 h-52 w-52 rounded-full bg-sky-400/10 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to compare Tiny Steps against your child’s actual needs?</h2>
            <p className="mx-auto mt-3 max-w-3xl text-base leading-8 text-slate-300">
              Start with the free 35-minute 1:1 assessment, then use the same comparison criteria on this page to judge fit, teaching approach, evidence, and cost before you enrol.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/book-demo"
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-white px-6 py-3 font-semibold text-slate-950 motion-safe:transition-all hover:-translate-y-0.5 hover:bg-slate-100 sm:w-auto"
              >
                Book Free Assessment
              </Link>
              <Link
                to="/phonics"
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-slate-600 px-6 py-3 font-semibold text-white motion-safe:transition-all hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-900 sm:w-auto"
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
