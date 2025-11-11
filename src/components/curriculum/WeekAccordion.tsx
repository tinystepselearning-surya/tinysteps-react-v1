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

export const WeekAccordion: React.FC<{ items: WeekItem[] } & { defaultOpenAll?: boolean }> = ({ items, defaultOpenAll = false }) => {
  const [open, setOpen] = useState(() => items.map(() => defaultOpenAll));
  const [openDays, setOpenDays] = useState(() => items.map(() => false));

  const toggle = (i: number) => setOpen((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  const expandAll = () => setOpen(items.map(() => true));
  const collapseAll = () => setOpen(items.map(() => false));
  const toggleDays = (i: number) => setOpenDays((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  return (
    <div className="space-y-3">
      <div className="mb-2 flex gap-3">
        <button className="rounded-full border px-3 py-1 text-sm" onClick={expandAll}>Expand All Weeks</button>
        <button className="rounded-full border px-3 py-1 text-sm" onClick={collapseAll}>Collapse All</button>
      </div>

      {items.map((w, i) => {
        const id = useId();
        const isOpen = open[i];
        return (
          <div key={w.title} className="rounded-2xl bg-white/90 backdrop-blur ring-1 ring-primary-100/60 border border-white/60 shadow-lg transition hover:-translate-y-0.5">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={id}
              className="flex w-full items-center justify-between px-5 py-4 text-left"
              onClick={() => toggle(i)}
            >
              <span className="font-medium text-gray-900">{w.title}</span>
              <span className={cn('text-primary-600 transition-transform duration-300', isOpen ? 'rotate-180' : 'rotate-0')}>▼</span>
            </button>
            <div id={id} className={cn('collapsible-body px-5 pb-4 bg-white/70 backdrop-blur rounded-b-2xl', isOpen ? 'open' : '')}>
              {w.focus && (
                <div className="mb-2 text-sm"><span className="font-semibold">FOCUS:</span> {w.focus}</div>
              )}
              {w.learns && (
                <div className="mb-2 text-sm">
                  <div className="font-semibold">What Your Child Learns:</div>
                  <ul className="list-disc pl-6">
                    {w.learns.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                </div>
              )}
              {w.activities && (
                <div className="mb-2 text-sm">
                  <div className="font-semibold">Activities:</div>
                  <ul className="list-disc pl-6">
                    {w.activities.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}
              {w.homework && (
                <div className="mb-2 text-sm">
                  <div className="font-semibold">Homework:</div>
                  <ul className="list-disc pl-6">
                    {w.homework.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}
              {w.mastery && (
                <div className="text-sm"><span className="font-semibold">Mastery Check:</span> {w.mastery}</div>
              )}

              {Array.isArray(w.days) && w.days.length > 0 && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => toggleDays(i)}
                    className="rounded-full border px-3 py-1 text-xs text-gray-700"
                    aria-expanded={openDays[i]}
                  >
                    {openDays[i] ? 'Hide daily breakdown' : 'Show daily breakdown'}
                  </button>
                  {openDays[i] && (
                    <div className="mt-2 space-y-3">
                      {w.days.map((d, di) => (
                        <div key={di} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                          <div className="text-sm font-semibold text-gray-900">
                            {d.title || `Day ${typeof d.day === 'number' ? d.day : d.day || di+1}`}
                          </div>
                          {d.learns && d.learns.length > 0 && (
                            <ul className="mt-1 list-disc pl-5 text-xs text-gray-700">
                              {d.learns.map((x) => <li key={x}>{x}</li>)}
                            </ul>
                          )}
                          {d.activities && d.activities.length > 0 && (
                            <div className="mt-1 text-xs">
                              <div className="font-medium">Activities:</div>
                              <ul className="list-disc pl-5">
                                {d.activities.map((x) => <li key={x}>{x}</li>)}
                              </ul>
                            </div>
                          )}
                          {d.homework && d.homework.length > 0 && (
                            <div className="mt-1 text-xs">
                              <div className="font-medium">Homework:</div>
                              <ul className="list-disc pl-5">
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
        );
      })}
    </div>
  );
};
