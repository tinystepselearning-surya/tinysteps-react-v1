// @ts-nocheck
import type { FC } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Meta from '../components/common/Meta';
import IBAlignmentSection from '../components/curriculum/IBAlignmentSection';
import { createFAQPageSchema, createWebPageSchema, PUBLIC_FACTS } from '../lib/schemas';
import { SEMANTIC_FACTS } from '../config/semanticFacts';
import { getRouteConfig } from '../lib/seo';

type Tab = 'phonics' | 'reading' | 'grammar' | 'speaking';

type RoadmapCourse = {
  name: string;
  path: string;
  badge: string;
  bestFor: string;
  focus: string;
};

type RoadmapProgram = {
  key: Tab;
  label: string;
  shortLabel: string;
  programPath: string;
  summary: string;
  sequence: string;
  steps: string[];
  courses: RoadmapCourse[];
};

type TeachingMethodStep = {
  title: string;
  description: string;
};

const curriculumSeo = getRouteConfig('/curriculum');
const curriculumSeoTitle = curriculumSeo?.title ?? 'English Curriculum for Kids Ages 3–12 | Tiny Steps Learning';
const curriculumSeoDescription =
  curriculumSeo?.description ??
  'Explore the Tiny Steps English curriculum for kids ages 3–12 across phonics, reading, grammar, sentence building, speaking, and communication with assessment-led placement.';
const curriculumCanonicalPath = curriculumSeo?.canonicalPath ?? '/curriculum';
const curriculumCanonicalUrl = PUBLIC_FACTS.primaryWebsite + curriculumCanonicalPath;
const speakingFacts = SEMANTIC_FACTS.programmes.speaking;

const curriculumFaqItems = [
  {
    question: 'What age is the Tiny Steps curriculum designed for?',
    answer:
      'The Tiny Steps curriculum is designed as a structured English pathway for children ages 3–12. Placement depends on current skill and readiness, not age alone.',
  },
  {
    question: 'How do you decide where my child starts?',
    answer:
      'We use a free 35-minute 1:1 online demo assessment class to identify the child’s current reading, grammar, sentence-formation, and speaking needs before recommending a starting level.',
  },
  {
    question: 'Does every child start with phonics?',
    answer:
      'No. A child who already decodes words accurately may need reading fluency, comprehension, grammar, sentence formation, or speaking support instead. The assessment is used to identify the most useful entry point.',
  },
  {
    question: 'What is the difference between curriculum and teaching methodology?',
    answer:
      'The curriculum explains what children learn, the prerequisites, and the order in which skills become more complex. Teaching methodology explains how teachers model the skill, guide practice, correct errors, adjust support, and help the child apply the skill more independently.',
  },
  {
    question: 'How does Tiny Steps turn the curriculum into a live lesson?',
    answer:
      'Teachers begin from the child’s assessed starting point, secure prerequisites when needed, model the target skill, guide practice and retries, give specific correction, then reduce support as the child becomes more accurate and independent.',
  },
  {
    question: 'How is the roadmap taught in a live class?',
    answer:
      'Teachers follow the shared learning objective and progression, then adapt modelling, prompts, examples, repetition, practice time, and pace to the child’s current response.',
  },
  {
    question: 'Where can I see the exact lesson sequence?',
    answer:
      'Use the detailed course pages for the exact lesson-by-lesson sequence. This curriculum page stays focused on the full roadmap, progression logic, and how the programs connect.',
  },
  {
    question: 'How long is each live class?',
    answer:
      'Each live online class runs for ' + PUBLIC_FACTS.sessionDuration + ', with guided teaching, practice, and teacher feedback.',
  },
  {
    question: 'Do you support children from CBSE, ICSE, IB, Cambridge, and other schools?',
    answer:
      'Yes. Tiny Steps teaches transferable English skills that can support children studying in different school environments. Tiny Steps Learning is an independent learning provider and does not imply formal affiliation with those school systems.',
  },
  {
    question: 'How do parents track progress?',
    answer:
      'Parents receive progress updates showing what has been practised, what is becoming secure, what still needs reinforcement, and the next learning focus.',
  },
];

