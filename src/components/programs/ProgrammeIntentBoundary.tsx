import { Link } from 'react-router-dom';
import type { ProgrammeAiVisibility } from '../../lib/programmeAiVisibility';

type ProgrammeIntentBoundaryProps = {
  config: Readonly<ProgrammeAiVisibility>;
};

export default function ProgrammeIntentBoundary({ config }: ProgrammeIntentBoundaryProps) {
  return (
    <section
      data-ai-intent-boundary={config.path}
      className="px-4 pb-8 sm:px-5 md:pb-10 lg:px-6"
    >
      <div className="mx-auto max-w-6xl rounded-[24px] border border-slate-200 bg-white p-5 md:p-7">
        <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr] lg:gap-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
              Programme fit
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              When {config.ownerLabel} is the right fit
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
              {config.ownerIntent}.
            </p>

            <div className="mt-5 space-y-2">
              {config.useFor.map((item) => (
                <div key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                  <span aria-hidden="true" className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Choose a different pathway when
            </p>
            <div className="mt-3 grid gap-3">
              {config.handoffs.map((handoff) => (
                <Link
                  key={handoff.path}
                  to={handoff.path}
                  className="group rounded-[18px] border border-slate-200 bg-slate-50/60 px-4 py-3.5 transition hover:border-slate-300 hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{handoff.label}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{handoff.when}.</p>
                    </div>
                    <span aria-hidden="true" className="text-slate-300 transition group-hover:text-slate-500">→</span>
                  </div>
                </Link>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              If two needs overlap, the free assessment is used to identify the primary starting point before a programme is recommended.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
