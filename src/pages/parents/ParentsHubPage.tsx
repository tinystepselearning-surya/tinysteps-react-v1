import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import parentsMeta from '../../content/parentsMeta';
import AboutAuthor from '../../components/AboutAuthor';
import Meta from '../../components/common/Meta';

const heroSignals = [
  'Practical guides for ages 3-12',
  'Phonics, grammar, speaking, and home routines',
  'Built for busy and multilingual families',
];

const quickRoutes = [
  {
    title: 'My child is just starting phonics',
    detail: 'Start with the first steps, daily sound practice, and a calm beginner routine.',
    to: '/parents/getting-started',
    accent: 'from-[#fff3e0] to-[#f8fbff]',
  },
  {
    title: 'My child knows some sounds but reading is inconsistent',
    detail: 'Use the phonics mission and reading-at-home routine to tighten decoding and fluency.',
    to: '/parents/phonics-mission',
    accent: 'from-[#eef6ff] to-[#fff8ef]',
  },
  {
    title: 'Homework is turning into stress',
    detail: 'Use parent scripts, time limits, and lower-pressure support instead of over-correcting.',
    to: '/parents/helping-with-homework',
    accent: 'from-[#fff5f2] to-[#fffaf5]',
  },
  {
    title: 'I want to know if progress is actually happening',
    detail: 'Review milestones, what to expect by age, and how to notice meaningful changes at home.',
    to: '/parents/tracking-progress',
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

const parentFaqs = [
  {
    question: 'Where should I start if my child is 3-6 and still learning early sounds?',
    answer:
      'Start with Getting Started and Phonics Mission. Those two pages give the clearest first-week path for sound-letter links, blending, and low-pressure home routines.',
  },
  {
    question: 'What if my child is older but still struggles to read fluently?',
    answer:
      'Use Reading at Home, Tracking Progress, and the Phonics for Parents research guide. Older children often still need structured decoding support, just presented with more maturity.',
  },
  {
    question: 'How much daily practice is realistic for most families?',
    answer:
      'For many homes, 10 calm minutes is enough. The goal is repetition and confidence, not long study sessions that increase resistance.',
  },
  {
    question: 'Can I use these guides even if we speak another language at home?',
    answer:
      'Yes. Tiny Steps content is written with multilingual families in mind. Home language can support understanding while English reading practice builds decoding and fluency.',
  },
  {
    question: 'Should I read every parent page before taking action?',
    answer:
      'No. This hub is designed for routing. Pick the playbook that best matches your current problem, use it for a week, then come back only if you need a deeper next step.',
  },
  {
    question: 'Where do I go for a more complete question bank?',
    answer:
      'Use the full FAQ page if you want answers on classes, pricing, phonics, grammar, speaking confidence, scheduling, and parent support questions in one place.',
  },
];

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
  mainEntity: parentFaqs.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};

const ParentsHubPage: React.FC = () => {
  const metaTitle = 'Parents Help Hub | Phonics, Reading, Grammar & Speaking Support for Families';
  const metaDescription =
    'Premium parent help hub for phonics, reading routines, grammar, speaking confidence, progress tracking, homework support, and class decisions for ages 3-12.';

  useEffect(() => {
    applySeo({
      ...parentsMeta['/parents'],
      title: metaTitle,
      description: metaDescription,
      keywords: [
        'parents phonics help',
        'how to teach phonics at home',
        'reading help for kids at home',
        'english classes for kids parents guide',
        'grammar and speaking support for children',
      ],
      jsonLd: [parentsMeta['/parents'].jsonLd as object, breadcrumbSchema, faqSchema],
    });
  }, []);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7efe4_0%,#fcfaf7_18%,#ffffff_48%,#f3f7fc_100%)] text-slate-900">
      <Meta
        title={metaTitle}
        description={metaDescription}
        canonical="https://tinystepslearning.com/parents"
        jsonLd={[parentsMeta['/parents'].jsonLd as object, breadcrumbSchema, faqSchema]}
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
                A premium parent help desk for phonics, reading, grammar, and speaking growth
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200">
                Use this hub when you need the next right move for your child, not a long random scroll.
                Every page is written to help parents choose a routine, fix a blocker, and support progress
                at home with clarity.
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
                  to="/?book=1"
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
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">Start with your child’s current blocker</p>
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
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_340px]">
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
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Use the hub like a decision library, not a content dump</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Choose the page that matches the problem you are dealing with now, use that one deeply for a few
              days, and only then move to the next layer. This keeps support practical and stops parent overload.
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
                  to="/?book=1"
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
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
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
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">Need a structured next step?</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Turn parent questions into a plan you can use this week</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
                Book a free assessment for a level-based recommendation, or browse courses and curriculum if you
                want a clearer view of where your child fits right now.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link
                to="/?book=1"
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