const teachingMethodSteps: TeachingMethodStep[] = [
  {
    title: 'Assess the starting point',
    description:
      'Identify what the child can already do, where accuracy breaks down, and which prerequisite or pathway needs attention first.',
  },
  {
    title: 'Secure prerequisites',
    description:
      'Revisit an earlier sound, pattern, sentence skill, or speaking behaviour when the next target depends on a foundation that is not yet secure.',
  },
  {
    title: 'Model the target skill',
    description:
      'Make the thinking and response visible through clear examples before asking the child to complete the new skill independently.',
  },
  {
    title: 'Practise, correct, and retry',
    description:
      'Use guided practice, specific feedback, and another attempt so errors become useful teaching information rather than something to skip past.',
  },
  {
    title: 'Apply and reduce support',
    description:
      'Move the skill into reading, spelling, sentences, speaking, or connected tasks and gradually reduce prompts as accuracy and independence become more secure.',
  },
];

const programs: Record<Tab, RoadmapProgram> = {
  phonics: {
    key: 'phonics',
    label: 'Phonics',
    shortLabel: 'Phonics',
    programPath: '/phonics',
    summary:
      'Build sound–spelling knowledge, blending, decoding, and spelling-pattern awareness so unfamiliar words can be read more accurately.',
    sequence: 'Hear → identify → connect sound to grapheme → blend → decode → apply in connected reading',
    steps: [
      'Hear and identify the target sound accurately.',
      'Connect the sound to the written grapheme.',
      'Blend sounds into words instead of guessing.',
      'Decode unfamiliar words with progressively less prompting.',
      'Apply taught decoding in sentences and connected reading.',
    ],
    courses: [
      {
        name: 'Phonics Foundations',
        path: '/courses/phonics-foundation',
        badge: '31 lessons',
        bestFor: 'Children beginning letter sounds, short vowels, early blending, and first CVC words.',
        focus: 'Build the sound-to-word foundation before more complex spelling patterns.',
      },
      {
        name: 'Early Phonics',
        path: '/courses/phonics-brush-up',
        badge: '40 lessons',
        bestFor: 'Children who know basic sounds but need stronger digraph, vowel-team, and decoding habits.',
        focus: 'Move from basic sound recall into patterned word reading and stronger fluency.',
      },
      {
        name: 'Advanced Phonics',
        path: '/courses/phonics-advanced',
        badge: '30 lessons',
        bestFor: 'Children ready for advanced vowel patterns, longer words, spelling rules, and smoother reading.',
        focus: 'Strengthen complex decoding and connected-reading accuracy.',
      },
    ],
  },
  reading: {
    key: 'reading',
    label: 'Reading',
    shortLabel: 'Reading',
    programPath: '/reading-classes-for-kids',
    summary:
      'Develop connected-text accuracy, phrasing, fluency, vocabulary, comprehension, retelling, and reading confidence after decoding is reasonably secure.',
    sequence: 'Read accurately → phrase smoothly → build fluency → understand vocabulary → explain meaning → read with confidence',
    steps: [
      'Read appropriately matched connected text accurately.',
      'Use phrasing and punctuation to make sentences easier to follow.',
      'Develop smoother pace and stamina without turning reading into a speed race.',
      'Build useful vocabulary from the text being read.',
      'Explain, retell, and respond to meaning with increasing independence.',
    ],
    courses: [
      {
        name: 'Reading Classes for Kids',
        path: '/reading-classes-for-kids',
        badge: 'Core reading support',
        bestFor: 'Children whose decoding is reasonably secure but who need broader support across connected reading, fluency, vocabulary, or comprehension.',
        focus: 'Build accurate connected reading, phrasing, vocabulary, comprehension, retelling, and reading confidence.',
      },
      {
        name: 'Reading Fluency Programme',
        path: '/reading-fluency-program',
        badge: 'Specialist fluency support',
        bestFor: 'Children who read words accurately but connected reading remains slow, hesitant, or choppy.',
        focus: 'Improve smoother pace, phrasing, expression, and stamina while continuing to check meaning.',
      },
    ],
  },
  grammar: {
    key: 'grammar',
    label: 'Grammar & Sentence Building',
    shortLabel: 'Grammar',
    programPath: '/grammar',
    summary:
      'Help children move from knowing grammar terms to building accurate sentences and applying language rules in meaningful speaking and writing.',
    sequence: 'Notice the pattern → build a complete sentence → apply in context → correct errors → expand',
    steps: [
      'Notice the word or sentence pattern being taught.',
      'Build a complete sentence using the pattern.',
      'Apply the grammar rule in a meaningful context.',
      'Find and correct errors with teacher guidance.',
      'Expand accurate sentences into longer written or spoken responses.',
    ],
    courses: [
      {
        name: 'Beginner Grammar',
        path: '/courses/grammar',
        badge: '36 lessons',
        bestFor: 'Children who read but need stronger grammar basics, punctuation, and sentence formation.',
        focus: 'Build usable sentence control before advanced grammar and writing tasks.',
      },
      {
        name: 'Advanced Grammar',
        path: '/courses/grammar-mastery',
        badge: '36 lessons',
        bestFor: 'Children who know grammar basics but need stronger tense control, editing, and paragraph-level writing.',
        focus: 'Apply grammar more consistently in complex sentences, editing, and connected writing.',
      },
    ],
  },
  speaking: {
    key: 'speaking',
    label: 'Speaking & Communication',
    shortLabel: 'Speaking',
    programPath: '/speaking',
    summary:
      'Build organised ideas, storytelling, presentation structure, clear expression, audience awareness, and stronger delivery through guided speaking practice.',
    sequence: 'Understand the prompt → choose and organise an idea → add useful detail → shape for the audience → deliver, retry, and reflect',
    steps: [
      'Understand the speaking task and choose a relevant idea.',
      'Organise the response so the listener can follow it.',
      'Add useful detail, sequence, reason, example, or story structure.',
      'Shape the response for the task, presentation, or audience.',
      'Deliver, receive feedback, retry, and reduce support over time.',
    ],
    courses: [
      {
        name: 'Public Speaking Foundations',
        path: speakingFacts.levels.beginner.canonicalCoursePath,
        badge: speakingFacts.levels.beginner.lessonCount + ' lessons',
        bestFor:
          speakingFacts.levels.beginner.ageRange.label +
          '; children who can communicate basic ideas but need more organisation, picture talk, show-and-tell, storytelling foundations, and short presentation structure.',
        focus: 'Build organised short responses, clear expression, storytelling foundations, and readiness for guided presentations.',
      },
      {
        name: 'Public Speaking Excellence',
        path: speakingFacts.levels.advanced.canonicalCoursePath,
        badge: speakingFacts.levels.advanced.lessonCount + ' lessons',
        bestFor:
          speakingFacts.levels.advanced.ageRange.label +
          '; children ready for longer talks, richer storytelling, presentations, impromptu speaking, opinion sharing, and guided debate.',
        focus: 'Strengthen speech organisation, audience awareness, reasoning, expression, delivery, and independent presentation skills.',
      },
    ],
  },
};

