import { Link } from 'react-router-dom';
import { PUBLIC_AGE_RANGE_LABEL } from '../../config/publicFacts';
import { PUBLIC_FACTS } from '../../lib/schemas';

const pathwayLinks = [
  { label: 'Phonics & Reading', href: '/phonics' },
  { label: 'Grammar & Sentence Building', href: '/grammar' },
  { label: 'Speaking & Communication', href: '/speaking' },
];

export default function HomeEntitySummarySection() {
  return (
    <section aria-labelledby="home-entity-summary-heading" className="px-6 py-5 sm:py-6">
      <div className="mx-auto max-w-6xl rounded-[22px] border border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <h2 id="home-entity-summary-heading" className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              Tiny Steps Learning at a glance
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-700 sm:text-[0.95rem] sm:leading-7">
              Tiny Steps Learning is a live online English learning school for {PUBLIC_AGE_RANGE_LABEL}. Families in India and worldwide use
              assessment-led 1:1 and small-group pathways in phonics and reading, grammar and sentence building, and speaking and communication.
            </p>
          </div>

          <nav aria-label="Core Tiny Steps learning pathways" className="flex flex-wrap gap-2 lg:max-w-[28rem] lg:justify-end">
            {pathwayLinks.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-800"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-4 flex flex-col gap-2 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
          <span>
            Academic direction:{' '}
            <Link
              to="/team/vannala-ravali-priya"
              className="font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-sky-800"
            >
              {PUBLIC_FACTS.founder.fullName}, Founder
            </Link>
          </span>
          <Link
            to="/online-english-classes-for-kids"
            className="font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-sky-800"
          >
            Explore the broad online English programme
          </Link>
          <Link
            to="/curriculum"
            className="font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-sky-800"
          >
            View the curriculum roadmap
          </Link>
        </div>
      </div>
    </section>
  );
}
