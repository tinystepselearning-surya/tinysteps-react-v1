import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PUBLIC_SITE_FACTS } from '../../config/publicFacts';
import {
  CLASS_SAMPLE_CATEGORY_LABELS,
  isValidYouTubeVideoId,
  toClassSampleItem,
  type ClassSampleItem,
} from '../../lib/classSamples';

export type HomeFaqItem = {
  question: string;
  answer: string;
};

const problemSignals = [
  {
    title: 'Knows letters but cannot blend words',
    detail: 'Recognises letters or sounds but struggles to combine them into readable words.',
  },
  {
    title: 'Reads slowly or guesses words',
    detail: 'Reading feels effortful, inconsistent, or dependent on memory instead of confident decoding.',
  },
  {
    title: 'Understands English but struggles to form sentences',
    detail: 'Knows what they want to say but needs support turning ideas into complete sentences.',
  },
  {
    title: 'Makes frequent grammar mistakes',
    detail: 'Tenses, sentence order, punctuation, or basic grammar patterns are not yet secure.',
  },
  {
    title: 'Answers with only one or two words',
    detail: 'Needs guided practice to expand answers, explain ideas, and speak with more detail.',
  },
  {
    title: 'Knows the answer but hesitates to speak',
    detail: 'Confidence, clarity, or fear of mistakes is stopping your child from expressing what they know.',
  },
];

