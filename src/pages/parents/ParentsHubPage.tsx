import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getRouteConfig } from '../../lib/seo';
import parentsMeta from '../../content/parentsMeta';
import AboutAuthor from '../../components/AboutAuthor';
import Meta from '../../components/common/Meta';
import AutoLinkedText from '../../components/seo/AutoLinkedText';
import { createWebPageSchema, organizationSchema, websiteSchema } from '../../lib/schemas';

const heroSignals = [
  'Identify the exact learning concern quickly',
  'Route to the right phonics, reading, grammar, or speaking support',
  'Move from confusion to a clear next step',
];

const quickRoutes = [
  {
    title: 'Child knows letters but cannot read words',
    detail: 'Start with the right reading-gap support page before trying random worksheets.',
    to: '/child-not-reading-properly',
    accent: 'from-[#fff3e0] to-[#f8fbff]',
  },
  {
    title: 'Child reads slowly',
    detail: 'Use the slow-reader support guide to diagnose blending, fluency, and confidence gaps.',
    to: '/slow-reader-child-help',
    accent: 'from-[#eef6ff] to-[#fff8ef]',
  },
  {
    title: 'Child needs reading classes',
    detail: 'Go to the evergreen reading support page for fluency and comprehension progression.',
    to: '/reading-classes-for-kids',
    accent: 'from-[#fff5f2] to-[#fffaf5]',
  },
  {
    title: 'Child makes grammar mistakes',
    detail: 'Use the grammar pathway for sentence accuracy, writing clarity, and application.',
    to: '/grammar',
    accent: 'from-[#f3f8ef] to-[#eef6ff]',
  },
  {
    title: 'Child needs sentence formation or writing support',
    detail: 'Use the writing support page for sentence-building and writing progression.',
    to: '/writing-classes-for-kids',
    accent: 'from-[#eef6ff] to-[#fff8ef]',
  },
  {
    title: 'Child gives short answers or lacks confidence',
    detail: 'Use the shy-child communication guide for confidence and expressive speaking support.',
    to: '/shy-child-speaking-confidence',
    accent: 'from-[#fff5f2] to-[#fffaf5]',
  },
  {
    title: 'Parent unsure which course to choose',
    detail: 'Use the dedicated choosing-course page to match the child’s current gap to the right path.',
    to: '/parents/choosing-course',
    accent: 'from-[#f3f8ef] to-[#eef6ff]',
  },
];

const featuredGuides = [
  {
    label: 'Research guide',
    title: 'Phonics for Parents: a calm, evidence-backed reading guide',
    detail:
      'A premium Tiny Steps article for families who want to understand phonics, build a low-pressure home routine, and support multilingual children with confidence.',
    to: '/blog/phonics-for-parents-guide',
  },
  {
    label: 'Starter plan',
    title: 'Phonics Mission: 7-day daily practice',
    detail: 'A warm daily plan for sound-letter links, blending, and confidence-building at home.',
    to: '/parents/phonics-mission',
  },
  {
    label: 'Routine guide',
    title: 'Reading at Home: science-backed daily routine',
    detail: 'A 10-minute practice structure for decoding, fluency, and comprehension.',
    to: '/parents/reading-at-home',
  },
];

const parentPlaybooks = [
  {
    title: 'Getting started',
    description: 'Best for ages 3-7, first routines, and avoiding common early phonics mistakes.',
    to: '/parents/getting-started',
  },
  {
    title: 'Choosing a course',
    description: 'Use this when you are deciding between phonics, grammar, or speaking support.',
    to: '/parents/choosing-course',
  },
  {
    title: 'Scheduling and attendance',
    description: 'How to choose timings that work for real family life and improve consistency.',
    to: '/parents/scheduling',
  },
  {
    title: 'Payments and plans',
    description: 'Clear guidance on payment options, invoices, and package-related questions.',
    to: '/parents/payments',
  },
  {
    title: 'Tracking progress',
    description: 'What genuine progress looks like, what to ask teachers, and what to watch at home.',
    to: '/parents/tracking-progress',
  },
  {
    title: 'Helping with homework',
    description: 'How to support without nagging, over-correcting, or turning practice into tension.',
    to: '/parents/helping-with-homework',
  },
  {
    title: 'Speaking confidence',
    description: 'Parent moves for shy speakers, hesitant readers, and low-pressure communication growth.',
    to: '/parents/speech-confidence',
  },
  {
    title: 'Common mistakes',
    description: 'Habits that quietly slow progress and what to do instead.',
    to: '/parents/common-mistakes',
  },
];

