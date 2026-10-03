// @ts-nocheck
import React, { useId, useState } from 'react';
import { cn } from '../lib/utils';

export type DayItem = {
  day?: number | string;
  title?: string;
  learns?: string[];
  activities?: string[];
  homework?: string[];
};

export type WeekItem = {
  title: string; // e.g., "Stage 1 — Sentence Foundations"
  focus?: string;
  learns?: string[]; // learning outcomes
  activities?: string[];
  homework?: string[];
  mastery?: string; // mastery check / output
  lessons?: string[]; // lesson list for the stage
  days?: DayItem[]; // optional day-by-day breakdown
};

const accents = [
  { border: 'from-[#ffe4c7] via-[#fff3df] to-white', pill: 'from-[#ffb347] to-[#ff8f5c]' },
  { border: 'from-[#dff1ff] via-white to-[#eef7ff]', pill: 'from-[#59c3ff] to-[#7ddff8]' },
  { border: 'from-[#f5e8ff] via-white to-[#fef0ff]', pill: 'from-[#c084fc] to-[#a855f7]' },
  { border: 'from-[#e4fdee] via-white to-[#fdf5d8]', pill: 'from-[#34d399] to-[#a3e635]' }
];

type WeekAccordionProps = {
  items: WeekItem[];
  defaultOpenAll?: boolean;
  defaultOpenFirst?: boolean;
  variant?: 'default' | 'editorial';
  outcomesLabel?: string;
};

