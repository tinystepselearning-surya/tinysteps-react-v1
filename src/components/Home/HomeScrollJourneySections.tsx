import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PUBLIC_SESSION_DURATION_LABEL, PUBLIC_SITE_FACTS } from '../../config/publicFacts';
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
    <section className="px-6 py-9 sm:py-12">
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
  { value: PUBLIC_SESSION_DURATION_LABEL, label: 'standard 1:1 class' },
  { value: 'Weekly', label: 'parent progress visibility' },
];

export function TrustSnapshotSection() {
  return (
    <section className="px-6 pb-10">
      <div className="mx-auto max-w-6xl rounded-[28px] border border-slate-200 bg-slate-950 px-5 py-6 text-white shadow-[0_22px_60px_rgba(15,23,42,0.14)] sm:px-8">
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
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

const ageStartingPoints = [
  ['3–4', 'Not speaking clearly', 'Vocabulary, sounds, confidence'],
  ['5–6', 'Knows letters but cannot read', 'Phonics, blending, CVC'],
  ['7–8', 'Reads slowly, grammar mistakes', 'Fluency + grammar basics'],
  ['9–12', 'Hesitates to speak', 'Public speaking, sentence confidence'],
];

export function AssessmentStartPointsSection() {
  return (
    <section id="free-assessment-checklist" className="px-6 py-8">
      <div className="mx-auto grid max-w-[84rem] gap-6 lg:grid-cols-[1.08fr_0.92fr] xl:gap-8">
        <div className="relative overflow-hidden rounded-[34px] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.95)_0%,rgba(245,252,255,0.96)_30%,rgba(236,245,255,0.96)_62%,rgba(255,248,238,0.95)_100%)] p-6 shadow-[0_30px_90px_rgba(62,84,120,0.14)] ring-1 ring-white/80 sm:p-8">
          <div className="inline-flex rounded-full border border-sky-200 bg-white px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-900">
            One free 35-minute 1:1 demo assessment
          </div>
          <h2 className="mt-5 max-w-xl text-2xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-[2.15rem] sm:leading-[1.08]">
            What we check before recommending a starting point
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-700 sm:text-base">
            The assessment helps the teacher see where your child is secure, where they are getting stuck, and which Tiny Steps pathway should come next.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {assessmentChecks.map((item) => (
              <div key={item} className="rounded-[20px] border border-white bg-white/90 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                {item}
              </div>
            ))}
          </div>
          <Link
            to="/book-demo"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Book Free 35-Minute Demo
          </Link>
        </div>

        <div className="relative overflow-hidden rounded-[34px] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.96)_0%,rgba(240,248,255,0.97)_45%,rgba(247,244,255,0.95)_100%)] p-6 shadow-[0_30px_90px_rgba(62,84,120,0.14)] ring-1 ring-white/80 sm:p-8">
          <div className="inline-flex rounded-full border border-violet-200 bg-white px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-900">
            Age guidance
          </div>
          <h2 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-[2.15rem]">Common starting points by age</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">Age helps us ask the right questions, but placement is based on the child’s actual skill level.</p>

          <div className="mt-5 space-y-3 sm:hidden">
            {ageStartingPoints.map(([age, concern, focus]) => (
              <article key={age} className="rounded-[20px] border border-white bg-white/90 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-sm font-bold text-violet-800">Age {age}</span>
                  <span className="text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Starting point</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">{concern}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">Focus: {focus}</p>
              </article>
            ))}
          </div>

          <div className="mt-5 hidden overflow-hidden rounded-[24px] border border-white bg-white/90 shadow-sm sm:block">
            <table className="w-full table-fixed border-collapse text-left text-sm text-slate-700">
              <colgroup>
                <col className="w-[18%]" />
                <col className="w-[38%]" />
                <col className="w-[44%]" />
              </colgroup>
              <thead className="bg-slate-50 text-slate-900">
                <tr>
                  <th className="px-5 py-4 font-semibold">Age</th>
                  <th className="px-5 py-4 font-semibold">Parent concern</th>
                  <th className="px-5 py-4 font-semibold">Tiny Steps focus</th>
                </tr>
              </thead>
              <tbody>
                {ageStartingPoints.map(([age, concern, focus]) => (
                  <tr key={age} className="border-t border-slate-200">
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">{age}</td>
                    <td className="px-5 py-4 leading-6">{concern}</td>
                    <td className="px-5 py-4 leading-6">{focus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

const learningPaths = [
  {
    title: 'Phonics & Reading',
    ages: 'Ages 3–12',
    description: 'Letter sounds, blending, decoding, CVC words, reading patterns, fluency, and stronger independent reading.',
    path: '/phonics',
    cta: 'Explore Phonics',
    accent: 'emerald',
    icon: '📚',
  },
  {
    title: 'Grammar & Sentence Building',
    ages: 'Ages 4–12',
    description: 'Sentence structure, grammar foundations, tenses, vocabulary, writing clarity, and accurate expression.',
    path: '/grammar',
    cta: 'Explore Grammar',
    accent: 'sky',
    icon: '✏️',
  },
  {
    title: 'Speaking & Communication',
    ages: 'Ages 5–12',
    description: 'Longer answers, pronunciation, storytelling, presentation skills, confidence, clarity, and public speaking.',
    path: '/speaking',
    cta: 'Explore Speaking',
    accent: 'amber',
    icon: '🎤',
  },
];

const accentClasses: Record<string, string> = {
  emerald: 'from-emerald-50 via-white to-white text-emerald-700',
  sky: 'from-sky-50 via-white to-white text-sky-700',
  amber: 'from-amber-50 via-white to-white text-amber-700',
};

export function LearningPathsSection() {
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Choose the right focus</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Three clear Tiny Steps learning paths</h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            Start with the skill your child needs most. The assessment helps confirm the right level and learning path.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {learningPaths.map((item) => (
            <Link
              key={item.title}
              to={item.path}
              className={`group rounded-[30px] border border-slate-200 bg-gradient-to-br p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.1)] ${accentClasses[item.accent]}`}
            >
              <div className="text-3xl">{item.icon}</div>
              <h3 className="mt-4 text-xl font-bold text-slate-900">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{item.ages}</p>
              <p className="mt-3 text-sm leading-7 text-slate-700">{item.description}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">
                {item.cta} <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

const differentiators = [
  {
    title: 'Assessment-led placement',
    description: 'The starting point is based on the child’s current skills, not only age or school grade.',
  },
  {
    title: 'Structured progression',
    description: 'Each pathway moves through named learning stages instead of unrelated topics from class to class.',
  },
  {
    title: 'Live child participation',
    description: 'Children read, speak, answer, practise, make mistakes, and try again with teacher guidance in real time.',
  },
  {
    title: 'Visible parent progress',
    description: 'Parents receive clear updates on what was taught, what improved, and what the next focus should be.',
  },
];

export function WhyTinyStepsSection() {
  return (
    <section className="bg-slate-50 px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">Why Tiny Steps</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">A clear learning system, not random online classes</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              The purpose of the programme is to make the child’s next step understandable to the teacher, the child, and the parent.
            </p>
            <Link to="/why-tiny-steps" className="mt-5 inline-flex text-sm font-semibold text-sky-700 underline decoration-sky-300 underline-offset-4 hover:text-sky-900">
              Learn more about the Tiny Steps approach
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {differentiators.map((item, index) => (
              <article key={item.title} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-xs font-bold tracking-[0.18em] text-slate-400">0{index + 1}</div>
                <h3 className="mt-3 text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const evidenceItems = [
  {
    title: 'Global learner footprint',
    description: 'See the countries represented in the Tiny Steps learner community.',
    path: '#global-learners-proof',
    label: 'View global reach below',
  },
  {
    title: 'Observable teaching',
    description: 'See real class samples and understand how teachers guide participation.',
    path: '#home-class-samples',
    label: 'Preview class samples below',
  },
  {
    title: 'Parent voice',
    description: 'Read parent feedback from families sharing their Tiny Steps learning experience.',
    path: '/testimonials',
    label: 'Read parent testimonials',
  },
  {
    title: 'Progress visibility',
    description: 'See how learning goals, parent updates, and next steps stay visible throughout the journey.',
    path: '/why-tiny-steps',
    label: 'See how progress is shared',
  },
];

export function TrustEvidenceSection() {
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Proof you can inspect</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">See the learning experience before you decide</h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            Explore the teaching style, parent feedback, learning structure, and progress visibility that sit behind the Tiny Steps experience.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {evidenceItems.map((item) => {
            const isAnchor = item.path.startsWith('#');
            const className = 'rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md';
            const content = (
              <>
                <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                <span className="mt-4 inline-flex text-sm font-semibold text-sky-700">{item.label} →</span>
              </>
            );
            return isAnchor ? (
              <a key={item.title} href={item.path} className={className}>{content}</a>
            ) : (
              <Link key={item.title} to={item.path} className={className}>{content}</Link>
            );
          })}
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
    <section className="px-6 py-14">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Before you book</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">A few practical parent questions</h2>
        </div>
        <div className="mt-8 space-y-3">
          {items.map((item) => (
            <details key={item.question} className="group rounded-[22px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <summary className="cursor-pointer list-none pr-8 text-base font-semibold text-slate-900 marker:hidden">
                {item.question}
              </summary>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