const routineCards = [
  { step: '2 minutes', title: 'Review', detail: 'Go over yesterday’s sound, word, or speaking target.' },
  { step: '4 minutes', title: 'Core practice', detail: 'Blend and read 3 old words plus 2 new ones.' },
  { step: '2 minutes', title: 'Tiny transfer', detail: 'Read one short sentence or say one short answer aloud.' },
  { step: '2 minutes', title: 'Close well', detail: 'Praise effort and note one tiny target for tomorrow.' },
];

const helpLanes = [
  {
    title: 'If your child is resistant',
    detail: 'Reduce the session before you reduce the routine. A 5-minute win is better than a 20-minute argument.',
  },
  {
    title: 'If your child is older and embarrassed',
    detail: 'Use respectful materials, short practice, and language that feels age-appropriate rather than babyish.',
  },
  {
    title: 'If your home is multilingual',
    detail: 'Use home language to explain, then practise the English sounds or words clearly. Home language is support, not a setback.',
  },
  {
    title: 'If you are unsure what to do next',
    detail: 'Start with the closest parent problem, then move into the linked playbook instead of trying to read everything.',
  },
];
const quickAnswerFaqItems = [
  {
    question: 'Find your child’s current concern quickly',
    answer:
      'Use concern-based routes for reading, grammar, writing, and communication confidence so you start from the real gap.',
  },
  {
    question: 'Choose the right support page',
    answer:
      'Move directly to the right page for phonics, reading, grammar, writing, or communication instead of mixing unrelated activities.',
  },
  {
    question: 'Understand how decisions are made',
    answer:
      'Tiny Steps uses assessment, gap identification, and stage-wise recommendations before suggesting a course path.',
  },
  {
    question: 'Track progress with clarity',
    answer:
      'Parents can review progress indicators and next-step guidance so home support stays practical and consistent.',
  },
];

const parentFaqs = [
  {
    question: 'What can parents do from the Tiny Steps Parents Hub?',
    answer:
      'Parents can identify the child’s main learning concern, open the most relevant support page, and move to a clear next-step plan for classes and home support.',
  },
  {
    question: 'How do I know which course my child needs?',
    answer:
      'Start with the concern-specific route and then use assessment guidance to identify whether the child needs phonics, reading, grammar, writing, communication, or a combined path.',
  },
  {
    question: 'What if my child knows letters but cannot read words?',
    answer:
      'Use the child-not-reading-properly support page first. This usually indicates decoding or blending gaps that need structured phonics and reading guidance.',
  },
  {
    question: 'What if my child reads slowly or avoids reading?',
    answer:
      'Use the slow-reader and reading-classes support pages to check whether the gap is blending, fluency, comprehension, confidence, or a mix.',
  },
  {
    question: 'How does Tiny Steps track a child’s progress?',
    answer:
      'Tiny Steps tracks progress through stage-based learning goals, teacher observations, and practical next-step guidance that parents can follow at home.',
  },
  {
    question: 'Should I book an assessment before choosing a course?',
    answer:
      'Yes. Assessment helps identify the real learning gap first, so parents can choose the right path with more confidence and less trial-and-error.',
  },
];
const combinedFaqItems = [...parentFaqs];

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
    { '@type': 'ListItem', position: 2, name: 'Parents Hub', item: 'https://tinystepslearning.com/parents' },
  ],
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: combinedFaqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};

const founderSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': 'https://tinystepslearning.com/#priya-founder',
  name: 'Priya',
  jobTitle: 'Founder',
  image: 'https://tinystepslearning.com/priya-founder-tiny-steps-learning.webp',
  worksFor: {
    '@type': 'Organization',
    name: 'Tiny Steps Learning',
    url: 'https://tinystepslearning.com/',
  },
};
const parentsSeo = getRouteConfig('/parents');
const metaTitle = parentsSeo?.title ?? 'Parents Hub | Tiny Steps Learning';
const metaDescription =
  parentsSeo?.description ??
  "Resources and guides for parents. Learn how to support your child's English learning journey at home.";
const parentsCanonicalPath = parentsSeo?.canonicalPath ?? '/parents';
const parentsCanonicalUrl = `https://tinystepslearning.com${parentsCanonicalPath}`;
const parentsKeywords =
  'parents phonics help, how to teach phonics at home, reading help for kids at home, english classes for kids parents guide, grammar and speaking support for children';

