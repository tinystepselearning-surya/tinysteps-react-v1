import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { GRAMMAR_PROGRAMMATIC_SEQUENCE } from '../../lib/grammarProgrammaticRegistry.js';

const GrammarProgrammaticGuideGrid: FC = () => (
  <section
    data-grammar-programmatic-sequence
    aria-labelledby="grammar-programmatic-sequence"
    className="border-y border-slate-200 bg-white"
  >
    <div className="mx-auto max-w-7xl px-6 py-12 sm:py-14">
      <div className="max-w-4xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Grammar learning sequence</p>
        <h2 id="grammar-programmatic-sequence" className="mt-3 text-3xl font-black tracking-[-0.025em] text-slate-950 sm:text-4xl">
          Key grammar skills in a clear learning order
        </h2>
        <p className="mt-4 text-base leading-8 text-slate-600">
          Move from word foundations into sentence building, tense control and connected writing. The sequence follows the Tiny Steps curriculum progression, while existing substantial guides remain the canonical owner where they already cover a topic well.
        </p>
      </div>

      <ol className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {GRAMMAR_PROGRAMMATIC_SEQUENCE.map((entry) => (
          <li key={entry.id}>
            <Link
              to={entry.path}
              className="group flex h-full gap-3 rounded-2xl border border-slate-200 bg-slate-50/65 p-4 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-sm"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-emerald-200 bg-emerald-50 text-xs font-black text-emerald-800">
                {String(entry.order).padStart(2, '0')}
              </span>
              <span className="min-w-0">
                <span className="block text-base font-black leading-6 text-slate-950 group-hover:text-emerald-800">
                  {'cardTitle' in entry ? entry.cardTitle : entry.label}
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-600">
                  {entry.state === 'published'
                    ? 'Focused concept guide with examples, common mistakes and practice.'
                    : 'Open the established in-depth guide for this topic.'}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  </section>
);

export default GrammarProgrammaticGuideGrid;
