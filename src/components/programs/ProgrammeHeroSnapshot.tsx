import type { ReactNode } from 'react';
import { BookOpenText, MessageCircleMore, PenLine, Sparkles } from 'lucide-react';

type ProgrammeHeroSnapshotProps = {
  eyebrow: string;
  title: string;
  summary: string;
  items: readonly string[];
  footer?: ReactNode;
  variant?: 'reading' | 'grammar' | 'speaking';
  appearance?: 'default' | 'glass-overlay';
};

const visualConfig = {
  reading: {
    label: 'Read → understand → explain',
    icon: BookOpenText,
    accent: 'from-sky-100/90 via-white to-orange-50/80',
    orb: 'bg-sky-300/35',
    secondaryOrb: 'bg-orange-200/45',
  },
  grammar: {
    label: 'Notice → correct → apply',
    icon: PenLine,
    accent: 'from-orange-100/90 via-white to-sky-50/80',
    orb: 'bg-orange-300/35',
    secondaryOrb: 'bg-sky-200/45',
  },
  speaking: {
    label: 'Think → organise → speak',
    icon: MessageCircleMore,
    accent: 'from-violet-100/80 via-white to-orange-50/80',
    orb: 'bg-violet-300/35',
    secondaryOrb: 'bg-orange-200/45',
  },
} as const;

export default function ProgrammeHeroSnapshot({
  eyebrow,
  title,
  summary,
  items,
  footer,
  variant = 'grammar',
  appearance = 'default',
}: ProgrammeHeroSnapshotProps) {
  const visual = visualConfig[variant];
  const VisualIcon = visual.icon;

  if (appearance === 'glass-overlay') {
    return (
      <aside
        data-premium-programme-visual={variant}
        className="w-full rounded-[24px] border border-white/75 bg-white/72 p-4 shadow-[0_22px_64px_rgba(15,23,42,0.12)] backdrop-blur-2xl sm:p-5"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-slate-950 text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]">
            <VisualIcon className="h-4.5 w-4.5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">{eyebrow}</p>
            <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-700">{visual.label}</p>
          </div>
        </div>

        <h2 className="mt-3 text-lg font-semibold tracking-[-0.025em] text-slate-950 sm:text-xl">{title}</h2>
        <p className="mt-1.5 text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">{summary}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {items.slice(0, 5).map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/85 bg-white/74 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm"
            >
              {item}
            </span>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside
      data-premium-programme-visual={variant}
      className="relative w-full overflow-hidden rounded-[30px] border border-white/80 bg-white/72 shadow-[0_26px_70px_rgba(15,23,42,0.10)] backdrop-blur-xl lg:ml-auto lg:max-w-[560px]"
    >
      <div className={`relative h-[170px] overflow-hidden border-b border-white/80 bg-gradient-to-br ${visual.accent} sm:h-[190px]`}>
        <div className={`absolute -left-12 -top-14 h-44 w-44 rounded-full blur-3xl ${visual.orb}`} />
        <div className={`absolute -bottom-16 -right-8 h-48 w-48 rounded-full blur-3xl ${visual.secondaryOrb}`} />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(15,23,42,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,.5)_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/80 bg-white/78 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600 shadow-sm backdrop-blur md:left-6 md:top-6">
          <Sparkles className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" />
          {visual.label}
        </div>

        <div className="absolute inset-x-5 bottom-5 grid grid-cols-[auto_1fr] items-center gap-4 rounded-[22px] border border-white/90 bg-white/78 p-4 shadow-[0_18px_44px_rgba(15,23,42,0.08)] backdrop-blur-xl md:inset-x-6 md:bottom-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-slate-950 text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]">
            <VisualIcon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{eyebrow}</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-950 sm:text-base">{items.slice(0, 3).join(' · ')}</p>
          </div>
        </div>
      </div>

      <div className="p-5 md:p-6">
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">{title}</h2>
        <p className="mt-2.5 text-sm leading-6 text-slate-600 sm:text-[15px]">{summary}</p>

        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2.5">
          {items.map((item) => (
            <div key={item} className="flex min-w-0 items-center gap-2 text-sm font-medium leading-5 text-slate-700">
              <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        {footer ? (
          <div className="mt-5 border-t border-slate-200/80 pt-4 text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">
            {footer}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
