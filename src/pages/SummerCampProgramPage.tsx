import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { applySeo } from '../lib/seo';

const SUMMER_CAMP_ENROLLMENT_PRICE = 2400;
const SUMMER_CAMP_FULL_PRICE = 5000;
const SUMMER_CAMP_BATCH_CAP = 8;

function getWhatsAppUrl(message: string) {
  return `https://wa.me/919618398383?text=${encodeURIComponent(message)}`;
}

function getProgramEnrollText(programTitle: string) {
  return `Hi, I'm looking to enroll for Summer Camp ${programTitle}.`;
}

function formatINR(value: number) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

type ProgramConfig = {
  slug: string;
  title: string;
  ages: string;
  outcome: string;
  focus: string;
  format: string;
  outcomes: string[];
  learn: string[];
  steps: string[];
  faq: Array<{ question: string; answer: string }>;
};

const PROGRAMS: Record<string, ProgramConfig> = {
  'phonics-fast-track': {
    slug: 'phonics-fast-track',
    title: 'Phonics Fast Track',
    ages: 'Ages 4-8',
    outcome: '10-week phonics fast track for stronger reading confidence',
    focus: 'Fast-track brush-up in sounds, blends, and decoding for smooth early reading',
    format: `Live premium small-group classes capped at ${SUMMER_CAMP_BATCH_CAP} students`,
    outcomes: [
      'Stronger sound recognition and recall',
      'Faster blending with better word accuracy',
      'Confident reading of short passages',
    ],
    learn: [
      'Core sounds, digraphs, and blend drills',
      'Decoding strategies for unfamiliar words',
      'Reading fluency routines with guided correction',
    ],
    steps: [
      'Enroll for ₹2,400 and complete a quick level check',
      'Attend 50–60 minute live fast-track classes with guided practice',
      'Follow a clear 10-week learning path with effective worksheets and class recordings',
    ],
    faq: [
      {
        question: 'What is Phonics Fast Track?',
        answer:
          'A focused 10-week course for children who need a quick phonics refresh before the new school term. It strengthens sound knowledge, blending, decoding, and reading flow.',
      },
      {
        question: 'Who is it for?',
        answer:
          'Best for ages 4-8 who need stronger reading foundations, smoother blending, or more confidence with unfamiliar words.',
      },
      {
        question: 'What will my child achieve?',
        answer:
          'Children finish with cleaner sound recall, better blending speed, and improved confidence while reading aloud.',
      },
      {
        question: 'Is this the same curriculum as regular classes?',
        answer:
          `Yes. It uses the same Tiny Steps core method, delivered in a premium summer format with a clear 10-week outcome path and batches capped at ${SUMMER_CAMP_BATCH_CAP}.`,
      },
    ],
  },
  'grammar-fast-track': {
    slug: 'grammar-fast-track',
    title: 'Grammar Fast Track',
    ages: 'Ages 6-12',
    outcome: '10-week grammar fast track for better writing quality',
    focus: 'Fast-track brush-up in sentence structure, punctuation, tense, and grammar accuracy',
    format: `Live premium small-group classes capped at ${SUMMER_CAMP_BATCH_CAP} students`,
    outcomes: [
      'Fewer common grammar mistakes in school writing',
      'Better sentence structure and punctuation control',
      'Cleaner paragraph flow and clarity',
    ],
    learn: [
      'Parts of speech in practical sentence use',
      'Tense and agreement correction routines',
      'Editing frameworks for school-level writing',
    ],
    steps: [
      'Enroll for ₹2,400 and complete a quick level check',
      'Attend 50–60 minute live fast-track classes with guided practice',
      'Follow a clear 10-week learning path with effective worksheets and class recordings',
    ],
    faq: [
      {
        question: 'What is Grammar Fast Track?',
        answer:
          'A focused 10-week grammar refresher designed to improve writing quality quickly through practical drills and teacher-led correction.',
      },
      {
        question: 'Who is it for?',
        answer:
          'Best for ages 6-12 who need to improve grammar accuracy, sentence flow, or confidence in school writing tasks.',
      },
      {
        question: 'What will my child achieve?',
        answer:
          'Children write with improved grammar control, clearer sentence flow, and stronger editing habits.',
      },
      {
        question: 'Is this the same curriculum as regular classes?',
        answer:
          `Yes. It uses the same Tiny Steps core method, delivered in a premium summer format with a clear 10-week outcome path and batches capped at ${SUMMER_CAMP_BATCH_CAP}.`,
      },
    ],
  },
  'speaking-fast-track': {
    slug: 'speaking-fast-track',
    title: 'Speaking Fast Track',
    ages: 'Ages 6-12',
    outcome: '10-week speaking fast track for confident communication',
    focus: 'Fast-track brush-up in speech structure, clarity, pronunciation, and delivery confidence',
    format: `Live premium small-group classes capped at ${SUMMER_CAMP_BATCH_CAP} students`,
    outcomes: [
      'More confidence in short structured talks',
      'Clearer voice, pace, and articulation',
      'Better presentation flow in school speaking tasks',
    ],
    learn: [
      'Intro-body-close speaking frameworks',
      'Voice and pronunciation polishing drills',
      'Confidence routines for stage and class speaking',
    ],
    steps: [
      'Enroll for ₹2,400 and complete a quick level check',
      'Attend 50–60 minute live fast-track classes with guided practice',
      'Follow a clear 10-week learning path with effective worksheets and class recordings',
    ],
    faq: [
      {
        question: 'What is Speaking Fast Track?',
        answer:
          'A focused 10-week speaking course that helps children speak more confidently, clearly, and structurally in school and activity settings.',
      },
      {
        question: 'Who is it for?',
        answer:
          'Best for ages 6-12 who need stronger speaking confidence, clearer expression, or better structure in oral responses.',
      },
      {
        question: 'What will my child achieve?',
        answer:
          'Children finish with better speech clarity, stronger delivery confidence, and improved presentation structure.',
      },
      {
        question: 'Is this the same curriculum as regular classes?',
        answer:
          `Yes. It uses the same Tiny Steps core method, delivered in a premium summer format with a clear 10-week outcome path and batches capped at ${SUMMER_CAMP_BATCH_CAP}.`,
      },
    ],
  },
};

