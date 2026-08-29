// @ts-nocheck
import type { FC } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Meta from '../components/common/Meta';
import IBAlignmentSection from '../components/curriculum/IBAlignmentSection';
import ContentTrustNote from '../components/seo/ContentTrustNote';
import { createFAQPageSchema, createWebPageSchema, PUBLIC_FACTS } from '../lib/schemas';
import { getRouteConfig } from '../lib/seo';

type Tab = 'phonics' | 'grammar' | 'speaking';

type RoadmapCourse = {
  name: string;
  path: string;
  lessons: string;
  bestFor: string;
  focus: string;
};

type RoadmapProgram = {
  key: Tab;
  label: string;
  programPath: string;
  summary: string;
  sequence: string;
  steps: string[];
  courses: RoadmapCourse[];
};

const curriculumSeo = getRouteConfig('/curriculum');
const curriculumSeoTitle = curriculumSeo?.title ?? 'English Curriculum for Kids Ages 3–12 | Tiny Steps Learning';
const curriculumSeoDescription =
  curriculumSeo?.description ??
  'See the complete Tiny Steps learning roadmap for ages 3–12 across phonics, reading, grammar, sentence building, speaking, and communication.';
const curriculumCanonicalPath = curriculumSeo?.canonicalPath ?? '/curriculum';
const curriculumCanonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${curriculumCanonicalPath}`;

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
    question: 'How are Phonics, Grammar, and Speaking connected?',
    answer:
      'Phonics supports accurate word reading, grammar helps children build and control sentences, and speaking practice helps them organise and express those ideas clearly. Children can enter at the pathway that matches their current need.',
  },
  {
    question: 'How long is each live class?',
    answer:
      `Each live online class runs for ${PUBLIC_FACTS.sessionDuration}, with guided teaching, practice, and teacher feedback.`,
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

const quickAnswers = [
  {
    question: 'What does the complete Tiny Steps learning roadmap include?',
    answer:
      'The roadmap connects phonics and reading foundations, grammar and sentence building, and speaking and communication so parents can see the relationship between the three core pathways.',
  },
  {
    question: 'Does every child start with phonics?',
    answer:
      'No. A child who already reads may start with grammar, sentence formation, reading fluency, or speaking support. The assessment is used to identify the most useful entry point.',
  },
  {
    question: 'Where can I see the exact lesson sequence?',
    answer:
      'Use the detailed course pages for the exact lesson-by-lesson sequence. This curriculum page stays focused on the full roadmap, progression logic, and how the programs connect.',
  },
];

const programs: Record<Tab, RoadmapProgram> = {
  phonics: {
    key: 'phonics',
    label: 'Phonics & Reading',
    programPath: '/phonics',
    summary:
      'Build accurate sound-letter knowledge, blending, decoding, spelling-pattern awareness, and increasingly independent reading.',
    sequence: 'Hear → identify → connect sound to grapheme → blend → decode → apply in connected reading',
    steps: [
      'Hear and identify the target sound accurately.',
      'Connect the sound to the written grapheme.',
      'Blend sounds into words instead of guessing.',
      'Decode words with progressively less prompting.',
      'Apply decoding in sentences and connected reading.',
    ],
    courses: [
      {
        name: 'Phonics Foundations',
        path: '/courses/phonics-foundation',
        lessons: '31 lessons',
        bestFor: 'Children beginning letter sounds, short vowels, early blending, and first CVC words.',
        focus: 'Build the sound-to-word foundation before more complex spelling patterns.',
      },
      {
        name: 'Early Phonics',
        path: '/courses/phonics-brush-up',
        lessons: '40 lessons',
        bestFor: 'Children who know basic sounds but need stronger digraph, vowel-team, and decoding habits.',
        focus: 'Move from basic sound recall into patterned word reading and stronger fluency.',
      },
      {
        name: 'Advanced Phonics',
        path: '/courses/phonics-advanced',
        lessons: '30 lessons',
        bestFor: 'Children ready for advanced vowel patterns, longer words, spelling rules, and smoother reading.',
        focus: 'Strengthen complex decoding and connected-reading accuracy.',
      },
    ],
  },
  grammar: {
    key: 'grammar',
    label: 'Grammar & Sentence Building',
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
        lessons: '36 lessons',
        bestFor: 'Children who read but need stronger grammar basics, punctuation, and sentence formation.',
        focus: 'Build usable sentence control before advanced grammar and writing tasks.',
      },
      {
        name: 'Advanced Grammar',
        path: '/courses/grammar-mastery',
        lessons: '36 lessons',
        bestFor: 'Children who know grammar basics but need stronger tense control, editing, and paragraph-level writing.',
        focus: 'Apply grammar more consistently in complex sentences, editing, and connected writing.',
      },
    ],
  },
  speaking: {
    key: 'speaking',
    label: 'Speaking & Communication',
    programPath: '/speaking',
    summary:
      'Build complete responses, organised ideas, storytelling, presentation structure, clear expression, and confidence through guided speaking practice.',
    sequence: 'Listen and form an idea → answer in a complete sentence → add detail → organise → deliver and reflect',
    steps: [
      'Listen to the prompt and form a clear idea.',
      'Answer in a complete sentence.',
      'Add detail, sequence, reason, or example.',
      'Organise the response for the task or audience.',
      'Deliver, receive feedback, and reflect on the next improvement.',
    ],
    courses: [
      {
        name: 'Public Speaking Foundations',
        path: '/courses/public-speaking-foundations',
        lessons: '36 lessons',
        bestFor: 'Children who give short answers, hesitate, or need guided full-sentence speaking practice.',
        focus: 'Build comfort, response length, and predictable speaking structure.',
      },
      {
        name: 'Public Speaking Excellence',
        path: '/courses/public-speaking-excellence',
        lessons: '36 lessons',
        bestFor: 'Children ready for longer talks, storytelling, presentations, structured speeches, and guided debate.',
        focus: 'Strengthen organisation, expression, delivery, and audience confidence.',
      },
    ],
  },
};

const safeTab = (value: string | null): Tab =>
  value === 'grammar' || value === 'speaking' || value === 'phonics' ? value : 'phonics';

const inferTabFromCourse = (course: string | null): Tab => {
  const normalized = String(course || '').toLowerCase();
  if (normalized.includes('grammar')) return 'grammar';
  if (normalized.includes('speaking')) return 'speaking';
  return 'phonics';
};

const CurriculumPage: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedCourse = searchParams.get('course');
  const tab = requestedCourse ? inferTabFromCourse(requestedCourse) : safeTab(searchParams.get('tab'));
  const selectedProgram = programs[tab];

  const setTab = (next: Tab) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', next);
    nextParams.delete('course');
    setSearchParams(nextParams, { replace: true });
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${PUBLIC_FACTS.primaryWebsite}/` },
      { '@type': 'ListItem', position: 2, name: 'Curriculum', item: curriculumCanonicalUrl },
    ],
  };

  const webpageSchema = createWebPageSchema({
    name: 'Tiny Steps English Curriculum and Learning Roadmap (Ages 3–12)',
    description:
      'The complete Tiny Steps learning roadmap connecting phonics and reading foundations, grammar and sentence building, and speaking and communication through assessment-led progression.',
    url: curriculumCanonicalUrl,
  });

  const roadmapSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${curriculumCanonicalUrl}#program-roadmap`,
    name: 'Tiny Steps core learning roadmap',
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement: Object.values(programs).map((program, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: program.label,
      url: `${PUBLIC_FACTS.primaryWebsite}${program.programPath}`,
    })),
  };

  const faqSchema = {
    ...createFAQPageSchema(curriculumFaqItems),
    '@id': `${curriculumCanonicalUrl}#faq`,
  };

  return (
    <div className="page-gradient relative overflow-hidden pb-24">
      <Meta
        title={curriculumSeoTitle}
        description={curriculumSeoDescription}
        canonical={curriculumCanonicalUrl}
        jsonLd={[breadcrumbSchema, webpageSchema, roadmapSchema, faqSchema]}
      />

      <section className="mx-auto max-w-6xl px-4 pb-8 pt-8 sm:px-6">
        <div className="glass-panel soft-grid overflow-hidden px-5 py-8 text-center sm:px-8 sm:py-11">
          <div className="gradient-chip mx-auto mb-4 w-max">Ages 3–12 • Assessment-led placement</div>
          <h1 className="font-heading text-3xl md:text-5xl">The complete Tiny Steps learning roadmap</h1>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-gray-700 md:text-lg">
            See how Phonics & Reading, Grammar & Sentence Building, and Speaking & Communication connect—and which detailed course owns the next level of learning.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/book-demo" className="rounded-full bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm">
              Book Free 35-Minute Demo
            </Link>
            <Link to="/courses" className="rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900">
              Compare All Courses
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <div className="glass-panel p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-gray-900">Quick answers for parents</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {quickAnswers.map((item) => (
              <article key={item.question} className="rounded-2xl border border-gray-200 bg-white/85 p-5 shadow-sm">
                <h3 className="text-base font-semibold text-gray-900">{item.question}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-700">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ContentTrustNote text="This roadmap is maintained by the Tiny Steps academic team and reviewed by the founder to keep program boundaries, placement logic, and parent guidance consistent with the courses actually taught." />

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6" aria-labelledby="programs-heading">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Three core pathways</p>
          <h2 id="programs-heading" className="mt-2 text-2xl font-semibold text-gray-900 sm:text-3xl">How the programs connect</h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-6 text-gray-700 md:text-base">
            Children do not have to complete every pathway in a fixed age order. Assessment identifies the current gap, then the matching program becomes the main learning path.
          </p>
        </div>
        <div className="mt-7 grid gap-5 md:grid-cols-3">
          {Object.values(programs).map((program, index) => (
            <article key={program.key} className="rounded-3xl border border-gray-200 bg-white/90 p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Pathway {index + 1}</p>
              <h3 className="mt-2 text-xl font-semibold text-gray-900">{program.label}</h3>
              <p className="mt-3 text-sm leading-6 text-gray-700">{program.summary}</p>
              <Link to={program.programPath} className="mt-5 inline-flex font-semibold text-primary-600 underline underline-offset-4">
                Explore the {program.label} program
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6" aria-labelledby="method-heading">
        <div className="rounded-[32px] border border-slate-200 bg-slate-950 p-6 text-white shadow-xl md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Tiny Steps instructional logic</p>
          <h2 id="method-heading" className="mt-2 text-2xl font-semibold md:text-3xl">What progression looks like inside each pathway</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200 md:text-base">
            These are practical teaching sequences used to move a child from recognition toward independent application. They describe how learning progresses; they are not accreditation claims.
          </p>
          <div className="mt-7 grid gap-5 lg:grid-cols-3">
            {Object.values(programs).map((program) => (
              <article key={program.key} className="rounded-3xl border border-white/15 bg-white/5 p-5">
                <h3 className="text-lg font-semibold text-white">{program.label}</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-orange-200">{program.sequence}</p>
                <ol className="mt-4 space-y-2 text-sm leading-6 text-slate-200">
                  {program.steps.map((step, index) => (
                    <li key={step} className="flex gap-3">
                      <span className="font-semibold text-white">{index + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </div>
      </section>

      <IBAlignmentSection />

      <section className="border-y border-white/50 bg-white/90">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <p className="text-sm font-semibold text-gray-900">Choose a pathway to see its levels</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(Object.keys(programs) as Tab[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  tab === key ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow' : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {programs[key].label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6" aria-labelledby="levels-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Detailed course owners</p>
            <h2 id="levels-heading" className="mt-2 text-2xl font-semibold text-gray-900 sm:text-3xl">{selectedProgram.label} levels</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-700 md:text-base">
              This roadmap shows where each level fits. Open the detailed course page for the exact lesson sequence, activities, level-specific FAQs, and course outcomes.
            </p>
          </div>
          <Link to={selectedProgram.programPath} className="text-sm font-semibold text-primary-600 underline underline-offset-4">
            View the full {selectedProgram.label} program
          </Link>
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {selectedProgram.courses.map((course) => (
            <article key={course.path} className="flex h-full flex-col rounded-3xl border border-gray-200 bg-white/90 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-gray-900">{course.name}</h3>
                <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">{course.lessons}</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-gray-700"><strong>Best for:</strong> {course.bestFor}</p>
              <p className="mt-3 text-sm leading-6 text-gray-700"><strong>Learning focus:</strong> {course.focus}</p>
              <Link to={course.path} className="mt-5 inline-flex font-semibold text-primary-600 underline underline-offset-4">
                View detailed course
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10" aria-labelledby="who-heading">
        <h2 id="who-heading" className="text-2xl font-semibold text-gray-900">Who this roadmap helps</h2>
        <ul className="mt-5 space-y-3 text-gray-700">
          <li>• A child knows letters but cannot blend words confidently.</li>
          <li>• A child reads but needs stronger accuracy, fluency, or spelling-pattern knowledge.</li>
          <li>• A child can read but struggles to build correct or complete sentences.</li>
          <li>• A child understands English but gives short answers or hesitates to speak.</li>
          <li>• A parent wants a structured next step instead of random worksheets or disconnected topics.</li>
        </ul>
        <p className="mt-5 text-sm leading-6 text-gray-700">
          If you are unsure which pathway fits, use the free assessment to identify the current learning gap before choosing a course.
        </p>
        <Link to="/book-demo" className="mt-4 inline-flex rounded-full bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white">
          Book Free 35-Minute Demo
        </Link>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-2xl font-semibold text-gray-900">Frequently asked questions</h2>
        <div className="mt-6 space-y-4">
          {curriculumFaqItems.map((item) => (
            <details key={item.question} className="rounded-2xl border border-gray-200 bg-white/85 p-4">
              <summary className="cursor-pointer font-medium text-gray-900">{item.question}</summary>
              <div className="mt-2 text-sm leading-6 text-gray-700">{item.answer}</div>
            </details>
          ))}
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white p-4 md:hidden">
        <Link to="/book-demo" className="block w-full rounded bg-primary-500 py-3 text-center font-semibold text-white">
          Book Free 35-Minute Demo
        </Link>
      </div>
    </div>
  );
};

export default CurriculumPage;
