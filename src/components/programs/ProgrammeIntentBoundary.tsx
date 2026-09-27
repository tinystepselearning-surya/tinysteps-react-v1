import { ArrowUpRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ProgrammeAiVisibility } from '../../lib/programmeAiVisibility';

type ProgrammeIntentBoundaryProps = {
  config: Readonly<ProgrammeAiVisibility>;
};

const accentByPath: Record<string, string> = {
  '/reading-classes-for-kids': 'bg-sky-50/70 border-sky-100',
  '/grammar': 'bg-orange-50/55 border-orange-100',
  '/speaking': 'bg-violet-50/55 border-violet-100',
};

export default function ProgrammeIntentBoundary({ config }: ProgrammeIntentBoundaryProps) {
  const accent = accentByPath[config.path] ?? 'bg-slate-50/70 border-slate-100';

  return (
    <section
      data-ai-intent-boundary={config.path}
      className="px-4 py-5 sm:px-5 md:py-7 lg:px-6"
    >
      <div className={`mx-auto max-w-6xl overflow-hidden rounded-[26px] border ${accent}`}>
        <div className="grid lg:grid-cols-[1.04fr_0.96fr]">
          <div className="p-5 md:p-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Programme fit
            </p>
            <h2 className="mt-2 max-w-2xl text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-[2rem]">
              When {config.ownerLabel} is the right fit
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
              {config.ownerIntent}.
            </p>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {config.useFor.map((item) => (
                <div key={item} className="flex items-start gap-2.5 text-sm leading-5 text-slate-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm">
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/80 bg-white/68 p-5 backdrop-blur lg:border-l lg:border-t-0 md:p-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Use another pathway when
            </p>
            <div className="mt-3 grid gap-2.5">
              {config.handoffs.map((handoff) => (
                <Link
                  key={handoff.path}
                  to={handoff.path}
                  className="group flex items-start justify-between gap-4 rounded-[16px] border border-slate-200/80 bg-white/90 px-4 py-3 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{handoff.label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600 sm:text-sm">{handoff.when}.</p>
                  </div>
                  <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-slate-600" aria-hidden="true" />
                </Link>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              If needs overlap, the free assessment identifies the primary starting point before a programme is recommended.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