function toTitleCase(value: string) {
  return value
    .split(/[-_]/g)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function ProgramPage({ program, batchSlug }: { program: ProgramConfig | null; batchSlug?: string }) {
  if (!program) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-bold text-gray-900">Program coming soon</h1>
        <p className="mt-3 text-gray-700">
          This summer camp program page is being prepared. Please check the summer camps hub for
          current options.
        </p>
        <div className="mt-6">
          <Link
            to="/summer-camps"
            className="inline-flex min-h-[46px] items-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white"
          >
            Back to Summer Camps
          </Link>
        </div>
      </div>
    );
  }

  const programWhatsAppUrl = getWhatsAppUrl(getProgramEnrollText(program.title));

  if (batchSlug) {
    return (
      <div className="pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
          <nav aria-label="Breadcrumb" className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link to="/" className="hover:text-emerald-700">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link to="/summer-camps" className="hover:text-emerald-700">
                  Summer Camps
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link to={`/summer-camps/${program.slug}`} className="hover:text-emerald-700">
                  {program.title}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-emerald-700">{toTitleCase(batchSlug)}</li>
            </ol>
          </nav>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
            {program.title}
          </p>
          <h1 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">Batch details coming soon</h1>
          <p className="mt-3 text-gray-700">
            This batch page is a placeholder so parents never hit a dead end. Full schedule and
            enrollment details will be published here.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to={`/summer-camps/${program.slug}`}
              className="inline-flex min-h-[46px] w-full items-center justify-center rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 sm:w-auto"
            >
              View program details
            </Link>
            <a
              href={programWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[46px] w-full items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-800 sm:w-auto"
            >
              Enroll for ₹{formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)}
            </a>
            <Link
              to="/summer-camps"
              className="inline-flex min-h-[46px] w-full items-center justify-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white sm:w-auto"
            >
              Back to Summer Camps
            </Link>
          </div>
        </div>
        <div className="fixed inset-x-0 bottom-0 z-40 md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="mx-auto max-w-5xl px-3 pb-2">
            <div className="flex items-center gap-2 rounded-[20px] border border-emerald-100/80 bg-white/95 p-2 shadow-[0_-6px_30px_rgba(15,23,42,0.22)] backdrop-blur-md">
              <Link
                to={`/summer-camps/${program.slug}`}
                className="flex-1 rounded-full border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700"
              >
                Program page
              </Link>
              <a
                href={programWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-full bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                WhatsApp us
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#fff4da] via-[#fffdf5] to-[#def6ff]">
        <div className="pointer-events-none absolute -left-20 top-10 hidden h-64 w-64 rounded-full bg-[#ffb13d]/25 blur-3xl sm:block" />
        <div className="pointer-events-none absolute right-0 top-0 hidden h-72 w-72 rounded-full bg-[#00b5d8]/20 blur-3xl sm:block" />
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
          <nav aria-label="Breadcrumb" className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link to="/" className="hover:text-emerald-700">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link to="/summer-camps" className="hover:text-emerald-700">
                  Summer Camps
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-emerald-700">{program.title}</li>
            </ol>
          </nav>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
            {program.title}
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-gray-900 sm:text-4xl md:text-5xl">
            {program.outcome}
          </h1>
          <p className="mt-4 max-w-3xl text-base text-gray-700 sm:text-lg">
            {program.focus}. {program.format}. {program.ages}. Summer camp list fee: ₹{formatINR(SUMMER_CAMP_FULL_PRICE)}. Effective price: ₹{formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)}.
          </p>
          <p className="mt-2 text-sm font-semibold text-emerald-700">
            <span className="text-slate-500 line-through">₹{formatINR(SUMMER_CAMP_FULL_PRICE)}</span>{' '}
            <span>Effective price: ₹{formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)}</span>
          </p>
          
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm">
            <span className="text-lg">⏰</span>
            <span className="font-semibold text-amber-900">Starting April 1, 2026</span>
            <span className="text-amber-700">• Limited batches, capped at {SUMMER_CAMP_BATCH_CAP} students</span>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-white/80 px-4 py-1 text-gray-700">{program.ages}</span>
            <span className="rounded-full bg-white/80 px-4 py-1 text-gray-700">10 weeks</span>
            <span className="rounded-full bg-white/80 px-4 py-1 text-gray-700">50–60 min classes</span>
            <span className="rounded-full bg-white/80 px-4 py-1 text-gray-700">Capped at {SUMMER_CAMP_BATCH_CAP}</span>
            <span className="rounded-full bg-white/80 px-4 py-1 text-gray-700">Online</span>
            <span className="rounded-full bg-emerald-100 px-4 py-1 font-semibold text-emerald-800">₹{formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)} Enrollment</span>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to="/summer-camps#batches"
              className="inline-flex min-h-[46px] w-full items-center justify-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white sm:w-auto"
            >
              View Group Batches
            </Link>
            <a
              href={programWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[46px] w-full items-center justify-center rounded-full border border-emerald-200 bg-white px-5 py-2 text-sm font-semibold text-emerald-800 sm:w-auto"
            >
              Enroll for ₹{formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)}
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-lg font-semibold text-gray-900">What is this camp?</h2>
            <p className="mt-2 text-sm text-gray-700">
              {program.title} is a 10-week online summer camp that follows our core curriculum
              (phonics, grammar, and speaking) with extra focus on this track. Expect focused
              group sessions capped at {SUMMER_CAMP_BATCH_CAP} students, a clear detailed learning path, effective worksheets, and class recordings.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-lg font-semibold text-gray-900">Who is it for?</h2>
            <p className="mt-2 text-sm text-gray-700">
              This program is best for {program.ages}. If your child needs a boost in this skill,
              this camp provides structure, feedback, and daily practice that is easy to follow.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-lg font-semibold text-gray-900">What will my child achieve?</h2>
            <p className="mt-2 text-sm text-gray-700">
              Children make measurable progress through a clear 10-week learning path and teacher feedback.
              Expect stronger skills, more confidence, and a clear next-step plan after 10 weeks.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-lg font-semibold text-gray-900">Camp format</h2>
            <p className="mt-2 text-sm text-gray-700">
              This is a group-focused premium summer camp, capped at {SUMMER_CAMP_BATCH_CAP} students per batch for active participation, live correction, and clear teacher guidance in every class.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 sm:pb-12">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <h3 className="text-lg font-semibold text-gray-900">What kids will learn</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {program.learn.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-emerald-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <h3 className="text-lg font-semibold text-gray-900">How it works</h3>
            <ol className="mt-3 space-y-2 text-sm text-gray-700">
              {program.steps.map((item, idx) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                    {idx + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 sm:pb-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900">Enrollment snapshot</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
                Summer Camp Fee
              </p>
              <p className="mt-2 text-3xl font-black text-gray-900">₹{formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)}</p>
              <p className="mt-1 text-xs font-semibold text-emerald-700">
                <span className="text-slate-500 line-through">₹{formatINR(SUMMER_CAMP_FULL_PRICE)}</span>{' '}
                <span>Effective price: ₹{formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)}</span>
              </p>
              <p className="mt-2 text-sm text-gray-700">
                Straightforward enrollment for the summer group camp.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-600">
                Next Step
              </p>
              <p className="mt-2 text-sm text-gray-700">
                Pick a batch, enroll, and we place your child into the right level group.
              </p>
              <div className="mt-4">
                <Link
                  to="/summer-camps#batches"
                  className="inline-flex min-h-[46px] w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white sm:w-auto"
                >
                  Choose Group Batch
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Next Steps Internal Linking */}
      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 sm:pb-12">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-violet-50 via-white to-sky-50 shadow-sm">
          <div className="px-6 py-5 sm:px-8">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">Explore More Options</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Next Steps & Related Programs</h2>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {program.slug !== 'phonics-fast-track' && (
                <Link
                  to="/summer-camps/phonics-fast-track"
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-lg">📚</div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-slate-900">Phonics Fast Track</h3>
                      <p className="mt-1 text-xs text-slate-600">Ages 4–8 • Reading foundation</p>
                    </div>
                  </div>
                </Link>
              )}

              {program.slug !== 'grammar-fast-track' && (
                <Link
                  to="/summer-camps/grammar-fast-track"
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-lg">✏️</div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-slate-900">Grammar Fast Track</h3>
                      <p className="mt-1 text-xs text-slate-600">Ages 6–12 • Writing quality</p>
                    </div>
                  </div>
                </Link>
              )}

              {program.slug !== 'speaking-fast-track' && (
                <Link
                  to="/summer-camps/speaking-fast-track"
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-lg">🗣️</div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-slate-900">Speaking Fast Track</h3>
                      <p className="mt-1 text-xs text-slate-600">Ages 6–12 • Confident communication</p>
                    </div>
                  </div>
                </Link>
              )}

              <Link
                to="/summer-camps"
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-lg">🏕️</div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-900">All Summer Camps</h3>
                    <p className="mt-1 text-xs text-slate-600">Compare all tracks</p>
                  </div>
                </div>
              </Link>

              <Link
                to="/why-tiny-steps"
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-lg">💚</div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-900">Why Tiny Steps</h3>
                    <p className="mt-1 text-xs text-slate-600">Our teaching approach</p>
                  </div>
                </div>
              </Link>

              <Link
                to="/pricing"
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-lg">💰</div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-900">Pricing Options</h3>
                    <p className="mt-1 text-xs text-slate-600">All program fees</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 sm:pb-16">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900">FAQs</h3>
          <div className="mt-4 space-y-4">
            {program.faq.map((item) => (
              <div key={item.question}>
                <div className="text-sm font-semibold text-gray-900">{item.question}</div>
                <div className="mt-1 text-sm text-gray-700">{item.answer}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="mx-auto max-w-6xl px-3 pb-2">
          <div className="flex items-center gap-2 rounded-[20px] border border-emerald-100/80 bg-white/95 p-2 shadow-[0_-6px_30px_rgba(15,23,42,0.22)] backdrop-blur-md">
            <Link
              to="/summer-camps#batches"
              className="flex-1 rounded-full border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700"
            >
              View batches
            </Link>
            <a
              href={programWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-full bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white"
            >
              Enroll ₹{formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SummerCampProgramPage() {
  const { programSlug, batchSlug } = useParams<{ programSlug: string; batchSlug?: string }>();
  const program = useMemo(() => (programSlug ? PROGRAMS[programSlug] ?? null : null), [programSlug]);

  useEffect(() => {
    const baseTitle = program?.title || 'Summer Camp Program';
    const batchTitle = batchSlug ? `Batch ${toTitleCase(batchSlug)}` : '';
    const title = batchSlug ? `${baseTitle} ${batchTitle} | Tiny Steps` : `${baseTitle} | Tiny Steps`;
    const description = program
      ? `${program.title} for ${program.ages}. ${program.focus}. Premium small-group summer camp capped at ${SUMMER_CAMP_BATCH_CAP} students, with a clear 10-week learning path, 50–60 minute classes, effective worksheets, and class recordings. List fee ₹${formatINR(SUMMER_CAMP_FULL_PRICE)}. Effective price ₹${formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)}.`
      : 'Summer camp program details coming soon.';
    const keywords = program
      ? [
          `${program.title.toLowerCase()} online`,
          `${program.title.toLowerCase()} for kids india`,
          'premium summer camp for kids',
          'small group summer camp for kids',
          'online summer camp for kids india',
          'phonics grammar speaking fast track',
          'summer camp with limited batch size',
        ]
      : ['online summer camp for kids india'];

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://tinystepslearning.com/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Summer Camps',
          item: 'https://tinystepslearning.com/summer-camps',
        },
        ...(program
          ? [
              {
                '@type': 'ListItem',
                position: 3,
                name: program.title,
                item: `https://tinystepslearning.com/summer-camps/${program.slug}`,
              },
            ]
          : []),
        ...(batchSlug
          ? [
              {
                '@type': 'ListItem',
                position: program ? 4 : 3,
                name: toTitleCase(batchSlug),
                item: `https://tinystepslearning.com/summer-camps/${programSlug}/${batchSlug}`,
              },
            ]
          : []),
      ],
    };

    const courseSchema = program
      ? {
          '@context': 'https://schema.org',
          '@type': 'Course',
          name: program.title,
          description: `${program.focus}. Premium small-group summer camp capped at ${SUMMER_CAMP_BATCH_CAP} students.`,
          courseMode: 'Online',
          educationalLevel: program.ages,
          provider: {
            '@type': 'Organization',
            name: 'Tiny Steps Learning',
          },
        }
      : null;

    const faqSchema =
      program && program.faq.length > 0
        ? {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: program.faq.map((item) => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: { '@type': 'Answer', text: item.answer },
            })),
          }
        : null;

    applySeo({
      title,
      description,
      keywords,
      canonicalPath: batchSlug
        ? `/summer-camps/${programSlug}/${batchSlug}`
        : `/summer-camps/${programSlug}`,
      robots:
        batchSlug || !program
          ? 'noindex, follow'
          : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
      ogType: 'website',
      noIndex: Boolean(batchSlug) || !program,
      jsonLd: [breadcrumbSchema, courseSchema, faqSchema].filter(Boolean) as object[],
    });
  }, [program, programSlug, batchSlug]);

  return <ProgramPage program={program} batchSlug={batchSlug} />;
}
