import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { GRAMMAR_REFERENCE_EXTENSION_ROUTE_MANIFEST } from '../../lib/grammarReferenceExtensionSeoManifest.js';

const GrammarReferenceExtensionGuideGrid: FC = () => (
  <section
    data-grammar-reference-extension
    aria-labelledby="grammar-reference-extension"
    className="border-b border-slate-200 bg-slate-50/60"
  >
    <div className="mx-auto max-w-7xl px-6 py-12 sm:py-14">
      <div className="max-w-4xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Grammar reference library</p>
        <h2 id="grammar-reference-extension" className="mt-3 text-3xl font-black tracking-[-0.025em] text-slate-950 sm:text-4xl">
          Go deeper when the core sequence needs more explanation
        </h2>
        <p className="mt-4 text-base leading-8 text-slate-600">
          These focused references deepen high-value topics such as determiner choice, countability, noun phrases, verb forms and word order. They support the 38-step learning sequence; they do not add hidden curriculum steps or replace the established pathway.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {GRAMMAR_REFERENCE_EXTENSION_ROUTE_MANIFEST.map((entry, index) => (
          <Link
            key={entry.path}
            to={entry.path}
            className="group flex min-h-[210px] flex-col rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_18px_42px_rgba(15,23,42,0.08)]"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-emerald-200 bg-emerald-50 text-xs font-black text-emerald-800">
                R{index + 1}
              </span>
              <h3 className="text-lg font-black leading-6 text-slate-950 group-hover:text-emerald-800">{entry.cardTitle}</h3>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">{entry.description}</p>
            <span className="mt-auto pt-5 text-sm font-black text-emerald-800">Open reference guide →</span>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

export default GrammarReferenceExtensionGuideGrid;