export function ParentProblemRecognitionSection() {
  return (
    <section className="px-6 pb-8 pt-7 sm:pb-10 sm:pt-9">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-700">Start with the real learning gap</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Does this sound like your child?</h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            Parents often notice the difficulty before they know whether the right next step is phonics, reading, grammar, sentence building, or speaking support.
          </p>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {problemSignals.map((signal) => (
            <article
              key={signal.title}
              className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.05)] sm:rounded-[26px] sm:p-5"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-sm font-bold text-orange-700">✓</div>
                <div>
                  <h3 className="text-[0.95rem] font-semibold leading-6 text-slate-900 sm:text-base">{signal.title}</h3>
                  <p className="mt-1.5 text-sm leading-5 text-slate-600 sm:leading-6">{signal.detail}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-[24px] border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-orange-50 px-5 py-5 text-center sm:px-8">
          <p className="text-sm font-semibold leading-6 text-slate-800 sm:text-base">
            Every child starts from a different point. Tiny Steps begins by identifying the current bottleneck before recommending a learning path.
          </p>
          <a
            href="#free-assessment-checklist"
            className="mt-3 inline-flex text-sm font-semibold text-sky-700 underline decoration-sky-300 underline-offset-4 hover:text-sky-900"
          >
            See what we check in the assessment ↓
          </a>
        </div>
      </div>
    </section>
  );
}

const trustSnapshot = [
  { value: PUBLIC_SITE_FACTS.learnerReach.learnersLabel, label: 'served through Tiny Steps' },
  { value: PUBLIC_SITE_FACTS.learnerReach.countriesLabel, label: 'with Tiny Steps families' },
];

export function TrustSnapshotSection() {
  return (
    <section className="px-6 pb-10 md:hidden">
      <div className="mx-auto max-w-6xl rounded-[24px] border border-slate-200 bg-slate-950 px-5 py-5 text-white shadow-[0_18px_48px_rgba(15,23,42,0.12)]">
        <div className="grid grid-cols-2 gap-5">
          {trustSnapshot.map((item) => (
            <div key={item.label} className="text-center lg:text-left">
              <div className="text-2xl font-bold tracking-tight text-white">{item.value}</div>
              <div className="mt-1 text-xs leading-5 text-slate-300 sm:text-sm">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const assessmentChecks = [
  'Letter-sound knowledge',
  'Blending ability',
  'CVC word reading',
  'Reading fluency',
  'Sentence formation',
  'Grammar accuracy',
  'Speaking confidence',
  'Pronunciation clarity',
];

export function AssessmentStartPointsSection() {
  return (
    <section id="free-assessment-checklist" className="px-6 py-8 sm:py-9">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[24px] border border-slate-200 bg-white p-5 sm:p-7">
        <div className="grid gap-7 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <div className="inline-flex rounded-full border border-sky-200 bg-white px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-900">
              One free 35-minute 1:1 demo assessment
            </div>
            <h2 className="mt-4 max-w-xl text-2xl font-semibold tracking-[-0.035em] text-slate-900 sm:text-3xl">
              We identify the skill gap before recommending a programme
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-700 sm:text-base">
              The teacher focuses on the areas connected to the concern you shared. Age helps us choose appropriate tasks, but placement is based on the child&apos;s observed skills rather than age alone.
            </p>
            <Link
              to="/book-demo"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Book Free 35-Minute Demo
            </Link>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Depending on the child&apos;s needs, the assessment may check
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {assessmentChecks.map((item) => (
                <div
                  key={item}
                  className="rounded-[16px] border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-medium leading-5 text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const learningPaths = [
  {
    title: 'Phonics Foundations',
    ages: 'Ages 3–12',
    description: 'Letter sounds, blending, decoding, CVC words, spelling patterns, and the foundations needed for independent word reading.',
    path: '/phonics',
    cta: 'Explore Phonics',
  },
  {
    title: 'Reading & Fluency',
    ages: 'Ages 3–12',
    description: 'Accurate word and sentence reading, fluency, vocabulary, comprehension, retelling, and stronger reading confidence.',
    path: '/reading-classes-for-kids',
    cta: 'Explore Reading',
  },
  {
    title: 'Grammar & Sentence Building',
    ages: 'Ages 4–12',
    description: 'Sentence structure, grammar foundations, tenses, vocabulary, writing clarity, and accurate expression.',
    path: '/grammar',
    cta: 'Explore Grammar',
  },
  {
    title: 'Speaking & Communication',
    ages: 'Ages 5–12',
    description: 'Longer answers, pronunciation, storytelling, presentation skills, confidence, clarity, and public speaking.',
    path: '/speaking',
    cta: 'Explore Speaking',
  },
]

export function LearningPathsSection() {
  return (
    <section className="px-6 py-10 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Choose the right focus</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Four clear Tiny Steps learning paths</h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            Start with the skill your child needs most. The assessment helps confirm the right level and learning path.
          </p>
        </div>

        <div className="mt-7 grid gap-3.5 md:grid-cols-2">
          {learningPaths.map((item) => (
            <Link
              key={item.title}
              to={item.path}
              className="group rounded-[22px] border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.05)] sm:p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">{item.title}</h3>
                  <p className="mt-1 text-xs font-medium text-slate-500">{item.ages}</p>
                </div>
                <span className="text-lg text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" aria-hidden="true">→</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-700">
{item.cta}
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <Link
            to="/courses"
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-950"
          >
            Need a specialist path? View all courses <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

const differentiators = [
  {
    title: 'One clear skill focus',
    description: 'Each lesson works toward a defined objective instead of moving through unrelated activities.',
  },
  {
    title: 'Model → practise → retry',
    description: 'Teachers model the skill, guide the child through practice, correct errors, and give another attempt in real time.',
  },
  {
    title: 'Support changes with the child',
    description: 'Prompts, examples, repetition, and practice time can change while the learning objective stays structured.',
  },
  {
    title: 'Parents can see the next step',
    description: 'Updates connect what was taught, what still needs practice, and the next learning focus.',
  },
];

export function WhyTinyStepsSection() {
  return (
    <section className="bg-slate-50/70 px-6 py-10 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">Why Tiny Steps</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.15rem]">A clear learning system, not random online classes</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
              The purpose of the programme is to make the child’s next step understandable to the teacher, the child, and the parent.
            </p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
              <Link to="/why-tiny-steps" className="text-sky-700 underline decoration-sky-300 underline-offset-4 hover:text-sky-900">
                Learn more about the Tiny Steps approach
              </Link>
              <Link to="/testimonials" className="text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-900">
                Read parent testimonials
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {differentiators.map((item, index) => (
              <article key={item.title} className="rounded-[20px] border border-slate-200 bg-white p-4 sm:p-5">
                <div className="text-xs font-bold tracking-[0.18em] text-slate-400">0{index + 1}</div>
                <h3 className="mt-2 text-base font-semibold text-slate-950 sm:text-lg">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function InlineClassSample({ sample }: { sample: ClassSampleItem }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const canPlay = isValidYouTubeVideoId(sample.youtubeVideoId);
  const thumbnailUrl = canPlay ? `https://i.ytimg.com/vi/${sample.youtubeVideoId}/hqdefault.jpg` : '';

  return (
    <article className="overflow-hidden rounded-[24px] border border-white/15 bg-white/10 backdrop-blur-sm">
      <div className="aspect-video bg-slate-950">
        {canPlay && isPlaying ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${sample.youtubeVideoId}?rel=0&modestbranding=1&autoplay=1`}
            title={`${sample.title} | Tiny Steps class sample`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            className="h-full w-full border-0"
          />
        ) : canPlay ? (
          <button
            type="button"
            onClick={() => setIsPlaying(true)}
            className="group relative h-full w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label={`Play class sample: ${sample.title}`}
          >
            <img
              src={thumbnailUrl}
              alt={`${sample.title} class sample thumbnail`}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-slate-950/25" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-slate-950 shadow-xl transition group-hover:scale-105">
                <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-current" aria-hidden="true">
                  <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 000-1.68L9.54 5.98A1 1 0 008 6.82z" />
                </svg>
              </span>
            </div>
          </button>
        ) : null}
      </div>
      <div className="p-4">
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-200">
          <span>{CLASS_SAMPLE_CATEGORY_LABELS[sample.category]}</span>
          {sample.ageBand ? <span>• {sample.ageBand}</span> : null}
        </div>
        <h3 className="mt-2 text-base font-semibold text-white">{sample.title}</h3>
        {sample.description ? <p className="mt-2 text-sm leading-6 text-slate-200">{sample.description}</p> : null}
      </div>
    </article>
  );
}

export function ClassSamplesSection() {
  const [samples, setSamples] = useState<ClassSampleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSamples() {
      try {
        const [{ collection, getDocs, limit, query, where }, { db }] = await Promise.all([
          import('firebase/firestore'),
          import('../../lib/firebaseConfig'),
        ]);
        const ref = query(collection(db, 'classSamples'), where('active', '==', true), limit(24));
        const snap = await getDocs(ref);
        const nextSamples = snap.docs.map((entry) => toClassSampleItem(entry.id, entry.data()));
        if (!cancelled) setSamples(nextSamples);
      } catch (error) {
        console.warn('[HomePage] unable to load class sample previews', error);
        if (!cancelled) setSamples([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadSamples();
    return () => {
      cancelled = true;
    };
  }, []);

  const previewSamples = useMemo(
    () =>
      samples
        .filter((sample) => sample.active && isValidYouTubeVideoId(sample.youtubeVideoId))
        .sort((a, b) => Number(b.featured) - Number(a.featured) || a.sortOrder - b.sortOrder)
        .slice(0, 3),
    [samples],
  );

  return (
    <section id="home-class-samples" className="px-6 py-14">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[34px] border border-slate-200 bg-[linear-gradient(145deg,#0f172a_0%,#172554_56%,#312e81_100%)] p-6 text-white shadow-[0_28px_80px_rgba(15,23,42,0.2)] sm:p-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">Class Samples</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">See how Tiny Steps classes actually work</h2>
          <p className="mt-4 text-sm leading-7 text-slate-200 sm:text-base">
            Watch real class moments to see how teachers explain, how actively children participate, and how mistakes are corrected before you compare plans.
          </p>
        </div>

        {isLoading ? (
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-[24px] border border-white/10 bg-white/10">
                <div className="aspect-video animate-pulse bg-white/10" />
                <div className="p-4">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
                  <div className="mt-3 h-3 w-full animate-pulse rounded bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        ) : previewSamples.length > 0 ? (
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {previewSamples.map((sample) => (
              <InlineClassSample key={sample.id} sample={sample} />
            ))}
          </div>
        ) : (
          <div className="mt-7 rounded-[24px] border border-white/15 bg-white/10 px-5 py-5 text-sm leading-6 text-slate-200">
            Class sample previews are available on the full Class Samples page.
          </div>
        )}

        <div className="mt-7">
          <Link
            to="/class-samples"
            className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
          >
            View All Class Samples
          </Link>
        </div>
      </div>
    </section>
  );
}

export function HomeFaqSection({ items }: { items: HomeFaqItem[] }) {
  return (
    <section className="px-6 py-12 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Before you book</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Popular parent questions</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Quick answers to the questions families most often ask before choosing a class format or booking the assessment.
          </p>
        </div>

        <div className="mt-7 grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <details
              key={item.question}
              className="group rounded-[20px] border border-slate-200 bg-white px-4 py-4 transition open:border-slate-300 open:bg-slate-50/60"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-sm font-semibold leading-6 text-slate-950 marker:hidden sm:text-[0.95rem]">
                <span>{item.question}</span>
                <span
                  aria-hidden="true"
                  className="mt-0.5 text-lg font-normal leading-none text-slate-400 transition group-open:rotate-45 group-open:text-slate-700"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 border-t border-slate-100 pt-3 text-sm leading-6 text-slate-600">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