const pathwaySignals: Array<{ tab: Tab; signal: string; helper: string }> = [
  {
    tab: 'phonics',
    signal: 'Knows letters or sounds but cannot reliably blend unfamiliar words.',
    helper: 'Check sound–spelling knowledge, blending, and decoding.',
  },
  {
    tab: 'reading',
    signal: 'Reads words, but connected reading is slow, choppy, or hard to understand.',
    helper: 'Check fluency, phrasing, vocabulary, and comprehension.',
  },
  {
    tab: 'grammar',
    signal: 'Can read, but sentences are incomplete, inaccurate, or difficult to expand.',
    helper: 'Check sentence formation, grammar control, and correction.',
  },
  {
    tab: 'speaking',
    signal: 'Has ideas, but answers are short, disorganised, or difficult to present clearly.',
    helper: 'Check idea organisation, detail, storytelling, and delivery.',
  },
];

const placementSteps = [
  {
    title: 'Understand',
    description: 'Start with what the parent and child are currently noticing.',
  },
  {
    title: 'Assess',
    description: 'Check the skills most relevant to the current difficulty.',
  },
  {
    title: 'Identify',
    description: 'Find the main gap and any prerequisite that is not yet secure.',
  },
  {
    title: 'Place',
    description: 'Choose the pathway and level that match the assessed starting point.',
  },
  {
    title: 'Progress',
    description: 'Move forward as accuracy, independence, and transfer become more secure.',
  },
];

