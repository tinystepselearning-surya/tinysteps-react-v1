import { useEffect } from 'react';
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

function Section({ children, tint = 'white', id }: { children: React.ReactNode; tint?: 'white' | 'blue' | 'warm' | 'lavender'; id?: string }) {
  const backgrounds = {
    white: 'bg-white',
    blue: 'bg-[#F4FAFF]',
    warm: 'bg-[#FFF9F1]',
    lavender: 'bg-[#FBF8FF]',
  };

  return (
    <section id={id} className={`${backgrounds[tint]} px-4 py-10 sm:px-5 md:py-14 lg:px-6`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
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

  return (
    <div className="bg-white pb-14">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#FFF8F2] via-white to-[#F1F8FF] px-4 py-10 sm:px-5 md:py-14 lg:px-8 lg:py-16">
        <div className="pointer-events-none absolute -left-10 top-10 h-44 w-44 rounded-full bg-orange-100 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-sky-100 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-700 shadow-sm">
              Parent comparison & decision guide
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight tracking-[-0.035em] text-slate-950 sm:text-5xl lg:text-[56px]">
              Best Online Phonics Classes for Kids in India
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-700 sm:text-lg">
              Compare phonics programmes by child fit, teaching quality, 1-to-1 vs group format, proof of reading transfer, progress visibility, fees, and total class cost before you choose.
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              This page is the Tiny Steps buyer-comparison guide. For the full Tiny Steps phonics method, levels, and learning pathway, use the{' '}
              <Link to="/phonics" className="font-semibold text-slate-900 underline underline-offset-4">
                main phonics programme page
              </Link>
              .
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/book-demo" className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-slate-950 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-slate-800">
                Book Free 35-Minute Assessment
              </Link>
              <a href="#comparison-framework" className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-50">
                Compare Phonics Options
              </a>
            </div>
          </div>

          <aside className="rounded-[30px] border border-slate-200 bg-white/95 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.10)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tiny Steps quick facts</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-orange-100 bg-orange-50/70 p-4">
                <p className="text-xs font-semibold text-slate-500">Age range</p>
                <p className="mt-1 font-bold text-slate-900">{PUBLIC_SITE_FACTS.audience.label}</p>
              </div>
              <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                <p className="text-xs font-semibold text-slate-500">Main format</p>
                <p className="mt-1 font-bold text-slate-900">Live 1:1 online</p>
              </div>
              <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4">
                <p className="text-xs font-semibold text-slate-500">Session length</p>
                <p className="mt-1 font-bold text-slate-900">{PUBLIC_SITE_FACTS.liveSessions.label}</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                <p className="text-xs font-semibold text-slate-500">Current reference</p>
                <p className="mt-1 font-bold text-slate-900">{formatINR(PER_CLASS_PRICE)} per 1:1 class</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              The free assessment is the first step so the recommended starting point follows the child’s current reading behaviour rather than age alone.
            </p>
          </aside>
        </div>
      </section>

      <Section id="comparison-framework" tint="warm">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Quick answer</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">How should parents choose the best phonics class?</h2>
          <p className="mt-4 text-base leading-8 text-slate-700">
            Compare four things before you compare brands: <strong>child fit, teaching quality, proof of transfer, and practical clarity</strong>. The strongest programme for one child may not be the strongest fit for another, so this page avoids unsupported “#1” claims and gives you criteria you can verify.
          </p>
        </div>
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {decisionGates.map((item) => (
            <article key={item.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-700 sm:text-base">{item.answer}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section tint="blue">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Format comparison</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">1-to-1 vs group phonics classes vs app practice</h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-slate-600">
            Format matters, but teaching quality and child fit matter more than the label alone.
          </p>
        </div>
        <div className="mt-7 overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[820px] w-full border-collapse text-left text-sm sm:text-base">
            <thead>
              <tr>
                <th className="bg-slate-950 px-5 py-4 font-semibold text-white">Format</th>
                <th className="bg-slate-950 px-5 py-4 font-semibold text-white">Can be strong when</th>
                <th className="bg-slate-950 px-5 py-4 font-semibold text-white">What parents should check</th>
              </tr>
            </thead>
            <tbody>
              {comparisonFormats.map((item, index) => (
                <tr key={item.format} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="border-t border-slate-200 px-5 py-4 font-semibold text-slate-900">{item.format}</td>
                  <td className="border-t border-slate-200 px-5 py-4 leading-7 text-slate-700">{item.strongWhen}</td>
                  <td className="border-t border-slate-200 px-5 py-4 leading-7 text-slate-700">{item.parentCheck}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="provider-scorecard">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Parent scorecard</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">12 checks before choosing a phonics programme</h2>
          <p className="mt-3 text-base leading-8 text-slate-700">
            Use these as comparison questions, not as a universal rating system. A provider does not need to use Tiny Steps terminology, but it should be able to answer the underlying questions clearly.
          </p>
        </div>
        <div className="mt-7 grid gap-3 md:grid-cols-2">
          {providerScorecard.map((item, index) => (
            <article key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">{index + 1}</span>
              <p className="text-sm leading-7 text-slate-700 sm:text-base">{item}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section tint="lavender">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Tiny Steps against the criteria</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">What can parents verify before choosing Tiny Steps?</h2>
          <p className="mt-3 text-base leading-8 text-slate-700">
            The useful question is not “Does Tiny Steps call itself the best?” It is “Can I inspect the programme, evidence, pricing, and teaching approach before I decide?”
          </p>
        </div>
        <div className="mt-7 overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[800px] w-full border-collapse text-left text-sm sm:text-base">
            <thead>
              <tr>
                <th className="bg-slate-950 px-5 py-4 font-semibold text-white">Criterion</th>
                <th className="bg-slate-950 px-5 py-4 font-semibold text-white">Tiny Steps evidence</th>
                <th className="bg-slate-950 px-5 py-4 font-semibold text-white">Inspect it</th>
              </tr>
            </thead>
            <tbody>
              {tinyStepsEvidence.map((item, index) => (
                <tr key={item.criterion} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="border-t border-slate-200 px-5 py-4 font-semibold text-slate-900">{item.criterion}</td>
                  <td className="border-t border-slate-200 px-5 py-4 leading-7 text-slate-700">{item.tinySteps}</td>
                  <td className="border-t border-slate-200 px-5 py-4">
                    <Link to={item.href} className="font-semibold text-slate-900 underline underline-offset-4">
                      {item.label}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Programme fit</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Who may benefit most from Tiny Steps phonics?</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {fitCards.map((item) => (
                <article key={item} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm leading-7 text-slate-700">{item}</p>
                </article>
              ))}
            </div>
          </div>
          <aside className="rounded-3xl border border-orange-200 bg-orange-50/60 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">When phonics may not be the main need</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-950">Accurate decoding but slow or weak reading?</h3>
            <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">
              If your child already decodes words accurately but reads very slowly, struggles with expression, or does not understand what they read, the main bottleneck may have moved beyond basic phonics.
            </p>
            <Link to="/reading-classes-for-kids" className="mt-5 inline-flex font-semibold text-slate-900 underline underline-offset-4">
              Compare broader reading support
            </Link>
          </aside>
        </div>
      </Section>

      <Section tint="warm">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Phonics classes fees</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">What does Tiny Steps phonics cost?</h2>
            <p className="mt-4 text-base leading-8 text-slate-700">
              The current standard reference is <strong>{formatINR(PER_CLASS_PRICE)} per 1:1 class</strong>
              {starterPlan ? <> and <strong>{formatINR(starterPlan.monthlyFee)} for {starterPlan.classes} classes</strong></> : null}. Parents should compare total programme clarity—not price alone—because a lower cost is not automatically stronger teaching, and a higher cost is not proof of better teaching.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/pricing" className="inline-flex rounded-full border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-900 hover:bg-slate-50">
                View Current Pricing
              </Link>
              <Link to="/book-demo" className="inline-flex rounded-full bg-slate-950 px-5 py-2.5 font-semibold text-white hover:bg-slate-800">
                Book Free Assessment
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold text-slate-950">When comparing phonics class cost, ask:</h3>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700 sm:text-base">
              <li>• Is the class 1:1, group, or mainly self-practice?</li>
              <li>• Is assessment or placement included?</li>
              <li>• Are materials or home-practice resources included?</li>
              <li>• How often is parent progress shared?</li>
              <li>• What happens if the child needs slower or faster pacing?</li>
              <li>• Are rescheduling, cancellation, and package terms clear?</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section tint="blue">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Use the trial well</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">8 questions to ask during a phonics demo or assessment</h2>
            <ol className="mt-6 space-y-3">
              {demoQuestions.map((item, index) => (
                <li key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-900">{index + 1}</span>
                  <span className="text-sm leading-7 text-slate-700 sm:text-base">{item}</span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Comparison red flags</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">What should make a parent ask more questions?</h2>
            <div className="mt-6 space-y-3">
              {redFlags.map((item) => (
                <article key={item} className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-sm leading-7 text-slate-700 sm:text-base">
                  {item}
                </article>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Go deeper</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Use the full parent comparison framework</h2>
          <p className="mt-3 max-w-4xl text-base leading-8 text-slate-700">
            For a deeper editorial checklist covering placement, teaching sequence, decodable reading, transfer evidence, teacher training, progress reporting, pricing clarity, and red flags, read our complete parent guide.
          </p>
          <Link to="/blog/how-to-choose-phonics-classes" className="mt-5 inline-flex rounded-full bg-slate-950 px-5 py-2.5 font-semibold text-white hover:bg-slate-800">
            How to Choose a Phonics Class
          </Link>
        </div>
      </Section>

      <ContentTrustNote text="This comparison page is created by the Tiny Steps academic team and founder-reviewed to help parents compare phonics options using visible criteria, realistic expectations, and inspectable evidence rather than unsupported ranking claims." />

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

      <TestimonialsSection
        title="Parent feedback to consider alongside the comparison criteria"
        subtitle="Reviews are one evidence source—not a universal guarantee. Use them together with class samples, curriculum, pricing, and the child’s assessment result."
        courseTag="phonics"
        limit={6}
        compact
        viewAllHref="/testimonials"
        viewAllLabel="View all parent reviews"
      />

      <Section id="faq" tint="lavender">
        <h2 className="text-3xl font-bold tracking-tight text-slate-950">Frequently asked questions</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {faqItems.map((item) => (
            <article key={item.question} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">{item.question}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-700 sm:text-base">{item.answer}</p>
            </article>
          ))}
        </div>
      </Section>

      <section className="px-4 py-10 sm:px-5 md:py-14 lg:px-6">
        <div className="mx-auto max-w-6xl rounded-[32px] bg-slate-950 p-7 text-center text-white shadow-2xl sm:p-10">
          <h2 className="text-3xl font-bold">Ready to compare Tiny Steps against your child’s actual needs?</h2>
          <p className="mx-auto mt-3 max-w-3xl text-base leading-8 text-slate-300">
            Start with the free 35-minute 1:1 assessment, then use the same comparison criteria on this page to judge fit, teaching approach, evidence, and cost before you enrol.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/book-demo" className="inline-flex rounded-full bg-white px-6 py-3 font-semibold text-slate-950 hover:bg-slate-100">
              Book Free Assessment
            </Link>
            <Link to="/phonics" className="inline-flex rounded-full border border-slate-600 px-6 py-3 font-semibold text-white hover:bg-slate-900">
              Explore Tiny Steps Phonics
            </Link>
          </div>
        </div>
      </section>

      <ClusterSeoNav cluster="phonics" />
    </div>
  );
}