const ParentsHubPage: React.FC = () => {
  const parentsWebPageSchema = useMemo(
    () =>
      createWebPageSchema({
        name: metaTitle,
        description: metaDescription,
        url: parentsCanonicalUrl,
      }),
    [],
  );

  const pageSchema = useMemo(
    () => ({
      ...(parentsMeta['/parents'].jsonLd as Record<string, unknown>),
      about: {
        '@id': 'https://tinystepslearning.com/#priya-founder',
      },
    }),
    [],
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7efe4_0%,#fcfaf7_18%,#ffffff_48%,#f3f7fc_100%)] text-slate-900">
      <Meta
        title={metaTitle}
        description={metaDescription}
        keywords={parentsKeywords}
        canonical={parentsCanonicalUrl}
        jsonLd={[organizationSchema, websiteSchema, parentsWebPageSchema, pageSchema, breadcrumbSchema, faqSchema, founderSchema]}
      />

      <section className="relative overflow-hidden border-b border-slate-900 bg-slate-950 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800" />
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-amber-300/15 blur-3xl" />
        <div className="absolute right-0 top-10 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-16 sm:pt-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_390px] lg:items-end">
            <div className="max-w-4xl">
              <div className="inline-flex items-center rounded-full border border-white/16 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-100 backdrop-blur">
                Tiny Steps Parents Hub
              </div>
              <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-[4rem] lg:leading-[1.02]">
                Parents Hub: Choose the Right Learning Path for Your Child
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200">
                Use this hub to identify your child’s current learning concern and move directly to the right
                support page across phonics, reading, grammar, writing, communication, and progress tracking.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-100">
                {heroSignals.map((item) => (
                  <span key={item} className="rounded-full border border-white/14 bg-white/10 px-4 py-2 backdrop-blur">
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/book-demo"
                  className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                >
                  Book Free Assessment
                </Link>
                <Link
                  to="/faq"
                  className="inline-flex items-center rounded-full border border-white/18 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Explore Full FAQ
                </Link>
              </div>
            </div>

            <div className="rounded-[2.2rem] border border-white/12 bg-slate-900/72 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.4)] backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">Common parent concerns and next-step pages</p>
              <div className="mt-5 divide-y divide-white/12">
                {quickRoutes.map((route) => (
                  <Link key={route.title} to={route.to} className="group block py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-base font-semibold text-white transition group-hover:text-[#ffd8a8]">{route.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-200">{route.detail}</p>
                      </div>
                      <span className="mt-1 text-lg text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-white">
                        →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-8">
          <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Quick Answer for Parents</h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600 sm:text-base">
            This hub helps parents move from concern to action. Start with your child’s exact blocker, open the
            right support page, and follow a clear path from assessment to recommendation to progress tracking.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {quickAnswerFaqItems.map((item) => (
              <article key={item.question} className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-4">
                <h3 className="text-base font-semibold leading-7 text-slate-900">{item.question}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_340px]">
          <Link
            to={featuredGuides[0].to}
            className="relative overflow-hidden rounded-[2rem] border border-slate-900 bg-slate-950 p-6 text-white shadow-[0_28px_70px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5 hover:shadow-[0_32px_80px_rgba(15,23,42,0.2)] sm:p-8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#102143] to-[#1f3b69]" />
            <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-amber-300/20 blur-3xl" />
            <div className="absolute right-0 top-6 h-48 w-48 rounded-full bg-sky-400/15 blur-3xl" />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-100">{featuredGuides[0].label}</p>
              <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-white">{featuredGuides[0].title}</h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200">{featuredGuides[0].detail}</p>
              <div className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950">
                Read the research guide
              </div>
            </div>
          </Link>

          <div className="space-y-4">
            {featuredGuides.slice(1).map((item) => (
              <Link
                key={item.title}
                to={item.to}
                className="block rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-700">{item.label}</p>
                <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.detail}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">Parent playbooks</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">What parents can do from this hub</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Use these pages to choose the right path, track progress, and support your child with practical
              next steps instead of random activities.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {parentPlaybooks.map((item) => (
                <Link
                  key={item.title}
                  to={item.to}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5 transition hover:border-slate-300 hover:bg-white"
                >
                  <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[1.9rem] border border-slate-200 bg-[linear-gradient(135deg,#fff6e8,#eef6ff)] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">10-minute parent routine</p>
              <div className="mt-4 space-y-3">
                {routineCards.map((item) => (
                  <div key={item.step} className="rounded-[1.25rem] border border-white/80 bg-white/85 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-700">{item.step}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">Still unsure?</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Start with the playbook that matches the strongest pain point. If you still feel uncertain after
                a week, book a free assessment for a level-based recommendation.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to="/book-demo"
                  className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Book Free Assessment
                </Link>
                <Link
                  to="/courses"
                  className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Explore Courses
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">Real family context</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Helpful reminders before you overcomplicate things</h2>
            </div>
            <Link to="/faq" className="text-sm font-semibold text-primary-700">
              Open the full FAQ
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {helpLanes.map((item) => (
              <div key={item.title} className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">Path Selection</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">How Tiny Steps decides the right path</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-[1.2rem] border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Step 1</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">Assessment</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Understand current level, age context, and parent concerns.</p>
            </article>
            <article className="rounded-[1.2rem] border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Step 2</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">Gap Identification</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Pinpoint phonics, reading, grammar, writing, or communication gaps.</p>
            </article>
            <article className="rounded-[1.2rem] border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Step 3</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">Course Recommendation</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Choose the right route instead of trial-and-error planning.</p>
            </article>
            <article className="rounded-[1.2rem] border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Step 4</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">Progress Tracking</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Track outcomes and adjust the next step clearly.</p>
            </article>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <Link to="/parents/choosing-course" className="font-semibold text-primary-700 underline underline-offset-2">Choosing Course Guide</Link>
            <Link to="/parents/tracking-progress" className="font-semibold text-primary-700 underline underline-offset-2">Tracking Progress Guide</Link>
            <Link to="/phonics" className="font-semibold text-primary-700 underline underline-offset-2">Phonics</Link>
            <Link to="/grammar" className="font-semibold text-primary-700 underline underline-offset-2">Grammar</Link>
            <Link to="/speaking" className="font-semibold text-primary-700 underline underline-offset-2">Speaking</Link>
            <Link to="/reading-classes-for-kids" className="font-semibold text-primary-700 underline underline-offset-2">Reading Classes</Link>
            <Link to="/writing-classes-for-kids" className="font-semibold text-primary-700 underline underline-offset-2">Writing Classes</Link>
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#f8fbff,#fff6e8)] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">Parent Progress and Support</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Track progress and choose the next step with confidence</h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
            Use the progress page to review what is improving, what needs more support, and how to keep home
            routines practical and consistent.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/parents/tracking-progress" className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50">
              Open Tracking Progress
            </Link>
            <Link to="/courses" className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50">
              Explore Courses
            </Link>
          </div>
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">Frequently asked questions</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Common parent questions, kept compact</h2>
            <div className="mt-5 space-y-4">
              {parentFaqs.map((item) => (
                <details key={item.question} className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-4">
                  <summary className="cursor-pointer list-none text-base font-semibold leading-7 text-slate-900">
                    {item.question}
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    <AutoLinkedText text={item.answer} />
                  </p>
                </details>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#fff4df,#eef6ff)] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Need more depth?</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Use the full FAQ or jump into the right guide</h2>
            <div className="mt-5 space-y-3">
              <Link
                to="/faq"
                className="block rounded-[1.25rem] border border-white/80 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300"
              >
                Explore the full FAQ page
              </Link>
              <Link
                to="/blog/phonics-for-parents-guide"
                className="block rounded-[1.25rem] border border-white/80 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300"
              >
                Read the phonics research guide
              </Link>
              <Link
                to="/parents/reading-at-home"
                className="block rounded-[1.25rem] border border-white/80 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300"
              >
                Open the reading-at-home playbook
              </Link>
              <Link
                to="/online-english-classes-for-kids-india"
                className="block rounded-[1.25rem] border border-white/80 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300"
              >
                Explore online english classes for kids india
              </Link>
              <Link
                to="/english-foundation-program"
                className="block rounded-[1.25rem] border border-white/80 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300"
              >
                Explore english foundation program
              </Link>
              <Link
                to="/slow-reader-child-help"
                className="block rounded-[1.25rem] border border-white/80 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300"
              >
                Get slow reader child help
              </Link>
              <Link
                to="/shy-child-speaking-confidence"
                className="block rounded-[1.25rem] border border-white/80 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300"
              >
                Support shy child speaking confidence
              </Link>
              <Link
                to="/english-classes-for-5-year-old"
                className="block rounded-[1.25rem] border border-white/80 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300"
              >
                Explore english classes for 5 year old
              </Link>
            </div>
          </div>
        </section>

        <AboutAuthor
          className="mt-12"
          title="About Tiny Steps Parent Guidance"
          intro="The Parents Hub is written to help families move from worry to action with practical, research-informed next steps across phonics, reading, grammar, and speaking."
          note="Tiny Steps parent pages are designed for real homes: short routines, multilingual context, and calm guidance that can actually be used between lessons."
          badges={['Foundations Forever', 'Parents Help Hub', 'Research-informed']}
          highlights={[
            { label: 'Primary purpose', value: 'Route parents quickly to the right next step' },
            { label: 'Audience', value: 'Families of children ages 3-12 across beginner to growing-reader stages' },
            { label: 'Style', value: 'Low-pressure, actionable guidance aligned with live Tiny Steps teaching practice' },
          ]}
        />

        <section className="mt-12 rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#101828,#1b2a46)] px-6 py-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">Recommended Next Step</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Book an assessment before choosing the course path</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
                Use assessment-first guidance to identify the strongest starting point in phonics, reading,
                grammar, writing, or communication confidence.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link
                to="/book-demo"
                className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                Book Free Assessment
              </Link>
              <Link
                to="/curriculum"
                className="inline-flex items-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Explore Curriculum
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ParentsHubPage;