const safeTab = (value: string | null): Tab =>
  value === 'reading' || value === 'grammar' || value === 'speaking' || value === 'phonics'
    ? value
    : 'phonics';

const inferTabFromCourse = (course: string | null): Tab => {
  const normalized = String(course || '').toLowerCase();
  if (normalized.includes('reading')) return 'reading';
  if (normalized.includes('grammar')) return 'grammar';
  if (normalized.includes('speaking')) return 'speaking';
  return 'phonics';
};

const CurriculumPage: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedCourse = searchParams.get('course');
  const requestedTab = searchParams.get('tab');
  const tab = requestedCourse ? inferTabFromCourse(requestedCourse) : safeTab(requestedTab);
  const selectedProgram = programs[tab];
  const hasExplicitPath = Boolean(requestedCourse || requestedTab);

  const setTab = (next: Tab) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', next);
    nextParams.delete('course');
    setSearchParams(nextParams, { replace: true });
  };

  const focusPath = (next: Tab) => {
    setTab(next);
    window.requestAnimationFrame(() => {
      document.getElementById('course-levels')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: PUBLIC_FACTS.primaryWebsite + '/' },
      { '@type': 'ListItem', position: 2, name: 'Curriculum', item: curriculumCanonicalUrl },
    ],
  };

  const webpageSchema = createWebPageSchema({
    name: 'English Curriculum for Kids Ages 3–12',
    description:
      'The complete Tiny Steps learning roadmap across phonics, reading, grammar and sentence building, and speaking and communication, with assessment-led progression and child-responsive live teaching.',
    url: curriculumCanonicalUrl,
  });

  const roadmapSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': curriculumCanonicalUrl + '#program-roadmap',
    name: 'Tiny Steps English learning pathways',
    itemListOrder: 'https://schema.org/ItemListUnordered',
    itemListElement: Object.values(programs).map((program, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: program.label,
      url: PUBLIC_FACTS.primaryWebsite + program.programPath,
    })),
  };

  const teachingMethodSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': curriculumCanonicalUrl + '#teaching-method',
    name: 'Tiny Steps curriculum-to-classroom teaching method',
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement: teachingMethodSteps.map((step, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: step.title,
      description: step.description,
    })),
  };

  const faqSchema = {
    ...createFAQPageSchema(curriculumFaqItems),
    '@id': curriculumCanonicalUrl + '#faq',
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-[#fbfaf7] pb-24 text-slate-950">
      <Meta
        title={curriculumSeoTitle}
        description={curriculumSeoDescription}
        canonical={curriculumCanonicalUrl}
        jsonLd={[breadcrumbSchema, webpageSchema, roadmapSchema, teachingMethodSchema, faqSchema]}
      />

      <section className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-8 lg:pb-14 lg:pt-12">
        <div className="grid items-center gap-9 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-orange-700">
              <span className="h-2 w-2 rounded-full bg-orange-500" aria-hidden="true" />
              Ages 3–12 · Assessment-led placement
            </div>
            <p className="mt-5 text-sm font-semibold text-slate-500">The complete Tiny Steps learning roadmap</p>
            <h1 className="mt-2 max-w-4xl font-heading text-[2.7rem] font-black leading-[0.98] tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-[4.2rem]">
              English Curriculum for Kids Ages 3–12
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 md:text-lg md:leading-8">
              A structured learning roadmap across Phonics, Reading, Grammar &amp; Sentence Building, and
              Speaking &amp; Communication — with placement based on your child&apos;s current skills, not age
              alone.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#find-your-path"
                className="inline-flex min-h-[46px] items-center justify-center rounded-full bg-slate-950 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
              >
                Explore the learning paths
              </a>
              <Link
                to="/book-demo"
                className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-bold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
              >
                Book Free 35-Minute Assessment
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-200 pt-5 text-xs font-semibold text-slate-600 sm:text-sm">
              <span>Live teacher-guided learning</span>
              <span>Assessment-led starting point</span>
              <span>{PUBLIC_FACTS.sessionDuration} 1:1 classes</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[30px] bg-slate-950 p-5 text-white shadow-[0_26px_70px_rgba(15,23,42,0.22)] sm:p-6">
            <div className="absolute -right-16 -top-20 h-44 w-44 rounded-full bg-orange-500/20 blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-sky-400/15 blur-3xl" aria-hidden="true" />

            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Learning map</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight">
                    {hasExplicitPath ? 'Viewing ' + selectedProgram.label : 'Four connected learning pathways'}
                  </h2>
                </div>
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                  Start from current skill
                </span>
              </div>

              <div className="mt-6 space-y-2">
                {(Object.keys(programs) as Tab[]).map((key, index) => {
                  const program = programs[key];
                  const active = hasExplicitPath && tab === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => focusPath(key)}
                      aria-current={active ? 'step' : undefined}
                      className={
                        'group flex w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ' +
                        (active
                          ? 'border-orange-300/70 bg-white text-slate-950'
                          : 'border-white/10 bg-white/[0.045] text-white hover:border-white/25 hover:bg-white/[0.075]')
                      }
                    >
                      <span
                        className={
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ' +
                          (active ? 'bg-orange-100 text-orange-800' : 'bg-white/10 text-slate-300')
                        }
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold">{program.label}</span>
                        <span className={'mt-0.5 block text-xs leading-5 ' + (active ? 'text-slate-600' : 'text-slate-400')}>
                          {program.summary}
                        </span>
                      </span>
                      <span className={'text-lg transition group-hover:translate-x-0.5 ' + (active ? 'text-orange-600' : 'text-slate-400')} aria-hidden="true">
                        →
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-slate-400">
                These are not rigid age stages. Assessment identifies the strongest current learning gap and the
                most useful starting point.
              </p>
            </div>
          </div>
        </div>
      </section>

      <nav
        aria-label="Curriculum sections"
        className="sticky top-[72px] z-30 hidden border-y border-slate-200/80 bg-[#fbfaf7]/95 backdrop-blur md:block"
      >
        <div className="mx-auto flex max-w-7xl items-center gap-7 overflow-x-auto px-6 py-3 text-xs font-bold text-slate-600 lg:px-8">
          <a href="#find-your-path" className="whitespace-nowrap transition hover:text-slate-950">Find your path</a>
          <a href="#program-roadmap" className="whitespace-nowrap transition hover:text-slate-950">Learning system</a>
          <a href="#progression" className="whitespace-nowrap transition hover:text-slate-950">Progression</a>
          <a href="#course-levels" className="whitespace-nowrap transition hover:text-slate-950">Levels &amp; routes</a>
          <a href="#assessment" className="whitespace-nowrap transition hover:text-slate-950">Assessment</a>
          <a href="#teaching-method" className="whitespace-nowrap transition hover:text-slate-950">Live teaching</a>
          <a href="#faq" className="whitespace-nowrap transition hover:text-slate-950">FAQs</a>
        </div>
      </nav>

      <section id="find-your-path" className="scroll-mt-32 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16" aria-labelledby="find-path-heading">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-14">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">Start with the child you know</p>
            <h2 id="find-path-heading" className="mt-3 max-w-lg text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl">
              What are you noticing right now?
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-slate-600 md:text-base">
              Parents usually arrive with a problem, not a curriculum label. Use the closest signal below to
              understand which pathway is worth exploring first.
            </p>
            <p className="mt-5 text-sm font-semibold text-slate-900">
              Not sure? That is exactly what the assessment is for.
            </p>
          </div>

          <div className="grid border-y border-slate-200 sm:grid-cols-2">
            {pathwaySignals.map((item, index) => (
              <button
                key={item.tab}
                type="button"
                onClick={() => focusPath(item.tab)}
                className={
                  'group p-5 text-left transition hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-300 sm:p-6 ' +
                  (index % 2 === 0 ? 'sm:border-r sm:border-slate-200 ' : '') +
                  (index < 2 ? 'border-b border-slate-200 ' : index === 2 ? 'border-b border-slate-200 sm:border-b-0 ' : '')
                }
              >
                <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  {programs[item.tab].shortLabel}
                </span>
                <span className="mt-2 block text-lg font-bold leading-6 text-slate-950">{item.signal}</span>
                <span className="mt-2 block text-sm leading-6 text-slate-600">{item.helper}</span>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-orange-700">
                  See this pathway <span className="transition group-hover:translate-x-0.5" aria-hidden="true">→</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="program-roadmap" className="scroll-mt-32 border-y border-slate-200 bg-white" aria-labelledby="programs-heading">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">One connected learning system</p>
              <h2 id="programs-heading" className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                Four learning pathways, one clear roadmap
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-slate-600 md:text-base lg:justify-self-end">
              Children do not have to complete every pathway in a fixed age order. Assessment identifies the
              current gap, then the matching pathway becomes the main learning focus.
            </p>
          </div>

          <div className="mt-9 grid border-y border-slate-200 md:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-slate-200">
            {Object.values(programs).map((program, index) => (
              <article
                key={program.key}
                className={
                  'px-1 py-6 md:px-6 xl:px-6 ' +
                  (index < 2 ? 'border-b border-slate-200 xl:border-b-0 ' : '') +
                  (index % 2 === 0 ? 'md:border-r md:border-slate-200 xl:border-r-0 ' : '')
                }
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                    Learning area {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-400" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-slate-950">{program.label}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{program.summary}</p>
                <Link
                  to={program.programPath}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-slate-950 underline decoration-slate-300 underline-offset-4 transition hover:decoration-orange-500"
                >
                  Explore {program.shortLabel}
                  <span aria-hidden="true">→</span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="progression" className="scroll-mt-32 bg-slate-950 text-white" aria-labelledby="progression-heading">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">How skills develop</p>
            <h2 id="progression-heading" className="mt-3 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
              Progression should feel visible, not mysterious
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300 md:text-base">
              Each pathway moves from supported recognition and practice toward more accurate, independent
              application. The sequence stays clear while the pace responds to the child.
            </p>
          </div>

          <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
            {Object.values(programs).map((program) => {
              const sequenceParts = program.sequence.split(' → ');
              return (
                <article key={program.key} className="grid gap-4 py-6 lg:grid-cols-[220px_1fr] lg:gap-8">
                  <div>
                    <h3 className="text-lg font-bold text-white">{program.label}</h3>
                    <Link to={program.programPath} className="mt-2 inline-flex text-xs font-bold text-orange-300 underline underline-offset-4">
                      Open pathway
                    </Link>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {sequenceParts.map((part, index) => (
                        <span key={part} className="contents">
                          <span className="rounded-full border border-white/15 bg-white/[0.055] px-3 py-1.5 text-xs font-semibold leading-5 text-slate-100">
                            {part}
                          </span>
                          {index < sequenceParts.length - 1 && (
                            <span className="text-slate-500" aria-hidden="true">→</span>
                          )}
                        </span>
                      ))}
                    </div>

                    <details className="group mt-4">
                      <summary className="cursor-pointer list-none text-xs font-bold text-slate-400 transition hover:text-white">
                        <span className="group-open:hidden">View progression detail +</span>
                        <span className="hidden group-open:inline">Hide progression detail −</span>
                      </summary>
                      <ol className="mt-4 grid gap-x-6 gap-y-2 text-xs leading-5 text-slate-300 sm:grid-cols-2 xl:grid-cols-5">
                        {program.steps.map((step, index) => (
                          <li key={step} className="flex gap-2">
                            <span className="font-black text-orange-300">{index + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </details>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="course-levels" className="scroll-mt-32 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16" aria-labelledby="levels-heading">
        <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-12">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">Compare levels &amp; routes</p>
            <h2 id="levels-heading" className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl">
              Choose a pathway to inspect
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
              This roadmap shows where each option fits. Open the detailed course page for the exact lesson
              sequence, level-specific FAQs, and course outcomes where a detailed course page exists.
            </p>

            <div className="mt-6 flex flex-wrap gap-2" aria-label="Curriculum pathways">
              {(Object.keys(programs) as Tab[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  aria-pressed={tab === key}
                  className={
                    'rounded-full px-4 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 ' +
                    (tab === key
                      ? 'bg-slate-950 text-white'
                      : 'border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-950')
                  }
                >
                  {programs[key].shortLabel}
                </button>
              ))}
            </div>

            <div className="mt-7 border-l-2 border-orange-400 pl-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Selected pathway</p>
              <p className="mt-1 text-lg font-bold text-slate-950">{selectedProgram.label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{selectedProgram.summary}</p>
              <Link
                to={selectedProgram.programPath}
                className="mt-3 inline-flex text-sm font-bold text-orange-700 underline underline-offset-4"
              >
                View the full {selectedProgram.label} program
              </Link>
            </div>
          </div>

          <div className="border-y border-slate-200 bg-white">
            {selectedProgram.courses.map((course, index) => (
              <article
                key={course.path}
                className={
                  'grid gap-4 px-5 py-6 md:grid-cols-[1.05fr_0.95fr_0.95fr_auto] md:items-start md:gap-6 md:px-6 ' +
                  (index < selectedProgram.courses.length - 1 ? 'border-b border-slate-200' : '')
                }
              >
                <div>
                  <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-slate-600">
                    {course.badge}
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-slate-950">{course.name}</h3>
                </div>

                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">Best for</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{course.bestFor}</p>
                </div>

                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">Learning focus</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{course.focus}</p>
                </div>

                <Link
                  to={course.path}
                  className="inline-flex shrink-0 items-center gap-2 self-center text-sm font-bold text-slate-950 underline decoration-slate-300 underline-offset-4 transition hover:decoration-orange-500"
                >
                  View details
                  <span aria-hidden="true">→</span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="assessment" className="scroll-mt-32 border-y border-slate-200 bg-white" aria-labelledby="assessment-heading">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">Assessment-led placement</p>
              <h2 id="assessment-heading" className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                We do not place children by age alone
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-slate-600 md:text-base lg:justify-self-end">
              Age helps frame expectations, but the starting point comes from the child&apos;s current response.
              The aim is to identify the most useful next teaching priority before enrolment.
            </p>
          </div>

          <ol className="mt-9 grid border-y border-slate-200 md:grid-cols-5 md:divide-x md:divide-slate-200">
            {placementSteps.map((step, index) => (
              <li key={step.title} className="border-b border-slate-200 px-1 py-5 last:border-b-0 md:border-b-0 md:px-5 md:py-6">
                <span className="text-xs font-black text-orange-600">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="mt-2 text-lg font-bold text-slate-950">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
              </li>
            ))}
          </ol>

          <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              If the main bottleneck is unclear, assessment is more useful than choosing a course from age,
              popularity, or lesson count alone.
            </p>
            <Link
              to="/book-demo"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Book Free 35-Minute Assessment
            </Link>
          </div>
        </div>
      </section>

      <section id="teaching-method" className="scroll-mt-32 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16" aria-labelledby="teaching-method-heading">
        <div className="grid gap-7 lg:grid-cols-[0.78fr_1.22fr] lg:gap-14">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Step 3 · See how the roadmap becomes a live lesson
            </p>
            <h2 id="teaching-method-heading" className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl">
              Structured sequence, responsive teaching
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
              The curriculum explains <strong>what</strong> children learn and which prerequisites come first. In
              class, the teacher models the target skill, guides practice, corrects errors, adjusts support, and
              helps the child apply it with increasing independence.
            </p>
            <p className="mt-5 border-l-2 border-emerald-400 pl-4 text-sm leading-6 text-slate-700">
              The sequence stays structured, but the pace is responsive. A child can spend longer on a
              prerequisite or move forward when the underlying skill is secure.
            </p>
          </div>

          <ol className="divide-y divide-slate-200 border-y border-slate-200">
            {teachingMethodSteps.map((step, index) => (
              <li key={step.title} className="grid gap-3 py-5 sm:grid-cols-[48px_190px_1fr] sm:items-start sm:gap-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">
                  {index + 1}
                </span>
                <h3 className="text-base font-bold text-slate-950">{step.title}</h3>
                <p className="text-sm leading-6 text-slate-600">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-slate-200 pt-6 text-sm font-bold">
          <Link to="/team" className="text-slate-950 underline decoration-slate-300 underline-offset-4 hover:decoration-orange-500">
            Meet the Tiny Steps team
          </Link>
          <Link to="/class-samples" className="text-slate-950 underline decoration-slate-300 underline-offset-4 hover:decoration-orange-500">
            Watch real class samples
          </Link>
          <Link to="/phonics" className="text-slate-950 underline decoration-slate-300 underline-offset-4 hover:decoration-orange-500">
            Explore the Phonics &amp; Reading program
          </Link>
        </div>
      </section>

      <IBAlignmentSection />

      <section id="faq" className="scroll-mt-32 mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16" aria-labelledby="faq-heading">
        <div className="grid gap-7 lg:grid-cols-[0.72fr_1.28fr] lg:gap-12">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">Before you decide</p>
            <h2 id="faq-heading" className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl">
              Curriculum questions parents ask most
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              The curriculum page explains the full learning roadmap. Detailed course pages own the exact
              lesson-by-lesson sequence.
            </p>
          </div>

          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {curriculumFaqItems.map((item) => (
              <details key={item.question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-bold text-slate-950">
                  <span>{item.question}</span>
                  <span className="text-slate-400 group-open:hidden" aria-hidden="true">+</span>
                  <span className="hidden text-slate-400 group-open:inline" aria-hidden="true">−</span>
                </summary>
                <div className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{item.answer}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 rounded-[30px] bg-slate-950 px-6 py-8 text-white shadow-[0_24px_60px_rgba(15,23,42,0.16)] sm:px-8 lg:grid-cols-[1fr_auto] lg:items-center lg:px-10 lg:py-10">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">Not sure where to begin?</p>
            <h2 className="mt-2 text-2xl font-bold tracking-[-0.025em] sm:text-3xl">
              Start with the child&apos;s current skills, then choose the path.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              The free 1:1 assessment is designed to identify the current learning gap before a programme or level
              is recommended.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link
              to="/book-demo"
              className="inline-flex min-h-[46px] items-center justify-center rounded-full bg-white px-6 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
            >
              Book Free 35-Minute Assessment
            </Link>
            <Link
              to="/courses"
              className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-white/20 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Compare All Courses
            </Link>
          </div>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 p-4 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
        <Link
          to="/book-demo"
          className="mx-auto block min-h-[48px] w-full max-w-md rounded-full bg-slate-950 py-3 text-center font-bold text-white"
        >
          Book Free 35-Minute Assessment
        </Link>
      </div>
    </div>
  );
};

export default CurriculumPage;