export const WeekAccordion: React.FC<WeekAccordionProps> = ({
  items,
  defaultOpenAll = false,
  defaultOpenFirst = true,
  variant = 'default',
  outcomesLabel = 'What we learn',
}) => {
  const editorial = variant === 'editorial';
  const [open, setOpen] = useState(() =>
    items.map((_, index) => defaultOpenAll || (defaultOpenFirst && index === 0)),
  );
  const [openDays, setOpenDays] = useState(() => items.map(() => false));
  const baseId = useId();

  const toggle = (i: number) => setOpen((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  const expandAll = () => setOpen(items.map(() => true));
  const collapseAll = () => setOpen(items.map(() => false));
  const toggleDays = (i: number) => setOpenDays((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  return (
    <div className={editorial ? 'space-y-3' : 'space-y-4'}>
      <div className={editorial ? 'mb-2 flex flex-wrap items-center gap-2.5 text-sm' : 'mb-3 flex flex-wrap items-center gap-3 text-sm'}>
        <button
          type="button"
          className="rounded-full border border-gray-200 bg-white px-4 py-1.5 font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          onClick={expandAll}
        >
          Expand all stages
        </button>
        <button
          type="button"
          className="rounded-full border border-gray-200 bg-white px-4 py-1.5 font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          onClick={collapseAll}
        >
          Collapse all stages
        </button>
        <span className="text-xs leading-5 text-gray-500 sm:ml-1">
          Open a stage to compare its goal, lessons, and learning outcomes.
        </span>
      </div>

      {items.map((w, i) => {
        const id = `${baseId}-${i}`;
        const isOpen = open[i];
        const accent = accents[i % accents.length];

        return (
          <div
            key={w.title}
            className={
              editorial
                ? 'overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)]'
                : `rounded-[32px] bg-gradient-to-r p-[1px] ${accent.border} shadow-card-hover`
            }
          >
            <div className={editorial ? 'bg-white' : 'overflow-hidden rounded-[28px] bg-white/95'}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={id}
                className={
                  editorial
                    ? 'grid w-full grid-cols-[auto_1fr_auto] items-start gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400 sm:px-5'
                    : 'flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-slate-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 sm:items-center'
                }
                onClick={() => toggle(i)}
              >
                <div
                  className={
                    editorial
                      ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-xs font-bold text-white shadow-sm'
                      : `flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accent.pill} font-semibold text-white shadow-md`
                  }
                >
                  S{i + 1}
                </div>
                <div className="min-w-0">
                  {editorial ? (
                    <>
                      <span className="block text-[15px] font-bold leading-6 text-slate-950 sm:text-base">{w.title}</span>
                      {w.focus ? <span className="mt-0.5 block text-xs leading-5 text-slate-500 sm:text-[13px]">{w.focus}</span> : null}
                    </>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-900">{w.title}</span>
                      {w.focus && (
                        <span className="rounded-full bg-gray-100 px-3 py-0.5 text-xs font-semibold leading-5 text-gray-600">
                          {w.focus}
                        </span>
                      )}
                    </div>
                  )}
                  {w.mastery && (
                    <div className={editorial ? 'mt-1 text-[11px] leading-4 text-slate-400' : 'mt-1 text-xs text-gray-500'}>Mastery: {w.mastery}</div>
                  )}
                </div>
                <span
                  aria-hidden="true"
                  className={cn(
                    editorial ? 'mt-1 shrink-0 text-slate-400 transition-transform duration-300' : 'mt-1 shrink-0 text-primary-600 transition-transform duration-300 sm:mt-0',
                    isOpen ? 'rotate-180' : 'rotate-0',
                  )}
                >
                  ▼
                </span>
              </button>

              {isOpen ? (
                <div id={id} className={editorial ? 'border-t border-slate-100 px-4 pb-4 pt-3.5 sm:px-5' : 'border-t border-gray-100 px-5 pb-5 pt-4'}>
                  <div className={editorial ? 'grid gap-3 md:grid-cols-2' : 'grid gap-4 md:grid-cols-2'}>
                    {w.lessons && (
                      <div className={editorial ? 'rounded-xl border border-slate-100 bg-white p-3.5 text-sm leading-6 text-slate-700' : 'rounded-2xl border border-gray-100 bg-white p-4 text-sm text-gray-700'}>
                        <div className="font-semibold text-gray-900">Lessons in this stage</div>
                        <ul className="mt-2 list-disc space-y-0.5 pl-4">
                          {w.lessons.map((l) => (
                            <li key={l}>{l}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {w.learns && (
                      <div className={editorial ? 'rounded-xl border border-slate-100 bg-slate-50/55 p-3.5 text-sm leading-6 text-slate-700' : 'rounded-2xl border border-gray-100 bg-gray-50/70 p-4 text-sm text-gray-700'}>
                        <div className="font-semibold text-gray-900">{outcomesLabel}</div>
                        <ul className="mt-2 list-disc space-y-0.5 pl-4">
                          {w.learns.map((l) => (
                            <li key={l}>{l}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {w.activities && (
                      <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm text-gray-700">
                        <div className="font-semibold text-gray-900">Class activities</div>
                        <ul className="mt-2 list-disc pl-4">
                          {w.activities.map((a) => (
                            <li key={a}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {w.homework && (
                      <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm text-gray-700">
                        <div className="font-semibold text-gray-900">Home practice</div>
                        <ul className="mt-2 list-disc pl-4">
                          {w.homework.map((h) => (
                            <li key={h}>{h}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {Array.isArray(w.days) && w.days.length > 0 && (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => toggleDays(i)}
                        className="rounded-full border border-dashed border-gray-300 bg-white px-4 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                        aria-expanded={openDays[i]}
                      >
                        {openDays[i] ? 'Hide daily breakdown' : 'Show daily breakdown'}
                      </button>
                      {openDays[i] && (
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          {w.days.map((d, di) => (
                            <div key={di} className="rounded-2xl border border-gray-100 bg-gray-50/80 p-3 text-sm text-gray-700">
                              <div className="font-semibold text-gray-900">
                                {d.title || `Day ${typeof d.day === 'number' ? d.day : d.day || di + 1}`}
                              </div>
                              {d.learns && d.learns.length > 0 && (
                                <ul className="mt-1 list-disc pl-4 text-xs">
                                  {d.learns.map((x) => <li key={x}>{x}</li>)}
                                </ul>
                              )}
                              {d.activities && d.activities.length > 0 && (
                                <div className="mt-1 text-xs">
                                  <div className="font-medium text-gray-900">Activities</div>
                                  <ul className="list-disc pl-4 text-gray-700">
                                    {d.activities.map((x) => <li key={x}>{x}</li>)}
                                  </ul>
                                </div>
                              )}
                              {d.homework && d.homework.length > 0 && (
                                <div className="mt-1 text-xs">
                                  <div className="font-medium text-gray-900">Homework</div>
                                  <ul className="list-disc pl-4 text-gray-700">
                                    {d.homework.map((x) => <li key={x}>{x}</li>)}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};
