import type { ReactNode } from 'react';

type ProgrammeHeroSnapshotProps = {
  eyebrow: string;
  title: string;
  summary: string;
  items: readonly string[];
  footer?: ReactNode;
};

export default function ProgrammeHeroSnapshot({
  eyebrow,
  title,
  summary,
  items,
  footer,
}: ProgrammeHeroSnapshotProps) {
  return (
    <aside className="w-full rounded-[24px] border border-slate-200 bg-white p-5 md:p-6 lg:ml-auto lg:max-w-[560px]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">{summary}</p>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-[16px] border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-semibold leading-5 text-slate-800"
          >
            {item}
          </div>
        ))}
      </div>

      {footer ? (
        <div className="mt-5 border-t border-slate-200 pt-4 text-sm leading-6 text-slate-600">
          {footer}
        </div>
      ) : null}
    </aside>
  );
}
