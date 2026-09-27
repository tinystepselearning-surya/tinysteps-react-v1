import { Link } from 'react-router-dom';
import { PUBLIC_AGE_RANGE_LABEL } from '../../config/publicFacts';

const pathwayLinks = [
  { label: 'Phonics', href: '/phonics' },
  { label: 'Reading', href: '/reading-classes-for-kids' },
  { label: 'Grammar & Sentence Building', href: '/grammar' },
  { label: 'Speaking & Communication', href: '/speaking' },
];

export default function HomeEntitySummarySection() {
  return (
    <section aria-labelledby="home-entity-summary-heading" className="px-6 py-4 sm:py-5">
      <div className="mx-auto max-w-6xl rounded-[20px] border border-slate-200 bg-white px-5 py-5 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-3xl">
            <h2
              id="home-entity-summary-heading"
              className="text-lg font-semibold tracking-tight text-slate-950 sm:text-xl"
            >
              Tiny Steps Learning at a glance
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-[0.95rem] sm:leading-7">
              Tiny Steps Learning is a live online English learning school for {PUBLIC_AGE_RANGE_LABEL}. Families in India and worldwide use
              assessment-led 1:1 and small-group pathways in phonics, reading, grammar and sentence building, and speaking and communication.
            </p>
          </div>

          <nav
            aria-label="Core Tiny Steps learning pathways"
            className="flex flex-wrap gap-2 lg:max-w-[28rem] lg:justify-end"
          >
            {pathwayLinks.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="rounded-full border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-950"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-xs font-semibold leading-5">
          <Link
            to="/online-english-classes-for-kids"
            className="text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-950"
          >
            Explore the online English programme
          </Link>
          <Link
            to="/curriculum"
            className="text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-950"
          >
            View curriculum
          </Link>
        </div>
      </div>
    </section>
  );
}
