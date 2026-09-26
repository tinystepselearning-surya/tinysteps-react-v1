import { Link } from 'react-router-dom';
import {
  PUBLIC_AGE_RANGE_LABEL,
  PUBLIC_LEARNER_REACH_LABEL,
  PUBLIC_SESSION_DURATION_LABEL,
  PUBLIC_SITE_FACTS,
} from '../../config/publicFacts';
import { PUBLIC_FACTS } from '../../lib/schemas';

const pathways = [
  {
    title: 'Phonics & Reading',
    href: '/phonics',
    summary: 'Letter sounds, blending, decoding, spelling patterns and reading fluency.',
  },
  {
    title: 'Grammar & Sentence Building',
    href: '/grammar',
    summary: 'Sentence structure, grammar accuracy, vocabulary, writing clarity and stronger expression.',
  },
  {
    title: 'Speaking & Communication',
    href: '/speaking',
    summary: 'Longer answers, pronunciation, storytelling, presentations and public-speaking confidence.',
  },
];

const quickFacts = [
  ['Age range', PUBLIC_AGE_RANGE_LABEL],
  ['Class format', 'Live 1:1 and small-group'],
  ['Standard 1:1 class', PUBLIC_SESSION_DURATION_LABEL],
  [
    'Free assessment',
    `One free ${PUBLIC_SITE_FACTS.standardOffer.demoDurationMinutes}-minute 1:1 online demo assessment`,
  ],
  ['Learner reach', PUBLIC_LEARNER_REACH_LABEL],
  ['Service area', 'India and worldwide online'],
];

export default function HomeEntitySummarySection() {
  return (
    <section
      aria-labelledby="home-entity-summary-heading"
      className="px-6 py-10 sm:py-12"
    >
      <div className="mx-auto max-w-6xl rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_54px_rgba(15,23,42,0.06)] sm:p-8">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
            Tiny Steps Learning · Quick facts
          </p>
          <h2
            id="home-entity-summary-heading"
            className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
          >
            What is Tiny Steps Learning?
          </h2>
          <p
            id="home-entity-summary-copy"
            className="mt-4 text-sm leading-7 text-slate-700 sm:text-base"
          >
            Tiny Steps Learning is a live online English learning school for children aged 3–12.
            Families in India and worldwide use structured 1:1 and small-group learning paths for
            phonics and reading, grammar and sentence building, and speaking and communication.
            Placement starts with the child&apos;s current skill level rather than age alone.
          </p>
        </div>

        <dl className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickFacts.map(([label, value]) => (
            <div key={label} className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</dt>
              <dd className="mt-1.5 text-sm font-semibold leading-6 text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8">
          <h3 className="text-lg font-bold text-slate-900">Core learning pathways</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {pathways.map((pathway) => (
              <Link
                key={pathway.href}
                to={pathway.href}
                className="rounded-[22px] border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
              >
                <div className="text-base font-semibold text-slate-900">{pathway.title}</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{pathway.summary}</p>
                <span className="mt-4 inline-flex text-sm font-semibold text-sky-700">
                  Explore pathway →
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-4 border-t border-slate-200 pt-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-3xl text-sm leading-7 text-slate-600">
            Academic direction is led by{' '}
            <Link
              to="/team/vannala-ravali-priya"
              className="font-semibold text-slate-800 underline decoration-slate-300 underline-offset-4 hover:text-sky-800"
            >
              {PUBLIC_FACTS.founder.fullName}, Founder of Tiny Steps Learning
            </Link>
            . Parents can review the complete programme structure before choosing a class.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/online-english-classes-for-kids"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400"
            >
              Online English Classes
            </Link>
            <Link
              to="/curriculum"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              View Curriculum
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
