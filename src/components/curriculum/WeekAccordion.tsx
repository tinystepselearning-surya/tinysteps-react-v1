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
  title: string; // e.g., "Week 1: SATPIN Set 1"
  focus?: string;
  learns?: string[]; // learning outcomes
  activities?: string[];
  homework?: string[];
  mastery?: string; // mastery check / output
  days?: DayItem[]; // optional day-by-day breakdown
};

const accents = [
  { border: 'from-[#ffe4c7] via-[#fff3df] to-white', pill: 'from-[#ffb347] to-[#ff8f5c]' },
  { border: 'from-[#dff1ff] via-white to-[#eef7ff]', pill: 'from-[#59c3ff] to-[#7ddff8]' },
  { border: 'from-[#f5e8ff] via-white to-[#fef0ff]', pill: 'from-[#c084fc] to-[#a855f7]' },
  { border: 'from-[#e4fdee] via-white to-[#fdf5d8]', pill: 'from-[#34d399] to-[#a3e635]' }
];

export const WeekAccordion: React.FC<{ items: WeekItem[] } & { defaultOpenAll?: boolean }> = ({ items, defaultOpenAll = false }) => {
  const [open, setOpen] = useState(() => items.map(() => defaultOpenAll));
  const [openDays, setOpenDays] = useState(() => items.map(() => false));

  const toggle = (i: number) => setOpen((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  const expandAll = () => setOpen(items.map(() => true));
  const collapseAll = () => setOpen(items.map(() => false));
  const toggleDays = (i: number) => setOpenDays((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  return (
    <div className="space-y-4">
      <div className="mb-3 flex flex-wrap gap-3 text-sm">
        <button className="rounded-full border border-gray-200 bg-white/80 px-4 py-1.5 text-gray-700 shadow-sm" onClick={expandAll}>Expand all weeks</button>
        <button className="rounded-full border border-gray-200 bg-white/60 px-4 py-1.5 text-gray-700 shadow-sm" onClick={collapseAll}>Collapse all</button>
      </div>

      {items.map((w, i) => {
        const id = useId();
        const isOpen = open[i];
        const accent = accents[i % accents.length];

        return (
          <div key={w.title} className={`rounded-[32px] p-[1px] bg-gradient-to-r ${accent.border} shadow-card-hover`}>
            <div className="rounded-[28px] bg-white/95">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={id}
                className="flex w-full items-start gap-4 px-5 py-4 text-left"
                onClick={() => toggle(i)}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accent.pill} text-white font-semibold shadow-md`}>
                  W{i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-900">{w.title}</span>
                    {w.focus && (
                      <span className="rounded-full bg-gray-100 px-3 py-0.5 text-xs font-semibold text-gray-600">
                        {w.focus}
                      </span>
                    )}
                  </div>
                  {w.mastery && (
                    <div className="text-xs text-gray-500">Mastery: {w.mastery}</div>
                  )}
                </div>
                <span className={cn('text-primary-600 transition-transform duration-300', isOpen ? 'rotate-180' : 'rotate-0')}>▼</span>
              </button>
              <div id={id} className={cn('collapsible-body border-t border-gray-50 px-5 pb-5 pt-2', isOpen ? 'open' : '')}>
                <div className="grid gap-4 md:grid-cols-2">
                  {w.learns && (
                    <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 text-sm text-gray-700">
                      <div className="font-semibold text-gray-900">What we learn</div>
                      <ul className="mt-2 list-disc pl-4">
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
                      className="rounded-full border border-dashed border-gray-300 bg-white/80 px-4 py-1 text-xs font-semibold text-gray-700"
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
            </div>
          </div>
        );
      })}
    </div>
  );
};
